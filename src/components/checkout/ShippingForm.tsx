'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import Input from '../ui/Input';
import Button from '../ui/Button';

export default function ShippingForm() {
  const router = useRouter();
  const { refreshCart } = useCart();
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.fullName.trim()) errs.fullName = 'Name is required';
    if (!form.email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email';
    if (!form.phone.trim()) errs.phone = 'Phone is required';
    if (!form.address.trim()) errs.address = 'Address is required';
    if (!form.city.trim()) errs.city = 'City is required';
    if (!form.state.trim()) errs.state = 'State is required';
    if (!form.zipCode.trim()) errs.zipCode = 'ZIP code is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shippingAddress: form }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to place order');
        setSubmitting(false);
        return;
      }

      const { orderNumber } = await res.json();
      await refreshCart();
      router.push(`/checkout/confirmation?order=${orderNumber}`);
    } catch {
      alert('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold text-charcoal-800 mb-4">Shipping Information</h2>

      <Input
        label="Full Name"
        value={form.fullName}
        onChange={(e) => update('fullName', e.target.value)}
        error={errors.fullName}
        placeholder="John Doe"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          error={errors.email}
          placeholder="john@example.com"
        />
        <Input
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(e) => update('phone', e.target.value)}
          error={errors.phone}
          placeholder="(555) 123-4567"
        />
      </div>

      <Input
        label="Street Address"
        value={form.address}
        onChange={(e) => update('address', e.target.value)}
        error={errors.address}
        placeholder="123 Main St, Apt 4"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Input
          label="City"
          value={form.city}
          onChange={(e) => update('city', e.target.value)}
          error={errors.city}
          placeholder="New York"
        />
        <Input
          label="State"
          value={form.state}
          onChange={(e) => update('state', e.target.value)}
          error={errors.state}
          placeholder="NY"
        />
        <Input
          label="ZIP Code"
          value={form.zipCode}
          onChange={(e) => update('zipCode', e.target.value)}
          error={errors.zipCode}
          placeholder="10001"
        />
      </div>

      <Button type="submit" size="lg" className="w-full mt-6" disabled={submitting}>
        {submitting ? 'Placing Order...' : 'Place Order'}
      </Button>
    </form>
  );
}
