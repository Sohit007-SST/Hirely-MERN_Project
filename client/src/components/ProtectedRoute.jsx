// Props: { roles?: string[] (e.g. ['client']), children }
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Loader from './Loader';
import EmptyState from './EmptyState';

// Session 7: protected routes on the client
export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Wait for GET /auth/me before deciding, or a refresh would bounce to /login
  if (loading) return <Loader full />;

  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;

  if (roles?.length && !roles.includes(user.role)) {
    return (
      <div className="container page">
        <EmptyState
          title="You don't have access to this page"
          text={`This page is for ${roles.join(' or ')} accounts. You're logged in as a ${user.role}.`}
          action={
            <Link className="btn btn--primary" to="/dashboard">
              Go to your dashboard
            </Link>
          }
        />
      </div>
    );
  }

  return children;
}
