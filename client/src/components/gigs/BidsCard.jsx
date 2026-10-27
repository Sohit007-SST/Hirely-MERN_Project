// BidsCard: the owner's (and admin's) "Bids (n)" card - one row per bid with Message and "Hire for ₹X".
// Withdrawn bids are hidden, rejected ones dimmed, and the hired bid gets a green "Hired" pill and a light green background.
// Props: { bids, status: 'loading'|'ready'|'error', canHire, busy, onHire(bid), onMessage(userId), onRetry }
import { Link } from 'react-router-dom';
import { Check, MessageSquare, Users } from 'lucide-react';
import { Avatar, BudgetBadge, Button, Card, EmptyState, SeeMore, SkeletonRow, StarRating, StatusPill } from '../ui';
import { formatINR, plural, timeAgo } from '../../utils/format';

// Hired first, then pending, then rejected
const BID_ORDER = { accepted: 0, pending: 1, rejected: 2, withdrawn: 3 };

function BidRow({ bid, canHire, busy, onHire, onMessage }) {
  const f = bid.freelancer || {};
  const hired = bid.status === 'accepted';
  const classes = ['gigs-bid', hired && 'gigs-bid--hired', bid.status === 'rejected' && 'gigs-bid--dim'].filter(Boolean).join(' ');

  return (
    <li className={classes}>
      <div className="gigs-bid__head">
        <Avatar user={f} size={48} decorative />
        <div className="gigs-bid__who">
          <Link className="gigs-bid__name" to={`/users/${f._id}`}>{f.name || 'Freelancer'}</Link>
          <StarRating value={f.rating?.average} count={f.rating?.count || 0} size="sm" />
          {f.headline && <span className="gigs-bid__headline">{f.headline}</span>}
        </div>
        {hired ? (
          <span className="gigs-hired-pill"><Check size={14} aria-hidden="true" focusable="false" />Hired</span>
        ) : (
          bid.status !== 'pending' && <StatusPill status={bid.status} />
        )}
      </div>

      <p className="gigs-bid__terms">
        <span className="gigs-bid__amount">{formatINR(bid.amount)}</span>
        <span>in {plural(bid.deliveryDays, 'day')}</span>
        <span className="gigs-muted">· sent {timeAgo(bid.createdAt)}</span>
      </p>

      <SeeMore className="gigs-bid__proposal">{bid.proposal}</SeeMore>

      <div className="gigs-bid__actions">
        <Button variant="tertiary" size="sm" icon={MessageSquare} disabled={busy} onClick={() => onMessage(f._id)}>
          Message
        </Button>
        {canHire && bid.status === 'pending' && (
          <Button size="sm" disabled={busy} onClick={() => onHire(bid)}>
            Hire for {formatINR(bid.amount)}
          </Button>
        )}
      </div>
    </li>
  );
}

export default function BidsCard({ bids, status, canHire, busy, onHire, onMessage, onRetry }) {
  const visible = bids
    .filter((b) => b.status !== 'withdrawn')
    .sort((a, b) => BID_ORDER[a.status] - BID_ORDER[b.status]);

  return (
    <Card id="bids" className="gigs-anchor" title={status === 'ready' ? `Bids (${visible.length})` : 'Bids'} padded={false}>
      {status === 'loading' && <SkeletonRow count={2} label="Loading bids" />}
      {status === 'error' && (
        <div className="gigs-alert gigs-alert--error gigs-pad" role="alert">
          Couldn't load the bids.
          <Button variant="tertiary" size="sm" onClick={onRetry}>Try again</Button>
        </div>
      )}
      {status === 'ready' && visible.length === 0 && (
        <EmptyState
          compact
          icon={Users}
          titleAs="h3"
          title="No bids yet"
          text="Share your gig to get bids sooner. New bids show up here."
        />
      )}
      {status === 'ready' && visible.length > 0 && (
        <ul className="gigs-bids">
          {visible.map((bid) => (
            <BidRow key={bid._id} bid={bid} canHire={canHire} busy={busy} onHire={onHire} onMessage={onMessage} />
          ))}
        </ul>
      )}
    </Card>
  );
}
