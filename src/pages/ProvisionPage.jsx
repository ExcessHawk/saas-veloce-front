import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router';
import { provisionSchema } from '@/schemas/auth';
import { useAuthStore } from '@/stores/authStore';
import { useProvision } from '@/hooks/useAuth';
import { showApiError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function ProvisionPage() {
  const navigate = useNavigate();
  const { setAuth, setSchoolId } = useAuthStore();
  const provision = useProvision();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(provisionSchema),
    defaultValues: {
      schoolName: '',
      adminEmail: '',
      adminPassword: '',
      confirmPassword: '',
      planCode: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      const { confirmPassword, ...apiData } = data;
      if (!apiData.planCode) delete apiData.planCode;

      const result = await provision.mutateAsync(apiData);

      setAuth({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        user: result.admin,
      });
      setSchoolId(result.school.id);
      navigate('/dashboard');

    } catch (error) {
      showApiError(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle>Registrar Escuela</CardTitle>
          <CardDescription>Crea tu escuela y obtén acceso como director</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label>Nombre de la Escuela</Label>
              <Input placeholder="Escuela Primaria San José" {...register('schoolName')} />
              {errors.schoolName && <p className="text-sm text-red-500 mt-1">{errors.schoolName.message}</p>}
            </div>
            <div>
              <Label>Email del Administrador</Label>
              <Input type="email" {...register('adminEmail')} />
              {errors.adminEmail && <p className="text-sm text-red-500 mt-1">{errors.adminEmail.message}</p>}
            </div>
            <div>
              <Label>Contraseña</Label>
              <Input type="password" {...register('adminPassword')} />
              {errors.adminPassword && <p className="text-sm text-red-500 mt-1">{errors.adminPassword.message}</p>}
            </div>
            <div>
              <Label>Confirmar Contraseña</Label>
              <Input type="password" {...register('confirmPassword')} />
              {errors.confirmPassword && <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>}
            </div>
            <div>
              <Label>Plan (opcional)</Label>
              <Input placeholder="starter" {...register('planCode')} />
              <p className="text-xs text-gray-500 mt-1">Opciones: starter, pro, enterprise. Por defecto: starter</p>
            </div>
            <Button type="submit" className="w-full" disabled={provision.isPending}>
              {provision.isPending ? 'Creando escuela...' : 'Registrar Escuela'}
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