import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Order from '@/lib/models/Order';
import Cart from '@/lib/models/Cart';
import { stripe } from '@/lib/stripe';

/**
 * Verify and finalize an order after Stripe Checkout redirect.
 * Called from the confirmation page to ensure payment is confirmed
 * even if the webhook hasn't fired yet.
 */
export async function GET(request: NextRequest) {
  const orderNumber = request.nextUrl.searchParams.get('order');
  if (!orderNumber) {
    return NextResponse.json({ error: 'Missing order number' }, { status: 400 });
  }

  await dbConnect();

  const order = await Order.findOne({ orderNumber });
  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  // If already paid, return immediately
  if (order.paymentStatus === 'paid') {
    return NextResponse.json({ status: order.status, paymentStatus: order.paymentStatus });
  }

  // Check with Stripe if payment succeeded
  if (order.stripeSessionId) {
    try {
      const session = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
      if (session.payment_status === 'paid') {
        order.status = 'confirmed';
        order.paymentStatus = 'paid';
        await order.save();

        // Clear cart
        const sessionId = session.metadata?.sessionId;
        if (sessionId) {
          await Cart.deleteOne({ sessionId });
        }
      }
    } catch {
      // Stripe lookup failed — rely on webhook
    }
  }

  return NextResponse.json({ status: order.status, paymentStatus: order.paymentStatus });
}
