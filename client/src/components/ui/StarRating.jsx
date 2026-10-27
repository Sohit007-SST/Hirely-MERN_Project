// StarRating: five stars, either read-only (exact value, with count) or an input of five buttons for leaving a review.
// Props: { value: number (0-5), count?: number (shows "(n)", or "No reviews yet" when 0), onChange?: (n) => void (makes it an input),
//          size?: 'sm'|'md'|'lg' = 'md', label?: string = 'Your rating' (input group label) }
import { useState } from 'react';
import { Star } from 'lucide-react';

const FIVE = [1, 2, 3, 4, 5];
const PX = { sm: 14, md: 16, lg: 22 };

function Icon({ size }) {
  return <Star className="ui-stars__star" size={size} aria-hidden="true" focusable="false" />;
}

export default function StarRating({ value = 0, count, onChange, size = 'md', label = 'Your rating' }) {
  const [hover, setHover] = useState(0);
  const rating = Math.max(0, Math.min(5, Number(value) || 0));

  // Interactive: five real buttons with aria-labels
  if (onChange) {
    const shown = hover || rating;
    return (
      <div className={`ui-stars ui-stars--input ui-stars--${size}`} role="group" aria-label={label} onMouseLeave={() => setHover(0)}>
        {FIVE.map((n) => (
          <button
            key={n}
            type="button"
            className={`ui-stars__btn${n <= shown ? ' is-on' : ''}`}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            aria-pressed={n === rating}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(n)}
          >
            <Icon size={size === 'lg' ? 32 : 28} />
          </button>
        ))}
      </div>
    );
  }

  // Read-only: a grey row of stars with a teal copy on top, clipped to the exact value
  const noReviews = count === 0;
  const px = PX[size] || 16;
  return (
    <span className={`ui-stars ui-stars--${size}`}>
      <span className="ui-stars__icons" role="img" aria-label={noReviews ? 'No reviews yet' : `Rated ${rating.toFixed(1)} out of 5`}>
        <span className="ui-stars__track">{FIVE.map((n) => <Icon key={n} size={px} />)}</span>
        <span className="ui-stars__fill" style={{ width: `${(rating / 5) * 100}%` }}>
          {FIVE.map((n) => <Icon key={n} size={px} />)}
        </span>
      </span>
      {noReviews ? (
        <span className="ui-stars__count">No reviews yet</span>
      ) : (
        <>
          <span className="ui-stars__value" aria-hidden="true">{rating.toFixed(1)}</span>
          {count != null && <span className="ui-stars__count">({count})</span>}
        </>
      )}
    </span>
  );
}
