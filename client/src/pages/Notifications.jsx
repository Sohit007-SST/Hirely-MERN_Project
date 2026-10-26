import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { plural, sameId, timeAgo } from '../utils/format';

// Notification type -> [label, colour]
const TYPES = {
  bid: ['New bid', 'marigold'],
  'bid-accepted': ['Hired', 'teal'],
  'bid-rejected': ['Bid closed', 'rust'],
  comment: ['Question', 'ink'],
  like: ['Saved', 'marigold'],
  follow: ['New follower', 'ink'],
  message: ['Message', 'teal'],
  review: ['Review', 'marigold'],
  'gig-completed': ['Completed', 'teal'],
  system: ['Account', 'rust'],
};

const SYSTEM_SENDER = { name: 'GigBazaar' };

function NotificationItem({ notification: n, onOpen }) {
  const [label, tone] = TYPES[n.type] || ['Update', 'ink'];
  const text = (
    <>
      {!n.read && <span className="sr-only">Unread: </span>}
      {n.message}
    </>
  );

  return (
    <li className={`note${n.read ? '' : ' note--unread'}`}>
      <Avatar user={n.from || SYSTEM_SENDER} size="md" decorative />
      <div className="note__body">
        {n.link ? (
          <Link className="note__msg stretched-link" to={n.link} onClick={() => onOpen(n)}>
            {text}
          </Link>
        ) : (
          <button type="button" className="note__msg stretched-link" onClick={() => onOpen(n)}>
            {text}
          </button>
        )}
        <p className="note__meta">
          <span className={`note__type note__type--${tone}`}>{label}</span>
          <span aria-hidden="true">·</span>
          <time dateTime={n.createdAt}>{timeAgo(n.createdAt)}</time>
        </p>
      </div>
      {!n.read && <span className="note__dot" aria-hidden="true" />}
    </li>
  );
}

export default function Notifications() {
  const { socket, unreadNotifications, setUnreadNotifications } = useSocket();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);

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
    const onNew = (n) => setItems((list) => (list.some((x) => sameId(x, n)) ? list : [n, ...list]));
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

  // Clicking marks it read; the <Link> itself does the navigation
  const open = (n) => {
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

  const unread = status === 'ready' ? unreadNotifications : 0;

  return (
    <div className="container page notes-page">
      <div className="page-head">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub">
            {status !== 'ready'
              ? 'Bids, messages, reviews and new followers.'
              : unread
                ? `You have ${plural(unread, 'unread notification')}.`
                : "You're all caught up."}
          </p>
        </div>
        {status === 'ready' && items.length > 0 && (
          <div className="page-actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={markAll}
              disabled={markingAll || !items.some((n) => !n.read)}
            >
              {markingAll ? 'Marking as read…' : 'Mark all as read'}
            </button>
          </div>
        )}
      </div>

      {status === 'loading' && <Loader label="Loading notifications" />}

      {status === 'error' && (
        <EmptyState
          title="Couldn't load your notifications"
          text={`${error}.`}
          action={
            <button type="button" className="btn btn--primary" onClick={load}>
              Try again
            </button>
          }
        />
      )}

      {status === 'ready' &&
        (items.length ? (
          <ul className="card notes" aria-label="Notifications">
            {items.map((n) => (
              <NotificationItem key={n._id} notification={n} onOpen={open} />
            ))}
          </ul>
        ) : (
          <EmptyState
            title="You're all caught up"
            text="New bids, messages, reviews and followers will show up here as they happen."
            action={
              <Link className="btn btn--primary" to="/dashboard">
                Go to your dashboard
              </Link>
            }
          />
        ))}
    </div>
  );
}
