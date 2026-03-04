'use client';

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { formatPrice, capitalize } from '@/lib/utils';

interface Suggestion {
  _id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  images: string[];
}

interface GroupedSuggestions {
  category: string;
  items: Suggestion[];
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-brand-100 text-brand-800 rounded-sm px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

function groupByCategory(suggestions: Suggestion[]): GroupedSuggestions[] {
  const groups = new Map<string, Suggestion[]>();
  for (const item of suggestions) {
    const existing = groups.get(item.category) || [];
    existing.push(item);
    groups.set(item.category, existing);
  }
  return Array.from(groups, ([category, items]) => ({ category, items }));
}

export default function SearchAutocomplete() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const flatSuggestions = suggestions;

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data.suggestions);
        setOpen(data.suggestions.length > 0);
        setActiveIndex(-1);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const handleInputChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(value), 250);
  };

  const navigateToProduct = (slug: string) => {
    setOpen(false);
    setQuery('');
    router.push(`/products/${slug}`);
  };

  const navigateToSearch = () => {
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/products?search=${encodeURIComponent(query.trim())}`);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!open) {
      if (e.key === 'Enter') {
        e.preventDefault();
        navigateToSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((prev) => (prev < flatSuggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : flatSuggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < flatSuggestions.length) {
          navigateToProduct(flatSuggestions[activeIndex].slug);
        } else {
          navigateToSearch();
        }
        break;
      case 'Escape':
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Cleanup debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const grouped = groupByCategory(suggestions);
  let flatIndex = -1;

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <label htmlFor="navbar-search" className="sr-only">Search products</label>
        <input
          ref={inputRef}
          id="navbar-search"
          type="search"
          value={query}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder="Search products..."
          role="combobox"
          aria-expanded={open}
          aria-controls="search-listbox"
          aria-activedescendant={activeIndex >= 0 ? `search-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          autoComplete="off"
          className="w-full pl-9 pr-4 py-2 text-sm border border-charcoal-200 rounded-lg text-charcoal-800 placeholder-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand-700 focus:border-transparent bg-white"
        />
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-charcoal-200 border-t-brand-700 rounded-full animate-spin" aria-label="Searching" />
          </div>
        )}
      </div>

      {open && (
        <ul
          id="search-listbox"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-charcoal-200 rounded-lg shadow-lg overflow-hidden z-50 max-h-96 overflow-y-auto"
        >
          {grouped.map((group) => (
            <li key={group.category} role="presentation">
              <div className="px-3 py-1.5 text-xs font-semibold text-charcoal-400 uppercase tracking-wider bg-cream-50">
                {capitalize(group.category)}
              </div>
              <ul role="group" aria-label={capitalize(group.category)}>
                {group.items.map((item) => {
                  flatIndex++;
                  const idx = flatIndex;
                  return (
                    <li
                      key={item._id}
                      id={`search-option-${idx}`}
                      role="option"
                      aria-selected={idx === activeIndex}
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                        idx === activeIndex ? 'bg-brand-50' : 'hover:bg-cream-50'
                      }`}
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => navigateToProduct(item.slug)}
                    >
                      <div className="relative w-10 h-10 rounded overflow-hidden bg-charcoal-50 flex-shrink-0">
                        <Image
                          src={item.images[0] || '/placeholder.jpg'}
                          alt=""
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-charcoal-800 truncate">
                          {highlightMatch(item.name, query)}
                        </p>
                        <p className="text-xs text-brand-700 font-medium">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
          <li className="border-t border-charcoal-100">
            <button
              className="w-full px-3 py-2.5 text-sm text-brand-700 hover:bg-cream-50 transition-colors text-left font-medium"
              onMouseDown={(e) => {
                e.preventDefault();
                navigateToSearch();
              }}
            >
              View all results for &ldquo;{query}&rdquo;
            </button>
          </li>
        </ul>
      )}
    </div>
  );
}
