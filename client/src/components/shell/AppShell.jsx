// AppShell: the frame around every page - skip link, desktop TopNav (>= 992px) or MobileTopBar + BottomTabBar (< 992px),
// <main id="main"> and the desktop DockedMessaging bar. Sign in / Join (/login, /register) get a minimal header with only the logo and no nav.
// Both bars are always rendered and CSS shows the right one per width (no flash, no resize listener).
// Props: { children } (the routes)
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { useUnreadMessages } from '../../context/UnreadMessagesContext';
import LogoLink from './Logo';
import TopNav from './TopNav';
import MobileTopBar from './MobileTopBar';
import BottomTabBar from './BottomTabBar';
import DockedMessaging from '../messaging/DockedMessaging';

const BARE_ROUTES = ['/login', '/register'];

export default function AppShell({ children }) {
  const { user, loading } = useAuth();
  const { unreadNotifications } = useSocket();
  const { unreadMessages } = useUnreadMessages();
  const { pathname } = useLocation();
  const bare = BARE_ROUTES.includes(pathname);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      {bare ? (
        <header className="shell-minimal">
          <div className="shell-bar">
            <LogoLink withName />
          </div>
        </header>
      ) : (
        <>
          <TopNav user={user} loading={loading} unreadMessages={unreadMessages} unreadNotifications={unreadNotifications} />
          <MobileTopBar user={user} loading={loading} unreadMessages={unreadMessages} />
        </>
      )}
      <main id="main" className={`main${bare ? '' : ' main--tabbar'}`}>
        {children}
      </main>
      {!bare && <BottomTabBar user={user} loading={loading} unreadNotifications={unreadNotifications} />}
      {/* Desktop-only docked chat; hides itself on /chat, auth pages and small screens */}
      <DockedMessaging />
    </>
  );
}
