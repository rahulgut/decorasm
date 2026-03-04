'use client';

import { useState, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import StarRating from './StarRating';

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted: () => void;
}

export default function ReviewForm({ productId, onReviewSubmitted }: ReviewFormProps) {
  const { data: session } = useSession();
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!session?.user) {
    return (
      <div className="bg-cream-100 rounded-lg p-6 text-center">
        <p className="text-charcoal-500 mb-2">Want to share your thoughts?</p>
        <Link href="/login" className="text-brand-700 hover:text-brand-800 font-medium">
          Sign in to write a review
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    if (!title.trim()) {
      setError('Please add a title');
      return;
    }
    if (!body.trim()) {
      setError('Please write a review');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, title: title.trim(), body: body.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to submit review');
        return;
      }

      setRating(0);
      setTitle('');
      setBody('');
      onReviewSubmitted();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold text-charcoal-800">Write a Review</h3>

      {error && (
        <div className="p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg" role="alert">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-charcoal-700 mb-1">Your Rating</label>
        <StarRating rating={rating} interactive onRate={setRating} size="lg" />
      </div>

      <div>
        <label htmlFor="review-title" className="block text-sm font-medium text-charcoal-700 mb-1">
          Title
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summarize your experience"
          maxLength={100}
          className="w-full px-3 py-2 border border-charcoal-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="review-body" className="block text-sm font-medium text-charcoal-700 mb-1">
          Review
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="What did you like or dislike about this product?"
          maxLength={1000}
          rows={4}
          className="w-full px-3 py-2 border border-charcoal-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-brand-700 text-white text-sm font-medium py-2 px-6 rounded-lg hover:bg-brand-800 transition-colors disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
