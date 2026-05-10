import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate, useNavigation } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/hooks/useAuth';
import { ModeToggle } from '@/components/ModeToggle';
import { getInitials, avatarColor } from '@/lib/materia-colors';
import { queryClient } from '@/lib/queryClient';
import api from '@/lib/axios';
import {
  LayoutDashboard, DoorOpen, BookOpen, GraduationCap,
  Calendar, School, UserCircle, Users, UserPlus,
  LogOut, Menu, X, Bell, Search, CreditCard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_BY_ROLE = {
  director: [
    { path: '/dashboard',                label: 'Dashboard',       icon: LayoutDashboard, prefetch: () => import('@/pages/DashboardPage'),     prefetchQuery: () => Promise.all([queryClient.prefetchQuery({ queryKey: ['dashboard','stats'],    queryFn: () => api.get('/api/dashboard/stats').then(r=>r.data)    }), queryClient.prefetchQuery({ queryKey: ['dashboard','activity'], queryFn: () => api.get('/api/dashboard/activity').then(r=>r.data) })]) },
    { path: '/dashboard/classrooms',     label: 'Aulas',           icon: DoorOpen,        prefetch: () => import('@/pages/ClassroomsPage'),    prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['classrooms'],     queryFn: () => api.get('/api/classrooms?limit=200').then(r=>r.data.data)     }) },
    { path: '/dashboard/subjects',       label: 'Materias',        icon: BookOpen,        prefetch: () => import('@/pages/SubjectsPage'),      prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['subjects'],       queryFn: () => api.get('/api/subjects?limit=200').then(r=>r.data.data)       }) },
    { path: '/dashboard/courses',        label: 'Cursos',          icon: GraduationCap,   prefetch: () => import('@/pages/CoursesPage'),       prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['courses'],        queryFn: () => api.get('/api/courses?limit=200').then(r=>r.data.data)        }) },
    { path: '/dashboard/academic-years', label: 'Años Académicos', icon: Calendar,        prefetch: () => import('@/pages/AcademicYearsPage'), prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['academic-years'], queryFn: () => api.get('/api/academic-years?limit=200').then(r=>r.data.data) }) },
    { path: '/dashboard/inscriptions',   label: 'Inscripciones',   icon: UserPlus,        prefetch: () => import('@/pages/EnrollmentsPage'),   prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['courses'],        queryFn: () => api.get('/api/courses?limit=200').then(r=>r.data.data)        }) },
    { path: '/dashboard/members',        label: 'Miembros',        icon: Users,           prefetch: () => import('@/pages/MembersPage'),       prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['members'],        queryFn: () => api.get('/api/members?limit=200').then(r=>r.data.data)        }) },
    { divider: true, id: 'divider' },
    { path: '/dashboard/billing',        label: 'Facturación',     icon: CreditCard,      prefetch: () => import('@/pages/BillingPage') },
    { path: '/dashboard/school',         label: 'Mi Escuela',      icon: School,          prefetch: () => import('@/pages/SchoolPage'),        prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['school'],         queryFn: () => api.get('/api/schools/me').then(r=>r.data)                    }) },
    { path: '/dashboard/profile',        label: 'Mi Perfil',       icon: UserCircle,      prefetch: () => import('@/pages/ProfilePage'),       prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['profile'],        queryFn: () => api.get('/api/auth/me').then(r=>r.data)                       }) },
  ],
  teacher: [
    { path: '/dashboard',            label: 'Dashboard',  icon: LayoutDashboard, prefetch: () => import('@/pages/DashboardPage'),  prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['my-courses'], queryFn: () => api.get('/api/courses/me').then(r=>r.data) }) },
    { path: '/dashboard/mis-cursos', label: 'Mis Cursos', icon: GraduationCap,   prefetch: () => import('@/pages/MyCoursesPage'), prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['my-courses'], queryFn: () => api.get('/api/courses/me').then(r=>r.data) }) },
    { divider: true, id: 'divider' },
    { path: '/dashboard/profile',    label: 'Mi Perfil',  icon: UserCircle,      prefetch: () => import('@/pages/ProfilePage'),   prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['profile'],    queryFn: () => api.get('/api/auth/me').then(r=>r.data)    }) },
  ],
  student: [
    { path: '/dashboard',            label: 'Dashboard',  icon: LayoutDashboard, prefetch: () => import('@/pages/DashboardPage'),  prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['my-courses'], queryFn: () => api.get('/api/courses/me').then(r=>r.data) }) },
    { path: '/dashboard/mis-cursos', label: 'Mis Cursos', icon: GraduationCap,   prefetch: () => import('@/pages/MyCoursesPage'), prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['my-courses'], queryFn: () => api.get('/api/courses/me').then(r=>r.data) }) },
    { divider: true, id: 'divider' },
    { path: '/dashboard/profile',    label: 'Mi Perfil',  icon: UserCircle,      prefetch: () => import('@/pages/ProfilePage'),   prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['profile'],    queryFn: () => api.get('/api/auth/me').then(r=>r.data)    }) },
  ],
  parent: [
    { path: '/dashboard',           label: 'Dashboard', icon: LayoutDashboard, prefetch: () => import('@/pages/DashboardPage'),   prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['my-children'], queryFn: () => api.get('/api/members/my-children').then(r=>r.data) }) },
    { path: '/dashboard/mis-hijos', label: 'Mis Hijos', icon: Users,           prefetch: () => import('@/pages/MyChildrenPage'), prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['my-children'], queryFn: () => api.get('/api/members/my-children').then(r=>r.data) }) },
    { divider: true, id: 'divider' },
    { path: '/dashboard/profile',   label: 'Mi Perfil', icon: UserCircle,      prefetch: () => import('@/pages/ProfilePage'),    prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['profile'],     queryFn: () => api.get('/api/auth/me').then(r=>r.data)                      }) },
  ],
};

