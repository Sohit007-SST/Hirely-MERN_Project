// Props: none. Role-aware top bar: reads useAuth() and useSocket() (unread badge). Hamburger under 760px.
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import Avatar from './Avatar';

const linkClass = ({ isActive }) => `navbar__link${isActive ? ' is-active' : ''}`;

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MenuIcon({ open }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path
        d={open ? 'M6 6l12 12M18 6L6 18' : 'M4 7h16M4 12h16M4 17h16'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo() {
  return (
    <svg className="brand-mark" viewBox="0 0 64 64" width="30" height="30" aria-hidden="true">
      <rect width="64" height="64" rx="14" style={{ fill: 'var(--primary)' }} />
      <path d="M20 16h7v13h10V16h7v32h-7V35H27v13h-7z" style={{ fill: 'var(--on-primary)' }} />
    </svg>
  );
}

// Avatar button + dropdown: profile, settings, log out
function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false);
        ref.current?.querySelector('.user-menu__button')?.focus();
      }
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={ref}>
      <button
        type="button"
        className="user-menu__button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls="user-menu-panel"
        onClick={() => setOpen((o) => !o)}
      >
        <Avatar user={user} size="sm" decorative />
        <span className="sr-only">Account menu for {user.name}</span>
      </button>
      {open && (
        <div className="menu" id="user-menu-panel">
          <div className="menu__head">
            <strong className="truncate">{user.name}</strong>
            <span className="menu__role">{user.role}</span>
          </div>
          <Link className="menu__item" to={`/users/${user._id}`}>View profile</Link>
          <Link className="menu__item" to="/settings">Settings</Link>
          <button type="button" className="menu__item menu__item--danger" onClick={onLogout}>
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { unreadNotifications } = useSocket();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the mobile menu after navigating
  useEffect(() => setMenuOpen(false), [pathname]);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/');
    toast.success('You are logged out');
  };

  const role = user?.role;
  const badge = unreadNotifications > 99 ? '99+' : unreadNotifications;

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Link to="/" className="navbar__brand" aria-label="Hirely home">
          <Logo />
          <span>Hirely</span>
        </Link>

        <nav
          id="main-menu"
          className={`navbar__menu${menuOpen ? ' is-open' : ''}`}
          aria-label="Main"
        >
          <NavLink to="/gigs" end className={linkClass}>Find gigs</NavLink>
          <NavLink to="/freelancers" className={linkClass}>Freelancers</NavLink>
          {user && <NavLink to="/dashboard" className={linkClass}>Dashboard</NavLink>}
          {user && <NavLink to="/chat" className={linkClass}>Chat</NavLink>}
          {role === 'admin' && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}

          <div className="navbar__cta">
            {role === 'client' && (
              <Link to="/gigs/new" className="btn btn--primary btn--sm">Post a gig</Link>
            )}
            {!user && (
              <>
                <Link to="/login" className="btn btn--ghost btn--sm">Log in</Link>
                <Link to="/register" className="btn btn--primary btn--sm">Sign up</Link>
              </>
            )}
            {user && (
              <button type="button" className="btn btn--ghost btn--sm navbar__logout" onClick={handleLogout}>
                Log out
              </button>
            )}
          </div>
        </nav>

        <div className="navbar__actions">
          {user && (
            <>
              <NavLink
                to="/notifications"
                className={({ isActive }) => `navbar__bell${isActive ? ' is-active' : ''}`}
                aria-label={
                  unreadNotifications
                    ? `Notifications, ${unreadNotifications} unread`
                    : 'Notifications'
                }
              >
                <BellIcon />
                {unreadNotifications > 0 && <span className="badge navbar__badge">{badge}</span>}
              </NavLink>
              <UserMenu user={user} onLogout={handleLogout} />
            </>
          )}
          <button
            type="button"
            className="navbar__toggle"
            aria-expanded={menuOpen}
            aria-controls="main-menu"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </div>
    </header>
  );
}
