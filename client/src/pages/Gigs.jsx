import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, Plus, RotateCcw, SearchX, WifiOff } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/shell/Layout';
import { Button, EmptyState, Pagination, SkeletonRow } from '../components/ui';
import useDebounce from '../utils/useDebounce';
import { plural } from '../utils/format';
import GigFilterBar from '../components/gigs/GigFilterBar';
import GigListRow from '../components/gigs/GigListRow';
import GigDetailPane from '../components/gigs/GigDetailPane';
import useMediaQuery, { DESKTOP } from '../components/gigs/useMediaQuery';

const PAGE_SIZE = 12;

export default function Gigs() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isDesktop = useMediaQuery(DESKTOP);
  // Session 9: every filter lives in the URL, so a search can be shared, bookmarked or undone with Back
  const [searchParams, setSearchParams] = useSearchParams();

  const urlQ = searchParams.get('q') || '';
  const urlMin = searchParams.get('minBudget') || '';
  const urlMax = searchParams.get('maxBudget') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const selectedId = searchParams.get('selected') || '';

  // Typed filters are debounced; the dropdown choices apply straight away
  const [draft, setDraft] = useState({ q: urlQ, minBudget: urlMin, maxBudget: urlMax });
  const debounced = useDebounce(draft, 400); // Session 14: debounced search

  const [result, setResult] = useState({ gigs: [], total: 0, pages: 1 });
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const listRef = useRef(null);

  // Phones have no detail pane: a shared "?selected=" link opens the gig page instead
  const redirected = useRef(false);
  useEffect(() => {
    if (redirected.current) return;
    redirected.current = true;
    if (!isDesktop && selectedId) navigate(`/gigs/${selectedId}`, { replace: true });
  }, [isDesktop, selectedId, navigate]);

  // Write changes to the URL. Changing a filter goes back to page 1 and clears the selected gig.
  const updateParams = useCallback(
    (changes, options) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(changes).forEach(([key, value]) => {
          if (value) next.set(key, value);
          else next.delete(key);
        });
        if (!('page' in changes) && !('selected' in changes)) next.delete('page');
        if (!('selected' in changes)) next.delete('selected');
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

  // URL -> inputs, when the URL changes from outside (Back button, nav search, Reset)
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

  const onDraft = (name, value) => setDraft((d) => ({ ...d, [name]: value }));

  const clearFilters = () => {
    setDraft({ q: '', minBudget: '', maxBudget: '' });
    setSearchParams({});
  };

  // "All filters" modal: apply everything at once (no debounce)
  const applyAll = (values) => {
    setDraft({ q: values.q, minBudget: values.minBudget, maxBudget: values.maxBudget });
    updateParams({
      q: values.q.trim(),
      category: values.category,
      minBudget: values.minBudget,
      maxBudget: values.maxBudget,
      sort: values.sort === 'newest' ? '' : values.sort,
    });
  };

  const goToPage = (p) => {
    updateParams({ page: p > 1 ? String(p) : '' });
    if (isDesktop) listRef.current?.scrollIntoView({ block: 'start' });
    else window.scrollTo(0, 0);
  };

  // Desktop: show the gig in the pane (replace, so clicking through results doesn't fill the history)
  const selectGig = useCallback((gig) => updateParams({ selected: gig._id }, { replace: true }), [updateParams]);

  // A gig deleted from the pane: drop it from the list and refresh the count
  const onPaneDeleted = (gigId) => {
    setResult((r) => ({ ...r, gigs: r.gigs.filter((g) => g._id !== gigId) }));
    updateParams({ selected: '' }, { replace: true });
    setReloadKey((k) => k + 1);
  };

  const narrowed = Boolean(urlQ || category || urlMin || urlMax); // filters that can hide gigs
  const hasFilters = narrowed || sort !== 'newest'; // anything Reset would clear
  const rangeError =
    draft.minBudget && draft.maxBudget && Number(draft.minBudget) > Number(draft.maxBudget)
      ? 'The minimum is higher than the maximum, so nothing can match.'
      : '';
  const firstLoad = status === 'loading' && result.gigs.length === 0;
  const hasResults = !firstLoad && status !== 'error' && result.gigs.length > 0;
  const paneId = selectedId || result.gigs[0]?._id;

  let summary = '';
  if (status !== 'error' && !firstLoad) {
    summary = plural(result.total, 'result');
    if (urlQ) summary += ` for “${urlQ}”`;
    if (category) summary += ` in ${category}`;
  }

  let listBody;
  if (status === 'error') {
    listBody = (
      <EmptyState
        compact
        icon={WifiOff}
        title="Couldn't load gigs"
        text={`${error}. Check your connection and try again.`}
        action={<Button onClick={() => setReloadKey((k) => k + 1)}>Try again</Button>}
      />
    );
  } else if (firstLoad) {
    listBody = <SkeletonRow count={6} label="Loading gigs" />;
  } else if (result.gigs.length === 0) {
    listBody = narrowed ? (
      <EmptyState
        compact
        icon={SearchX}
        title="No gigs match these filters"
        text="Try a shorter search, widen the budget range or pick another category."
        action={<Button variant="secondary" icon={RotateCcw} onClick={clearFilters}>Reset filters</Button>}
      />
    ) : (
      <EmptyState
        compact
        icon={Briefcase}
        title="No open gigs right now"
        text={
          user?.role === 'client'
            ? 'Post the first one and freelancers can start bidding straight away.'
            : 'New gigs appear here as soon as clients post them. Check back soon.'
        }
        action={
          user?.role === 'client' ? (
            <Button to="/gigs/new" icon={Plus}>Post a gig</Button>
          ) : !user && !authLoading ? (
            <Button to="/register?role=client">Post a gig as a client</Button>
          ) : null
        }
      />
    );
  } else {
    listBody = (
      <>
        <ul className={`gigs-list${status === 'loading' ? ' is-stale' : ''}`} aria-busy={status === 'loading'} aria-label="Gigs">
          {result.gigs.map((gig) => (
            <GigListRow
              key={gig._id}
              gig={gig}
              selected={isDesktop && gig._id === paneId}
              onSelect={isDesktop ? selectGig : undefined}
            />
          ))}
        </ul>
        <div className="gigs-list__pages">
          <Pagination page={page} pages={result.pages} onChange={goToPage} />
        </div>
      </>
    );
  }

  return (
    <>
      <GigFilterBar
        draft={draft}
        onDraft={onDraft}
        category={category}
        sort={sort}
        onCategory={(value) => updateParams({ category: value })}
        onSort={(value) => updateParams({ sort: value === 'newest' ? '' : value })}
        rangeError={rangeError}
        hasFilters={hasFilters}
        onReset={clearFilters}
        onApplyAll={applyAll}
      />
      <Layout variant="full" className="gigs-layout">
        <div className={`gigs-split${isDesktop && hasResults ? ' gigs-split--two' : ''}`}>
          <section ref={listRef} className="ui-card gigs-results" aria-labelledby="gigs-results-title">
            <header className="gigs-results__head">
              <h1 id="gigs-results-title" className="gigs-results__title">Open gigs</h1>
              <p className="gigs-results__count" aria-live="polite">{summary}</p>
            </header>
            {listBody}
          </section>

          {isDesktop && hasResults && paneId && (
            <GigDetailPane
              key={paneId}
              gigId={paneId}
              user={user}
              authLoading={authLoading}
              onDeleted={onPaneDeleted}
            />
          )}
        </div>
      </Layout>
    </>
  );
}
