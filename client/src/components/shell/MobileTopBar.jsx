// MobileTopBar: the top bar under 992px. Avatar (opens the Me sheet), the search box filling the middle,
// and a Messaging icon with its unread badge. Logged out: logo, search and a "Sign in" pill.
// Props: { user, loading, unreadMessages }
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { Avatar, Badge, Button } from '../ui';
import LogoLink from './Logo';
import SearchBox from './SearchBox';
import MeSheet from './MeSheet';

export default function MobileTopBar({ user, loading, unreadMessages }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const { pathname } = useLocation();
  const onChat = pathname === '/chat' || pathname.startsWith('/chat/');

  let start;
  let end;
  if (loading) {
    start = <span className="ui-skeleton ui-skeleton--circle shell-mobilebar__skel" aria-hidden="true" />;
    end = (
      <span role="status" className="shell-mobilebar__skel-wrap">
        <span className="ui-sr-only">Loading your account…</span>
        <span className="ui-skeleton ui-skeleton--circle shell-mobilebar__skel" aria-hidden="true" />
      </span>
    );
  } else if (user) {
    start = (
      <button
        type="button"
        className="shell-mobilebar__avatar"
        aria-label={`Me, account menu for ${user.name}`}
        aria-haspopup="dialog"
        aria-expanded={sheetOpen}
        onClick={(e) => {
          e.currentTarget.focus(); // Safari doesn't focus clicked buttons; the sheet returns focus here on close
          setSheetOpen(true);
        }}
      >
        <Avatar user={user} size={32} decorative />
      </button>
    );
    end = (
      <Link
        to="/chat"
        className={`shell-iconbtn${onChat ? ' is-active' : ''}`}
        aria-current={onChat ? 'page' : undefined}
        aria-label={unreadMessages > 0 ? `Messaging, ${unreadMessages} unread` : 'Messaging'}
      >
        <MessageSquare size={24} aria-hidden="true" focusable="false" />
        <Badge count={unreadMessages} className="shell-iconbtn__badge" />
      </Link>
    );
  } else {
    start = <LogoLink size={32} />;
    end = <Button variant="secondary" size="sm" to="/login">Sign in</Button>;
  }

  return (
    <header className="shell-mobilebar">
      <div className="shell-bar">
        {start}
        <SearchBox className="shell-mobilebar__search" />
        {end}
      </div>
      {user && <MeSheet user={user} open={sheetOpen} onClose={() => setSheetOpen(false)} />}
    </header>
  );
}
