import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate, useNavigation } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/hooks/useAuth';
import { ModeToggle } from '@/components/ModeToggle';
import { getInitials, avatarColor } from '@/lib/materia-colors';
import { LayoutDashboard, CreditCard, School, LogOut, Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { path: '/admin',         label: 'Dashboard',  icon: LayoutDashboard, exact: true },
  { path: '/admin/plans',   label: 'Planes',     icon: CreditCard },
  { path: '/admin/schools', label: 'Escuelas',   icon: School },
];

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
      <span>{item.label}</span>
    </Link>
  );
};

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isNavigating = navigation.state !== 'idle';

  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const logout = useLogout();

  const isActive = (item) =>
    item.exact ? location.pathname === item.path : location.pathname.startsWith(item.path);

  const handleLogout = async () => {
    try { await logout.mutateAsync(); } catch { /* ignored */ }
    clearAuth();
    navigate('/login');
  };

  const userInitials = getInitials(user?.fullName || user?.email || '');
  const userAvatarBg = avatarColor(user?.fullName || user?.email || '');

  const SidebarContent = ({ onItemClick }) => (
    <>
      <div style={{ padding: '18px 18px 16px', borderBottom: '1px solid oklch(99% 0 0 / 0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: 'oklch(99% 0 0 / 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="none">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--p-sidebar-text-active)', letterSpacing: '-0.03em' }}>Pensum</div>
          <div style={{ fontSize: 10.5, color: 'var(--p-sidebar-text)', marginTop: 1 }}>Super Admin</div>
        </div>
      </div>

      <nav style={{ flex: 1, padding: '10px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.path} item={item} isActive={isActive(item)} onClick={() => { setSidebarOpen(false); onItemClick?.(); }} />
        ))}
      </nav>

      <div style={{ margin: 8, padding: '10px 12px', background: 'oklch(99% 0 0 / 0.06)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: '99px', background: userAvatarBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
          {userInitials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--p-sidebar-text-active)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.fullName || user?.email}</div>
          <div style={{ fontSize: 10.5, color: 'var(--p-sidebar-text)' }}>superadmin</div>
        </div>
      </div>
    </>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--p-bg-app)', overflow: 'hidden' }}>
      {isNavigating && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, height: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '33%', background: 'var(--p-accent)', animation: 'slide 0.8s ease-in-out infinite' }} />
        </div>
      )}

      <aside style={{ width: 256, flexShrink: 0, height: '100vh', background: 'var(--p-sidebar-bg)', display: 'none', flexDirection: 'column', borderRight: '1px solid oklch(99% 0 0 / 0.06)', position: 'sticky', top: 0 }} className="md-sidebar">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} className="md:hidden">
          <div style={{ position: 'fixed', inset: 0, background: 'oklch(0% 0 0 / 0.5)' }} onClick={() => setSidebarOpen(false)} />
          <aside style={{ position: 'fixed', left: 0, top: 0, bottom: 0, width: 256, background: 'var(--p-sidebar-bg)', display: 'flex', flexDirection: 'column', zIndex: 50 }}>
            <div style={{ padding: '12px 16px', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid oklch(99% 0 0 / 0.07)' }}>
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'transparent', border: 'none', color: 'var(--p-sidebar-text)', cursor: 'pointer', display: 'flex', padding: 4 }}><X size={18} /></button>
            </div>
            <SidebarContent onItemClick={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <header style={{ height: 54, flexShrink: 0, background: 'var(--p-bg-base)', borderBottom: '1px solid var(--p-border)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10, position: 'sticky', top: 0, zIndex: 10 }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'transparent', border: 'none', color: 'var(--p-text-secondary)', cursor: 'pointer', display: 'flex', padding: 4 }} className="md:hidden">
            <Menu size={20} />
          </button>
          <div style={{ flex: 1 }} />
          <ModeToggle />
          <button
            onClick={handleLogout}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', border: '1px solid var(--p-border)', borderRadius: 10, background: 'transparent', color: 'var(--p-text-secondary)', fontSize: 13, fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer' }}
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
        @media (min-width: 768px) { .md-sidebar { display: flex !important; } .md\\:hidden { display: none !important; } }
      `}</style>
    </div>
  );
}
