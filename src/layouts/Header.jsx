import { useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function Header() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const logout = useLogout();

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } catch {
      // Aunque falle la API, limpiar sesión local
    }
    clearAuth();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
      <div />
      <div className="flex items-center gap-4 ml-auto">
        <span className="text-sm text-gray-600">{user?.fullName || user?.email}</span>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" />
          Salir
        </Button>
      </div>
    </header>
  );
}