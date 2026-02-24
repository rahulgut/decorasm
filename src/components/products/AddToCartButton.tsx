'use client';

import { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import Button from '../ui/Button';

interface AddToCartButtonProps {
  productId: string;
}

export default function AddToCartButton({ productId }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = async () => {
    setAdding(true);
    await addItem(productId, quantity);
    setAdding(false);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div>
      <span role="status" aria-live="polite" className="sr-only">
        {added ? `${quantity} item${quantity === 1 ? '' : 's'} added to cart` : ''}
      </span>
      <div className="flex items-center gap-4">
        <div
          role="group"
          aria-label="Quantity"
          className="flex items-center border border-charcoal-200 rounded-lg"
        >
          <button
            aria-label="Decrease quantity"
            className="px-3 py-2 text-charcoal-500 hover:text-charcoal-800 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-700"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <span aria-hidden="true">-</span>
          </button>
          <span
            aria-live="polite"
            aria-atomic="true"
            aria-label={`Quantity: ${quantity}`}
            className="px-4 py-2 text-charcoal-800 font-medium min-w-[3rem] text-center"
          >
            {quantity}
          </span>
          <button
            aria-label="Increase quantity"
            className="px-3 py-2 text-charcoal-500 hover:text-charcoal-800 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-700"
            onClick={() => setQuantity((q) => q + 1)}
          >
            <span aria-hidden="true">+</span>
          </button>
        </div>
        <Button
          onClick={handleAdd}
          disabled={adding}
          size="lg"
          className="flex-1"
          aria-label={adding ? 'Adding to cart' : added ? 'Added to cart' : 'Add to cart'}
        >
          {adding ? 'Adding...' : added ? 'Added!' : 'Add to Cart'}
        </Button>
      </div>
    </div>
  );
}
