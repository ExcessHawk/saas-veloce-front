import { useState, useMemo, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Plus, MoreHorizontal, Pencil, Trash2, Check, X,
  Mail, Info, Search, AlertTriangle,
} from 'lucide-react';

import { useMembers, useInviteMember, useUpdateMemberRole, useRemoveMember } from '@/hooks/useMembers';
import { useAuthStore } from '@/stores/authStore';
import { showApiError } from '@/lib/errors';
import { avatarColor, getInitials } from '@/lib/materia-colors';
import { RoleGate } from '@/components/RoleGate';
import { Spinner } from '@/components/AuthFormParts';
import { cn } from '@/lib/utils';

const ROLES_META = {
  director: {
    label: 'Director',
    bgStyle: 'var(--p-bg-muted)',
    colorStyle: 'var(--p-text-primary)',
    dotStyle: 'var(--p-text-primary)',
  },
  teacher: {
    label: 'Docente',
    bgStyle: 'var(--p-bg-muted)',
    colorStyle: 'var(--p-text-secondary)',
    dotStyle: 'var(--p-text-tertiary)',
  },
  student: {
    label: 'Estudiante',
    bgStyle: 'var(--p-s-100)',
    colorStyle: 'var(--p-s-700)',
    dotStyle: 'var(--p-s-500)',
  },
  parent: {
    label: 'Padre/Madre',
    bgStyle: 'var(--p-w-100)',
    colorStyle: 'var(--p-w-700)',
    dotStyle: 'var(--p-w-500)',
  },
};

const ROLES_ORDER = ['director', 'teacher', 'student', 'parent'];

const inviteSchema = z.object({
  email: z.string().min(1, 'El email es requerido').email('Email inválido'),
  role: z.enum(['director', 'teacher', 'student', 'parent']),
});

/* ── Avatar ── */
function Av({ nombre, size = 32 }) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-white shrink-0',
        size > 30 ? 'text-[11px]' : 'text-[9px]',
      )}
      style={{ width: size, height: size, background: avatarColor(nombre || '') }}
    >
      {getInitials(nombre || '?')}
    </div>
  );
}

/* ── Role badge ── */
function RoleBadge({ role }) {
  const m = ROLES_META[role] || ROLES_META.student;
  return (
    <span
      className="px-[9px] py-[3px] rounded-full text-[12px] font-bold inline-block whitespace-nowrap"
      style={{ background: m.bgStyle, color: m.colorStyle }}
    >
      {m.label}
    </span>
  );
}

/* ── Inline role selector ── */
function InlineRoleSelect({ value, onChange, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    const t = setTimeout(() => document.addEventListener('mousedown', fn), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', fn); };
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 top-[calc(100%+4px)] left-0 bg-p-bg-base border border-p-border rounded-2xl shadow-p-lg overflow-hidden min-w-[160px] [animation:dropIn_0.15s_ease]"
    >
      {ROLES_ORDER.map((k) => {
        const m = ROLES_META[k];
        const active = value === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => { onChange(k); onClose(); }}
            className={cn(
              'flex items-center justify-between gap-[10px] w-full px-[13px] py-[9px] border-none cursor-pointer transition-[background] duration-[0.08s] font-[inherit] hover:bg-p-bg-subtle',
              active ? 'bg-p-bg-subtle' : 'bg-transparent',
            )}
          >
            <span
              className="px-2 py-[2px] rounded-full text-[12px] font-bold"
              style={{ background: m.bgStyle, color: m.colorStyle }}
            >
              {m.label}
            </span>
            {active && <Check size={12} className="text-p-text-secondary" />}
          </button>
        );
      })}
    </div>
  );
}

