'use client';

import { useCart } from '@/hooks/useCart';
import ShippingForm from '@/components/checkout/ShippingForm';
import OrderSummary from '@/components/checkout/OrderSummary';
import EmptyState from '@/components/ui/EmptyState';

export default function CheckoutPage() {
  const { items, loading } = useCart();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-charcoal-400">Loading...</p>
      </div>
    );
  }

  if (items.length === 0) {
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
