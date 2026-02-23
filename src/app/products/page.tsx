export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { IProduct } from '@/types';
import ProductGrid from '@/components/products/ProductGrid';
import CategoryPills from '@/components/products/CategoryPills';
import SearchBar from '@/components/products/SearchBar';

interface ProductsPageProps {
  searchParams: Promise<{ search?: string; category?: string; sort?: string }>;
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;
  await dbConnect();

  const filter: Record<string, unknown> = {};
  if (params.search) {
    filter.name = { $regex: params.search, $options: 'i' };
  }
  if (params.category) {
    filter.category = params.category;
  }

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    'price-asc': { price: 1 },
    'price-desc': { price: -1 },
    newest: { createdAt: -1 },
    name: { name: 1 },
  };
  const sortOption = sortMap[params.sort || ''] || { createdAt: -1 };

  const products = (await Product.find(filter).sort(sortOption).lean()) as unknown as IProduct[];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-charcoal-800 mb-2">Our Collection</h1>
        <p className="text-charcoal-400">Discover pieces that transform your space</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <Suspense>
          <CategoryPills active={params.category} />
        </Suspense>
        <Suspense>
          <SearchBar />
        </Suspense>
      </div>

      <ProductGrid products={products} />
    </div>
  );
}
