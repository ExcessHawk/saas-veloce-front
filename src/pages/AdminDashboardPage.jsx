import { LayoutDashboard, CreditCard, School, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { Link } from 'react-router';
import { useAdminPlans } from '@/hooks/useAdminPlans';
import { useAdminSchools } from '@/hooks/useAdminSchools';
import { useAdminStats } from '@/hooks/useAdminStats';

function fmtMoney(cents, currency) {
  if (cents == null) return '—';
  const value = cents / 100;
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminDashboardPage() {
  const { data: plans } = useAdminPlans();
  const { data: schools } = useAdminSchools();
  const { data: stats } = useAdminStats();

  const cards = [
    {
      label: 'Planes activos',
      value: plans?.filter((p) => p.isActive).length ?? '—',
      icon: CreditCard,
      path: '/admin/plans',
    },
    {
      label: 'Escuelas totales',
      value: stats?.totalSchools ?? schools?.length ?? '—',
      icon: School,
      path: '/admin/schools',
    },
    {
      label: 'MRR (MXN)',
      value: fmtMoney(stats?.mrr?.MXN, 'MXN'),
      icon: TrendingUp,
      path: '/admin/schools',
    },
    {
      label: 'MRR (USD)',
      value: fmtMoney(stats?.mrr?.USD, 'USD'),
      icon: TrendingUp,
      path: '/admin/schools',
    },
    {
      label: 'Trials activos',
      value: stats?.subscriptionsByStatus?.trialing ?? 0,
      icon: Clock,
      path: '/admin/schools',
    },
    {
      label: 'Churn (30d)',
      value: stats?.churnLast30 ?? 0,
      icon: TrendingDown,
      path: '/admin/schools',
    },
  ];

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-[22px] font-semibold text-p-text-primary m-0">Panel Super Admin</h1>
        <p className="text-[13.5px] text-p-text-secondary mt-1">Vista global del SaaS.</p>
      </div>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        {cards.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} to={s.path} className="no-underline">
              <div className="bg-p-bg-base border border-p-border rounded-[14px] px-[22px] py-5 flex flex-col gap-[10px]">
                <Icon size={18} className="text-p-text-secondary" />
                <div className="text-[28px] font-bold text-p-text-primary">{s.value}</div>
                <div className="text-[12.5px] text-p-text-secondary">{s.label}</div>
              </div>
            </Link>
          );
        })}
      </div>

      {stats?.schoolsByStatus && (
        <div className="mt-6 bg-p-bg-base border border-p-border rounded-[14px] p-5">
          <div className="text-[14px] font-semibold text-p-text-primary mb-3">Escuelas por estado</div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(stats.schoolsByStatus).map(([status, count]) => (
              <div key={status} className="flex items-center gap-2 px-3 py-[6px] rounded-full bg-p-bg-subtle border border-p-border">
                <span className="text-[12px] font-semibold text-p-text-primary">{count}</span>
                <span className="text-[12px] text-p-text-secondary">{status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
