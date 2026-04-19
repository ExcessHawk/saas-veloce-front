import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { School, Pencil } from 'lucide-react';
import { useSchool, useUpdateSchool } from '@/hooks/useSchool';
import { showApiError } from '@/lib/errors';
import { useAuthStore } from '@/stores/authStore';
import { RoleGate } from '@/components/RoleGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';

const schoolSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  domain: z.string().optional(),
  contactEmail: z.string().email('Email inválido').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  timezone: z.string().optional(),
  locale: z.string().optional(),
  country: z.string().optional(),
});

const INFO_FIELDS = [
  { label: 'Nombre', key: 'name' },
  { label: 'Slug', key: 'slug' },
  { label: 'Dominio', key: 'domain' },
  { label: 'Email de Contacto', key: 'contactEmail' },
  { label: 'Teléfono', key: 'contactPhone' },
  { label: 'Zona Horaria', key: 'timezone' },
  { label: 'Locale', key: 'locale' },
  { label: 'País', key: 'country' },
];

export default function SchoolPage() {
  const [editOpen, setEditOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  const { data: school, isLoading, error } = useSchool();
  const updateSchool = useUpdateSchool();

  const form = useForm({
    resolver: zodResolver(schoolSchema),
    defaultValues: { name: '', domain: '', contactEmail: '', contactPhone: '', timezone: '', locale: '', country: '' },
  });

  useEffect(() => {
    if (error) showApiError(error);
  }, [error]);

  useEffect(() => {
    if (school && editOpen) {
      form.reset({
        name: school.name || '',
        domain: school.domain || '',
        contactEmail: school.contactEmail || '',
        contactPhone: school.contactPhone || '',
        timezone: school.timezone || '',
        locale: school.locale || '',
        country: school.country || '',
      });
    }
  }, [school, editOpen]);

  const onSubmit = async (data) => {
    const clean = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== ''),
    );
    try {
      await updateSchool.mutateAsync(clean);
      setEditOpen(false);
    } catch { /* handled by hook */ }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <School className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Mi Escuela</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Información de la Escuela</CardTitle>
          <RoleGate roles={['director']}>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-1 h-3.5 w-3.5" />
              Editar
            </Button>
          </RoleGate>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-40" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {INFO_FIELDS.map(({ label, key }) => (
                <div key={key} className="space-y-1">
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="font-medium">{school?.[key] ?? '—'}</p>
                </div>
              ))}
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Estado</p>
                <Badge variant={school?.status === 'active' ? 'default' : 'secondary'}>
                  {school?.status ?? '—'}
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={(v) => { if (!v) form.reset(); setEditOpen(v); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Editar Escuela</DialogTitle></DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor="name">Nombre *</Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>
              {[
                { id: 'domain', label: 'Dominio', placeholder: 'ejemplo.edu.mx' },
                { id: 'contactEmail', label: 'Email de Contacto', placeholder: 'contacto@escuela.mx' },
                { id: 'contactPhone', label: 'Teléfono', placeholder: '+52 55 1234 5678' },
                { id: 'timezone', label: 'Zona Horaria', placeholder: 'America/Mexico_City' },
                { id: 'locale', label: 'Locale', placeholder: 'es-MX' },
                { id: 'country', label: 'País', placeholder: 'México' },
              ].map(({ id, label, placeholder }) => (
                <div key={id}>
                  <Label htmlFor={id}>{label}</Label>
                  <Input id={id} placeholder={placeholder} {...form.register(id)} />
                  {form.formState.errors[id] && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors[id].message}</p>
                  )}
                </div>
              ))}
            </div>
            <Button type="submit" className="w-full" disabled={updateSchool.isPending}>
              {updateSchool.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
