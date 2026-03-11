'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatPrice } from '@/lib/utils';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  activeCoupons: number;
  statusCounts: Record<string, number>;
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    total: number;
    status: string;
    createdAt: string;
    shippingAddress: { fullName: string };
  }>;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-charcoal-500">Loading dashboard...</div>;
  }

  if (!stats) {
    return <div className="text-red-600">Failed to load dashboard data.</div>;
  }

  return (
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Total Products" value={stats.totalProducts.toString()} />
        <StatCard label="Total Orders" value={stats.totalOrders.toString()} />
        <StatCard label="Customers" value={stats.totalUsers.toString()} />
        <StatCard label="Revenue" value={formatPrice(stats.totalRevenue)} />
        <StatCard label="Active Coupons" value={stats.activeCoupons.toString()} />
      </div>

      {/* Order Status Breakdown */}
      <div className="bg-white rounded-lg border border-charcoal-100 p-6">
        <h2 className="text-lg font-semibold text-charcoal-800 mb-4">Orders by Status</h2>
        <div className="flex flex-wrap gap-4">
          {['pending', 'confirmed', 'shipped', 'delivered'].map((status) => (
            <div key={status} className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status]}`}>
                {status}
              </span>
              <span className="text-sm text-charcoal-600">{stats.statusCounts[status] || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg border border-charcoal-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-charcoal-800">Recent Orders</h2>
          <Link href="/admin/orders" className="text-sm text-brand-700 hover:underline">
            View all
          </Link>
        </div>
        {stats.recentOrders.length === 0 ? (
          <p className="text-charcoal-500 text-sm">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-charcoal-100">
                  <th className="text-left py-2 font-medium text-charcoal-500">Order</th>
                  <th className="text-left py-2 font-medium text-charcoal-500">Customer</th>
                  <th className="text-left py-2 font-medium text-charcoal-500">Total</th>
                  <th className="text-left py-2 font-medium text-charcoal-500">Status</th>
                  <th className="text-left py-2 font-medium text-charcoal-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order._id} className="border-b border-charcoal-50">
                    <td className="py-2">
                      <Link href={`/admin/orders/${order._id}`} className="text-brand-700 hover:underline">
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="py-2 text-charcoal-600">{order.shippingAddress.fullName}</td>
                    <td className="py-2 text-charcoal-800 font-medium">{formatPrice(order.total)}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-2 text-charcoal-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-charcoal-100 p-6">
      <p className="text-sm text-charcoal-500">{label}</p>
      <p className="text-2xl font-bold text-charcoal-800 mt-1">{value}</p>
    </div>
  );
}
