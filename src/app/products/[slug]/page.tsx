import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import dbConnect from '@/lib/mongodb';
import Product from '@/lib/models/Product';
import { IProduct } from '@/types';
import { formatPrice, capitalize } from '@/lib/utils';
import AddToCartButton from '@/components/products/AddToCartButton';
import WishlistButton from '@/components/products/WishlistButton';
import Badge from '@/components/ui/Badge';
import ReviewsList from '@/components/reviews/ReviewsList';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://decorasm.com';

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 3600;

export async function generateStaticParams() {
  await dbConnect();
  const products = await Product.find({}, { slug: 1, _id: 0 }).lean();
  return products.map((p: { slug: string }) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  await dbConnect();
  const product = (await Product.findOne({ slug }).lean()) as unknown as IProduct | null;

  if (!product) {
    return { title: 'Product Not Found' };
  }

  const title = `${product.name} — ${capitalize(product.category)}`;
  const description = product.description.slice(0, 155) + (product.description.length > 155 ? '…' : '');
  const productImage = product.images[0] || '/og-default.jpg';

  return {
    title,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
      url: `/products/${product.slug}`,
      images: [{ url: productImage, width: 1200, height: 1200, alt: product.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [productImage],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  await dbConnect();
  const product = (await Product.findOne({ slug }).lean()) as unknown as IProduct | null;

  if (!product) {
    notFound();
  }

  const canonicalUrl = `${SITE_URL}/products/${product.slug}`;

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images,
    sku: product.slug,
    brand: { '@type': 'Brand', name: 'Decorasm' },
    category: capitalize(product.category),
    ...(product.material && { material: product.material }),
    offers: {
      '@type': 'Offer',
      priceCurrency: 'USD',
      price: (product.price / 100).toFixed(2),
      availability: product.inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      url: canonicalUrl,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
      { '@type': 'ListItem', position: 2, name: 'Products', item: `${SITE_URL}/products` },
      { '@type': 'ListItem', position: 3, name: capitalize(product.category), item: `${SITE_URL}/products?category=${product.category}` },
      { '@type': 'ListItem', position: 4, name: product.name, item: canonicalUrl },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center text-sm text-charcoal-400 mb-8 space-x-2">
          <Link href="/" className="hover:text-brand-700 transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <Link href="/products" className="hover:text-brand-700 transition-colors">Products</Link>
          <span aria-hidden="true">/</span>
          <Link
            href={`/products?category=${product.category}`}
            className="hover:text-brand-700 transition-colors"
          >
            {capitalize(product.category)}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-charcoal-600" aria-current="page">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-xl overflow-hidden bg-charcoal-50">
              <Image
                src={product.images[0] || '/placeholder.jpg'}
                alt={`${product.name} — ${capitalize(product.category)} by Decorasm`}
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
                      alt=""
                      aria-hidden="true"
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

            <p className="text-3xl font-semibold text-brand-700 mb-6">
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
                <span role="status" className={`text-sm font-medium ${product.inStock ? 'text-green-700' : 'text-red-700'}`}>
                  {product.inStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-1">
                {product.inStock && (
                  <AddToCartButton productId={product._id.toString()} />
                )}
              </div>
              <WishlistButton
                productId={product._id.toString()}
                className="mt-2 shadow-sm border border-charcoal-100"
              />
            </div>

            {/* Shipping info */}
            <div className="mt-8 bg-cream-100 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-charcoal-600">
                <svg className="w-4 h-4" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Free shipping on orders over $100
              </div>
              <div className="flex items-center gap-2 text-sm text-charcoal-600">
                <svg className="w-4 h-4" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                30-day return policy
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16 border-t border-charcoal-100 pt-12">
          <ReviewsList productId={product._id.toString()} />
        </div>
      </div>
    </>
  );
}
