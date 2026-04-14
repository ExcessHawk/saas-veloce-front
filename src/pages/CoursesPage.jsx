import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { useCourses, useCreateCourse } from '@/hooks/useCourses';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useSubjects } from '@/hooks/useSubjects';
import { useAcademicYears } from '@/hooks/useAcademicYears';
import { createCourseSchema } from '@/schemas/courses';
import { showApiError } from '@/lib/errors';
import { RoleGate } from '@/components/RoleGate';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

function findName(list, id) {
  const item = list?.find((i) => i.id === id);
  return item?.name || '—';
}

export default function CoursesPage() {
  const [open, setOpen] = useState(false);
  const courses = useCourses();
  const classrooms = useClassrooms();
  const subjects = useSubjects();
  const academicYears = useAcademicYears();
  const createCourse = useCreateCourse();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createCourseSchema),
    defaultValues: { classroomId: '', subjectId: '', academicYearId: '' },
  });

  useEffect(() => {
    if (courses.error) {
      showApiError(courses.error);
    }
  }, [courses.error]);

  const onSubmit = async (data) => {
    try {
      await createCourse.mutateAsync(data);
      reset();
      setOpen(false);
    } catch {
      // Error already handled by useCreateCourse hook
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cursos</h1>

        <RoleGate roles={['director', 'teacher']}>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                Crear Curso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Curso</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label>Aula</Label>
                  <Controller
                    control={control}
                    name="classroomId"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un aula" />
                        </SelectTrigger>
                        <SelectContent>
                          {classrooms.data?.map((c) => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.classroomId && (
                    <p className="text-sm text-red-500 mt-1">{errors.classroomId.message}</p>
                  )}
                </div>
                <div>
                  <Label>Materia</Label>
                  <Controller
                    control={control}
                    name="subjectId"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una materia" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.data?.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.subjectId && (
                    <p className="text-sm text-red-500 mt-1">{errors.subjectId.message}</p>
                  )}
                </div>
                <div>
                  <Label>Año Académico</Label>
                  <Controller
                    control={control}
                    name="academicYearId"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un año académico" />
                        </SelectTrigger>
                        <SelectContent>
                          {academicYears.data?.map((ay) => (
                            <SelectItem key={ay.id} value={ay.id}>{ay.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.academicYearId && (
                    <p className="text-sm text-red-500 mt-1">{errors.academicYearId.message}</p>
                  )}
                </div>
                <Button type="submit" className="w-full" disabled={createCourse.isPending}>
                  {createCourse.isPending ? 'Creando...' : 'Crear Curso'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </RoleGate>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Aula</TableHead>
            <TableHead>Materia</TableHead>
            <TableHead>Año Académico</TableHead>
            <TableHead>Fecha de Creación</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              </TableRow>
            ))
          ) : courses.data?.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground">
                No hay cursos registrados
              </TableCell>
            </TableRow>
          ) : (
            courses.data?.map((course) => (
              <TableRow key={course.id}>
                <TableCell>{findName(classrooms.data, course.classroomId)}</TableCell>
                <TableCell>{findName(subjects.data, course.subjectId)}</TableCell>
                <TableCell>{findName(academicYears.data, course.academicYearId)}</TableCell>
                <TableCell>
                  {course.createdAt
                    ? format(new Date(course.createdAt), 'dd/MM/yyyy')
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
