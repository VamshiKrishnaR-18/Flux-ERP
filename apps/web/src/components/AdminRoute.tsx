import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AdminRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  // If logged in but NOT admin, kick them to dashboard
  if (user && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // If not logged in at all, the ProtectedLayout will handle it, 
  // but we allow the Outlet here assuming ProtectedLayout is the parent.
  return <Outlet />;
}