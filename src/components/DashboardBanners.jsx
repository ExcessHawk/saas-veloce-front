import { Link } from 'react-router';
import { Mail, Clock, AlertTriangle } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useSubscription } from '@/hooks/useBilling';
import api from '@/lib/axios';

function Banner({ icon: Icon, tone, children, action }) {
  const styles = {
    warn: 'bg-amber-50 border-amber-300 text-amber-900 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-100',
    danger: 'bg-red-50 border-red-300 text-red-900 dark:bg-red-950/30 dark:border-red-800 dark:text-red-100',
    info: 'bg-sky-50 border-sky-300 text-sky-900 dark:bg-sky-950/30 dark:border-sky-800 dark:text-sky-100',
  };
  return (
    <div className={`flex items-center justify-between gap-3 border rounded-lg px-4 py-2 mb-4 ${styles[tone]}`}>
      <div className="flex items-center gap-2 text-[13px]">
        <Icon size={16} className="shrink-0" />
        <span>{children}</span>
      </div>
      {action}
    </div>
  );
}

function ResendVerifyButton() {
  const onClick = async () => {
    try {
      await api.post('/api/auth/resend-verification');
    } catch {
      /* swallowed; backend has its own rate-limit + audit */
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[12px] font-medium underline hover:no-underline cursor-pointer bg-transparent border-0 text-current"
    >
      Reenviar correo
    </button>
  );
}

/** Days remaining between two dates, floored. */
function daysUntil(iso) {
  if (!iso) return null;
  const now = Date.now();
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return null;
  return Math.floor((target - now) / 86_400_000);
}

/**
 * Combined banner stack shown across dashboard routes:
 * - "verify your email" when emailVerifiedAt is null
 * - trial countdown when subscription.status === 'trialing'
 * - payment required when status is past_due / canceled / paused
 *
 * Hidden on /dashboard/billing so the user is not nagged while already there.
 */
export function DashboardBanners() {
  const profile = useProfile();
  const subscription = useSubscription();

  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/dashboard/billing')) {
    return null;
  }

  const user = profile.data;
  const sub = subscription.data;
  const banners = [];

  if (user && !user.emailVerifiedAt) {
    banners.push(
      <Banner key="verify-email" icon={Mail} tone="info" action={<ResendVerifyButton />}>
        Verifica tu correo <strong>{user.email}</strong> para asegurar tu cuenta.
      </Banner>,
    );
  }

  if (sub?.status === 'trialing' && sub.trialEndsAt) {
    const left = daysUntil(sub.trialEndsAt);
    if (left !== null && left >= 0) {
      banners.push(
        <Banner
          key="trial-countdown"
          icon={Clock}
          tone={left <= 3 ? 'warn' : 'info'}
          action={
            <Link to="/dashboard/billing" className="text-[12px] font-medium underline hover:no-underline">
              Suscribirme
            </Link>
          }
        >
          {left === 0
            ? 'Tu prueba gratis termina hoy.'
            : `Quedan ${left} día${left === 1 ? '' : 's'} de prueba gratis.`}
        </Banner>,
      );
    }
  }

  if (sub && ['past_due', 'canceled', 'unpaid', 'paused'].includes(sub.status)) {
    banners.push(
      <Banner
        key="payment-required"
        icon={AlertTriangle}
        tone="danger"
        action={
          <Link to="/dashboard/billing" className="text-[12px] font-medium underline hover:no-underline">
            Gestionar
          </Link>
        }
      >
        Tu suscripción está <strong>{sub.status}</strong>. Algunas funciones pueden estar limitadas.
      </Banner>,
    );
  }

  if (banners.length === 0) return null;
  return <div className="space-y-2">{banners}</div>;
}
