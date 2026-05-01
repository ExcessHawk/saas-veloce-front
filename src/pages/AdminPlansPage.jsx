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
    <label className="flex flex-col gap-1">
      <span className="text-[12px] text-p-text-secondary font-medium">{label}</span>
      <input
        type={type}
        value={form[key] ?? ''}
        onChange={(e) => set(key, type === 'number' ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="px-[10px] py-[7px] rounded-lg border border-p-border bg-p-bg-base text-p-text-primary text-[13px] font-[inherit] outline-none"
      />
    </label>
  );

  return (
    <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
      {field('Código', 'code', 'text', 'ej. pro')}
      {field('Nombre', 'name', 'text', 'ej. Pro')}
      {field('Descripción', 'description', 'text', 'opcional')}
      {field('Precio MXN (cents)', 'priceMonthlyMxn', 'number')}
      {field('Precio USD (cents)', 'priceMonthlyUsd', 'number')}
      {field('Máx. alumnos', 'maxStudents', 'number')}
      {field('Máx. docentes', 'maxTeachers', 'number')}
      {field('Máx. cursos', 'maxCourses', 'number')}
      {field('Orden', 'displayOrder', 'number')}
      <label className="flex items-center gap-2 self-end pb-2">
        <input type="checkbox" checked={form.isActive} onChange={(e) => set('isActive', e.target.checked)} />
        <span className="text-[13px] text-p-text-primary">Activo</span>
      </label>
      <div className="flex gap-2 self-end pb-1 [grid-column:1_/_-1]">
        <button
          onClick={() => onSave(form)}
          disabled={loading}
          className="px-4 py-[7px] rounded-lg bg-p-accent text-white border-0 text-[13px] font-semibold cursor-pointer font-[inherit]"
        >
          {loading ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          onClick={onCancel}
          className="px-[14px] py-[7px] rounded-lg border border-p-border bg-transparent text-p-text-secondary text-[13px] cursor-pointer font-[inherit]"
        >
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[22px] font-bold text-p-text-primary m-0">Planes</h1>
          <p className="text-[13.5px] text-p-text-secondary mt-1">Catálogo de suscripciones. Al guardar se sincronizan con Stripe.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-[6px] px-[14px] py-[7px] rounded-lg bg-p-accent text-white border-0 text-[13px] font-semibold cursor-pointer font-[inherit]"
        >
          <Plus size={14} /> Nuevo plan
        </button>
      </div>

      {showCreate && (
        <div className="bg-p-bg-base border border-p-border rounded-[14px] p-5 mb-5">
          <div className="text-[13.5px] font-semibold text-p-text-primary mb-[14px]">Nuevo plan</div>
          <PlanForm onSave={handleCreate} onCancel={() => setShowCreate(false)} loading={create.isPending} />
        </div>
      )}

      {isLoading ? (
        <div className="h-20 bg-p-bg-base rounded-[14px] border border-p-border animate-pulse" />
      ) : (
        <div className="flex flex-col gap-3">
          {plans?.map((plan) => (
            <div key={plan.id} className="bg-p-bg-base border border-p-border rounded-[14px] p-5">
              {editId === plan.id ? (
                <PlanForm initial={plan} onSave={handleUpdate} onCancel={() => setEditId(null)} loading={update.isPending} />
              ) : (
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[15px] font-bold text-p-text-primary">{plan.name}</span>
                      <code className="text-[11px] px-[6px] py-[2px] bg-p-bg-subtle rounded text-p-text-secondary">{plan.code}</code>
                      {!plan.isActive && <span className="text-[11px] px-[6px] py-[2px] bg-[#fef2f2] text-[#dc2626] rounded">Archivado</span>}
                      {plan.stripeProductId && <span className="text-[11px] px-[6px] py-[2px] bg-[#eff6ff] text-[#2563eb] rounded">Stripe ✓</span>}
                    </div>
                    {plan.description && <div className="text-[12.5px] text-p-text-secondary mb-2">{plan.description}</div>}
                    <div className="flex gap-4 text-[12px] text-p-text-tertiary">
                      <span>MXN: {fmtPrice(plan.priceMonthlyMxn)}/mes</span>
                      <span>USD: {fmtPrice(plan.priceMonthlyUsd)}/mes</span>
                      {plan.maxStudents && <span>Alumnos: {plan.maxStudents}</span>}
                    </div>
                  </div>
                  <div className="flex gap-[6px]">
                    <button
                      onClick={() => setEditId(plan.id)}
                      className="px-[10px] py-[6px] rounded-[7px] border border-p-border bg-transparent text-p-text-secondary cursor-pointer flex items-center gap-1 text-[12px] font-[inherit]"
                    >
                      <Pencil size={12} /> Editar
                    </button>
                    {plan.isActive && (
                      <button
                        onClick={() => handleArchive(plan.id)}
                        className="px-[10px] py-[6px] rounded-[7px] border border-[#fecaca] bg-transparent text-[#dc2626] cursor-pointer flex items-center gap-1 text-[12px] font-[inherit]"
                      >
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
