import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useAcademicYears, useCreateAcademicYear } from '@/hooks/useAcademicYears';
import { createAcademicYearSchema } from '@/schemas/academicYears';
import { showApiError } from '@/lib/errors';
import { RoleGate } from '@/components/RoleGate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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

export default function AcademicYearsPage() {
  const [open, setOpen] = useState(false);
  const academicYears = useAcademicYears();
  const createAcademicYear = useCreateAcademicYear();

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createAcademicYearSchema),
    defaultValues: { name: '', startDate: '', endDate: '', isCurrent: false },
  });

  useEffect(() => {
    if (academicYears.error) {
      showApiError(academicYears.error);
    }
  }, [academicYears.error]);

  const onSubmit = async (data) => {
    try {
      await createAcademicYear.mutateAsync(data);
      reset();
      setOpen(false);
    } catch {
      // Error already handled by useCreateAcademicYear hook
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Años Académicos</h1>

        <RoleGate roles={['director']}>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                Crear Año Académico
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Año Académico</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" placeholder="Ej: 2025" {...register('name')} />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="startDate">Fecha de Inicio</Label>
                  <Input id="startDate" type="date" {...register('startDate')} />
                  {errors.startDate && (
                    <p className="text-sm text-red-500 mt-1">{errors.startDate.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="endDate">Fecha de Fin</Label>
                  <Input id="endDate" type="date" {...register('endDate')} />
                  {errors.endDate && (
                    <p className="text-sm text-red-500 mt-1">{errors.endDate.message}</p>
                  )}
                </div>
                <Controller
                  control={control}
                  name="isCurrent"
                  render={({ field }) => (
                    <div className="flex items-center gap-2">
                      <Checkbox id="isCurrent" checked={field.value} onCheckedChange={field.onChange} />
                      <Label htmlFor="isCurrent">Es el año actual</Label>
                    </div>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createAcademicYear.isPending}>
                  {createAcademicYear.isPending ? 'Creando...' : 'Crear Año Académico'}
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
            <TableHead>Fecha de Inicio</TableHead>
            <TableHead>Fecha de Fin</TableHead>
            <TableHead>Actual</TableHead>
            <TableHead>Fecha de Creación</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {academicYears.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              </TableRow>
            ))
          ) : academicYears.data?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No hay años académicos registrados
              </TableCell>
            </TableRow>
          ) : (
            academicYears.data?.map((year) => (
              <TableRow key={year.id}>
                <TableCell>{year.name}</TableCell>
                <TableCell>
                  {year.startDate
                    ? format(new Date(year.startDate), 'dd/MM/yyyy')
                    : '—'}
                </TableCell>
                <TableCell>
                  {year.endDate
                    ? format(new Date(year.endDate), 'dd/MM/yyyy')
                    : '—'}
                </TableCell>
                <TableCell>
                  <Badge variant={year.isCurrent ? 'default' : 'secondary'}>
                    {year.isCurrent ? 'Sí' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {year.createdAt
                    ? format(new Date(year.createdAt), 'dd/MM/yyyy')
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
