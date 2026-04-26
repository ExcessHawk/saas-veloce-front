import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate, useNavigation } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/hooks/useAuth';
import { ModeToggle } from '@/components/ModeToggle';
import { getInitials, avatarColor } from '@/lib/materia-colors';
import {
  LayoutDashboard, DoorOpen, BookOpen, GraduationCap,
  Calendar, School, UserCircle, Users, UserPlus,
  LogOut, Menu, X, Bell, Search, CreditCard,
} from 'lucide-react';

/* ── Nav por rol ── */
const NAV_BY_ROLE = {
  director: [
    { path: '/dashboard',               label: 'Dashboard',        icon: LayoutDashboard },
    { path: '/dashboard/classrooms',    label: 'Aulas',            icon: DoorOpen        },
    { path: '/dashboard/subjects',      label: 'Materias',         icon: BookOpen        },
    { path: '/dashboard/courses',       label: 'Cursos',           icon: GraduationCap   },
    { path: '/dashboard/academic-years',label: 'Años Académicos',  icon: Calendar        },
    { path: '/dashboard/inscriptions',  label: 'Inscripciones',    icon: UserPlus        },
    { path: '/dashboard/members',       label: 'Miembros',         icon: Users           },
    { divider: true },
    { path: '/dashboard/billing',       label: 'Facturación',      icon: CreditCard      },
    { path: '/dashboard/school',        label: 'Mi Escuela',       icon: School          },
    { path: '/dashboard/profile',       label: 'Mi Perfil',        icon: UserCircle      },
  ],
  teacher: [
    { path: '/dashboard',               label: 'Dashboard',        icon: LayoutDashboard },
    { path: '/dashboard/mis-cursos',    label: 'Mis Cursos',       icon: GraduationCap   },
    { divider: true },
    { path: '/dashboard/profile',       label: 'Mi Perfil',        icon: UserCircle      },
  ],
  student: [
    { path: '/dashboard',               label: 'Dashboard',        icon: LayoutDashboard },
    { path: '/dashboard/mis-cursos',    label: 'Mis Cursos',       icon: GraduationCap   },
    { divider: true },
    { path: '/dashboard/profile',       label: 'Mi Perfil',        icon: UserCircle      },
  ],
  parent: [
    { path: '/dashboard',               label: 'Dashboard',        icon: LayoutDashboard },
    { path: '/dashboard/mis-hijos',     label: 'Mis Hijos',        icon: Users           },
    { divider: true },
    { path: '/dashboard/profile',       label: 'Mi Perfil',        icon: UserCircle      },
  ],
};

