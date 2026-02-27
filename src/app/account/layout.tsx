'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

const sidebarLinks = [
  { href: '/account', label: 'Dashboard' },
  { href: '/account/orders', label: 'Order History' },
  { href: '/account/wishlist', label: 'Wishlist' },
];

export default function AccountLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-charcoal-800 font-heading mb-8">My Account</h1>
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-56 flex-shrink-0">
          <nav aria-label="Account navigation" className="space-y-1">
            {sidebarLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-charcoal-600 hover:bg-cream-100 hover:text-charcoal-800'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
