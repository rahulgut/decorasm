import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import dbConnect from '@/lib/mongodb';
import Cart from '@/lib/models/Cart';
import Order from '@/lib/models/Order';

function generateOrderNumber(): string {
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `DEC-${timestamp}-${random}`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+\d\s\-().]{7,20}$/;
const ZIP_RE   = /^\d{5}(-\d{4})?$/;

interface ShippingAddress {
  fullName: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

function validateShipping(raw: Record<string, unknown>): { data: ShippingAddress } | { error: string } {
  const { fullName, email, phone, address, city, state, zipCode } = raw;

  if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0)
    return { error: 'fullName is required' };
  if (!email || typeof email !== 'string' || !EMAIL_RE.test(email))
    return { error: 'A valid email address is required' };
  if (phone !== undefined && phone !== null && (typeof phone !== 'string' || !PHONE_RE.test(phone)))
    return { error: 'Invalid phone number format' };
  if (!address || typeof address !== 'string' || address.trim().length === 0)
    return { error: 'address is required' };
  if (!city || typeof city !== 'string' || city.trim().length === 0)
    return { error: 'city is required' };
  if (!state || typeof state !== 'string' || state.trim().length === 0)
    return { error: 'state is required' };
  if (!zipCode || typeof zipCode !== 'string' || !ZIP_RE.test(zipCode.trim()))
    return { error: 'A valid US ZIP code is required' };

  return {
    data: {
      fullName: String(fullName).trim(),
      email: String(email).trim().toLowerCase(),
      phone: phone ? String(phone).trim() : undefined,
      address: String(address).trim(),
      city: String(city).trim(),
      state: String(state).trim(),
      zipCode: String(zipCode).trim(),
      country: 'US',
    },
  };
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

    const body = await request.json();

    if (!body.shippingAddress || typeof body.shippingAddress !== 'object') {
      return NextResponse.json({ error: 'Missing shippingAddress' }, { status: 400 });
    }

    const validation = validateShipping(body.shippingAddress as Record<string, unknown>);
    if ('error' in validation) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const shippingAddress = validation.data;

    const outOfStock: string[] = [];
    const items = cart.items.map((item: {
      product: {
        _id: { toString(): string };
        name: string;
        slug: string;
        price: number;
        images: string[];
        inStock: boolean;
      };
      quantity: number;
    }) => {
      if (!item.product.inStock) {
        outOfStock.push(item.product.name);
      }
      return {
        productId: item.product._id.toString(),
        name: item.product.name,
        slug: item.product.slug,
        price: item.product.price,
        quantity: item.quantity,
        image: item.product.images?.[0] || '',
      };
    });

    if (outOfStock.length > 0) {
      return NextResponse.json(
        { error: `The following items are out of stock: ${outOfStock.join(', ')}` },
        { status: 409 }
      );
    }

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
      shippingAddress,
      status: 'confirmed',
    });

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
