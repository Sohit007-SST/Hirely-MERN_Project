// QuickLinks: small left-rail card under the profile mini-card with shortcuts to Dashboard and Edit profile (plus Admin for admins).
// Props: { role }
import { Link } from 'react-router-dom';
import { LayoutDashboard, Pencil, Shield } from 'lucide-react';

export default function QuickLinks({ role }) {
  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/settings', label: 'Edit profile', icon: Pencil },
    role === 'admin' && { to: '/admin', label: 'Admin panel', icon: Shield },
  ].filter(Boolean);

  return (
    <nav className="ui-card home-quick" aria-label="Quick links">
      <ul>
        {links.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link to={to} className="home-quick__link">
              <Icon size={16} aria-hidden="true" focusable="false" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
