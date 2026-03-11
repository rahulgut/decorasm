import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Coupon from '@/lib/models/Coupon';
import { requireAdmin } from '@/lib/admin';

export async function GET(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  await dbConnect();

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = 20;
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || '';

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.code = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  }
  if (status === 'active') {
    filter.isActive = true;
    filter.$or = [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }];
  } else if (status === 'expired') {
    filter.expiresAt = { $lte: new Date() };
  } else if (status === 'inactive') {
    filter.isActive = false;
  }

  const [coupons, total] = await Promise.all([
    Coupon.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Coupon.countDocuments(filter),
  ]);

  return NextResponse.json({
    coupons,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(request: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  await dbConnect();

  try {
    const body = await request.json();
    const coupon = await Coupon.create({
      code: body.code,
      discountType: body.discountType,
      discountValue: body.discountValue,
      minOrderAmount: body.minOrderAmount || 0,
      maxUses: body.maxUses || 0,
      maxUsesPerUser: body.maxUsesPerUser || 0,
      expiresAt: body.expiresAt || null,
      isActive: body.isActive !== false,
    });
    return NextResponse.json(coupon, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create coupon';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