const NavItem = ({ item, isActive, onClick }) => {
  const Icon = item.icon;
  const handleHover = () => {
    item.prefetch?.();
    item.prefetchQuery?.();
  };
  return (
    <Link to={item.path} onClick={onClick} onMouseEnter={handleHover}
      className={cn(
        'flex items-center gap-[10px] px-3 py-[7px] rounded-[10px] no-underline transition-all duration-100 text-[13.5px]',
        isActive
          ? 'bg-p-sidebar-active text-p-sidebar-text-active font-medium'
          : 'text-p-sidebar-text font-normal hover:bg-p-sidebar-hover hover:text-p-sidebar-text-active'
      )}>
      <Icon size={15} />
      <span className="flex-1">{item.label}</span>
      {isActive && <span className="size-[5px] rounded-full bg-p-sidebar-text-active opacity-40" />}
    </Link>
  );
};

function SidebarContent({ navItems, isActive, onItemClick, user, role, userInitials, userAvatarBg }) {
  return (
    <>
      <div className="px-[18px] pt-[14px] pb-3 border-b border-[oklch(99%_0_0/0.07)] flex flex-col gap-[6px]">
        <img src="/logo-pensum.png" alt="Pensum" className="h-[30px] brightness-0 invert object-contain object-left" />
        <div className="text-[10.5px] text-p-sidebar-text pl-[2px]">
          {user?.schoolName || 'Instituto Demo'}
        </div>
      </div>

      <nav className="flex-1 p-2 flex flex-col gap-px overflow-y-auto">
        {navItems.map((item) =>
          item.divider ? (
            <div key={item.id} className="my-2 border-t border-[oklch(99%_0_0/0.07)]" />
          ) : (
            <NavItem key={item.path} item={item} isActive={isActive(item.path)}
              onClick={onItemClick} />
          )
        )}
      </nav>

      <div className="m-2 px-3 py-[10px] bg-[oklch(99%_0_0/0.06)] rounded-[10px] flex items-center gap-[10px]">
        <div className="size-[30px] rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
          style={{ background: userAvatarBg }}>
          {userInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-medium text-p-sidebar-text-active truncate">
            {user?.fullName || user?.email || 'Usuario'}
          </div>
          <div className="text-[10.5px] text-p-sidebar-text capitalize">{role}</div>
        </div>
      </div>
    </>
  );
}

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isNavigating = navigation.state !== 'idle';

  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const logout = useLogout();

  const role = user?.role ?? 'student';
  const navItems = NAV_BY_ROLE[role] ?? NAV_BY_ROLE.student;

  // Prefetch JS chunks and queries for all nav items in background after mount
  useEffect(() => {
    const timer = setTimeout(() => {
      navItems.forEach((item) => {
        if (item.divider) return;
        item.prefetch?.();
        item.prefetchQuery?.();
      });
    }, 1500); // wait 1.5s so the current page renders first
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const isActive = (path) =>
    path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(path);

  const handleLogout = async () => {
    try { await logout.mutateAsync(); } catch { /* ignored */ }
    queryClient.clear();
    clearAuth();
    navigate('/login');
  };

  const userInitials = getInitials(user?.fullName || user?.email || '');
  const userAvatarBg = avatarColor(user?.fullName || user?.email || '');

  const sidebarProps = { navItems, isActive, user, role, userInitials, userAvatarBg };

  return (
    <div className="flex h-screen bg-p-bg-app overflow-hidden">
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 overflow-hidden">
          <div className="h-full w-1/3 bg-p-accent [animation:slide_0.8s_ease-in-out_infinite]" />
        </div>
      )}

      {/* Sidebar desktop */}
      <aside className="hidden md:flex w-64 shrink-0 h-screen bg-p-sidebar-bg flex-col border-r border-[oklch(99%_0_0/0.06)] sticky top-0">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Sidebar mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div role="presentation" className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} onKeyDown={(e) => { if (e.key === 'Escape') setSidebarOpen(false); }} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-p-sidebar-bg flex flex-col z-50">
            <div className="px-4 py-3 flex justify-end border-b border-[oklch(99%_0_0/0.07)]">
              <button onClick={() => setSidebarOpen(false)}
                className="bg-transparent border-0 text-p-sidebar-text cursor-pointer flex p-1">
                <X size={18} />
              </button>
            </div>
            <SidebarContent {...sidebarProps} onItemClick={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-[54px] shrink-0 bg-p-bg-base border-b border-p-border flex items-center px-5 gap-[10px] sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)}
            className="md:hidden bg-transparent border-0 text-p-text-secondary cursor-pointer flex p-1">
            <Menu size={20} />
          </button>

          <div className="flex items-center gap-2 px-[11px] py-[6px] bg-p-bg-subtle border border-p-border rounded-[10px] text-p-text-tertiary text-[13px] cursor-text w-[210px]">
            <Search size={13} />
            <span>Buscar…</span>
            <span className="ml-auto text-[10px] px-[5px] py-px bg-p-bg-muted rounded">⌘K</span>
          </div>

          <div className="flex-1" />

          <button className="size-[34px] rounded-[10px] border border-p-border bg-transparent flex items-center justify-center cursor-pointer text-p-text-secondary relative">
            <Bell size={15} />
            <span className="absolute top-[6px] right-[6px] size-[6px] rounded-full bg-p-d-500 border-[1.5px] border-p-bg-base" />
          </button>

          <ModeToggle />

          <button onClick={handleLogout}
            className="flex items-center gap-[6px] px-3 py-[6px] border border-p-border rounded-[10px] bg-transparent text-p-text-secondary text-[13px] font-sans font-medium cursor-pointer transition-all duration-100 hover:bg-p-bg-subtle hover:text-p-text-primary">
            <LogOut size={13} />
            Salir
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
