import { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, UserCog, GraduationCap, DoorOpen, BookOpen, Calendar } from 'lucide-react';
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
import { EmptyState } from '@/components/EmptyState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

function findName(list, id) {
  return list?.find((i) => i.id === id)?.name || '—';
}

/* ── Field primitive ── */
function Field({ label, hint, error, children }) {
  return (
    <div>
      <label className="block text-[12.5px] font-semibold text-p-text-secondary mb-[6px]">{label}</label>
      {children}
      {hint && <p className="text-[11.5px] text-p-text-tertiary mt-[5px]">{hint}</p>}
      {error && <p className="text-[11.5px] text-p-d-500 mt-[5px]">{error}</p>}
    </div>
  );
}

/* ── Course form ── */
function CourseForm({ form, classroomsData, subjectsData, academicYearsData, onSubmit, loading, submitLabel, onCancel }) {
  const { control, handleSubmit, formState: { errors } } = form;

  const selectCls = 'w-full';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field label="Materia *" error={errors.subjectId?.message}>
        <Controller control={control} name="subjectId" render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger className={selectCls}>
              <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-p-text-tertiary shrink-0" />
                <SelectValue placeholder="Selecciona una materia" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {subjectsData?.length === 0 && <SelectItem value="_empty" disabled>Sin materias registradas</SelectItem>}
              {subjectsData?.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  <div className="flex items-center gap-2">
                    {s.color && <div className="size-2.5 rounded-full shrink-0" style={{ background: s.color }} />}
                    {s.name}
                    {s.code && <span className="text-muted-foreground text-xs">· {s.code}</span>}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )} />
      </Field>

      <Field label="Aula *" error={errors.classroomId?.message}>
        <Controller control={control} name="classroomId" render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger className={selectCls}>
              <div className="flex items-center gap-2">
                <DoorOpen size={14} className="text-p-text-tertiary shrink-0" />
                <SelectValue placeholder="Selecciona un aula" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {classroomsData?.length === 0 && <SelectItem value="_empty" disabled>Sin aulas registradas</SelectItem>}
              {classroomsData?.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}{c.capacity ? ` · ${c.capacity} alumnos` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )} />
      </Field>

      <Field label="Año académico *" error={errors.academicYearId?.message}>
        <Controller control={control} name="academicYearId" render={({ field }) => (
          <Select onValueChange={field.onChange} value={field.value}>
            <SelectTrigger className={selectCls}>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-p-text-tertiary shrink-0" />
                <SelectValue placeholder="Selecciona un año académico" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {academicYearsData?.length === 0 && <SelectItem value="_empty" disabled>Sin años académicos</SelectItem>}
              {academicYearsData?.map((ay) => (
                <SelectItem key={ay.id} value={ay.id}>
                  {ay.name}{ay.isCurrent ? ' · Actual' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )} />
      </Field>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-[9px] rounded-[10px] bg-p-accent text-p-accent-text text-[13.5px] font-semibold font-sans border-none cursor-pointer transition-colors hover:bg-p-accent-hover disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Guardando…' : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-[9px] rounded-[10px] border border-p-border bg-p-bg-base text-p-text-secondary text-[13.5px] font-medium font-sans cursor-pointer transition-colors hover:bg-p-bg-subtle"
          >
            Cancelar
          </button>
        )}
      </div>
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

  const editForm = useForm({
    resolver: zodResolver(updateCourseSchema),
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

  useEffect(() => {
    if (editingItem) {
      editForm.reset({
        classroomId: editingItem.classroomId ?? '',
        subjectId: editingItem.subjectId ?? '',
        academicYearId: editingItem.academicYearId ?? '',
      });
    }
  }, [editingItem]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cursos</h1>

        <RoleGate roles={['director', 'teacher']}>
          <Dialog open={open} onOpenChange={(v) => { if (!v) createForm.reset(); setOpen(v); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1 size-4" />Crear Curso</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[480px] p-0 overflow-hidden gap-0">
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-p-border">
                <div className="flex items-center gap-3 mb-1">
                  <div className="size-9 rounded-[10px] bg-p-bg-subtle flex items-center justify-center text-p-text-secondary shrink-0">
                    <GraduationCap size={16} />
                  </div>
                  <div>
                    <DialogTitle className="text-[15px] font-bold text-p-text-primary tracking-[-0.02em]">Nuevo curso</DialogTitle>
                    <p className="text-[12.5px] text-p-text-secondary mt-px">Vincula una materia con un aula y año académico</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="px-6 py-5">
                <CourseForm
                  form={createForm}
                  classroomsData={classrooms.data}
                  subjectsData={subjects.data}
                  academicYearsData={academicYears.data}
                  onSubmit={onSubmitCreate}
                  loading={createCourse.isPending}
                  submitLabel="Crear curso"
                />
              </div>
            </DialogContent>
          </Dialog>
        </RoleGate>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Buscar por aula, materia o año..." />

      <Table stack>
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
              <TableRow key={`skeleton-${i}`}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              </TableRow>
            ))
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="p-0">
                <EmptyState
                  icon={BookOpen}
                  title={query ? 'Sin resultados' : 'No hay cursos'}
                  description={query ? `No encontramos cursos para "${query}".` : 'Crea el primer curso para este ciclo.'}
                />
              </TableCell>
            </TableRow>
          ) : (
            pagination.paginated.map((course) => {
              const teacherMember = members.data?.find((m) => m.id === course.teacherMemberId);
              return (
                <TableRow key={course.id}>
                  <TableCell data-label="Aula">{findName(classrooms.data, course.classroomId)}</TableCell>
                  <TableCell data-label="Materia">{findName(subjects.data, course.subjectId)}</TableCell>
                  <TableCell data-label="Año Académico">{findName(academicYears.data, course.academicYearId)}</TableCell>
                  <TableCell data-label="Docente" className="text-muted-foreground">
                    {teacherMember ? `Prof. ${teacherMember.fullName}` : <span className="italic">Sin asignar</span>}
                  </TableCell>
                  <TableCell data-label="Creación">
                    {course.createdAt ? format(new Date(course.createdAt), 'dd/MM/yyyy') : '—'}
                  </TableCell>
                  <TableCell data-label="">
                    <RoleGate roles={['director']}>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" title="Asignar docente" aria-label="Asignar docente" onClick={() => setAssigningItem(course)}>
                          <UserCog className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Editar" aria-label="Editar curso" onClick={() => setEditingItem(course)}>
                          <Pencil className="size-4" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Eliminar" aria-label="Eliminar curso" onClick={() => setDeletingItem(course)}>
                          <Trash2 className="size-4" />
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

      {/* Edit dialog */}
      <Dialog open={!!editingItem} onOpenChange={(v) => { if (!v) { editForm.reset(); setEditingItem(null); } }}>
        <DialogContent className="max-w-[480px] p-0 overflow-hidden gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-p-border">
            <div className="flex items-center gap-3 mb-1">
              <div className="size-9 rounded-[10px] bg-p-bg-subtle flex items-center justify-center text-p-text-secondary shrink-0">
                <GraduationCap size={16} />
              </div>
              <div>
                <DialogTitle className="text-[15px] font-bold text-p-text-primary tracking-[-0.02em]">Editar curso</DialogTitle>
                <p className="text-[12.5px] text-p-text-secondary mt-px">
                  {editingItem ? `${findName(subjects.data, editingItem.subjectId)} · ${findName(classrooms.data, editingItem.classroomId)}` : ''}
                </p>
              </div>
            </div>
          </DialogHeader>
          <div className="px-6 py-5">
            {editingItem && (
              <CourseForm
                key={editingItem.id}
                form={editForm}
                classroomsData={classrooms.data}
                subjectsData={subjects.data}
                academicYearsData={academicYears.data}
                onSubmit={onSubmitEdit}
                loading={updateCourse.isPending}
                submitLabel="Guardar cambios"
                onCancel={() => { editForm.reset(); setEditingItem(null); }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deletingItem}
        onOpenChange={(v) => !v && setDeletingItem(null)}
        onConfirm={onConfirmDelete}
        title="Eliminar curso"
        description={`¿Eliminar el curso de ${deletingItem ? findName(subjects.data, deletingItem.subjectId) : ''}? Se perderán las inscripciones asociadas.`}
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
