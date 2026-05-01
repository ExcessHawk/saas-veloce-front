import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { CheckCircle2 } from 'lucide-react';

export default function BillingSuccessPage() {
  const navigate = useNavigate();
  useEffect(() => {
    const t = setTimeout(() => navigate('/dashboard/billing'), 4000);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 bg-p-bg-app">
      <CheckCircle2 size={56} color="#16a34a" />
      <h1 className="text-2xl font-bold text-p-text-primary m-0">¡Pago exitoso!</h1>
      <p className="text-sm text-p-text-secondary m-0">Tu suscripción está activa. Redirigiendo…</p>
    </div>
  );
}
