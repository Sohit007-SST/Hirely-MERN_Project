import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Bell } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import Loader from './components/Loader';
import ProtectedRoute from './components/ProtectedRoute';

// Session 14: every page is its own lazily loaded chunk
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Gigs = lazy(() => import('./pages/Gigs'));
const GigDetails = lazy(() => import('./pages/GigDetails'));
const GigForm = lazy(() => import('./pages/GigForm'));
const Freelancers = lazy(() => import('./pages/Freelancers'));
const Profile = lazy(() => import('./pages/Profile'));
const Settings = lazy(() => import('./pages/Settings'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Chat = lazy(() => import('./pages/Chat'));
const Notifications = lazy(() => import('./pages/Notifications'));
const Admin = lazy(() => import('./pages/Admin'));
const NotFound = lazy(() => import('./pages/NotFound'));
// TEMPORARY: removed in redesign Phase 8 (shows every components/ui primitive)
const UiPreview = lazy(() => import('./pages/UiPreview'));

// New page, top of the window (browsers keep the old scroll position in SPAs)
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <SocketProvider>
          <ScrollToTop />
          <a className="skip-link" href="#main">Skip to content</a>
          <Navbar />
          <main id="main" className="main">
            <Suspense fallback={<Loader full />}>
              <Routes>
                {/* Public */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/gigs" element={<Gigs />} />
                <Route path="/freelancers" element={<Freelancers />} />
                <Route path="/users/:id" element={<Profile />} />
                {/* TEMPORARY: removed in redesign Phase 8 */}
                <Route path="/ui-preview" element={<UiPreview />} />

                {/* Session 7: client-only routes (same GigForm for create and edit) */}
                <Route
                  path="/gigs/new"
                  element={<ProtectedRoute roles={['client']}><GigForm /></ProtectedRoute>}
                />
                <Route
                  path="/gigs/:id/edit"
                  element={<ProtectedRoute roles={['client']}><GigForm /></ProtectedRoute>}
                />
                <Route path="/gigs/:id" element={<GigDetails />} />

                {/* Any logged-in user */}
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                <Route path="/chat/:conversationId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

                {/* Admin only */}
                <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Admin /></ProtectedRoute>} />

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Toaster
            position="bottom-left"
            toastOptions={{
              className: 'toast',
              duration: 4000,
              // Colours are CSS variables, so toasts follow light / dark mode like everything else
              success: { iconTheme: { primary: 'var(--success)', secondary: 'var(--surface)' } },
              error: { iconTheme: { primary: 'var(--danger)', secondary: 'var(--surface)' } },
              loading: { iconTheme: { primary: 'var(--primary)', secondary: 'var(--border)' } },
              blank: { icon: <Bell className="toast__icon" size={16} aria-hidden="true" /> },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
