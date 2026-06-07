import { Navigate, Outlet } from 'react-router';
import { useAuthStore } from '@/stores/authStore';

/**
 * Route-level guard for the /admin area: only global admins (superadmin) may
 * enter. Non-admins are bounced to their dashboard. This complements the
 * server-side RBAC — the UI shouldn't even render admin shells for tenant users.
 */
export function AdminRoute() {
  const user = useAuthStore((s) => s.user);

  if (!user?.isGlobalAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
