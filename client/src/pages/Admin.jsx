import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Briefcase, CircleCheck, Gavel, Search, Star, UserX, Users } from 'lucide-react';
import api from '../api/axios';
import { Layout } from '../components/shell';
import { BudgetBadge, Button, Card, EmptyState, Modal, Pagination, SkeletonRow } from '../components/ui';
import AdminUserRow from '../components/rest/AdminUserRow';
import StatTile, { StatTilesSkeleton } from '../components/rest/StatTile';
import useDebounce from '../utils/useDebounce';
import { plural, sameId } from '../utils/format';

// Session 6: every number here comes from one aggregation endpoint (GET /admin/stats)
function StatTiles({ stats }) {
  if (!stats) return <StatTilesSkeleton count={6} />;
  const { users, gigs, bids, reviews, completedValue } = stats;
  return (
    <div className="rest-stats rest-stats--admin">
      <StatTile
        icon={Users}
        label="Users"
        value={users.total}
        hint={`${plural(users.client, 'client')} · ${plural(users.freelancer, 'freelancer')} · ${plural(users.admin, 'admin')}`}
      />
      <StatTile icon={UserX} tone="danger" label="Suspended accounts" value={users.banned} hint="Can't sign in until restored" />
      <StatTile
        icon={Briefcase}
        label="Gigs"
        value={gigs.total}
        hint={`${gigs.open} open · ${gigs['in-progress']} in progress · ${gigs.completed} completed · ${gigs.cancelled} cancelled`}
      />
      <StatTile icon={Gavel} label="Bids" value={bids} hint="All bids ever placed" />
      <StatTile icon={Star} label="Reviews" value={reviews} hint="Left by clients and freelancers" />
      <StatTile
        icon={CircleCheck}
        tone="money"
        label="Value of completed gigs"
        value={<BudgetBadge amount={completedValue} size="md" />}
        hint="Sum of their budgets"
      />
    </div>
  );
}

