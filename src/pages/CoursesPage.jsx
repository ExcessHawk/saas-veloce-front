import { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse } from '@/hooks/useCourses';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useSubjects } from '@/hooks/useSubjects';
import { useAcademicYears } from '@/hooks/useAcademicYears';
import { createCourseSchema, updateCourseSchema } from '@/schemas/courses';
import { showApiError } from '@/lib/errors';
import { usePagination } from '@/hooks/usePagination';
import { useSorting } from '@/hooks/useSorting';
import { RoleGate } from '@/components/RoleGate';
import { SortableHead } from '@/components/SortableHead';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { SearchInput } from '@/components/SearchInput';
import { DataTablePagination } from '@/components/DataTablePagination';
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
  return list?.find((i) => i.id === id)?.name || '—';
}

export default function CoursesPage() {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [query, setQuery] = useState('');

  const courses = useCourses();
  const classrooms = useClassrooms();
  const subjects = useSubjects();
  const academicYears = useAcademicYears();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const createForm = useForm({
    resolver: zodResolver(createCourseSchema),
    defaultValues: { classroomId: '', subjectId: '', academicYearId: '' },
  });

  const editForm = useForm({
    resolver: zodResolver(updateCourseSchema),
    defaultValues: { classroomId: '', subjectId: '', academicYearId: '' },
  });

  useEffect(() => {
    if (courses.error) showApiError(courses.error);
  }, [courses.error]);

  useEffect(() => {
    if (editingItem) {
      editForm.reset({
        classroomId: editingItem.classroomId || '',
        subjectId: editingItem.subjectId || '',
        academicYearId: editingItem.academicYearId || '',
      });
    }
  }, [editingItem]);

  const sorting = useSorting('createdAt');

  const filtered = useMemo(() => {
    const data = courses.data ?? [];
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((course) => {
      const classroomName = findName(classrooms.data, course.classroomId).toLowerCase();
      const subjectName = findName(subjects.data, course.subjectId).toLowerCase();
      const yearName = findName(academicYears.data, course.academicYearId).toLowerCase();
      return classroomName.includes(q) || subjectName.includes(q) || yearName.includes(q);
    });
  }, [courses.data, classrooms.data, subjects.data, academicYears.data, query]);

  const sorted = useMemo(() => sorting.sort(filtered), [filtered, sorting.sort]);
  const pagination = usePagination(sorted);

  const onSubmitCreate = async (data) => {
    try {
      await createCourse.mutateAsync(data);
      createForm.reset();
      setOpen(false);
    } catch { /* handled by hook */ }
  };

  const onSubmitEdit = async (data) => {
    try {
      await updateCourse.mutateAsync({ id: editingItem.id, ...data });
      setEditingItem(null);
    } catch { /* handled by hook */ }
  };

  const onConfirmDelete = async () => {
    try {
      await deleteCourse.mutateAsync(deletingItem.id);
      setDeletingItem(null);
    } catch { /* handled by hook */ }
  };

  const CourseSelects = ({ control, errors, prefix = '' }) => (
    <>
      <div>
        <Label>Aula</Label>
        <Controller
          control={control}
          name="classroomId"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Selecciona un aula" /></SelectTrigger>
              <SelectContent>
                {classrooms.data?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.classroomId && <p className="text-sm text-red-500 mt-1">{errors.classroomId.message}</p>}
      </div>
      <div>
        <Label>Materia</Label>
        <Controller
          control={control}
          name="subjectId"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Selecciona una materia" /></SelectTrigger>
              <SelectContent>
                {subjects.data?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.subjectId && <p className="text-sm text-red-500 mt-1">{errors.subjectId.message}</p>}
      </div>
      <div>
        <Label>Año Académico</Label>
        <Controller
          control={control}
          name="academicYearId"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value}>
              <SelectTrigger><SelectValue placeholder="Selecciona un año académico" /></SelectTrigger>
              <SelectContent>
                {academicYears.data?.map((ay) => (
                  <SelectItem key={ay.id} value={ay.id}>{ay.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.academicYearId && <p className="text-sm text-red-500 mt-1">{errors.academicYearId.message}</p>}
      </div>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cursos</h1>

        <RoleGate roles={['director', 'teacher']}>
          <Dialog open={open} onOpenChange={(v) => { if (!v) createForm.reset(); setOpen(v); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                Crear Curso
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Crear Curso</DialogTitle></DialogHeader>
              <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4">
                <CourseSelects control={createForm.control} errors={createForm.formState.errors} />
                <Button type="submit" className="w-full" disabled={createCourse.isPending}>
                  {createCourse.isPending ? 'Creando...' : 'Crear Curso'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </RoleGate>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Buscar por aula, materia o año..." />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Aula</TableHead>
            <TableHead>Materia</TableHead>
            <TableHead>Año Académico</TableHead>
            <SortableHead field="createdAt" label="Fecha de Creación" sorting={sorting} />
            <RoleGate roles={['director', 'teacher']}>
              <TableHead className="w-24">Acciones</TableHead>
            </RoleGate>
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
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                {query ? `Sin resultados para "${query}"` : 'No hay cursos registrados'}
              </TableCell>
            </TableRow>
          ) : (
            pagination.paginated.map((course) => (
              <TableRow key={course.id}>
                <TableCell>{findName(classrooms.data, course.classroomId)}</TableCell>
                <TableCell>{findName(subjects.data, course.subjectId)}</TableCell>
                <TableCell>{findName(academicYears.data, course.academicYearId)}</TableCell>
                <TableCell>
                  {course.createdAt ? format(new Date(course.createdAt), 'dd/MM/yyyy') : '—'}
                </TableCell>
                <TableCell>
                  <RoleGate roles={['director', 'teacher']}>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditingItem(course)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingItem(course)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </RoleGate>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!courses.isLoading && filtered.length > 0 && (
        <DataTablePagination {...pagination} total={filtered.length} />
      )}

      <Dialog
        open={!!editingItem}
        onOpenChange={(v) => { if (!v) { editForm.reset(); setEditingItem(null); } }}
      >
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Curso</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
            <CourseSelects control={editForm.control} errors={editForm.formState.errors} />
            <Button type="submit" className="w-full" disabled={updateCourse.isPending}>
              {updateCourse.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deletingItem}
        onOpenChange={(v) => !v && setDeletingItem(null)}
        onConfirm={onConfirmDelete}
        title="Eliminar Curso"
        description="¿Estás seguro de que deseas eliminar este curso? Esta acción no se puede deshacer."
        isPending={deleteCourse.isPending}
      />
    </div>
  );
}