/* ── Dots menu ── */
function DotsMenu({ onChangeRole, onDelete, isSelf }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const fn = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-7 h-7 rounded-md border border-transparent bg-transparent cursor-pointer text-p-text-tertiary flex items-center justify-center transition-all duration-100 hover:bg-p-bg-subtle hover:text-p-text-primary"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div className="absolute right-0 top-[calc(100%+4px)] z-50 min-w-[170px] bg-p-bg-base border border-p-border rounded-2xl shadow-p-lg overflow-hidden [animation:dropIn_0.15s_ease]">
          <button
            type="button"
            onClick={() => { onChangeRole(); setOpen(false); }}
            className="flex items-center gap-[9px] w-full px-[14px] py-[9px] border-none bg-transparent cursor-pointer font-[inherit] text-[13.5px] text-p-text-primary text-left hover:bg-p-bg-subtle"
          >
            <Pencil size={13} /> Cambiar rol
          </button>
          {!isSelf && (
            <button
              type="button"
              onClick={() => { onDelete(); setOpen(false); }}
              className="flex items-center gap-[9px] w-full px-[14px] py-[9px] border-none bg-transparent cursor-pointer font-[inherit] text-[13.5px] text-left border-t border-p-border hover:bg-p-d-100 text-p-d-500"
            >
              <Trash2 size={13} /> Eliminar miembro
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Member row ── */
function MemberRow({ member, isSelf, isDirector, onRoleChange, onDelete }) {
  const [editRole, setEditRole] = useState(false);
  const desde = member.joinedAt
    ? format(new Date(member.joinedAt), 'dd MMM yyyy')
    : '—';

  return (
    <tr className="border-t border-p-border transition-[background] duration-[0.08s] hover:bg-p-bg-subtle">
      <td className="px-5 py-[13px]">
        <div className="flex items-center gap-[11px]">
          <Av nombre={member.fullName || member.email} size={34} />
          <div className="flex items-center gap-[7px]">
            <span className="text-[14px] font-medium text-p-text-primary">
              {member.fullName || member.email}
            </span>
            {isSelf && (
              <span className="px-[7px] py-[1px] rounded-full text-[10.5px] font-bold bg-p-bg-muted text-p-text-secondary">
                Tú
              </span>
            )}
          </div>
        </div>
      </td>

      <td className="px-5 py-[13px]">
        <span className="text-[13px] text-p-text-secondary font-['Geist_Mono',monospace]">
          {member.email}
        </span>
      </td>

      <td className="px-5 py-[13px]">
        <div className="relative inline-block">
          <button
            type="button"
            onClick={() => isDirector && !isSelf && setEditRole((o) => !o)}
            disabled={!isDirector || isSelf}
            className={cn(
              'border-none bg-transparent p-0 flex',
              (isDirector && !isSelf) ? 'cursor-pointer' : 'cursor-default',
            )}
          >
            <RoleBadge role={member.role} />
          </button>
          {editRole && (
            <InlineRoleSelect
              value={member.role}
              onChange={(newRole) => onRoleChange(member.id, newRole)}
              onClose={() => setEditRole(false)}
            />
          )}
        </div>
      </td>

      <td className="px-5 py-[13px]">
        <span className="text-[13px] text-p-text-secondary">{desde}</span>
      </td>

      <td className="px-5 py-[13px]">
        {isDirector && (
          <DotsMenu
            isSelf={isSelf}
            onChangeRole={() => setEditRole(true)}
            onDelete={onDelete}
          />
        )}
      </td>
    </tr>
  );
}

/* ── Empty state ── */
function EmptyState({ onAdd, isDirector, query }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-[72px] gap-4 [animation:fadeUp_0.25s_ease]">
      <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
        <circle cx="32" cy="30" r="14" fill="var(--p-bg-subtle)" stroke="var(--p-border)" strokeWidth="1.5" />
        <path d="M10 68a22 22 0 0 1 44 0" fill="var(--p-bg-subtle)" stroke="var(--p-border)" strokeWidth="1.5" />
        <circle cx="60" cy="28" r="10" fill="var(--p-bg-muted)" stroke="var(--p-border)" strokeWidth="1.5" />
        <path d="M42 62a16 16 0 0 1 32 0" fill="var(--p-bg-muted)" stroke="var(--p-border)" strokeWidth="1.5" />
      </svg>
      <div className="text-center">
        <div className="text-[17px] font-bold text-p-text-primary mb-[7px]">
          {query ? 'Sin resultados' : 'Sin miembros aquí'}
        </div>
        <div className="text-[14px] text-p-text-secondary">
          {query ? `No se encontraron miembros para "${query}"` : 'No hay miembros con este rol todavía.'}
        </div>
      </div>
      {isDirector && !query && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-[6px] px-[18px] py-2 rounded-[10px] border-none bg-p-accent text-p-accent-text text-[13.5px] font-[inherit] font-semibold cursor-pointer"
        >
          <Plus size={14} /> Agregar miembro
        </button>
      )}
    </div>
  );
}

/* ── Modal shell ── */
function ModalShell({ title, subtitle, onClose, children, width = 480 }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1000] bg-[oklch(0%_0_0/0.45)] flex items-center justify-center backdrop-blur-[2px] p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-p-bg-base border border-p-border rounded-3xl shadow-p-lg flex flex-col overflow-hidden max-w-[calc(100vw-32px)]"
        style={{ width }}
      >
        <div className="px-6 pt-[18px] pb-4 border-b border-p-border flex items-start justify-between">
          <div>
            <div className="text-[15px] font-bold text-p-text-primary tracking-[-0.02em]">
              {title}
            </div>
            {subtitle && (
              <div className="text-[12.5px] text-p-text-secondary mt-[2px]">
                {subtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-[10px] border border-p-border bg-transparent cursor-pointer text-p-text-tertiary flex items-center justify-center"
          >
            <X size={14} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ── Add member modal ── */
function AddMemberModal({ onClose }) {
  const inviteMember = useInviteMember();
  const [invited, setInvited] = useState(null); // { email, role, expiresAt }
  const {
    register, handleSubmit, watch, setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'teacher' },
  });

  const selectedRole = watch('role');

  const onSubmit = async (data) => {
    try {
      const result = await inviteMember.mutateAsync(data);
      if (result.type === 'invited') {
        setInvited(result.invitation);
      } else {
        onClose();
      }
    } catch { /* handled */ }
  };

  // ── Success state: invitation sent ──
  if (invited) {
    const roleLabel = ROLES_META[invited.role]?.label ?? invited.role;
    const expiresDate = new Date(invited.expiresAt).toLocaleDateString('es-MX', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    return (
      <ModalShell title="Invitación enviada" onClose={onClose}>
        <div className="px-6 py-6 flex flex-col items-center gap-4 text-center">
          <div className="w-14 h-14 rounded-full bg-p-s-100 flex items-center justify-center text-p-s-700">
            <Mail size={24} />
          </div>
          <div>
            <div className="text-[15px] font-bold text-p-text-primary mb-1">
              Correo enviado a {invited.email}
            </div>
            <p className="text-[13.5px] text-p-text-secondary leading-relaxed m-0">
              Se envió un enlace de invitación para unirse como <strong>{roleLabel}</strong>.
              El enlace expira el <strong>{expiresDate}</strong>.
            </p>
          </div>
          <div className="px-[13px] py-[10px] bg-p-bg-subtle border border-p-border rounded-[10px] text-[12.5px] text-p-text-secondary text-left w-full">
            Si el usuario no recibe el correo, verifica que la dirección sea correcta o vuelve a invitarlo.
          </div>
        </div>
        <div className="px-6 py-[14px] border-t border-p-border flex justify-end bg-p-bg-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-[15px] py-[7px] rounded-[10px] border border-transparent bg-p-accent text-p-accent-text text-[13px] font-[inherit] font-medium cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell title="Agregar miembro" subtitle="Se agrega directamente si ya tiene cuenta, o se envía invitación por correo" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Email */}
          <div>
            <label className="block text-[12.5px] font-semibold text-p-text-secondary mb-[6px]">
              Correo electrónico *
            </label>
            <div className="relative">
              <span className="absolute left-[10px] top-1/2 -translate-y-1/2 text-p-text-tertiary pointer-events-none flex">
                <Mail size={14} />
              </span>
              <input
                type="email"
                placeholder="usuario@email.com"
                className={cn(
                  'w-full py-[9px] pr-3 pl-[34px] text-[13.5px] font-[inherit] rounded-[10px] bg-p-bg-base text-p-text-primary outline-none',
                  errors.email
                    ? 'border-[1.5px] border-p-d-500'
                    : 'border-[1.5px] border-p-border',
                )}
                {...register('email')}
              />
            </div>
            {errors.email && (
              <div className="text-[12px] mt-[5px] flex items-center gap-[5px] text-p-d-500">
                <X size={12} /> {errors.email.message}
              </div>
            )}
          </div>

          {/* Rol */}
          <div>
            <label className="block text-[12.5px] font-semibold text-p-text-secondary mb-[6px]">
              Rol
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ROLES_ORDER.map((k) => {
                const m = ROLES_META[k];
                const active = selectedRole === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setValue('role', k, { shouldDirty: true })}
                    className={cn(
                      'px-3 py-[9px] rounded-[10px] cursor-pointer flex items-center gap-2 font-[inherit] transition-all duration-[0.12s]',
                      active
                        ? 'border-[1.5px] border-p-border-strong shadow-p-sm'
                        : 'border-[1.5px] border-p-border bg-transparent',
                    )}
                    style={active ? { background: m.bgStyle } : undefined}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ background: m.dotStyle }}
                    />
                    <span className={cn(
                      'text-[13px]',
                      active ? 'font-bold text-p-text-primary' : 'font-medium text-p-text-secondary',
                    )}>
                      {m.label}
                    </span>
                    {active && <Check size={12} className="text-p-text-secondary ml-auto" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info box */}
          <div className="px-[13px] py-[10px] bg-p-bg-subtle border border-p-border rounded-[10px] flex items-start gap-2 text-[12.5px] text-p-text-secondary leading-[1.6]">
            <span className="text-p-text-tertiary shrink-0 mt-[1px] flex">
              <Info size={13} />
            </span>
            Si el usuario ya tiene cuenta en Pensum se agregará directamente. Si no, recibirá un correo para crear su cuenta y unirse automáticamente.
          </div>
        </div>

        <div className="px-6 py-[14px] border-t border-p-border flex justify-end gap-2 bg-p-bg-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-[15px] py-[7px] rounded-[10px] border border-p-border bg-p-bg-base text-p-text-primary text-[13px] font-[inherit] font-medium cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={inviteMember.isPending}
            className={cn(
              'px-[15px] py-[7px] rounded-[10px] border border-transparent bg-p-accent text-p-accent-text text-[13px] font-[inherit] font-medium inline-flex items-center gap-[6px]',
              inviteMember.isPending ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            )}
          >
            {inviteMember.isPending && <Spinner size={13} />}
            {inviteMember.isPending ? 'Procesando…' : 'Agregar / Invitar'}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ── Delete confirm modal ── */
function DeleteModal({ member, isPending, onClose, onConfirm }) {
  if (!member) return null;
  const name = member.fullName || member.email;
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[1000] bg-[oklch(0%_0_0/0.45)] flex items-center justify-center backdrop-blur-[2px] p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-[420px] max-w-[calc(100vw-32px)] bg-p-bg-base border border-p-border rounded-3xl shadow-p-lg overflow-hidden"
      >
        <div className="px-6 py-5">
          <div className="w-11 h-11 rounded-2xl bg-p-d-100 flex items-center justify-center text-p-d-500 mb-[14px]">
            <AlertTriangle size={20} />
          </div>
          <div className="text-[15px] font-bold text-p-text-primary mb-2">
            Eliminar miembro
          </div>
          <p className="text-[14px] text-p-text-secondary leading-[1.65] m-0">
            ¿Eliminar a <strong className="text-p-text-primary">{name}</strong> de la institución?
            Perderá acceso inmediatamente. Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="px-6 py-[14px] border-t border-p-border flex justify-end gap-2 bg-p-bg-subtle">
          <button
            type="button"
            onClick={onClose}
            className="px-[15px] py-[7px] rounded-[10px] border border-p-border bg-p-bg-base text-p-text-primary text-[13px] font-[inherit] font-medium cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              'px-[15px] py-[7px] rounded-[10px] border border-transparent bg-p-d-500 text-white text-[13px] font-[inherit] font-medium inline-flex items-center gap-[6px]',
              isPending ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
            )}
          >
            {isPending && <Spinner size={13} />}
            {isPending ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══ Page ══ */
export default function MembersPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [tabRole, setTabRole] = useState('todos');
  const [query, setQuery] = useState('');

  const currentUser = useAuthStore((s) => s.user);
  const isDirector = currentUser?.role === 'director';

  const members = useMembers();
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();

  useEffect(() => {
    if (members.error) showApiError(members.error);
  }, [members.error]);

  const data = members.data ?? [];

  const countFor = (role) =>
    role === 'todos' ? data.length : data.filter((m) => m.role === role).length;

  const filtered = useMemo(() => {
    let list = data;
    if (tabRole !== 'todos') list = list.filter((m) => m.role === tabRole);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (m) => (m.fullName || '').toLowerCase().includes(q) || m.email.toLowerCase().includes(q),
      );
    }
    return list;
  }, [data, tabRole, query]);

  const TABS = [
    { id: 'todos',    label: 'Todos' },
    { id: 'director', label: 'Directores' },
    { id: 'teacher',  label: 'Docentes' },
    { id: 'student',  label: 'Estudiantes' },
    { id: 'parent',   label: 'Padres' },
  ];

  const onRoleChange = (id, role) => updateRole.mutate({ id, role });

  const onConfirmDelete = async () => {
    try {
      await removeMember.mutateAsync(deletingItem.id);
      setDeletingItem(null);
    } catch { /* handled */ }
  };

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-[22px] gap-3">
        <div>
          <div className="flex items-center gap-[10px] mb-1">
            <h1 className="text-[22px] font-extrabold text-p-text-primary tracking-[-0.03em] m-0">
              Miembros
            </h1>
            <span className="px-[9px] py-[2px] rounded-full text-[13px] font-bold bg-p-bg-muted text-p-text-secondary">
              {data.length}
            </span>
          </div>
          <p className="text-[13px] text-p-text-secondary m-0">
            Gestiona los miembros de tu institución
          </p>
        </div>
        <RoleGate roles={['director']}>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-[6px] px-[18px] py-2 rounded-[10px] border-none bg-p-accent text-p-accent-text text-[13.5px] font-[inherit] font-semibold cursor-pointer"
          >
            <Plus size={14} /> Agregar Miembro
          </button>
        </RoleGate>
      </div>

      {/* Card */}
      <div className="bg-p-bg-base border border-p-border rounded-3xl shadow-p-sm overflow-hidden">
        {/* Toolbar: tabs + search */}
        <div className="px-5 border-b border-p-border flex items-center justify-between gap-4 flex-wrap">
          <div className="flex overflow-x-auto">
            {TABS.map((t) => {
              const cnt = countFor(t.id);
              const active = tabRole === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTabRole(t.id)}
                  className={cn(
                    'px-[14px] py-[13px] border-none bg-transparent text-[13.5px] font-[inherit] cursor-pointer flex items-center gap-[6px] whitespace-nowrap -mb-px transition-all duration-100',
                    active
                      ? 'border-b-2 border-b-p-accent font-semibold text-p-text-primary'
                      : 'border-b-2 border-b-transparent font-medium text-p-text-secondary',
                  )}
                >
                  {t.label}
                  <span className={cn(
                    'px-[6px] py-[1px] rounded-full text-[11.5px] font-bold',
                    active
                      ? 'bg-p-bg-subtle text-p-text-primary'
                      : 'bg-p-bg-muted text-p-text-tertiary',
                  )}>
                    {cnt}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative shrink-0 py-2">
            <span className="absolute left-[9px] top-1/2 -translate-y-1/2 text-p-text-tertiary flex pointer-events-none">
              <Search size={13} />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar miembro…"
              className="py-[7px] pr-[11px] pl-[30px] text-[13px] font-[inherit] border-[1.5px] border-p-border rounded-[10px] bg-p-bg-base text-p-text-primary outline-none w-[220px]"
            />
          </div>
        </div>

        {/* Body */}
        {members.isLoading ? (
          <div className="px-5 py-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-[11px] py-3 border-b border-p-border">
                <div className="w-[34px] h-[34px] rounded-full bg-p-bg-subtle" />
                <div className="flex-1">
                  <div className="h-3 bg-p-bg-subtle rounded w-[40%] mb-[6px]" />
                  <div className="h-[10px] bg-p-bg-subtle rounded w-[60%]" />
                </div>
                <div className="w-[70px] h-[18px] rounded-full bg-p-bg-subtle" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onAdd={() => setShowAdd(true)} isDirector={isDirector} query={query} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-p-bg-subtle border-b border-p-border">
                  {['Nombre', 'Email', 'Rol', 'Miembro desde', ''].map((h, i) => (
                    <th
                      key={i}
                      className={cn(
                      'px-5 py-[9px] text-left text-[11px] font-bold text-p-text-tertiary uppercase tracking-[0.06em] whitespace-nowrap',
                      i === 4 && 'w-[44px]',
                    )}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((m) => (
                  <MemberRow
                    key={m.id}
                    member={m}
                    isSelf={m.userId === currentUser?.id}
                    isDirector={isDirector}
                    onRoleChange={onRoleChange}
                    onDelete={() => setDeletingItem(m)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!members.isLoading && filtered.length > 0 && (
          <div className="px-5 py-[11px] border-t border-p-border bg-p-bg-subtle text-[12.5px] text-p-text-tertiary">
            Mostrando {filtered.length} de {data.length} miembro{data.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdd && <AddMemberModal onClose={() => setShowAdd(false)} />}
      <DeleteModal
        member={deletingItem}
        isPending={removeMember.isPending}
        onClose={() => setDeletingItem(null)}
        onConfirm={onConfirmDelete}
      />

    </div>
  );
}
