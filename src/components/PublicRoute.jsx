import { Navigate } from 'react-router';
import { useAuthStore } from '@/stores/authStore';

export function PublicRoute({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const schoolId = useAuthStore((s) => s.schoolId);

  // Sesión completa (token + usuario + escuela) → dashboard
  if (accessToken && user && schoolId) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}