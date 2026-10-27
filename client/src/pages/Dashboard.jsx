import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  Briefcase,
  CircleCheck,
  Clock,
  Eye,
  Handshake,
  Hourglass,
  MessageSquare,
  Pencil,
  Plus,
  Search,
  Send,
  Settings,
  Shield,
  User,
  Wallet,
} from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { Layout } from '../components/shell';
import { BudgetBadge, Button, Card, EmptyState, SkeletonRow, Tabs } from '../components/ui';
import DashboardRow from '../components/rest/DashboardRow';
import MyItemsCard from '../components/rest/MyItemsCard';
import RailLinksCard from '../components/rest/RailLinksCard';
import StatTile, { StatTilesSkeleton } from '../components/rest/StatTile';
import useStartChat from '../components/rest/useStartChat';
import { formatDate, plural, sameId } from '../utils/format';

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

const GIG_STATUS = { open: 'Open', 'in-progress': 'In progress', completed: 'Completed', cancelled: 'Cancelled' };

// Loads one list from the API: { items, status, error, reload }
function useList(url, key, params) {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState(url ? 'loading' : 'idle'); // idle | loading | ready | error
  const [error, setError] = useState('');
  const query = JSON.stringify(params || {});

  const load = useCallback(
    (signal) => {
      if (!url) return;
      setStatus('loading');
      api
        .get(url, { signal, params: JSON.parse(query) })
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
    [url, key, query]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  return { items, status, error, reload: () => load() };
}

// Per-role setup: where the list comes from, its status tabs, its stat tiles and how one row looks
const ROLE_SETUP = {
  client: {
    url: '/gigs/mine',
    key: 'gigs',
    mineLabel: 'Posted gigs',
    mineIcon: Briefcase,
    listTitle: 'Your gigs',
    noun: 'gig',
    subtitle: "Here's where your gigs stand.",
    statusOf: (g) => g.status,
    tabs: [
      { value: 'all', label: 'All' },
      { value: 'open', label: 'Taking bids' },
      { value: 'in-progress', label: 'In progress' },
      { value: 'completed', label: 'Completed' },
    ],
  },
  freelancer: {
    url: '/bids/mine',
    key: 'bids',
    mineLabel: 'My bids',
    mineIcon: Send,
    listTitle: 'Your bids',
    noun: 'bid',
    subtitle: "Here's where your bids stand.",
    statusOf: (b) => b.status,
    tabs: [
      { value: 'all', label: 'All' },
      { value: 'pending', label: 'Pending' },
      { value: 'accepted', label: 'Hired' },
      { value: 'rejected', label: 'Not selected' },
    ],
  },
};

function ClientStats({ gigs }) {
  const c = { open: 0, 'in-progress': 0, completed: 0 };
  gigs.forEach((g) => {
    if (c[g.status] !== undefined) c[g.status] += 1;
  });
  return (
    <div className="rest-stats rest-stats--compact">
      <StatTile icon={Hourglass} label="Taking bids" value={c.open} hint="Open for freelancers to bid" />
      <StatTile icon={Clock} label="In progress" value={c['in-progress']} hint="Hired and underway" />
      <StatTile icon={CircleCheck} tone="success" label="Completed" value={c.completed} hint="Finished and ready to review" />
    </div>
  );
}

function FreelancerStats({ bids }) {
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
  return (
    <div className="rest-stats rest-stats--compact">
      <StatTile icon={Hourglass} label="Pending" value={pending} hint="Waiting on the client" />
      <StatTile icon={Handshake} tone="success" label="Hired" value={hired} hint="Accepted bids" />
      <StatTile
        icon={Wallet}
        tone="money"
        label="Earned"
        value={<BudgetBadge amount={earned} size="md" />}
        hint="Accepted bids on completed gigs"
      />
    </div>
  );
}

// Props for <DashboardRow> from one item of the current view
function rowFor(view, item, { me, startChat }) {
  if (view === 'saved' || item.budget != null) {
    // A gig: one of my posted gigs, or a saved gig
    const gig = item;
    const mine = sameId(gig.client, me);
    const people =
      view === 'saved'
        ? mine
          ? 'Your gig'
          : `Posted by ${gig.client?.name || 'a client'}`
        : gig.assignedFreelancer
          ? `Hired ${gig.assignedFreelancer.name}`
          : 'Not hired yet';
    const menu = [{ label: 'View', icon: Eye, to: `/gigs/${gig._id}` }];
    if (mine && gig.status === 'open') menu.push({ label: 'Edit', icon: Pencil, to: `/gigs/${gig._id}/edit` });
    if (view === 'saved' && !mine && gig.client) {
      menu.push({ label: 'Message the client', icon: MessageSquare, onClick: () => startChat(gig.client._id || gig.client, gig._id) });
    }
    if (view !== 'saved' && gig.assignedFreelancer) {
      const hired = gig.assignedFreelancer;
      const first = hired.name.split(' ')[0];
      menu.push(
        { label: `Message ${first}`, icon: MessageSquare, onClick: () => startChat(hired._id, gig._id) },
        { label: `View ${first}'s profile`, icon: User, to: `/users/${hired._id}` }
      );
    }
    return {
      title: gig.title,
      to: `/gigs/${gig._id}`,
      meta: [gig.category, plural(gig.bidsCount || 0, 'bid'), people, `Posted ${formatDate(gig.createdAt)}`].join(' · '),
      status: gig.status,
      amount: gig.budget,
      menuItems: menu,
    };
  }

  // A bid of mine (freelancer). The gig may have been deleted.
  const bid = item;
  const { gig } = bid;
  const menu = gig
    ? [
        { label: 'View', icon: Eye, to: `/gigs/${gig._id}` },
        { label: 'Message the client', icon: MessageSquare, onClick: () => startChat(gig.client, gig._id) },
      ]
    : [];
  return {
    title: gig ? gig.title : 'This gig was removed',
    to: gig ? `/gigs/${gig._id}` : undefined,
    meta: [gig ? `Gig ${(GIG_STATUS[gig.status] || gig.status).toLowerCase()}` : null, gig?.category, `Sent ${formatDate(bid.createdAt)}`]
      .filter(Boolean)
      .join(' · '),
    status: bid.status,
    amount: bid.amount,
    amountLabel: 'Your bid',
    menuItems: menu,
  };
}

function ListError({ what, error, onRetry }) {
  return (
    <EmptyState
      compact
      title={`Couldn't load your ${what}`}
      text={`${error}.`}
      action={
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      }
    />
  );
}

function RoleDashboard({ user }) {
  const setup = ROLE_SETUP[user.role];
  const mine = useList(setup.url, setup.key);
  // "Saved gigs": one call, keep the gigs whose likes include me (all on the client)
  const saved = useList('/gigs', 'gigs', { status: 'all', limit: 50 });
  const savedGigs = useMemo(
    () => saved.items.filter((g) => (g.likes || []).some((id) => sameId(id, user._id))),
    [saved.items, user._id]
  );
  const startChat = useStartChat();
  const [view, setView] = useState('mine'); // mine | saved
  const [tab, setTab] = useState('all');

  const tabs = useMemo(
    () =>
      setup.tabs.map((t) => ({
        ...t,
        count: t.value === 'all' ? mine.items.length : mine.items.filter((x) => setup.statusOf(x) === t.value).length,
      })),
    [setup, mine.items]
  );

  const list = view === 'saved' ? savedGigs : tab === 'all' ? mine.items : mine.items.filter((x) => setup.statusOf(x) === tab);
  const source = view === 'saved' ? saved : mine;
  const firstName = user.name.split(' ')[0];
  const countOf = (s, n) => (s.status === 'ready' ? n : s.status === 'error' ? '–' : null);

  const rail = (
    <>
      <MyItemsCard
        value={view}
        onChange={(v) => setView(v)}
        items={[
          { value: 'mine', label: setup.mineLabel, icon: setup.mineIcon, count: countOf(mine, mine.items.length) },
          { value: 'saved', label: 'Saved gigs', icon: Bookmark, count: countOf(saved, savedGigs.length) },
        ]}
      />
      <RailLinksCard
        title="Quick links"
        className="rest-rail-card--desktop"
        links={[
          { to: `/users/${user._id}`, label: 'View profile', icon: User },
          { to: '/settings', label: 'Settings', icon: Settings },
        ]}
      />
    </>
  );

  const tabLabel = tabs.find((t) => t.value === tab)?.label;

  return (
    <Layout variant="two-left" left={rail}>
      <Card padded={false} className="rest-dash-card">
        <header className="rest-dash-head">
          <div className="rest-dash-head__text">
            <p className="rest-eyebrow">Dashboard</p>
            <h1 className="rest-dash-head__title">
              {greeting()}, {firstName}
            </h1>
            <p className="rest-dash-head__sub">{setup.subtitle}</p>
          </div>
          {user.role === 'client' ? (
            <Button icon={Plus} size="sm" to="/gigs/new">
              Post gig
            </Button>
          ) : (
            <Button icon={Search} size="sm" to="/gigs">
              Browse gigs
            </Button>
          )}
        </header>

        <div className="rest-dash-card__stats">
          {mine.status === 'ready' ? (
            user.role === 'client' ? <ClientStats gigs={mine.items} /> : <FreelancerStats bids={mine.items} />
          ) : mine.status === 'error' ? null : (
            <StatTilesSkeleton className="rest-stats--compact" />
          )}
        </div>

        <section className="rest-dash-list" aria-labelledby="dash-list-title">
          <div className="rest-dash-list__head">
            <h2 id="dash-list-title" className="rest-dash-list__title">
              {view === 'saved' ? 'Saved gigs' : setup.listTitle}
            </h2>
            {source.status === 'ready' && list.length > 0 && (
              <span className="rest-dash-list__count">
                {plural(list.length, view === 'saved' ? 'gig' : setup.noun)}
              </span>
            )}
          </div>

          {view === 'mine' && mine.status === 'ready' && mine.items.length > 0 && (
            <Tabs
              className="rest-dash-tabs"
              tabs={tabs}
              value={tab}
              onChange={setTab}
              label={`Filter ${setup.listTitle.toLowerCase()} by status`}
              idPrefix="dash"
            />
          )}

          <div
            className="rest-dash-panel"
            {...(view === 'mine' && mine.status === 'ready' && mine.items.length > 0
              ? { role: 'tabpanel', id: `dash-panel-${tab}`, 'aria-labelledby': `dash-tab-${tab}`, tabIndex: -1 }
              : {})}
          >
            {source.status === 'loading' && <SkeletonRow count={4} label={`Loading ${view === 'saved' ? 'saved gigs' : setup.listTitle.toLowerCase()}`} />}
            {source.status === 'error' && (
              <ListError what={view === 'saved' ? 'saved gigs' : `${setup.noun}s`} error={source.error} onRetry={source.reload} />
            )}
            {source.status === 'ready' &&
              (list.length ? (
                <ul className="rest-dash-rows">
                  {list.map((item) => (
                    <DashboardRow key={item._id} {...rowFor(view, item, { me: user._id, startChat })} />
                  ))}
                </ul>
              ) : view === 'saved' ? (
                <EmptyState
                  compact
                  icon={Bookmark}
                  title="No saved gigs yet"
                  text="Press Save on any gig in your feed to keep it here for later."
                  action={<Button to="/gigs">Browse gigs</Button>}
                />
              ) : mine.items.length ? (
                <EmptyState
                  compact
                  title={`Nothing under "${tabLabel}"`}
                  text={`None of your ${setup.noun}s have this status right now.`}
                  action={
                    <Button variant="secondary" onClick={() => setTab('all')}>
                      Show all
                    </Button>
                  }
                />
              ) : user.role === 'client' ? (
                <EmptyState
                  compact
                  icon={Briefcase}
                  title="You haven't posted a gig yet"
                  text="Describe the work and set a budget in rupees. Freelancers will start sending bids you can compare."
                  action={<Button to="/gigs/new">Post gig</Button>}
                />
              ) : (
                <EmptyState
                  compact
                  icon={Send}
                  title="You haven't sent any bids yet"
                  text="Find an open gig that fits your skills, then send a price, a delivery time and a short plan."
                  action={<Button to="/gigs">Browse gigs</Button>}
                />
              ))}
          </div>
        </section>
      </Card>
    </Layout>
  );
}

function AdminDashboard({ user }) {
  return (
    <Layout variant="full">
      <Card className="rest-dash-admin" padded={false}>
        <div className="rest-dash-admin__body">
          <span className="rest-stat__icon rest-stat__icon--primary" aria-hidden="true">
            <Shield size={20} focusable="false" />
          </span>
          <div className="rest-dash-admin__text">
            <p className="rest-eyebrow">Dashboard</p>
            <h1 className="rest-dash-head__title">
              {greeting()}, {user.name.split(' ')[0]}
            </h1>
            <p className="rest-dash-head__sub">
              You're signed in as an admin. Platform stats and account controls are in the admin panel.
            </p>
          </div>
          <Button icon={Shield} to="/admin">
            Open the admin panel
          </Button>
        </div>
      </Card>
    </Layout>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  if (user.role === 'admin') return <AdminDashboard user={user} />;
  return <RoleDashboard key={user._id} user={user} />;
}
