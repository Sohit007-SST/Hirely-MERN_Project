import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api, { SOCKET_URL } from '../api/axios';
import { useAuth } from './AuthContext';

// Session 12: one socket per logged-in user, shared through context
// useSocket() -> { socket (null when logged out), onlineUsers, isOnline(id), unreadNotifications, setUnreadNotifications }
const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user, token } = useAuth();
  const userId = user?._id;
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Connect only when logged in; reconnect when the token changes; disconnect on logout
  useEffect(() => {
    if (!token || !userId) return undefined;

    const s = io(SOCKET_URL, { auth: { token } });
    setSocket(s);

    s.on('users:online', (ids) => setOnlineUsers(Array.isArray(ids) ? ids.map(String) : []));

    // Session 12: live notifications
    s.on('notification:new', (n) => {
      setUnreadNotifications((count) => count + 1);
      toast(
        (t) => (
          <button
            type="button"
            className="toast-link"
            onClick={() => {
              toast.dismiss(t.id);
              if (n.link) navigateRef.current(n.link);
            }}
          >
            <strong>New notification</strong>
            <span>{n.message}</span>
          </button>
        ),
        { id: n._id, duration: 5000 }
      );
    });

    // Initial unread count for the bell badge
    let active = true;
    api
      .get('/notifications')
      .then(({ data }) => {
        if (active) setUnreadNotifications(data.unreadCount ?? 0);
      })
      .catch(() => {});

    return () => {
      active = false;
      s.disconnect();
      setSocket(null);
      setOnlineUsers([]);
      setUnreadNotifications(0);
    };
  }, [token, userId]);

  const onlineSet = useMemo(() => new Set(onlineUsers), [onlineUsers]);
  const isOnline = useCallback((id) => id != null && onlineSet.has(String(id)), [onlineSet]);

  const value = useMemo(
    () => ({ socket, onlineUsers, isOnline, unreadNotifications, setUnreadNotifications }),
    [socket, onlineUsers, isOnline, unreadNotifications]
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside <SocketProvider>');
  return ctx;
}
