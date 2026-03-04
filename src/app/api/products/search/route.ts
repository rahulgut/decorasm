import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { sanitizeRegex } from '@/lib/utils';

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get('q')?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    await dbConnect();

    const regex = new RegExp(sanitizeRegex(q), 'i');

    const products = await Product.find(
      { $or: [{ name: regex }, { description: regex }] },
      { name: 1, slug: 1, category: 1, price: 1, images: 1 }
    )
      .sort({ featured: -1, name: 1 })
      .limit(8)
      .lean();

    return NextResponse.json({ suggestions: products });
  } catch (error) {
    console.error('Search suggestions error:', error);
    return NextResponse.json({ suggestions: [] });
  }
}
