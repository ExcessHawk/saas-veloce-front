import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Pencil, X, Check, Camera, Mail, Phone, Globe, Clock, MapPin,
  Zap, Users, BookOpen, DoorOpen, Lock, Star, ArrowRight,
} from 'lucide-react';

import { useNavigate } from 'react-router';
import { useSchool, useUpdateSchool } from '@/hooks/useSchool';
import { useSubscription } from '@/hooks/useBilling';
import { useMembers } from '@/hooks/useMembers';
import { useCourses } from '@/hooks/useCourses';
import { useClassrooms } from '@/hooks/useClassrooms';
import { showApiError } from '@/lib/errors';
import { useAuthStore } from '@/stores/authStore';
import { Spinner } from '@/components/AuthFormParts';

const schoolSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  domain: z.string().optional(),
  contactEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  country: z.string().optional(),
});

function planFeatures(sub) {
  if (!sub) return [];
  const feats = [];
  feats.push(sub.maxStudents ? `Hasta ${sub.maxStudents} alumnos` : 'Alumnos ilimitados');
  feats.push(sub.maxTeachers ? `Hasta ${sub.maxTeachers} docentes` : 'Docentes ilimitados');
  feats.push(sub.maxCourses  ? `Hasta ${sub.maxCourses} cursos`   : 'Cursos ilimitados');
  if (sub.planDescription) feats.push(sub.planDescription);
  return feats;
}

const initials = (n) => (n || 'P').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

/* ── Inputs ── */
function EditInput({ value, onChange, placeholder, mono, icon: IconCmp, error, ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {IconCmp && (
        <span style={{
          position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--p-text-tertiary)', display: 'flex', pointerEvents: 'none',
        }}>
          <IconCmp size={13} />
        </span>
      )}
      <input
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: '100%', padding: '7px 10px',
          paddingLeft: IconCmp ? 30 : 10,
          fontSize: 13.5,
          fontFamily: mono ? "'Geist Mono', monospace" : 'inherit',
          border: `1.5px solid ${error ? 'var(--p-d-500)' : focus ? 'var(--p-border-strong)' : 'var(--p-border)'}`,
          borderRadius: 10,
          background: 'var(--p-bg-base)',
          color: 'var(--p-text-primary)',
          outline: 'none', transition: 'border-color 0.12s',
          letterSpacing: mono ? '0.02em' : 'normal',
        }}
        {...rest}
      />
    </div>
  );
}

/* ── Field row (read / edit) ── */
function FieldRow({ label, value, icon: IconCmp, editing, onChange, placeholder, readonly, mono, error }) {
  return (
    <div>
      <div style={{
        fontSize: 11, fontWeight: 700, color: 'var(--p-text-tertiary)',
        textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 5,
      }}>
        {label}
      </div>
      {editing && !readonly ? (
        <>
          <EditInput value={value} onChange={onChange} placeholder={placeholder || label} icon={IconCmp} mono={mono} error={error} />
          {error && <div style={{ fontSize: 11.5, color: 'var(--p-d-500)', marginTop: 4 }}>{error}</div>}
        </>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          fontSize: mono ? 13 : 14,
          color: value ? 'var(--p-text-primary)' : 'var(--p-text-tertiary)',
          fontFamily: mono ? "'Geist Mono', monospace" : 'inherit',
          padding: editing && readonly ? '7px 10px' : 0,
          background: editing && readonly ? 'var(--p-bg-subtle)' : 'transparent',
          borderRadius: editing && readonly ? 10 : 0,
          border: editing && readonly ? '1px solid var(--p-border)' : 'none',
        }}>
          {IconCmp && !editing && <span style={{ color: 'var(--p-text-tertiary)', flexShrink: 0, display: 'flex' }}><IconCmp size={13} /></span>}
          {editing && readonly && <span style={{ color: 'var(--p-text-tertiary)', flexShrink: 0, display: 'flex' }}><Lock size={11} /></span>}
          <span>{value || '—'}</span>
        </div>
      )}
    </div>
  );
}

/* ── Section card ── */
function SectionCard(props) {
  return (
    <div style={{
      background: 'var(--p-bg-base)', border: '1px solid var(--p-border)',
      borderRadius: 24, boxShadow: 'var(--p-shadow-sm)', overflow: 'hidden',
    }}>
      <div style={{
        padding: '16px 22px 14px', borderBottom: '1px solid var(--p-border)',
        display: 'flex', alignItems: 'center', gap: 9,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 10, background: 'var(--p-bg-subtle)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--p-text-secondary)', flexShrink: 0,
        }}>
          <props.icon size={14} />
        </div>
        <span style={{
          fontSize: 13.5, fontWeight: 700, color: 'var(--p-text-primary)', letterSpacing: '-0.01em',
        }}>
          {props.title}
        </span>
      </div>
      <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {props.children}
      </div>
    </div>
  );
}

