import { useNavigate } from 'react-router';
import { XCircle } from 'lucide-react';

export default function BillingCancelPage() {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', gap: 16, background: 'var(--p-bg-app)' }}>
      <XCircle size={56} color="#dc2626" />
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--p-text-primary)', margin: 0 }}>Pago cancelado</h1>
      <p style={{ fontSize: 14, color: 'var(--p-text-secondary)', margin: 0 }}>No se realizó ningún cargo.</p>
      <button
        onClick={() => navigate('/dashboard/billing')}
        style={{ marginTop: 8, padding: '8px 20px', borderRadius: 8, background: 'var(--p-accent)', color: 'white', border: 'none', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        Volver a facturación
      </button>
    </div>
  );
}
