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
import { cn } from '@/lib/utils';

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
    <div className="relative">
      {IconCmp && (
        <span className="absolute left-[9px] top-1/2 -translate-y-1/2 text-p-text-tertiary flex pointer-events-none">
          <IconCmp size={13} />
        </span>
      )}
      <input
        value={value ?? ''}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        className={cn(
          'w-full py-[7px] pr-[10px] text-[13.5px] rounded-[10px] bg-p-bg-base text-p-text-primary outline-none transition-[border-color] duration-[120ms]',
          IconCmp ? 'pl-[30px]' : 'pl-[10px]',
          mono ? 'font-mono tracking-[0.02em]' : '',
          error
            ? 'border-[1.5px] border-p-d-500'
            : focus
            ? 'border-[1.5px] border-p-border-strong'
            : 'border-[1.5px] border-p-border',
        )}
        {...rest}
      />
    </div>
  );
}

/* ── Field row (read / edit) ── */
function FieldRow({ label, value, icon: IconCmp, editing, onChange, placeholder, readonly, mono, error }) {
  return (
    <div>
      <div className="text-[11px] font-bold text-p-text-tertiary uppercase tracking-[0.08em] mb-[5px]">
        {label}
      </div>
      {editing && !readonly ? (
        <>
          <EditInput value={value} onChange={onChange} placeholder={placeholder || label} icon={IconCmp} mono={mono} error={error} />
          {error && <div className="text-[11.5px] text-p-d-500 mt-1">{error}</div>}
        </>
      ) : (
        <div className={cn(
          'flex items-center gap-2',
          mono ? 'text-[13px] font-mono' : 'text-[14px]',
          value ? 'text-p-text-primary' : 'text-p-text-tertiary',
          editing && readonly
            ? 'py-[7px] px-[10px] bg-p-bg-subtle rounded-[10px] border border-p-border'
            : 'p-0 bg-transparent border-none rounded-none',
        )}>
          {IconCmp && !editing && <span className="text-p-text-tertiary shrink-0 flex"><IconCmp size={13} /></span>}
          {editing && readonly && <span className="text-p-text-tertiary shrink-0 flex"><Lock size={11} /></span>}
          <span>{value || '—'}</span>
        </div>
      )}
    </div>
  );
}

/* ── Section card ── */
function SectionCard(props) {
  return (
    <div className="bg-p-bg-base border border-p-border rounded-[24px] shadow-p-sm overflow-hidden">
      <div className="px-[22px] py-[16px] pb-[14px] border-b border-p-border flex items-center gap-[9px]">
        <div className="w-[30px] h-[30px] rounded-[10px] bg-p-bg-subtle flex items-center justify-center text-p-text-secondary shrink-0">
          <props.icon size={14} />
        </div>
        <span className="text-[13.5px] font-bold text-p-text-primary tracking-[-0.01em]">
          {props.title}
        </span>
      </div>
      <div className="px-[22px] py-[18px] flex flex-col gap-4">
        {props.children}
      </div>
    </div>
  );
}

