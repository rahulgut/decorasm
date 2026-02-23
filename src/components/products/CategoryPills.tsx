'use client';

import Link from 'next/link';
import { capitalize } from '@/lib/utils';

const categories = ['all', 'furniture', 'lighting', 'wall-art', 'textiles', 'accessories'] as const;

interface CategoryPillsProps {
  active?: string;
}

export default function CategoryPills({ active }: CategoryPillsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const isActive = cat === 'all' ? !active : active === cat;
        const href = cat === 'all' ? '/products' : `/products?category=${cat}`;
        return (
          <Link
            key={cat}
            href={href}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              isActive
                ? 'bg-brand-500 text-white'
                : 'bg-white text-charcoal-600 hover:bg-brand-50 hover:text-brand-600 border border-charcoal-200'
            }`}
          >
            {capitalize(cat)}
          </Link>
        );
      })}
    </div>
  );
}
