import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/lib/models/Coupon';
import { requireAdmin } from '@/lib/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  await dbConnect();
  const { id } = await params;
  const coupon = await Coupon.findById(id).lean();
  if (!coupon) {
    return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
  }
  return NextResponse.json(coupon);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  await dbConnect();
  const { id } = await params;

  try {
    const body = await request.json();
    const coupon = await Coupon.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
    }
    return NextResponse.json(coupon);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update coupon';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAdmin();
  if (error) return error;

  await dbConnect();
  const { id } = await params;
  const coupon = await Coupon.findByIdAndDelete(id);
  if (!coupon) {
    return NextResponse.json({ error: 'Coupon not found' }, { status: 404 });
  }
  return NextResponse.json({ message: 'Coupon deleted' });
}
