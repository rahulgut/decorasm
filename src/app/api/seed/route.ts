import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { seedProducts } from '@/lib/seed-data';

export async function POST() {
  try {
    await dbConnect();
    await Product.deleteMany({});
    const products = await Product.insertMany(seedProducts);
    return NextResponse.json({
      message: `Seeded ${products.length} products`,
      count: products.length,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ error: 'Failed to seed database' }, { status: 500 });
  }
}
