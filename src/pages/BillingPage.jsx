import { useState } from 'react';
import { CreditCard, ExternalLink, CheckCircle2, Check, Users, GraduationCap, BookOpen } from 'lucide-react';
import { useSubscription, useCheckout, usePortal } from '@/hooks/useBilling';
import { useAdminPlans } from '@/hooks/useAdminPlans';
import { showApiError } from '@/lib/errors';
import { cn } from '@/lib/utils';

const STATUS_STYLE = {
  active:    { cls: 'bg-p-s-100 text-p-s-700', label: 'Activa' },
  trialing:  { cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'Prueba' },
  past_due:  { cls: 'bg-p-w-100 text-p-w-700', label: 'Pago vencido' },
  canceled:  { cls: 'bg-p-d-100 text-p-d-700', label: 'Cancelada' },
  unpaid:    { cls: 'bg-p-d-100 text-p-d-700', label: 'Sin pagar' },
  paused:    { cls: 'bg-p-bg-muted text-p-text-secondary', label: 'Pausada' },
};

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
}

const fmtMXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });
const fmtUSD = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'USD' });

function fmtPrice(cents, currency) {
  if (!cents) return 'Gratis';
  const fmt = currency === 'USD' ? fmtUSD : fmtMXN;
  return fmt.format(cents / 100);
}

/** Human-readable limits/features for a plan card. */
function planFeatures(plan) {
  return [
    { icon: Users,         label: plan.maxStudents ? `Hasta ${plan.maxStudents} alumnos` : 'Alumnos ilimitados' },
    { icon: GraduationCap, label: plan.maxTeachers ? `Hasta ${plan.maxTeachers} docentes` : 'Docentes ilimitados' },
    { icon: BookOpen,      label: plan.maxCourses  ? `Hasta ${plan.maxCourses} cursos`   : 'Cursos ilimitados' },
  ];
}

