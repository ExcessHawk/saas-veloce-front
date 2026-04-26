import { LayoutDashboard, CreditCard, School } from 'lucide-react';
import { Link } from 'react-router';
import { useAdminPlans } from '@/hooks/useAdminPlans';
import { useAdminSchools } from '@/hooks/useAdminSchools';

export default function AdminDashboardPage() {
  const { data: plans } = useAdminPlans();
  const { data: schools } = useAdminSchools();

  const stats = [
    { label: 'Planes activos', value: plans?.filter((p) => p.isActive).length ?? '—', icon: CreditCard, path: '/admin/plans' },
    { label: 'Escuelas', value: schools?.length ?? '—', icon: School, path: '/admin/schools' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--p-text-primary)', margin: 0 }}>Panel Super Admin</h1>
        <p style={{ fontSize: 13.5, color: 'var(--p-text-secondary)', marginTop: 4 }}>Vista global del SaaS.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} to={s.path} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 14, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Icon size={18} color="var(--p-text-secondary)" />
                <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--p-text-primary)' }}>{s.value}</div>
                <div style={{ fontSize: 12.5, color: 'var(--p-text-secondary)' }}>{s.label}</div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
