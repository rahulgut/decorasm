'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';

interface Review {
  _id: string;
  userId: string;
  userName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}

interface ReviewsData {
  reviews: Review[];
  average: number;
  count: number;
}

export default function ReviewsList({ productId }: { productId: string }) {
  const { data: session } = useSession();
  const [data, setData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDelete = async (reviewId: string) => {
    setDeletingId(reviewId);
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchReviews();
      }
    } catch {
      // silently fail
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-charcoal-100 rounded w-48" />
        <div className="h-20 bg-charcoal-100 rounded" />
        <div className="h-20 bg-charcoal-100 rounded" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-charcoal-800 mb-2">Customer Reviews</h2>
        {data && data.count > 0 ? (
          <div className="flex items-center gap-3">
            <StarRating rating={data.average} showValue size="lg" />
            <span className="text-sm text-charcoal-400">
              Based on {data.count} review{data.count !== 1 ? 's' : ''}
            </span>
          </div>
        ) : (
          <p className="text-charcoal-400 text-sm">No reviews yet. Be the first to review!</p>
        )}
      </div>

      <ReviewForm productId={productId} onReviewSubmitted={fetchReviews} />

      {data && data.reviews.length > 0 && (
        <div className="space-y-6 divide-y divide-charcoal-100">
          {data.reviews.map((review) => (
            <div key={review._id} className="pt-6 first:pt-0">
              <div className="flex items-start justify-between">
                <div>
                  <StarRating rating={review.rating} size="sm" />
                  <h4 className="font-semibold text-charcoal-800 mt-1">{review.title}</h4>
                </div>
                {session?.user?.id === review.userId && (
                  <button
                    onClick={() => handleDelete(review._id)}
                    disabled={deletingId === review._id}
                    className="text-xs text-charcoal-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    aria-label="Delete review"
                  >
                    {deletingId === review._id ? 'Deleting...' : 'Delete'}
                  </button>
                )}
              </div>
              <p className="text-sm text-charcoal-500 mt-2">{review.body}</p>
              <p className="text-xs text-charcoal-400 mt-2">
                By {review.userName} on {new Date(review.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
