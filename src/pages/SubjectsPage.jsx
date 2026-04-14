import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useSubjects, useCreateSubject } from '@/hooks/useSubjects';
import { createSubjectSchema } from '@/schemas/subjects';
import { showApiError } from '@/lib/errors';
import { RoleGate } from '@/components/RoleGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function SubjectsPage() {
  const [open, setOpen] = useState(false);
  const subjects = useSubjects();
  const createSubject = useCreateSubject();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: { name: '', code: '', color: '', icon: '' },
  });

  useEffect(() => {
    if (subjects.error) {
      showApiError(subjects.error);
    }
  }, [subjects.error]);

  const onSubmit = async (data) => {
    try {
      await createSubject.mutateAsync(data);
      reset();
      setOpen(false);
    } catch {
      // Error already handled by useCreateSubject hook
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Materias</h1>

        <RoleGate roles={['director']}>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                Crear Materia
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Materia</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" placeholder="Ej: Matemáticas" {...register('name')} />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="code">Código</Label>
                  <Input id="code" placeholder="Ej: MAT-101" {...register('code')} />
                  {errors.code && (
                    <p className="text-sm text-red-500 mt-1">{errors.code.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input id="color" placeholder="Ej: #3B82F6" {...register('color')} />
                  {errors.color && (
                    <p className="text-sm text-red-500 mt-1">{errors.color.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="icon">Ícono</Label>
                  <Input id="icon" placeholder="Ej: calculator" {...register('icon')} />
                  {errors.icon && (
                    <p className="text-sm text-red-500 mt-1">{errors.icon.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={createSubject.isPending}>
                  {createSubject.isPending ? 'Creando...' : 'Crear Materia'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </RoleGate>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Código</TableHead>
            <TableHead>Color</TableHead>
            <TableHead>Ícono</TableHead>
            <TableHead>Fecha de Creación</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              </TableRow>
            ))
          ) : subjects.data?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No hay materias registradas
              </TableCell>
            </TableRow>
          ) : (
            subjects.data?.map((subject) => (
              <TableRow key={subject.id}>
                <TableCell>{subject.name}</TableCell>
                <TableCell>{subject.code || '—'}</TableCell>
                <TableCell>{subject.color || '—'}</TableCell>
                <TableCell>{subject.icon || '—'}</TableCell>
                <TableCell>
                  {subject.createdAt
                    ? format(new Date(subject.createdAt), 'dd/MM/yyyy')
                    : '—'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
