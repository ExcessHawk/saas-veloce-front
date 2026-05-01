import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router';
import { Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useResetPassword } from '@/hooks/useAuth';
import { showApiError } from '@/lib/errors';
import AuthLayout from '@/layouts/AuthLayout';
import { AuthHeader, AuthInput, AuthButton } from '@/components/AuthFormParts';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const reset = useResetPassword();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) { toast.error('La contraseña debe tener al menos 8 caracteres'); return; }
    if (newPassword !== confirm) { toast.error('Las contraseñas no coinciden'); return; }
    try {
      await reset.mutateAsync({ token, newPassword });
      toast.success('Contraseña actualizada exitosamente');
      navigate('/login');
    } catch (err) {
      showApiError(err);
    }
  };

  if (!token) {
    return (
      <AuthLayout>
        <AuthHeader title="Enlace inválido" subtitle="El enlace de recuperación no es válido." />
        <Link to="/forgot-password" className="block text-center text-[13.5px] text-p-text-primary underline">
          Solicitar nuevo enlace
        </Link>
      </AuthLayout>
    );
  }

  const pwSuffix = (
    <button type="button" onClick={() => setShowPw(!showPw)}
      className="border-0 bg-transparent cursor-pointer text-p-text-tertiary flex p-0">
      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
    </button>
  );

  return (
    <AuthLayout>
      <AuthHeader title="Nueva contraseña" subtitle="Elige una contraseña segura para tu cuenta" />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <AuthInput label="Nueva contraseña" type={showPw ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
          icon={Lock} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} suffix={pwSuffix} required />
        <AuthInput label="Confirmar contraseña" type={showPw ? 'text' : 'password'} placeholder="Repite la contraseña"
          icon={Lock} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        <AuthButton type="submit" loading={reset.isPending}>
          {reset.isPending ? 'Actualizando…' : 'Establecer nueva contraseña'}
        </AuthButton>
        <Link to="/login" className="block text-center text-[13.5px] text-p-text-secondary no-underline mt-1">
          Volver al inicio de sesión
        </Link>
      </form>
    </AuthLayout>
  );
}
