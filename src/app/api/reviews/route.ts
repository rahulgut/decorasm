import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import dbConnect from '@/lib/mongodb';
import Review from '@/lib/models/Review';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const productId = request.nextUrl.searchParams.get('productId');

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const reviews = await Review.find({ productId })
      .sort({ createdAt: -1 })
      .lean();

    // Calculate aggregate stats
    const count = reviews.length;
    const average = count > 0
      ? reviews.reduce((sum, r) => sum + (r as unknown as { rating: number }).rating, 0) / count
      : 0;

    return NextResponse.json({ reviews, average: Math.round(average * 10) / 10, count });
  } catch (error) {
    console.error('Reviews GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { productId, rating, title, body } = await request.json();

    if (!productId || typeof productId !== 'string') {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      return NextResponse.json({ error: 'Review body is required' }, { status: 400 });
    }

    await dbConnect();

    const existing = await Review.findOne({
      userId: session.user.id,
      productId,
    });

    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this product' }, { status: 409 });
    }

    const review = await Review.create({
      userId: session.user.id,
      userName: session.user.name || 'Anonymous',
      productId,
      rating,
      title: title.trim(),
      body: body.trim(),
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (error) {
    console.error('Reviews POST error:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
