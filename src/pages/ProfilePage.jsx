import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  User, Shield, Mail, Phone, Camera, Calendar, Clock, Hash,
  Lock, Eye, EyeOff, Check,
} from 'lucide-react';

import { useProfile, useUpdateProfile, useChangePassword } from '@/hooks/useProfile';
import { showApiError } from '@/lib/errors';
import { PwStrengthMeter, Spinner } from '@/components/AuthFormParts';
import { cn } from '@/lib/utils';

/* ── Role config ── */
const ROLES = {
  director: { label: 'Director',     bg: 'oklch(93% 0.025 250)', color: 'oklch(30% 0.06 250)', grad: 'oklch(65% 0.14 260),oklch(58% 0.16 300)' },
  teacher:  { label: 'Docente',      bg: 'oklch(90% 0.035 200)', color: 'oklch(30% 0.07 200)', grad: 'oklch(65% 0.14 150),oklch(58% 0.16 180)' },
  student:  { label: 'Estudiante',   bg: 'oklch(93% 0.040 50)',  color: 'oklch(35% 0.09 50)',  grad: 'oklch(65% 0.14 50),oklch(58% 0.16 30)'   },
  parent:   { label: 'Padre/Madre',  bg: 'oklch(91% 0.040 100)', color: 'oklch(30% 0.07 100)', grad: 'oklch(65% 0.14 100),oklch(58% 0.16 130)' },
};

const initials = (n) => (n || '?').split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

const profileSchema = z.object({
  fullName: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Ingresa tu contraseña actual'),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string().min(1, 'Repite la nueva contraseña'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

/* ── Field primitive ── */
function Field({ label, error, hint, children }) {
  return (
    <div className="mb-[18px]">
      <label className="block text-[12.5px] font-semibold text-p-text-secondary mb-[6px]">
        {label}
      </label>
      {children}
      {hint && <div className="text-[11.5px] text-p-text-tertiary mt-[5px]">{hint}</div>}
      {error && <div className="text-[11.5px] text-p-d-500 mt-[5px]">{error}</div>}
    </div>
  );
}

function ProfileInput({ icon: IconCmp, suffix, disabled, error, ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <div className="relative">
      {IconCmp && (
        <span className="absolute left-[10px] top-1/2 -translate-y-1/2 text-p-text-tertiary flex pointer-events-none">
          <IconCmp size={14} />
        </span>
      )}
      <input
        disabled={disabled}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        className={cn(
          'w-full py-[9px] text-[13.5px] font-[inherit] rounded-[10px] outline-none transition-[border-color] duration-[120ms]',
          IconCmp ? 'pl-[34px]' : 'pl-3',
          suffix ? 'pr-10' : 'pr-3',
          disabled
            ? 'bg-p-bg-subtle text-p-text-tertiary'
            : 'bg-p-bg-base text-p-text-primary',
          error
            ? 'border-[1.5px] border-p-d-500'
            : focus
            ? 'border-[1.5px] border-p-border-strong'
            : 'border-[1.5px] border-p-border',
        )}
        {...rest}
      />
      {suffix && (
        <span className="absolute right-[10px] top-1/2 -translate-y-1/2">
          {suffix}
        </span>
      )}
    </div>
  );
}

function PrimaryBtn({ children, loading, disabled, type = 'button', onClick }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center gap-[7px] px-5 py-[9px] rounded-[10px] border border-transparent text-p-accent-text text-[13.5px] font-[inherit] font-semibold transition-all duration-[120ms]',
        disabled || loading ? 'cursor-not-allowed' : 'cursor-pointer',
        disabled ? 'opacity-50' : '',
        loading || disabled ? 'bg-p-text-secondary' : 'bg-p-accent hover:bg-p-accent-hover',
      )}
    >
      {loading && <Spinner size={14} />}
      {children}
    </button>
  );
}

/* ══ Tab Información ══ */
function TabInfo({ profile, isPending, onSubmit }) {
  const {
    register, handleSubmit, reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: profile?.fullName || '', phone: profile?.phone || '' },
  });

  useEffect(() => {
    if (profile) reset({ fullName: profile.fullName || '', phone: profile.phone || '' });
  }, [profile, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="animate-[fadeUp_0.2s_ease]">
      <Field label="Nombre completo" error={errors.fullName?.message}>
        <ProfileInput
          icon={User}
          placeholder="Tu nombre completo"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
      </Field>

      <Field label="Correo electrónico" hint="El correo no puede modificarse desde aquí.">
        <ProfileInput icon={Mail} value={profile?.email ?? ''} disabled readOnly onChange={() => {}} />
      </Field>

      <Field label="Teléfono">
        <ProfileInput
          icon={Phone}
          placeholder="+52 55 0000 0000"
          {...register('phone')}
        />
      </Field>

      <div className="flex items-center gap-[10px] mt-1">
        <PrimaryBtn type="submit" loading={isPending} disabled={!isDirty}>
          {isPending ? 'Guardando…' : 'Guardar cambios'}
        </PrimaryBtn>
        {isDirty && !isPending && (
          <button
            type="button"
            onClick={() => reset({ fullName: profile?.fullName || '', phone: profile?.phone || '' })}
            className="border-none bg-transparent text-p-text-tertiary text-[13px] cursor-pointer font-[inherit]"
          >
            Descartar
          </button>
        )}
      </div>
    </form>
  );
}

