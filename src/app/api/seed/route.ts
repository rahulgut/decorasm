import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
import Coupon from '@/lib/models/Coupon';
import { seedProducts } from '@/lib/seed-data';

const SEED_SECRET = process.env.SEED_SECRET || '';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (SEED_SECRET && token !== SEED_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await dbConnect();
    // Upsert products by slug so IDs stay stable across re-seeds
    // (prevents parallel test interference from ID changes)
    const seedSlugs = seedProducts.map((p) => p.slug);
    const bulkOps = seedProducts.map((p) => ({
      updateOne: {
        filter: { slug: p.slug },
        update: { $set: p },
        upsert: true,
      },
    }));
    await Product.bulkWrite(bulkOps);
    // Remove any products not in the seed data (e.g. test leftovers)
    await Product.deleteMany({ slug: { $nin: seedSlugs } });
    const products = await Product.find({});

    // Seed admin user (upsert to avoid parallel test interference)
    const bcrypt = (await import('bcryptjs')).default;
    const adminPassword = await bcrypt.hash('admin123', 10);
    await User.findOneAndUpdate(
      { email: 'admin@decorasm.com' },
      { $set: { name: 'Admin', email: 'admin@decorasm.com', password: adminPassword, role: 'admin' } },
      { upsert: true }
    );

    // Seed coupons (upsert by code)
    const seedCoupons = [
      {
        code: 'SAVE10',
        discountType: 'percent',
        discountValue: 10,
        minOrderAmount: 0,
        maxUses: 0,
        maxUsesPerUser: 0,
        isActive: true,
      },
      {
        code: 'FLAT5',
        discountType: 'fixed',
        discountValue: 500, // $5.00 in cents
        minOrderAmount: 5000, // $50.00 minimum
        maxUses: 0,
        maxUsesPerUser: 0,
        isActive: true,
      },
      {
        code: 'WELCOME20',
        discountType: 'percent',
        discountValue: 20,
        minOrderAmount: 0,
        maxUses: 0,
        maxUsesPerUser: 1,
        isActive: true,
      },
      {
        code: 'INACTIVE_SEED',
        discountType: 'percent',
        discountValue: 5,
        minOrderAmount: 0,
        maxUses: 0,
        maxUsesPerUser: 0,
        isActive: false,
      },
      {
        code: 'EXPIRED_SEED',
        discountType: 'percent',
        discountValue: 15,
        minOrderAmount: 0,
        maxUses: 0,
        maxUsesPerUser: 0,
        isActive: true,
        expiresAt: new Date('2020-01-01'),
      },
    ];

    const couponOps = seedCoupons.map((c) => ({
      updateOne: {
        filter: { code: c.code },
        update: { $set: c },
        upsert: true,
      },
    }));
    await Coupon.bulkWrite(couponOps);

    return NextResponse.json({
      message: `Seeded ${products.length} products, ${seedCoupons.length} coupons, and admin user`,
      count: products.length,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
