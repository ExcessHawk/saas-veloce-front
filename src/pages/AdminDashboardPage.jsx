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
      <div className="mb-7">
        <h1 className="text-[22px] font-bold text-p-text-primary m-0">Panel Super Admin</h1>
        <p className="text-[13.5px] text-p-text-secondary mt-1">Vista global del SaaS.</p>
      </div>

      <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
        {stats.map((s) => {
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
    </div>
  );
}
