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
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--p-text-primary)', margin: 0 }}>Escuelas</h1>
        <p style={{ fontSize: 13.5, color: 'var(--p-text-secondary)', marginTop: 4 }}>Todos los tenants del SaaS.</p>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nombre o slug…"
        style={{ marginBottom: 16, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--p-border)', background: 'var(--p-bg-base)', color: 'var(--p-text-primary)', fontSize: 13, fontFamily: 'inherit', width: '100%', maxWidth: 320, outline: 'none' }}
      />

      {isLoading ? (
        <div style={{ height: 80, background: 'var(--p-bg-base)', borderRadius: 14, border: '1px solid var(--p-border)' }} />
      ) : (
        <div style={{ background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 14, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--p-border)' }}>
                {['Escuela', 'Plan', 'Estado', 'Suscripción', 'Creada', 'Acción'].map((h) => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11.5, fontWeight: 600, color: 'var(--p-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((school) => {
                const sc = STATUS_COLOR[school.status] ?? STATUS_COLOR.inactive;
                return (
                  <tr key={school.id} style={{ borderBottom: '1px solid var(--p-border)' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--p-text-primary)' }}>{school.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--p-text-tertiary)', marginTop: 1 }}>{school.slug}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--p-text-secondary)' }}>{school.planName ?? '—'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 99, color: sc.color, background: sc.bg }}>
                        {school.status}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--p-text-secondary)' }}>{school.subscriptionStatus ?? '—'}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--p-text-secondary)' }}>{fmtDate(school.createdAt)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <select
                        value={school.status}
                        onChange={(e) => handleStatus(school.id, e.target.value)}
                        style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid var(--p-border)', background: 'var(--p-bg-base)', color: 'var(--p-text-primary)', fontSize: 12, fontFamily: 'inherit', cursor: 'pointer' }}
                      >
                        {STATUS_OPTS.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={6} style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--p-text-tertiary)' }}>Sin resultados</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
