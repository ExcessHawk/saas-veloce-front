import { Link } from 'react-router';
import { XCircle, RefreshCw, LayoutDashboard, LifeBuoy } from 'lucide-react';

export default function BillingCancelPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-p-bg-app" role="status" aria-live="polite">
      <div className="w-full max-w-[440px] bg-p-bg-base border border-p-border rounded-2xl shadow-p-md p-8 text-center">
        <div className="size-[60px] mx-auto mb-5 rounded-full bg-p-d-100 text-p-d-700 flex items-center justify-center">
          <XCircle size={30} />
        </div>
        <h1 className="text-[20px] font-semibold text-p-text-primary m-0">Pago cancelado</h1>
        <p className="text-[13.5px] text-p-text-secondary mt-2 mb-0 leading-[1.55]">
          No se realizó ningún cargo. Tu suscripción sigue igual — puedes intentarlo de nuevo cuando quieras.
        </p>

        <div className="flex items-center justify-center gap-2 mt-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-[6px] px-[14px] py-2 rounded-lg border border-p-border bg-p-bg-base text-p-text-primary text-[13px] font-medium no-underline hover:bg-p-bg-subtle transition-colors"
          >
            <LayoutDashboard size={14} /> Ir al panel
          </Link>
          <Link
            to="/dashboard/billing"
            className="inline-flex items-center gap-[6px] px-[16px] py-2 rounded-lg bg-p-accent text-p-accent-text text-[13px] font-semibold no-underline hover:bg-p-accent-hover transition-colors"
          >
            <RefreshCw size={14} /> Reintentar
          </Link>
        </div>

        <a
          href="mailto:soporte@pensum.mx"
          className="inline-flex items-center gap-[6px] text-[12px] text-p-text-tertiary mt-5 no-underline hover:text-p-text-secondary transition-colors"
        >
          <LifeBuoy size={13} /> ¿Problemas con el pago? Contacta a soporte
        </a>
      </div>
    </div>
  );
}
