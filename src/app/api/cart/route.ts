import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import Cart from '@/lib/models/Cart';
import Product from '@/lib/models/Product';

function isValidObjectId(s: string): boolean {
  return mongoose.Types.ObjectId.isValid(s) && /^[a-f\d]{24}$/i.test(s);
}

function isValidQuantity(q: unknown): q is number {
  return typeof q === 'number' && Number.isInteger(q) && q >= 1 && q <= 100;
}

async function getSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get('cart_session')?.value;
  if (!sessionId) {
    sessionId = uuidv4();
  }
  return sessionId;
}

function setSessionCookie(response: NextResponse, sessionId: string): NextResponse {
  response.cookies.set('cart_session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30,
    path: '/',
  });
  return response;
}

export async function GET() {
  try {
    await dbConnect();
    const sessionId = await getSessionId();
    const cart = await Cart.findOne({ sessionId }).populate('items.product').lean();
    const response = NextResponse.json({ items: cart?.items || [] });
    return setSessionCookie(response, sessionId);
  } catch (error) {
    console.error('Cart GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const sessionId = await getSessionId();
    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId || !isValidObjectId(String(productId))) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    if (!isValidQuantity(quantity)) {
      return NextResponse.json({ error: 'Quantity must be an integer between 1 and 100' }, { status: 400 });
    }

    const product = await Product.findById(productId).lean();
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    let cart = await Cart.findOne({ sessionId });
    if (!cart) {
      cart = new Cart({ sessionId, items: [] });
    }

    const existingItem = cart.items.find(
      (item: { product: { toString(): string }; quantity: number }) =>
        item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity = Math.min(existingItem.quantity + quantity, 100);
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    const populated = await Cart.findById(cart._id).populate('items.product').lean();
    const response = NextResponse.json({ items: populated?.items || [] });
    return setSessionCookie(response, sessionId);
  } catch (error) {
    console.error('Cart POST error:', error);
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    const sessionId = await getSessionId();
    const body = await request.json();
    const { productId, quantity } = body;

    if (!productId || !isValidObjectId(String(productId))) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    if (quantity !== 0 && !isValidQuantity(quantity)) {
      return NextResponse.json({ error: 'Quantity must be an integer between 1 and 100' }, { status: 400 });
    }

    const cart = await Cart.findOne({ sessionId });
    if (!cart) {
      return NextResponse.json({ error: 'Cart not found' }, { status: 404 });
    }

    const item = cart.items.find(
      (item: { product: { toString(): string }; quantity: number }) =>
        item.product.toString() === productId
    );

    if (item) {
      if (quantity <= 0) {
        cart.items = cart.items.filter(
          (i: { product: { toString(): string } }) =>
            i.product.toString() !== productId
        );
      } else {
        item.quantity = quantity;
      }
      await cart.save();
    }

    const populated = await Cart.findById(cart._id).populate('items.product').lean();
    const response = NextResponse.json({ items: populated?.items || [] });
    return setSessionCookie(response, sessionId);
  } catch (error) {
    console.error('Cart PUT error:', error);
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await dbConnect();
    const sessionId = await getSessionId();
    const { searchParams } = request.nextUrl;

    if (searchParams.get('clear') === 'true') {
      await Cart.deleteOne({ sessionId });
      const response = NextResponse.json({ items: [] });
      return setSessionCookie(response, sessionId);
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId || !isValidObjectId(String(productId))) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const cart = await Cart.findOne({ sessionId });

    if (cart) {
      cart.items = cart.items.filter(
        (i: { product: { toString(): string } }) =>
          i.product.toString() !== productId
      );
      await cart.save();
    }

    const populated = cart
      ? await Cart.findById(cart._id).populate('items.product').lean()
      : null;
    const response = NextResponse.json({ items: populated?.items || [] });
    return setSessionCookie(response, sessionId);
  } catch (error) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete from cart' }, { status: 500 });
  }
}
