import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

import { useAcceptInvitation } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';
import { showApiError } from '@/lib/errors';
import AuthLayout from '@/layouts/AuthLayout';
import {
  AuthHeader, AuthInput, AuthButton, PwStrengthMeter,
} from '@/components/AuthFormParts';

const schema = z.object({
  fullName: z.string().min(1, 'El nombre es requerido'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirma tu contraseña'),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export default function AcceptInvitationPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { setAuth, setSchoolId } = useAuthStore();
  const acceptInvitation = useAcceptInvitation();

  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', password: '', confirmPassword: '' },
  });

  const password = watch('password');

  if (!token) {
    return (
      <AuthLayout maxWidth={420}>
        <div className="text-center py-8">
          <div className="text-[18px] font-bold text-p-text-primary mb-2">Enlace inválido</div>
          <p className="text-[13.5px] text-p-text-secondary">
            Este enlace de invitación no es válido. Solicita una nueva invitación al director de tu institución.
          </p>
        </div>
      </AuthLayout>
    );
  }

  const onSubmit = async (data) => {
    try {
      const result = await acceptInvitation.mutateAsync({
        token,
        fullName: data.fullName,
        password: data.password,
      });

      setAuth({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.user,
      });
      setSchoolId(result.schoolId);
      navigate('/dashboard');
    } catch (error) {
      showApiError(error);
    }
  };

  return (
    <AuthLayout maxWidth={420}>
      <AuthHeader
        title="Acepta tu invitación"
        subtitle="Crea tu cuenta para unirte a la institución"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="[animation:fadeUp_0.22s_ease]">
        <AuthInput
          label="Nombre completo"
          placeholder="Tu nombre"
          icon={User}
          autoComplete="name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />

        <div className="mb-[14px]">
          <AuthInput
            label="Contraseña"
            type={showPw ? 'text' : 'password'}
            placeholder="Mínimo 8 caracteres"
            icon={Lock}
            autoComplete="new-password"
            error={errors.password?.message}
            suffix={
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="border-none bg-transparent cursor-pointer text-p-text-tertiary flex p-0"
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            }
            {...register('password')}
          />
          <div className="-mt-2">
            <PwStrengthMeter password={password} />
          </div>
        </div>

        <AuthInput
          label="Confirmar contraseña"
          type={showConfirm ? 'text' : 'password'}
          placeholder="Repite tu contraseña"
          icon={Lock}
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          suffix={
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="border-none bg-transparent cursor-pointer text-p-text-tertiary flex p-0"
            >
              {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
          {...register('confirmPassword')}
        />

        <div className="mt-2">
          <AuthButton
            type="submit"
            loading={acceptInvitation.isPending}
            icon={!acceptInvitation.isPending ? ArrowRight : undefined}
          >
            {acceptInvitation.isPending ? 'Creando cuenta…' : 'Crear cuenta y unirme'}
          </AuthButton>
        </div>
      </form>
    </AuthLayout>
  );
}
