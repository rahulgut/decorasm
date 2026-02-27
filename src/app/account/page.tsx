'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { IShippingAddress } from '@/types';

export default function AccountDashboard() {
  const { data: session } = useSession();
  const [address, setAddress] = useState<IShippingAddress | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          if (data.shippingAddress?.address) {
            setAddress(data.shippingAddress);
          }
        }
      } catch {
        // silently fail
      }
    }
    if (session?.user) loadProfile();
  }, [session]);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-charcoal-100 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-charcoal-800 mb-4">Profile</h2>
        <dl className="space-y-3">
          <div>
            <dt className="text-sm text-charcoal-500">Name</dt>
            <dd className="text-charcoal-800">{session?.user?.name || '—'}</dd>
          </div>
          <div>
            <dt className="text-sm text-charcoal-500">Email</dt>
            <dd className="text-charcoal-800">{session?.user?.email || '—'}</dd>
          </div>
        </dl>
      </div>

      <div className="bg-white border border-charcoal-100 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-charcoal-800 mb-4">Saved Shipping Address</h2>
        {address ? (
          <div className="text-sm text-charcoal-700 space-y-1">
            <p>{address.fullName}</p>
            <p>{address.address}</p>
            <p>{address.city}, {address.state} {address.zipCode}</p>
            <p>{address.country}</p>
          </div>
        ) : (
          <p className="text-sm text-charcoal-400">
            No saved address yet. It will be saved after your first order.
          </p>
        )}
      </div>
    </div>
  );
}
