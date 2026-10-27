// ReviewsCard: the profile's reviews, styled like recommendations (reviewer avatar, name, role, date, stars, text),
// loaded 5 at a time from GET /users/:id/reviews (page / pages / total) with a "Show more reviews" button.
// Props: { userId: string, firstName: string }
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquareQuote } from 'lucide-react';
import api from '../../api/axios';
import { Avatar, Button, Card, EmptyState, SeeMore, SkeletonRow, StarRating } from '../ui';
import { formatDate, plural } from '../../utils/format';

const REVIEWS_PER_PAGE = 5;
const ROLE_LABEL = { client: 'Client', freelancer: 'Freelancer', admin: 'Admin' };

function ReviewItem({ review }) {
  const { reviewer, gig } = review;
  return (
    <li className="people-review">
      {reviewer ? (
        <Link to={`/users/${reviewer._id}`} className="people-review__avatar" tabIndex={-1} aria-hidden="true">
          <Avatar user={reviewer} size={48} decorative />
        </Link>
      ) : (
        <Avatar user={{ name: '?' }} size={48} decorative className="people-review__avatar" />
      )}
      <div className="people-review__main">
        <div className="people-review__head">
          <div className="people-review__who">
            {reviewer ? (
              <Link className="people-review__name" to={`/users/${reviewer._id}`}>{reviewer.name}</Link>
            ) : (
              <span className="people-review__name">A former user</span>
            )}
            <p className="people-review__role">
              {reviewer?.headline || ROLE_LABEL[reviewer?.role] || 'Hirely member'}
            </p>
            <p className="people-review__date">{formatDate(review.createdAt)}</p>
          </div>
          <StarRating value={review.rating} size="sm" />
        </div>
        {review.comment && <SeeMore className="people-review__text">{review.comment}</SeeMore>}
        {gig && (
          <p className="people-review__gig">
            For <Link to={`/gigs/${gig._id}`}>{gig.title}</Link>
          </p>
        )}
      </div>
    </li>
  );
}

export default function ReviewsCard({ userId, firstName }) {
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({ page: 0, pages: 1, total: 0 });
  const [status, setStatus] = useState('loading'); // loading | more | ready | error
  const [error, setError] = useState('');

  // Session 11: reviews, a page at a time
  const loadPage = useCallback(
    (page, signal) => {
      setStatus(page === 1 ? 'loading' : 'more');
      api
        .get(`/users/${userId}/reviews`, { params: { page, limit: REVIEWS_PER_PAGE }, signal })
        .then(({ data }) => {
          setReviews((list) => (page === 1 ? data.reviews : [...list, ...data.reviews]));
          setMeta({ page: data.page || page, pages: data.pages || 1, total: data.total ?? data.reviews.length });
          setStatus('ready');
        })
        .catch((err) => {
          if (signal?.aborted) return;
          setError(err.message);
          setStatus('error');
        });
    },
    [userId]
  );

  useEffect(() => {
    const controller = new AbortController();
    loadPage(1, controller.signal);
    return () => controller.abort();
  }, [loadPage]);

  return (
    <Card
      title="Reviews"
      padded={false}
      action={meta.total > 0 && <span className="people-card-count">{plural(meta.total, 'review')}</span>}
    >
      {status === 'loading' ? (
        <div className="people-pad"><SkeletonRow count={2} label="Loading reviews" /></div>
      ) : status === 'error' && reviews.length === 0 ? (
        <div className="people-pad people-empty-line" role="alert">
          <p className="people-error">Couldn't load reviews. {error}</p>
          <Button size="sm" variant="secondary" onClick={() => loadPage(1)}>Try again</Button>
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          compact
          titleAs="h3"
          icon={MessageSquareQuote}
          title="No reviews yet"
          text={`Reviews show up here after a gig with ${firstName} is completed.`}
        />
      ) : (
        <>
          <ul className="people-reviews">
            {reviews.map((r) => (
              <ReviewItem key={r._id} review={r} />
            ))}
          </ul>
          {status === 'error' && (
            <p className="people-error people-pad" role="alert">Couldn't load more reviews. {error}</p>
          )}
          {meta.page < meta.pages && (
            <div className="people-more">
              <Button variant="tertiary" block onClick={() => loadPage(meta.page + 1)} loading={status === 'more'} loadingText="Loading…">
                Show more reviews
              </Button>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
