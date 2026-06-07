import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { CheckCircle2, ArrowRight, LayoutDashboard } from 'lucide-react';

const REDIRECT_SECONDS = 6;

export default function BillingSuccessPage() {
  const navigate = useNavigate();
  const [secs, setSecs] = useState(REDIRECT_SECONDS);

  const sessionId = new URLSearchParams(window.location.search).get('session_id');
  const ref = sessionId ? sessionId.slice(-8).toUpperCase() : null;

  useEffect(() => {
    const id = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (secs <= 0) navigate('/dashboard/billing');
  }, [secs, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-p-bg-app" role="status" aria-live="polite">
      <div className="w-full max-w-[440px] bg-p-bg-base border border-p-border rounded-2xl shadow-p-md p-8 text-center">
        <div className="size-[60px] mx-auto mb-5 rounded-full bg-p-s-100 text-p-s-700 flex items-center justify-center">
          <CheckCircle2 size={30} />
        </div>
        <h1 className="text-[20px] font-semibold text-p-text-primary m-0">¡Pago exitoso!</h1>
        <p className="text-[13.5px] text-p-text-secondary mt-2 mb-0 leading-[1.55]">
          Tu suscripción ya está activa. Te enviamos un correo con el comprobante.
        </p>

        {ref && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-[6px] rounded-lg bg-p-bg-subtle border border-p-border">
            <span className="text-[11px] text-p-text-tertiary">Referencia</span>
            <span className="text-[12.5px] font-semibold text-p-text-primary tracking-wide">#{ref}</span>
          </div>
        )}

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
            Ver facturación <ArrowRight size={14} />
          </Link>
        </div>

        <p className="text-[12px] text-p-text-tertiary mt-5 m-0">Redirigiendo en {secs}s…</p>
      </div>
    </div>
  );
}
