import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import PriceTag from '../components/PriceTag';
import StatusPill from '../components/StatusPill';
import StarRating from '../components/StarRating';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { formatDate, formatINR, plural, sameId, timeAgo } from '../utils/format';

// Accepted first, then pending, then rejected (withdrawn bids are hidden from the owner)
const BID_ORDER = { accepted: 0, pending: 1, rejected: 2, withdrawn: 3 };

const memberSince = (date) =>
  date ? new Date(date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '';

// Turn [{ field, message }] from the validation middleware into { field: message }
const toFieldErrors = (errors) =>
  (errors || []).reduce((acc, e) => (acc[e.field] ? acc : { ...acc, [e.field]: e.message }), {});

function BookmarkIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M6.5 3.5h11a1 1 0 0 1 1 1v16l-6.5-4.2-6.5 4.2v-16a1 1 0 0 1 1-1z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"
        fill="currentColor"
      />
    </svg>
  );
}

// "Gemini isn't set up" (503) reads as information, anything else as an error
function AIError({ error }) {
  if (!error) return null;
  if (error.status === 503) {
    return (
      <div className="alert alert--info" role="status">
        <strong>Gemini isn't set up on this server yet.</strong> You can still write the proposal yourself.
        <span className="ai-box__detail">{error.message}</span>
      </div>
    );
  }
  return <p className="field-error" role="alert">{error.message}</p>;
}

/* ---------- Owner: the list of bids ---------- */

