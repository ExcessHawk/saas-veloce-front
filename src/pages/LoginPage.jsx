import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link, useLocation } from 'react-router';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
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
      <AuthHeader
        title="Bienvenido de nuevo"
        subtitle="Accede a tu plataforma educativa"
      />

      <AuthTabs active="login" />

      <form onSubmit={handleSubmit(onSubmit)} className="tab-content" style={{ animation: 'fadeUp 0.22s ease' }}>
        <AuthInput
          label="Correo electrónico"
          type="email"
          placeholder="director@escuela.mx"
          icon={Mail}
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <AuthInput
          label="Contraseña"
          type={showPw ? 'text' : 'password'}
          placeholder="••••••••"
          icon={Lock}
          autoComplete="current-password"
          error={errors.password?.message}
          suffix={
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              style={{
                border: 'none', background: 'transparent', cursor: 'pointer',
                color: 'oklch(68% 0.010 80)', display: 'flex', padding: 0,
              }}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          {...register('password')}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <AuthCheckbox checked={remember} onChange={setRemember} label="Recordarme" />
          <Link
            to="/forgot-password"
            style={{
              fontSize: 13, color: 'oklch(30% 0.009 80)',
              fontWeight: 500, textDecoration: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <AuthButton type="submit" loading={login.isPending} icon={!login.isPending ? ArrowRight : undefined}>
          {login.isPending ? 'Iniciando sesión…' : 'Iniciar sesión'}
        </AuthButton>

        <Divider>o continúa con</Divider>

        <GoogleBtn label="Continuar con Google" />

        <p style={{ textAlign: 'center', fontSize: 13, color: 'oklch(55% 0.010 80)', marginTop: 22, marginBottom: 0 }}>
          ¿Eres una nueva escuela?{' '}
          <Link
            to="/provision"
            style={{
              color: 'oklch(8.5% 0.005 80)', fontWeight: 600,
              textDecoration: 'underline', fontSize: 13,
            }}
          >
            Regístrala aquí
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
