import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Cart from '@/lib/models/Cart';
import Order from '@/lib/models/Order';

function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DEC-${timestamp}-${random}`;
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const cookieStore = await cookies();
    const sessionId = cookieStore.get('cart_session')?.value;

    if (!sessionId) {
      return NextResponse.json({ error: 'No active cart session' }, { status: 400 });
    }

    const cart = await Cart.findOne({ sessionId }).populate('items.product');

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const { shippingAddress } = await request.json();

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.email || !shippingAddress.address || !shippingAddress.city || !shippingAddress.state || !shippingAddress.zipCode) {
      return NextResponse.json({ error: 'Missing required shipping fields' }, { status: 400 });
    }

    const items = cart.items.map((item: { product: { _id: { toString(): string }; name: string; slug: string; price: number; images: string[] }; quantity: number }) => ({
      productId: item.product._id.toString(),
      name: item.product.name,
      slug: item.product.slug,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.images?.[0] || '',
    }));

    const subtotal = items.reduce(
      (sum: number, item: { price: number; quantity: number }) => sum + item.price * item.quantity,
      0
    );
    const shipping = subtotal >= 10000 ? 0 : 999;
    const total = subtotal + shipping;

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      items,
      subtotal,
      shipping,
      total,
      shippingAddress: {
        ...shippingAddress,
        country: shippingAddress.country || 'US',
      },
      status: 'confirmed',
    });

    // Clear the cart
    await Cart.deleteOne({ sessionId });

    return NextResponse.json({
      orderNumber: order.orderNumber,
      total: order.total,
    });
  } catch (error) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}
