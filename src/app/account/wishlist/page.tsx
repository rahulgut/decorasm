'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { IWishlistItem } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';
import ShareWishlistButton from '@/components/wishlist/ShareWishlistButton';

export default function WishlistPage() {
  const { data: session } = useSession();
  const { toggle } = useWishlist();
  const { addItem } = useCart();
  const [items, setItems] = useState<IWishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  useEffect(() => {
    async function loadWishlist() {
      try {
        const res = await fetch('/api/wishlist');
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    if (session?.user) loadWishlist();
  }, [session]);

  const handleRemove = async (productId: string) => {
    // Remove from local state immediately
    setItems((prev) => prev.filter((item) => {
      const id = typeof item.productId === 'object' ? String(item.productId._id) : String(item.productId);
      return id !== productId;
    }));

    // Call DELETE API and sync provider state
    try {
      await fetch(`/api/wishlist/${productId}`, { method: 'DELETE' });
    } catch {
      // silently fail — item already removed from UI
    }
    // Sync the provider's wishlistedIds
    toggle(productId);
  };

  const handleAddToCart = async (productId: string) => {
    setAddingToCart(productId);
    try {
      await addItem(productId);
    } finally {
      setAddingToCart(null);
    }
  };

  if (loading) {
    return <p className="text-charcoal-400">Loading wishlist...</p>;
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-charcoal-500 mb-4">Your wishlist is empty.</p>
        <Link
          href="/products"
          className="text-brand-700 hover:text-brand-800 font-medium"
        >
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-charcoal-800">
          Wishlist ({items.length} {items.length === 1 ? 'item' : 'items'})
        </h2>
        <ShareWishlistButton itemCount={items.length} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item) => {
          const product = item.productId;
          if (!product || typeof product !== 'object') return null;

          return (
            <div
              key={item._id}
              className="bg-white border border-charcoal-100 rounded-lg overflow-hidden"
            >
              <Link href={`/products/${product.slug}`}>
                <div className="relative aspect-square bg-charcoal-50">
                  <Image
                    src={product.images?.[0] || '/placeholder.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              </Link>
              <div className="p-4 space-y-3">
                <div>
                  <Link
                    href={`/products/${product.slug}`}
                    className="font-medium text-charcoal-800 hover:text-brand-700 transition-colors line-clamp-1"
                  >
                    {product.name}
                  </Link>
                  <p className="text-brand-700 font-semibold mt-1">
                    {formatPrice(product.price)}
                  </p>
                </div>
                <div className="flex gap-2">
                  {product.inStock ? (
                    <button
                      onClick={() => handleAddToCart(product._id)}
                      disabled={addingToCart === product._id}
                      className="flex-1 bg-brand-700 text-white text-sm font-medium py-2 px-3 rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-50"
                    >
                      {addingToCart === product._id ? 'Adding...' : 'Add to Cart'}
                    </button>
                  ) : (
                    <span className="flex-1 text-center text-sm text-red-600 py-2">
                      Out of Stock
                    </span>
                  )}
                  <button
                    onClick={() => handleRemove(product._id)}
                    aria-label={`Remove ${product.name} from wishlist`}
                    className="p-2 text-charcoal-400 hover:text-red-500 transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
