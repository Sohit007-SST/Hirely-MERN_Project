import { Fragment, memo, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';
import { formatDate, formatTime, plural, sameId } from '../utils/format';

const TYPING_IDLE_MS = 1500;
const NEAR_BOTTOM_PX = 120;
const MAX_LENGTH = 2000;
const GONE = { name: 'Deleted account' };

// The other person in a two-person conversation
const otherParticipant = (conversation, me) =>
  conversation?.participants?.find((p) => !sameId(p, me)) || GONE;

const firstName = (name = '') => name.split(' ')[0];

// List times: "3:45 pm" today, "Mon" this week, "12 Oct" before that
function shortTime(date) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return formatTime(d);
  if (now - d < 6 * 86400000) return d.toLocaleDateString('en-IN', { weekday: 'short' });
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

// Thread day dividers: "Today", "Yesterday", "27 Oct 2026"
function dayLabel(date) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return formatDate(d);
}

const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString();

// Session 13: merge by _id so a message never shows twice (the sender gets the POST response AND the socket event)
function mergeMessages(current, incoming) {
  const seen = new Set(current.map((m) => String(m._id)));
  const fresh = incoming.filter((m) => !seen.has(String(m._id)));
  if (!fresh.length) return current;
  return [...current, ...fresh].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

// The API marks messages read whenever a thread is fetched. Asking for messages before 1970 returns
// nothing but still marks new ones read, so a message seen live doesn't come back as unread later.
const markThreadRead = (id) =>
  api.get(`/chat/conversations/${id}/messages`, { params: { before: '1970-01-01' } }).catch(() => {});

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Session 14: memo - a row only re-renders when its own data or online status changes
const ConversationRow = memo(function ConversationRow({ conversation, meId, active, online }) {
  const other = otherParticipant(conversation, meId);
  const last = conversation.lastMessage;
  const mine = last?.text && sameId(last.sender, meId);
  const unread = conversation.unreadCount || 0;

  return (
    <li>
      <Link
        to={`/chat/${conversation._id}`}
        className={`convo${active ? ' is-active' : ''}${unread ? ' convo--unread' : ''}`}
        aria-current={active ? 'page' : undefined}
      >
        <Avatar user={other} size="md" online={online} decorative />
        <span className="convo__body">
          <span className="convo__top">
            <span className="convo__name">
              {other.name}
              {online && <span className="sr-only"> (online)</span>}
            </span>
            {last?.createdAt && (
              <time className="convo__time" dateTime={last.createdAt}>{shortTime(last.createdAt)}</time>
            )}
          </span>
          {conversation.gig && <span className="convo__gig">{conversation.gig.title}</span>}
          <span className="convo__bottom">
            <span className="convo__preview">
              {last?.text ? `${mine ? 'You: ' : ''}${last.text}` : 'No messages yet'}
            </span>
            {unread > 0 && (
              <span className="badge">
                <span aria-hidden="true">{unread > 99 ? '99+' : unread}</span>
                <span className="sr-only">{plural(unread, 'unread message')}</span>
              </span>
            )}
          </span>
        </span>
      </Link>
    </li>
  );
});

function ThreadError({ error, onRetry }) {
  const back = <Link className="btn btn--secondary" to="/chat">Back to conversations</Link>;
  let props;
  if (error.status === 404 || error.status === 400) {
    props = {
      title: "We couldn't find this conversation",
      text: 'The link may be old or mistyped. Pick a conversation from your list instead.',
      action: back,
    };
  } else if (error.status === 403) {
    props = {
      title: "This conversation isn't yours",
      text: 'Only the two people in a chat can read it. Pick one of your own conversations.',
      action: back,
    };
  } else {
    props = {
      title: "Couldn't load messages",
      text: `${error.message}.`,
      action: (
        <>
          <button type="button" className="btn btn--primary" onClick={onRetry}>Try again</button>
          {back}
        </>
      ),
    };
  }
  return (
    <div className="thread__state">
      <EmptyState compact {...props} />
    </div>
  );
}

// One open conversation: header, messages, typing line, send box
function Thread({ conversationId, conversation, me, onSent }) {
  const { socket, isOnline } = useSocket();
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const pendingScroll = useRef(null); // 'bottom' | { fromBottom } | null - applied after the next render
  const typingRef = useRef(false);
  const idleTimer = useRef(null);

  const other = conversation ? otherParticipant(conversation, me._id) : null;
  const online = other?._id ? isOnline(other._id) : false;
  const otherFirst = other ? firstName(other.name) : '';

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
      })
      .catch((err) => {
        if (!active) return;
        setError(err);
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, [conversationId, attempt]);

  // Keep the reader's place: jump to the bottom, or hold position when older messages are prepended
  useLayoutEffect(() => {
    const el = scrollRef.current;
    const mode = pendingScroll.current;
    if (!el || !mode) return;
    pendingScroll.current = null;
    el.scrollTop = mode === 'bottom' ? el.scrollHeight : el.scrollHeight - mode.fromBottom;
  }, [messages, status]);

  // Session 13: join the conversation room so typing events reach us; leave on switch or unmount
  useEffect(() => {
    if (!socket) return undefined;
    const join = () => socket.emit('conversation:join', conversationId);
    join();
    socket.on('connect', join); // rooms are lost when the socket reconnects
    return () => {
      socket.off('connect', join);
      socket.emit('conversation:leave', conversationId);
    };
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
        markThreadRead(conversationId);
      }
    };
    socket.on('message:new', onMessage);
    return () => socket.off('message:new', onMessage);
  }, [socket, conversationId, me._id]);

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

  const stopTyping = useCallback(() => {
    clearTimeout(idleTimer.current);
    if (typingRef.current && socket) socket.emit('typing:stop', { conversationId });
    typingRef.current = false;
  }, [socket, conversationId]);

  // Tell the other side we stopped if we leave mid-sentence
  useEffect(() => stopTyping, [stopTyping]);

  // Grow the send box with its content (up to the CSS max-height)
  useLayoutEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [text]);

  const onType = (e) => {
    const value = e.target.value;
    setText(value);
    if (!socket) return;
    if (!value.trim()) {
      stopTyping();
      return;
    }
    // Session 13: one "start" per burst of typing, "stop" after 1.5 s without a keystroke
    if (!typingRef.current) {
      typingRef.current = true;
      socket.emit('typing:start', { conversationId });
    }
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(stopTyping, TYPING_IDLE_MS);
  };

  const send = async (e) => {
    e?.preventDefault();
    const body = text.trim();
    if (!body || sending) return;
    stopTyping();
    setSending(true);
    setText('');
    try {
      // Save first (REST), then show it; the socket echo of the same message is dropped by mergeMessages
      const { data } = await api.post(`/chat/conversations/${conversationId}/messages`, { text: body });
      pendingScroll.current = 'bottom';
      setMessages((prev) => mergeMessages(prev, [data.chatMessage]));
      onSent(data.chatMessage);
    } catch (err) {
      setText((current) => current || body); // give the text back so nothing is lost
      toast.error(`Message not sent. ${err.message}`);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const onKeyDown = (e) => {
    // Enter sends, Shift+Enter adds a new line (and never send mid-composition, e.g. Hindi IME)
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  // Session 13: "Load older messages" - everything before the oldest one we have
  const loadOlder = async () => {
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
    } catch (err) {
      toast.error(`Couldn't load older messages. ${err.message}`);
    } finally {
      setLoadingOlder(false);
    }
  };

  if (status === 'error') return <ThreadError error={error} onRetry={() => setAttempt((n) => n + 1)} />;

  return (
    <>
      <header className="thread__head">
        <Link className="btn btn--ghost btn--icon btn--sm thread__back" to="/chat" aria-label="Back to conversations">
          <BackIcon />
        </Link>
        {other ? (
          <>
            <Avatar user={other} size="md" online={online} decorative />
            <div className="thread__who">
              {other._id ? (
                <Link className="thread__name" to={`/users/${other._id}`}>{other.name}</Link>
              ) : (
                <span className="thread__name">{other.name}</span>
              )}
              <span className="thread__meta">
                <span className={`thread__status${online ? ' is-online' : ''}`}>{online ? 'Online' : 'Offline'}</span>
                {conversation.gig && (
                  <>
                    <span aria-hidden="true">·</span>
                    <Link className="thread__gig" to={`/gigs/${conversation.gig._id}`}>
                      <span className="sr-only">Gig: </span>
                      {conversation.gig.title}
                    </Link>
                  </>
                )}
              </span>
            </div>
          </>
        ) : (
          <span className="skeleton skeleton--text thread__skeleton" aria-hidden="true" />
        )}
      </header>

      {status === 'loading' ? (
        <div className="thread__body">
          <Loader label="Loading messages" />
        </div>
      ) : (
        <div
          className="thread__body"
          ref={scrollRef}
          role="log"
          aria-label={other ? `Messages with ${other.name}` : 'Messages'}
          tabIndex={0}
        >
          {hasMore ? (
            <div className="thread__older">
              <button type="button" className="btn btn--secondary btn--sm" onClick={loadOlder} disabled={loadingOlder}>
                {loadingOlder ? 'Loading older messages…' : 'Load older messages'}
              </button>
            </div>
          ) : (
            messages.length > 0 && (
              <p className="thread__start">
                This is the start of your conversation
                {conversation?.gig ? ` about "${conversation.gig.title}"` : ''}.
              </p>
            )
          )}

          {messages.length === 0 ? (
            <p className="thread__empty">No messages yet. Say hello{otherFirst ? ` to ${otherFirst}` : ''}.</p>
          ) : (
            <ol className="thread__messages">
              {messages.map((m, i) => {
                const prev = messages[i - 1];
                const mine = sameId(m.sender, me._id);
                const newDay = !prev || !sameDay(prev.createdAt, m.createdAt);
                const firstOfGroup = newDay || !sameId(prev.sender, m.sender);
                return (
                  <Fragment key={m._id}>
                    {newDay && (
                      <li className="thread__day">
                        <span>{dayLabel(m.createdAt)}</span>
                      </li>
                    )}
                    <li className={`bubble${mine ? ' bubble--mine' : ''}${firstOfGroup ? ' bubble--first' : ''}`}>
                      <span className="sr-only">{mine ? 'You' : m.sender?.name || otherFirst}: </span>
                      <p className="bubble__text">{m.text}</p>
                      <time className="bubble__time" dateTime={m.createdAt}>{formatTime(m.createdAt)}</time>
                    </li>
                  </Fragment>
                );
              })}
            </ol>
          )}
        </div>
      )}

      {/* Static text, no animation (spec §11) */}
      <p className="thread__typing" aria-live="polite">
        {otherTyping && online ? `${otherFirst} is typing…` : ''}
      </p>

      <form className="composer" onSubmit={send}>
        <label className="sr-only" htmlFor="chat-input">
          {other ? `Message ${other.name}` : 'Message'}
        </label>
        <textarea
          id="chat-input"
          ref={inputRef}
          className="textarea composer__input"
          rows={1}
          value={text}
          onChange={onType}
          onKeyDown={onKeyDown}
          placeholder={otherFirst ? `Message ${otherFirst}…` : 'Write a message…'}
          maxLength={MAX_LENGTH}
          aria-describedby="chat-hint"
          disabled={status !== 'ready'}
        />
        <button type="submit" className="btn btn--primary composer__send" disabled={!text.trim() || sending}>
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
      <p className="composer__hint" id="chat-hint">
        Enter sends. Shift+Enter adds a new line.
      </p>
    </>
  );
}

export default function Chat() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const { socket, isOnline } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState('');

  // The socket handler reads the latest values through refs, so it is attached once per socket
  const activeIdRef = useRef(conversationId);
  activeIdRef.current = conversationId;
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;
  const refetchedFor = useRef(null);

  const loadConversations = useCallback(async (quiet = false) => {
    if (!quiet) setStatus('loading');
    try {
      const { data } = await api.get('/chat/conversations');
      // The open thread has just been read, so its badge is 0 even if this response raced the read
      setConversations(
        (data.conversations || []).map((c) => (sameId(c, activeIdRef.current) ? { ...c, unreadCount: 0 } : c))
      );
      setStatus('ready');
    } catch (err) {
      if (quiet) return;
      setError(err.message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Opening a thread clears its unread badge locally (the server sends no read receipts)
  useEffect(() => {
    if (!conversationId) return;
    setConversations((list) =>
      list.map((c) => (sameId(c, conversationId) && c.unreadCount ? { ...c, unreadCount: 0 } : c))
    );
  }, [conversationId]);

  // A conversation opened by link (e.g. a "you're hired" notification) can be newer than the list
  useEffect(() => {
    if (status !== 'ready' || !conversationId || refetchedFor.current === conversationId) return;
    if (!conversations.some((c) => sameId(c, conversationId))) {
      refetchedFor.current = conversationId;
      loadConversations(true);
    }
  }, [status, conversationId, conversations, loadConversations]);

  // Session 13: a new message updates the preview and moves its conversation to the top
  const applyMessage = useCallback(
    (msg) => {
      const id = String(msg.conversation);
      if (!conversationsRef.current.some((c) => sameId(c, id))) {
        loadConversations(true); // first message of a conversation we don't have yet
        return;
      }
      const countIt = !sameId(msg.sender, user._id) && !sameId(id, activeIdRef.current);
      setConversations((list) => {
        const current = list.find((c) => sameId(c, id));
        if (!current) return list;
        const updated = {
          ...current,
          lastMessage: { text: msg.text, sender: msg.sender?._id ?? msg.sender, createdAt: msg.createdAt },
          updatedAt: msg.createdAt,
          unreadCount: countIt ? (current.unreadCount || 0) + 1 : current.unreadCount,
        };
        return [updated, ...list.filter((c) => c !== current)];
      });
    },
    [loadConversations, user._id]
  );

  // Session 12: message:new reaches our user room for every conversation, open or not
  useEffect(() => {
    if (!socket) return undefined;
    socket.on('message:new', applyMessage);
    return () => socket.off('message:new', applyMessage);
  }, [socket, applyMessage]);

  const active = conversations.find((c) => sameId(c, conversationId)) || null;

  if (status === 'loading' && !conversations.length) return <Loader full label="Loading your conversations" />;

  if (status === 'error') {
    return (
      <div className="container page">
        <EmptyState
          title="Couldn't load your conversations"
          text={`${error}.`}
          action={
            <button type="button" className="btn btn--primary" onClick={() => loadConversations()}>
              Try again
            </button>
          }
        />
      </div>
    );
  }

  if (!conversations.length && !conversationId) {
    return (
      <div className="container page">
        <h1 className="sr-only">Chat</h1>
        <EmptyState
          title="No conversations yet"
          text="Hire a freelancer or message a client from a gig to start chatting."
          action={
            <Link className="btn btn--primary" to={user.role === 'client' ? '/dashboard' : '/gigs'}>
              {user.role === 'client' ? 'Go to your gigs' : 'Browse open gigs'}
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container chat-page">
      <h1 className="sr-only">Chat</h1>
      <div className={`card chat${conversationId ? ' chat--open' : ''}`}>
        <aside className="chat__list" aria-labelledby="chat-list-title">
          <div className="chat__list-head">
            <h2 id="chat-list-title" className="chat__list-title">Messages</h2>
            <span className="muted small">{plural(conversations.length, 'chat')}</span>
          </div>
          {conversations.length ? (
            <ul className="chat__convos">
              {conversations.map((c) => {
                const other = otherParticipant(c, user._id);
                return (
                  <ConversationRow
                    key={c._id}
                    conversation={c}
                    meId={user._id}
                    active={sameId(c, conversationId)}
                    online={Boolean(other._id) && isOnline(other._id)}
                  />
                );
              })}
            </ul>
          ) : (
            <p className="chat__list-empty muted small">
              No conversations yet. Hire a freelancer or message a client from a gig to start chatting.
            </p>
          )}
        </aside>

        <section className="chat__thread" aria-label="Conversation">
          {conversationId ? (
            <Thread
              key={conversationId}
              conversationId={conversationId}
              conversation={active}
              me={user}
              onSent={applyMessage}
            />
          ) : (
            <div className="thread__state">
              <EmptyState
                compact
                title="Pick a conversation"
                text="Choose a chat on the left to read your messages and reply."
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
