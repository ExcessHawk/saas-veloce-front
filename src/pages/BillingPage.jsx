import { useState } from 'react';
import { CreditCard, ExternalLink, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useSubscription, useCheckout, usePortal } from '@/hooks/useBilling';
import { useAdminPlans } from '@/hooks/useAdminPlans';
import { showApiError } from '@/lib/errors';

const STATUS_STYLE = {
  active:    { color: '#16a34a', bg: '#f0fdf4', label: 'Activa' },
  trialing:  { color: '#2563eb', bg: '#eff6ff', label: 'Prueba' },
  past_due:  { color: '#d97706', bg: '#fffbeb', label: 'Pago vencido' },
  canceled:  { color: '#dc2626', bg: '#fef2f2', label: 'Cancelada' },
  unpaid:    { color: '#dc2626', bg: '#fef2f2', label: 'Sin pagar' },
  paused:    { color: '#6b7280', bg: '#f9fafb', label: 'Pausada' },
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
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--p-text-primary)', margin: 0 }}>Facturación</h1>
        <p style={{ fontSize: 13.5, color: 'var(--p-text-secondary)', marginTop: 4 }}>
          Gestiona tu suscripción y métodos de pago.
        </p>
      </div>

      {/* Current subscription */}
      <div style={{ background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 14, padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <CheckCircle2 size={16} color="var(--p-text-secondary)" />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--p-text-primary)' }}>Suscripción actual</span>
        </div>

        {loadingSub ? (
          <div style={{ height: 60, background: 'var(--p-bg-subtle)', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
        ) : sub ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--p-text-tertiary)', marginBottom: 3 }}>Plan</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--p-text-primary)' }}>{sub.planName ?? '—'}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--p-text-tertiary)', marginBottom: 3 }}>Estado</div>
              <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 99, color: statusStyle.color, background: statusStyle.bg }}>
                {statusStyle.label}
              </span>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--p-text-tertiary)', marginBottom: 3 }}>Moneda</div>
              <div style={{ fontSize: 14, color: 'var(--p-text-primary)' }}>{sub.currency}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--p-text-tertiary)', marginBottom: 3 }}>Vence</div>
              <div style={{ fontSize: 14, color: 'var(--p-text-primary)' }}>{fmtDate(sub.currentPeriodEnd)}</div>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 13.5, color: 'var(--p-text-secondary)', margin: 0 }}>Sin suscripción activa.</p>
        )}

        {sub && (
          <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--p-border)' }}>
            <button
              onClick={handlePortal}
              disabled={portal.isPending}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8,
                border: '1px solid var(--p-border)',
                background: 'transparent', color: 'var(--p-text-primary)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <ExternalLink size={13} />
              {portal.isPending ? 'Abriendo…' : 'Gestionar pagos y facturas'}
            </button>
          </div>
        )}
      </div>

      {/* Checkout */}
      <div style={{ background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 14, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <CreditCard size={16} color="var(--p-text-secondary)" />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--p-text-primary)' }}>Cambiar plan</span>
        </div>

        {loadingPlans ? (
          <div style={{ height: 80, background: 'var(--p-bg-subtle)', borderRadius: 8 }} />
        ) : activePlans.length === 0 ? (
          <p style={{ fontSize: 13.5, color: 'var(--p-text-secondary)', margin: 0 }}>
            No hay planes disponibles aún. El administrador debe configurarlos primero.
          </p>
        ) : (
          <>
            <div style={{ display: 'grid', gap: 10, marginBottom: 16 }}>
              {activePlans.map((plan) => (
                <label
                  key={plan.id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 16px', borderRadius: 10,
                    border: `1.5px solid ${selectedPlan === plan.code ? 'var(--p-accent)' : 'var(--p-border)'}`,
                    background: selectedPlan === plan.code ? 'var(--p-bg-subtle)' : 'transparent',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="plan"
                    value={plan.code}
                    checked={selectedPlan === plan.code}
                    onChange={() => setSelectedPlan(plan.code)}
                    style={{ accentColor: 'var(--p-accent)' }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--p-text-primary)' }}>{plan.name}</div>
                    {plan.description && (
                      <div style={{ fontSize: 12, color: 'var(--p-text-secondary)', marginTop: 2 }}>{plan.description}</div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--p-text-primary)' }}>
                      {currency === 'MXN' ? fmtPrice(plan.priceMonthlyMxn, 'MXN') : fmtPrice(plan.priceMonthlyUsd, 'USD')}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--p-text-tertiary)' }}>/ mes</div>
                  </div>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                style={{
                  padding: '7px 10px', borderRadius: 8, border: '1px solid var(--p-border)',
                  background: 'var(--p-bg-base)', color: 'var(--p-text-primary)',
                  fontSize: 13, fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                <option value="MXN">MXN</option>
                <option value="USD">USD</option>
              </select>

              <button
                onClick={handleCheckout}
                disabled={checkout.isPending || !selectedPlan}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', borderRadius: 8,
                  background: 'var(--p-accent)', color: 'white',
                  border: 'none', fontSize: 13.5, fontWeight: 600,
                  cursor: checkout.isPending || !selectedPlan ? 'not-allowed' : 'pointer',
                  opacity: !selectedPlan ? 0.5 : 1,
                  fontFamily: 'inherit',
                }}
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
