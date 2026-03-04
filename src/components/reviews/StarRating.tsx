'use client';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onRate?: (rating: number) => void;
  count?: number;
  showValue?: boolean;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export default function StarRating({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  onRate,
  count,
  showValue = false,
}: StarRatingProps) {
  const starSize = sizeClasses[size];

  const handleClick = (star: number) => {
    if (interactive && onRate) {
      onRate(star);
    }
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex" role={interactive ? 'radiogroup' : 'img'} aria-label={`Rating: ${rating} out of ${maxStars} stars`}>
        {Array.from({ length: maxStars }, (_, i) => {
          const starNumber = i + 1;
          const filled = starNumber <= Math.floor(rating);
          const halfFilled = !filled && starNumber <= rating + 0.5 && rating % 1 >= 0.3;

          return (
            <button
              key={i}
              type="button"
              onClick={() => handleClick(starNumber)}
              disabled={!interactive}
              aria-label={`${starNumber} star${starNumber !== 1 ? 's' : ''}`}
              className={`${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform disabled:cursor-default`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className={`${starSize} ${
                  filled
                    ? 'fill-amber-400 text-amber-400'
                    : halfFilled
                    ? 'fill-amber-200 text-amber-400'
                    : 'fill-none text-charcoal-300'
                }`}
                stroke="currentColor"
                strokeWidth={1.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>
            </button>
          );
        })}
      </div>
      {showValue && rating > 0 && (
        <span className="text-sm font-medium text-charcoal-700 ml-1">{rating.toFixed(1)}</span>
      )}
      {count !== undefined && (
        <span className="text-sm text-charcoal-400 ml-1">({count})</span>
      )}
    </div>
  );
}
