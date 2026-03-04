import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import User from '@/lib/models/User';
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
    await Product.deleteMany({});
    const products = await Product.insertMany(seedProducts);

    // Seed admin user (upsert to avoid duplicates)
    const bcrypt = (await import('bcryptjs')).default;
    const adminPassword = await bcrypt.hash('admin123', 10);
    await User.deleteOne({ email: 'admin@decorasm.com' });
    await User.create({
      name: 'Admin',
      email: 'admin@decorasm.com',
      password: adminPassword,
      role: 'admin',
    });

    return NextResponse.json({
      message: `Seeded ${products.length} products and admin user`,
      count: products.length,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
