import { Link, useLocation } from 'react-router';
import {
  LayoutDashboard, DoorOpen, BookOpen, GraduationCap,
  Calendar, School, UserCircle,
} from 'lucide-react';

const allNavItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: null },
  { path: '/dashboard/classrooms', label: 'Aulas', icon: DoorOpen, roles: null },
  { path: '/dashboard/subjects', label: 'Materias', icon: BookOpen, roles: null },
  { path: '/dashboard/courses', label: 'Cursos', icon: GraduationCap, roles: null },
  { path: '/dashboard/academic-years', label: 'Años Académicos', icon: Calendar, roles: ['director', 'teacher'] },
  { path: '/dashboard/school', label: 'Mi Escuela', icon: School, roles: null },
  { path: '/dashboard/profile', label: 'Mi Perfil', icon: UserCircle, roles: null },
];

function isActive(location, path) {
  if (path === '/dashboard') return location.pathname === '/dashboard';
  return location.pathname.startsWith(path);
}

export function Sidebar({ user }) {
  const location = useLocation();

  const navItems = allNavItems.filter(
    (item) => item.roles === null || item.roles.includes(user?.role)
  );

  return (
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
              isActive(location, item.path)
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
  );
}