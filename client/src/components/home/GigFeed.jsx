// GigFeed: the centre column of the home feed - a "Sort by" line, open gigs as GigPost cards and a "Show more gigs" button.
// Props: { canPost?: boolean (clients get a "Post a gig" action in the empty state) }
import { useCallback, useEffect, useRef, useState } from 'react';
import { Briefcase, Check, ChevronDown, Plus, RotateCw } from 'lucide-react';
import api from '../../api/axios';
import { Button, Dropdown, EmptyState, SkeletonPost } from '../ui';
import GigPost from './GigPost';

// Same keys as the server's GET /gigs ?sort=
const SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'budget-high', label: 'Highest budget' },
  { value: 'popular', label: 'Most bids' },
];

// Keeps menu labels lined up with the checked one
const Blank = () => <span className="home-sortbar__blank" aria-hidden="true" />;

// Keep the first copy of each gig (a gig posted between pages shifts the next page by one)
const mergeUnique = (prev, next) => {
  const seen = new Set(prev.map((g) => g._id));
  return [...prev, ...next.filter((g) => !seen.has(g._id))];
};

export default function GigFeed({ canPost = false }) {
  const [sort, setSort] = useState('newest');
  const [gigs, setGigs] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [status, setStatus] = useState('loading'); // loading | more | ready | error
  const [error, setError] = useState('');
  const request = useRef(null);

  // Session 9: GET /gigs?status=open&page=N - page 1 replaces the list, later pages append
  const load = useCallback((pageNo, sortBy) => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setStatus(pageNo === 1 ? 'loading' : 'more');
    setError('');
    api
      .get('/gigs', { params: { status: 'open', page: pageNo, sort: sortBy }, signal: controller.signal })
      .then(({ data }) => {
        setGigs((prev) => (pageNo === 1 ? data.gigs : mergeUnique(prev, data.gigs)));
        setPage(data.page);
        setPages(data.pages);
        setStatus('ready');
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err.message);
        setStatus('error');
      });
  }, []);

  useEffect(() => {
    load(1, sort);
    return () => request.current?.abort();
  }, [load, sort]);

  const sortLabel = SORTS.find((s) => s.value === sort)?.label;
  const hasMore = page < pages;

  return (
    <section className="home-feed" aria-labelledby="home-feed-title" aria-busy={status === 'loading' || status === 'more'}>
      <h2 id="home-feed-title" className="ui-sr-only">Open gigs</h2>

      <div className="home-sortbar">
        <span className="home-sortbar__line" aria-hidden="true" />
        <Dropdown
          align="end"
          label="Sort gigs"
          trigger={
            <button type="button" className="home-sortbar__btn">
              Sort by: <strong>{sortLabel}</strong>
              <ChevronDown size={16} aria-hidden="true" focusable="false" />
            </button>
          }
          items={SORTS.map((s) => ({ label: s.label, icon: s.value === sort ? Check : Blank, onClick: () => setSort(s.value) }))}
        />
      </div>

      {status === 'loading' ? (
        <SkeletonPost count={3} label="Loading gigs" />
      ) : status === 'error' && gigs.length === 0 ? (
        <div className="ui-card">
          <EmptyState
            compact
            titleAs="h3"
            icon={RotateCw}
            title="Couldn't load gigs"
            text={error}
            action={<Button variant="secondary" size="sm" onClick={() => load(1, sort)}>Try again</Button>}
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
            action={canPost && <Button to="/gigs/new" icon={Plus} size="sm">Post the first gig</Button>}
          />
        </div>
      ) : (
        <>
          <ul className="home-feed__list">
            {gigs.map((gig) => (
              <li key={gig._id}>
                <GigPost gig={gig} />
              </li>
            ))}
          </ul>
          {status === 'more' && <SkeletonPost label="Loading more gigs" />}
          {status === 'error' && (
            <p className="home-feed__error" role="alert">
              Couldn't load more gigs. {error}
            </p>
          )}
          {hasMore && status !== 'more' && (
            <Button variant="secondary" block className="home-feed__more" onClick={() => load(page + 1, sort)}>
              {status === 'error' ? 'Try again' : 'Show more gigs'}
            </Button>
          )}
          {!hasMore && status === 'ready' && <p className="home-feed__end">You're all caught up.</p>}
        </>
      )}
    </section>
  );
}
