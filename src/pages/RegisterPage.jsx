import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router';
import { registerSchema } from '@/schemas/auth';
import { useAuthStore } from '@/stores/authStore';
import { useRegister } from '@/hooks/useAuth';
import { showApiError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth, setSchoolId } = useAuthStore();
  const registerMutation = useRegister();

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', schoolId: '' },
  });

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, ...apiData } = data;
      const result = await registerMutation.mutateAsync(apiData);
      setAuth(result);
      setSchoolId(data.schoolId);
      navigate('/dashboard');
    } catch (error) {
      showApiError(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Registro</CardTitle>
          <CardDescription>Crea tu cuenta para acceder a la plataforma</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...formRegister('email')} />
              {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" {...formRegister('password')} />
              {errors.password && <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <Input id="confirmPassword" type="password" {...formRegister('confirmPassword')} />
              {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>

            <div>
              <Label htmlFor="schoolId">ID de Escuela (UUID)</Label>
              <Input id="schoolId" placeholder="550e8400-e29b-41d4-a716-446655440000" {...formRegister('schoolId')} />
              {errors.schoolId && <p className="text-sm text-red-500 mt-1">{errors.schoolId.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? 'Registrando...' : 'Crear Cuenta'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">Inicia sesión</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}