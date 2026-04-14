import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router';
import { loginSchema } from '@/schemas/auth';
import { useAuthStore } from '@/stores/authStore';
import { useLogin } from '@/hooks/useAuth';
import { showApiError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const login = useLogin();

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
      navigate('/dashboard');
    } catch (error) {
      showApiError(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Iniciar Sesión</CardTitle>
          <CardDescription>Ingresa tus credenciales para acceder</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="tu@email.com" {...register('email')} />
              {errors.email && (
                <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" placeholder="Mínimo 8 caracteres" {...register('password')} />
              {errors.password && (
                <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={login.isPending}>
              {login.isPending ? 'Ingresando...' : 'Iniciar Sesión'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm space-y-1">
            <p>
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-blue-600 hover:underline">Regístrate</Link>
            </p>
            <p>
              ¿Nueva escuela?{' '}
              <Link to="/provision" className="text-blue-600 hover:underline">Registra tu escuela</Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}