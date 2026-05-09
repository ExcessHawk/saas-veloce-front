import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import api from '@/lib/axios';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No se encontró el token de verificación en el enlace.');
      return;
    }

    let timeoutId;

    api
      .get(`/api/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => {
        setStatus('success');
        setMessage('¡Tu correo fue verificado exitosamente!');
        timeoutId = setTimeout(() => navigate('/dashboard', { replace: true }), 3000);
      })
      .catch((err) => {
        const msg = err?.response?.data?.error || 'El token es inválido o ya expiró.';
        setStatus('error');
        setMessage(msg);
      });

    return () => clearTimeout(timeoutId);
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-p-bg-subtle px-4">
      <div className="bg-p-bg-base border border-p-border rounded-[24px] shadow-p-lg p-10 max-w-[420px] w-full text-center">
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-5">
              <Loader size={44} className="text-p-text-tertiary animate-spin" />
            </div>
            <div className="text-[17px] font-bold text-p-text-primary mb-2">Verificando correo…</div>
            <div className="text-[13.5px] text-p-text-secondary">Por favor espera un momento.</div>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-5">
              <CheckCircle size={44} className="text-p-s-500" />
            </div>
            <div className="text-[17px] font-bold text-p-text-primary mb-2">¡Correo verificado!</div>
            <div className="text-[13.5px] text-p-text-secondary mb-6">{message}</div>
            <div className="text-[12.5px] text-p-text-tertiary">Serás redirigido al dashboard en unos segundos…</div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-5">
              <XCircle size={44} className="text-p-d-500" />
            </div>
            <div className="text-[17px] font-bold text-p-text-primary mb-2">Error de verificación</div>
            <div className="text-[13.5px] text-p-text-secondary mb-6">{message}</div>
            <a
              href="/dashboard"
              className="inline-block px-5 py-[9px] rounded-[10px] bg-p-accent text-p-accent-text text-[13.5px] font-semibold no-underline"
            >
              Ir al dashboard
            </a>
          </>
        )}
      </div>
    </div>
  );
}
