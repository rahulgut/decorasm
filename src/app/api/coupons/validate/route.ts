import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/lib/models/Coupon';
import Cart from '@/lib/models/Cart';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { code } = await request.json();
    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Coupon code is required' }, { status: 400 });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase().trim() });
    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
    }

    if (!coupon.isActive) {
      return NextResponse.json({ error: 'This coupon is no longer active' }, { status: 400 });
    }

    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'This coupon has expired' }, { status: 400 });
    }

    if (coupon.maxUses > 0 && coupon.usageCount >= coupon.maxUses) {
      return NextResponse.json({ error: 'This coupon has reached its usage limit' }, { status: 400 });
    }

    // Determine session/user id for per-user limit check
    const session = await auth();
    const userId = session?.user?.id || null;
    let sessionId: string | undefined;
    if (userId) {
      sessionId = `user:${userId}`;
    } else {
      const cookieStore = await cookies();
      sessionId = cookieStore.get('cart_session')?.value;
    }

    if (coupon.maxUsesPerUser > 0 && sessionId) {
      const userUses = coupon.usedBy.filter((id: string) => id === sessionId).length;
      if (userUses >= coupon.maxUsesPerUser) {
        return NextResponse.json({ error: 'You have already used this coupon' }, { status: 400 });
      }
    }

    // Get cart subtotal
    if (!sessionId) {
      return NextResponse.json({ error: 'No active cart session' }, { status: 400 });
    }

    const cart = await Cart.findOne({ sessionId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const subtotal = cart.items.reduce(
      (sum: number, item: { product: { price: number }; quantity: number }) =>
        sum + item.product.price * item.quantity,
      0
    );

    if (coupon.minOrderAmount > 0 && subtotal < coupon.minOrderAmount) {
      const minFormatted = (coupon.minOrderAmount / 100).toFixed(2);
      return NextResponse.json(
        { error: `Minimum order amount of $${minFormatted} required` },
        { status: 400 }
      );
    }

    // Calculate discount
    let discountAmount: number;
    if (coupon.discountType === 'percent') {
      discountAmount = Math.round(subtotal * (coupon.discountValue / 100));
    } else {
      discountAmount = coupon.discountValue;
    }
    // Cap so total never goes below 0
    discountAmount = Math.min(discountAmount, subtotal);

    return NextResponse.json({
      valid: true,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 });
  }
}
