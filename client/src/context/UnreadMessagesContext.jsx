import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';

// UnreadMessagesContext: the total of unread chat messages, for the Messaging badge in the nav (UI-only helper).
// useUnreadMessages() -> { unreadMessages, refreshUnreadMessages(), setUnreadMessages }
// - On login: sum of unreadCount from GET /chat/conversations
// - Session 12: +1 on socket "message:new" from someone else, unless that conversation is open at /chat/:id
// - Reset to 0 on logout. The Messaging page calls refreshUnreadMessages() after opening a thread.
const UnreadMessagesContext = createContext(null);

const sumUnread = (conversations = []) =>
  conversations.reduce((total, c) => total + (Number(c.unreadCount) || 0), 0);

export function UnreadMessagesProvider({ children }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const userId = user?._id ? String(user._id) : null;
  const { pathname } = useLocation();

  const [unreadMessages, setUnreadMessages] = useState(0);

  // The socket handler reads the latest user and open conversation through refs (attached once per socket)
  const userRef = useRef(userId);
  userRef.current = userId;
  const openConversation = matchPath('/chat/:conversationId', pathname)?.params.conversationId ?? null;
  const openRef = useRef(openConversation);
  openRef.current = openConversation;

  const refreshUnreadMessages = useCallback(async () => {
    const forUser = userRef.current;
    if (!forUser) return;
    try {
      const { data } = await api.get('/chat/conversations');
      // Ignore a late answer that belongs to a user who has logged out since
      if (userRef.current === forUser) setUnreadMessages(sumUnread(data.conversations));
    } catch {
      // keep the last known count; the badge is only a hint
    }
  }, []);

  // Login (or a different user) -> fetch; logout -> 0
  useEffect(() => {
    if (!userId) {
      setUnreadMessages(0);
      return;
    }
    refreshUnreadMessages();
  }, [userId, refreshUnreadMessages]);

  // Session 12: live updates from the user's socket room
  useEffect(() => {
    if (!socket) return undefined;
    const seen = new Set(); // message:new can arrive twice for the same message (dedupe by _id)

    const onMessage = (msg) => {
      const id = String(msg?._id ?? '');
      if (!id || seen.has(id)) return;
      seen.add(id);
      const senderId = String(msg.sender?._id ?? msg.sender ?? '');
      if (senderId === userRef.current) return; // my own message
      if (String(msg.conversation) === openRef.current) return; // I'm reading that thread right now
      setUnreadMessages((n) => n + 1);
    };
    // Messages sent while the connection was down are missed by the socket, so re-count after a reconnect
    const onReconnect = () => refreshUnreadMessages();

    socket.on('message:new', onMessage);
    socket.io.on('reconnect', onReconnect);
    return () => {
      socket.off('message:new', onMessage);
      socket.io.off('reconnect', onReconnect);
    };
  }, [socket, refreshUnreadMessages]);

  const value = useMemo(
    () => ({ unreadMessages, refreshUnreadMessages, setUnreadMessages }),
    [unreadMessages, refreshUnreadMessages]
  );

  return <UnreadMessagesContext.Provider value={value}>{children}</UnreadMessagesContext.Provider>;
}

export function useUnreadMessages() {
  const ctx = useContext(UnreadMessagesContext);
  if (!ctx) throw new Error('useUnreadMessages must be used inside <UnreadMessagesProvider>');
  return ctx;
}
