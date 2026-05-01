import { useState } from 'react';
import { CreditCard, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
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

function fmtPrice(cents, currency) {
  if (!cents) return 'Gratis';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(cents / 100);
}

export default function BillingPage() {
  const { data: sub, isLoading: loadingSub } = useSubscription();
  const { data: plans, isLoading: loadingPlans } = useAdminPlans();
  const checkout = useCheckout();
  const portal = usePortal();

  const [selectedPlan, setSelectedPlan] = useState('');
  const [currency, setCurrency] = useState('MXN');

  const activePlans = plans?.filter((p) => p.isActive && (p.stripePriceIdMxn || p.stripePriceIdUsd)) ?? [];

  const handleCheckout = async () => {
    if (!selectedPlan) { toast.error('Selecciona un plan'); return; }
    try {
      const { url } = await checkout.mutateAsync({ planCode: selectedPlan, currency });
      window.location.href = url;
    } catch (err) {
      showApiError(err);
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
    <div className="max-w-[720px] mx-auto">
      <div className="mb-7">
        <h1 className="text-[22px] font-bold text-p-text-primary m-0">Facturación</h1>
        <p className="text-[13.5px] text-p-text-secondary mt-1">
          Gestiona tu suscripción y métodos de pago.
        </p>
      </div>

      {/* Current subscription */}
      <div className="bg-p-bg-base border border-p-border rounded-[14px] p-6 mb-5">
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
              <span
                className={cn("text-[12px] font-semibold px-2 py-[3px] rounded-full", statusStyle.cls)}
              >
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
              className="inline-flex items-center gap-[6px] px-[14px] py-[7px] rounded-lg border border-p-border bg-p-bg-base text-p-text-primary text-[13px] font-medium font-sans cursor-pointer hover:bg-p-bg-subtle transition-colors"
            >
              <ExternalLink size={13} />
              {portal.isPending ? 'Abriendo…' : 'Gestionar pagos y facturas'}
            </button>
          </div>
        )}
      </div>

      {/* Checkout */}
      <div className="bg-p-bg-base border border-p-border rounded-[14px] p-6">
        <div className="flex items-center gap-[10px] mb-[18px]">
          <CreditCard size={16} className="text-p-text-secondary" />
          <span className="text-[14px] font-semibold text-p-text-primary">Cambiar plan</span>
        </div>

        {loadingPlans ? (
          <div className="h-20 bg-p-bg-subtle rounded-lg" />
        ) : activePlans.length === 0 ? (
          <p className="text-[13.5px] text-p-text-secondary m-0">
            No hay planes disponibles aún. El administrador debe configurarlos primero.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-[10px] mb-4">
              {activePlans.map((plan) => (
                <label
                  key={plan.id}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-[10px] cursor-pointer border-[1.5px] transition-colors',
                    selectedPlan === plan.code
                      ? 'border-p-accent bg-p-bg-subtle'
                      : 'border-p-border bg-p-bg-base hover:bg-p-bg-subtle',
                  )}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan.code}
                    checked={selectedPlan === plan.code}
                    onChange={() => setSelectedPlan(plan.code)}
                    className="accent-p-accent"
                  />
                  <div className="flex-1">
                    <div className="text-[14px] font-semibold text-p-text-primary">{plan.name}</div>
                    {plan.description && (
                      <div className="text-[12px] text-p-text-secondary mt-[2px]">{plan.description}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-[14px] font-bold text-p-text-primary">
                      {currency === 'MXN' ? fmtPrice(plan.priceMonthlyMxn, 'MXN') : fmtPrice(plan.priceMonthlyUsd, 'USD')}
                    </div>
                    <div className="text-[11px] text-p-text-tertiary">/ mes</div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center gap-[10px]">
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="px-[10px] py-[7px] rounded-lg border border-p-border bg-p-bg-base text-p-text-primary text-[13px] font-sans cursor-pointer"
              >
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
              </select>

              <button
                onClick={handleCheckout}
                disabled={checkout.isPending || !selectedPlan}
                className={cn(
                  'inline-flex items-center gap-[6px] px-[18px] py-2 rounded-lg bg-p-accent text-p-accent-text border-none text-[13.5px] font-semibold font-sans transition-opacity hover:bg-p-accent-hover',
                  checkout.isPending || !selectedPlan ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
                )}
              >
                <CreditCard size={14} />
                {checkout.isPending ? 'Redirigiendo…' : 'Ir a pagar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
