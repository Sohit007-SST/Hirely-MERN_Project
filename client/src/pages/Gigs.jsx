import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import GigCard from '../components/GigCard';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import useDebounce from '../utils/useDebounce';
import { CATEGORIES, plural } from '../utils/format';

const SORTS = [
  ['newest', 'Newest first'],
  ['oldest', 'Oldest first'],
  ['budget-high', 'Highest budget'],
  ['budget-low', 'Lowest budget'],
  ['popular', 'Most bids'],
];

const PAGE_SIZE = 12;

// Budgets are whole rupees: keep digits only
const digits = (value) => value.replace(/\D/g, '').slice(0, 9);

function SearchIcon() {
  return (
    <svg className="search-field__icon" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16l4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function Gigs() {
  const { user } = useAuth();
  // Session 9: every filter lives in the URL, so a search can be shared, bookmarked or undone with Back
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQ = searchParams.get('q') || '';
  const urlMin = searchParams.get('minBudget') || '';
  const urlMax = searchParams.get('maxBudget') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);

  // Typed filters are debounced; the selects apply straight away
  const [draft, setDraft] = useState({ q: urlQ, minBudget: urlMin, maxBudget: urlMax });
  const debounced = useDebounce(draft, 400); // Session 14: debounced search

  const [result, setResult] = useState({ gigs: [], total: 0, pages: 1 });
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  // Write changes to the URL. Changing any filter goes back to page 1.
  const updateParams = useCallback(
    (changes, options) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) => {
          if (value) next.set(key, value);
          else next.delete(key);
        });
        if (!('page' in changes)) next.delete('page');
        return next;
      }, options);
    },
    [setSearchParams]
  );

  // Debounced text -> URL (replace, so typing doesn't fill the history)
  useEffect(() => {
    const clean = { q: debounced.q.trim(), minBudget: debounced.minBudget, maxBudget: debounced.maxBudget };
    const changes = {};
    Object.entries(clean).forEach(([key, value]) => {
      if (value !== (searchParams.get(key) || '')) changes[key] = value;
    });
    if (Object.keys(changes).length) updateParams(changes, { replace: true });
  }, [debounced]); // only when the debounced text settles

  // URL -> inputs, when the URL changes from outside (Back button, "Clear filters")
  useEffect(() => {
    const ownWrite =
      urlQ === debounced.q.trim() && urlMin === debounced.minBudget && urlMax === debounced.maxBudget;
    if (!ownWrite) setDraft({ q: urlQ, minBudget: urlMin, maxBudget: urlMax });
  }, [urlQ, urlMin, urlMax]);

  // Session 9: GET /gigs with search, filters, sort and pagination (open gigs by default)
  useEffect(() => {
    const controller = new AbortController();
    const params = { page, limit: PAGE_SIZE, sort };
    if (urlQ) params.q = urlQ;
    if (category) params.category = category;
    if (urlMin) params.minBudget = urlMin;
    if (urlMax) params.maxBudget = urlMax;

    setStatus('loading');
    api
      .get('/gigs', { params, signal: controller.signal })
      .then(({ data }) => {
        setResult({ gigs: data.gigs || [], total: data.total || 0, pages: data.pages || 1 });
        setStatus('ready');
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err.message);
        setStatus('error');
      });
    return () => controller.abort();
  }, [urlQ, urlMin, urlMax, category, sort, page, reloadKey]);

  const onDraft = (e) => {
    const { name, value } = e.target;
    setDraft((d) => ({ ...d, [name]: name === 'q' ? value : digits(value) }));
  };

  const clearFilters = () => {
    setDraft({ q: '', minBudget: '', maxBudget: '' });
    setSearchParams({});
  };

  const goToPage = (p) => {
    updateParams({ page: p > 1 ? String(p) : '' });
    window.scrollTo(0, 0);
  };

  const hasFilters = Boolean(urlQ || category || urlMin || urlMax);
  const rangeError =
    draft.minBudget && draft.maxBudget && Number(draft.minBudget) > Number(draft.maxBudget)
      ? 'The minimum is higher than the maximum, so nothing can match.'
      : '';
  const firstLoad = status === 'loading' && result.gigs.length === 0;

  let summary = '';
  if (status !== 'error' && !firstLoad) {
    summary = plural(result.total, 'open gig');
    if (urlQ) summary += ` for “${urlQ}”`;
    if (category) summary += ` in ${category}`;
  }

  return (
    <div className="container page">
      <header className="page-head">
        <div>
          <h1 className="page-title">Find gigs</h1>
          <p className="page-sub">Open work from clients across India. Search, set a budget range and bid on what fits you.</p>
        </div>
        {user?.role === 'client' && (
          <div className="page-actions">
            <Link className="btn btn--primary" to="/gigs/new">Post a gig</Link>
          </div>
        )}
      </header>

      <form className="card gig-filters" role="search" aria-label="Filter gigs" onSubmit={(e) => e.preventDefault()}>
        <div className="field gig-filters__search">
          <label className="label" htmlFor="gig-search">Search</label>
          <div className="search-field">
            <SearchIcon />
            <input
              id="gig-search"
              className="input search-field__input"
              type="search"
              name="q"
              placeholder="Try “React”, “logo” or “blog posts”"
              value={draft.q}
              onChange={onDraft}
              maxLength={100}
              autoComplete="off"
            />
          </div>
        </div>

        <div className="field">
          <label className="label" htmlFor="gig-category">Category</label>
          <select
            id="gig-category"
            className="select"
            value={category}
            onChange={(e) => updateParams({ category: e.target.value })}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <fieldset className="field">
          <legend className="label">Budget (₹)</legend>
          <div className="budget-range">
            <label className="sr-only" htmlFor="gig-min">Minimum budget in rupees</label>
            <input
              id="gig-min"
              className="input"
              name="minBudget"
              inputMode="numeric"
              placeholder="Min"
              value={draft.minBudget}
              onChange={onDraft}
              aria-invalid={Boolean(rangeError)}
              aria-describedby={rangeError ? 'gig-range-error' : undefined}
            />
            <span className="budget-range__dash" aria-hidden="true">–</span>
            <label className="sr-only" htmlFor="gig-max">Maximum budget in rupees</label>
            <input
              id="gig-max"
              className="input"
              name="maxBudget"
              inputMode="numeric"
              placeholder="Max"
              value={draft.maxBudget}
              onChange={onDraft}
              aria-invalid={Boolean(rangeError)}
              aria-describedby={rangeError ? 'gig-range-error' : undefined}
            />
          </div>
        </fieldset>

        <div className="field">
          <label className="label" htmlFor="gig-sort">Sort by</label>
          <select
            id="gig-sort"
            className="select"
            value={sort}
            onChange={(e) => updateParams({ sort: e.target.value === 'newest' ? '' : e.target.value })}
          >
            {SORTS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        {rangeError && (
          <p className="field-error gig-filters__error" id="gig-range-error">{rangeError}</p>
        )}
      </form>

      <div className="gig-results__bar">
        <p className="gig-results__count" aria-live="polite">{summary}</p>
        {hasFilters && (
          <button type="button" className="btn btn--ghost btn--sm" onClick={clearFilters}>
            Clear filters
          </button>
        )}
      </div>

      {status === 'error' ? (
        <EmptyState
          title="Couldn't load gigs"
          text={`${error}. Check your connection and try again.`}
          action={
            <button type="button" className="btn btn--primary" onClick={() => setReloadKey((k) => k + 1)}>
              Try again
            </button>
          }
        />
      ) : firstLoad ? (
        <Loader label="Loading gigs" />
      ) : status === 'ready' && result.gigs.length === 0 ? (
        hasFilters ? (
          <EmptyState
            title="No gigs match these filters"
            text="Try a shorter search, widen the budget range or pick another category."
            action={
              <button type="button" className="btn btn--primary" onClick={clearFilters}>
                Clear filters
              </button>
            }
          />
        ) : (
          <EmptyState
            title="No open gigs right now"
            text={
              user?.role === 'client'
                ? 'Post the first one and freelancers can start bidding straight away.'
                : 'New gigs appear here as soon as clients post them. Check back soon.'
            }
            action={
              user?.role === 'client' ? (
                <Link className="btn btn--primary" to="/gigs/new">Post a gig</Link>
              ) : !user ? (
                <Link className="btn btn--primary" to="/register?role=client">Post a gig as a client</Link>
              ) : null
            }
          />
        )
      ) : (
        <>
          <ul
            className={`grid grid--cards gig-results${status === 'loading' ? ' is-stale' : ''}`}
            aria-busy={status === 'loading'}
            aria-label="Gigs"
          >
            {result.gigs.map((gig) => (
              <li key={gig._id}>
                <GigCard gig={gig} />
              </li>
            ))}
          </ul>
          <Pagination page={page} pages={result.pages} onChange={goToPage} />
        </>
      )}
    </div>
  );
}
