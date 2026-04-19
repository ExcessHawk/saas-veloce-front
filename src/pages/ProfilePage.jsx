import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { UserCircle, Pencil } from 'lucide-react';
import { useProfile, useUpdateProfile, useChangePassword } from '@/hooks/useProfile';
import { showApiError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const profileSchema = z.object({
  fullName: z.string().min(1, 'El nombre es requerido'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Requerido'),
  newPassword: z.string().min(8, 'Mínimo 8 caracteres'),
  confirmPassword: z.string().min(1, 'Requerido'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

export default function ProfilePage() {
  const [editOpen, setEditOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);

  const { data: profile, isLoading, error } = useProfile();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: '', phone: '' },
  });

  const pwForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  useEffect(() => {
    if (error) showApiError(error);
  }, [error]);

  useEffect(() => {
    if (profile && editOpen) {
      profileForm.reset({ fullName: profile.fullName || '', phone: profile.phone || '' });
    }
  }, [profile, editOpen]);

  const { passwordHash, ...safeProfile } = profile || {};

  const onSubmitProfile = async (data) => {
    try {
      await updateProfile.mutateAsync(data);
      setEditOpen(false);
    } catch { /* handled by hook */ }
  };

  const onSubmitPassword = async (data) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      pwForm.reset();
      setPwOpen(false);
    } catch { /* handled by hook */ }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <UserCircle className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Mi Perfil</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Información Personal</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1 h-3.5 w-3.5" />
              Editar
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPwOpen(true)}>
              Cambiar Contraseña
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={safeProfile.avatarUrl} alt={safeProfile.fullName ?? 'Avatar'} />
                  <AvatarFallback className="text-lg">{getInitials(safeProfile.fullName)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{safeProfile.fullName ?? '—'}</p>
                  <p className="text-sm text-muted-foreground">{safeProfile.email ?? '—'}</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Teléfono', value: safeProfile.phone },
                  { label: 'Estado', value: safeProfile.status, badge: true },
                  { label: 'Último Login', value: safeProfile.lastLoginAt ? format(new Date(safeProfile.lastLoginAt), 'dd/MM/yyyy HH:mm') : null },
                  { label: 'Total de Logins', value: safeProfile.loginCount },
                ].map(({ label, value, badge }) => (
                  <div key={label} className="space-y-1">
                    <p className="text-sm text-muted-foreground">{label}</p>
                    {badge ? (
                      <Badge variant={value === 'active' ? 'default' : 'secondary'}>{value ?? '—'}</Badge>
                    ) : (
                      <p className="font-medium">{value ?? '—'}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog editar perfil */}
      <Dialog open={editOpen} onOpenChange={(v) => { if (!v) profileForm.reset(); setEditOpen(v); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Perfil</DialogTitle></DialogHeader>
          <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-4">
            <div>
              <Label htmlFor="fullName">Nombre Completo</Label>
              <Input id="fullName" {...profileForm.register('fullName')} />
              {profileForm.formState.errors.fullName && (
                <p className="text-sm text-red-500 mt-1">{profileForm.formState.errors.fullName.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" placeholder="+52 55 1234 5678" {...profileForm.register('phone')} />
            </div>
            <Button type="submit" className="w-full" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog cambiar contraseña */}
      <Dialog open={pwOpen} onOpenChange={(v) => { if (!v) pwForm.reset(); setPwOpen(v); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Cambiar Contraseña</DialogTitle></DialogHeader>
          <form onSubmit={pwForm.handleSubmit(onSubmitPassword)} className="space-y-4">
            <div>
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <Input id="currentPassword" type="password" {...pwForm.register('currentPassword')} />
              {pwForm.formState.errors.currentPassword && (
                <p className="text-sm text-red-500 mt-1">{pwForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input id="newPassword" type="password" {...pwForm.register('newPassword')} />
              {pwForm.formState.errors.newPassword && (
                <p className="text-sm text-red-500 mt-1">{pwForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <Input id="confirmPassword" type="password" {...pwForm.register('confirmPassword')} />
              {pwForm.formState.errors.confirmPassword && (
                <p className="text-sm text-red-500 mt-1">{pwForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={changePassword.isPending}>
              {changePassword.isPending ? 'Actualizando...' : 'Cambiar Contraseña'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
