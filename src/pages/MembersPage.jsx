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

const ROLES_META = {
  director: {
    label: 'Director',
    bg: 'oklch(8.5% 0.005 80)',
    color: 'oklch(99.2% 0.003 80)',
    dot: 'oklch(99.2% 0.003 80)',
  },
  teacher: {
    label: 'Docente',
    bg: 'oklch(92% 0.020 250)',
    color: 'oklch(35% 0.050 250)',
    dot: 'oklch(35% 0.050 250)',
  },
  student: {
    label: 'Estudiante',
    bg: 'var(--p-s-100)',
    color: 'var(--p-s-700)',
    dot: 'var(--p-s-500)',
  },
  parent: {
    label: 'Padre/Madre',
    bg: 'oklch(93% 0.040 50)',
    color: 'oklch(35% 0.09 50)',
    dot: 'oklch(50% 0.13 50)',
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
    <div style={{
      width: size, height: size, borderRadius: '99px',
      background: avatarColor(nombre || ''),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size > 30 ? 11 : 9, fontWeight: 700, color: 'white', flexShrink: 0,
    }}>
      {getInitials(nombre || '?')}
    </div>
  );
}

/* ── Role badge ── */
function RoleBadge({ role }) {
  const m = ROLES_META[role] || ROLES_META.student;
  return (
    <span style={{
      padding: '3px 9px', borderRadius: '99px', fontSize: 12, fontWeight: 700,
      background: m.bg, color: m.color, display: 'inline-block', whiteSpace: 'nowrap',
    }}>
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
    <div ref={ref} style={{
      position: 'absolute', zIndex: 50, top: 'calc(100% + 4px)', left: 0,
      background: 'var(--p-bg-base)', border: '1px solid var(--p-border)',
      borderRadius: 16, boxShadow: 'var(--p-shadow-lg)',
      overflow: 'hidden', minWidth: 160, animation: 'dropIn 0.15s ease',
    }}>
      {ROLES_ORDER.map((k) => {
        const m = ROLES_META[k];
        const active = value === k;
        return (
          <button
            key={k}
            type="button"
            onClick={() => { onChange(k); onClose(); }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
              width: '100%', padding: '9px 13px', border: 'none',
              background: active ? 'var(--p-bg-subtle)' : 'transparent',
              cursor: 'pointer', transition: 'background 0.08s', fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--p-bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = active ? 'var(--p-bg-subtle)' : 'transparent')}
          >
            <span style={{
              padding: '2px 8px', borderRadius: '99px', fontSize: 12, fontWeight: 700,
              background: m.bg, color: m.color,
            }}>
              {m.label}
            </span>
            {active && <Check size={12} color="var(--p-text-secondary)" />}
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
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          width: 28, height: 28, borderRadius: 6, border: '1px solid transparent',
          background: 'transparent', cursor: 'pointer',
          color: 'var(--p-text-tertiary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.1s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--p-bg-subtle)';
          e.currentTarget.style.color = 'var(--p-text-primary)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--p-text-tertiary)';
        }}
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 50, minWidth: 170,
          background: 'var(--p-bg-base)', border: '1px solid var(--p-border)',
          borderRadius: 16, boxShadow: 'var(--p-shadow-lg)',
          overflow: 'hidden', animation: 'dropIn 0.15s ease',
        }}>
          <button
            type="button"
            onClick={() => { onChangeRole(); setOpen(false); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 14px',
              border: 'none', background: 'transparent', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13.5, color: 'var(--p-text-primary)', textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--p-bg-subtle)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Pencil size={13} /> Cambiar rol
          </button>
          {!isSelf && (
            <button
              type="button"
              onClick={() => { onDelete(); setOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 14px',
                border: 'none', background: 'transparent', cursor: 'pointer',
                fontFamily: 'inherit', fontSize: 13.5, color: 'var(--p-d-500)', textAlign: 'left',
                borderTop: '1px solid var(--p-border)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--p-d-100)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
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
    <tr
      style={{ borderTop: '1px solid var(--p-border)', transition: 'background 0.08s' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--p-bg-subtle)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <td style={{ padding: '13px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <Av nombre={member.fullName || member.email} size={34} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--p-text-primary)' }}>
              {member.fullName || member.email}
            </span>
            {isSelf && (
              <span style={{
                padding: '1px 7px', borderRadius: '99px', fontSize: 10.5, fontWeight: 700,
                background: 'var(--p-bg-muted)', color: 'var(--p-text-secondary)',
              }}>
                Tú
              </span>
            )}
          </div>
        </div>
      </td>

      <td style={{ padding: '13px 20px' }}>
        <span style={{
          fontSize: 13, color: 'var(--p-text-secondary)',
          fontFamily: "'Geist Mono', monospace",
        }}>
          {member.email}
        </span>
      </td>

      <td style={{ padding: '13px 20px' }}>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <button
            type="button"
            onClick={() => isDirector && !isSelf && setEditRole((o) => !o)}
            disabled={!isDirector || isSelf}
            style={{
              border: 'none', background: 'transparent', padding: 0, display: 'flex',
              cursor: (isDirector && !isSelf) ? 'pointer' : 'default',
            }}
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

      <td style={{ padding: '13px 20px' }}>
        <span style={{ fontSize: 13, color: 'var(--p-text-secondary)' }}>{desde}</span>
      </td>

      <td style={{ padding: '13px 20px' }}>
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
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '72px 24px', gap: 16, animation: 'fadeUp 0.25s ease',
    }}>
      <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
        <circle cx="32" cy="30" r="14" fill="var(--p-bg-subtle)" stroke="var(--p-border)" strokeWidth="1.5" />
        <path d="M10 68a22 22 0 0 1 44 0" fill="var(--p-bg-subtle)" stroke="var(--p-border)" strokeWidth="1.5" />
        <circle cx="60" cy="28" r="10" fill="var(--p-bg-muted)" stroke="var(--p-border)" strokeWidth="1.5" />
        <path d="M42 62a16 16 0 0 1 32 0" fill="var(--p-bg-muted)" stroke="var(--p-border)" strokeWidth="1.5" />
      </svg>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--p-text-primary)', marginBottom: 7 }}>
          {query ? 'Sin resultados' : 'Sin miembros aquí'}
        </div>
        <div style={{ fontSize: 14, color: 'var(--p-text-secondary)' }}>
          {query ? `No se encontraron miembros para "${query}"` : 'No hay miembros con este rol todavía.'}
        </div>
      </div>
      {isDirector && !query && (
        <button
          type="button"
          onClick={onAdd}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 18px', borderRadius: 10, border: 'none',
            background: 'var(--p-accent)', color: 'var(--p-accent-text)',
            fontSize: 13.5, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer',
          }}
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
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'oklch(0% 0 0 / 0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(2px)', padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width, maxWidth: 'calc(100vw - 32px)',
          background: 'var(--p-bg-base)', border: '1px solid var(--p-border)',
          borderRadius: 24, boxShadow: 'var(--p-shadow-lg)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
      >
        <div style={{
          padding: '18px 24px 16px', borderBottom: '1px solid var(--p-border)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--p-text-primary)', letterSpacing: '-0.02em' }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 12.5, color: 'var(--p-text-secondary)', marginTop: 2 }}>
                {subtitle}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 10,
              border: '1px solid var(--p-border)', background: 'transparent',
              cursor: 'pointer', color: 'var(--p-text-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
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
      await inviteMember.mutateAsync(data);
      onClose();
    } catch { /* handled */ }
  };

  return (
    <ModalShell title="Agregar miembro" subtitle="El usuario debe estar registrado en Pensum" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Email */}
          <div>
            <label style={{
              display: 'block', fontSize: 12.5, fontWeight: 600,
              color: 'var(--p-text-secondary)', marginBottom: 6,
            }}>
              Correo electrónico *
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                color: 'var(--p-text-tertiary)', pointerEvents: 'none', display: 'flex',
              }}>
                <Mail size={14} />
              </span>
              <input
                type="email"
                placeholder="usuario@email.com"
                style={{
                  width: '100%', padding: '9px 12px 9px 34px',
                  fontSize: 13.5, fontFamily: 'inherit',
                  border: `1.5px solid ${errors.email ? 'var(--p-d-500)' : 'var(--p-border)'}`,
                  borderRadius: 10,
                  background: 'var(--p-bg-base)', color: 'var(--p-text-primary)', outline: 'none',
                }}
                {...register('email')}
              />
            </div>
            {errors.email && (
              <div style={{
                fontSize: 12, color: 'var(--p-d-500)', marginTop: 5,
                display: 'flex', alignItems: 'center', gap: 5,
              }}>
                <X size={12} /> {errors.email.message}
              </div>
            )}
          </div>

          {/* Rol */}
          <div>
            <label style={{
              display: 'block', fontSize: 12.5, fontWeight: 600,
              color: 'var(--p-text-secondary)', marginBottom: 6,
            }}>
              Rol
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {ROLES_ORDER.map((k) => {
                const m = ROLES_META[k];
                const active = selectedRole === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setValue('role', k, { shouldDirty: true })}
                    style={{
                      padding: '9px 12px', borderRadius: 10,
                      border: `1.5px solid ${active ? 'var(--p-border-strong)' : 'var(--p-border)'}`,
                      background: active ? m.bg : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                      fontFamily: 'inherit', transition: 'all 0.12s',
                      boxShadow: active ? 'var(--p-shadow-sm)' : 'none',
                    }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: '99px', background: m.dot, flexShrink: 0 }} />
                    <span style={{
                      fontSize: 13, fontWeight: active ? 700 : 500,
                      color: active ? 'var(--p-text-primary)' : 'var(--p-text-secondary)',
                    }}>
                      {m.label}
                    </span>
                    {active && <Check size={12} color="var(--p-text-secondary)" style={{ marginLeft: 'auto' }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Info box */}
          <div style={{
            padding: '10px 13px', background: 'var(--p-bg-subtle)',
            border: '1px solid var(--p-border)', borderRadius: 10,
            display: 'flex', alignItems: 'flex-start', gap: 8,
            fontSize: 12.5, color: 'var(--p-text-secondary)', lineHeight: 1.6,
          }}>
            <span style={{ color: 'var(--p-text-tertiary)', flexShrink: 0, marginTop: 1, display: 'flex' }}>
              <Info size={13} />
            </span>
            El usuario debe estar previamente registrado en Pensum con este email para poder añadirlo a tu institución.
          </div>
        </div>

        <div style={{
          padding: '14px 24px', borderTop: '1px solid var(--p-border)',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          background: 'var(--p-bg-subtle)',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 15px', borderRadius: 10,
              border: '1px solid var(--p-border)', background: 'var(--p-bg-base)',
              color: 'var(--p-text-primary)', fontSize: 13, fontFamily: 'inherit', fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={inviteMember.isPending}
            style={{
              padding: '7px 15px', borderRadius: 10,
              border: '1px solid transparent',
              background: 'var(--p-accent)', color: 'var(--p-accent-text)',
              fontSize: 13, fontFamily: 'inherit', fontWeight: 500,
              cursor: inviteMember.isPending ? 'not-allowed' : 'pointer',
              opacity: inviteMember.isPending ? 0.5 : 1,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            {inviteMember.isPending && <Spinner size={13} />}
            {inviteMember.isPending ? 'Agregando…' : 'Agregar miembro'}
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
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'oklch(0% 0 0 / 0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(2px)', padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420, maxWidth: 'calc(100vw - 32px)',
          background: 'var(--p-bg-base)', border: '1px solid var(--p-border)',
          borderRadius: 24, boxShadow: 'var(--p-shadow-lg)', overflow: 'hidden',
        }}
      >
        <div style={{ padding: '20px 24px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 16,
            background: 'var(--p-d-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--p-d-500)', marginBottom: 14,
          }}>
            <AlertTriangle size={20} />
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--p-text-primary)', marginBottom: 8 }}>
            Eliminar miembro
          </div>
          <p style={{ fontSize: 14, color: 'var(--p-text-secondary)', lineHeight: 1.65, margin: 0 }}>
            ¿Eliminar a <strong style={{ color: 'var(--p-text-primary)' }}>{name}</strong> de la institución?
            Perderá acceso inmediatamente. Esta acción no se puede deshacer.
          </p>
        </div>
        <div style={{
          padding: '14px 24px', borderTop: '1px solid var(--p-border)',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          background: 'var(--p-bg-subtle)',
        }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 15px', borderRadius: 10,
              border: '1px solid var(--p-border)', background: 'var(--p-bg-base)',
              color: 'var(--p-text-primary)', fontSize: 13, fontFamily: 'inherit', fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            style={{
              padding: '7px 15px', borderRadius: 10,
              border: '1px solid transparent',
              background: 'var(--p-d-500)', color: 'white',
              fontSize: 13, fontFamily: 'inherit', fontWeight: 500,
              cursor: isPending ? 'not-allowed' : 'pointer',
              opacity: isPending ? 0.6 : 1,
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
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
    <div style={{ maxWidth: 1100, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{
              fontSize: 22, fontWeight: 800, color: 'var(--p-text-primary)',
              letterSpacing: '-0.03em', margin: 0,
            }}>
              Miembros
            </h1>
            <span style={{
              padding: '2px 9px', borderRadius: '99px', fontSize: 13, fontWeight: 700,
              background: 'var(--p-bg-muted)', color: 'var(--p-text-secondary)',
            }}>
              {data.length}
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--p-text-secondary)', margin: 0 }}>
            Gestiona los miembros de tu institución
          </p>
        </div>
        <RoleGate roles={['director']}>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 10, border: 'none',
              background: 'var(--p-accent)', color: 'var(--p-accent-text)',
              fontSize: 13.5, fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer',
            }}
          >
            <Plus size={14} /> Agregar Miembro
          </button>
        </RoleGate>
      </div>

      {/* Card */}
      <div style={{
        background: 'var(--p-bg-base)', border: '1px solid var(--p-border)',
        borderRadius: 24, boxShadow: 'var(--p-shadow-sm)', overflow: 'hidden',
      }}>
        {/* Toolbar: tabs + search */}
        <div style={{
          padding: '0 20px', borderBottom: '1px solid var(--p-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', overflowX: 'auto' }}>
            {TABS.map((t) => {
              const cnt = countFor(t.id);
              const active = tabRole === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTabRole(t.id)}
                  style={{
                    padding: '13px 14px', border: 'none',
                    borderBottom: active ? '2px solid var(--p-accent)' : '2px solid transparent',
                    background: 'transparent',
                    fontSize: 13.5, fontFamily: 'inherit',
                    fontWeight: active ? 600 : 500, cursor: 'pointer',
                    color: active ? 'var(--p-text-primary)' : 'var(--p-text-secondary)',
                    display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                    marginBottom: -1, transition: 'all 0.1s',
                  }}
                >
                  {t.label}
                  <span style={{
                    padding: '1px 6px', borderRadius: '99px', fontSize: 11.5, fontWeight: 700,
                    background: active ? 'var(--p-bg-subtle)' : 'var(--p-bg-muted)',
                    color: active ? 'var(--p-text-primary)' : 'var(--p-text-tertiary)',
                  }}>
                    {cnt}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ position: 'relative', flexShrink: 0, paddingBlock: 8 }}>
            <span style={{
              position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--p-text-tertiary)', display: 'flex', pointerEvents: 'none',
            }}>
              <Search size={13} />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar miembro…"
              style={{
                padding: '7px 11px 7px 30px', fontSize: 13, fontFamily: 'inherit',
                border: '1.5px solid var(--p-border)', borderRadius: 10,
                background: 'var(--p-bg-base)', color: 'var(--p-text-primary)',
                outline: 'none', width: 220,
              }}
            />
          </div>
        </div>

        {/* Body */}
        {members.isLoading ? (
          <div style={{ padding: '32px 20px' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 11, paddingBlock: 12, borderBottom: '1px solid var(--p-border)' }}>
                <div style={{ width: 34, height: 34, borderRadius: '99px', background: 'var(--p-bg-subtle)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 12, background: 'var(--p-bg-subtle)', borderRadius: 4, width: '40%', marginBottom: 6 }} />
                  <div style={{ height: 10, background: 'var(--p-bg-subtle)', borderRadius: 4, width: '60%' }} />
                </div>
                <div style={{ width: 70, height: 18, borderRadius: 99, background: 'var(--p-bg-subtle)' }} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState onAdd={() => setShowAdd(true)} isDirector={isDirector} query={query} />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--p-bg-subtle)', borderBottom: '1px solid var(--p-border)' }}>
                  {['Nombre', 'Email', 'Rol', 'Miembro desde', ''].map((h, i) => (
                    <th
                      key={i}
                      style={{
                        padding: '9px 20px', textAlign: 'left',
                        fontSize: 11, fontWeight: 700, color: 'var(--p-text-tertiary)',
                        textTransform: 'uppercase', letterSpacing: '0.06em',
                        whiteSpace: 'nowrap', width: i === 4 ? '44px' : undefined,
                      }}
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
          <div style={{
            padding: '11px 20px', borderTop: '1px solid var(--p-border)',
            background: 'var(--p-bg-subtle)',
            fontSize: 12.5, color: 'var(--p-text-tertiary)',
          }}>
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

      <style>{`
        @keyframes dropIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: none; }
        }
      `}</style>
    </div>
  );
}
