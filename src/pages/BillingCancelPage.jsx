import { useNavigate } from 'react-router';
import { XCircle } from 'lucide-react';

export default function BillingCancelPage() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 bg-p-bg-app">
      <XCircle size={56} color="#dc2626" />
      <h1 className="text-2xl font-bold text-p-text-primary m-0">Pago cancelado</h1>
      <p className="text-sm text-p-text-secondary m-0">No se realizó ningún cargo.</p>
      <button
        onClick={() => navigate('/dashboard/billing')}
        className="mt-2 px-5 py-2 rounded-lg bg-p-accent text-white text-[13.5px] font-semibold cursor-pointer border-0 font-sans"
      >
        Volver a facturación
      </button>
    </div>
  );
}
