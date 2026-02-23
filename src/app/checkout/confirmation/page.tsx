'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('order');

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
      {/* Success icon */}
      <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-charcoal-800 mb-3">Thank You!</h1>
      <p className="text-charcoal-500 mb-8">
        Your order has been placed successfully.
      </p>

      {orderNumber && (
        <div className="bg-cream-100 rounded-xl p-6 mb-8 inline-block">
          <p className="text-sm text-charcoal-400 mb-1">Order Number</p>
          <p className="text-2xl font-bold text-brand-600 font-mono tracking-wider">
            {orderNumber}
          </p>
        </div>
      )}

      <p className="text-charcoal-400 text-sm mb-8 max-w-md mx-auto">
        We&apos;ve received your order and will begin processing it shortly.
        A confirmation email will be sent to your email address.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/products">
          <Button size="lg">Continue Shopping</Button>
        </Link>
        <Link href="/">
          <Button variant="outline" size="lg">Back to Home</Button>
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-charcoal-400">Loading...</div>}>
      <ConfirmationContent />
    </Suspense>
  );
}
