'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { capitalize } from '@/lib/utils';

interface ProductFormData {
  name: string;
  description: string;
  price: string;
  category: string;
  images: string;
  dimensions: string;
  material: string;
  inStock: boolean;
  featured: boolean;
}

interface ProductFormProps {
  initialData?: ProductFormData;
  productId?: string;
}

const categories = ['furniture', 'lighting', 'wall-art', 'textiles', 'accessories'];

const defaultData: ProductFormData = {
  name: '',
  description: '',
  price: '',
  category: 'furniture',
  images: '',
  dimensions: '',
  material: '',
  inStock: true,
  featured: false,
};

export default function ProductForm({ initialData, productId }: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>(initialData || defaultData);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = !!productId;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const priceInCents = Math.round(parseFloat(form.price) * 100);
    if (isNaN(priceInCents) || priceInCents <= 0) {
      setError('Price must be a positive number.');
      setSaving(false);
      return;
    }

    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      price: priceInCents,
      category: form.category,
      images: form.images
        .split('\n')
        .map((u) => u.trim())
        .filter(Boolean),
      dimensions: form.dimensions.trim(),
      material: form.material.trim(),
      inStock: form.inStock,
      featured: form.featured,
    };

    try {
      const url = isEdit ? `/api/admin/products/${productId}` : '/api/admin/products';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save product');
        setSaving(false);
        return;
      }

      router.push('/admin/products');
    } catch {
      setError('Network error');
      setSaving(false);
    }
  };

  const set = (field: keyof ProductFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div role="alert" className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="product-name" className="block text-sm font-medium text-charcoal-700 mb-1">
          Name *
        </label>
        <input
          id="product-name"
          type="text"
          required
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700"
        />
      </div>

      <div>
        <label htmlFor="product-description" className="block text-sm font-medium text-charcoal-700 mb-1">
          Description *
        </label>
        <textarea
          id="product-description"
          required
          rows={4}
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="product-price" className="block text-sm font-medium text-charcoal-700 mb-1">
            Price (USD) *
          </label>
          <input
            id="product-price"
            type="number"
            required
            min="0.01"
            step="0.01"
            value={form.price}
            onChange={(e) => set('price', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700"
          />
        </div>

        <div>
          <label htmlFor="product-category" className="block text-sm font-medium text-charcoal-700 mb-1">
            Category *
          </label>
          <select
            id="product-category"
            required
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{capitalize(c)}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="product-images" className="block text-sm font-medium text-charcoal-700 mb-1">
          Image URLs (one per line)
        </label>
        <textarea
          id="product-images"
          rows={3}
          value={form.images}
          onChange={(e) => set('images', e.target.value)}
          placeholder="https://images.unsplash.com/..."
          className="w-full px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="product-dimensions" className="block text-sm font-medium text-charcoal-700 mb-1">
            Dimensions
          </label>
          <input
            id="product-dimensions"
            type="text"
            value={form.dimensions}
            onChange={(e) => set('dimensions', e.target.value)}
            placeholder='e.g. 45cm x 45cm'
            className="w-full px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700"
          />
        </div>

        <div>
          <label htmlFor="product-material" className="block text-sm font-medium text-charcoal-700 mb-1">
            Material
          </label>
          <input
            id="product-material"
            type="text"
            value={form.material}
            onChange={(e) => set('material', e.target.value)}
            placeholder="e.g. Cotton, Wood"
            className="w-full px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.inStock}
            onChange={(e) => set('inStock', e.target.checked)}
            className="rounded border-charcoal-300 text-brand-700 focus:ring-brand-700"
          />
          <span className="text-sm text-charcoal-700">In Stock</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.featured}
            onChange={(e) => set('featured', e.target.checked)}
            className="rounded border-charcoal-300 text-brand-700 focus:ring-brand-700"
          />
          <span className="text-sm text-charcoal-700">Featured</span>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="px-6 py-2 text-sm font-medium text-charcoal-600 border border-charcoal-200 rounded-lg hover:bg-cream-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
