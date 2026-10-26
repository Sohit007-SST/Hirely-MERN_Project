import { memo, useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import Pagination from '../components/Pagination';
import StarRating from '../components/StarRating';
import useDebounce from '../utils/useDebounce';
import { formatINR, plural } from '../utils/format';

const LIMIT = 12;

// Session 14: memo - a card re-renders only when its freelancer or online state changes
const PersonCard = memo(function PersonCard({ person, online }) {
  const skills = person.skills || [];
  const extra = skills.length - 4;

  return (
    <article className="card person-card fl-card">
      <div className="person-card__name">
        <Avatar user={person} size="lg" online={online} />
        <span className="fl-card__who">
          <span className="fl-card__name">{person.name}</span>
          {person.headline && <span className="fl-card__headline">{person.headline}</span>}
        </span>
      </div>

      <div className="fl-card__meta">
        <StarRating value={person.rating?.average} count={person.rating?.count ?? 0} size="sm" />
        {online && <span className="fl-card__online">Online now</span>}
      </div>

      {skills.length > 0 && (
        <ul className="chips" aria-label="Skills">
          {skills.slice(0, 4).map((s) => (
            <li key={s} className="chip">{s}</li>
          ))}
          {extra > 0 && <li className="chip chip--more">+{extra}</li>}
        </ul>
      )}

      <div className="fl-card__foot">
        <span className="fl-card__rate">
          {person.hourlyRate > 0 ? (
            <>
              <strong>{formatINR(person.hourlyRate)}</strong>
              <span className="muted">/hr</span>
            </>
          ) : (
            <span className="muted">Rate not set</span>
          )}
        </span>
        <Link
          className="btn btn--secondary btn--sm stretched-link"
          to={`/users/${person._id}`}
          aria-label={`View ${person.name}'s profile`}
        >
          View profile
        </Link>
      </div>
    </article>
  );
});

export default function Freelancers() {
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

  return (
    <div className="container page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Freelancers</h1>
          <p className="page-sub">Find people by name, skill or headline. Top rated first.</p>
        </div>
      </header>

      <form className="fl-search" role="search" onSubmit={(e) => e.preventDefault()}>
        <label className="label" htmlFor="fl-search">Search freelancers</label>
        <div className="fl-search__row">
          <input
            id="fl-search"
            className="input"
            type="search"
            placeholder="Try React, logo design or SEO"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
          {search && (
            <button type="button" className="btn btn--ghost" onClick={clearSearch}>
              Clear
            </button>
          )}
        </div>
      </form>

      {status === 'error' ? (
        <div className="alert alert--error dash-error" role="alert">
          <p><strong>Couldn't load freelancers.</strong> {error}</p>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => load()}>
            Try again
          </button>
        </div>
      ) : status === 'loading' && users.length === 0 ? (
        <Loader label="Finding freelancers" />
      ) : users.length === 0 ? (
        q ? (
          <EmptyState
            title={`No freelancers match "${q}"`}
            text="Try a shorter search or a single skill, like React or SEO."
            action={<button type="button" className="btn btn--secondary" onClick={clearSearch}>Clear search</button>}
          />
        ) : (
          <EmptyState
            title="No freelancers yet"
            text="Freelancers show up here as soon as they sign up. Post a gig and they'll come to you."
            action={<Link className="btn btn--primary" to="/gigs/new">Post gig</Link>}
          />
        )
      ) : (
        <>
          <p className="fl-count muted small" aria-live="polite">
            {q ? `${plural(total, 'freelancer')} match "${q}"` : plural(total, 'freelancer')}
            {pages > 1 && ` · page ${page} of ${pages}`}
          </p>
          <div className="grid grid--cards" aria-busy={status === 'loading'}>
            {users.map((u) => (
              <PersonCard key={u._id} person={u} online={isOnline(u._id)} />
            ))}
          </div>
          <Pagination page={page} pages={pages} onChange={goToPage} />
        </>
      )}
    </div>
  );
}