export default function Admin() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);

  const [stats, setStats] = useState(null);
  const [statsError, setStatsError] = useState('');
  const [data, setData] = useState({ users: [], page: 1, pages: 1, total: 0 });
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [busyId, setBusyId] = useState(null);
  const [confirming, setConfirming] = useState(null); // the user waiting for "Suspend" confirmation
  const cancelRef = useRef(null);

  // Session 14: debounced search, kept in the URL (?q=) so it survives a refresh
  const [search, setSearch] = useState(q);
  const debounced = useDebounce(search.trim(), 400);

  useEffect(() => {
    if (debounced === q) return;
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (debounced) next.set('q', debounced);
        else next.delete('q');
        next.delete('page'); // a new search starts on page 1
        return next;
      },
      { replace: true }
    );
  }, [debounced]); // only when the typed text settles - not when the URL changes

  // Back/forward changed the URL: show that search in the box
  useEffect(() => {
    if (q !== debounced) setSearch(q);
  }, [q]);

  const loadStats = useCallback(async () => {
    try {
      const { data: res } = await api.get('/admin/stats');
      setStats(res.stats);
      setStatsError('');
    } catch (err) {
      setStatsError(err.message);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  useEffect(() => {
    let active = true;
    setStatus('loading');
    api
      .get('/admin/users', { params: { q: q || undefined, page } })
      .then(({ data: res }) => {
        if (!active) return;
        setData(res);
        setStatus('ready');
      })
      .catch((err) => {
        if (!active) return;
        setError(err.message);
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [q, page, attempt]);

  const goToPage = (p) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (p > 1) next.set('page', String(p));
      else next.delete('page');
      return next;
    });
  };

  // PATCH toggles isBanned; the row updates in place and the stats refresh
  const toggleBan = async (u) => {
    setBusyId(u._id);
    try {
      const { data: res } = await api.patch(`/admin/users/${u._id}/ban`);
      const banned = res.user.isBanned;
      setData((d) => ({ ...d, users: d.users.map((x) => (sameId(x, u) ? { ...x, isBanned: banned } : x)) }));
      toast.success(banned ? `${u.name} is suspended` : `${u.name} can use Hirely again`);
      loadStats();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
      setConfirming(null);
    }
  };

  // Suspend asks first (in the Modal); restore is harmless so it runs straight away
  const onToggle = (u) => (u.isBanned ? toggleBan(u) : setConfirming(u));

  const { users, pages, total } = data;
  const loading = status === 'loading';

  return (
    <Layout variant="full" className="rest-admin">
      <Card padded={false} className="rest-admin-head">
        <div className="rest-dash-head">
          <div className="rest-dash-head__text">
            <h1 className="rest-dash-head__title">Admin</h1>
            <p className="rest-dash-head__sub">Platform numbers and user accounts.</p>
          </div>
        </div>
        <div className="rest-dash-card__stats">
          {statsError ? (
            <div className="rest-alert rest-alert--row" role="alert">
              <span>Couldn't load the platform stats. {statsError}.</span>
              <Button variant="secondary" size="sm" onClick={loadStats}>
                Try again
              </Button>
            </div>
          ) : (
            <StatTiles stats={stats} />
          )}
        </div>
      </Card>

      <Card
        padded={false}
        className="rest-admin-users"
        title="Users"
        action={
          <div className="rest-search">
            <label className="ui-sr-only" htmlFor="admin-search">
              Search users by name or email
            </label>
            <Search className="rest-search__icon" size={16} aria-hidden="true" focusable="false" />
            <input
              id="admin-search"
              className="rest-search__input"
              type="search"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>
        }
      >
        <p className="rest-admin-users__count" aria-live="polite">
          {status === 'ready' && (q ? `${plural(total, 'match', 'matches')} for "${q}"` : plural(total, 'account'))}
        </p>

        {status === 'error' ? (
          <EmptyState
            compact
            title="Couldn't load users"
            text={`${error}.`}
            action={<Button onClick={() => setAttempt((n) => n + 1)}>Try again</Button>}
          />
        ) : loading && !users.length ? (
          <div className="rest-admin-users__state">
            <SkeletonRow count={6} label="Loading users" />
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            compact
            icon={Search}
            title={q ? `No users match "${q}"` : 'No users yet'}
            text={q ? 'Check the spelling, or search by email address instead.' : 'New sign-ups will appear here.'}
            action={
              q && (
                <Button variant="secondary" onClick={() => setSearch('')}>
                  Clear search
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className="rest-admin-cols" aria-hidden="true">
              <span>Name</span>
              <span>Role</span>
              <span>Joined</span>
              <span>Status</span>
              <span />
            </div>
            <ul
              className={`rest-admin-list${loading ? ' is-busy' : ''}`}
              aria-busy={loading}
              aria-label="User accounts, newest first"
            >
              {users.map((u) => (
                <AdminUserRow key={u._id} user={u} busy={busyId === u._id} onToggle={onToggle} />
              ))}
            </ul>
            <div className="rest-admin-users__pages">
              <Pagination page={page} pages={pages} onChange={goToPage} />
            </div>
          </>
        )}
      </Card>

      <Modal
        open={Boolean(confirming)}
        onClose={() => busyId || setConfirming(null)}
        title={confirming ? `Suspend ${confirming.name}?` : 'Suspend account?'}
        initialFocusRef={cancelRef}
        footer={
          <>
            <Button ref={cancelRef} variant="tertiary" onClick={() => setConfirming(null)} disabled={Boolean(busyId)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => toggleBan(confirming)}
              loading={Boolean(busyId)}
              loadingText="Suspending…"
            >
              Suspend
            </Button>
          </>
        }
      >
        <p className="rest-modal-text">
          They won't be able to sign in or use Hirely until you restore the account. You can restore it at any time.
        </p>
      </Modal>
    </Layout>
  );
}
