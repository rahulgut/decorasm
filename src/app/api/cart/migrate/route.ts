import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Cart from '@/lib/models/Cart';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    await dbConnect();

    const cookieStore = await cookies();
    const guestSessionId = cookieStore.get('cart_session')?.value;
    const userSessionId = `user:${session.user.id}`;

    if (!guestSessionId || guestSessionId === userSessionId) {
      return NextResponse.json({ migrated: false });
    }

    const guestCart = await Cart.findOne({ sessionId: guestSessionId });
    const userCart = await Cart.findOne({ sessionId: userSessionId });

    if (!guestCart || guestCart.items.length === 0) {
      return NextResponse.json({ migrated: false });
    }

    if (!userCart) {
      // No user cart exists — reassign the guest cart
      guestCart.sessionId = userSessionId;
      await guestCart.save();
    } else {
      // Merge: add guest items that aren't already in the user cart
      const userProductIds = new Set(
        userCart.items.map((i: { product: { toString(): string } }) =>
          i.product.toString()
        )
      );

      for (const guestItem of guestCart.items) {
        const pid = (guestItem as { product: { toString(): string }; quantity: number }).product.toString();
        if (!userProductIds.has(pid)) {
          userCart.items.push(guestItem);
        }
      }

      await userCart.save();
      await Cart.deleteOne({ sessionId: guestSessionId });
    }

    return NextResponse.json({ migrated: true });
  } catch (error) {
    console.error('Cart migration error:', error);
    return NextResponse.json({ error: 'Failed to migrate cart' }, { status: 500 });
  }
}
