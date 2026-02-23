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
    <div className="flex items-center gap-4">
      <div className="flex items-center border border-charcoal-200 rounded-lg">
        <button
          className="px-3 py-2 text-charcoal-500 hover:text-charcoal-800 transition-colors"
          onClick={() => setQuantity((q) => Math.max(1, q - 1))}
        >
          -
        </button>
        <span className="px-4 py-2 text-charcoal-800 font-medium min-w-[3rem] text-center">
          {quantity}
        </span>
        <button
          className="px-3 py-2 text-charcoal-500 hover:text-charcoal-800 transition-colors"
          onClick={() => setQuantity((q) => q + 1)}
        >
          +
        </button>
      </div>
      <Button onClick={handleAdd} disabled={adding} size="lg" className="flex-1">
        {adding ? 'Adding...' : added ? 'Added!' : 'Add to Cart'}
      </Button>
    </div>
  );
}
