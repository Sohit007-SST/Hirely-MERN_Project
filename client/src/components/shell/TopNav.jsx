// TopNav: the desktop top bar (>= 992px). Left: logo + search. Right: Home, Gigs, Network, Messaging, Notifications
// (icon over label, unread badges), the "Me" menu, and a "Post a gig" pill for clients.
// Logged out: Gigs, Network, "Join now" and "Sign in". While /auth/me is loading: skeletons instead of links.
// Props: { user, loading, unreadMessages, unreadNotifications }
import { Bell, Briefcase, Home, MessageSquare, Plus, Users } from 'lucide-react';
import { Button } from '../ui';
import LogoLink from './Logo';
import SearchBox from './SearchBox';
import NavItem, { NavItemSkeleton } from './NavItem';
import MeMenu from './MeMenu';
import { matchGigs } from './navMatch';

export default function TopNav({ user, loading, unreadMessages, unreadNotifications }) {
  let right;
  if (loading) {
    right = (
      <div className="shell-topnav__items" role="status">
        <span className="ui-sr-only">Loading your account…</span>
        {Array.from({ length: 6 }, (_, i) => <NavItemSkeleton key={i} />)}
      </div>
    );
  } else if (user) {
    right = (
      <>
        <nav className="shell-topnav__items" aria-label="Main">
          <NavItem to="/" icon={Home} label="Home" />
          <NavItem to="/gigs" icon={Briefcase} label="Gigs" match={matchGigs} />
          <NavItem to="/freelancers" icon={Users} label="Network" />
          <NavItem to="/chat" icon={MessageSquare} label="Messaging" badge={unreadMessages} />
          <NavItem to="/notifications" icon={Bell} label="Notifications" badge={unreadNotifications} />
          <MeMenu user={user} />
        </nav>
        {user.role === 'client' && (
          <>
            <span className="shell-topnav__divider" aria-hidden="true" />
            <Button size="sm" icon={Plus} to="/gigs/new" className="shell-topnav__post">Post a gig</Button>
          </>
        )}
      </>
    );
  } else {
    right = (
      <>
        <nav className="shell-topnav__items" aria-label="Main">
          <NavItem to="/gigs" icon={Briefcase} label="Gigs" match={matchGigs} />
          <NavItem to="/freelancers" icon={Users} label="Network" />
        </nav>
        <span className="shell-topnav__divider" aria-hidden="true" />
        <div className="shell-topnav__auth">
          <Button variant="tertiary" to="/register">Join now</Button>
          <Button variant="secondary" to="/login">Sign in</Button>
        </div>
      </>
    );
  }

  return (
    <header className="shell-topnav">
      <div className="shell-bar">
        <div className="shell-topnav__left">
          <LogoLink />
          <SearchBox />
        </div>
        <div className="shell-topnav__right">{right}</div>
      </div>
    </header>
  );
}
