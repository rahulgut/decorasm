'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { IOrder } from '@/types';
import { formatPrice } from '@/lib/utils';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
};

export default function OrderHistoryPage() {
  const { data: session } = useSession();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch('/api/orders/history');
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    }
    if (session?.user) loadOrders();
  }, [session]);

  if (loading) {
    return <p className="text-charcoal-400">Loading orders...</p>;
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-charcoal-500 mb-4">You haven&apos;t placed any orders yet.</p>
        <Link
          href="/products"
          className="text-brand-700 hover:text-brand-800 font-medium"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-charcoal-800">Order History</h2>
      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order._id}
            className="bg-white border border-charcoal-100 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
          >
            <div>
              <p className="font-medium text-charcoal-800">{order.orderNumber}</p>
              <p className="text-sm text-charcoal-500">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-sm text-charcoal-500">
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-lg font-semibold text-charcoal-800">
                {formatPrice(order.total)}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                  statusColors[order.status] || 'bg-charcoal-100 text-charcoal-700'
                }`}
              >
                {order.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
