import { Navigate, Outlet } from 'react-router-dom';

export default function ProtectedLayout() {
  const token = localStorage.getItem('token');

  // 1. The Check: If no token, kick them out
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 2. The Pass: If token exists, show the child page (Dashboard)
  return <Outlet />;
}