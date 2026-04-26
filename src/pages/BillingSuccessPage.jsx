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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, background: 'var(--p-bg-app)' }}>
      <CheckCircle2 size={56} color="#16a34a" />
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--p-text-primary)', margin: 0 }}>¡Pago exitoso!</h1>
      <p style={{ fontSize: 14, color: 'var(--p-text-secondary)', margin: 0 }}>Tu suscripción está activa. Redirigiendo…</p>
    </div>
  );
}
