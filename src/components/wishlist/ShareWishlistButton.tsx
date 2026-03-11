'use client';

import { useState, useEffect, useCallback } from 'react';

interface ShareWishlistButtonProps {
  itemCount: number;
}

export default function ShareWishlistButton({ itemCount }: ShareWishlistButtonProps) {
  const [isShared, setIsShared] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchShareStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/wishlist/share');
      if (res.ok) {
        const data = await res.json();
        setIsShared(data.isShared);
        if (data.isShared) {
          setShareUrl(`${window.location.origin}${data.shareUrl}`);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchShareStatus();
  }, [fetchShareStatus]);

  const handleShare = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wishlist/share', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setIsShared(true);
        setShareUrl(`${window.location.origin}${data.shareUrl}`);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleStopSharing = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/wishlist/share', { method: 'DELETE' });
      if (res.ok) {
        setIsShared(false);
        setShareUrl('');
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // silently fail
    }
  };

  if (loading && !isShared) return null;
  if (itemCount === 0 && !isShared) return null;

  if (!isShared) {
    return (
      <button
        onClick={handleShare}
        disabled={loading}
        className="inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:text-brand-800 transition-colors disabled:opacity-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0-12.814a2.25 2.25 0 1 0 0-2.186m0 2.186a2.25 2.25 0 1 0 0 2.186" />
        </svg>
        Share Wishlist
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <input
        type="text"
        readOnly
        value={shareUrl}
        className="flex-1 min-w-0 text-sm px-3 py-1.5 border border-charcoal-200 rounded-lg bg-charcoal-50 text-charcoal-600"
        aria-label="Share link"
      />
      <button
        onClick={handleCopy}
        className="text-sm font-medium px-3 py-1.5 bg-brand-700 text-white rounded-lg hover:bg-brand-800 transition-colors"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
      <button
        onClick={handleStopSharing}
        disabled={loading}
        className="text-sm text-charcoal-500 hover:text-red-600 transition-colors disabled:opacity-50"
      >
        Stop Sharing
      </button>
    </div>
  );
}
