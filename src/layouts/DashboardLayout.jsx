import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/hooks/useAuth';
import {
  LayoutDashboard, DoorOpen, BookOpen, GraduationCap,
  Calendar, School, UserCircle, LogOut, Menu, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const allNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: null },
  { path: '/dashboard/classrooms', label: 'Aulas', icon: DoorOpen, roles: null },
  { path: '/dashboard/subjects', label: 'Materias', icon: BookOpen, roles: null },
  { path: '/dashboard/courses', label: 'Cursos', icon: GraduationCap, roles: null },
  { path: '/dashboard/academic-years', label: 'Años Académicos', icon: Calendar, roles: ['director', 'teacher'] },
  { path: '/dashboard/school', label: 'Mi Escuela', icon: School, roles: null },
  { path: '/dashboard/profile', label: 'Mi Perfil', icon: UserCircle, roles: null },
];

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const logout = useLogout();

  const navItems = allNavItems.filter(
    (item) => item.roles === null || item.roles.includes(user?.role)
  );

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
    } catch {
      // Aunque falle, limpiar sesión local
    }
    clearAuth();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar — desktop */}
      <aside className="hidden md:flex md:w-64 md:flex-col bg-white border-r">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">SaaS Educativo</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                isActive(item.path)
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Sidebar — mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white z-50">
            <div className="p-4 border-b flex justify-between items-center">
              <h1 className="text-xl font-bold">SaaS Educativo</h1>
              <button onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
          <button className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4 ml-auto">
            <span className="text-sm text-gray-600">{user?.fullName || user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Salir
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}