// BottomTabBar: the fixed 56px tab bar at the bottom of the screen under 992px (icons with small labels, active in --primary).
// Clients: Home, Gigs, Post, Notifications, Dashboard. Freelancers and admins: Network instead of Post.
// Logged out: Home, Gigs, Network, Join. While /auth/me is loading: skeletons.
// Props: { user, loading, unreadNotifications }
import { Bell, Briefcase, Home, LayoutDashboard, Plus, UserPlus, Users } from 'lucide-react';
import NavItem, { NavItemSkeleton } from './NavItem';
import { matchGigs } from './navMatch';

export default function BottomTabBar({ user, loading, unreadNotifications }) {
  if (loading) {
    return (
      <div className="shell-tabbar" role="status">
        <span className="ui-sr-only">Loading your account…</span>
        {Array.from({ length: 5 }, (_, i) => <NavItemSkeleton key={i} variant="tab" />)}
      </div>
    );
  }

  return (
    <nav className="shell-tabbar" aria-label="Main">
      <NavItem variant="tab" to="/" icon={Home} label="Home" />
      <NavItem variant="tab" to="/gigs" icon={Briefcase} label="Gigs" match={matchGigs} />
      {user?.role === 'client' ? (
        <NavItem variant="tab" to="/gigs/new" icon={Plus} label="Post" />
      ) : (
        <NavItem variant="tab" to="/freelancers" icon={Users} label="Network" />
      )}
      {user ? (
        <>
          <NavItem variant="tab" to="/notifications" icon={Bell} label="Notifications" badge={unreadNotifications} />
          <NavItem variant="tab" to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        </>
      ) : (
        <NavItem variant="tab" to="/register" icon={UserPlus} label="Join" />
      )}
    </nav>
  );
}
