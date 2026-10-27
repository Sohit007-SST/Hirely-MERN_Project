import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SearchX, Users } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Layout from '../components/shell/Layout';
import { Button, EmptyState, Pagination, Skeleton } from '../components/ui';
import { ManageNetworkCard, PersonCard } from '../components/people';
import useDebounce from '../utils/useDebounce';
import { plural } from '../utils/format';

const LIMIT = 12;

// Grid placeholders shaped like PersonCard while the first page loads
function PeopleGridSkeleton() {
  return (
    <div className="people-grid" role="status" aria-busy="true">
      <span className="ui-sr-only">Finding freelancers…</span>
      {Array.from({ length: 8 }, (_, i) => (
        <div key={i} className="ui-card people-card people-card--skeleton" aria-hidden="true">
          <Skeleton shape="rect" height={56} className="people-card__skel-cover" />
          <div className="people-card__body">
            <Skeleton shape="circle" width={104} height={104} className="people-card__avatar" />
            <Skeleton width="70%" />
            <Skeleton width="90%" height={12} />
            <Skeleton width="50%" height={12} />
          </div>
          <div className="people-card__foot">
            <Skeleton shape="pill" width="100%" height={32} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Freelancers() {
  const { user } = useAuth();
  const { isOnline } = useSocket();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const [search, setSearch] = useState(q);
  // Session 14: debounced search - one request 400 ms after the user stops typing
  const debounced = useDebounce(search.trim(), 400);

  const [data, setData] = useState({ users: [], pages: 1, total: 0 });
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  // Typing updates ?q= (and drops ?page=) without adding a history entry per keystroke
  useEffect(() => {
    if (debounced !== q) setParams(debounced ? { q: debounced } : {}, { replace: true });
  }, [debounced]);

  // Back/forward changed the URL: show that search in the box
  useEffect(() => {
    if (q !== debounced) setSearch(q);
  }, [q]);

  const load = useCallback(
    (signal) => {
      setStatus('loading');
      api
        .get('/users/freelancers', { params: { q: q || undefined, page, limit: LIMIT }, signal })
        .then(({ data: res }) => {
          setData({ users: res.users || [], pages: res.pages || 1, total: res.total || 0 });
          setStatus('ready');
        })
        .catch((err) => {
          if (signal?.aborted) return;
          setError(err.message);
          setStatus('error');
        });
    },
    [q, page]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const goToPage = (next) => {
    const nextParams = {};
    if (q) nextParams.q = q;
    if (next > 1) nextParams.page = String(next);
    setParams(nextParams);
    window.scrollTo(0, 0);
  };

  const clearSearch = () => {
    setSearch('');
    setParams({});
  };

  const { users, pages, total } = data;

  let results;
  if (status === 'error') {
    results = (
      <div className="people-empty-line people-pad" role="alert">
        <p className="people-error">Couldn't load freelancers. {error}</p>
        <Button size="sm" variant="secondary" onClick={() => load()}>Try again</Button>
      </div>
    );
  } else if (status === 'loading' && users.length === 0) {
    results = <PeopleGridSkeleton />;
  } else if (users.length === 0) {
    results = q ? (
      <EmptyState
        compact
        icon={SearchX}
        title={`No freelancers match "${q}"`}
        text="Try a shorter search or a single skill, like React or SEO."
        action={<Button variant="secondary" onClick={clearSearch}>Clear search</Button>}
      />
    ) : (
      <EmptyState
        compact
        icon={Users}
        title="No freelancers yet"
        text="Freelancers show up here as soon as they sign up. Post a gig and they'll come to you."
        action={<Button to="/gigs/new">Post a gig</Button>}
      />
    );
  } else {
    results = (
      <>
        <div className={`people-grid${status === 'loading' ? ' is-refreshing' : ''}`} aria-busy={status === 'loading'}>
          {users.map((u) => (
            <PersonCard key={u._id} person={u} online={isOnline(u._id)} />
          ))}
        </div>
        <Pagination page={page} pages={pages} onChange={goToPage} />
      </>
    );
  }

  return (
    <Layout variant="two-left" left={user ? <ManageNetworkCard /> : null} className="people-network">
      <section className="ui-card people-network__card" aria-labelledby="network-title">
        <header className="people-network__head">
          <div>
            <h1 id="network-title" className="people-network__title">Freelancers you may want to follow</h1>
            <p className="people-network__count" aria-live="polite">
              {status === 'ready' && total > 0 && (
                <>
                  {q ? `${plural(total, 'freelancer')} match "${q}"` : `${plural(total, 'freelancer')} · top rated first`}
                  {pages > 1 && ` · page ${page} of ${pages}`}
                </>
              )}
            </p>
          </div>

          <form className="people-search" role="search" onSubmit={(e) => e.preventDefault()}>
            <label className="ui-sr-only" htmlFor="people-search">Search freelancers</label>
            <Search className="people-search__icon" size={16} aria-hidden="true" focusable="false" />
            <input
              id="people-search"
              className="people-search__input"
              type="search"
              placeholder="Search by name, skill or headline"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
            {search && (
              <Button variant="tertiary" size="sm" onClick={clearSearch}>Clear</Button>
            )}
          </form>
        </header>

        <div className="people-network__body">{results}</div>
      </section>
    </Layout>
  );
}
