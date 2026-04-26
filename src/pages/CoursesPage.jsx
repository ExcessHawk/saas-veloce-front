import { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, UserCog } from 'lucide-react';
import { useCourses, useCreateCourse, useUpdateCourse, useDeleteCourse } from '@/hooks/useCourses';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useSubjects } from '@/hooks/useSubjects';
import { useAcademicYears } from '@/hooks/useAcademicYears';
import { useMembers } from '@/hooks/useMembers';
import { AssignTeacherDialog } from '@/components/AssignTeacherDialog';
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

function CourseSelects({ control, errors, classroomsData, subjectsData, academicYearsData }) {
  return (
    <>
      <div>
        <Label>Aula</Label>
        <Controller control={control} name="classroomId" render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger><SelectValue placeholder="Selecciona un aula" /></SelectTrigger>
            <SelectContent>
              {classroomsData?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
        {errors.classroomId && <p className="text-sm text-red-500 mt-1">{errors.classroomId.message}</p>}
      </div>
      <div>
        <Label>Materia</Label>
        <Controller control={control} name="subjectId" render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger><SelectValue placeholder="Selecciona una materia" /></SelectTrigger>
            <SelectContent>
              {subjectsData?.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
        {errors.subjectId && <p className="text-sm text-red-500 mt-1">{errors.subjectId.message}</p>}
      </div>
      <div>
        <Label>Año Académico</Label>
        <Controller control={control} name="academicYearId" render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger><SelectValue placeholder="Selecciona un año académico" /></SelectTrigger>
            <SelectContent>
              {academicYearsData?.map((ay) => <SelectItem key={ay.id} value={ay.id}>{ay.name}</SelectItem>)}
            </SelectContent>
          </Select>
        )} />
        {errors.academicYearId && <p className="text-sm text-red-500 mt-1">{errors.academicYearId.message}</p>}
      </div>
    </>
  );
}

function EditCourseForm({ course, classroomsData, subjectsData, academicYearsData, onSave, loading }) {
  const form = useForm({
    resolver: zodResolver(updateCourseSchema),
    defaultValues: {
      classroomId: course.classroomId ?? '',
      subjectId: course.subjectId ?? '',
      academicYearId: course.academicYearId ?? '',
    },
  });
  return (
    <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
      <CourseSelects
        control={form.control}
        errors={form.formState.errors}
        classroomsData={classroomsData}
        subjectsData={subjectsData}
        academicYearsData={academicYearsData}
      />
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Guardando…' : 'Guardar Cambios'}
      </Button>
    </form>
  );
}

export default function CoursesPage() {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [assigningItem, setAssigningItem] = useState(null);
  const [query, setQuery] = useState('');

  const courses = useCourses();
  const classrooms = useClassrooms();
  const subjects = useSubjects();
  const academicYears = useAcademicYears();
  const members = useMembers();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const createForm = useForm({
    resolver: zodResolver(createCourseSchema),
    defaultValues: { classroomId: '', subjectId: '', academicYearId: '' },
  });

  useEffect(() => {
    if (courses.error) showApiError(courses.error);
  }, [courses.error]);

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
                <CourseSelects
                  control={createForm.control}
                  errors={createForm.formState.errors}
                  classroomsData={classrooms.data}
                  subjectsData={subjects.data}
                  academicYearsData={academicYears.data}
                />
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
            <TableHead>Docente</TableHead>
            <SortableHead field="createdAt" label="Fecha de Creación" sorting={sorting} />
            <RoleGate roles={['director', 'teacher']}>
              <TableHead className="w-32">Acciones</TableHead>
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
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                {query ? `Sin resultados para "${query}"` : 'No hay cursos registrados'}
              </TableCell>
            </TableRow>
          ) : (
            pagination.paginated.map((course) => {
              const teacherMember = members.data?.find((m) => m.id === course.teacherMemberId);
              return (
                <TableRow key={course.id}>
                  <TableCell>{findName(classrooms.data, course.classroomId)}</TableCell>
                  <TableCell>{findName(subjects.data, course.subjectId)}</TableCell>
                  <TableCell>{findName(academicYears.data, course.academicYearId)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {teacherMember ? `Prof. ${teacherMember.fullName}` : <span className="italic">Sin asignar</span>}
                  </TableCell>
                  <TableCell>
                    {course.createdAt ? format(new Date(course.createdAt), 'dd/MM/yyyy') : '—'}
                  </TableCell>
                  <TableCell>
                    <RoleGate roles={['director']}>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title="Asignar docente" onClick={() => setAssigningItem(course)}>
                          <UserCog className="h-4 w-4" />
                        </Button>
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
              );
            })
          )}
        </TableBody>
      </Table>

      {!courses.isLoading && filtered.length > 0 && (
        <DataTablePagination {...pagination} total={filtered.length} />
      )}

      <Dialog open={!!editingItem} onOpenChange={(v) => !v && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Curso</DialogTitle></DialogHeader>
          {editingItem && (
            <EditCourseForm
              key={editingItem.id}
              course={editingItem}
              classroomsData={classrooms.data}
              subjectsData={subjects.data}
              academicYearsData={academicYears.data}
              onSave={onSubmitEdit}
              loading={updateCourse.isPending}
            />
          )}
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

      <AssignTeacherDialog
        open={!!assigningItem}
        onOpenChange={(v) => !v && setAssigningItem(null)}
        course={assigningItem}
        subjectName={assigningItem ? findName(subjects.data, assigningItem.subjectId) : ''}
        classroomName={assigningItem ? findName(classrooms.data, assigningItem.classroomId) : ''}
        yearName={assigningItem ? findName(academicYears.data, assigningItem.academicYearId) : ''}
      />
    </div>
  );
}
