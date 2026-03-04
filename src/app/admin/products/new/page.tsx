'use client';

import ProductForm from '@/components/admin/ProductForm';

export default function NewProductPage() {
  return (
    <div>
      <h2 className="text-lg font-semibold text-charcoal-800 mb-6">Add New Product</h2>
      <ProductForm />
    </div>
  );
}
