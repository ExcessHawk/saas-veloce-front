import { useState } from 'react';
import { Link } from 'react-router';
import { Mail, ArrowLeft } from 'lucide-react';
import { useForgotPassword } from '@/hooks/useAuth';
import { showApiError } from '@/lib/errors';
import AuthLayout from '@/layouts/AuthLayout';
import { AuthHeader, AuthInput, AuthButton } from '@/components/AuthFormParts';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const forgot = useForgotPassword();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await forgot.mutateAsync({ email });
      setSent(true);
    } catch (err) {
      showApiError(err);
    }
  };

  return (
    <AuthLayout>
      <AuthHeader title="Recuperar contraseña" subtitle="Te enviaremos un enlace a tu correo" />

      {sent ? (
        <div className="text-center py-2">
          <div className="text-[40px] mb-3">📬</div>
          <div className="text-[15px] font-semibold text-p-text-primary mb-2">Revisa tu correo</div>
          <div className="text-[13.5px] text-p-text-secondary mb-6">
            Si <strong>{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
          </div>
          <Link to="/login" className="text-[13.5px] text-p-text-primary font-medium underline">
            Volver al inicio de sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <AuthInput
            label="Correo electrónico"
            type="email"
            placeholder="director@escuela.mx"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <AuthButton type="submit" loading={forgot.isPending}>
            {forgot.isPending ? 'Enviando…' : 'Enviar enlace de recuperación'}
          </AuthButton>
          <Link to="/login" className="flex items-center justify-center gap-[6px] text-[13.5px] text-p-text-secondary no-underline mt-1">
            <ArrowLeft size={14} /> Volver al inicio de sesión
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
