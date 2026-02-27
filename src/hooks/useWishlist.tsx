'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface WishlistContextType {
  wishlistedIds: Set<string>;
  loading: boolean;
  toggle: (productId: string) => Promise<void>;
  isWishlisted: (productId: string) => boolean;
  count: number;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    if (!session?.user) {
      setWishlistedIds(new Set());
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/wishlist');
      if (res.ok) {
        const data = await res.json();
        const ids = new Set<string>(
          data.items.map((item: { productId: { _id: string } | string }) =>
            String(typeof item.productId === 'object' ? item.productId._id : item.productId)
          )
        );
        setWishlistedIds(ids);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [session?.user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggle = useCallback(async (productId: string) => {
    if (!session?.user) return;

    const wasWishlisted = wishlistedIds.has(productId);

    // Optimistic update
    setWishlistedIds((prev) => {
      const next = new Set(prev);
      if (wasWishlisted) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });

    try {
      if (wasWishlisted) {
        const res = await fetch(`/api/wishlist/${productId}`, { method: 'DELETE' });
        if (!res.ok) throw new Error();
      } else {
        const res = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        });
        if (!res.ok) throw new Error();
      }
    } catch {
      // Revert on failure
      setWishlistedIds((prev) => {
        const next = new Set(prev);
        if (wasWishlisted) {
          next.add(productId);
        } else {
          next.delete(productId);
        }
        return next;
      });
    }
  }, [session?.user, wishlistedIds]);

  const isWishlisted = useCallback(
    (productId: string) => wishlistedIds.has(productId),
    [wishlistedIds]
  );

  return (
    <WishlistContext.Provider
      value={{ wishlistedIds, loading, toggle, isWishlisted, count: wishlistedIds.size }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
}
