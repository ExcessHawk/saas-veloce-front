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
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--p-text-secondary)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint && <div style={{ fontSize: 11.5, color: 'var(--p-text-tertiary)', marginTop: 5 }}>{hint}</div>}
      {error && <div style={{ fontSize: 11.5, color: 'var(--p-d-500)', marginTop: 5 }}>{error}</div>}
    </div>
  );
}

function ProfileInput({ icon: IconCmp, suffix, disabled, error, ...rest }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      {IconCmp && (
        <span style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--p-text-tertiary)', display: 'flex', pointerEvents: 'none',
        }}>
          <IconCmp size={14} />
        </span>
      )}
      <input
        disabled={disabled}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width: '100%', padding: '9px 12px',
          paddingLeft: IconCmp ? 34 : 12,
          paddingRight: suffix ? 40 : 12,
          fontSize: 13.5, fontFamily: 'inherit',
          border: `1.5px solid ${error ? 'var(--p-d-500)' : focus ? 'var(--p-border-strong)' : 'var(--p-border)'}`,
          borderRadius: 10,
          background: disabled ? 'var(--p-bg-subtle)' : 'var(--p-bg-base)',
          color: disabled ? 'var(--p-text-tertiary)' : 'var(--p-text-primary)',
          outline: 'none', transition: 'border-color 0.12s',
        }}
        {...rest}
      />
      {suffix && (
        <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
          {suffix}
        </span>
      )}
    </div>
  );
}