function BidItem({ bid, canHire, busy, onHire, onMessage }) {
  const f = bid.freelancer || {};
  const dim = bid.status === 'rejected' || bid.status === 'withdrawn';

  return (
    <li className={`bid${dim ? ' bid--dim' : ''}${bid.status === 'accepted' ? ' bid--accepted' : ''}`}>
      <div className="bid__head">
        <Link className="person bid__person" to={`/users/${f._id}`}>
          <Avatar user={f} size="md" decorative />
          <span className="bid__who">
            <span className="person__name">{f.name || 'Freelancer'}</span>
            {f.headline && <span className="person__sub truncate">{f.headline}</span>}
          </span>
        </Link>
        <StatusPill status={bid.status} />
      </div>

      <div className="bid__terms">
        <span className="bid__amount">{formatINR(bid.amount)}</span>
        <span className="muted">delivered in {plural(bid.deliveryDays, 'day')}</span>
        <span className="bid__rating">
          <StarRating value={f.rating?.average} count={f.rating?.count} size="sm" />
        </span>
      </div>

      <p className="bid__proposal">{bid.proposal}</p>

      <div className="bid__foot">
        <span className="small muted">Sent {timeAgo(bid.createdAt)}</span>
        <div className="bid__actions">
          <button type="button" className="btn btn--secondary btn--sm" disabled={busy} onClick={() => onMessage(f._id)}>
            Message
          </button>
          {canHire && bid.status === 'pending' && (
            <button type="button" className="btn btn--primary btn--sm" disabled={busy} onClick={() => onHire(bid)}>
              Hire for {formatINR(bid.amount)}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}

function BidList({ bids, status, canHire, busy, onHire, onMessage, onRetry }) {
  const visible = bids.filter((b) => b.status !== 'withdrawn').sort((a, b) => BID_ORDER[a.status] - BID_ORDER[b.status]);

  return (
    <section className="card card--pad-lg" aria-labelledby="bids-title">
      <div className="card__head">
        <h2 id="bids-title" className="card__title">Bids {status === 'ready' && `(${visible.length})`}</h2>
      </div>
      {status === 'loading' && <Loader label="Loading bids" />}
      {status === 'error' && (
        <div className="alert alert--error" role="alert">
          Couldn't load the bids.{' '}
          <button type="button" className="btn btn--ghost btn--sm" onClick={onRetry}>Try again</button>
        </div>
      )}
      {status === 'ready' && visible.length === 0 && (
        <EmptyState
          compact
          title="No bids yet"
          text="Bids from freelancers show up here. Share the gig link or check back in a day or two."
        />
      )}
      {status === 'ready' && visible.length > 0 && (
        <ul className="bid-list">
          {visible.map((bid) => (
            <BidItem key={bid._id} bid={bid} canHire={canHire} busy={busy} onHire={onHire} onMessage={onMessage} />
          ))}
        </ul>
      )}
    </section>
  );
}

/* ---------- Freelancer: their own bid, or the bid form ---------- */

function MyBid({ bid, gigStatus, busy, onWithdraw }) {
  let note = '';
  if (bid.status === 'pending') note = 'The client can see your bid. You can withdraw it while it is pending.';
  if (bid.status === 'accepted') note = "You're hired. Use the chat to agree on the next steps with the client.";
  if (bid.status === 'rejected') note = 'The client hired another freelancer for this gig.';

  return (
    <section className="card card--pad-lg" aria-labelledby="mybid-title">
      <div className="card__head">
        <h2 id="mybid-title" className="card__title">Your bid</h2>
        <StatusPill status={bid.status} />
      </div>
      <div className="bid__terms">
        <span className="bid__amount">{formatINR(bid.amount)}</span>
        <span className="muted">delivered in {plural(bid.deliveryDays, 'day')}</span>
      </div>
      <p className="bid__proposal">{bid.proposal}</p>
      <p className="small muted">Sent {timeAgo(bid.updatedAt || bid.createdAt)}. {note}</p>
      {bid.status === 'pending' && gigStatus === 'open' && (
        <div className="row row--end">
          <button type="button" className="btn btn--danger-ghost btn--sm" disabled={busy} onClick={onWithdraw}>
            {busy ? 'Withdrawing…' : 'Withdraw bid'}
          </button>
        </div>
      )}
    </section>
  );
}

function BidForm({ gig, previous, onPlaced }) {
  const [form, setForm] = useState(() => ({
    amount: previous ? String(previous.amount) : '',
    deliveryDays: previous ? String(previous.deliveryDays) : '',
    proposal: previous?.proposal || '',
  }));
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState(null);
  const [aiFilled, setAiFilled] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'proposal' ? value : value.replace(/\D/g, '').slice(0, 9) }));
    setFieldErrors((fe) => ({ ...fe, [name]: '' }));
  };

  // Session 15: Gemini writes a draft. It only fills the textarea; the freelancer edits and sends it.
  const writeWithGemini = async () => {
    if (form.proposal.trim() && !window.confirm('Replace your current proposal with a Gemini draft?')) return;
    setAiBusy(true);
    setAiError(null);
    try {
      const { data } = await api.post('/ai/proposal', { gigId: gig._id, notes: notes.trim() || undefined });
      setForm((f) => ({ ...f, proposal: data.text.slice(0, 2000) }));
      setFieldErrors((fe) => ({ ...fe, proposal: '' }));
      setAiFilled(true);
    } catch (err) {
      setAiError({ status: err.status, message: err.message });
    } finally {
      setAiBusy(false);
    }
  };

  const validate = () => {
    const errs = {};
    if (!(Number(form.amount) >= 1)) errs.amount = 'Enter your price in rupees';
    const days = Number(form.deliveryDays);
    if (!(days >= 1 && days <= 365)) errs.deliveryDays = 'Enter between 1 and 365 days';
    const length = form.proposal.trim().length;
    if (length < 30) errs.proposal = `Write at least 30 characters (${30 - length} more)`;
    if (length > 2000) errs.proposal = 'Keep the proposal under 2000 characters';
    return errs;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setFieldErrors(errs);
    setError('');
    if (Object.keys(errs).length) return;

    setSubmitting(true);
    try {
      const { data } = await api.post(`/gigs/${gig._id}/bids`, {
        amount: Number(form.amount),
        deliveryDays: Number(form.deliveryDays),
        proposal: form.proposal.trim(),
      });
      toast.success('Bid sent. The client has been notified');
      onPlaced(data.bid);
    } catch (err) {
      setFieldErrors(toFieldErrors(err.errors));
      setError(err.message);
      setSubmitting(false);
    }
  };

  const fieldProps = (name) => ({
    id: `bid-${name}`,
    name,
    value: form[name],
    onChange,
    'aria-invalid': Boolean(fieldErrors[name]),
    'aria-describedby': fieldErrors[name] ? `bid-${name}-error` : undefined,
  });

  return (
    <section className="card card--pad-lg" aria-labelledby="bidform-title">
      <h2 id="bidform-title" className="card__title">Place a bid</h2>
      <p className="muted small bid-form__sub">
        {previous
          ? 'You withdrew your earlier bid. Change anything you like and send it again.'
          : `The client's budget is ${formatINR(gig.budget)}. Bid what the work is worth to you.`}
      </p>

      {error && <div className="alert alert--error" role="alert">{error}</div>}

      <form className="form" onSubmit={onSubmit} noValidate>
        <div className="form-row">
          <div className="field">
            <label className="label" htmlFor="bid-amount">Your price (₹)</label>
            <input className="input" inputMode="numeric" placeholder={String(gig.budget)} {...fieldProps('amount')} />
            {fieldErrors.amount && <p className="field-error" id="bid-amount-error">{fieldErrors.amount}</p>}
          </div>
          <div className="field">
            <label className="label" htmlFor="bid-deliveryDays">Delivery time (days)</label>
            <input className="input" inputMode="numeric" placeholder="e.g. 7" {...fieldProps('deliveryDays')} />
            {fieldErrors.deliveryDays && (
              <p className="field-error" id="bid-deliveryDays-error">{fieldErrors.deliveryDays}</p>
            )}
          </div>
        </div>

        <div className="ai-box">
          <p className="ai-box__title"><SparkIcon /> Write proposal with Gemini</p>
          <p className="hint">
            Add a few notes if you like. Gemini drafts a proposal from the gig and your profile, and you can edit it before sending.
          </p>
          <div className="ai-box__row">
            <label className="sr-only" htmlFor="bid-notes">Notes for Gemini (optional)</label>
            <input
              id="bid-notes"
              className="input"
              placeholder="Optional: what you'd focus on, tools you'd use"
              value={notes}
              maxLength={500}
              onChange={(e) => setNotes(e.target.value)}
            />
            <button type="button" className="btn btn--ink" disabled={aiBusy} onClick={writeWithGemini}>
              <SparkIcon />
              {aiBusy ? 'Writing…' : 'Write proposal with Gemini'}
            </button>
          </div>
          <AIError error={aiError} />
        </div>

        <div className="field">
          <div className="field__top">
            <label className="label" htmlFor="bid-proposal">Proposal</label>
            <span className="counter">{form.proposal.length} / 2000</span>
          </div>
          <textarea
            className="textarea textarea--tall"
            placeholder="Show you understand the problem, explain how you'd do it, and ask one question."
            maxLength={2000}
            {...fieldProps('proposal')}
          />
          {fieldErrors.proposal ? (
            <p className="field-error" id="bid-proposal-error">{fieldErrors.proposal}</p>
          ) : (
            aiFilled && <p className="hint">Gemini's draft is in. Read it through and make it sound like you before sending.</p>
          )}
        </div>

        <div className="row row--end">
          <button type="submit" className="btn btn--primary btn--lg" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send bid'}
          </button>
        </div>
      </form>
    </section>
  );
}

