import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff, Building2, ArrowRight, Check } from 'lucide-react';

import { registerSchema } from '@/schemas/auth';
import { useAuthStore } from '@/stores/authStore';
import { useRegister } from '@/hooks/useAuth';
import { showApiError } from '@/lib/errors';
import AuthLayout from '@/layouts/AuthLayout';
import {
  AuthHeader, AuthTabs, AuthInput, AuthButton, Tooltip, PwStrengthMeter,
} from '@/components/AuthFormParts';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth, setSchoolId } = useAuthStore();
  const registerMutation = useRegister();

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register: formRegister, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', schoolId: '' },
  });

  const password = watch('password');
  const confirm = watch('confirmPassword');
  const passwordsMatch = confirm && confirm === password;

  const onSubmit = async (data) => {
    try {
      const { confirmPassword: _confirm, ...apiData } = data;
      const result = await registerMutation.mutateAsync(apiData);
      setAuth(result);
      setSchoolId(data.schoolId);
      navigate('/dashboard');
    } catch (error) {
      showApiError(error);
    }
  };

  return (
    <AuthLayout>
      <AuthHeader title="Crea tu cuenta" subtitle="Únete a tu institución educativa en Pensum" />
      <AuthTabs active="register" />

      <form onSubmit={handleSubmit(onSubmit)} className="tab-content [animation:fadeUp_0.22s_ease]">
        <AuthInput label="Correo electrónico" type="email" placeholder="usuario@escuela.mx"
          icon={Mail} autoComplete="email" error={errors.email?.message} {...formRegister('email')} />

        <div className="mb-[14px]">
          <AuthInput label="Contraseña" type={showPw ? 'text' : 'password'} placeholder="Mínimo 8 caracteres"
            icon={Lock} autoComplete="new-password" error={errors.password?.message}
            suffix={
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="border-0 bg-transparent cursor-pointer text-p-text-tertiary flex p-0">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
            {...formRegister('password')}
          />
          <div className="-mt-2">
            <PwStrengthMeter password={password} />
          </div>
        </div>

        <AuthInput label="Confirmar contraseña" type={showConfirm ? 'text' : 'password'} placeholder="Repite tu contraseña"
          icon={Lock} autoComplete="new-password" error={errors.confirmPassword?.message}
          suffix={
            <span className="flex gap-1 items-center">
              {passwordsMatch && <span className="text-p-s-500 flex"><Check size={14} /></span>}
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="border-0 bg-transparent cursor-pointer text-p-text-tertiary flex p-0">
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </span>
          }
          {...formRegister('confirmPassword')}
        />

        <div className="mb-[22px]">
          <AuthInput
            label={<>ID de Escuela <Tooltip text="UUID único de tu institución. Solicítalo a tu director." /></>}
            placeholder="550e8400-e29b-41d4-a716-446655440000"
            icon={Building2} autoComplete="off" mono error={errors.schoolId?.message}
            {...formRegister('schoolId')}
          />
        </div>

        <AuthButton type="submit" loading={registerMutation.isPending} icon={!registerMutation.isPending ? ArrowRight : undefined}>
          {registerMutation.isPending ? 'Creando cuenta…' : 'Crear cuenta'}
        </AuthButton>

        <p className="text-center text-[12px] text-p-text-tertiary mt-4 mb-0 leading-relaxed">
          Al registrarte aceptas nuestros{' '}
          <a href="#" className="text-p-text-primary font-medium">Términos y Condiciones</a>{' '}
          y{' '}
          <a href="#" className="text-p-text-primary font-medium">Política de Privacidad</a>.
        </p>
      </form>
    </AuthLayout>
  );
}
