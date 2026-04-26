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
      <AuthHeader
        title="Recuperar contraseña"
        subtitle="Te enviaremos un enlace a tu correo"
      />

      {sent ? (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📬</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--p-text-primary)', marginBottom: 8 }}>
            Revisa tu correo
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--p-text-secondary)', marginBottom: 24 }}>
            Si <strong>{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
          </div>
          <Link to="/login" style={{ fontSize: 13.5, color: 'var(--p-text-primary)', fontWeight: 500, textDecoration: 'underline' }}>
            Volver al inicio de sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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

          <Link
            to="/login"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13.5, color: 'var(--p-text-secondary)', textDecoration: 'none', marginTop: 4 }}
          >
            <ArrowLeft size={14} /> Volver al inicio de sesión
          </Link>
        </form>
      )}
    </AuthLayout>
  );
}