/* ---------- After completion: review box ---------- */

function ReviewBox({ gigId, reviewee, mine, onReviewed }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const firstName = reviewee?.name?.split(' ')[0] || 'them';

  if (mine.status === 'loading') return <section className="card"><Loader label="Checking your review" /></section>;

  if (mine.reviewed) {
    return (
      <section className="card card--pad-lg review-done" aria-labelledby="review-title">
        <div className="card__head">
          <h2 id="review-title" className="card__title">You reviewed this gig</h2>
          <StarRating value={mine.review?.rating} />
        </div>
        {mine.review?.comment && <p className="review-done__text">“{mine.review.comment}”</p>}
        {reviewee && (
          <p className="small muted">
            It's on <Link className="link" to={`/users/${reviewee._id}`}>{firstName}'s profile</Link>.
          </p>
        )}
      </section>
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
      setSending(false);
    }
  };

  return (
    <section className="card card--pad-lg review-box" aria-labelledby="review-title">
      <h2 id="review-title" className="card__title">Review {firstName}</h2>
      <p className="muted small">This gig is complete. How was working with {firstName}? Your review appears on their profile.</p>
      {error && <div className="alert alert--error" role="alert">{error}</div>}
      <form className="form" onSubmit={onSubmit} noValidate>
        <div className="field">
          <span className="label" id="review-rating-label">Rating</span>
          <StarRating value={rating} onChange={(n) => { setRating(n); setError(''); }} size="lg" label="Rating" />
        </div>
        <div className="field">
          <div className="field__top">
            <label className="label" htmlFor="review-comment">Comment <span className="muted">(optional)</span></label>
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
        <div className="row row--end">
          <button type="submit" className="btn btn--primary" disabled={sending}>
            {sending ? 'Sending…' : 'Send review'}
          </button>
        </div>
      </form>
    </section>
  );
}