/* ── Header buttons ── */
function HeaderBtn({ children, variant = 'secondary', icon: IconCmp, onClick, loading, disabled }) {
  const [hov, setHov] = useState(false);
  const styles = {
    primary: {
      bg: loading || disabled ? 'var(--p-text-secondary)' : hov ? 'var(--p-accent-hover)' : 'var(--p-accent)',
      color: 'var(--p-accent-text)', border: 'transparent',
    },
    secondary: {
      bg: hov ? 'var(--p-bg-subtle)' : 'var(--p-bg-base)',
      color: 'var(--p-text-primary)', border: 'var(--p-border)',
    },
  }[variant];
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderRadius: 10,
        border: `1px solid ${styles.border}`,
        background: styles.bg, color: styles.color,
        fontSize: 13, fontFamily: 'inherit', fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'all 0.12s',
      }}
    >
      {loading ? <Spinner size={13} /> : IconCmp && <IconCmp size={13} />}
      {children}
    </button>
  );
}

/* ══ Page ══ */
export default function SchoolPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isDirector = user?.role === 'director';

  const [editing, setEditing] = useState(false);
  const [logoHov, setLogoHov] = useState(false);

  const { data: school, isLoading, error } = useSchool();
  const { data: sub } = useSubscription();
  const updateSchool = useUpdateSchool();

  const members = useMembers();
  const courses = useCourses();
  const classrooms = useClassrooms();

  const {
    register, handleSubmit, watch, reset, setValue,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(schoolSchema),
    defaultValues: {
      name: '', domain: '', contactEmail: '', contactPhone: '',
      timezone: '', locale: '', country: '',
    },
  });

  useEffect(() => {
    if (error) showApiError(error);
  }, [error]);

  useEffect(() => {
    if (school) {
      reset({
        name: school.name || '',
        domain: school.domain || '',
        contactEmail: school.contactEmail || '',
        contactPhone: school.contactPhone || '',
        timezone: school.timezone || '',
        locale: school.locale || '',
        country: school.country || '',
      });
    }
  }, [school, reset]);

  const draft = watch();

  const startEdit = () => {
    if (school) {
      reset({
        name: school.name || '',
        domain: school.domain || '',
        contactEmail: school.contactEmail || '',
        contactPhone: school.contactPhone || '',
        timezone: school.timezone || '',
        locale: school.locale || '',
        country: school.country || '',
      });
    }
    setEditing(true);
  };

  const cancelEdit = () => {
    if (school) {
      reset({
        name: school.name || '',
        domain: school.domain || '',
        contactEmail: school.contactEmail || '',
        contactPhone: school.contactPhone || '',
        timezone: school.timezone || '',
        locale: school.locale || '',
        country: school.country || '',
      });
    }
    setEditing(false);
  };

  const onSubmit = async (data) => {
    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== ''),
    );
    try {
      await updateSchool.mutateAsync(clean);
      setEditing(false);
    } catch { /* handled */ }
  };

  /* Read or draft value depending on mode */
  const val = (key) => (editing ? draft[key] : school?.[key]) || '';

  const planName = sub?.planName ?? '—';
  const currentFeatures = planFeatures(sub);

  const memberCount    = (members.data ?? []).length;
  const courseCount    = (courses.data ?? []).length;
  const classroomCount = (classrooms.data ?? []).length;

  const renovacion = sub?.currentPeriodEnd ? format(new Date(sub.currentPeriodEnd), 'dd MMM yyyy') : '—';

  return (
    <form onSubmit={handleSubmit(onSubmit)} style={{ maxWidth: 1000, margin: '0 auto' }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
        <div>
          <h1 style={{
            fontSize: 22, fontWeight: 800, color: 'var(--p-text-primary)',
            letterSpacing: '-0.03em', marginBottom: 4,
          }}>
            Mi Escuela
          </h1>
          <p style={{ fontSize: 13.5, color: 'var(--p-text-secondary)', margin: 0 }}>
            Información, contacto y plan de tu institución
          </p>
        </div>

        {isDirector && (
          editing ? (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ fontSize: 12.5, color: 'var(--p-text-tertiary)', marginRight: 4 }}>Modo edición</span>
              <HeaderBtn variant="secondary" icon={X} onClick={cancelEdit}>Cancelar</HeaderBtn>
              <HeaderBtn variant="primary" icon={Check} loading={updateSchool.isPending} onClick={handleSubmit(onSubmit)} disabled={!isDirty}>
                {updateSchool.isPending ? 'Guardando…' : 'Guardar cambios'}
              </HeaderBtn>
            </div>
          ) : (
            <HeaderBtn variant="secondary" icon={Pencil} onClick={startEdit}>Editar</HeaderBtn>
          )
        )}
      </div>

      {/* Edit mode banner */}
      {editing && (
        <div style={{
          padding: '11px 16px', background: 'oklch(93% 0.025 250)',
          border: '1px solid oklch(84% 0.032 250)', borderRadius: 16,
          display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
          animation: 'fadeUp 0.2s ease',
        }}>
          <span style={{ color: 'oklch(32% 0.07 250)', display: 'flex' }}><Pencil size={14} /></span>
          <span style={{ fontSize: 13.5, color: 'oklch(28% 0.07 250)', fontWeight: 500 }}>
            Estás editando la información de la escuela. Los cambios se publicarán al guardar.
          </span>
          <button type="button" onClick={cancelEdit} style={{
            marginLeft: 'auto', border: 'none', background: 'transparent',
            color: 'oklch(45% 0.07 250)', cursor: 'pointer', display: 'flex', padding: 2,
          }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* School header card */}
      <div style={{
        background: 'var(--p-bg-base)', border: '1px solid var(--p-border)',
        borderRadius: 24, boxShadow: 'var(--p-shadow-sm)',
        padding: '28px 28px 26px', marginBottom: 20,
        display: 'flex', alignItems: 'flex-start', gap: 22, flexWrap: 'wrap',
      }}>
        {/* Logo */}
        <div
          onMouseEnter={() => setLogoHov(true)}
          onMouseLeave={() => setLogoHov(false)}
          style={{ position: 'relative', cursor: editing ? 'pointer' : 'default', flexShrink: 0 }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'linear-gradient(135deg, oklch(50% 0.08 250), oklch(38% 0.07 260))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, fontWeight: 800, color: 'white', letterSpacing: '-0.03em',
            boxShadow: logoHov && editing ? '0 0 0 3px var(--p-border-strong)' : 'none',
            transition: 'box-shadow 0.15s',
          }}>
            {initials(school?.name)}
          </div>
          {editing && logoHov && (
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 16,
              background: 'oklch(0% 0 0 / 0.55)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
            }}>
              <Camera size={16} color="white" />
              <span style={{ fontSize: 8.5, fontWeight: 700, color: 'white', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Cambiar
              </span>
            </div>
          )}
        </div>

        {/* Name + badges */}
        <div style={{ flex: 1, minWidth: 200 }}>
          {isLoading ? (
            <div style={{ height: 28, background: 'var(--p-bg-subtle)', borderRadius: 6, width: '60%', marginBottom: 12 }} />
          ) : editing ? (
            <div style={{ marginBottom: 12 }}>
              <input
                {...register('name')}
                style={{
                  fontSize: 22, fontWeight: 800, fontFamily: 'inherit', letterSpacing: '-0.03em',
                  background: 'transparent', border: 'none',
                  borderBottom: '2px solid var(--p-accent)',
                  color: 'var(--p-text-primary)',
                  outline: 'none', width: '100%', padding: '2px 0',
                }}
              />
              {errors.name && <div style={{ fontSize: 12, color: 'var(--p-d-500)', marginTop: 4 }}>{errors.name.message}</div>}
            </div>
          ) : (
            <h1 style={{
              fontSize: 24, fontWeight: 800, color: 'var(--p-text-primary)',
              letterSpacing: '-0.035em', marginBottom: 10,
            }}>
              {school?.name || '—'}
            </h1>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              padding: '3px 10px', borderRadius: '99px', fontSize: 12, fontWeight: 700,
              background: 'oklch(92% 0.020 250)', color: 'oklch(35% 0.050 250)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Star size={11} /> {sub ? `Plan ${planName}` : 'Sin plan'}
            </span>
            <span style={{
              padding: '3px 10px', borderRadius: '99px', fontSize: 12, fontWeight: 700,
              background: 'var(--p-s-100)', color: 'var(--p-s-700)',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '99px', background: 'var(--p-s-500)' }} />
              {school?.status === 'active' ? 'Activo' : (school?.status || 'Activo')}
            </span>
            {school?.country && (
              <span style={{
                padding: '3px 10px', borderRadius: '99px', fontSize: 12, fontWeight: 600,
                background: 'var(--p-bg-subtle)', color: 'var(--p-text-secondary)',
                border: '1px solid var(--p-border)',
              }}>
                {school.country}
              </span>
            )}
            {school?.slug && (
              <span style={{
                padding: '3px 10px', borderRadius: '99px', fontSize: 11.5, fontWeight: 500,
                background: 'var(--p-bg-subtle)', color: 'var(--p-text-tertiary)',
                border: '1px solid var(--p-border)',
                fontFamily: "'Geist Mono', monospace",
              }}>
                /{school.slug}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="school-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Contacto */}
        <SectionCard title="Contacto" icon={Mail}>
          <FieldRow label="Email de contacto" value={val('contactEmail')} icon={Mail} editing={editing}
            onChange={(v) => setValue('contactEmail', v, { shouldDirty: true })}
            placeholder="contacto@escuela.edu.mx" error={errors.contactEmail?.message} />
          <FieldRow label="Teléfono" value={val('contactPhone')} icon={Phone} editing={editing}
            onChange={(v) => setValue('contactPhone', v, { shouldDirty: true })}
            placeholder="+52 55 0000 0000" />
          <FieldRow label="Dominio" value={val('domain')} icon={Globe} editing={editing}
            onChange={(v) => setValue('domain', v, { shouldDirty: true })}
            placeholder="escuela.edu.mx" mono />
        </SectionCard>

        {/* Regional */}
        <SectionCard title="Configuración regional" icon={MapPin}>
          <FieldRow label="Zona horaria" value={val('timezone')} icon={Clock} editing={editing}
            onChange={(v) => setValue('timezone', v, { shouldDirty: true })}
            placeholder="America/Mexico_City" />
          <FieldRow label="Locale" value={val('locale')} icon={Globe} editing={editing}
            onChange={(v) => setValue('locale', v, { shouldDirty: true })}
            placeholder="es-MX" mono />
          <FieldRow label="País" value={val('country')} icon={MapPin} editing={editing}
            onChange={(v) => setValue('country', v, { shouldDirty: true })}
            placeholder="México" />
        </SectionCard>

        {/* Plan */}
        <SectionCard title="Plan actual" icon={Zap}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{
                  padding: '4px 12px', borderRadius: '99px', fontSize: 13, fontWeight: 800,
                  background: 'oklch(92% 0.020 250)', color: 'oklch(35% 0.050 250)',
                }}>
                  Pensum {sub ? planName : '—'}
                </span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--p-text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Clock size={12} /> Renovación: {renovacion}
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--p-border)', paddingTop: 14 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: 'var(--p-text-tertiary)',
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10,
            }}>
              Incluye
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {currentFeatures.map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--p-text-secondary)' }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: '99px',
                    background: 'var(--p-s-100)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--p-s-700)', flexShrink: 0,
                  }}>
                    <Check size={9} strokeWidth={3} />
                  </span>
                  {f}
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/dashboard/billing')}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              fontSize: 13.5, fontWeight: 600,
              color: 'oklch(35% 0.050 250)', background: 'transparent',
              border: '1px solid oklch(84% 0.032 250)',
              padding: '8px 16px', borderRadius: 10,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'all 0.1s', width: '100%', justifyContent: 'center',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'oklch(92% 0.020 250)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Gestionar facturación <ArrowRight size={13} />
          </button>
        </SectionCard>

        {/* Stats */}
        <SectionCard title="Estadísticas rápidas" icon={Users}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { label: 'Miembros', value: memberCount,    Icon: Users,    color: 'oklch(32% 0.07 250)', loading: members.isLoading },
              { label: 'Cursos',   value: courseCount,    Icon: BookOpen, color: 'var(--p-s-700)',      loading: courses.isLoading },
              { label: 'Aulas',    value: classroomCount, Icon: DoorOpen, color: 'oklch(38% 0.10 72)',  loading: classrooms.isLoading },
            ].map((s) => (
              <div key={s.label} style={{
                padding: '14px 12px', background: 'var(--p-bg-subtle)',
                border: '1px solid var(--p-border)', borderRadius: 16, textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, fontWeight: 800, color: s.color, letterSpacing: '-0.05em', lineHeight: 1 }}>
                  {s.loading ? '—' : s.value}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--p-text-secondary)', marginTop: 6, fontWeight: 500 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          <div style={{
            padding: '12px 14px', background: 'var(--p-bg-subtle)',
            borderRadius: 10, border: '1px solid var(--p-border)',
            fontSize: 12.5, color: 'var(--p-text-secondary)', lineHeight: 1.6,
          }}>
            Datos sincronizados en tiempo real con tu instancia de Pensum.
          </div>
        </SectionCard>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .school-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </form>
  );
}
