import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import WishlistItem from '@/lib/models/Wishlist';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await dbConnect();
    const items = await WishlistItem.find({ userId: session.user.id })
      .populate('productId')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Wishlist GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { productId } = await request.json();
    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    await dbConnect();

    const existing = await WishlistItem.findOne({
      userId: session.user.id,
      productId,
    });

    if (existing) {
      return NextResponse.json({ message: 'Already in wishlist' }, { status: 200 });
    }

    await WishlistItem.create({
      userId: session.user.id,
      productId,
    });

    return NextResponse.json({ message: 'Added to wishlist' }, { status: 201 });
  } catch (error) {
    console.error('Wishlist POST error:', error);
    return NextResponse.json({ error: 'Failed to add to wishlist' }, { status: 500 });
  }
}
