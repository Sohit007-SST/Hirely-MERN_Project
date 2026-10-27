// NavItem: one icon-over-label link of the top nav ("top", 80px wide, 2px bar when active)
// or of the mobile bottom tab bar ("tab", active in --primary). Sets aria-current="page" when active.
// Props: { to, icon: LucideIcon, label, badge?: number (unread count), match?: (pathname) => boolean, variant?: 'top'|'tab' }
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '../ui';

// Default rule: the link's own page or anything under it ("/" only matches itself)
const defaultMatch = (to) => (pathname) =>
  to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`);

export default function NavItem({ to, icon: Icon, label, badge = 0, match, variant = 'top' }) {
  const { pathname } = useLocation();
  const active = (match || defaultMatch(to))(pathname);

  return (
    <Link
      to={to}
      className={`shell-navitem shell-navitem--${variant}${active ? ' is-active' : ''}`}
      aria-current={active ? 'page' : undefined}
      aria-label={badge > 0 ? `${label}, ${badge} unread` : undefined}
    >
      <span className="shell-navitem__icon">
        <Icon size={variant === 'top' ? 24 : 22} aria-hidden="true" focusable="false" />
        <Badge count={badge} className="shell-navitem__badge" />
      </span>
      <span className="shell-navitem__label">{label}</span>
    </Link>
  );
}

// Skeleton stand-in shown while /auth/me is still loading, so logged-out links never flash
export function NavItemSkeleton({ variant = 'top' }) {
  return (
    <span className={`shell-navitem shell-navitem--${variant} shell-navitem--skeleton`} aria-hidden="true">
      <span className="ui-skeleton ui-skeleton--circle shell-navitem__skel-icon" />
      <span className="ui-skeleton shell-navitem__skel-label" />
    </span>
  );
}
