import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import dbConnect from '@/lib/mongodb';
import SharedWishlist from '@/lib/models/SharedWishlist';
import WishlistItem from '@/lib/models/Wishlist';
import User from '@/lib/models/User';
import { formatPrice } from '@/lib/utils';

interface Props {
  params: Promise<{ token: string }>;
}

async function getSharedWishlist(token: string) {
  await dbConnect();

  const shared = await SharedWishlist.findOne({
    shareToken: token,
    isActive: true,
  }).lean();

  if (!shared) return null;

  const [items, user] = await Promise.all([
    WishlistItem.find({ userId: shared.userId })
      .populate('productId')
      .sort({ createdAt: -1 })
      .lean(),
    User.findById(shared.userId).select('name').lean(),
  ]);

  const validItems = items.filter(
    (item) => item.productId && typeof item.productId === 'object'
  );

  return {
    items: validItems,
    ownerName: (user?.name as string) || 'Someone',
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { token } = await params;
  const data = await getSharedWishlist(token);

  if (!data) {
    return { title: 'Wishlist Not Found' };
  }

  return {
    title: `${data.ownerName}'s Wishlist — Decorasm`,
    description: `Browse ${data.ownerName}'s curated wishlist of ${data.items.length} item${data.items.length !== 1 ? 's' : ''} on Decorasm.`,
  };
}

export default async function SharedWishlistPage({ params }: Props) {
  const { token } = await params;
  const data = await getSharedWishlist(token);

  if (!data) {
    notFound();
  }

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-display font-bold text-charcoal-800 mb-2">
        {data.ownerName}&apos;s Wishlist
      </h1>
      <p className="text-charcoal-500 mb-8">
        {data.items.length} {data.items.length === 1 ? 'item' : 'items'}
      </p>

      {data.items.length === 0 ? (
        <p className="text-charcoal-500 text-center py-12">
          This wishlist is empty.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((item) => {
            const product = item.productId as Record<string, unknown>;
            return (
              <div
                key={String(item._id)}
                className="bg-white border border-charcoal-100 rounded-lg overflow-hidden"
              >
                <Link href={`/products/${product.slug}`}>
                  <div className="relative aspect-square bg-charcoal-50">
                    <Image
                      src={
                        (Array.isArray(product.images) && (product.images[0] as string)) ||
                        '/placeholder.jpg'
                      }
                      alt={String(product.name)}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                </Link>
                <div className="p-4">
                  <Link
                    href={`/products/${product.slug}`}
                    className="font-medium text-charcoal-800 hover:text-brand-700 transition-colors line-clamp-1"
                  >
                    {String(product.name)}
                  </Link>
                  <p className="text-brand-700 font-semibold mt-1">
                    {formatPrice(product.price as number)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