const NavItem = ({ item, isActive, onClick }) => {
  const [hov, setHov] = useState(false);
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '7px 12px', borderRadius: 10,
        background: isActive ? 'var(--p-sidebar-active)' : hov ? 'var(--p-sidebar-hover)' : 'transparent',
        color: isActive || hov ? 'var(--p-sidebar-text-active)' : 'var(--p-sidebar-text)',
        fontSize: 13.5, fontWeight: isActive ? 500 : 400,
        textDecoration: 'none', transition: 'all 0.1s',
      }}
    >
      <Icon size={15} />
      <span style={{ flex: 1 }}>{item.label}</span>
      {isActive && (
        <span style={{ width: 5, height: 5, borderRadius: '99px', background: 'var(--p-sidebar-text-active)', opacity: 0.4 }} />
      )}
    </Link>
  );
};

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

  const isActive = (path) =>
    path === '/dashboard' ? location.pathname === '/dashboard' : location.pathname.startsWith(path);

  const handleLogout = async () => {
    try { await logout.mutateAsync(); } catch { /* ignored */ }
    clearAuth();
    navigate('/login');
  };

  const userInitials = getInitials(user?.fullName || user?.email || '');
  const userAvatarBg = avatarColor(user?.fullName || user?.email || '');

  const SidebarContent = ({ onItemClick }) => (
    <>
      {/* Logo */}
      <div style={{
        padding: '14px 18px 12px',
        borderBottom: '1px solid oklch(99% 0 0 / 0.07)',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <img src="/logo-pensum.png" alt="Pensum" style={{ height: 30, filter: 'brightness(0) invert(1)', objectFit: 'contain', objectPosition: 'left' }} />
        <div style={{ fontSize: 10.5, color: 'var(--p-sidebar-text)', paddingLeft: 2 }}>
          {user?.schoolName || 'Instituto Demo'}
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto' }}>
        {navItems.map((item, i) =>
          item.divider ? (
            <div key={i} style={{ margin: '8px 0', borderTop: '1px solid oklch(99% 0 0 / 0.07)' }} />
          ) : (
            <NavItem
              key={item.path}
              item={item}
              isActive={isActive(item.path)}
              onClick={() => { setSidebarOpen(false); onItemClick?.(); }}
            />
          )
        )}
      </nav>

      {/* User */}
      <div style={{
        margin: 8, padding: '10px 12px',
        background: 'oklch(99% 0 0 / 0.06)',
        borderRadius: 10,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: '99px',
          background: userAvatarBg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0,
        }}>
          {userInitials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--p-sidebar-text-active)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user?.fullName || user?.email || 'Usuario'}
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--p-sidebar-text)', textTransform: 'capitalize' }}>
            {role}
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--p-bg-app)', overflow: 'hidden' }}>

      {/* Navigation loading bar */}
      {isNavigating && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 2, overflow: 'hidden', background: 'transparent' }}>
          <div style={{ height: '100%', width: '33%', background: 'var(--p-accent)', animation: 'slide 0.8s ease-in-out infinite' }} />
        </div>
      )}

      {/* Sidebar — desktop */}
      <aside style={{
        width: 256, flexShrink: 0, height: '100vh',
        background: 'var(--p-sidebar-bg)',
        display: 'none',
        flexDirection: 'column',
        borderRight: '1px solid oklch(99% 0 0 / 0.06)',
        position: 'sticky', top: 0,
      }}
        className="md-sidebar"
      >
        <SidebarContent />
      </aside>

      {/* Sidebar — mobile overlay */}
      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} className="md:hidden">
          <div style={{ position: 'fixed', inset: 0, background: 'oklch(0% 0 0 / 0.5)' }} onClick={() => setSidebarOpen(false)} />
          <aside style={{
            position: 'fixed', left: 0, top: 0, bottom: 0, width: 256,
            background: 'var(--p-sidebar-bg)',
            display: 'flex', flexDirection: 'column', zIndex: 50,
          }}>
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid oklch(99% 0 0 / 0.07)' }}>
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--p-sidebar-text)', cursor: 'pointer', display: 'flex', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <SidebarContent onItemClick={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* Header */}
        <header style={{
          height: 54, flexShrink: 0,
          background: 'var(--p-bg-base)',
          borderBottom: '1px solid var(--p-border)',
          display: 'flex', alignItems: 'center',
          padding: '0 20px', gap: 10,
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            style={{ background: 'transparent', border: 'none', color: 'var(--p-text-secondary)', cursor: 'pointer', display: 'flex', padding: 4 }}
            className="md:hidden"
          >
            <Menu size={20} />
          </button>

          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 11px',
            background: 'var(--p-bg-subtle)',
            border: '1px solid var(--p-border)',
            borderRadius: 10,
            color: 'var(--p-text-tertiary)', fontSize: 13,
            cursor: 'text', width: 210,
          }}>
            <Search size={13} />
            <span>Buscar…</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, padding: '1px 5px', background: 'var(--p-bg-muted)', borderRadius: 4 }}>⌘K</span>
          </div>

          <div style={{ flex: 1 }} />

          {/* Bell */}
          <button style={{
            width: 34, height: 34, borderRadius: 10,
            border: '1px solid var(--p-border)', background: 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--p-text-secondary)', position: 'relative',
          }}>
            <Bell size={15} />
            <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: '99px', background: 'var(--p-d-500)', border: '1.5px solid var(--p-bg-base)' }} />
          </button>

          <ModeToggle />

          {/* Logout */}
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px',
              border: '1px solid var(--p-border)', borderRadius: 10,
              background: 'transparent', color: 'var(--p-text-secondary)',
              fontSize: 13, fontFamily: 'inherit', fontWeight: 500,
              cursor: 'pointer', transition: 'all 0.1s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--p-bg-subtle)'; e.currentTarget.style.color = 'var(--p-text-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--p-text-secondary)'; }}
          >
            <LogOut size={13} />
            Salir
          </button>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <Outlet />
        </main>
      </div>

      <style>{`
        @media (min-width: 768px) {
          .md-sidebar { display: flex !important; }
          .md\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