/* ══ Tab Seguridad ══ */
function TabSeguridad({ isPending, onSubmit }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register, handleSubmit, watch, reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const newPw = watch('newPassword');
  const confirm = watch('confirmPassword');
  const matches = confirm && confirm === newPw;

  const handle = async (data) => {
    await onSubmit(data, () => reset());
  };

  const eyeBtn = (show, set) => (
    <button
      type="button"
      onClick={() => set(!show)}
      className="border-none bg-transparent cursor-pointer text-p-text-tertiary flex p-0"
    >
      {show ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  );

  return (
    <form onSubmit={handleSubmit(handle)} className="animate-[fadeUp_0.2s_ease]">
      <Field label="Contraseña actual" error={errors.currentPassword?.message}>
        <ProfileInput
          icon={Lock}
          type={showCurrent ? 'text' : 'password'}
          placeholder="Tu contraseña actual"
          autoComplete="current-password"
          suffix={eyeBtn(showCurrent, setShowCurrent)}
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
      </Field>

      <div>
        <Field label="Nueva contraseña" error={errors.newPassword?.message}>
          <ProfileInput
            icon={Lock}
            type={showNew ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            suffix={eyeBtn(showNew, setShowNew)}
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
        </Field>
        <div className="-mt-3">
          <PwStrengthMeter password={newPw} />
        </div>
      </div>

      <div className="mt-[14px]">
        <Field label="Confirmar nueva contraseña" error={errors.confirmPassword?.message}>
          <ProfileInput
            icon={Lock}
            type={showConfirm ? 'text' : 'password'}
            placeholder="Repite la nueva contraseña"
            autoComplete="new-password"
            suffix={eyeBtn(showConfirm, setShowConfirm)}
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
        </Field>
        {matches && (
          <div className="text-[12px] text-p-s-700 -mt-[10px] mb-[14px] flex items-center gap-[5px]">
            <Check size={12} /> Las contraseñas coinciden
          </div>
        )}
      </div>

      <div className="px-[14px] py-3 bg-p-bg-subtle rounded-[10px] border border-p-border mb-5 text-[12.5px] text-p-text-secondary leading-[1.6]">
        Tu contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial para ser segura.
      </div>

      <PrimaryBtn type="submit" loading={isPending}>
        {isPending ? 'Actualizando…' : 'Actualizar contraseña'}
      </PrimaryBtn>
    </form>
  );
}

/* ══ Profile card (left) ══ */
function ProfileCard({ profile, role }) {
  const rc = ROLES[role] || ROLES.student;
  const [hov, setHov] = useState(false);

  const fmtDate = (d) => {
    if (!d) return '—';
    try { return format(new Date(d), 'dd MMM yyyy'); }
    catch { return '—'; }
  };
  const fmtDateTime = (d) => {
    if (!d) return '—';
    try { return format(new Date(d), "dd MMM yyyy, HH:mm"); }
    catch { return '—'; }
  };

  return (
    <div className="flex flex-col">
      {/* Avatar */}
      <div className="flex justify-center px-6 pt-7 pb-[22px] border-b border-p-border">
        <div
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          className="relative cursor-pointer"
        >
          <div
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center text-[26px] font-extrabold text-white transition-[box-shadow] duration-[150ms]',
              hov
                ? 'shadow-[0_0_0_4px_var(--p-bg-base),0_0_0_6px_var(--p-border)]'
                : 'shadow-[0_0_0_3px_var(--p-bg-base),0_0_0_4px_var(--p-border)]',
            )}
            style={{ background: `linear-gradient(135deg, ${rc.grad})` }}
          >
            {initials(profile?.fullName)}
          </div>
          <div
            className={cn(
              'absolute inset-0 rounded-full bg-[oklch(0%_0_0_/_0.50)] flex flex-col items-center justify-center gap-[3px] pointer-events-none transition-opacity duration-[150ms]',
              hov ? 'opacity-100' : 'opacity-0',
            )}
          >
            <Camera size={18} color="white" />
            <span className="text-[9px] font-bold text-white tracking-[0.02em] uppercase">
              Cambiar
            </span>
          </div>
        </div>
      </div>

      {/* Identity */}
      <div className="px-6 py-[18px] border-b border-p-border text-center">
        <div className="text-[17px] font-extrabold text-p-text-primary tracking-[-0.03em] mb-[5px]">
          {profile?.fullName || '—'}
        </div>
        <div className="text-[12px] text-p-text-tertiary mb-3 font-mono break-all">
          {profile?.email || '—'}
        </div>
        <div className="flex justify-center gap-[7px] flex-wrap">
          <span
            className="px-[10px] py-[3px] rounded-full text-[12px] font-bold"
            style={{ background: rc.bg, color: rc.color }}
          >
            {rc.label}
          </span>
          <span className="px-[10px] py-[3px] rounded-full text-[12px] font-bold bg-p-s-100 text-p-s-700 flex items-center gap-[5px]">
            <span className="w-[6px] h-[6px] rounded-full bg-p-s-500 shrink-0" />
            {profile?.status === 'active' ? 'Activo' : (profile?.status || 'Activo')}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="px-6 py-[18px]">
        <div className="text-[11px] font-bold text-p-text-tertiary uppercase tracking-[0.08em] mb-[14px]">
          Actividad
        </div>
        {[
          { icon: Calendar, label: 'Miembro desde',   value: fmtDate(profile?.createdAt) },
          { icon: Clock,    label: 'Último acceso',    value: fmtDateTime(profile?.lastLoginAt) },
          { icon: Hash,     label: 'Total de accesos', value: String(profile?.loginCount ?? 0) },
        ].map((s) => (
          <div key={s.label} className="flex items-start gap-[10px] mb-[14px]">
            <div className="w-[30px] h-[30px] rounded-[10px] bg-p-bg-subtle flex items-center justify-center text-p-text-secondary shrink-0">
              <s.icon size={13} />
            </div>
            <div>
              <div className="text-[11.5px] text-p-text-tertiary mb-[2px]">{s.label}</div>
              <div className="text-[13.5px] font-medium text-p-text-primary">{s.value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ══ Skeleton ══ */
function SkeletonProfile() {
  return (
    <div className="p-6">
      <div className="w-20 h-20 rounded-full bg-p-bg-subtle mx-auto mb-[18px]" />
      <div className="h-[18px] bg-p-bg-subtle rounded-[6px] mb-2 w-3/5 mx-auto" />
      <div className="h-[14px] bg-p-bg-subtle rounded-[6px] mb-[18px] w-4/5 mx-auto" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex gap-[10px] mb-[14px]">
          <div className="w-[30px] h-[30px] rounded-[10px] bg-p-bg-subtle" />
          <div className="flex-1">
            <div className="h-[11px] bg-p-bg-subtle rounded-[4px] w-2/5 mb-[5px]" />
            <div className="h-[14px] bg-p-bg-subtle rounded-[4px] w-[70%]" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══ Page ══ */
export default function ProfilePage() {
  const [tab, setTab] = useState('info');

  const { data: profile, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  useEffect(() => {
    if (error) showApiError(error);
  }, [error]);

  const role = profile?.role || 'student';

  const handleSaveInfo = async (data) => {
    try { await updateProfile.mutateAsync(data); }
    catch { /* handled */ }
  };

  const handleSavePassword = async (data, onDone) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      onDone?.();
    } catch { /* handled */ }
  };

  const TABS = [
    { id: 'info',      label: 'Información', Icon: User },
    { id: 'seguridad', label: 'Seguridad',   Icon: Shield },
  ];

  return (
    <div className="max-w-[920px] mx-auto">
      <div className="mb-6">
        <h1 className="text-[22px] font-extrabold text-p-text-primary tracking-[-0.03em] mb-1">
          Mi Perfil
        </h1>
        <p className="text-[13.5px] text-p-text-secondary m-0">
          Gestiona tu información personal y seguridad
        </p>
      </div>

      <div className="grid gap-5 items-start [grid-template-columns:1fr_2fr] max-md:[grid-template-columns:1fr]">
        {/* Left card */}
        <div className="bg-p-bg-base border border-p-border rounded-[24px] shadow-p-sm overflow-hidden">
          {isLoading ? <SkeletonProfile /> : <ProfileCard profile={profile} role={role} />}
        </div>

        {/* Right card */}
        <div className="bg-p-bg-base border border-p-border rounded-[24px] shadow-p-sm overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-p-border px-6">
            {TABS.map((t) => {
              const active = tab === t.id;
              const TIcon = t.Icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    'px-4 py-[14px] border-none bg-transparent text-[13.5px] font-[inherit] cursor-pointer flex items-center gap-[7px] -mb-px transition-all duration-[120ms]',
                    active
                      ? 'border-b-2 border-b-p-accent font-semibold text-p-text-primary'
                      : 'border-b-2 border-b-transparent font-medium text-p-text-secondary',
                  )}
                >
                  <TIcon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div className="px-7 pt-6 pb-7">
            {isLoading ? (
              <div className="p-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="mb-[18px]">
                    <div className="h-3 bg-p-bg-subtle rounded-[4px] w-[30%] mb-2" />
                    <div className="h-9 bg-p-bg-subtle rounded-[10px]" />
                  </div>
                ))}
              </div>
            ) : tab === 'info' ? (
              <TabInfo
                profile={profile}
                isPending={updateProfile.isPending}
                onSubmit={handleSaveInfo}
              />
            ) : (
              <TabSeguridad
                isPending={changePassword.isPending}
                onSubmit={handleSavePassword}
              />
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
