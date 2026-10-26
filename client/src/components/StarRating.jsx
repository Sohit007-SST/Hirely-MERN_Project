// Props: { value: number (0-5), count?: number (shows "(n)" or "No reviews yet"), onChange?: (n) => void (makes it an input), size?: 'sm'|'md'|'lg' = 'md', label?: string (input group label) }
import { useState } from 'react';

const STAR_PATH = 'M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z';

function Star() {
  return (
    <svg className="star" viewBox="0 0 24 24" aria-hidden="true">
      <path d={STAR_PATH} />
    </svg>
  );
}

const FIVE = [1, 2, 3, 4, 5];

export default function StarRating({ value = 0, count, onChange, size = 'md', label = 'Your rating' }) {
  const [hover, setHover] = useState(0);
  const rating = Math.max(0, Math.min(5, Number(value) || 0));

  // Interactive: five real buttons with aria-labels (Session 11: reviews)
  if (onChange) {
    const shown = hover || rating;
    return (
      <div className={`stars stars--input stars--${size}`} role="group" aria-label={label} onMouseLeave={() => setHover(0)}>
        {FIVE.map((n) => (
          <button
            key={n}
            type="button"
            className={`star-btn${n <= shown ? ' is-on' : ''}`}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            aria-pressed={n === rating}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(n)}
          >
            <Star />
          </button>
        ))}
      </div>
    );
  }

  // Read-only: a grey track with a marigold overlay clipped to the exact value
  const noReviews = count === 0;
  return (
    <span className={`stars stars--${size}`}>
      <span
        className="stars__icons"
        role="img"
        aria-label={noReviews ? 'No reviews yet' : `Rated ${rating.toFixed(1)} out of 5`}
      >
        <span className="stars__track">{FIVE.map((n) => <Star key={n} />)}</span>
        <span className="stars__fill" style={{ width: `${(rating / 5) * 100}%` }}>
          {FIVE.map((n) => <Star key={n} />)}
        </span>
      </span>
      {noReviews ? (
        <span className="stars__count">No reviews yet</span>
      ) : (
        <>
          <span className="stars__value" aria-hidden="true">{rating.toFixed(1)}</span>
          {count != null && <span className="stars__count">({count})</span>}
        </>
      )}
    </span>
  );
}
