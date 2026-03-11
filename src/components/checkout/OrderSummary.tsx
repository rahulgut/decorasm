'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';
import { formatPrice } from '@/lib/utils';

interface OrderSummaryProps {
  onCouponApplied?: (data: { couponCode: string; discountAmount: number } | null) => void;
}

export default function OrderSummary({ onCouponApplied }: OrderSummaryProps) {
  const { items, subtotal } = useCart();
  const [couponInput, setCouponInput] = useState('');
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponError, setCouponError] = useState('');
  const [applying, setApplying] = useState(false);

  const shipping = subtotal >= 10000 ? 0 : 999;
  const total = subtotal - discountAmount + shipping;

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code) return;

    setApplying(true);
    setCouponError('');

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCouponError(data.error || 'Invalid coupon');
        setApplying(false);
        return;
      }

      setCouponCode(code.toUpperCase());
      setDiscountAmount(data.discountAmount);
      setCouponError('');
      onCouponApplied?.({ couponCode: code.toUpperCase(), discountAmount: data.discountAmount });
    } catch {
      setCouponError('Failed to validate coupon');
    } finally {
      setApplying(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode(null);
    setDiscountAmount(0);
    setCouponInput('');
    setCouponError('');
    onCouponApplied?.(null);
  };

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

      {/* Coupon Input */}
      <div className="border-t border-charcoal-100 pt-4 mb-4">
        {couponCode ? (
          <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <div>
              <span className="text-sm font-medium text-green-800">{couponCode}</span>
              <span className="text-xs text-green-600 ml-2">applied</span>
            </div>
            <button
              onClick={removeCoupon}
              className="text-xs text-red-600 hover:underline"
            >
              Remove
            </button>
          </div>
        ) : (
          <div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Coupon code"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value);
                  if (couponError) setCouponError('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    applyCoupon();
                  }
                }}
                className="flex-1 px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700"
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={applying || !couponInput.trim()}
                className="px-4 py-2 text-sm font-medium bg-charcoal-800 text-white rounded-lg hover:bg-charcoal-700 transition-colors disabled:opacity-50"
              >
                {applying ? '...' : 'Apply'}
              </button>
            </div>
            {couponError && (
              <p className="text-xs text-red-600 mt-1">{couponError}</p>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-charcoal-100 pt-4 space-y-2 text-sm">
        <div className="flex justify-between text-charcoal-500">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount ({couponCode})</span>
            <span>-{formatPrice(discountAmount)}</span>
          </div>
        )}
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
