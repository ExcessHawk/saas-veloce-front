import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate, useNavigation } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { ModeToggle } from '@/components/ModeToggle';
import { DashboardBanners } from '@/components/DashboardBanners';
import { getInitials, avatarColor } from '@/lib/materia-colors';
import { queryClient } from '@/lib/queryClient';
import api from '@/lib/axios';
import {
  LayoutDashboard, DoorOpen, BookOpen, GraduationCap,
  Calendar, School, UserCircle, Users, UserPlus,
  LogOut, Menu, X, Bell, Search, CreditCard, ListOrdered,
  ClipboardList, CheckCircle, MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_BY_ROLE = {
  director: [
    { path: '/dashboard',                label: 'Dashboard',       icon: LayoutDashboard, prefetch: () => import('@/pages/DashboardPage'),     prefetchQuery: () => Promise.all([queryClient.prefetchQuery({ queryKey: ['dashboard','stats'],    queryFn: () => api.get('/api/dashboard/stats').then(r=>r.data)    }), queryClient.prefetchQuery({ queryKey: ['dashboard','activity'], queryFn: () => api.get('/api/dashboard/activity').then(r=>r.data) })]) },
    { path: '/dashboard/classrooms',     label: 'Aulas',           icon: DoorOpen,        prefetch: () => import('@/pages/ClassroomsPage'),    prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['classrooms'],     queryFn: () => api.get('/api/classrooms?limit=200').then(r=>r.data.data)     }) },
    { path: '/dashboard/subjects',       label: 'Materias',        icon: BookOpen,        prefetch: () => import('@/pages/SubjectsPage'),      prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['subjects'],       queryFn: () => api.get('/api/subjects?limit=200').then(r=>r.data.data)       }) },
    { path: '/dashboard/courses',        label: 'Cursos',          icon: GraduationCap,   prefetch: () => import('@/pages/CoursesPage'),       prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['courses'],        queryFn: () => api.get('/api/courses?limit=200').then(r=>r.data.data)        }) },
    { path: '/dashboard/academic-years', label: 'Años Académicos', icon: Calendar,        prefetch: () => import('@/pages/AcademicYearsPage'), prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['academic-years'], queryFn: () => api.get('/api/academic-years?limit=200').then(r=>r.data.data) }) },
    { path: '/dashboard/grade-levels',   label: 'Niveles de Grado', icon: ListOrdered,    prefetch: () => import('@/pages/GradeLevelsPage'),   prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['grade-levels'],   queryFn: () => api.get('/api/grade-levels').then(r=>r.data)  }) },
    { path: '/dashboard/inscriptions',   label: 'Inscripciones',   icon: UserPlus,        prefetch: () => import('@/pages/EnrollmentsPage'),   prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['courses'],        queryFn: () => api.get('/api/courses?limit=200').then(r=>r.data.data)        }) },
    { path: '/dashboard/members',        label: 'Miembros',        icon: Users,           prefetch: () => import('@/pages/MembersPage'),       prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['members'],        queryFn: () => api.get('/api/members?limit=200').then(r=>r.data.data)        }) },
    { divider: true, id: 'divider-director' },
    { path: '/dashboard/billing',        label: 'Facturación',     icon: CreditCard,      prefetch: () => import('@/pages/BillingPage') },
    { path: '/dashboard/school',         label: 'Mi Escuela',      icon: School,          prefetch: () => import('@/pages/SchoolPage'),        prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['school'],         queryFn: () => api.get('/api/schools/me').then(r=>r.data)                    }) },
    { path: '/dashboard/profile',        label: 'Mi Perfil',       icon: UserCircle,      prefetch: () => import('@/pages/ProfilePage'),       prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['profile'],        queryFn: () => api.get('/api/auth/me').then(r=>r.data)                       }) },
  ],
  teacher: [
    { path: '/dashboard',            label: 'Dashboard',  icon: LayoutDashboard, prefetch: () => import('@/pages/DashboardPage'),  prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['my-courses'], queryFn: () => api.get('/api/courses/me').then(r=>r.data) }) },
    { path: '/dashboard/mis-cursos', label: 'Mis Cursos', icon: GraduationCap,   prefetch: () => import('@/pages/MyCoursesPage'), prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['my-courses'], queryFn: () => api.get('/api/courses/me').then(r=>r.data) }) },
    { path: '/dashboard/chat',       label: 'Chat',       icon: MessageSquare,   prefetch: () => import('@/pages/ChatPage'),      prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['chat-conversations'], queryFn: () => api.get('/api/chat/conversations').then(r=>r.data) }) },
    { divider: true, id: 'divider-teacher' },
    { path: '/dashboard/profile',    label: 'Mi Perfil',  icon: UserCircle,      prefetch: () => import('@/pages/ProfilePage'),   prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['profile'],    queryFn: () => api.get('/api/auth/me').then(r=>r.data)    }) },
  ],
  student: [
    { path: '/dashboard',            label: 'Dashboard',  icon: LayoutDashboard, prefetch: () => import('@/pages/DashboardPage'),  prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['my-courses'], queryFn: () => api.get('/api/courses/me').then(r=>r.data) }) },
    { path: '/dashboard/mis-cursos', label: 'Mis Cursos', icon: GraduationCap,   prefetch: () => import('@/pages/MyCoursesPage'), prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['my-courses'], queryFn: () => api.get('/api/courses/me').then(r=>r.data) }) },
    { divider: true, id: 'divider-student' },
    { path: '/dashboard/profile',    label: 'Mi Perfil',  icon: UserCircle,      prefetch: () => import('@/pages/ProfilePage'),   prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['profile'],    queryFn: () => api.get('/api/auth/me').then(r=>r.data)    }) },
  ],
  parent: [
    { path: '/dashboard',           label: 'Dashboard', icon: LayoutDashboard, prefetch: () => import('@/pages/DashboardPage'),   prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['my-children'], queryFn: () => api.get('/api/members/my-children').then(r=>r.data) }) },
    { path: '/dashboard/mis-hijos', label: 'Mis Hijos', icon: Users,           prefetch: () => import('@/pages/MyChildrenPage'), prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['my-children'], queryFn: () => api.get('/api/members/my-children').then(r=>r.data) }) },
    { path: '/dashboard/chat',      label: 'Chat',      icon: MessageSquare,   prefetch: () => import('@/pages/ChatPage'),       prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['chat-conversations'], queryFn: () => api.get('/api/chat/conversations').then(r=>r.data) }) },
    { divider: true, id: 'divider-parent' },
    { path: '/dashboard/profile',   label: 'Mi Perfil', icon: UserCircle,      prefetch: () => import('@/pages/ProfilePage'),    prefetchQuery: () => queryClient.prefetchQuery({ queryKey: ['profile'],     queryFn: () => api.get('/api/auth/me').then(r=>r.data)                      }) },
  ],
};

