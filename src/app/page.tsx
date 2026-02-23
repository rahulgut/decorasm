export const dynamic = 'force-dynamic';

import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { IProduct } from '@/types';
import ProductGrid from '@/components/products/ProductGrid';
import Button from '@/components/ui/Button';
import { capitalize } from '@/lib/utils';

const categoryHighlights = [
  { name: 'furniture', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80', description: 'Statement pieces for every room' },
  { name: 'lighting', image: 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=600&q=80', description: 'Set the perfect ambiance' },
  { name: 'wall-art', image: 'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&q=80', description: 'Express your personal style' },
  { name: 'textiles', image: 'https://images.unsplash.com/photo-1600166898405-da9535204843?w=600&q=80', description: 'Comfort meets elegance' },
  { name: 'accessories', image: 'https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600&q=80', description: 'The finishing touches' },
];

export default async function HomePage() {
  await dbConnect();
  const featuredProducts = (await Product.find({ featured: true }).limit(8).lean()) as unknown as IProduct[];

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-charcoal-800 text-white overflow-hidden">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'url(https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&q=80)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Transform Your Space with Timeless Design
            </h1>
            <p className="text-lg text-charcoal-200 mb-8 leading-relaxed">
              Curated home decor that blends warmth, elegance, and craftsmanship. Every piece tells a story.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products">
                <Button size="lg">Shop Collection</Button>
              </Link>
              <Link href="/products?category=furniture">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  Explore Furniture
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Category Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl md:text-3xl font-bold text-charcoal-800 mb-8 text-center">
          Shop by Category
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {categoryHighlights.map((cat) => (
            <Link
              key={cat.name}
              href={`/products?category=${cat.name}`}
              className="group relative aspect-[3/4] rounded-xl overflow-hidden"
            >
              <div
                className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-300"
                style={{ backgroundImage: `url(${cat.image})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="text-white font-semibold text-sm">{capitalize(cat.name)}</h3>
                <p className="text-white/70 text-xs mt-0.5">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-charcoal-800">Featured Pieces</h2>
              <p className="text-charcoal-400 mt-1">Hand-picked for you</p>
            </div>
            <Link href="/products" className="text-brand-500 hover:text-brand-600 font-medium text-sm">
              View all &rarr;
            </Link>
          </div>
          <ProductGrid products={featuredProducts} />
        </section>
      )}

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-brand-500 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Free Shipping on Orders Over $100</h2>
          <p className="text-brand-100 mb-6 max-w-lg mx-auto">
            Elevate your home without worrying about delivery costs. Shop our curated collection today.
          </p>
          <Link href="/products">
            <Button variant="secondary" size="lg">Start Shopping</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
