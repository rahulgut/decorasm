import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import SharedWishlist from '@/lib/models/SharedWishlist';
import WishlistItem from '@/lib/models/Wishlist';
import User from '@/lib/models/User';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    await dbConnect();

    const shared = await SharedWishlist.findOne({
      shareToken: token,
      isActive: true,
    }).lean();

    if (!shared) {
      return NextResponse.json({ error: 'Wishlist not found' }, { status: 404 });
    }

    const [items, user] = await Promise.all([
      WishlistItem.find({ userId: shared.userId })
        .populate('productId')
        .sort({ createdAt: -1 })
        .lean(),
      User.findById(shared.userId).select('name').lean(),
    ]);

    const validItems = items.filter(
      (item) => item.productId && typeof item.productId === 'object'
    );

    return NextResponse.json({
      items: validItems,
      ownerName: user?.name || 'Someone',
    });
  } catch (error) {
    console.error('Shared wishlist GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch wishlist' }, { status: 500 });
  }
}