// ─── Command Palette ─────────────────────────────────────────────────────────

/**
 * Keyboard-driven command palette (⌘K / Ctrl+K).
 * Searches nav items for the current role and navigates on selection.
 */
function CommandPalette({ open, onClose, navItems, navigate }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);
  const [cursor, setCursor] = useState(0);

  const pages = navItems.filter((i) => !i.divider);

  const results = query.trim()
    ? pages.filter((i) => i.label.toLowerCase().includes(query.toLowerCase()))
    : pages;

  useEffect(() => { if (open) { setQuery(''); setCursor(0); setTimeout(() => inputRef.current?.focus(), 30); } }, [open]);
  useEffect(() => { setCursor(0); }, [query]);

  const select = useCallback((item) => {
    navigate(item.path);
    onClose();
  }, [navigate, onClose]);

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor((c) => Math.min(c + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setCursor((c) => Math.max(c - 1, 0)); }
    else if (e.key === 'Enter') { if (results[cursor]) select(results[cursor]); }
    else if (e.key === 'Escape') onClose();
  };

  if (!open) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4"
      onClick={onClose}
      onKeyDown={(e) => { if (e.key === 'Escape') onClose(); }}
    >
      <div className="absolute inset-0 bg-[oklch(0%_0_0/0.40)] backdrop-blur-[3px]" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        className="relative w-full max-w-[480px] bg-p-bg-base border border-p-border rounded-2xl shadow-p-lg overflow-hidden [animation:dropIn_0.15s_ease]"
      >
        {/* Input */}
        <div className="flex items-center gap-[10px] px-4 py-[13px] border-b border-p-border">
          <Search size={15} className="text-p-text-tertiary shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Buscar página…"
            className="flex-1 bg-transparent border-none outline-none text-[14px] text-p-text-primary placeholder:text-p-text-tertiary font-[inherit]"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} className="text-p-text-tertiary border-none bg-transparent cursor-pointer flex p-0">
              <X size={13} />
            </button>
          )}
          <kbd className="text-[10px] px-[6px] py-[2px] rounded bg-p-bg-muted text-p-text-tertiary border border-p-border font-mono">Esc</kbd>
        </div>

        {/* Results */}
        <div className="max-h-[320px] overflow-y-auto py-1">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-p-text-tertiary">
              Sin resultados para &ldquo;{query}&rdquo;
            </div>
          ) : (
            results.map((item, i) => {
              const Icon = item.icon;
              const active = i === cursor;
              return (
                <button
                  key={item.path}
                  type="button"
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => select(item)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-[10px] border-none cursor-pointer font-[inherit] text-left transition-colors duration-[80ms]',
                    active ? 'bg-p-bg-subtle' : 'bg-transparent',
                  )}
                >
                  <div className={cn(
                    'size-7 rounded-[8px] flex items-center justify-center shrink-0 transition-colors duration-[80ms]',
                    active ? 'bg-p-accent text-p-accent-text' : 'bg-p-bg-muted text-p-text-secondary',
                  )}>
                    <Icon size={13} />
                  </div>
                  <span className={cn('text-[13.5px]', active ? 'text-p-text-primary font-medium' : 'text-p-text-secondary')}>
                    {item.label}
                  </span>
                  {active && (
                    <kbd className="ml-auto text-[10px] px-[5px] py-[1px] rounded bg-p-bg-muted text-p-text-tertiary border border-p-border font-mono">↵</kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-[9px] border-t border-p-border flex items-center gap-3 text-[11px] text-p-text-tertiary">
          <span><kbd className="font-mono">↑↓</kbd> navegar</span>
          <span><kbd className="font-mono">↵</kbd> abrir</span>
          <span><kbd className="font-mono">Esc</kbd> cerrar</span>
        </div>
      </div>
    </div>
  );
}

// ─── Notifications Panel ──────────────────────────────────────────────────────

const NOTIF_ICON = {
  task_created:       ClipboardList,
  task_graded:        CheckCircle,
  submission_received: GraduationCap,
  member_joined:      Users,
  member_invited:     Users,
};
const NOTIF_COLOR = {
  task_created:       'bg-[oklch(91%_0.040_300)] dark:bg-[oklch(22%_0.040_300)] text-[oklch(30%_0.06_300)] dark:text-[oklch(75%_0.06_300)]',
  task_graded:        'bg-[oklch(93%_0.040_150)] dark:bg-[oklch(22%_0.040_150)] text-[oklch(32%_0.09_150)] dark:text-[oklch(72%_0.09_150)]',
  submission_received:'bg-[oklch(88%_0.060_150)] dark:bg-[oklch(22%_0.060_150)] text-[oklch(30%_0.09_150)] dark:text-[oklch(72%_0.09_150)]',
  member_joined:      'bg-[oklch(88%_0.040_250)] dark:bg-[oklch(22%_0.040_250)] text-[oklch(30%_0.06_250)] dark:text-[oklch(75%_0.06_250)]',
  member_invited:     'bg-[oklch(88%_0.040_250)] dark:bg-[oklch(22%_0.040_250)] text-[oklch(30%_0.06_250)] dark:text-[oklch(75%_0.06_250)]',
};

function relTime(iso) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'Ahora';
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} h`;
  return `Hace ${Math.floor(h / 24)} d`;
}

function NotificationsPanel({ open, onClose, notifications, unreadCount, markRead, markAllRead, navigate }) {
  const panelRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) onClose(); };
    const t = setTimeout(() => document.addEventListener('mousedown', fn), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', fn); };
  }, [open, onClose]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [open, onClose]);

  if (!open) return null;

  const handleNotifClick = (notif) => {
    if (!notif.readAt) markRead([notif.id]);
    if (notif.link) { navigate(notif.link); onClose(); }
  };

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="false"
      aria-label="Notificaciones"
      className="absolute top-[calc(100%+8px)] right-0 z-[100] w-[340px] bg-p-bg-base border border-p-border rounded-2xl shadow-p-lg overflow-hidden [animation:dropIn_0.15s_ease]"
    >
      {/* Header */}
      <div className="px-4 py-[13px] border-b border-p-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-bold text-p-text-primary">Notificaciones</span>
          {unreadCount > 0 && (
            <span className="px-[7px] py-[1px] rounded-full text-[11px] font-bold bg-p-accent text-p-accent-text">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-[11.5px] text-p-text-tertiary border-none bg-transparent cursor-pointer hover:text-p-text-primary px-2 py-1 rounded-[7px] hover:bg-p-bg-subtle"
            >
              Marcar todas
            </button>
          )}
          <button type="button" onClick={onClose} className="size-6 rounded-[7px] border-none bg-transparent cursor-pointer text-p-text-tertiary flex items-center justify-center hover:bg-p-bg-subtle hover:text-p-text-primary">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="max-h-[420px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <Bell size={28} className="text-p-text-tertiary mx-auto mb-3 opacity-40" />
            <div className="text-[13px] text-p-text-tertiary">Sin notificaciones</div>
          </div>
        ) : (
          <div className="py-1">
            {notifications.map((n, i) => {
              const Icon = NOTIF_ICON[n.type] ?? Bell;
              const colorCls = NOTIF_COLOR[n.type] ?? 'bg-p-bg-subtle text-p-text-secondary';
              const isUnread = !n.readAt;
              return (
                <button
                  key={n.id ?? `notif-${i}`}
                  type="button"
                  onClick={() => handleNotifClick(n)}
                  className={cn(
                    'w-full flex gap-3 px-4 py-[11px] border-none cursor-pointer font-[inherit] text-left transition-colors duration-[80ms]',
                    isUnread ? 'bg-p-bg-subtle hover:bg-p-bg-muted' : 'bg-transparent hover:bg-p-bg-subtle',
                  )}
                >
                  <div className={cn('size-8 rounded-[10px] flex items-center justify-center shrink-0', colorCls)}>
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className={cn('text-[13px] leading-snug', isUnread ? 'font-semibold text-p-text-primary' : 'font-medium text-p-text-primary')}>
                        {n.title}
                      </div>
                      {isUnread && <span className="size-[6px] rounded-full bg-p-accent shrink-0 mt-[5px]" />}
                    </div>
                    <div className="text-[12px] text-p-text-secondary mt-[2px] truncate">{n.body}</div>
                    <div className="text-[11px] text-p-text-tertiary mt-[3px]">{relTime(n.createdAt)}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="px-4 py-[10px] border-t border-p-border text-[11.5px] text-p-text-tertiary text-center">
          Últimas {notifications.length} notificaciones
        </div>
      )}
    </div>
  );
}

// ─── Nav item ─────────────────────────────────────────────────────────────────

const NavItem = ({ item, isActive, onClick }) => {  const Icon = item.icon;
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
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isNavigating = navigation.state !== 'idle';

  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const logout = useLogout();
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

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

  // ⌘K / Ctrl+K opens the command palette
  useEffect(() => {
    const fn = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
        setNotifOpen(false);
      }
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, []);

  // Close panels on route change
  useEffect(() => {
    setSearchOpen(false);
    setNotifOpen(false);
  }, [location.pathname]);

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

          <button
            type="button"
            onClick={() => { setSearchOpen(true); setNotifOpen(false); }}
            className="flex items-center gap-2 px-[11px] py-[6px] bg-p-bg-subtle border border-p-border rounded-[10px] text-p-text-tertiary text-[13px] cursor-pointer w-[210px] hover:border-p-border-strong transition-colors duration-100"
          >
            <Search size={13} />
            <span className="flex-1 text-left">Buscar…</span>
            <span className="text-[10px] px-[5px] py-px bg-p-bg-muted rounded border border-p-border">⌘K</span>
          </button>

          <div className="flex-1" />

          <div className="relative">
            <button
              type="button"
              onClick={() => { setNotifOpen((o) => !o); setSearchOpen(false); }}
              className="size-[34px] rounded-[10px] border border-p-border bg-transparent flex items-center justify-center cursor-pointer text-p-text-secondary relative hover:bg-p-bg-subtle transition-colors duration-100"
              aria-label="Notificaciones"
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="absolute -top-[3px] -right-[3px] min-w-[16px] h-[16px] px-[3px] rounded-full bg-p-accent text-p-accent-text text-[9px] font-bold flex items-center justify-center border-[1.5px] border-p-bg-base">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
            <NotificationsPanel
              open={notifOpen}
              onClose={() => setNotifOpen(false)}
              notifications={notifications}
              unreadCount={unreadCount}
              markRead={markRead}
              markAllRead={markAllRead}
              navigate={navigate}
            />
          </div>

          <ModeToggle />

          <button onClick={handleLogout}
            className="flex items-center gap-[6px] px-3 py-[6px] border border-p-border rounded-[10px] bg-transparent text-p-text-secondary text-[13px] font-sans font-medium cursor-pointer transition-all duration-100 hover:bg-p-bg-subtle hover:text-p-text-primary">
            <LogOut size={13} />
            Salir
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <DashboardBanners />
          <Outlet />
        </main>
      </div>

      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        navItems={navItems}
        navigate={navigate}
      />
    </div>
  );
}
