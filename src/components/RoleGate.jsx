import { useAuthStore } from '@/stores/authStore';

/**
 * Renderiza children solo si el usuario tiene uno de los roles permitidos.
 */
export function RoleGate({ roles, children, fallback = null }) {
  const user = useAuthStore((s) => s.user);

  if (!user || !roles.includes(user.role)) {
    return fallback;
  }

  return children;
}