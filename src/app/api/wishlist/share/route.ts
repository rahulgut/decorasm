import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import SharedWishlist from '@/lib/models/SharedWishlist';
import { generateShareToken } from '@/lib/utils';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await dbConnect();
    const shared = await SharedWishlist.findOne({
      userId: session.user.id,
      isActive: true,
    }).lean();

    if (!shared) {
      return NextResponse.json({ isShared: false });
    }

    return NextResponse.json({
      isShared: true,
      shareToken: shared.shareToken,
      shareUrl: `/wishlist/${shared.shareToken}`,
    });
  } catch (error) {
    console.error('Share GET error:', error);
    return NextResponse.json({ error: 'Failed to check share status' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await dbConnect();
    const token = generateShareToken();

    await SharedWishlist.findOneAndUpdate(
      { userId: session.user.id },
      { shareToken: token, isActive: true },
      { upsert: true, new: true }
    );

    return NextResponse.json({
      shareToken: token,
      shareUrl: `/wishlist/${token}`,
    });
  } catch (error) {
    console.error('Share POST error:', error);
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await dbConnect();
    await SharedWishlist.findOneAndUpdate(
      { userId: session.user.id },
      { isActive: false }
    );

    return NextResponse.json({ message: 'Sharing disabled' });
  } catch (error) {
    console.error('Share DELETE error:', error);
    return NextResponse.json({ error: 'Failed to disable sharing' }, { status: 500 });
  }
}
