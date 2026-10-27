// DockedMessaging: the desktop messaging bar docked at the bottom-right of every page. Collapsed it shows my avatar,
// "Messaging", the unread badge and a chevron; expanded it shows the conversation list, and picking a conversation opens
// a 336px chat window next to it. It reuses the Messaging page's hooks and components (useConversations, Thread).
// Mount once inside the router and the Auth/Socket/UnreadMessages providers (e.g. in AppShell after <main>). No props.
// It renders nothing when logged out, under 992px, on /chat (the Messaging page is already open) and on /login, /register.
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown, ChevronUp, X } from 'lucide-react';
import Avatar from '../ui/Avatar';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useUnreadMessages } from '../../context/UnreadMessagesContext';
import { plural, sameId } from '../../utils/format';
import { otherParticipant } from './chatUtils';
import useConversations from './useConversations';
import useMediaQuery from './useMediaQuery';
import ConversationList from './ConversationList';
import Thread from './Thread';

const HIDDEN_ON = ['/login', '/register'];

function Dock({ user }) {
  const { isOnline } = useSocket();
  const { unreadMessages } = useUnreadMessages();
  const [expanded, setExpanded] = useState(false);
  const [loaded, setLoaded] = useState(false); // the list is fetched the first time the bar is opened
  const [openId, setOpenId] = useState(null);
  const { conversations, status, error, reload, applyMessage } = useConversations([openId], { enabled: loaded });
  const listId = useId();
  const barRef = useRef(null);
  const windowRef = useRef(null);

  const open = conversations.find((c) => sameId(c, openId)) || null;
  const other = open ? otherParticipant(open, user._id) : null;

  const toggle = () => {
    setExpanded((v) => !v);
    setLoaded(true);
  };

  const select = useCallback((conversation) => setOpenId(String(conversation._id)), []);

  const closeWindow = () => {
    setOpenId(null);
    barRef.current?.focus();
  };

  // Move focus into the chat window when a conversation opens
  useEffect(() => {
    if (openId) windowRef.current?.focus();
  }, [openId]);

  const onWindowKeyDown = (e) => {
    if (e.key === 'Escape' && !e.defaultPrevented && !e.target.closest('.ui-dropdown')) closeWindow();
  };

  return (
    <div className="msg-dock">
      {openId && (
        <section
          ref={windowRef}
          className="msg-dock__window"
          aria-label={other ? `Conversation with ${other.name}` : 'Conversation'}
          tabIndex={-1}
          onKeyDown={onWindowKeyDown}
        >
          <Thread
            key={openId}
            compact
            conversationId={openId}
            conversation={open}
            me={user}
            onSent={applyMessage}
            actions={<Button variant="tertiary" size="sm" icon={X} aria-label="Close conversation" onClick={closeWindow} />}
          />
        </section>
      )}

      <section className={`msg-dock__panel${expanded ? ' is-expanded' : ''}`} aria-label="Messaging">
        <button
          ref={barRef}
          type="button"
          className="msg-dock__bar"
          aria-expanded={expanded}
          aria-controls={listId}
          onClick={toggle}
        >
          <Avatar user={user} size={32} online={isOnline(user._id)} decorative />
          <span className="msg-dock__label">Messaging</span>
          <Badge count={unreadMessages} label={plural(unreadMessages, 'unread message')} />
          <span className="msg-dock__chevron" aria-hidden="true">
            {expanded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
          </span>
        </button>

        <div id={listId} className="msg-dock__list" hidden={!expanded}>
          {status === 'error' ? (
            <div className="msg-dock__error">
              <p>Couldn't load your conversations. {error}.</p>
              <Button variant="secondary" size="sm" onClick={() => reload()}>
                Try again
              </Button>
            </div>
          ) : (
            loaded && (
              <ConversationList
                conversations={conversations}
                status={status}
                meId={user._id}
                role={user.role}
                activeId={openId}
                onRefresh={() => reload(true)}
                onSelect={select}
                showHeader={false}
              />
            )
          )}
        </div>
      </section>
    </div>
  );
}

export default function DockedMessaging() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const desktop = useMediaQuery('(min-width: 992px)');
  const onMessagingPage = pathname === '/chat' || pathname.startsWith('/chat/');
  if (!user || !desktop || onMessagingPage || HIDDEN_ON.includes(pathname)) return null;
  return <Dock user={user} />;
}
