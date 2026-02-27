'use client';

import Link from 'next/link';
import { useWishlist } from '@/hooks/useWishlist';

export default function WishlistIcon() {
  const { count } = useWishlist();

  return (
    <Link
      href="/account/wishlist"
      aria-label={count > 0 ? `Wishlist, ${count} item${count === 1 ? '' : 's'}` : 'Wishlist'}
      className="relative p-2 text-charcoal-600 hover:text-red-500 transition-colors"
    >
      <svg className="w-6 h-6" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
      {count > 0 && (
        <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}
