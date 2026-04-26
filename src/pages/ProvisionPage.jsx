import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router';
import {
  School, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Check, Sparkles,
} from 'lucide-react';

import { provisionSchema } from '@/schemas/auth';
import { useAuthStore } from '@/stores/authStore';
import { useProvision } from '@/hooks/useAuth';
import { showApiError } from '@/lib/errors';
import AuthLayout from '@/layouts/AuthLayout';
import {
  AuthHeader, AuthInput, AuthButton, PwStrengthMeter,
} from '@/components/AuthFormParts';

const PLANS = [
  {
    code: 'starter',
    name: 'Starter',
    price: '$0',
    priceSuffix: '/mes',
    meta: 'Hasta 50 alumnos',
    features: [
      'Aulas, materias y cursos',
      '1 director, 5 docentes',
      'Tareas básicas',
      'Soporte por email',
    ],
  },
  {
    code: 'pro',
    name: 'Pro',
    price: '$29',
    priceSuffix: '/mes',
    meta: 'Hasta 600 alumnos',
    popular: true,
    features: [
      'Todo lo de Starter',
      'Docentes ilimitados',
      'Portal para padres',
      'Calificaciones avanzadas',
      'Soporte prioritario',
    ],
  },
  {
    code: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    priceSuffix: '',
    meta: 'Alumnos ilimitados',
    features: [
      'Todo lo de Pro',
      'Multi-sede',
      'API de integraciones',
      'SSO y SAML',
      'Account manager',
    ],
  },
];

