'use client';

import Link from 'next/link';
import { capitalize } from '@/lib/utils';

const categories = ['all', 'furniture', 'lighting', 'wall-art', 'textiles', 'accessories'] as const;

interface CategoryPillsProps {
  active?: string;
}

export default function CategoryPills({ active }: CategoryPillsProps) {
  return (
    <nav aria-label="Filter by category">
      <ul className="flex flex-wrap gap-2" role="list">
        {categories.map((cat) => {
          const isActive = cat === 'all' ? !active : active === cat;
          const href = cat === 'all' ? '/products' : `/products?category=${cat}`;
          return (
            <li key={cat}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors inline-block ${
                  isActive
                    ? 'bg-brand-700 text-white'
                    : 'bg-white text-charcoal-700 hover:bg-brand-50 hover:text-brand-700 border border-charcoal-200'
                }`}
              >
                {capitalize(cat)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
