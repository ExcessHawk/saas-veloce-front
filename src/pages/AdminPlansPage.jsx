import { useState } from 'react';
import { Plus, Pencil, Archive } from 'lucide-react';
import { toast } from 'sonner';
import { useAdminPlans, useCreatePlan, useUpdatePlan, useArchivePlan } from '@/hooks/useAdminPlans';
import { showApiError } from '@/lib/errors';

function fmtPrice(cents) {
  if (!cents) return '—';
  return `$${(cents / 100).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
}

const EMPTY_FORM = { code: '', name: '', description: '', priceMonthlyMxn: 0, priceMonthlyUsd: 0, maxStudents: '', maxTeachers: '', maxCourses: '', isActive: true, displayOrder: 0 };

function PlanForm({ initial, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial ?? EMPTY_FORM);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const field = (label, key, type = 'text', placeholder = '') => (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 12, color: 'var(--p-text-secondary)', fontWeight: 500 }}>{label}</span>
      <input
        type={type}
        value={form[key] ?? ''}
        onChange={(e) => set(key, type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--p-border)', background: 'var(--p-bg-base)', color: 'var(--p-text-primary)', fontSize: 13, fontFamily: 'inherit', outline: 'none' }}
      />
    </label>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
      {field('Código', 'code', 'text', 'ej. pro')}
      {field('Nombre', 'name', 'text', 'ej. Pro')}
      {field('Descripción', 'description', 'text', 'opcional')}
      {field('Precio MXN (cents)', 'priceMonthlyMxn', 'number')}
      {field('Precio USD (cents)', 'priceMonthlyUsd', 'number')}
      {field('Máx. alumnos', 'maxStudents', 'number')}
      {field('Máx. docentes', 'maxTeachers', 'number')}
      {field('Máx. cursos', 'maxCourses', 'number')}
      {field('Orden', 'displayOrder', 'number')}
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'end', paddingBottom: 8 }}>
        <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
        <span style={{ fontSize: 13, color: 'var(--p-text-primary)' }}>Activo</span>
      </label>
      <div style={{ display: 'flex', gap: 8, alignSelf: 'end', paddingBottom: 4, gridColumn: '1 / -1' }}>
        <button onClick={() => onSave(form)} disabled={loading} style={{ padding: '7px 16px', borderRadius: 8, background: 'var(--p-accent)', color: 'white', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          {loading ? 'Guardando…' : 'Guardar'}
        </button>
        <button onClick={onCancel} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--p-border)', background: 'transparent', color: 'var(--p-text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default function AdminPlansPage() {
  const { data: plans, isLoading } = useAdminPlans();
  const create = useCreatePlan();
  const update = useUpdatePlan();
  const archive = useArchivePlan();

  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState(null);

  const handleCreate = async (form) => {
    try {
      await create.mutateAsync({ ...form, maxStudents: form.maxStudents || null, maxTeachers: form.maxTeachers || null, maxCourses: form.maxCourses || null });
      setShowCreate(false);
      toast.success('Plan creado');
    } catch (err) { showApiError(err); }
  };

  const handleUpdate = async (form) => {
    try {
      await update.mutateAsync({ id: editId, ...form, maxStudents: form.maxStudents || null, maxTeachers: form.maxTeachers || null, maxCourses: form.maxCourses || null });
      setEditId(null);
      toast.success('Plan actualizado');
    } catch (err) { showApiError(err); }
  };

  const handleArchive = async (id) => {
    if (!confirm('¿Archivar este plan?')) return;
    try {
      await archive.mutateAsync(id);
      toast.success('Plan archivado');
    } catch (err) { showApiError(err); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--p-text-primary)', margin: 0 }}>Planes</h1>
          <p style={{ fontSize: 13.5, color: 'var(--p-text-secondary)', marginTop: 4 }}>Catálogo de suscripciones. Al guardar se sincronizan con Stripe.</p>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'var(--p-accent)', color: 'white', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Plus size={14} /> Nuevo plan
        </button>
      </div>

      {showCreate && (
        <div style={{ background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 14, padding: 20, marginBottom: 20 }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--p-text-primary)', marginBottom: 14 }}>Nuevo plan</div>
          <PlanForm onSave={handleCreate} onCancel={() => setShowCreate(false)} loading={create.isPending} />
        </div>
      )}

      {isLoading ? (
        <div style={{ height: 80, background: 'var(--p-bg-base)', borderRadius: 14, border: '1px solid var(--p-border)' }} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {plans?.map((plan) => (
            <div key={plan.id} style={{ background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 14, padding: 20 }}>
              {editId === plan.id ? (
                <PlanForm initial={plan} onSave={handleUpdate} onCancel={() => setEditId(null)} loading={update.isPending} />
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--p-text-primary)' }}>{plan.name}</span>
                      <code style={{ fontSize: 11, padding: '2px 6px', background: 'var(--p-bg-subtle)', borderRadius: 4, color: 'var(--p-text-secondary)' }}>{plan.code}</code>
                      {!plan.isActive && <span style={{ fontSize: 11, padding: '2px 6px', background: '#fef2f2', color: '#dc2626', borderRadius: 4 }}>Archivado</span>}
                      {plan.stripeProductId && <span style={{ fontSize: 11, padding: '2px 6px', background: '#eff6ff', color: '#2563eb', borderRadius: 4 }}>Stripe ✓</span>}
                    </div>
                    {plan.description && <div style={{ fontSize: 12.5, color: 'var(--p-text-secondary)', marginBottom: 8 }}>{plan.description}</div>}
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--p-text-tertiary)' }}>
                      <span>MXN: {fmtPrice(plan.priceMonthlyMxn)}/mes</span>
                      <span>USD: {fmtPrice(plan.priceMonthlyUsd)}/mes</span>
                      {plan.maxStudents && <span>Alumnos: {plan.maxStudents}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setEditId(plan.id)} style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid var(--p-border)', background: 'transparent', color: 'var(--p-text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'inherit' }}>
                      <Pencil size={12} /> Editar
                    </button>
                    {plan.isActive && (
                      <button onClick={() => handleArchive(plan.id)} style={{ padding: '6px 10px', borderRadius: 7, border: '1px solid #fecaca', background: 'transparent', color: '#dc2626', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontFamily: 'inherit' }}>
                        <Archive size={12} /> Archivar
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
