import { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Calendar, CalendarRange, CheckCircle2 } from 'lucide-react';
import { useAcademicYears, useCreateAcademicYear, useUpdateAcademicYear, useDeleteAcademicYear } from '@/hooks/useAcademicYears';
import { createAcademicYearSchema, updateAcademicYearSchema } from '@/schemas/academicYears';
import { showApiError } from '@/lib/errors';
import { usePagination } from '@/hooks/usePagination';
import { useSorting } from '@/hooks/useSorting';
import { RoleGate } from '@/components/RoleGate';
import { SortableHead } from '@/components/SortableHead';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { SearchInput } from '@/components/SearchInput';
import { DataTablePagination } from '@/components/DataTablePagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

function toDateInputValue(date) {
  if (!date) return '';
  return format(new Date(date), 'yyyy-MM-dd');
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

/* ── Academic year form ── */
function AcademicYearForm({ form, onSubmit, loading, submitLabel, onCancel }) {
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = form;
  const isCurrent = watch('isCurrent');

  const inputCls = 'w-full px-[10px] py-[9px] rounded-[10px] border border-p-border bg-p-bg-base text-p-text-primary text-[13.5px] font-[inherit] outline-none transition-[border-color] duration-[120ms] focus:border-p-border-strong';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field label="Nombre del ciclo *" error={errors.name?.message}>
        <div className="relative">
          <Calendar size={14} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-p-text-tertiary pointer-events-none" />
          <input placeholder="Ej: 2025–2026" className={cn(inputCls, 'pl-[32px]')} {...register('name')} />
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha de inicio *" error={errors.startDate?.message}>
          <input type="date" className={inputCls} {...register('startDate')} />
        </Field>
        <Field label="Fecha de fin *" error={errors.endDate?.message}>
          <input type="date" className={inputCls} {...register('endDate')} />
        </Field>
      </div>

      {/* isCurrent toggle */}
      <button
        type="button"
        onClick={() => setValue('isCurrent', !isCurrent, { shouldDirty: true })}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-[12px] border-[1.5px] text-left transition-all duration-150 cursor-pointer',
          isCurrent
            ? 'border-p-s-500 bg-p-s-100'
            : 'border-p-border bg-p-bg-subtle hover:border-p-border-strong',
        )}
      >
        <div className={cn(
          'size-5 rounded-full flex items-center justify-center shrink-0 transition-colors',
          isCurrent ? 'bg-p-s-500 text-white' : 'bg-p-bg-muted text-p-text-tertiary',
        )}>
          <CheckCircle2 size={12} />
        </div>
        <div>
          <div className={cn('text-[13.5px] font-semibold', isCurrent ? 'text-p-s-700' : 'text-p-text-primary')}>
            Año académico actual
          </div>
          <div className="text-[12px] text-p-text-secondary mt-px">
            {isCurrent ? 'Este ciclo aparecerá como activo en toda la plataforma' : 'Marcar como el ciclo vigente'}
          </div>
        </div>
      </button>

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

