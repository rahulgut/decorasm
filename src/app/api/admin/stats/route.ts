import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import Order from '@/lib/models/Order';
import User from '@/lib/models/User';
import Coupon from '@/lib/models/Coupon';
import { requireAdmin } from '@/lib/admin';

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  await dbConnect();

  const [totalProducts, totalOrders, totalUsers, revenueResult, recentOrders, ordersByStatus, activeCoupons] =
    await Promise.all([
      Product.countDocuments(),
      Order.countDocuments(),
      User.countDocuments({ role: { $ne: 'admin' } }),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]),
      Order.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
      Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      Coupon.countDocuments({
        isActive: true,
        $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      }),
    ]);

  const totalRevenue = revenueResult[0]?.total || 0;
  const statusCounts = Object.fromEntries(
    ordersByStatus.map((s: { _id: string; count: number }) => [s._id, s.count])
  );

  return NextResponse.json({
    totalProducts,
    totalOrders,
    totalUsers,
    totalRevenue,
    activeCoupons,
    statusCounts,
    recentOrders,
  });
}
