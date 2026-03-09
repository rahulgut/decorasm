'use client';

import { useSearchParams } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import ShippingForm from '@/components/checkout/ShippingForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import EmptyState from '@/components/ui/EmptyState';

export default function CheckoutPage() {
  const { items, loading } = useCart();
  const searchParams = useSearchParams();
  const cancelled = searchParams.get('cancelled');

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-charcoal-400">Loading...</p>
      </div>
    );
  }

  if (items.length === 0 && !cancelled) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-charcoal-800 mb-8">Checkout</h1>
        <EmptyState
          title="Nothing to checkout"
          description="Your cart is empty. Add some items before proceeding to checkout."
          actionLabel="Browse Products"
          actionHref="/products"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-charcoal-800 mb-8">Checkout</h1>

      {cancelled && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          Payment was cancelled. You can try again below.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ShippingForm />
        </div>
        <div>
          <OrderSummary />
        </div>
      </div>
    </div>
  );
}
