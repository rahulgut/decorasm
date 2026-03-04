'use client';

import { useEffect, useState, use } from 'react';
import ProductForm from '@/components/admin/ProductForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: Props) {
  const { id } = use(params);
  const [initialData, setInitialData] = useState<null | {
    name: string;
    description: string;
    price: string;
    category: string;
    images: string;
    dimensions: string;
    material: string;
    inStock: boolean;
    featured: boolean;
  }>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/admin/products/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Product not found');
        const product = await res.json();
        setInitialData({
          name: product.name,
          description: product.description,
          price: (product.price / 100).toFixed(2),
          category: product.category,
          images: (product.images || []).join('\n'),
          dimensions: product.dimensions || '',
          material: product.material || '',
          inStock: product.inStock,
          featured: product.featured,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="text-charcoal-500">Loading product...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h2 className="text-lg font-semibold text-charcoal-800 mb-6">Edit Product</h2>
      {initialData && <ProductForm initialData={initialData} productId={id} />}
    </div>
  );
}
