import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';

/** Shows a spinner while Firebase resolves auth state on first load. */
function AuthLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-navy-deep">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-venue-blue border-t-transparent" />
    </div>
  );
}

/**
 * Wraps protected routes. Redirects unauthenticated users to /login.
 * Shows a full-screen spinner while Firebase Auth is resolving on first load.
 */
export default function ProtectedRoute() {
  const { user, loading } = useAuthStore();
  if (loading) return <AuthLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}
