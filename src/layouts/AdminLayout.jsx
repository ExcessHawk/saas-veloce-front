import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate, useNavigation } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { useLogout } from '@/hooks/useAuth';
import { ModeToggle } from '@/components/ModeToggle';
import { getInitials, avatarColor } from '@/lib/materia-colors';
import { LayoutDashboard, CreditCard, School, LogOut, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { path: '/admin',         label: 'Dashboard',  icon: LayoutDashboard, exact: true },
  { path: '/admin/plans',   label: 'Planes',     icon: CreditCard },
  { path: '/admin/schools', label: 'Escuelas',   icon: School },
];

const NavItem = ({ item, isActive, onClick }) => {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={cn(
        'flex items-center gap-[10px] px-3 py-[7px] rounded-xl no-underline transition-all duration-100 text-[13.5px]',
        isActive
          ? 'bg-p-sidebar-active text-p-sidebar-text-active font-medium'
          : 'text-p-sidebar-text font-normal hover:bg-p-sidebar-hover hover:text-p-sidebar-text-active'
      )}
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
      <div className="px-[18px] py-[17px] border-b border-[oklch(99%_0_0/0.07)] flex items-center gap-[10px]">
        <img src="/logo-pensum.png" alt="Pensum" className="h-7 brightness-0 invert object-contain" />
        <div className="text-[10.5px] text-p-sidebar-text mt-px">Super Admin</div>
      </div>

      <nav className="flex-1 p-2 flex flex-col gap-px">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.path} item={item} isActive={isActive(item)} onClick={() => { setSidebarOpen(false); onItemClick?.(); }} />
        ))}
      </nav>

      <div className="m-2 px-3 py-[10px] bg-[oklch(99%_0_0/0.06)] rounded-[10px] flex items-center gap-[10px]">
        <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
          style={{ background: userAvatarBg }}>
          {userInitials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[12.5px] font-medium text-p-sidebar-text-active truncate">{user?.fullName || user?.email}</div>
          <div className="text-[10.5px] text-p-sidebar-text">superadmin</div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-p-bg-app overflow-hidden">
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50 h-0.5 overflow-hidden">
          <div className="h-full w-1/3 bg-p-accent [animation:slide_0.8s_ease-in-out_infinite]" />
        </div>
      )}

      <aside className="hidden md:flex w-64 shrink-0 h-screen bg-p-sidebar-bg flex-col border-r border-[oklch(99%_0_0/0.06)] sticky top-0">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-p-sidebar-bg flex flex-col z-50">
            <div className="px-4 py-3 flex justify-end border-b border-[oklch(99%_0_0/0.07)]">
              <button onClick={() => setSidebarOpen(false)} className="bg-transparent border-0 text-p-sidebar-text cursor-pointer flex p-1"><X size={18} /></button>
            </div>
            <SidebarContent onItemClick={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-[54px] shrink-0 bg-p-bg-base border-b border-p-border flex items-center px-5 gap-[10px] sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden bg-transparent border-0 text-p-text-secondary cursor-pointer flex p-1">
            <Menu size={20} />
          </button>
          <div className="flex-1" />
          <ModeToggle />
          <button onClick={handleLogout}
            className="flex items-center gap-[6px] px-3 py-[6px] border border-p-border rounded-[10px] bg-transparent text-p-text-secondary text-[13px] font-sans font-medium cursor-pointer">
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
