import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

import { loginSchema } from '@/schemas/auth';
import { useAuthStore } from '@/stores/authStore';
import { useLogin } from '@/hooks/useAuth';
import { showApiError } from '@/lib/errors';
import AuthLayout from '@/layouts/AuthLayout';
import {
  AuthHeader, AuthTabs, AuthInput, AuthButton, AuthCheckbox,
  Divider, GoogleBtn,
} from '@/components/AuthFormParts';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const setSchoolId = useAuthStore((s) => s.setSchoolId);
  const login = useLogin();

  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data) => {
    try {
      const result = await login.mutateAsync(data);
      setAuth(result);
      if (result.schoolId) setSchoolId(result.schoolId);
      navigate(result.user?.isGlobalAdmin ? '/admin' : '/dashboard');
    } catch (error) {
      showApiError(error);
    }
  };

  return (
    <AuthLayout>
      <AuthHeader title="Bienvenido de nuevo" subtitle="Accede a tu plataforma educativa" />
      <AuthTabs active="login" />

      <form onSubmit={handleSubmit(onSubmit)} className="tab-content [animation:fadeUp_0.22s_ease]">
        <AuthInput label="Correo electrónico" type="email" placeholder="director@escuela.mx"
          icon={Mail} autoComplete="email" error={errors.email?.message} {...register('email')} />

        <AuthInput label="Contraseña" type={showPw ? 'text' : 'password'} placeholder="••••••••"
          icon={Lock} autoComplete="current-password" error={errors.password?.message}
          suffix={
            <button type="button" onClick={() => setShowPw(!showPw)}
              className="border-0 bg-transparent cursor-pointer text-p-text-tertiary flex p-0">
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          {...register('password')}
        />

        <div className="flex items-center justify-between mb-[22px]">
          <AuthCheckbox checked={remember} onChange={setRemember} label="Recordarme" />
          <Link to="/forgot-password"
            className="text-[13px] text-p-text-primary font-medium no-underline hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <AuthButton type="submit" loading={login.isPending} icon={!login.isPending ? ArrowRight : undefined}>
          {login.isPending ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </AuthButton>

        <Divider>o continúa con</Divider>
        <GoogleBtn label="Continuar con Google" />

        <p className="text-center text-[13px] text-p-text-tertiary mt-[22px] mb-0">
          ¿Eres una nueva escuela?{' '}
          <Link to="/provision" className="text-p-text-primary font-semibold underline text-[13px]">
            Regístrala aquí
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
