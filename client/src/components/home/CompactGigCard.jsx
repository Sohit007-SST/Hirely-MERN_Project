// CompactGigCard: a small gig card for the landing page grid - category, title (whole card is the link), client, budget, bids and age.
// Props: { gig } (one item of GET /gigs)
import { Link } from 'react-router-dom';
import { Avatar, BudgetBadge } from '../ui';
import { plural, timeAgo } from '../../utils/format';

export default function CompactGigCard({ gig }) {
  return (
    <article className="ui-card home-gigcard">
      <span className="home-gigcard__cat">{gig.category}</span>
      <h3 className="home-gigcard__title">
        <Link to={`/gigs/${gig._id}`} className="stretched-link">{gig.title}</Link>
      </h3>
      <p className="home-gigcard__client">
        <Avatar user={gig.client} size={24} decorative />
        <span>{gig.client?.name}</span>
      </p>
      <div className="home-gigcard__foot">
        <BudgetBadge amount={gig.budget} size="sm" />
        <span className="home-gigcard__meta">
          {plural(gig.bidsCount, 'bid')} · {timeAgo(gig.createdAt)}
        </span>
      </div>
    </article>
  );
}
