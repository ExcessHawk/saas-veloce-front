import { useState } from 'react';
import { toast } from 'sonner';
import { useAdminSchools, useUpdateSchoolStatus } from '@/hooks/useAdminSchools';
import { showApiError } from '@/lib/errors';

const STATUS_OPTS = ['active', 'inactive', 'suspended', 'trial', 'churned'];
const STATUS_COLOR = {
  active:    { color: '#16a34a', bg: '#f0fdf4' },
  trial:     { color: '#2563eb', bg: '#eff6ff' },
  inactive:  { color: '#6b7280', bg: '#f9fafb' },
  suspended: { color: '#d97706', bg: '#fffbeb' },
  churned:   { color: '#dc2626', bg: '#fef2f2' },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminSchoolsPage() {
  const { data: schools, isLoading } = useAdminSchools();
  const updateStatus = useUpdateSchoolStatus();
  const [search, setSearch] = useState('');

  const filtered = (schools ?? []).filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.slug.toLowerCase().includes(search.toLowerCase())
  );

  const handleStatus = async (id, status) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success('Estado actualizado');
    } catch (err) { showApiError(err); }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold text-p-text-primary m-0">Escuelas</h1>
        <p className="text-[13.5px] text-p-text-secondary mt-1">Todos los tenants del SaaS.</p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre o slug…"
        className="mb-4 px-3 py-2 rounded-lg border border-p-border bg-p-bg-base text-p-text-primary text-[13px] w-full max-w-xs outline-none font-sans"
      />

      {isLoading ? (
        <div className="h-20 bg-p-bg-base rounded-[14px] border border-p-border" />
      ) : (
        <div className="bg-p-bg-base border border-p-border rounded-[14px] overflow-hidden">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-p-border">
                {['Escuela', 'Plan', 'Estado', 'Suscripción', 'Creada', 'Acción'].map((h) => (
                  <th key={h} className="px-4 py-[10px] text-left text-[11.5px] font-semibold text-p-text-tertiary uppercase tracking-[0.04em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((school) => {
                const sc = STATUS_COLOR[school.status] ?? STATUS_COLOR.inactive;
                return (
                  <tr key={school.id} className="border-b border-p-border">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-p-text-primary">{school.name}</div>
                      <div className="text-[11px] text-p-text-tertiary mt-px">{school.slug}</div>
                    </td>
                    <td className="px-4 py-3 text-p-text-secondary">{school.planName ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-[12px] font-semibold px-2 py-[3px] rounded-full" style={{ color: sc.color, background: sc.bg }}>
                        {school.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-p-text-secondary">{school.subscriptionStatus ?? '—'}</td>
                    <td className="px-4 py-3 text-p-text-secondary">{fmtDate(school.createdAt)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={school.status}
                        onChange={(e) => handleStatus(school.id, e.target.value)}
                        className="px-2 py-[5px] rounded border border-p-border bg-p-bg-base text-p-text-primary text-[12px] font-sans cursor-pointer"
                      >
                        {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-6 text-center text-p-text-tertiary">Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