/* ── Header buttons ── */
function HeaderBtn({ children, variant = 'secondary', icon: IconCmp, onClick, loading, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center gap-[6px] px-[14px] py-[7px] rounded-[10px] border text-[13px] font-semibold font-[inherit] transition-all duration-[120ms]',
        disabled || loading ? 'cursor-not-allowed' : 'cursor-pointer',
        disabled ? 'opacity-50' : '',
        variant === 'primary'
          ? cn(
              'border-transparent text-p-accent-text',
              loading || disabled ? 'bg-p-text-secondary' : 'bg-p-accent hover:bg-p-accent-hover',
            )
          : 'bg-p-bg-base hover:bg-p-bg-subtle text-p-text-primary border-p-border',
      )}
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
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-[1000px] mx-auto">
      {/* Title row */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold text-p-text-primary tracking-[-0.03em] mb-1">
            Mi Escuela
          </h1>
          <p className="text-[13.5px] text-p-text-secondary m-0">
            Información, contacto y plan de tu institución
          </p>
        </div>

        {isDirector && (
          editing ? (
            <div className="flex gap-2 items-center">
              <span className="text-[12.5px] text-p-text-tertiary mr-1">Modo edición</span>
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
        <div className="px-4 py-[11px] bg-[oklch(93%_0.025_250)] border border-[oklch(84%_0.032_250)] rounded-[16px] flex items-center gap-[10px] mb-5 animate-[fadeUp_0.2s_ease]">
          <span className="text-[oklch(32%_0.07_250)] flex"><Pencil size={14} /></span>
          <span className="text-[13.5px] text-[oklch(28%_0.07_250)] font-medium">
            Estás editando la información de la escuela. Los cambios se publicarán al guardar.
          </span>
          <button type="button" onClick={cancelEdit} className="ml-auto border-none bg-transparent text-[oklch(45%_0.07_250)] cursor-pointer flex p-[2px]">
            <X size={14} />
          </button>
        </div>
      )}

      {/* School header card */}
      <div className="bg-p-bg-base border border-p-border rounded-[24px] shadow-p-sm px-7 pt-7 pb-[26px] mb-5 flex items-start gap-[22px] flex-wrap">
        {/* Logo */}
        <div
          onMouseEnter={() => setLogoHov(true)}
          onMouseLeave={() => setLogoHov(false)}
          className={cn('relative shrink-0', editing ? 'cursor-pointer' : 'cursor-default')}
        >
          <div
            className={cn(
              'w-16 h-16 rounded-[16px] flex items-center justify-center text-[22px] font-extrabold text-white tracking-[-0.03em] transition-[box-shadow] duration-[150ms]',
              logoHov && editing ? 'shadow-[0_0_0_3px_var(--p-border-strong)]' : 'shadow-none',
            )}
            style={{ background: 'linear-gradient(135deg, oklch(50% 0.08 250), oklch(38% 0.07 260))' }}
          >
            {initials(school?.name)}
          </div>
          {editing && logoHov && (
            <div className="absolute inset-0 rounded-[16px] bg-[oklch(0%_0_0_/_0.55)] flex flex-col items-center justify-center gap-[2px]">
              <Camera size={16} color="white" />
              <span className="text-[8.5px] font-bold text-white uppercase tracking-[0.04em]">
                Cambiar
              </span>
            </div>
          )}
        </div>

        {/* Name + badges */}
        <div className="flex-1 min-w-[200px]">
          {isLoading ? (
            <div className="h-7 bg-p-bg-subtle rounded-[6px] w-3/5 mb-3" />
          ) : editing ? (
            <div className="mb-3">
              <input
                {...register('name')}
                className="text-[22px] font-extrabold font-[inherit] tracking-[-0.03em] bg-transparent border-none border-b-2 border-b-p-accent text-p-text-primary outline-none w-full py-[2px] px-0"
              />
              {errors.name && <div className="text-[12px] text-p-d-500 mt-1">{errors.name.message}</div>}
            </div>
          ) : (
            <h1 className="text-[24px] font-extrabold text-p-text-primary tracking-[-0.035em] mb-[10px]">
              {school?.name || '—'}
            </h1>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-[10px] py-[3px] rounded-full text-[12px] font-bold bg-[oklch(92%_0.020_250)] text-[oklch(35%_0.050_250)] flex items-center gap-[5px]">
              <Star size={11} /> {sub ? `Plan ${planName}` : 'Sin plan'}
            </span>
            <span className="px-[10px] py-[3px] rounded-full text-[12px] font-bold bg-p-s-100 text-p-s-700 flex items-center gap-[5px]">
              <span className="w-[6px] h-[6px] rounded-full bg-p-s-500" />
              {school?.status === 'active' ? 'Activo' : (school?.status || 'Activo')}
            </span>
            {school?.country && (
              <span className="px-[10px] py-[3px] rounded-full text-[12px] font-semibold bg-p-bg-subtle text-p-text-secondary border border-p-border">
                {school.country}
              </span>
            )}
            {school?.slug && (
              <span className="px-[10px] py-[3px] rounded-full text-[11.5px] font-medium bg-p-bg-subtle text-p-text-tertiary border border-p-border font-mono">
                /{school.slug}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
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
          <div className="flex items-center justify-between flex-wrap gap-[10px]">
            <div>
              <div className="flex items-center gap-2 mb-[6px]">
                <span className="px-3 py-1 rounded-full text-[13px] font-extrabold bg-[oklch(92%_0.020_250)] text-[oklch(35%_0.050_250)]">
                  Pensum {sub ? planName : '—'}
                </span>
              </div>
              <div className="text-[13px] text-p-text-secondary flex items-center gap-[5px]">
                <Clock size={12} /> Renovación: {renovacion}
              </div>
            </div>
          </div>
          <div className="border-t border-p-border pt-[14px]">
            <div className="text-[11px] font-bold text-p-text-tertiary uppercase tracking-[0.08em] mb-[10px]">
              Incluye
            </div>
            <div className="flex flex-col gap-[7px]">
              {currentFeatures.map((f) => (
                <div key={f} className="flex items-center gap-2 text-[13px] text-p-text-secondary">
                  <span className="w-4 h-4 rounded-full bg-p-s-100 flex items-center justify-center text-p-s-700 shrink-0">
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
            className="flex items-center gap-[7px] text-[13.5px] font-semibold text-[oklch(35%_0.050_250)] bg-transparent border border-[oklch(84%_0.032_250)] px-4 py-2 rounded-[10px] cursor-pointer font-[inherit] transition-all duration-[100ms] w-full justify-center hover:bg-[oklch(92%_0.020_250)]"
          >
            Gestionar facturación <ArrowRight size={13} />
          </button>
        </SectionCard>

        {/* Stats */}
        <SectionCard title="Estadísticas rápidas" icon={Users}>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Miembros', value: memberCount,    Icon: Users,    color: 'oklch(32% 0.07 250)', loading: members.isLoading },
              { label: 'Cursos',   value: courseCount,    Icon: BookOpen, color: 'var(--p-s-700)',      loading: courses.isLoading },
              { label: 'Aulas',    value: classroomCount, Icon: DoorOpen, color: 'oklch(38% 0.10 72)',  loading: classrooms.isLoading },
            ].map((s) => (
              <div key={s.label} className="px-3 py-[14px] bg-p-bg-subtle border border-p-border rounded-[16px] text-center">
                <div className="text-[28px] font-extrabold tracking-[-0.05em] leading-none" style={{ color: s.color }}>
                  {s.loading ? '—' : s.value}
                </div>
                <div className="text-[11.5px] text-p-text-secondary mt-[6px] font-medium">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
          <div className="px-[14px] py-3 bg-p-bg-subtle rounded-[10px] border border-p-border text-[12.5px] text-p-text-secondary leading-[1.6]">
            Datos sincronizados en tiempo real con tu instancia de Pensum.
          </div>
        </SectionCard>
      </div>

    </form>
  );
}
