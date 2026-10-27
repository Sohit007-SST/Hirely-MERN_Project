// ActivityCard: what this person does on Hirely - a client's open gigs (newest 3) or a freelancer's completed-gigs count.
// GET /gigs has no "client" filter, so open gigs are fetched once (status=open, newest 50) and filtered here.
// Props: { profile, stats: { gigsPosted? , gigsCompleted? }, isMe: boolean }
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, CheckCircle2 } from 'lucide-react';
import api from '../../api/axios';
import { BudgetBadge, Card, SkeletonRow } from '../ui';
import { plural, sameId, timeAgo } from '../../utils/format';

const SHOWN = 3;

function OpenGigs({ clientId }) {
  const [gigs, setGigs] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setGigs(null);
    setError('');
    api
      .get('/gigs', { params: { status: 'open', limit: 50 }, signal: controller.signal })
      .then(({ data }) => setGigs(data.gigs.filter((g) => sameId(g.client, clientId))))
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      });
    return () => controller.abort();
  }, [clientId]);

  if (error) return <p className="people-error" role="alert">Couldn't load open gigs. {error}</p>;
  if (!gigs) return <SkeletonRow count={2} label="Loading open gigs" />;
  if (!gigs.length) return <p className="people-muted">No open gigs right now.</p>;

  return (
    <ul className="people-activity">
      {gigs.slice(0, SHOWN).map((g) => (
        <li key={g._id} className="people-activity__row">
          <span className="people-activity__icon" aria-hidden="true">
            <Briefcase size={18} focusable="false" />
          </span>
          <div className="people-activity__main">
            <Link className="people-activity__title" to={`/gigs/${g._id}`}>{g.title}</Link>
            <p className="people-activity__meta">
              {g.category} · posted {timeAgo(g.createdAt)} · {plural(g.bidsCount, 'bid')}
            </p>
          </div>
          <BudgetBadge amount={g.budget} size="sm" />
        </li>
      ))}
    </ul>
  );
}

export default function ActivityCard({ profile, stats, isMe }) {
  const isClient = profile.role === 'client';
  if (!isClient && profile.role !== 'freelancer') return null;
  const firstName = profile.name.split(' ')[0];

  return (
    <Card title="Activity" footerTo={isMe ? '/dashboard' : undefined} footerLabel="Show all in your dashboard">
      {isClient ? (
        <>
          <p className="people-activity__sub">
            {isMe ? 'You have' : `${firstName} has`} posted {plural(stats.gigsPosted ?? 0, 'gig')}. Open gigs taking bids:
          </p>
          <OpenGigs clientId={profile._id} />
        </>
      ) : (
        <div className="people-activity__stat">
          <span className="people-activity__icon" aria-hidden="true">
            <CheckCircle2 size={18} focusable="false" />
          </span>
          <p>
            <strong className="people-activity__num">{stats.gigsCompleted ?? 0}</strong>{' '}
            {(stats.gigsCompleted ?? 0) === 1 ? 'gig' : 'gigs'} completed on Hirely
          </p>
        </div>
      )}
    </Card>
  );
}
