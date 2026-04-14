import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/stores/authStore';

export function ProtectedRoute() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  if (!accessToken || !user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}