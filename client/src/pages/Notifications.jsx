import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Bell, LayoutDashboard, MessageSquare, Settings } from 'lucide-react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { Layout } from '../components/shell';
import { Button, Card, EmptyState, FilterPills, SkeletonRow } from '../components/ui';
import NotificationRow from '../components/rest/NotificationRow';
import RailLinksCard from '../components/rest/RailLinksCard';
import { plural, sameId } from '../utils/format';

// Filter pills -> which notification types each one shows (filtered on the client)
const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'bids', label: 'Bids', types: ['bid', 'bid-accepted', 'bid-rejected'] },
  { value: 'messages', label: 'Messages', types: ['message'] },
  { value: 'reviews', label: 'Reviews', types: ['review'] },
  { value: 'follows', label: 'Follows', types: ['follow'] },
];

const EMPTY_TEXT = {
  bids: 'New bids and hiring decisions on your gigs will show up here.',
  messages: "When someone messages you while you're away, it shows up here.",
  reviews: 'Reviews people leave you after a completed gig will show up here.',
  follows: 'When someone follows you, it shows up here.',
};

const RAIL_LINKS = [
  { to: '/settings', label: 'Edit profile', icon: Settings, hint: 'Your name, headline and skills' },
  { to: '/chat', label: 'Messaging', icon: MessageSquare, hint: 'Reply to your conversations' },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, hint: 'Your gigs and bids' },
];

export default function Notifications() {
  const { socket, unreadNotifications, setUnreadNotifications } = useSocket();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);
  const [filter, setFilter] = useState('all');
  const [freshIds, setFreshIds] = useState(() => new Set()); // live items that slide in

  const load = useCallback(async () => {
    setStatus('loading');
    try {
      const { data } = await api.get('/notifications');
      setItems(data.notifications || []);
      setUnreadNotifications(data.unreadCount ?? 0); // keep the bell badge in sync
      setStatus('ready');
    } catch (err) {
      setError(err.message);
      setStatus('error');
    }
  }, [setUnreadNotifications]);

  useEffect(() => {
    load();
  }, [load]);

  // Session 12: new notifications appear at the top live.
  // SocketContext already shows the toast and bumps the badge, so only the list changes here.
  useEffect(() => {
    if (!socket) return undefined;
    const onNew = (n) => {
      setItems((list) => (list.some((x) => sameId(x, n)) ? list : [n, ...list]));
      setFreshIds((ids) => new Set(ids).add(String(n._id)));
    };
    socket.on('notification:new', onNew);
    return () => socket.off('notification:new', onNew);
  }, [socket]);

  const markAll = async () => {
    setMarkingAll(true);
    try {
      const { data } = await api.patch('/notifications/read-all');
      setItems((list) => list.map((n) => (n.read ? n : { ...n, read: true })));
      setUnreadNotifications(data.unreadCount ?? 0);
    } catch (err) {
      toast.error(`Couldn't mark notifications as read. ${err.message}`);
    } finally {
      setMarkingAll(false);
    }
  };

  // Marks one read (optimistic). From a row click the <Link> itself does the navigation.
  const markRead = (n) => {
    if (n.read) return;
    setItems((list) => list.map((x) => (sameId(x, n) ? { ...x, read: true } : x)));
    api
      .patch(`/notifications/${n._id}/read`)
      .then(({ data }) => setUnreadNotifications(data.unreadCount ?? 0))
      .catch((err) => {
        setItems((list) => list.map((x) => (sameId(x, n) ? { ...x, read: false } : x)));
        toast.error(`Couldn't mark that notification as read. ${err.message}`);
      });
  };

  const shown = useMemo(() => {
    const types = FILTERS.find((f) => f.value === filter)?.types;
    return types ? items.filter((n) => types.includes(n.type)) : items;
  }, [items, filter]);

  const unread = status === 'ready' ? unreadNotifications : 0;
  const hasUnread = items.some((n) => !n.read);
  const filterLabel = FILTERS.find((f) => f.value === filter)?.label.toLowerCase();

  return (
    <Layout variant="two-left" className="rest-rail-desktop" left={<RailLinksCard title="Manage your notifications" links={RAIL_LINKS} />}>
      <Card
        className="rest-notes-card"
        title="Notifications"
        titleAs="h1"
        padded={false}
        action={
          status === 'ready' &&
          items.length > 0 && (
            <Button
              variant="tertiary"
              size="sm"
              onClick={markAll}
              disabled={!hasUnread}
              loading={markingAll}
              loadingText="Marking as read…"
            >
              Mark all as read
            </Button>
          )
        }
      >
        <p className="rest-notes-card__sub" aria-live="polite">
          {status !== 'ready'
            ? 'Bids, messages, reviews and new followers.'
            : unread
              ? `You have ${plural(unread, 'unread notification')}.`
              : "You're all caught up."}
        </p>

        <div className="rest-notes-card__filters">
          <FilterPills label="Show notifications about" options={FILTERS} value={filter} onChange={setFilter} />
        </div>

        {status === 'loading' && (
          <div className="rest-notes-card__state">
            <SkeletonRow count={5} label="Loading notifications" />
          </div>
        )}

        {status === 'error' && (
          <EmptyState
            compact
            icon={Bell}
            title="Couldn't load your notifications"
            text={`${error}.`}
            action={<Button onClick={load}>Try again</Button>}
          />
        )}

        {status === 'ready' &&
          (shown.length ? (
            <ul className="rest-notes" aria-label="Notifications">
              {shown.map((n) => (
                <NotificationRow
                  key={n._id}
                  notification={n}
                  onOpen={markRead}
                  onMarkRead={markRead}
                  fresh={freshIds.has(String(n._id))}
                />
              ))}
            </ul>
          ) : filter !== 'all' ? (
            <EmptyState
              compact
              icon={Bell}
              title={`No ${filterLabel} notifications yet`}
              text={EMPTY_TEXT[filter]}
              action={
                <Button variant="secondary" onClick={() => setFilter('all')}>
                  Show all notifications
                </Button>
              }
            />
          ) : (
            <EmptyState
              compact
              icon={Bell}
              title="You're all caught up"
              text="New bids, messages, reviews and followers will show up here as they happen."
              action={<Button to="/dashboard">Go to your dashboard</Button>}
            />
          ))}
      </Card>
    </Layout>
  );
}
