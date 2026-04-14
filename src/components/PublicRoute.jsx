import { Navigate } from 'react-router';
import { useAuthStore } from '@/stores/authStore';

export function PublicRoute({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  // Si ya está logueado, mandarlo al dashboard
  if (accessToken && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}