import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import PriceTag from '../components/PriceTag';
import StatusPill from '../components/StatusPill';
import { formatDate, formatINR, plural } from '../utils/format';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Loads one list from the API: { items, status, error, reload }
function useMine(url, key) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  const load = useCallback(
    (signal) => {
      setStatus('loading');
      api
        .get(url, { signal })
        .then(({ data }) => {
          setItems(data[key] || []);
          setStatus('ready');
        })
        .catch((err) => {
          if (signal?.aborted) return;
          setError(err.message);
          setStatus('error');
        });
    },
    [url, key]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return { items, status, error, reload: () => load() };
}

function LoadError({ what, error, onRetry }) {
  return (
    <div className="alert alert--error dash-error" role="alert">
      <p><strong>Couldn't load your {what}.</strong> {error}</p>
      <button type="button" className="btn btn--secondary btn--sm" onClick={onRetry}>
        Try again
      </button>
    </div>
  );
}

function StatCard({ tone, label, value, hint }) {
  return (
    <div className={`stat stat--${tone}`}>
      <span className="stat__label">{label}</span>
      <span className="stat__value">{value}</span>
      {hint && <span className="stat__hint">{hint}</span>}
    </div>
  );
}

// Client: taking bids / in progress / completed + a table of their gigs
function ClientDashboard() {
  const { items: gigs, status, error, reload } = useMine('/gigs/mine', 'gigs');

  const counts = useMemo(() => {
    const c = { open: 0, 'in-progress': 0, completed: 0 };
    gigs.forEach((g) => {
      if (c[g.status] !== undefined) c[g.status] += 1;
    });
    return c;
  }, [gigs]);

  if (status === 'loading') return <Loader label="Loading your gigs" />;
  if (status === 'error') return <LoadError what="gigs" error={error} onRetry={reload} />;

  return (
    <>
      <div className="stats">
        <StatCard tone="teal" label="Taking bids" value={counts.open} hint="Open for freelancers to bid" />
        <StatCard tone="marigold" label="In progress" value={counts['in-progress']} hint="Hired and underway" />
        <StatCard tone="ink" label="Completed" value={counts.completed} hint="Finished and ready to review" />
      </div>

      <section aria-labelledby="dash-table-title">
        <div className="dash-section-head">
          <h2 id="dash-table-title" className="card__title">Your gigs</h2>
          {gigs.length > 0 && <span className="muted small">{plural(gigs.length, 'gig')}</span>}
        </div>

        {gigs.length === 0 ? (
          <EmptyState
            title="You haven't posted a gig yet"
            text="Describe the work and set a budget in rupees. Freelancers will start sending bids you can compare."
            action={<Link className="btn btn--primary" to="/gigs/new">Post gig</Link>}
          />
        ) : (
          <div className="table-wrap">
            <table className="table dash-table">
              <thead>
                <tr>
                  <th scope="col">Gig</th>
                  <th scope="col">Status</th>
                  <th scope="col">Budget</th>
                  <th scope="col" className="table__num">Bids</th>
                  <th scope="col">Hired</th>
                  <th scope="col">Posted</th>
                </tr>
              </thead>
              <tbody>
                {gigs.map((gig) => (
                  <tr key={gig._id}>
                    <td className="dash-table__title">
                      <Link className="dash-link" to={`/gigs/${gig._id}`}>{gig.title}</Link>
                    </td>
                    <td data-label="Status"><StatusPill status={gig.status} /></td>
                    <td data-label="Budget"><PriceTag amount={gig.budget} size="sm" /></td>
                    <td data-label="Bids" className="table__num">{gig.bidsCount || 0}</td>
                    <td data-label="Hired">
                      {gig.assignedFreelancer ? (
                        <Link className="person person--sm dash-person" to={`/users/${gig.assignedFreelancer._id}`}>
                          <Avatar user={gig.assignedFreelancer} size="xs" decorative />
                          <span className="person__name">{gig.assignedFreelancer.name}</span>
                        </Link>
                      ) : (
                        <span className="muted small">Not hired yet</span>
                      )}
                    </td>
                    <td data-label="Posted" className="dash-table__date">{formatDate(gig.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

// Freelancer: pending / hired / earned + a table of their bids
function FreelancerDashboard() {
  const { items: bids, status, error, reload } = useMine('/bids/mine', 'bids');

  const summary = useMemo(() => {
    let pending = 0;
    let hired = 0;
    let earned = 0;
    bids.forEach((b) => {
      if (b.status === 'pending') pending += 1;
      if (b.status === 'accepted') {
        hired += 1;
        if (b.gig?.status === 'completed') earned += Number(b.amount) || 0;
      }
    });
    return { pending, hired, earned };
  }, [bids]);

  if (status === 'loading') return <Loader label="Loading your bids" />;
  if (status === 'error') return <LoadError what="bids" error={error} onRetry={reload} />;

  return (
    <>
      <div className="stats">
        <StatCard tone="marigold" label="Pending" value={summary.pending} hint="Waiting on the client" />
        <StatCard tone="teal" label="Hired" value={summary.hired} hint="Accepted bids" />
        <StatCard tone="ink" label="Earned" value={formatINR(summary.earned)} hint="Accepted bids on completed gigs" />
      </div>

      <section aria-labelledby="dash-table-title">
        <div className="dash-section-head">
          <h2 id="dash-table-title" className="card__title">Your bids</h2>
          {bids.length > 0 && <span className="muted small">{plural(bids.length, 'bid')}</span>}
        </div>

        {bids.length === 0 ? (
          <EmptyState
            title="You haven't sent any bids yet"
            text="Find an open gig that fits your skills, then send a price, a delivery time and a short plan."
            action={<Link className="btn btn--primary" to="/gigs">Browse gigs</Link>}
          />
        ) : (
          <div className="table-wrap">
            <table className="table dash-table">
              <thead>
                <tr>
                  <th scope="col">Gig</th>
                  <th scope="col" className="table__num">Your bid</th>
                  <th scope="col">Gig status</th>
                  <th scope="col">Bid status</th>
                  <th scope="col">Sent</th>
                </tr>
              </thead>
              <tbody>
                {bids.map((bid) => (
                  <tr key={bid._id}>
                    <td className="dash-table__title">
                      {bid.gig ? (
                        <Link className="dash-link" to={`/gigs/${bid.gig._id}`}>{bid.gig.title}</Link>
                      ) : (
                        <span className="muted">This gig was removed</span>
                      )}
                    </td>
                    <td data-label="Your bid" className="table__num strong">{formatINR(bid.amount)}</td>
                    <td data-label="Gig status">{bid.gig ? <StatusPill status={bid.gig.status} /> : '—'}</td>
                    <td data-label="Bid status"><StatusPill status={bid.status} /></td>
                    <td data-label="Sent" className="dash-table__date">{formatDate(bid.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function AdminDashboard() {
  return (
    <div className="card card--pad-lg dash-admin">
      <div>
        <h2 className="card__title">You're logged in as an admin</h2>
        <p className="muted">Platform stats and account controls are in the admin panel.</p>
      </div>
      <Link className="btn btn--ink" to="/admin">Open the admin panel</Link>
    </div>
  );
}

const SUBTITLES = {
  client: "Here's where your gigs stand.",
  freelancer: "Here's where your bids stand.",
  admin: 'Keep the marketplace running smoothly.',
};

export default function Dashboard() {
  const { user } = useAuth();
  const firstName = user.name.split(' ')[0];

  return (
    <div className="container page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="page-title">{greeting()}, {firstName}</h1>
          <p className="page-sub">{SUBTITLES[user.role]}</p>
        </div>
        <div className="page-actions dash-actions">
          {user.role === 'client' && <Link className="btn btn--primary" to="/gigs/new">Post gig</Link>}
          {user.role === 'freelancer' && <Link className="btn btn--primary" to="/gigs">Browse gigs</Link>}
          <Link className="btn btn--secondary" to={`/users/${user._id}`}>View profile</Link>
          <Link className="btn btn--secondary" to="/settings">Settings</Link>
        </div>
      </header>

      {user.role === 'client' && <ClientDashboard />}
      {user.role === 'freelancer' && <FreelancerDashboard />}
      {user.role === 'admin' && <AdminDashboard />}
    </div>
  );
}
