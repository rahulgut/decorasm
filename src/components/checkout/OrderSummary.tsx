'use client';

import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';

export default function OrderSummary() {
  const { items, subtotal } = useCart();
  const shipping = subtotal >= 10000 ? 0 : 999;
  const total = subtotal + shipping;

  return (
    <div className="bg-white rounded-xl p-6 border border-charcoal-100">
      <h2 className="text-lg font-semibold text-charcoal-800 mb-4">Your Order</h2>

      <div className="space-y-4 mb-6">
        {items.map((item) => (
          <div key={item.product._id} className="flex gap-3">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-charcoal-50 shrink-0">
              <Image
                src={item.product.images?.[0] || '/placeholder.jpg'}
                alt={item.product.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-charcoal-800 truncate">{item.product.name}</p>
              <p className="text-xs text-charcoal-400">Qty: {item.quantity}</p>
            </div>
            <p className="text-sm font-medium text-charcoal-800 shrink-0">
              {formatPrice(item.product.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-charcoal-100 pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-charcoal-500">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-charcoal-500">
          <span>Shipping</span>
          <span>{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
        </div>
        <div className="flex justify-between font-semibold text-charcoal-800 pt-2 border-t border-charcoal-100">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </div>
  );
}
