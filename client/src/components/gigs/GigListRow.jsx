// GigListRow: one result in the /gigs list - client avatar, gig title (teal link), client name, category,
// a small BudgetBadge and "2h ago · 4 bids". The selected row (desktop detail pane) is tinted with a teal left bar.
// Props: { gig, selected?: boolean, onSelect?: (gig) => void (desktop: show in the pane instead of opening the page) }
import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, BudgetBadge } from '../ui';
import { plural, timeAgo } from '../../utils/format';
import { isFresh } from './gigHelpers';

function GigListRow({ gig, selected = false, onSelect }) {
  const client = gig.client || {};

  // Plain clicks pick the row; Ctrl/Cmd/Shift/middle clicks still open the page as a normal link
  const onClick = (e) => {
    if (!onSelect || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onSelect(gig);
  };

  return (
    <li className={`gigs-row${selected ? ' is-selected' : ''}`}>
      <Avatar user={client} size={48} decorative />
      <div className="gigs-row__main">
        <Link className="gigs-row__title" to={`/gigs/${gig._id}`} onClick={onClick} aria-current={selected ? 'true' : undefined}>
          {gig.title}
        </Link>
        <p className="gigs-row__client">{client.name || 'Client'}</p>
        <p className="gigs-row__meta">{gig.category}</p>
        <div className="gigs-row__foot">
          <BudgetBadge amount={gig.budget} size="sm" />
          <span className="gigs-row__when">
            <span className={isFresh(gig.createdAt) ? 'gigs-row__fresh' : undefined}>{timeAgo(gig.createdAt)}</span>
            {' · '}
            {plural(gig.bidsCount, 'bid')}
          </span>
        </div>
      </div>
    </li>
  );
}

export default memo(GigListRow);
