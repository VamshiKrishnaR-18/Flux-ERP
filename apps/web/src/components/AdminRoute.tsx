import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function AdminRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  
  if (user && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  
  return <Outlet />;
}