// GigTopCard: the gig's top card (client line, title, meta line, budget/deadline/status/skills rows, action row).
// Shared by the /gigs detail pane and the /gigs/:id page so both show exactly the same thing.
// Props: { gig, user, authLoading?, titleAs?: 'h1'|'h2' = 'h1', titleLink?: boolean (title links to the gig page),
//          saved, saveCount, saving, onToggleSave, onDelete?: () => void, onComplete?: () => void, completing?: boolean,
//          onPlaceBid?: () => void (details page: scroll to the form; otherwise "Place bid" links to /gigs/:id#bid),
//          bidLabel?: string = 'Place bid' }
import { Link, useLocation } from 'react-router-dom';
import { Bookmark, Briefcase, Check, Clock, MoreHorizontal, Pencil, Send, Trash2, Wrench } from 'lucide-react';
import { Avatar, BudgetBadge, Button, Card, Dropdown, Skeleton, StatusPill } from '../ui';
import { formatDate, plural, timeAgo } from '../../utils/format';
import { gigPermissions } from './gigHelpers';

function Deadline({ gig }) {
  if (!gig.deadline) return <span>No fixed deadline</span>;
  const passed = new Date(gig.deadline) < new Date();
  return (
    <span>
      Deadline <strong>{formatDate(gig.deadline)}</strong>
      {gig.status === 'open' && (
        <span className={passed ? 'gigs-top__late' : 'gigs-muted'}> · {passed ? 'passed' : timeAgo(gig.deadline)}</span>
      )}
    </span>
  );
}

export default function GigTopCard({
  gig,
  user,
  authLoading = false,
  titleAs: Title = 'h1',
  titleLink = false,
  saved,
  saveCount,
  saving,
  onToggleSave,
  onDelete,
  onComplete,
  completing = false,
  onPlaceBid,
  bidLabel = 'Place bid',
}) {
  const location = useLocation();
  const client = gig.client || {};
  const { isOwner, canEdit, canDelete, canComplete } = gigPermissions(gig, user);
  const isOpen = gig.status === 'open';

  const menu = [];
  if (canEdit) menu.push({ label: 'Edit gig', icon: Pencil, to: `/gigs/${gig._id}/edit` });
  if (canDelete && onDelete) menu.push({ label: 'Delete gig', icon: Trash2, danger: true, onClick: onDelete });

  // The main action depends on who is looking
  let primary = null;
  if (!authLoading && !user && isOpen) {
    primary = (
      <Button to="/login" state={{ from: location }} icon={Send}>Log in to bid</Button>
    );
  } else if (user?.role === 'freelancer' && isOpen) {
    primary = onPlaceBid ? (
      <Button icon={Send} onClick={onPlaceBid}>{bidLabel}</Button>
    ) : (
      <Button to={`/gigs/${gig._id}#bid`} icon={Send}>{bidLabel}</Button>
    );
  } else if (canComplete && onComplete) {
    primary = (
      <Button icon={Check} onClick={onComplete} loading={completing} loadingText="Saving…">Mark complete</Button>
    );
  }

  return (
    <Card as="article" className="gigs-top">
      <div className="gigs-top__client">
        <Avatar user={client} size={48} decorative />
        <div className="gigs-top__who">
          <Link className="gigs-top__name" to={`/users/${client._id}`}>{client.name || 'Client'}</Link>
          <span className="gigs-top__headline">{isOwner ? 'You posted this gig' : client.headline || 'Client'}</span>
        </div>
      </div>

      <Title className="gigs-top__title">
        {titleLink ? <Link to={`/gigs/${gig._id}`}>{gig.title}</Link> : gig.title}
      </Title>
      <p className="gigs-top__meta">
        {gig.category} · posted {timeAgo(gig.createdAt)} · {plural(gig.bidsCount, 'bid')}
        {saveCount > 0 && ` · ${saveCount} saved`}
      </p>

      <ul className="gigs-top__facts">
        <li>
          <BudgetBadge amount={gig.budget} size="lg" label="Budget" />
        </li>
        <li>
          <Clock size={18} aria-hidden="true" focusable="false" />
          <Deadline gig={gig} />
        </li>
        <li>
          <Briefcase size={18} aria-hidden="true" focusable="false" />
          <StatusPill status={gig.status} />
          {gig.assignedFreelancer && (
            <span>
              Hired{' '}
              <Link className="gigs-link" to={`/users/${gig.assignedFreelancer._id}`}>{gig.assignedFreelancer.name}</Link>
            </span>
          )}
        </li>
        {gig.skills?.length > 0 && (
          <li>
            <Wrench size={18} aria-hidden="true" focusable="false" />
            <ul className="gigs-chips" aria-label="Skills needed">
              {gig.skills.map((s) => (
                <li key={s} className="gigs-chip">{s}</li>
              ))}
            </ul>
          </li>
        )}
      </ul>

      <div className="gigs-top__actions">
        {primary}
        <Button
          variant="secondary"
          icon={<Bookmark size={18} aria-hidden="true" focusable="false" fill={saved ? 'currentColor' : 'none'} />}
          aria-pressed={saved}
          aria-label={`${saved ? 'Saved' : 'Save this gig'}, ${plural(saveCount, 'save')}`}
          loading={saving}
          onClick={onToggleSave}
        >
          {saved ? 'Saved' : 'Save'}
        </Button>
        {menu.length > 0 && (
          <Dropdown
            align="end"
            label="Gig actions"
            items={menu}
            trigger={<Button variant="tertiary" icon={MoreHorizontal} aria-label="More gig actions" />}
          />
        )}
      </div>
      {isOwner && gig.status === 'in-progress' && (
        <p className="gigs-top__note">You can't edit or delete a gig while someone is working on it.</p>
      )}
    </Card>
  );
}

// Same shape as the card while the gig loads
export function GigTopCardSkeleton() {
  return (
    <div className="ui-card gigs-top gigs-top--skeleton" role="status" aria-busy="true">
      <span className="ui-sr-only">Loading gig…</span>
      <div className="gigs-top__client">
        <Skeleton shape="circle" width={48} height={48} />
        <div className="gigs-top__who">
          <Skeleton width={140} />
          <Skeleton width={100} height={12} />
        </div>
      </div>
      <Skeleton width="80%" height={24} />
      <Skeleton width="50%" height={12} />
      <Skeleton shape="rect" width={140} height={36} />
      <Skeleton width="40%" />
      <Skeleton width="30%" />
      <div className="gigs-top__actions">
        <Skeleton shape="pill" width={112} height={40} />
        <Skeleton shape="pill" width={88} height={40} />
      </div>
    </div>
  );
}
