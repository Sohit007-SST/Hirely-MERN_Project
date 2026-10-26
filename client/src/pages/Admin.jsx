import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import Pagination from '../components/Pagination';
import PriceTag from '../components/PriceTag';
import StatusPill from '../components/StatusPill';
import useDebounce from '../utils/useDebounce';
import { formatDate, plural, sameId } from '../utils/format';

const ROLE_LABEL = { client: 'Client', freelancer: 'Freelancer', admin: 'Admin' };

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// Session 6: every number here comes from one aggregation endpoint (GET /admin/stats)
function StatCards({ stats }) {
  if (!stats) {
    return (
      <div className="stats admin-stats" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="stat">
            <span className="skeleton skeleton--text" />
            <span className="skeleton admin-stat-skeleton" />
          </div>
        ))}
      </div>
    );
  }

  const { users, gigs, bids, reviews, completedValue } = stats;
  return (
    <div className="stats admin-stats">
      <div className="stat stat--ink">
        <span className="stat__label">Users</span>
        <span className="stat__value">{users.total}</span>
        <span className="stat__hint">
          {plural(users.client, 'client')} · {plural(users.freelancer, 'freelancer')} · {plural(users.admin, 'admin')}
        </span>
      </div>
      <div className="stat stat--rust">
        <span className="stat__label">Suspended accounts</span>
        <span className="stat__value">{users.banned}</span>
        <span className="stat__hint">Can't log in until restored</span>
      </div>
      <div className="stat stat--teal">
        <span className="stat__label">Gigs</span>
        <span className="stat__value">{gigs.total}</span>
        <span className="stat__hint">
          {gigs.open} open · {gigs['in-progress']} in progress · {gigs.completed} completed · {gigs.cancelled} cancelled
        </span>
      </div>
      <div className="stat stat--marigold">
        <span className="stat__label">Bids</span>
        <span className="stat__value">{bids}</span>
        <span className="stat__hint">All bids ever placed</span>
      </div>
      <div className="stat stat--marigold">
        <span className="stat__label">Reviews</span>
        <span className="stat__value">{reviews}</span>
        <span className="stat__hint">Left by clients and freelancers</span>
      </div>
      <div className="stat stat--teal">
        <span className="stat__label">Value of completed gigs</span>
        <span className="admin-stat-tag">
          <PriceTag amount={completedValue} size="md" />
        </span>
        <span className="stat__hint">Sum of their budgets</span>
      </div>
    </div>
  );
}

function UserRow({ user, busy, onToggle }) {
  const isAdmin = user.role === 'admin';
  return (
    <tr>
      <td>
        <Link className="person admin-user" to={`/users/${user._id}`}>
          <Avatar user={user} size="sm" decorative />
          <span className="person__name">{user.name}</span>
        </Link>
      </td>
      <td className="admin-email">{user.email}</td>
      <td>{ROLE_LABEL[user.role] || user.role}</td>
      <td>
        <StatusPill status={user.isBanned ? 'suspended' : 'active'} />
      </td>
      <td className="admin-date">{formatDate(user.createdAt)}</td>
      <td className="table__num">
        {isAdmin ? (
          <span className="muted small">Can't be suspended</span>
        ) : (
          <button
            type="button"
            className={`btn btn--sm ${user.isBanned ? 'btn--secondary' : 'btn--danger-ghost'}`}
            onClick={() => onToggle(user)}
            disabled={busy}
            aria-label={`${user.isBanned ? 'Restore' : 'Suspend'} ${user.name}`}
          >
            {busy ? 'Saving…' : user.isBanned ? 'Restore' : 'Suspend'}
          </button>
        )}
      </td>
    </tr>
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

  // Suspend asks first; restore is harmless so it runs straight away
  const toggleBan = async (u) => {
    if (
      !u.isBanned &&
      !window.confirm(`Suspend ${u.name}? They won't be able to log in or use GigBazaar until you restore the account.`)
    ) {
      return;
    }
    setBusyId(u._id);
    try {
      const { data: res } = await api.patch(`/admin/users/${u._id}/ban`);
      const banned = res.user.isBanned;
      setData((d) => ({ ...d, users: d.users.map((x) => (sameId(x, u) ? { ...x, isBanned: banned } : x)) }));
      toast.success(banned ? `${u.name} is suspended` : `${u.name} can use GigBazaar again`);
      loadStats();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const { users, pages, total } = data;
  const loading = status === 'loading';

  return (
    <div className="container page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Admin</h1>
          <p className="page-sub">Platform numbers and user accounts.</p>
        </div>
      </div>

      {statsError ? (
        <div className="alert alert--error admin-alert" role="alert">
          Couldn't load the platform stats. {statsError}.{' '}
          <button type="button" className="btn btn--secondary btn--sm" onClick={loadStats}>
            Try again
          </button>
        </div>
      ) : (
        <StatCards stats={stats} />
      )}

      <section aria-labelledby="admin-users-title">
        <div className="admin-users-head">
          <div>
            <h2 id="admin-users-title" className="card__title">Users</h2>
            <p className="muted small" aria-live="polite">
              {status === 'ready' && (q ? `${plural(total, 'match', 'matches')} for "${q}"` : plural(total, 'account'))}
            </p>
          </div>
          <div className="admin-search">
            <label className="sr-only" htmlFor="admin-search">Search users by name or email</label>
            <span className="admin-search__icon"><SearchIcon /></span>
            <input
              id="admin-search"
              className="input admin-search__input"
              type="search"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
            />
          </div>
        </div>

        {status === 'error' ? (
          <EmptyState
            compact
            title="Couldn't load users"
            text={`${error}.`}
            action={
              <button type="button" className="btn btn--primary" onClick={() => setAttempt((n) => n + 1)}>
                Try again
              </button>
            }
          />
        ) : loading && !users.length ? (
          <Loader label="Loading users" />
        ) : users.length === 0 ? (
          <EmptyState
            compact
            title={q ? `No users match "${q}"` : 'No users yet'}
            text={q ? 'Check the spelling, or search by email address instead.' : 'New sign-ups will appear here.'}
            action={
              q && (
                <button type="button" className="btn btn--secondary" onClick={() => setSearch('')}>
                  Clear search
                </button>
              )
            }
          />
        ) : (
          <>
            <div className={`table-wrap${loading ? ' is-busy' : ''}`} aria-busy={loading}>
              <table className="table admin-table">
                <caption className="sr-only">User accounts, newest first</caption>
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Email</th>
                    <th scope="col">Role</th>
                    <th scope="col">Status</th>
                    <th scope="col">Joined</th>
                    <th scope="col" className="table__num">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <UserRow key={u._id} user={u} busy={busyId === u._id} onToggle={toggleBan} />
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} pages={pages} onChange={goToPage} />
          </>
        )}
      </section>
    </div>
  );
}
