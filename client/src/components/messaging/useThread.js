// useThread: everything one open conversation needs - history, "Load older messages", live messages, the other
// person's typing state, sending, and keeping the scroll position. Shared by the Messaging page and the docked window.
// useThread(conversationId, me) -> { messages, hasMore, status, error, retry, loadingOlder, loadOlder,
//                                    otherTyping, scrollRef, sendMessage(text) -> Promise<chatMessage> }
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import { useUnreadMessages } from '../../context/UnreadMessagesContext';
import { sameId } from '../../utils/format';
import { markThreadRead, mergeMessages } from './chatUtils';
import { joinConversation } from './roomJoins';

const NEAR_BOTTOM_PX = 120;

export default function useThread(conversationId, me) {
  const { socket } = useSocket();
  const { refreshUnreadMessages } = useUnreadMessages(); // nav Messaging badge (redesign Phase 2)
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);

  const scrollRef = useRef(null);
  const pendingScroll = useRef(null); // 'bottom' | { fromBottom } | null - applied after the next render

  const isNearBottom = () => {
    const el = scrollRef.current;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  };

  // Session 13: persisted history - the latest 30 messages, oldest first
  useEffect(() => {
    let active = true;
    setStatus('loading');
    api
      .get(`/chat/conversations/${conversationId}/messages`)
      .then(({ data }) => {
        if (!active) return;
        pendingScroll.current = 'bottom';
        setMessages((prev) => mergeMessages(prev, data.messages || []));
        setHasMore(Boolean(data.hasMore));
        setStatus('ready');
        refreshUnreadMessages(); // this fetch marked the thread read, so re-count the nav badge
      })
      .catch((err) => {
        if (!active) return;
        setError(err);
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [conversationId, attempt]); // refreshUnreadMessages is stable

  // Keep the reader's place: jump to the bottom, or hold position when older messages are prepended
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const mode = pendingScroll.current;
    if (!el || !mode) return;
    pendingScroll.current = null;
    el.scrollTop = mode === 'bottom' ? el.scrollHeight : el.scrollHeight - mode.fromBottom;
  }, [messages, status]);

  // Session 13: join the conversation room so typing events reach us; leave on switch or unmount
  // (counted per socket, so two views of one conversation never double-join or leave early)
  useEffect(() => {
    if (!socket) return undefined;
    return joinConversation(socket, conversationId);
  }, [socket, conversationId]);

  // Session 12: live messages for this thread (they arrive through our user room, joined or not)
  useEffect(() => {
    if (!socket) return undefined;
    const onMessage = (msg) => {
      if (!sameId(msg.conversation, conversationId)) return;
      const mine = sameId(msg.sender, me._id);
      pendingScroll.current = mine || isNearBottom() ? 'bottom' : null;
      setMessages((prev) => mergeMessages(prev, [msg]));
      if (!mine) {
        setOtherTyping(false);
        // Seen live, so mark it read; then re-count the badge (the docked window isn't in the URL,
        // so the nav badge counted this message)
        markThreadRead(conversationId).then(() => refreshUnreadMessages());
      }
    };
    socket.on('message:new', onMessage);
    return () => socket.off('message:new', onMessage);
  }, [socket, conversationId, me._id, refreshUnreadMessages]);

  // Session 13: typing indicator from the other person, for this conversation only
  useEffect(() => {
    if (!socket) return undefined;
    const fromOther = (payload) =>
      sameId(payload?.conversationId, conversationId) && !sameId(payload?.userId, me._id);
    const onStart = (payload) => fromOther(payload) && setOtherTyping(true);
    const onStop = (payload) => fromOther(payload) && setOtherTyping(false);
    socket.on('typing:start', onStart);
    socket.on('typing:stop', onStop);
    return () => {
      socket.off('typing:start', onStart);
      socket.off('typing:stop', onStop);
    };
  }, [socket, conversationId, me._id]);

  // Save first (REST), then show it; the socket echo of the same message is dropped by mergeMessages.
  // Throws on failure so the composer can give the text back.
  const sendMessage = useCallback(
    async (text) => {
      const { data } = await api.post(`/chat/conversations/${conversationId}/messages`, { text });
      pendingScroll.current = 'bottom';
      setMessages((prev) => mergeMessages(prev, [data.chatMessage]));
      return data.chatMessage;
    },
    [conversationId]
  );

  // Session 13: "Load older messages" - everything before the oldest one we have
  const loadOlder = useCallback(async () => {
    if (loadingOlder || !messages.length) return;
    setLoadingOlder(true);
    try {
      const { data } = await api.get(`/chat/conversations/${conversationId}/messages`, {
        params: { before: messages[0].createdAt },
      });
      const el = scrollRef.current;
      pendingScroll.current = { fromBottom: el ? el.scrollHeight - el.scrollTop : 0 };
      setMessages((prev) => mergeMessages(prev, data.messages || []));
      setHasMore(Boolean(data.hasMore));
    } finally {
      setLoadingOlder(false);
    }
  }, [conversationId, loadingOlder, messages]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { messages, hasMore, status, error, retry, loadingOlder, loadOlder, otherTyping, scrollRef, sendMessage };
}
