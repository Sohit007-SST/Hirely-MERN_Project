// ReviewCard: after a gig is completed, the client and the hired freelancer review each other here (big clickable stars).
// Once sent it shows "You reviewed this gig" (checked with GET /reviews/gig/:gigId/mine).
// Props: { gigId, reviewee: user, mine: { status, reviewed, review }, onReviewed(review) }
import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Send } from 'lucide-react';
import api from '../../api/axios';
import { Button, Card, Skeleton, StarRating } from '../ui';

export default function ReviewCard({ gigId, reviewee, mine, onReviewed }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const firstName = reviewee?.name?.split(' ')[0] || 'them';

  if (mine.status === 'loading' || mine.status === 'idle') {
    return (
      <Card title="Review" className="gigs-review">
        <div role="status" aria-busy="true" className="gigs-skel-stack">
          <span className="ui-sr-only">Checking your review…</span>
          <Skeleton width={180} height={32} />
          <Skeleton width="70%" />
        </div>
      </Card>
    );
  }

  if (mine.reviewed) {
    return (
      <Card title="You reviewed this gig" action={<StarRating value={mine.review?.rating} />} className="gigs-review">
        {mine.review?.comment && <p className="gigs-review__quote">“{mine.review.comment}”</p>}
        {reviewee && (
          <p className="gigs-note">
            It's on <Link className="gigs-link" to={`/users/${reviewee._id}`}>{firstName}'s profile</Link>.
          </p>
        )}
      </Card>
    );
  }

  // Session 11: reviews and ratings
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!rating) {
      setError('Pick a star rating from 1 to 5');
      return;
    }
    setSending(true);
    setError('');
    try {
      const { data } = await api.post('/reviews', { gigId, rating, comment: comment.trim() });
      toast.success('Review sent');
      onReviewed(data.review);
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
      setSending(false);
    }
  };

  return (
    <Card title={`Review ${firstName}`} className="gigs-review">
      <p className="gigs-note">This gig is complete. How was working with {firstName}? Your review appears on their profile.</p>
      <form className="gigs-form-stack" onSubmit={onSubmit} noValidate>
        <div className="gigs-field">
          <span className="label" id="review-rating-label">Rating</span>
          <StarRating value={rating} onChange={(n) => { setRating(n); setError(''); }} size="lg" label="Rating" />
          {error && <p className="gigs-error" role="alert">{error}</p>}
        </div>
        <div className="gigs-field">
          <div className="gigs-field__top">
            <label className="label" htmlFor="review-comment">Comment <span className="gigs-muted">(optional)</span></label>
            <span className="counter">{comment.length} / 1000</span>
          </div>
          <textarea
            id="review-comment"
            className="textarea"
            maxLength={1000}
            placeholder="What went well? What could be better?"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
        </div>
        <div className="gigs-card-actions">
          <Button type="submit" icon={Send} loading={sending} loadingText="Sending…">Send review</Button>
        </div>
      </form>
    </Card>
  );
}
