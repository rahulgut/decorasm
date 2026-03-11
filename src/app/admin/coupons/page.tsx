'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

interface Coupon {
  _id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minOrderAmount: number;
  maxUses: number;
  usageCount: number;
  expiresAt: string | null;
  isActive: boolean;
}

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString() });
      if (search) params.set('search', search);
      if (status) params.set('status', status);

      try {
        const res = await fetch(`/api/admin/coupons?${params}`);
        const data = await res.json();
        if (!cancelled) {
          setCoupons(data.coupons);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [page, search, status, refreshKey]);

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Delete coupon "${code}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setRefreshKey((k) => k + 1);
    }
  };

  const formatValue = (coupon: Coupon) => {
    if (coupon.discountType === 'percent') return `${coupon.discountValue}%`;
    return formatPrice(coupon.discountValue);
  };

  const getStatus = (coupon: Coupon) => {
    if (!coupon.isActive) return { label: 'Inactive', className: 'bg-charcoal-100 text-charcoal-600' };
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date())
      return { label: 'Expired', className: 'bg-red-100 text-red-800' };
    return { label: 'Active', className: 'bg-green-100 text-green-800' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-charcoal-800">Coupons ({total})</h2>
        <Link
          href="/admin/coupons/new"
          className="px-4 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors"
        >
          Add Coupon
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="search"
          placeholder="Search by code..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {loading ? (
        <p className="text-charcoal-500">Loading...</p>
      ) : coupons.length === 0 ? (
        <p className="text-charcoal-500">No coupons found.</p>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg border border-charcoal-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal-100 bg-cream-50">
                  <th className="text-left py-3 px-4 font-medium text-charcoal-500">Code</th>
                  <th className="text-left py-3 px-4 font-medium text-charcoal-500">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-charcoal-500">Value</th>
                  <th className="text-left py-3 px-4 font-medium text-charcoal-500">Min Order</th>
                  <th className="text-left py-3 px-4 font-medium text-charcoal-500">Uses</th>
                  <th className="text-left py-3 px-4 font-medium text-charcoal-500">Expires</th>
                  <th className="text-left py-3 px-4 font-medium text-charcoal-500">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-charcoal-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => {
                  const statusInfo = getStatus(coupon);
                  return (
                    <tr key={coupon._id} className="border-b border-charcoal-50">
                      <td className="py-3 px-4 font-mono font-medium text-charcoal-800">{coupon.code}</td>
                      <td className="py-3 px-4 text-charcoal-600 capitalize">{coupon.discountType}</td>
                      <td className="py-3 px-4 text-charcoal-800 font-medium">{formatValue(coupon)}</td>
                      <td className="py-3 px-4 text-charcoal-600">
                        {coupon.minOrderAmount > 0 ? formatPrice(coupon.minOrderAmount) : '--'}
                      </td>
                      <td className="py-3 px-4 text-charcoal-600">
                        {coupon.usageCount}/{coupon.maxUses === 0 ? '∞' : coupon.maxUses}
                      </td>
                      <td className="py-3 px-4 text-charcoal-600">
                        {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString() : '--'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/coupons/${coupon._id}/edit`}
                            className="text-brand-700 hover:underline text-xs"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(coupon._id, coupon.code)}
                            className="text-red-600 hover:underline text-xs"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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
