// NewestGigs: the landing page's "Explore open gigs" section - category pills, then the 4 newest open gigs as compact cards.
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Briefcase, Plus, RotateCw } from 'lucide-react';
import api from '../../api/axios';
import { Button, EmptyState, Skeleton } from '../ui';
import { CATEGORIES } from '../../utils/format';
import CompactGigCard from './CompactGigCard';

function CardSkeletons() {
  return (
    <div className="home-gigs__grid" role="status" aria-busy="true">
      <span className="ui-sr-only">Loading gigs…</span>
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="ui-card home-gigcard" aria-hidden="true">
          <Skeleton width="40%" height={12} />
          <Skeleton width="90%" height={18} />
          <Skeleton width="50%" />
          <Skeleton shape="rect" width={88} height={24} />
        </div>
      ))}
    </div>
  );
}

export default function NewestGigs() {
  const [gigs, setGigs] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  // Session 9: the 4 newest open gigs are just GET /gigs with a small limit
  const load = useCallback((signal) => {
    setStatus('loading');
    api
      .get('/gigs', { params: { limit: 4, sort: 'newest' }, signal })
      .then(({ data }) => {
        setGigs(data.gigs || []);
        setStatus('ready');
      })
      .catch((err) => {
        if (signal?.aborted) return;
        setError(err.message);
        setStatus('error');
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return (
    <section className="home-explore" aria-labelledby="home-explore-title">
      <div className="home-explore__head">
        <h2 id="home-explore-title" className="home-explore__title">Explore open gigs</h2>
        <Link to="/gigs" className="home-explore__all">
          See all gigs
          <ArrowRight size={16} aria-hidden="true" focusable="false" />
        </Link>
      </div>

      <ul className="home-explore__pills" aria-label="Categories">
        {CATEGORIES.map((c) => (
          <li key={c}>
            <Link to={`/gigs?category=${encodeURIComponent(c)}`} className="ui-pill">{c}</Link>
          </li>
        ))}
      </ul>

      {status === 'loading' ? (
        <CardSkeletons />
      ) : status === 'error' ? (
        <div className="ui-card">
          <EmptyState
            compact
            titleAs="h3"
            icon={RotateCw}
            title="Couldn't load gigs"
            text={error}
            action={<Button variant="secondary" size="sm" onClick={() => load()}>Try again</Button>}
          />
        </div>
      ) : gigs.length === 0 ? (
        <div className="ui-card">
          <EmptyState
            compact
            titleAs="h3"
            icon={Briefcase}
            title="No open gigs yet"
            text="New gigs show up here as soon as they're posted."
            action={<Button to="/register?role=client" icon={Plus} size="sm">Post the first gig</Button>}
          />
        </div>
      ) : (
        <ul className="home-gigs__grid">
          {gigs.map((gig) => (
            <li key={gig._id}>
              <CompactGigCard gig={gig} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
