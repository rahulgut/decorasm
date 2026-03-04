'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { formatPrice, capitalize } from '@/lib/utils';

interface OrderItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
};

const statuses = ['pending', 'confirmed', 'shipped', 'delivered'];

interface Props {
  params: Promise<{ id: string }>;
}

export default function AdminOrderDetail({ params }: Props) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => r.json())
      .then(setOrder)
      .finally(() => setLoading(false));
  }, [id]);

  const updateStatus = async (newStatus: string) => {
    setUpdating(true);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOrder(updated);
    }
    setUpdating(false);
  };

  if (loading) return <p className="text-charcoal-500">Loading order...</p>;
  if (!order) return <p className="text-red-600">Order not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/orders" className="text-sm text-charcoal-500 hover:text-brand-700">&larr; Back to Orders</Link>
          <h2 className="text-lg font-semibold text-charcoal-800 mt-1">Order {order.orderNumber}</h2>
          <p className="text-sm text-charcoal-500">
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
          {capitalize(order.status)}
        </span>
      </div>

      {/* Status Update */}
      <div className="bg-white rounded-lg border border-charcoal-100 p-6">
        <h3 className="text-sm font-semibold text-charcoal-700 mb-3">Update Status</h3>
        <div className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={updating || order.status === s}
              className={`px-4 py-1.5 text-sm rounded-lg border transition-colors disabled:opacity-50 ${
                order.status === s
                  ? 'bg-brand-700 text-white border-brand-700'
                  : 'border-charcoal-200 text-charcoal-600 hover:bg-cream-50'
              }`}
            >
              {capitalize(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg border border-charcoal-100 p-6">
        <h3 className="text-sm font-semibold text-charcoal-700 mb-3">Items</h3>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-charcoal-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-charcoal-800">{item.name}</p>
                <p className="text-xs text-charcoal-500">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-medium text-charcoal-800">{formatPrice(item.price * item.quantity)}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-3 border-t border-charcoal-100 space-y-1 text-sm">
          <div className="flex justify-between text-charcoal-500">
            <span>Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-charcoal-500">
            <span>Shipping</span>
            <span>{order.shipping === 0 ? 'Free' : formatPrice(order.shipping)}</span>
          </div>
          <div className="flex justify-between font-semibold text-charcoal-800">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="bg-white rounded-lg border border-charcoal-100 p-6">
        <h3 className="text-sm font-semibold text-charcoal-700 mb-3">Shipping Address</h3>
        <div className="text-sm text-charcoal-600 space-y-1">
          <p className="font-medium text-charcoal-800">{order.shippingAddress.fullName}</p>
          <p>{order.shippingAddress.address}</p>
          <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}</p>
          <p>{order.shippingAddress.country}</p>
          <p className="mt-2">{order.shippingAddress.email}</p>
          <p>{order.shippingAddress.phone}</p>
        </div>
      </div>
    </div>
  );
}
