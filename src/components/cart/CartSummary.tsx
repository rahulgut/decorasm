'use client';

import Link from 'next/link';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';
import Button from '../ui/Button';

export default function CartSummary() {
  const { subtotal, itemCount } = useCart();
  const shipping = subtotal >= 10000 ? 0 : 999; // Free over $100
  const total = subtotal + shipping;

  return (
    <div className="bg-white rounded-xl p-6 border border-charcoal-100 sticky top-24">
      <h2 className="text-lg font-semibold text-charcoal-800 mb-4">Order Summary</h2>

      <div className="space-y-3 text-sm">
        <div className="flex justify-between text-charcoal-500">
          <span>Subtotal ({itemCount} items)</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-charcoal-500">
          <span>Shipping</span>
          <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
        </div>
        {shipping > 0 && (
          <p className="text-xs text-brand-500">
            Add {formatPrice(10000 - subtotal)} more for free shipping
          </p>
        )}
        <div className="border-t border-charcoal-100 pt-3 flex justify-between font-semibold text-charcoal-800">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <Link href="/checkout" className="block mt-6">
        <Button className="w-full" size="lg">
          Proceed to Checkout
        </Button>
      </Link>
    </div>
  );
}
