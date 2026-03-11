'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import CouponForm from '@/components/admin/CouponForm';

export default function EditCouponPage() {
  const params = useParams();
  const id = params.id as string;
  const [initialData, setInitialData] = useState<{
    code: string;
    discountType: 'percent' | 'fixed';
    discountValue: string;
    minOrderAmount: string;
    maxUses: string;
    maxUsesPerUser: string;
    expiresAt: string;
    isActive: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/coupons/${id}`);
        if (!res.ok) {
          setError('Coupon not found');
          setLoading(false);
          return;
        }
        const data = await res.json();
        setInitialData({
          code: data.code,
          discountType: data.discountType,
          discountValue:
            data.discountType === 'fixed'
              ? (data.discountValue / 100).toString()
              : data.discountValue.toString(),
          minOrderAmount: data.minOrderAmount > 0 ? (data.minOrderAmount / 100).toString() : '',
          maxUses: data.maxUses.toString(),
          maxUsesPerUser: data.maxUsesPerUser.toString(),
          expiresAt: data.expiresAt ? data.expiresAt.split('T')[0] : '',
          isActive: data.isActive,
        });
      } catch {
        setError('Failed to load coupon');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <p className="text-charcoal-500">Loading...</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div>
      <h2 className="text-lg font-semibold text-charcoal-800 mb-6">Edit Coupon</h2>
      {initialData && <CouponForm initialData={initialData} couponId={id} />}
    </div>
  );
}
