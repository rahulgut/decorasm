'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatPrice, capitalize } from '@/lib/utils';

interface Order {
  _id: string;
  orderNumber: string;
  total: number;
  status: string;
  createdAt: string;
  items: Array<{ name: string; quantity: number }>;
  shippingAddress: { fullName: string };
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const params = new URLSearchParams({ page: page.toString() });
      if (status) params.set('status', status);

      try {
        const res = await fetch(`/api/admin/orders?${params}`);
        const data = await res.json();
        if (!cancelled) {
          setOrders(data.orders);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [page, status]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-charcoal-800">Orders ({total})</h2>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700"
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          {['pending', 'confirmed', 'shipped', 'delivered'].map((s) => (
            <option key={s} value={s}>{capitalize(s)}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-charcoal-500">Loading...</p>
      ) : orders.length === 0 ? (
        <p className="text-charcoal-500">No orders found.</p>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-lg border border-charcoal-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal-100 bg-cream-50">
                  <th className="text-left py-3 px-4 font-medium text-charcoal-500">Order</th>
                  <th className="text-left py-3 px-4 font-medium text-charcoal-500">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-charcoal-500">Items</th>
                  <th className="text-left py-3 px-4 font-medium text-charcoal-500">Total</th>
                  <th className="text-left py-3 px-4 font-medium text-charcoal-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-charcoal-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b border-charcoal-50">
                    <td className="py-3 px-4">
                      <Link href={`/admin/orders/${order._id}`} className="text-brand-700 hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-charcoal-600">{order.shippingAddress.fullName}</td>
                    <td className="py-3 px-4 text-charcoal-500">{order.items.length} item(s)</td>
                    <td className="py-3 px-4 text-charcoal-800 font-medium">{formatPrice(order.total)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-charcoal-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
