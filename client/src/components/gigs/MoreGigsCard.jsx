// MoreGigsCard: "More gigs in this category" - 3 other open gigs from GET /gigs?category=…&limit=4 (this gig left out).
// Props: { gigId, category }
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { BudgetBadge, Card, Skeleton } from '../ui';
import { plural, timeAgo } from '../../utils/format';

export default function MoreGigsCard({ gigId, category }) {
  const [gigs, setGigs] = useState(null); // null while loading

  useEffect(() => {
    const controller = new AbortController();
    setGigs(null);
    api
      .get('/gigs', { params: { category, limit: 4 }, signal: controller.signal })
      .then(({ data }) => setGigs((data.gigs || []).filter((g) => String(g._id) !== String(gigId)).slice(0, 3)))
      .catch(() => {
        if (!controller.signal.aborted) setGigs([]);
      });
    return () => controller.abort();
  }, [gigId, category]);

  return (
    <Card
      title="More gigs in this category"
      className="gigs-more"
      footerTo={gigs?.length ? `/gigs?category=${encodeURIComponent(category)}` : undefined}
      footerLabel={`All ${category} gigs`}
    >
      {gigs === null && (
        <div role="status" aria-busy="true" className="gigs-skel-stack">
          <span className="ui-sr-only">Loading more gigs…</span>
          {[0, 1, 2].map((i) => (
            <div key={i} className="gigs-skel-stack">
              <Skeleton width="85%" />
              <Skeleton width="45%" height={12} />
            </div>
          ))}
        </div>
      )}
      {gigs?.length === 0 && <p className="gigs-note">No other open {category} gigs right now.</p>}
      {gigs?.length > 0 && (
        <ul className="gigs-more__list">
          {gigs.map((g) => (
            <li key={g._id} className="gigs-more__item">
              <Link className="gigs-more__title" to={`/gigs/${g._id}`}>{g.title}</Link>
              <p className="gigs-more__meta">
                <BudgetBadge amount={g.budget} size="sm" />
                <span>{timeAgo(g.createdAt)} · {plural(g.bidsCount, 'bid')}</span>
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
