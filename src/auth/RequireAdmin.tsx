import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

export default function RequireAdmin() {
  const { isAuthenticated, hasRole } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasRole('ROLE_ADMIN')) return <div style={{ padding: 24 }}>No autorizado</div>;

  return <Outlet />;
}