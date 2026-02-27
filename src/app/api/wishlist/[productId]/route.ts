import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import WishlistItem from '@/lib/models/Wishlist';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { productId } = await params;
    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    await dbConnect();
    const result = await WishlistItem.deleteOne({
      userId: session.user.id,
      productId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Item not in wishlist' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Wishlist DELETE error:', error);
    return NextResponse.json({ error: 'Failed to remove from wishlist' }, { status: 500 });
  }
}
