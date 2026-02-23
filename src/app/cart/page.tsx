'use client';

import { useCart } from '@/hooks/useCart';
import CartItem from '@/components/cart/CartItem';
import CartSummary from '@/components/cart/CartSummary';
import EmptyState from '@/components/ui/EmptyState';

export default function CartPage() {
  const { items, loading } = useCart();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-charcoal-400">Loading cart...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-charcoal-800 mb-8">Your Cart</h1>
        <EmptyState
          title="Your cart is empty"
          description="Looks like you haven't added any items yet. Start exploring our collection."
          actionLabel="Browse Products"
          actionHref="/products"
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-charcoal-800 mb-8">Your Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2">
          {items.map((item) => (
            <CartItem key={item.product._id} item={item} />
          ))}
        </div>

        {/* Summary */}
        <div>
          <CartSummary />
        </div>
      </div>
    </div>
  );
}