/* ── Stepper visual ── */
function Stepper({ step }) {
  const steps = [
    { n: 1, label: 'Datos básicos' },
    { n: 2, label: 'Elige tu plan' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
      {steps.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 26, height: 26, borderRadius: '99px',
                background: done || active ? 'oklch(8.5% 0.005 80)' : 'oklch(94.5% 0.006 80)',
                color: done || active ? 'white' : 'oklch(55% 0.010 80)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
              }}>
                {done ? <Check size={13} /> : s.n}
              </div>
              <span style={{
                fontSize: 13,
                color: active || done ? 'oklch(8.5% 0.005 80)' : 'oklch(55% 0.010 80)',
                fontWeight: active ? 600 : 500,
              }}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 1, background: done ? 'oklch(8.5% 0.005 80)' : 'oklch(89% 0.007 80)' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ── Card de plan ── */
function PlanCard({ plan, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(plan.code)}
      style={{
        position: 'relative', textAlign: 'left',
        background: selected ? 'oklch(99.2% 0.003 80)' : 'white',
        border: `1.5px solid ${selected ? 'oklch(8.5% 0.005 80)' : 'oklch(89% 0.007 80)'}`,
        borderRadius: 16, padding: '20px 18px',
        cursor: 'pointer', transition: 'all 0.15s',
        boxShadow: selected ? '0 4px 12px oklch(0% 0 0 / 0.08)' : '0 1px 3px oklch(0% 0 0 / 0.04)',
        display: 'flex', flexDirection: 'column', gap: 12,
        fontFamily: 'inherit',
      }}
    >
      {plan.popular && (
        <div style={{
          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: '3px 10px', borderRadius: '99px',
          background: 'oklch(8.5% 0.005 80)', color: 'white',
          fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap',
        }}>
          <Sparkles size={10} /> Más popular
        </div>
      )}

      <div>
        <div style={{
          fontSize: 11, fontWeight: 700, color: 'oklch(55% 0.010 80)',
          textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8,
        }}>
          {plan.name}
        </div>
        <div style={{
          fontSize: 28, fontWeight: 800,
          color: 'oklch(8.5% 0.005 80)', letterSpacing: '-0.03em', lineHeight: 1,
        }}>
          {plan.price}
          {plan.priceSuffix && (
            <span style={{ fontSize: 13, fontWeight: 500, color: 'oklch(55% 0.010 80)', marginLeft: 4 }}>
              {plan.priceSuffix}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'oklch(55% 0.010 80)', marginTop: 6 }}>{plan.meta}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {plan.features.map((f) => (
          <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12.5, color: 'oklch(30% 0.009 80)' }}>
            <span style={{
              width: 14, height: 14, borderRadius: '99px',
              background: selected ? 'oklch(8.5% 0.005 80)' : 'oklch(94.5% 0.006 80)',
              color: selected ? 'white' : 'oklch(42% 0.010 80)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1,
            }}>
              <Check size={9} strokeWidth={3} />
            </span>
            {f}
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 'auto',
        paddingTop: 12, borderTop: '1px solid oklch(89% 0.007 80)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 12, color: 'oklch(55% 0.010 80)', fontWeight: 500 }}>
          {selected ? 'Seleccionado' : 'Seleccionar'}
        </span>
        <div style={{
          width: 16, height: 16, borderRadius: '99px',
          border: `1.5px solid ${selected ? 'oklch(8.5% 0.005 80)' : 'oklch(80% 0.009 80)'}`,
          background: selected ? 'oklch(8.5% 0.005 80)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {selected && <div style={{ width: 6, height: 6, borderRadius: '99px', background: 'white' }} />}
        </div>
      </div>
    </button>
  );
}

export default function ProvisionPage() {
  const navigate = useNavigate();
  const { setAuth, setSchoolId } = useAuthStore();
  const provision = useProvision();

  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('pro');

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(provisionSchema),
    defaultValues: {
      schoolName: '',
      adminEmail: '',
      adminPassword: '',
      confirmPassword: '',
      planCode: 'pro',
    },
  });

  const password = watch('adminPassword');

  const goNext = async () => {
    const ok = await trigger(['schoolName', 'adminEmail', 'adminPassword', 'confirmPassword']);
    if (ok) setStep(2);
  };

  const onSubmit = async (data) => {
    try {
      const { confirmPassword: _confirm, ...apiData } = data;
      apiData.planCode = selectedPlan;

      const result = await provision.mutateAsync(apiData);

      setAuth({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.admin,
      });
      setSchoolId(result.school.id);
      navigate('/dashboard');
    } catch (error) {
      showApiError(error);
    }
  };

  return (
    <AuthLayout maxWidth={step === 2 ? 720 : 460}>
      <AuthHeader
        title={step === 1 ? 'Registra tu escuela' : 'Elige tu plan'}
        subtitle={step === 1 ? 'Crea tu cuenta de director y tu institución' : 'Empieza con el plan que mejor se adapte. Puedes cambiarlo después.'}
      />

      <Stepper step={step} />

      <form onSubmit={handleSubmit(onSubmit)} className="tab-content" style={{ animation: 'fadeUp 0.22s ease' }}>
        {step === 1 && (
          <>
            <AuthInput
              label="Nombre de la escuela"
              placeholder="Instituto San José"
              icon={School}
              error={errors.schoolName?.message}
              {...register('schoolName')}
            />

            <AuthInput
              label="Email del director"
              type="email"
              placeholder="director@escuela.mx"
              icon={Mail}
              autoComplete="email"
              error={errors.adminEmail?.message}
              {...register('adminEmail')}
            />

            <div style={{ marginBottom: 14 }}>
              <AuthInput
                label="Contraseña"
                type={showPw ? 'text' : 'password'}
                placeholder="Mínimo 8 caracteres"
                icon={Lock}
                autoComplete="new-password"
                error={errors.adminPassword?.message}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    style={{
                      border: 'none', background: 'transparent', cursor: 'pointer',
                      color: 'oklch(68% 0.010 80)', display: 'flex', padding: 0,
                    }}
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
                {...register('adminPassword')}
              />
              <div style={{ marginTop: -8 }}>
                <PwStrengthMeter password={password} />
              </div>
            </div>

            <AuthInput
              label="Confirmar contraseña"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repite tu contraseña"
              icon={Lock}
              autoComplete="new-password"
              error={errors.confirmPassword?.message}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    color: 'oklch(68% 0.010 80)', display: 'flex', padding: 0,
                  }}
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
              {...register('confirmPassword')}
            />

            <div style={{ marginTop: 8 }}>
              <AuthButton type="button" onClick={goNext} icon={ArrowRight}>
                Continuar
              </AuthButton>
            </div>

            <p style={{ textAlign: 'center', fontSize: 13, color: 'oklch(55% 0.010 80)', marginTop: 22, marginBottom: 0 }}>
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" style={{ color: 'oklch(8.5% 0.005 80)', fontWeight: 600, textDecoration: 'underline' }}>
                Inicia sesión
              </Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14,
              marginTop: 8, marginBottom: 24,
            }}>
              {PLANS.map((p) => (
                <PlanCard
                  key={p.code}
                  plan={p}
                  selected={selectedPlan === p.code}
                  onSelect={setSelectedPlan}
                />
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  flex: '0 0 auto', padding: '11px 18px', borderRadius: 10,
                  border: '1px solid oklch(89% 0.007 80)',
                  background: 'white', color: 'oklch(30% 0.009 80)',
                  fontSize: 14, fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <ArrowLeft size={14} /> Atrás
              </button>
              <div style={{ flex: 1 }}>
                <AuthButton
                  type="submit"
                  loading={provision.isPending}
                  icon={!provision.isPending ? ArrowRight : undefined}
                >
                  {provision.isPending ? 'Creando escuela…' : 'Crear mi escuela'}
                </AuthButton>
              </div>
            </div>
          </>
        )}
      </form>
    </AuthLayout>
  );
}
