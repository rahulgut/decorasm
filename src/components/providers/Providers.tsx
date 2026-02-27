'use client';

import { SessionProvider } from 'next-auth/react';
import { CartProvider } from '@/hooks/useCart';
import { ReactNode } from 'react';

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>{children}</CartProvider>
    </SessionProvider>
  );
}
