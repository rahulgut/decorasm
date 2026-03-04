'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { formatPrice, capitalize } from '@/lib/utils';

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  category: string;
  inStock: boolean;
  featured: boolean;
  images: string[];
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString() });
      if (search) params.set('search', search);
      if (category) params.set('category', category);

      try {
        const res = await fetch(`/api/admin/products?${params}`);
        const data = await res.json();
        if (!cancelled) {
          setProducts(data.products);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [page, search, category, refreshKey]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setRefreshKey((k) => k + 1);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-charcoal-800">Products ({total})</h2>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors"
        >
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Search products..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700"
        />
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700"
          aria-label="Filter by category"
        >
          <option value="">All Categories</option>
          {['furniture', 'lighting', 'wall-art', 'textiles', 'accessories'].map((c) => (
            <option key={c} value={c}>{capitalize(c)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-charcoal-500">Loading...</p>
      ) : products.length === 0 ? (
        <p className="text-charcoal-500">No products found.</p>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg border border-charcoal-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal-100 bg-cream-50">
                  <th className="text-left py-3 px-4 font-medium text-charcoal-500">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-charcoal-500">Category</th>
                  <th className="text-left py-3 px-4 font-medium text-charcoal-500">Price</th>
                  <th className="text-left py-3 px-4 font-medium text-charcoal-500">Stock</th>
                  <th className="text-right py-3 px-4 font-medium text-charcoal-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id} className="border-b border-charcoal-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded overflow-hidden bg-charcoal-50 flex-shrink-0">
                          {product.images[0] && (
                            <Image
                              src={product.images[0]}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-charcoal-800">{product.name}</p>
                          {product.featured && (
                            <span className="text-xs text-brand-700">Featured</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-charcoal-600">{capitalize(product.category)}</td>
                    <td className="py-3 px-4 text-charcoal-800 font-medium">{formatPrice(product.price)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/admin/products/${product._id}/edit`}
                          className="text-brand-700 hover:underline text-xs"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(product._id, product.name)}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 text-sm border border-charcoal-200 rounded-lg disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-sm text-charcoal-500">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 text-sm border border-charcoal-200 rounded-lg disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
