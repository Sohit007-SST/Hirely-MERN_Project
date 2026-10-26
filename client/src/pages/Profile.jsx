import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import StarRating from '../components/StarRating';
import StatusPill from '../components/StatusPill';
import { formatDate, formatINR, plural, sameId } from '../utils/format';

const REVIEWS_PER_PAGE = 5;

const ROLE_LABEL = { client: 'Client', freelancer: 'Freelancer', admin: 'Admin' };

// "Oct 2026"
const monthYear = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '';

function ReviewItem({ review }) {
  const { reviewer, gig } = review;
  return (
    <li className="review">
      <div className="review__head">
        {reviewer ? (
          <Link className="person" to={`/users/${reviewer._id}`}>
            <Avatar user={reviewer} size="sm" decorative />
            <span className="person__name">{reviewer.name}</span>
          </Link>
        ) : (
          <span className="person muted">A former user</span>
        )}
        <StarRating value={review.rating} size="sm" />
      </div>
      {review.comment && <p className="review__text">{review.comment}</p>}
      <p className="review__meta small muted">
        {gig ? (
          <>For <Link className="link" to={`/gigs/${gig._id}`}>{gig.title}</Link> · </>
        ) : null}
        {formatDate(review.createdAt)}
      </p>
    </li>
  );
}

// Session 11: reviews, 5 at a time with "Show more reviews"
function Reviews({ userId, firstName }) {
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({ page: 0, pages: 1, total: 0 });
  const [status, setStatus] = useState('loading'); // loading | more | ready | error
  const [error, setError] = useState('');

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
    <section className="card" aria-labelledby="reviews-title">
      <div className="card__head">
        <h2 id="reviews-title" className="card__title">Reviews</h2>
        {meta.total > 0 && <span className="muted small">{plural(meta.total, 'review')}</span>}
      </div>

      {status === 'loading' ? (
        <Loader label="Loading reviews" />
      ) : status === 'error' && reviews.length === 0 ? (
        <div className="alert alert--error" role="alert">
          Couldn't load reviews. {error}{' '}
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => loadPage(1)}>
            Try again
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <EmptyState
          compact
          title="No reviews yet"
          text={`Reviews show up here after a gig with ${firstName} is completed.`}
        />
      ) : (
        <>
          <ul className="reviews">
            {reviews.map((r) => (
              <ReviewItem key={r._id} review={r} />
            ))}
          </ul>
          {status === 'error' && (
            <p className="field-error" role="alert">Couldn't load more reviews. {error}</p>
          )}
          {meta.page < meta.pages && (
            <button
              type="button"
              className="btn btn--secondary btn--block profile-more"
              onClick={() => loadPage(meta.page + 1)}
              disabled={status === 'more'}
            >
              {status === 'more' ? 'Loading…' : 'Show more reviews'}
            </button>
          )}
        </>
      )}
    </section>
  );
}

