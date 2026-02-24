'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ICartItem } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/hooks/useCart';

interface CartItemProps {
  item: ICartItem;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const { product, quantity } = item;

  return (
    <div className="flex gap-4 py-6 border-b border-charcoal-100">
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="shrink-0">
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden bg-charcoal-50">
          <Image
            src={product.images?.[0] || '/placeholder.jpg'}
            alt={product.name}
            fill
            className="object-cover"
            sizes="128px"
          />
        </div>
      </Link>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-medium text-charcoal-800 hover:text-brand-700 transition-colors truncate">
            {product.name}
          </h3>
        </Link>
        <p className="text-sm text-charcoal-400 mt-0.5">{formatPrice(product.price)} each</p>

        {/* Quantity stepper */}
        <div className="flex items-center gap-3 mt-3">
          <div
            role="group"
            aria-label={`Quantity for ${product.name}`}
            className="flex items-center border border-charcoal-200 rounded-lg"
          >
            <button
              aria-label={`Decrease quantity of ${product.name}`}
              className="px-2.5 py-1 text-charcoal-500 hover:text-charcoal-800 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-700"
              onClick={() => updateQuantity(product._id, quantity - 1)}
            >
              <span aria-hidden="true">-</span>
            </button>
            <span
              aria-live="polite"
              aria-atomic="true"
              aria-label={`Quantity: ${quantity}`}
              className="px-3 py-1 text-sm text-charcoal-800 font-medium min-w-[2.5rem] text-center"
            >
              {quantity}
            </span>
            <button
              aria-label={`Increase quantity of ${product.name}`}
              className="px-2.5 py-1 text-charcoal-500 hover:text-charcoal-800 transition-colors text-sm focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-700"
              onClick={() => updateQuantity(product._id, quantity + 1)}
            >
              <span aria-hidden="true">+</span>
            </button>
          </div>
          <button
            onClick={() => removeItem(product._id)}
            className="text-sm text-charcoal-400 hover:text-red-500 transition-colors"
          >
            Remove
          </button>
        </div>
      </div>

      {/* Line total */}
      <div className="text-right shrink-0">
        <p className="font-semibold text-charcoal-800">
          {formatPrice(product.price * quantity)}
        </p>
      </div>
    </div>
  );
}
