// useConversations: the conversation list with live updates, shared by the Messaging page and the docked bar.
// useConversations(openIds, { enabled = true }) -> { conversations, status, error, reload(quiet?), applyMessage(msg) }
// - openIds: the conversation(s) on screen right now; they never count as unread and their badge resets on open
// - enabled: false skips the fetch and the socket listener (the docked bar waits until it is first expanded)
import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { sameId } from '../../utils/format';

export default function useConversations(openIds = [], { enabled = true } = {}) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  // The socket handler reads the latest values through refs, so it is attached once per socket
  const openKey = openIds.filter(Boolean).map(String).join(',');
  const openRef = useRef([]);
  openRef.current = openKey ? openKey.split(',') : [];
  const isOpen = (id) => openRef.current.some((open) => sameId(open, id));
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;
  const refetchedFor = useRef(new Set());

  const reload = useCallback(async (quiet = false) => {
    if (!quiet) setStatus('loading');
    try {
      const { data } = await api.get('/chat/conversations');
      // An open thread has just been read, so its badge is 0 even if this response raced the read
      setConversations(
        (data.conversations || []).map((c) =>
          openRef.current.some((open) => sameId(open, c)) ? { ...c, unreadCount: 0 } : c
        )
      );
      setStatus('ready');
    } catch (err) {
      if (quiet) return;
      setError(err.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    if (enabled) reload();
  }, [enabled, reload]);

  // Opening a thread clears its unread badge locally (the server sends no read receipts)
  useEffect(() => {
    if (!openKey) return;
    setConversations((list) => list.map((c) => (isOpen(c) && c.unreadCount ? { ...c, unreadCount: 0 } : c)));
  }, [openKey]);

  // A conversation opened by link (e.g. a "you're hired" notification) can be newer than the list
  useEffect(() => {
    if (!enabled || status !== 'ready') return;
    const missing = openRef.current.filter(
      (id) => !refetchedFor.current.has(id) && !conversations.some((c) => sameId(c, id))
    );
    if (!missing.length) return;
    missing.forEach((id) => refetchedFor.current.add(id));
    reload(true);
  }, [enabled, status, openKey, conversations, reload]);

  // Session 13: a new message updates the preview and moves its conversation to the top
  const applyMessage = useCallback(
    (msg) => {
      const id = String(msg.conversation);
      if (!conversationsRef.current.some((c) => sameId(c, id))) {
        reload(true); // first message of a conversation we don't have yet
        return;
      }
      const countIt = !sameId(msg.sender, user._id) && !openRef.current.some((open) => sameId(open, id));
      setConversations((list) => {
        const current = list.find((c) => sameId(c, id));
        if (!current) return list;
        // message:new and the POST response carry the same message: count it once
        if (current.lastMessage?._id && sameId(current.lastMessage._id, msg._id)) return list;
        const updated = {
          ...current,
          lastMessage: { _id: msg._id, text: msg.text, sender: msg.sender?._id ?? msg.sender, createdAt: msg.createdAt },
          updatedAt: msg.createdAt,
          unreadCount: countIt ? (current.unreadCount || 0) + 1 : current.unreadCount,
        };
        return [updated, ...list.filter((c) => c !== current)];
      });
    },
    [reload, user._id]
  );

  // Session 12: message:new reaches our user room for every conversation, open or not
  useEffect(() => {
    if (!socket || !enabled) return undefined;
    socket.on('message:new', applyMessage);
    return () => socket.off('message:new', applyMessage);
  }, [socket, enabled, applyMessage]);

  return { conversations, status, error, reload, applyMessage };
}
