'use client';

import { useState, useEffect } from 'react';
import StarRating from '../reviews/StarRating';

export default function ProductRating({ productId }: { productId: string }) {
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch(`/api/reviews?productId=${productId}`)
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data) {
          setAverage(data.average);
          setCount(data.count);
        }
      })
      .catch(() => {});
  }, [productId]);

  if (count === 0) return null;

  return <StarRating rating={average} count={count} size="sm" />;
}
