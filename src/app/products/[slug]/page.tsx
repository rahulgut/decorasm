export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { IProduct } from '@/types';
import { formatPrice, capitalize } from '@/lib/utils';
import AddToCartButton from '@/components/products/AddToCartButton';
import Badge from '@/components/ui/Badge';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  await dbConnect();
  const product = (await Product.findOne({ slug }).lean()) as unknown as IProduct | null;

  if (!product) {
    notFound();
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-charcoal-400 mb-8 space-x-2">
        <Link href="/" className="hover:text-brand-500 transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-brand-500 transition-colors">Products</Link>
        <span>/</span>
        <Link
          href={`/products?category=${product.category}`}
          className="hover:text-brand-500 transition-colors"
        >
          {capitalize(product.category)}
        </Link>
        <span>/</span>
        <span className="text-charcoal-600">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="relative aspect-square rounded-xl overflow-hidden bg-charcoal-50">
            <Image
              src={product.images[0] || '/placeholder.jpg'}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-3">
              {product.images.slice(1).map((img, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-charcoal-50">
                  <Image
                    src={img}
                    alt={`${product.name} ${i + 2}`}
                    fill
                    className="object-cover"
                    sizes="120px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="brand">{capitalize(product.category)}</Badge>
            {product.featured && <Badge variant="success">Featured</Badge>}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-charcoal-800 mb-4">
            {product.name}
          </h1>

          <p className="text-3xl font-semibold text-brand-600 mb-6">
            {formatPrice(product.price)}
          </p>

          <p className="text-charcoal-500 leading-relaxed mb-8">
            {product.description}
          </p>

          {/* Details */}
          <div className="border-t border-charcoal-100 pt-6 mb-8 space-y-3">
            {product.dimensions && (
              <div className="flex">
                <span className="text-sm text-charcoal-400 w-28">Dimensions</span>
                <span className="text-sm text-charcoal-700">{product.dimensions}</span>
              </div>
            )}
            {product.material && (
              <div className="flex">
                <span className="text-sm text-charcoal-400 w-28">Material</span>
                <span className="text-sm text-charcoal-700">{product.material}</span>
              </div>
            )}
            <div className="flex">
              <span className="text-sm text-charcoal-400 w-28">Availability</span>
              <span className={`text-sm font-medium ${product.inStock ? 'text-green-600' : 'text-red-500'}`}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>

          {product.inStock && (
            <AddToCartButton productId={product._id} />
          )}

          {/* Shipping info */}
          <div className="mt-8 bg-cream-100 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm text-charcoal-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Free shipping on orders over $100
            </div>
            <div className="flex items-center gap-2 text-sm text-charcoal-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              30-day return policy
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
