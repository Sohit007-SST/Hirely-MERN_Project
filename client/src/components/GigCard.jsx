// Props: { gig: { _id, title, description, category, skills, budget, bidsCount, status, createdAt, client: { _id, name, avatar } } }
import { memo } from 'react';
import { Link } from 'react-router-dom';
import Avatar from './Avatar';
import PriceTag from './PriceTag';
import StatusPill from './StatusPill';
import { plural, timeAgo, truncate } from '../utils/format';

// Session 14: memo - a card only re-renders when its gig object changes
function GigCard({ gig }) {
  const skills = gig.skills || [];
  const extra = skills.length - 4;

  return (
    <article className="card gig-card">
      <div className="gig-card__top">
        <span className="eyebrow">{gig.category}</span>
        <PriceTag amount={gig.budget} size="sm" />
      </div>

      <h3 className="gig-card__title">
        <Link className="stretched-link" to={`/gigs/${gig._id}`}>
          {gig.title}
        </Link>
      </h3>
      {gig.status && gig.status !== 'open' && <StatusPill status={gig.status} />}

      <p className="gig-card__desc">{truncate(gig.description, 140)}</p>

      {skills.length > 0 && (
        <ul className="chips" aria-label="Skills">
          {skills.slice(0, 4).map((s) => (
            <li key={s} className="chip">{s}</li>
          ))}
          {extra > 0 && <li className="chip chip--more">+{extra}</li>}
        </ul>
      )}

      <div className="gig-card__foot">
        {gig.client && (
          <span className="person person--sm">
            <Avatar user={gig.client} size="xs" decorative />
            <span className="person__name">{gig.client.name}</span>
          </span>
        )}
        <span className="gig-card__meta">
          {plural(gig.bidsCount, 'bid')} · {timeAgo(gig.createdAt)}
        </span>
      </div>
    </article>
  );
}

export default memo(GigCard);