function PrimaryBtn({ children, loading, disabled, type = 'button', onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 7,
        padding: '9px 20px', borderRadius: 10,
        border: '1px solid transparent',
        background: loading || disabled ? 'var(--p-text-secondary)' : hov ? 'var(--p-accent-hover)' : 'var(--p-accent)',
        color: 'var(--p-accent-text)',
        fontSize: 13.5, fontFamily: 'inherit', fontWeight: 600,
        cursor: disabled || loading ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'all 0.12s',
      }}
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
    <form onSubmit={handleSubmit(onSubmit)} style={{ animation: 'fadeUp 0.2s ease' }}>
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
        <PrimaryBtn type="submit" loading={isPending} disabled={!isDirty}>
          {isPending ? 'Guardando…' : 'Guardar cambios'}
        </PrimaryBtn>
        {isDirty && !isPending && (
          <button
            type="button"
            onClick={() => reset({ fullName: profile?.fullName || '', phone: profile?.phone || '' })}
            style={{
              border: 'none', background: 'transparent',
              color: 'var(--p-text-tertiary)', fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
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
      style={{
        border: 'none', background: 'transparent', cursor: 'pointer',
        color: 'var(--p-text-tertiary)', display: 'flex', padding: 0,
      }}
    >
      {show ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  );

  return (
    <form onSubmit={handleSubmit(handle)} style={{ animation: 'fadeUp 0.2s ease' }}>
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
        <div style={{ marginTop: -12 }}>
          <PwStrengthMeter password={newPw} />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
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
          <div style={{
            fontSize: 12, color: 'var(--p-s-700)',
            marginTop: -10, marginBottom: 14,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <Check size={12} /> Las contraseñas coinciden
          </div>
        )}
      </div>

      <div style={{
        padding: '12px 14px', background: 'var(--p-bg-subtle)',
        borderRadius: 10, border: '1px solid var(--p-border)',
        marginBottom: 20, fontSize: 12.5, color: 'var(--p-text-secondary)',
        lineHeight: 1.6,
      }}>
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
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Avatar */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '28px 24px 22px', borderBottom: '1px solid var(--p-border)' }}>
        <div
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{ position: 'relative', cursor: 'pointer' }}
        >
          <div style={{
            width: 80, height: 80, borderRadius: '99px',
            background: `linear-gradient(135deg, ${rc.grad})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 800, color: 'white',
            boxShadow: hov
              ? '0 0 0 4px var(--p-bg-base), 0 0 0 6px var(--p-border)'
              : '0 0 0 3px var(--p-bg-base), 0 0 0 4px var(--p-border)',
            transition: 'box-shadow 0.15s',
          }}>
            {initials(profile?.fullName)}
          </div>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '99px',
            background: 'oklch(0% 0 0 / 0.50)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            opacity: hov ? 1 : 0, transition: 'opacity 0.15s', gap: 3, pointerEvents: 'none',
          }}>
            <Camera size={18} color="white" />
            <span style={{
              fontSize: 9, fontWeight: 700, color: 'white',
              letterSpacing: '0.02em', textTransform: 'uppercase',
            }}>
              Cambiar
            </span>
          </div>
        </div>
      </div>

      {/* Identity */}
      <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--p-border)', textAlign: 'center' }}>
        <div style={{
          fontSize: 17, fontWeight: 800, color: 'var(--p-text-primary)',
          letterSpacing: '-0.03em', marginBottom: 5,
        }}>
          {profile?.fullName || '—'}
        </div>
        <div style={{
          fontSize: 12, color: 'var(--p-text-tertiary)', marginBottom: 12,
          fontFamily: "'Geist Mono', monospace", wordBreak: 'break-all',
        }}>
          {profile?.email || '—'}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 7, flexWrap: 'wrap' }}>
          <span style={{
            padding: '3px 10px', borderRadius: '99px', fontSize: 12, fontWeight: 700,
            background: rc.bg, color: rc.color,
          }}>
            {rc.label}
          </span>
          <span style={{
            padding: '3px 10px', borderRadius: '99px', fontSize: 12, fontWeight: 700,
            background: 'var(--p-s-100)', color: 'var(--p-s-700)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '99px', background: 'var(--p-s-500)', flexShrink: 0 }} />
            {profile?.status === 'active' ? 'Activo' : (profile?.status || 'Activo')}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '18px 24px' }}>
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'var(--p-text-tertiary)',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14,
        }}>
          Actividad
        </div>
        {[
          { icon: Calendar, label: 'Miembro desde',   value: fmtDate(profile?.createdAt) },
          { icon: Clock,    label: 'Último acceso',    value: fmtDateTime(profile?.lastLoginAt) },
          { icon: Hash,     label: 'Total de accesos', value: String(profile?.loginCount ?? 0) },
        ].map((s) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 10, background: 'var(--p-bg-subtle)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--p-text-secondary)', flexShrink: 0,
            }}>
              <s.icon size={13} />
            </div>
            <div>
              <div style={{ fontSize: 11.5, color: 'var(--p-text-tertiary)', marginBottom: 2 }}>{s.label}</div>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--p-text-primary)' }}>{s.value}</div>
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
    <div style={{ padding: 24 }}>
      <div style={{ width: 80, height: 80, borderRadius: '99px', background: 'var(--p-bg-subtle)', margin: '0 auto 18px' }} />
      <div style={{ height: 18, background: 'var(--p-bg-subtle)', borderRadius: 6, marginBottom: 8, width: '60%', marginInline: 'auto' }} />
      <div style={{ height: 14, background: 'var(--p-bg-subtle)', borderRadius: 6, marginBottom: 18, width: '80%', marginInline: 'auto' }} />
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--p-bg-subtle)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: 11, background: 'var(--p-bg-subtle)', borderRadius: 4, width: '40%', marginBottom: 5 }} />
            <div style={{ height: 14, background: 'var(--p-bg-subtle)', borderRadius: 4, width: '70%' }} />
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
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontSize: 22, fontWeight: 800, color: 'var(--p-text-primary)',
          letterSpacing: '-0.03em', marginBottom: 4,
        }}>
          Mi Perfil
        </h1>
        <p style={{ fontSize: 13.5, color: 'var(--p-text-secondary)', margin: 0 }}>
          Gestiona tu información personal y seguridad
        </p>
      </div>

      <div className="profile-grid" style={{
        display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, alignItems: 'start',
      }}>
        {/* Left card */}
        <div style={{
          background: 'var(--p-bg-base)', border: '1px solid var(--p-border)',
          borderRadius: 24, boxShadow: 'var(--p-shadow-sm)', overflow: 'hidden',
        }}>
          {isLoading ? <SkeletonProfile /> : <ProfileCard profile={profile} role={role} />}
        </div>

        {/* Right card */}
        <div style={{
          background: 'var(--p-bg-base)', border: '1px solid var(--p-border)',
          borderRadius: 24, boxShadow: 'var(--p-shadow-sm)', overflow: 'hidden',
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--p-border)', padding: '0 24px' }}>
            {TABS.map((t) => {
              const active = tab === t.id;
              const TIcon = t.Icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  style={{
                    padding: '14px 16px', border: 'none',
                    borderBottom: active ? '2px solid var(--p-accent)' : '2px solid transparent',
                    background: 'transparent',
                    fontSize: 13.5, fontFamily: 'inherit',
                    fontWeight: active ? 600 : 500, cursor: 'pointer',
                    color: active ? 'var(--p-text-primary)' : 'var(--p-text-secondary)',
                    display: 'flex', alignItems: 'center', gap: 7,
                    marginBottom: -1, transition: 'all 0.12s',
                  }}
                >
                  <TIcon size={14} />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div style={{ padding: '24px 28px 28px' }}>
            {isLoading ? (
              <div style={{ padding: 12 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} style={{ marginBottom: 18 }}>
                    <div style={{ height: 12, background: 'var(--p-bg-subtle)', borderRadius: 4, width: '30%', marginBottom: 8 }} />
                    <div style={{ height: 36, background: 'var(--p-bg-subtle)', borderRadius: 10 }} />
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

      <style>{`
        @media (max-width: 768px) {
          .profile-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
