import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useClassrooms, useCreateClassroom } from '@/hooks/useClassrooms';
import { createClassroomSchema } from '@/schemas/classrooms';
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

export default function ClassroomsPage() {
  const [open, setOpen] = useState(false);
  const classrooms = useClassrooms();
  const createClassroom = useCreateClassroom();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createClassroomSchema),
    defaultValues: { name: '', gradeLevel: '' },
  });

  useEffect(() => {
    if (classrooms.error) {
      showApiError(classrooms.error);
    }
  }, [classrooms.error]);

  const onSubmit = async (data) => {
    try {
      await createClassroom.mutateAsync(data);
      reset();
      setOpen(false);
    } catch {
      // Error already handled by useCreateClassroom hook
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Aulas</h1>

        <RoleGate roles={['director']}>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                Crear Aula
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Aula</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" placeholder="Ej: Aula 101" {...register('name')} />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="gradeLevel">Nivel de Grado</Label>
                  <Input id="gradeLevel" placeholder="Ej: 1° Primaria" {...register('gradeLevel')} />
                  {errors.gradeLevel && (
                    <p className="text-sm text-red-500 mt-1">{errors.gradeLevel.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={createClassroom.isPending}>
                  {createClassroom.isPending ? 'Creando...' : 'Crear Aula'}
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
            <TableHead>Nivel de Grado</TableHead>
            <TableHead>Fecha de Creación</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classrooms.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
              </TableRow>
            ))
          ) : classrooms.data?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No hay aulas registradas
              </TableCell>
            </TableRow>
          ) : (
            classrooms.data?.map((classroom) => (
              <TableRow key={classroom.id}>
                <TableCell>{classroom.name}</TableCell>
                <TableCell>{classroom.gradeLevel || '—'}</TableCell>
                <TableCell>
                  {classroom.createdAt
                    ? format(new Date(classroom.createdAt), 'dd/MM/yyyy')
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
