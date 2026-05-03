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
import { cn } from '@/lib/utils';

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
    <div className="flex items-center gap-3 mb-7">
      {steps.map((s, i) => {
        const done = step > s.n;
        const active = step === s.n;
        return (
          <div key={s.n} className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-[10px]">
              <div className={cn(
                'w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] font-bold transition-all duration-150',
                done || active
                  ? 'bg-p-accent text-p-accent-text'
                  : 'bg-p-bg-subtle text-p-text-tertiary',
              )}>
                {done ? <Check size={13} /> : s.n}
              </div>
              <span className={cn(
                'text-[13px]',
                active || done ? 'text-p-text-primary font-semibold' : 'text-p-text-tertiary font-medium',
              )}>
                {s.label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                'flex-1 h-px',
                done ? 'bg-p-accent' : 'bg-p-border',
              )} />
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
      className={cn(
        'relative text-left rounded-2xl p-[20px_18px] cursor-pointer transition-all duration-150 flex flex-col gap-3 font-[inherit]',
        selected
          ? 'bg-p-bg-base border-[1.5px] border-p-accent shadow-[0_4px_12px_oklch(0%_0_0_/_0.08)]'
          : 'bg-p-bg-subtle border-[1.5px] border-p-border shadow-[0_1px_3px_oklch(0%_0_0_/_0.04)]',
      )}
    >
      {plan.popular && (
        <div className="absolute -top-[10px] left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-[10px] py-[3px] rounded-full bg-p-accent text-p-accent-text text-[10.5px] font-bold whitespace-nowrap">
          <Sparkles size={10} /> Más popular
        </div>
      )}

      <div>
        <div className="text-[11px] font-bold text-p-text-tertiary uppercase tracking-[0.08em] mb-2">
          {plan.name}
        </div>
        <div className="text-[28px] font-extrabold text-p-text-primary tracking-[-0.03em] leading-none">
          {plan.price}
          {plan.priceSuffix && (
            <span className="text-[13px] font-medium text-p-text-tertiary ml-1">
              {plan.priceSuffix}
            </span>
          )}
        </div>
        <div className="text-[12px] text-p-text-tertiary mt-[6px]">{plan.meta}</div>
      </div>

      <div className="flex flex-col gap-[7px]">
        {plan.features.map((f) => (
          <div key={f} className="flex items-start gap-2 text-[12.5px] text-p-text-secondary">
            <span className={cn(
              'w-[14px] h-[14px] rounded-full flex items-center justify-center flex-shrink-0 mt-px',
              selected
                ? 'bg-p-accent text-p-accent-text'
                : 'bg-p-bg-muted text-p-text-secondary',
            )}>
              <Check size={9} strokeWidth={3} />
            </span>
            {f}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-3 border-t border-p-border flex items-center justify-between">
        <span className="text-[12px] text-p-text-tertiary font-medium">
          {selected ? 'Seleccionado' : 'Seleccionar'}
        </span>
        <div className={cn(
          'w-4 h-4 rounded-full flex items-center justify-center',
          selected
            ? 'border-[1.5px] border-p-accent bg-p-accent'
            : 'border-[1.5px] border-p-border-strong bg-transparent',
        )}>
          {selected && <div className="w-[6px] h-[6px] rounded-full bg-p-accent-text" />}
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

      <form onSubmit={handleSubmit(onSubmit)} className="tab-content [animation:fadeUp_0.22s_ease]">
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

            <div className="mb-[14px]">
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
                    className="border-none bg-transparent cursor-pointer text-p-text-tertiary flex p-0"
                  >
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                }
                {...register('adminPassword')}
              />
              <div className="-mt-2">
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
                  className="border-none bg-transparent cursor-pointer text-p-text-tertiary flex p-0"
                >
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
              {...register('confirmPassword')}
            />

            <div className="mt-2">
              <AuthButton type="button" onClick={goNext} icon={ArrowRight}>
                Continuar
              </AuthButton>
            </div>

            <p className="text-center text-[13px] text-p-text-tertiary mt-[22px] mb-0">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-p-text-primary font-semibold underline">
                Inicia sesión
              </Link>
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <div className="grid grid-cols-3 gap-[14px] mt-2 mb-6">
              {PLANS.map((p) => (
                <PlanCard
                  key={p.code}
                  plan={p}
                  selected={selectedPlan === p.code}
                  onSelect={setSelectedPlan}
                />
              ))}
            </div>

            <div className="flex gap-[10px]">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="shrink-0 px-[18px] py-[11px] rounded-[10px] border border-p-border bg-p-bg-base text-p-text-secondary text-sm font-[inherit] font-medium cursor-pointer flex items-center gap-[6px] hover:bg-p-bg-subtle transition-colors duration-150"
              >
                <ArrowLeft size={14} /> Atrás
              </button>
              <div className="flex-1">
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
