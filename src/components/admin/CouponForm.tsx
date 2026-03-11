'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

interface CouponFormData {
  code: string;
  discountType: 'percent' | 'fixed';
  discountValue: string;
  minOrderAmount: string;
  maxUses: string;
  maxUsesPerUser: string;
  expiresAt: string;
  isActive: boolean;
}

interface CouponFormProps {
  initialData?: CouponFormData;
  couponId?: string;
}

const defaultData: CouponFormData = {
  code: '',
  discountType: 'percent',
  discountValue: '',
  minOrderAmount: '',
  maxUses: '0',
  maxUsesPerUser: '0',
  expiresAt: '',
  isActive: true,
};

export default function CouponForm({ initialData, couponId }: CouponFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<CouponFormData>(initialData || defaultData);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isEdit = !!couponId;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const discountValue = parseFloat(form.discountValue);
    if (isNaN(discountValue) || discountValue <= 0) {
      setError('Discount value must be a positive number.');
      setSaving(false);
      return;
    }

    if (!form.code.trim()) {
      setError('Coupon code is required.');
      setSaving(false);
      return;
    }

    // Convert minOrderAmount from dollars to cents
    const minOrderDollars = parseFloat(form.minOrderAmount || '0');
    const minOrderAmount = Math.round(minOrderDollars * 100);

    // For fixed type, convert dollars to cents
    const computedDiscountValue =
      form.discountType === 'fixed' ? Math.round(discountValue * 100) : discountValue;

    const body = {
      code: form.code.trim().toUpperCase(),
      discountType: form.discountType,
      discountValue: computedDiscountValue,
      minOrderAmount,
      maxUses: parseInt(form.maxUses) || 0,
      maxUsesPerUser: parseInt(form.maxUsesPerUser) || 0,
      expiresAt: form.expiresAt || null,
      isActive: form.isActive,
    };

    try {
      const url = isEdit ? `/api/admin/coupons/${couponId}` : '/api/admin/coupons';
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save coupon');
        setSaving(false);
        return;
      }

      router.push('/admin/coupons');
    } catch {
      setError('Network error');
      setSaving(false);
    }
  };

  const set = (field: keyof CouponFormData, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div role="alert" className="p-3 bg-red-50 text-red-700 text-sm rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="coupon-code" className="block text-sm font-medium text-charcoal-700 mb-1">
          Coupon Code *
        </label>
        <input
          id="coupon-code"
          type="text"
          required
          value={form.code}
          onChange={(e) => set('code', e.target.value.toUpperCase())}
          placeholder="e.g. SAVE10"
          className="w-full px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700 uppercase"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="coupon-type" className="block text-sm font-medium text-charcoal-700 mb-1">
            Discount Type *
          </label>
          <select
            id="coupon-type"
            required
            value={form.discountType}
            onChange={(e) => set('discountType', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700"
          >
            <option value="percent">Percentage (%)</option>
            <option value="fixed">Fixed Amount ($)</option>
          </select>
        </div>

        <div>
          <label htmlFor="coupon-value" className="block text-sm font-medium text-charcoal-700 mb-1">
            Discount Value ({form.discountType === 'percent' ? '%' : '$'}) *
          </label>
          <input
            id="coupon-value"
            type="number"
            required
            min="0.01"
            step={form.discountType === 'percent' ? '1' : '0.01'}
            value={form.discountValue}
            onChange={(e) => set('discountValue', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700"
          />
        </div>
      </div>

      <div>
        <label htmlFor="coupon-min-order" className="block text-sm font-medium text-charcoal-700 mb-1">
          Minimum Order Amount ($)
        </label>
        <input
          id="coupon-min-order"
          type="number"
          min="0"
          step="0.01"
          value={form.minOrderAmount}
          onChange={(e) => set('minOrderAmount', e.target.value)}
          placeholder="0 (no minimum)"
          className="w-full px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="coupon-max-uses" className="block text-sm font-medium text-charcoal-700 mb-1">
            Max Total Uses
          </label>
          <input
            id="coupon-max-uses"
            type="number"
            min="0"
            value={form.maxUses}
            onChange={(e) => set('maxUses', e.target.value)}
            placeholder="0 = unlimited"
            className="w-full px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700"
          />
        </div>

        <div>
          <label htmlFor="coupon-max-per-user" className="block text-sm font-medium text-charcoal-700 mb-1">
            Max Uses Per User
          </label>
          <input
            id="coupon-max-per-user"
            type="number"
            min="0"
            value={form.maxUsesPerUser}
            onChange={(e) => set('maxUsesPerUser', e.target.value)}
            placeholder="0 = unlimited"
            className="w-full px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700"
          />
        </div>
      </div>

      <div>
        <label htmlFor="coupon-expires" className="block text-sm font-medium text-charcoal-700 mb-1">
          Expiration Date
        </label>
        <input
          id="coupon-expires"
          type="date"
          value={form.expiresAt}
          onChange={(e) => set('expiresAt', e.target.value)}
          className="w-full px-3 py-2 text-sm border border-charcoal-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700"
        />
      </div>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={form.isActive}
          onChange={(e) => set('isActive', e.target.checked)}
          className="rounded border-charcoal-300 text-brand-700 focus:ring-brand-700"
        />
        <span className="text-sm text-charcoal-700">Active</span>
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-brand-700 text-white text-sm font-medium rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : isEdit ? 'Update Coupon' : 'Create Coupon'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/coupons')}
          className="px-6 py-2 text-sm font-medium text-charcoal-600 border border-charcoal-200 rounded-lg hover:bg-cream-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