// Follow + Message for other people, Edit profile for me, Log in for visitors
function ProfileActions({ profile, isMe, following, followBusy, onFollow, onMessage, messageBusy }) {
  const { user } = useAuth();
  const location = useLocation();

  if (isMe) {
    return <Link className="btn btn--secondary" to="/settings">Edit profile</Link>;
  }
  if (!user) {
    return (
      <Link className="btn btn--primary" to="/login" state={{ from: location }}>
        Log in to follow
      </Link>
    );
  }
  return (
    <>
      <button
        type="button"
        className={`btn ${following ? 'btn--secondary' : 'btn--primary'}`}
        aria-pressed={following}
        onClick={onFollow}
        disabled={followBusy}
      >
        {following ? 'Unfollow' : 'Follow'}
      </button>
      <button type="button" className="btn btn--ink" onClick={onMessage} disabled={messageBusy}>
        {messageBusy ? 'Opening chat…' : `Message ${profile.name.split(' ')[0]}`}
      </button>
    </>
  );
}

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();
  const { isOnline } = useSocket();

  const [data, setData] = useState(null); // { user, counts, isFollowing, stats }
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error
  const [error, setError] = useState('');
  const [followBusy, setFollowBusy] = useState(false);
  const [messageBusy, setMessageBusy] = useState(false);

  const meId = me?._id;

  // Reload when the profile changes, or when I log in/out (isFollowing depends on who asks)
  const load = useCallback(
    (signal) => {
      setStatus('loading');
      api
        .get(`/users/${id}`, { signal })
        .then(({ data: res }) => {
          setData(res);
          setStatus('ready');
        })
        .catch((err) => {
          if (signal?.aborted) return;
          setError(err.message);
          setStatus(err.status === 404 || err.status === 400 ? 'notfound' : 'error');
        });
    },
    [id, meId]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // Session 10: follow / unfollow toggle
  const toggleFollow = async () => {
    setFollowBusy(true);
    try {
      const { data: res } = await api.post(`/users/${id}/follow`);
      setData((d) => ({
        ...d,
        isFollowing: res.following,
        counts: { ...d.counts, followers: res.followersCount },
      }));
      const first = data.user.name.split(' ')[0];
      toast.success(res.following ? `You're following ${first}` : `You unfollowed ${first}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setFollowBusy(false);
    }
  };

  // Find or create the private conversation, then open it
  const startChat = async () => {
    setMessageBusy(true);
    try {
      const { data: res } = await api.post('/chat/conversations', { userId: id });
      navigate(`/chat/${res.conversation._id}`);
    } catch (err) {
      toast.error(err.message);
      setMessageBusy(false);
    }
  };

  // Keep the page on screen while refreshing the same profile (e.g. right after logging in)
  if (status === 'loading' && !sameId(data?.user?._id, id)) return <Loader full label="Loading profile" />;

  if (status === 'notfound') {
    return (
      <div className="container page">
        <EmptyState
          title="We couldn't find this person"
          text="The account may have been removed or suspended, or the link is mistyped. Browse freelancers to find someone else."
          action={<Link className="btn btn--primary" to="/freelancers">Browse freelancers</Link>}
        />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container page">
        <div className="alert alert--error dash-error" role="alert">
          <p><strong>Couldn't load this profile.</strong> {error}</p>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => load()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  const { user: profile, counts, isFollowing, stats } = data;
  const isMe = sameId(profile._id, meId);
  const firstName = profile.name.split(' ')[0];
  const online = isOnline(profile._id);
  const skills = profile.skills || [];

  return (
    <div className="container page">
      <section className="card card--pad-lg profile-hero" aria-labelledby="profile-name">
        <Avatar user={profile} size="xl" online={online} />

        <div className="profile-hero__body">
          <div className="row">
            <span className="eyebrow">{ROLE_LABEL[profile.role] || profile.role}</span>
            {online && <span className="fl-card__online">Online now</span>}
            {profile.isBanned && <StatusPill status="suspended" />}
          </div>
          <h1 id="profile-name" className="profile-hero__name">{profile.name}</h1>
          {profile.headline && <p className="profile-hero__headline">{profile.headline}</p>}

          <div className="profile-hero__meta">
            {profile.role !== 'admin' && (
              <StarRating value={profile.rating?.average} count={profile.rating?.count ?? 0} size="sm" />
            )}
            {profile.location && <span>{profile.location}</span>}
            <span>Joined {monthYear(profile.createdAt)}</span>
          </div>

          <div className="profile-hero__actions">
            <ProfileActions
              profile={profile}
              isMe={isMe}
              following={isFollowing}
              followBusy={followBusy}
              onFollow={toggleFollow}
              onMessage={startChat}
              messageBusy={messageBusy}
            />
          </div>
        </div>

        <dl className="profile-stats">
          <div className="profile-stats__item">
            <dt>Followers</dt>
            <dd>{counts.followers}</dd>
          </div>
          <div className="profile-stats__item">
            <dt>Following</dt>
            <dd>{counts.following}</dd>
          </div>
          {stats.gigsPosted !== undefined && (
            <div className="profile-stats__item">
              <dt>Gigs posted</dt>
              <dd>{stats.gigsPosted}</dd>
            </div>
          )}
          {stats.gigsCompleted !== undefined && (
            <div className="profile-stats__item">
              <dt>Gigs completed</dt>
              <dd>{stats.gigsCompleted}</dd>
            </div>
          )}
          {profile.role === 'freelancer' && profile.hourlyRate > 0 && (
            <div className="profile-stats__item">
              <dt>Hourly rate</dt>
              <dd>{formatINR(profile.hourlyRate)}<span className="profile-stats__unit">/hr</span></dd>
            </div>
          )}
        </dl>
      </section>

      <div className="layout-2col profile-body">
        <div className="layout-2col__main">
          <section className="card" aria-labelledby="about-title">
            <h2 id="about-title" className="card__title profile-card-title">About</h2>
            {profile.bio ? (
              <p className="profile-bio">{profile.bio}</p>
            ) : isMe ? (
              <p className="muted">
                You haven't written a bio yet. <Link className="link" to="/settings">Add one in settings</Link> so people know what you do.
              </p>
            ) : (
              <p className="muted">{firstName} hasn't written a bio yet.</p>
            )}
          </section>

          <Reviews userId={profile._id} firstName={firstName} />
        </div>

        <aside className="layout-2col__side">
          <section className="card" aria-labelledby="skills-title">
            <h2 id="skills-title" className="card__title profile-card-title">Skills</h2>
            {skills.length > 0 ? (
              <ul className="chips">
                {skills.map((s) => (
                  <li key={s} className="chip">{s}</li>
                ))}
              </ul>
            ) : isMe && profile.role === 'freelancer' ? (
              <p className="muted small">
                Add your skills in <Link className="link" to="/settings">settings</Link> so clients can find you.
              </p>
            ) : (
              <p className="muted small">No skills listed.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}