/* ---------- Q&A comments ---------- */

function Comments({ gig, user, isOwner, location, onChange }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState('');
  const comments = gig.comments || [];

  // Session 11: public Q&A comments
  const onSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) {
      setError('Write your question first');
      return;
    }
    setSending(true);
    setError('');
    try {
      const { data } = await api.post(`/gigs/${gig._id}/comments`, { text: text.trim() });
      onChange(data.comments);
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const remove = async (commentId) => {
    if (!window.confirm('Delete this comment? This cannot be undone.')) return;
    setDeleting(commentId);
    try {
      const { data } = await api.delete(`/gigs/${gig._id}/comments/${commentId}`);
      onChange(data.comments);
      toast.success('Comment deleted');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting('');
    }
  };

  const canDelete = (c) => user && (user.role === 'admin' || isOwner || sameId(c.user, user));

  return (
    <section className="card card--pad-lg" aria-labelledby="qa-title">
      <div className="card__head">
        <h2 id="qa-title" className="card__title">Questions and answers ({comments.length})</h2>
      </div>

      {comments.length === 0 ? (
        <p className="muted small qa-empty">
          No questions yet. {user ? 'Ask the client anything about scope, files or timing.' : 'Log in to ask the client a question.'}
        </p>
      ) : (
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c._id} className="comment">
              <Avatar user={c.user || { name: 'Deleted user' }} size="sm" decorative />
              <div className="comment__body">
                <div className="comment__meta">
                  {c.user ? (
                    <Link className="comment__name" to={`/users/${c.user._id}`}>{c.user.name}</Link>
                  ) : (
                    <span className="comment__name">Deleted user</span>
                  )}
                  {sameId(c.user, gig.client) && <span className="chip chip--accent comment__tag">Client</span>}
                  <span className="small muted">{timeAgo(c.createdAt)}</span>
                  {canDelete(c) && (
                    <button
                      type="button"
                      className="btn btn--danger-ghost btn--sm comment__delete"
                      disabled={deleting === c._id}
                      onClick={() => remove(c._id)}
                    >
                      {deleting === c._id ? 'Deleting…' : 'Delete'}
                    </button>
                  )}
                </div>
                <p className="comment__text">{c.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {user ? (
        <form className="comment-form" onSubmit={onSubmit} noValidate>
          <div className="field">
            <div className="field__top">
              <label className="label" htmlFor="comment-text">{isOwner ? 'Add a comment' : 'Ask a question'}</label>
              <span className="counter">{text.length} / 500</span>
            </div>
            <textarea
              id="comment-text"
              className="textarea textarea--short"
              maxLength={500}
              placeholder={isOwner ? 'Answer a question or add details for everyone' : 'Ask about scope, files or timing'}
              value={text}
              onChange={(e) => { setText(e.target.value); setError(''); }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'comment-error' : undefined}
            />
            {error && <p className="field-error" id="comment-error">{error}</p>}
          </div>
          <div className="row row--end">
            <button type="submit" className="btn btn--secondary" disabled={sending}>
              {sending ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        </form>
      ) : (
        <p className="comment-login">
          <Link className="link" to="/login" state={{ from: location }}>Log in to ask a question</Link>
        </p>
      )}
    </section>
  );
}

/* ---------- Page ---------- */

export default function GigDetails() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [gig, setGig] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [bids, setBids] = useState([]);
  const [bidsStatus, setBidsStatus] = useState('idle'); // idle | loading | ready | error
  const [bidsKey, setBidsKey] = useState(0);
  const [mine, setMine] = useState({ status: 'idle', reviewed: false, review: null });
  const [busy, setBusy] = useState(''); // which action is running: like | delete | complete | hire | chat | withdraw

  // Session 9: the gig detail page - GET /gigs/:id
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    api
      .get(`/gigs/${id}`, { signal: controller.signal })
      .then(({ data }) => {
        setGig(data.gig);
        setStatus('ready');
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err.message);
        setStatus(err.status === 404 ? 'notfound' : 'error');
      });
    return () => controller.abort();
  }, [id, reloadKey]);

  const gigId = gig?._id;
  const clientId = gig?.client?._id;
  const role = user?.role;
  const isOwner = Boolean(user && sameId(clientId, user));
  const isAdmin = role === 'admin';
  const isFreelancer = role === 'freelancer';
  const isHired = Boolean(user && sameId(gig?.assignedFreelancer, user));
  const canSeeBids = Boolean(user && gig && (isOwner || isAdmin || isFreelancer));

  // Owner/admin get every bid; a freelancer gets only their own
  useEffect(() => {
    if (!canSeeBids) {
      setBids([]);
      setBidsStatus('idle');
      return undefined;
    }
    const controller = new AbortController();
    setBidsStatus('loading');
    api
      .get(`/gigs/${gigId}/bids`, { signal: controller.signal })
      .then(({ data }) => {
        setBids(data.bids || []);
        setBidsStatus('ready');
      })
      .catch(() => {
        if (!controller.signal.aborted) setBidsStatus('error');
      });
    return () => controller.abort();
  }, [canSeeBids, gigId, user?._id, bidsKey]);

  // After completion: has the client / hired freelancer already reviewed?
  const canReview = gig?.status === 'completed' && (isOwner || isHired);
  useEffect(() => {
    if (!canReview) return undefined;
    let active = true;
    setMine({ status: 'loading', reviewed: false, review: null });
    api
      .get(`/reviews/gig/${gigId}/mine`)
      .then(({ data }) => {
        if (active) setMine({ status: 'ready', reviewed: data.reviewed, review: data.review });
      })
      .catch(() => {
        if (active) setMine({ status: 'ready', reviewed: false, review: null });
      });
    return () => {
      active = false;
    };
  }, [canReview, gigId]);

  const loginState = { from: location };

  // Session 11: save (like) toggle
  const toggleSave = async () => {
    if (!user) {
      navigate('/login', { state: loginState });
      return;
    }
    setBusy('like');
    try {
      const { data } = await api.post(`/gigs/${gigId}/like`);
      setGig((g) => ({
        ...g,
        likes: data.liked ? [...(g.likes || []), user._id] : (g.likes || []).filter((l) => !sameId(l, user)),
      }));
      toast.success(data.liked ? 'Saved' : 'Removed from saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const deleteGig = async () => {
    if (!window.confirm(`Delete "${gig.title}"? Its bids and comments are deleted too. This cannot be undone.`)) return;
    setBusy('delete');
    try {
      await api.delete(`/gigs/${gigId}`);
      toast.success('Gig deleted');
      navigate(isOwner ? '/dashboard' : '/gigs', { replace: true });
    } catch (err) {
      toast.error(err.message);
      setBusy('');
    }
  };

  const markComplete = async () => {
    const name = gig.assignedFreelancer?.name || 'the freelancer';
    if (!window.confirm(`Mark this gig as complete? You and ${name} can then review each other.`)) return;
    setBusy('complete');
    try {
      const { data } = await api.patch(`/gigs/${gigId}/complete`);
      setGig((g) => ({ ...g, status: data.gig.status }));
      toast.success('Gig marked complete. Leave a review below');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  // Hire: accept the bid, then open the private chat the server created (Sessions 12-13)
  const hire = async (bid) => {
    const name = bid.freelancer?.name || 'this freelancer';
    const others = bids.filter((b) => b.status === 'pending' && b._id !== bid._id).length;
    const rest = others ? ` ${plural(others, 'other pending bid')} will be rejected.` : '';
    if (!window.confirm(`Hire ${name} for ${formatINR(bid.amount)}?${rest}`)) return;
    setBusy('hire');
    try {
      const { data } = await api.patch(`/bids/${bid._id}/accept`);
      toast.success(`You hired ${name}. Say hello in the chat`);
      navigate(`/chat/${data.conversationId}`);
    } catch (err) {
      toast.error(err.message);
      setBusy('');
      setBidsKey((k) => k + 1);
    }
  };

  // POST /chat/conversations finds or creates the chat, linked to this gig
  const openChat = useCallback(
    async (userId) => {
      setBusy('chat');
      try {
        const { data } = await api.post('/chat/conversations', { userId, gigId });
        navigate(`/chat/${data.conversation._id}`);
      } catch (err) {
        toast.error(err.message);
        setBusy('');
      }
    },
    [gigId, navigate]
  );

  const withdraw = async (bid) => {
    if (!window.confirm('Withdraw your bid? You can bid again while the gig is open.')) return;
    setBusy('withdraw');
    try {
      const { data } = await api.patch(`/bids/${bid._id}/withdraw`);
      setBids([{ ...bid, ...data.bid, freelancer: bid.freelancer }]);
      setGig((g) => ({ ...g, bidsCount: Math.max(0, (g.bidsCount || 0) - 1) }));
      toast.success('Bid withdrawn');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy('');
    }
  };

  const onBidPlaced = (bid) => {
    setBids([bid]);
    setGig((g) => ({ ...g, bidsCount: (g.bidsCount || 0) + 1 }));
  };

  if (status === 'loading') return <Loader full label="Loading gig" />;

  if (status === 'notfound') {
    return (
      <div className="container page">
        <EmptyState
          title="This gig doesn't exist or was removed"
          text="The client may have deleted it, or the link is wrong. Browse the open gigs instead."
          action={<Link className="btn btn--primary" to="/gigs">Browse gigs</Link>}
        />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="container page">
        <EmptyState
          title="Couldn't load this gig"
          text={`${error}. Check your connection and try again.`}
          action={
            <button type="button" className="btn btn--primary" onClick={() => setReloadKey((k) => k + 1)}>
              Try again
            </button>
          }
        />
      </div>
    );
  }

  const client = gig.client || {};
  const likes = gig.likes || [];
  const liked = Boolean(user && likes.some((l) => sameId(l, user)));
  const canEdit = isOwner && gig.status === 'open';
  const canDelete = isAdmin || (isOwner && gig.status !== 'in-progress');
  const canComplete = isOwner && gig.status === 'in-progress';
  const myBid = isFreelancer && bidsStatus === 'ready' ? bids[0] : null;
  const deadlinePassed = gig.deadline && new Date(gig.deadline) < new Date();

  // The role-specific block under the description
  let roleSection = null;
  if (authLoading) {
    roleSection = null;
  } else if (!user) {
    roleSection = gig.status === 'open' && (
      <section className="card card--pad-lg callout">
        <div>
          <h2 className="card__title">Want to work on this?</h2>
          <p className="muted small">Log in with a freelancer account to send a price, a delivery time and your plan.</p>
        </div>
        <div className="callout__actions">
          <Link className="btn btn--primary" to="/login" state={loginState}>Log in to bid</Link>
          <Link className="btn btn--ghost" to="/register?role=freelancer" state={loginState}>Create a freelancer account</Link>
        </div>
      </section>
    );
  } else if (isOwner || isAdmin) {
    roleSection = (
      <BidList
        bids={bids}
        status={bidsStatus}
        canHire={isOwner && gig.status === 'open'}
        busy={Boolean(busy)}
        onHire={hire}
        onMessage={openChat}
        onRetry={() => setBidsKey((k) => k + 1)}
      />
    );
  } else if (isFreelancer) {
    if (bidsStatus === 'loading' || bidsStatus === 'idle') {
      roleSection = <section className="card"><Loader label="Checking your bid" /></section>;
    } else if (bidsStatus === 'error') {
      roleSection = (
        <div className="alert alert--error" role="alert">
          Couldn't check whether you've bid on this gig.{' '}
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setBidsKey((k) => k + 1)}>Try again</button>
        </div>
      );
    } else if (myBid && myBid.status !== 'withdrawn') {
      roleSection = <MyBid bid={myBid} gigStatus={gig.status} busy={busy === 'withdraw'} onWithdraw={() => withdraw(myBid)} />;
    } else if (gig.status === 'open') {
      roleSection = <BidForm key={myBid?._id || 'new'} gig={gig} previous={myBid} onPlaced={onBidPlaced} />;
    } else {
      roleSection = (
        <section className="card card--pad-lg callout">
          <p className="muted">This gig isn't taking bids any more. <Link className="link" to="/gigs">Find open gigs</Link></p>
        </section>
      );
    }
  } else if (role === 'client') {
    roleSection = (
      <section className="card card--pad-lg callout">
        <p className="muted">
          You're logged in as a client, so you can't bid. Only freelancer accounts can send bids.
        </p>
      </section>
    );
  }

  return (
    <div className="container page gig-page">
      <Link className="back-link" to="/gigs">
        <span aria-hidden="true">←</span> All gigs
      </Link>

      <div className="layout-2col">
        <div className="layout-2col__main">
          <section className="card card--pad-lg gig-head">
            <div className="gig-head__top">
              <span className="eyebrow">{gig.category}</span>
              <StatusPill status={gig.status} />
            </div>

            <div className="gig-head__main">
              <h1 className="gig-head__title">{gig.title}</h1>
              <PriceTag amount={gig.budget} size="lg" label="Budget" />
            </div>

            <ul className="gig-head__meta">
              <li>Posted {timeAgo(gig.createdAt)}</li>
              <li>
                {gig.deadline ? (
                  <>
                    Deadline <strong>{formatDate(gig.deadline)}</strong>
                    {gig.status === 'open' && (
                      <span className={deadlinePassed ? 'gig-head__late' : 'muted'}>
                        {' '}({deadlinePassed ? 'passed' : timeAgo(gig.deadline)})
                      </span>
                    )}
                  </>
                ) : (
                  'No fixed deadline'
                )}
              </li>
              <li><strong>{plural(gig.bidsCount, 'bid')}</strong></li>
              {gig.assignedFreelancer && (
                <li>
                  Hired{' '}
                  <Link className="link" to={`/users/${gig.assignedFreelancer._id}`}>{gig.assignedFreelancer.name}</Link>
                </li>
              )}
            </ul>

            <div className="gig-head__actions">
              <button
                type="button"
                className={`btn btn--secondary save-btn${liked ? ' is-saved' : ''}`}
                aria-pressed={liked}
                aria-label={`${liked ? 'Saved' : 'Save this gig'}, ${plural(likes.length, 'save')}`}
                disabled={busy === 'like'}
                onClick={toggleSave}
              >
                <BookmarkIcon filled={liked} />
                {liked ? 'Saved' : 'Save'}
                <span className="save-btn__count" aria-hidden="true">{likes.length}</span>
              </button>

              {(canEdit || canDelete || canComplete) && <span className="spacer" />}
              {canComplete && (
                <button type="button" className="btn btn--ink" disabled={Boolean(busy)} onClick={markComplete}>
                  {busy === 'complete' ? 'Saving…' : 'Mark complete'}
                </button>
              )}
              {canEdit && (
                <Link className="btn btn--secondary" to={`/gigs/${gigId}/edit`}>Edit gig</Link>
              )}
              {canDelete && (
                <button type="button" className="btn btn--danger-ghost" disabled={Boolean(busy)} onClick={deleteGig}>
                  {busy === 'delete' ? 'Deleting…' : 'Delete gig'}
                </button>
              )}
            </div>
            {isOwner && gig.status === 'in-progress' && (
              <p className="small muted">You can't edit or delete a gig while someone is working on it.</p>
            )}
          </section>

          <section className="card card--pad-lg" aria-labelledby="about-title">
            <h2 id="about-title" className="card__title gig-about__title">About this gig</h2>
            <p className="gig-about__text">{gig.description}</p>
            {gig.skills?.length > 0 && (
              <>
                <h3 className="gig-about__label">Skills needed</h3>
                <ul className="chips" aria-label="Skills needed">
                  {gig.skills.map((s) => (
                    <li key={s} className="chip">{s}</li>
                  ))}
                </ul>
              </>
            )}
          </section>

          {canReview && (
            <ReviewBox
              gigId={gigId}
              reviewee={isOwner ? gig.assignedFreelancer : client}
              mine={mine}
              onReviewed={(review) => setMine({ status: 'ready', reviewed: true, review })}
            />
          )}

          {roleSection}

          <Comments
            gig={gig}
            user={user}
            isOwner={isOwner}
            location={location}
            onChange={(comments) => setGig((g) => ({ ...g, comments }))}
          />
        </div>

        <aside className="layout-2col__side" aria-label="About the client">
          <section className="card side-card client-card">
            <p className="eyebrow">{isOwner ? 'You posted this gig' : 'About the client'}</p>
            <div className="person-card__name">
              <Avatar user={client} size="lg" />
              <span className="client-card__who">
                <Link className="client-card__name" to={`/users/${client._id}`}>{client.name}</Link>
                {client.headline && <span className="person__sub">{client.headline}</span>}
              </span>
            </div>
            <StarRating value={client.rating?.average} count={client.rating?.count || 0} size="sm" />
            <dl className="client-card__facts">
              {client.location && (
                <div>
                  <dt>Location</dt>
                  <dd>{client.location}</dd>
                </div>
              )}
              {client.createdAt && (
                <div>
                  <dt>Member since</dt>
                  <dd>{memberSince(client.createdAt)}</dd>
                </div>
              )}
            </dl>
            <div className="stack" style={{ '--gap': '8px' }}>
              {!isOwner && user && (
                <button
                  type="button"
                  className="btn btn--primary btn--block"
                  disabled={busy === 'chat'}
                  onClick={() => openChat(client._id)}
                >
                  {busy === 'chat' ? 'Opening chat…' : 'Message client'}
                </button>
              )}
              {!user && !authLoading && (
                <Link className="btn btn--primary btn--block" to="/login" state={loginState}>
                  Log in to message
                </Link>
              )}
              <Link className="btn btn--secondary btn--block" to={`/users/${client._id}`}>
                View profile
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
