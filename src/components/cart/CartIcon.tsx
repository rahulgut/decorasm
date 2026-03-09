'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/useCart';

export default function CartIcon() {
  const { itemCount } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={itemCount > 0 ? `Shopping cart, ${itemCount} item${itemCount === 1 ? '' : 's'}` : 'Shopping cart'}
      className="relative p-2.5 text-charcoal-600 hover:text-brand-700 transition-colors"
    >
      <svg className="w-6 h-6" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      {itemCount > 0 && (
        <span aria-hidden="true" className="absolute -top-0.5 -right-0.5 bg-brand-700 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
