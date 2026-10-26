import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
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
            position="top-right"
            toastOptions={{
              className: 'toast',
              duration: 4000,
              success: { iconTheme: { primary: '#0f7b6c', secondary: '#ffffff' } },
              error: { iconTheme: { primary: '#b4441c', secondary: '#ffffff' } },
            }}
          />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