export default function BillingPage() {
  const { data: sub, isLoading: loadingSub } = useSubscription();
  const { data: plans, isLoading: loadingPlans } = useAdminPlans();
  const checkout = useCheckout();
  const portal = usePortal();

  const [currency, setCurrency] = useState('MXN');
  const [pendingCode, setPendingCode] = useState(null);

  const activePlans = (plans ?? [])
    .filter((p) => p.isActive && (p.stripePriceIdMxn || p.stripePriceIdUsd))
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));

  const goCheckout = async (planCode) => {
    setPendingCode(planCode);
    try {
      const { url } = await checkout.mutateAsync({ planCode, currency });
      window.location.href = url;
    } catch (err) {
      showApiError(err);
      setPendingCode(null);
    }
  };

  const handlePortal = async () => {
    try {
      const { url } = await portal.mutateAsync();
      window.open(url, '_blank');
    } catch (err) {
      showApiError(err);
    }
  };

  const statusStyle = STATUS_STYLE[sub?.status] ?? STATUS_STYLE.active;

  return (
    <div className="max-w-[920px] mx-auto">
      <div className="mb-7">
        <h1 className="text-[22px] font-semibold text-p-text-primary m-0">Facturación</h1>
        <p className="text-[13.5px] text-p-text-secondary mt-1">
          Gestiona tu suscripción y método de pago.
        </p>
      </div>

      {/* Current subscription */}
      <div className="bg-p-bg-base border border-p-border rounded-[14px] p-6 mb-6">
        <div className="flex items-center gap-[10px] mb-[18px]">
          <CheckCircle2 size={16} className="text-p-text-secondary" />
          <span className="text-[14px] font-semibold text-p-text-primary">Suscripción actual</span>
        </div>

        {loadingSub ? (
          <div className="h-[60px] bg-p-bg-subtle rounded-lg animate-pulse" />
        ) : sub ? (
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]">
            <div>
              <div className="text-[11px] text-p-text-tertiary mb-[3px]">Plan</div>
              <div className="text-[15px] font-semibold text-p-text-primary">{sub.planName ?? '—'}</div>
            </div>
            <div>
              <div className="text-[11px] text-p-text-tertiary mb-[3px]">Estado</div>
              <span className={cn('text-[12px] font-semibold px-2 py-[3px] rounded-full', statusStyle.cls)}>
                {statusStyle.label}
              </span>
            </div>
            <div>
              <div className="text-[11px] text-p-text-tertiary mb-[3px]">Moneda</div>
              <div className="text-[14px] text-p-text-primary">{sub.currency}</div>
            </div>
            <div>
              <div className="text-[11px] text-p-text-tertiary mb-[3px]">Vence</div>
              <div className="text-[14px] text-p-text-primary">{fmtDate(sub.currentPeriodEnd)}</div>
            </div>
          </div>
        ) : (
          <p className="text-[13.5px] text-p-text-secondary m-0">Sin suscripción activa.</p>
        )}

        {sub && (
          <div className="mt-[18px] pt-4 border-t border-p-border">
            <button
              onClick={handlePortal}
              disabled={portal.isPending}
              className="inline-flex items-center gap-[6px] px-[14px] py-[7px] rounded-lg border border-p-border bg-p-bg-base text-p-text-primary text-[13px] font-medium font-sans cursor-pointer hover:bg-p-bg-subtle transition-colors disabled:opacity-50"
            >
              <ExternalLink size={13} />
              {portal.isPending ? 'Abriendo…' : 'Gestionar pagos y facturas'}
            </button>
            <p className="text-[12px] text-p-text-tertiary mt-2 m-0">
              Facturas, método de pago y cancelación se gestionan de forma segura en el portal de Stripe.
            </p>
          </div>
        )}
      </div>

      {/* Plans */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-[10px]">
          <CreditCard size={16} className="text-p-text-secondary" />
          <span className="text-[14px] font-semibold text-p-text-primary">Planes disponibles</span>
        </div>
        {/* Currency toggle (segmented) */}
        <div className="inline-flex rounded-lg border border-p-border bg-p-bg-base p-[2px]">
          {['MXN', 'USD'].map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={cn(
                'px-3 py-[5px] rounded-md text-[12.5px] font-semibold font-sans cursor-pointer transition-colors',
                currency === c ? 'bg-p-accent text-p-accent-text' : 'bg-transparent text-p-text-secondary hover:text-p-text-primary',
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {loadingPlans ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-[280px] bg-p-bg-subtle rounded-[14px] animate-pulse" />)}
        </div>
      ) : activePlans.length === 0 ? (
        <div className="bg-p-bg-base border border-p-border rounded-[14px] p-6">
          <p className="text-[13.5px] text-p-text-secondary m-0">
            No hay planes disponibles aún. El administrador debe configurarlos primero.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {activePlans.map((plan) => {
            const isCurrent = !!sub?.planName && sub.planName === plan.name;
            const cents = currency === 'MXN' ? plan.priceMonthlyMxn : plan.priceMonthlyUsd;
            const busy = pendingCode === plan.code;
            return (
              <div
                key={plan.id}
                className={cn(
                  'relative flex flex-col rounded-[14px] border bg-p-bg-base p-5 transition-shadow',
                  isCurrent ? 'border-p-accent ring-1 ring-p-accent shadow-p-md' : 'border-p-border shadow-p-sm hover:shadow-p-md',
                )}
              >
                {isCurrent && (
                  <span className="absolute -top-[10px] left-5 px-2 py-[2px] rounded-full text-[11px] font-bold bg-p-accent text-p-accent-text">
                    Plan actual
                  </span>
                )}
                <div className="mb-1 text-[16px] font-bold text-p-text-primary tracking-[-0.02em]">{plan.name}</div>
                {plan.description && (
                  <div className="text-[12.5px] text-p-text-secondary leading-[1.5] mb-3 min-h-[34px]">{plan.description}</div>
                )}
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-[26px] font-extrabold text-p-text-primary tracking-[-0.04em] leading-none">
                    {fmtPrice(cents, currency)}
                  </span>
                  {cents ? <span className="text-[12.5px] text-p-text-tertiary">/ mes</span> : null}
                </div>
                <ul className="flex flex-col gap-[9px] mb-5 flex-1">
                  {planFeatures(plan).map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-[13px] text-p-text-secondary">
                      <span className="size-[18px] rounded-full bg-p-s-100 text-p-s-700 flex items-center justify-center shrink-0">
                        <Check size={11} strokeWidth={3} />
                      </span>
                      {f.label}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => goCheckout(plan.code)}
                  disabled={isCurrent || !!pendingCode}
                  className={cn(
                    'w-full inline-flex items-center justify-center gap-[6px] px-[18px] py-2 rounded-lg text-[13.5px] font-semibold font-sans transition-colors border',
                    isCurrent
                      ? 'border-p-border bg-p-bg-subtle text-p-text-tertiary cursor-not-allowed'
                      : pendingCode
                        ? 'border-transparent bg-p-accent text-p-accent-text opacity-50 cursor-not-allowed'
                        : 'border-transparent bg-p-accent text-p-accent-text cursor-pointer hover:bg-p-accent-hover',
                  )}
                >
                  {isCurrent ? 'Plan actual' : busy ? 'Redirigiendo…' : 'Elegir plan'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
