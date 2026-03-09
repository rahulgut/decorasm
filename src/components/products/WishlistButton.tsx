'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useWishlist } from '@/hooks/useWishlist';

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export default function WishlistButton({ productId, className = '' }: WishlistButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const { isWishlisted, toggle } = useWishlist();
  const active = isWishlisted(productId);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      router.push('/login');
      return;
    }

    await toggle(productId);
  };

  return (
    <button
      onClick={handleClick}
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
      className={`p-2 rounded-full transition-colors ${
        active
          ? 'bg-red-50 text-red-500 hover:bg-red-100'
          : 'bg-white/80 text-charcoal-400 hover:text-red-500 hover:bg-white'
      } ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={active ? 0 : 2}
        className="w-5 h-5"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}
