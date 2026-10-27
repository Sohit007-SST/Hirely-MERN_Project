// MeMenu: the desktop "Me ▾" nav item. Opens a Dropdown with a mini profile header (avatar, name, headline,
// "View profile" pill), then Edit profile, Dashboard, Admin (admins only), a divider and Sign out.
// Also exports MeHeader and meLinks(user), which the mobile MeSheet reuses.
// Props: { user }
import { ChevronDown, LayoutDashboard, LogOut, Settings, Shield } from 'lucide-react';
import { Avatar, Button, Dropdown } from '../ui';
import useSignOut from './useSignOut';

const ROLE_LABEL = { client: 'Client', freelancer: 'Freelancer', admin: 'Admin' };

// Links shared by the dropdown and the sheet (Sign out is added by each one)
export function meLinks(user) {
  const links = [
    { label: 'Edit profile', icon: Settings, to: '/settings' },
    { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  ];
  if (user.role === 'admin') links.push({ label: 'Admin', icon: Shield, to: '/admin' });
  return links;
}

// Avatar + name + headline, then a full-width "View profile" outline pill
// (in the Dropdown the pill becomes an arrow-key menu item; onNavigate closes the mobile sheet)
export function MeHeader({ user, onNavigate }) {
  return (
    <div className="shell-me">
      <div className="shell-me__who">
        <Avatar user={user} size={56} decorative />
        <div className="shell-me__text">
          <strong className="shell-me__name">{user.name}</strong>
          <span className="shell-me__headline">{user.headline || ROLE_LABEL[user.role] || 'Member'}</span>
        </div>
      </div>
      <Button variant="secondary" size="sm" block to={`/users/${user._id}`} onClick={onNavigate}>
        View profile
      </Button>
    </div>
  );
}

export default function MeMenu({ user }) {
  const signOut = useSignOut();
  const items = [...meLinks(user), { divider: true }, { label: 'Sign out', icon: LogOut, onClick: signOut }];

  return (
    <Dropdown
      className="shell-me-menu"
      align="end"
      label="Account"
      header={<MeHeader user={user} />}
      items={items}
      trigger={
        <button type="button" className="shell-navitem shell-navitem--top shell-navitem--me" aria-label={`Me, account menu for ${user.name}`}>
          <span className="shell-navitem__icon">
            <Avatar user={user} size={24} decorative />
          </span>
          <span className="shell-navitem__label">
            Me <ChevronDown size={16} aria-hidden="true" focusable="false" />
          </span>
        </button>
      }
    />
  );
}