export default function AcademicYearsPage() {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [query, setQuery] = useState('');

  const academicYears = useAcademicYears();
  const createAcademicYear = useCreateAcademicYear();
  const updateAcademicYear = useUpdateAcademicYear();
  const deleteAcademicYear = useDeleteAcademicYear();

  const createForm = useForm({
    resolver: zodResolver(createAcademicYearSchema),
    defaultValues: { name: '', startDate: '', endDate: '', isCurrent: false },
  });

  const editForm = useForm({
    resolver: zodResolver(updateAcademicYearSchema),
    defaultValues: { name: '', startDate: '', endDate: '', isCurrent: false },
  });

  useEffect(() => {
    if (academicYears.error) showApiError(academicYears.error);
  }, [academicYears.error]);

  useEffect(() => {
    if (editingItem) {
      editForm.reset({
        name: editingItem.name,
        startDate: toDateInputValue(editingItem.startDate),
        endDate: toDateInputValue(editingItem.endDate),
        isCurrent: editingItem.isCurrent ?? false,
      });
    }
  }, [editingItem]);

  const sorting = useSorting('startDate');

  const filtered = useMemo(() => {
    const data = academicYears.data ?? [];
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((y) => y.name.toLowerCase().includes(q));
  }, [academicYears.data, query]);

  const sorted = useMemo(() => sorting.sort(filtered), [filtered, sorting.sort]);
  const pagination = usePagination(sorted);

  const onSubmitCreate = async (data) => {
    try {
      await createAcademicYear.mutateAsync(data);
      createForm.reset();
      setOpen(false);
    } catch { /* handled by hook */ }
  };

  const onSubmitEdit = async (data) => {
    try {
      await updateAcademicYear.mutateAsync({ id: editingItem.id, ...data });
      setEditingItem(null);
    } catch { /* handled by hook */ }
  };

  const onConfirmDelete = async () => {
    try {
      await deleteAcademicYear.mutateAsync(deletingItem.id);
      setDeletingItem(null);
    } catch { /* handled by hook */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Años Académicos</h1>

        <RoleGate roles={['director']}>
          <Dialog open={open} onOpenChange={(v) => { if (!v) createForm.reset(); setOpen(v); }}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1 size-4" />Crear Año Académico</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[480px] p-0 overflow-hidden gap-0">
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-p-border">
                <div className="flex items-center gap-3 mb-1">
                  <div className="size-9 rounded-[10px] bg-p-bg-subtle flex items-center justify-center text-p-text-secondary shrink-0">
                    <CalendarRange size={16} />
                  </div>
                  <div>
                    <DialogTitle className="text-[15px] font-bold text-p-text-primary tracking-[-0.02em]">Nuevo año académico</DialogTitle>
                    <p className="text-[12.5px] text-p-text-secondary mt-px">Define el ciclo escolar y sus fechas</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="px-6 py-5">
                <AcademicYearForm
                  form={createForm}
                  onSubmit={onSubmitCreate}
                  loading={createAcademicYear.isPending}
                  submitLabel="Crear año académico"
                />
              </div>
            </DialogContent>
          </Dialog>
        </RoleGate>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre..." />

      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead field="name" label="Nombre" sorting={sorting} />
            <SortableHead field="startDate" label="Inicio" sorting={sorting} />
            <SortableHead field="endDate" label="Fin" sorting={sorting} />
            <TableHead>Estado</TableHead>
            <SortableHead field="createdAt" label="Creado" sorting={sorting} />
            <RoleGate roles={['director']}>
              <TableHead className="w-24">Acciones</TableHead>
            </RoleGate>
          </TableRow>
        </TableHeader>
        <TableBody>
          {academicYears.isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              </TableRow>
            ))
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                {query ? `Sin resultados para "${query}"` : 'No hay años académicos registrados'}
              </TableCell>
            </TableRow>
          ) : (
            pagination.paginated.map((year) => (
              <TableRow key={year.id}>
                <TableCell className="font-medium">{year.name}</TableCell>
                <TableCell>{year.startDate ? format(new Date(year.startDate), 'dd/MM/yyyy') : '—'}</TableCell>
                <TableCell>{year.endDate ? format(new Date(year.endDate), 'dd/MM/yyyy') : '—'}</TableCell>
                <TableCell>
                  {year.isCurrent ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-p-s-100 text-p-s-700">
                      <span className="size-1.5 rounded-full bg-p-s-500" />
                      Actual
                    </span>
                  ) : (
                    <span className="text-[12px] text-p-text-tertiary">-</span>
                  )}
                </TableCell>
                <TableCell>{year.createdAt ? format(new Date(year.createdAt), 'dd/MM/yyyy') : '—'}</TableCell>
                <TableCell>
                  <RoleGate roles={['director']}>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditingItem(year)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingItem(year)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </RoleGate>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {!academicYears.isLoading && filtered.length > 0 && (
        <DataTablePagination {...pagination} total={filtered.length} />
      )}

      {/* Edit dialog */}
      <Dialog open={!!editingItem} onOpenChange={(v) => { if (!v) { editForm.reset(); setEditingItem(null); } }}>
        <DialogContent className="max-w-[480px] p-0 overflow-hidden gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-p-border">
            <div className="flex items-center gap-3 mb-1">
              <div className="size-9 rounded-[10px] bg-p-bg-subtle flex items-center justify-center text-p-text-secondary shrink-0">
                <CalendarRange size={16} />
              </div>
              <div>
                <DialogTitle className="text-[15px] font-bold text-p-text-primary tracking-[-0.02em]">Editar año académico</DialogTitle>
                <p className="text-[12.5px] text-p-text-secondary mt-px">{editingItem?.name}</p>
              </div>
            </div>
          </DialogHeader>
          <div className="px-6 py-5">
            <AcademicYearForm
              form={editForm}
              onSubmit={onSubmitEdit}
              loading={updateAcademicYear.isPending}
              submitLabel="Guardar cambios"
              onCancel={() => { editForm.reset(); setEditingItem(null); }}
            />
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deletingItem}
        onOpenChange={(v) => !v && setDeletingItem(null)}
        onConfirm={onConfirmDelete}
        title="Eliminar año académico"
        description={`¿Eliminar "${deletingItem?.name}"? Los cursos asociados a este ciclo perderán su referencia.`}
        isPending={deleteAcademicYear.isPending}
      />
    </div>
  );
}
