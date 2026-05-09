import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, BookOpen, Hash, Palette } from 'lucide-react';
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from '@/hooks/useSubjects';
import { createSubjectSchema, updateSubjectSchema } from '@/schemas/subjects';
import { showApiError } from '@/lib/errors';
import { usePagination } from '@/hooks/usePagination';
import { useSorting } from '@/hooks/useSorting';
import { RoleGate } from '@/components/RoleGate';
import { SortableHead } from '@/components/SortableHead';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { SearchInput } from '@/components/SearchInput';
import { DataTablePagination } from '@/components/DataTablePagination';
import { IconPicker, LucideIcon } from '@/components/IconPicker';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

/* ── Preset colors for subjects ── */
const PRESET_COLORS = [
  { label: 'Azul',    value: 'oklch(91% 0.040 250)' },
  { label: 'Verde',   value: 'oklch(93% 0.040 150)' },
  { label: 'Naranja', value: 'oklch(93% 0.050 75)'  },
  { label: 'Morado',  value: 'oklch(93% 0.035 300)' },
  { label: 'Rosa',    value: 'oklch(93% 0.040 330)' },
  { label: 'Cian',    value: 'oklch(92% 0.040 200)' },
  { label: 'Rojo',    value: 'oklch(93% 0.050 25)'  },
  { label: 'Amarillo',value: 'oklch(95% 0.060 90)'  },
];

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

/* ── Subject form ── */
function SubjectForm({ form, onSubmit, loading, submitLabel, onCancel }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = form;
  const selectedColor = watch('color');

  const inputCls = 'w-full px-[10px] py-[9px] rounded-[10px] border border-p-border bg-p-bg-base text-p-text-primary text-[13.5px] font-[inherit] outline-none transition-[border-color] duration-[120ms] focus:border-p-border-strong';

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Field label="Nombre *" error={errors.name?.message}>
        <div className="relative">
          <BookOpen size={14} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-p-text-tertiary pointer-events-none" />
          <input placeholder="Ej: Matemáticas" className={cn(inputCls, 'pl-[32px]')} autoFocus {...register('name')} />
        </div>
      </Field>

      <Field label="Código" hint="Identificador corto, ej: MAT-101">
        <div className="relative">
          <Hash size={14} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-p-text-tertiary pointer-events-none" />
          <input placeholder="Ej: MAT-101" className={cn(inputCls, 'pl-[32px]')} {...register('code')} />
        </div>
      </Field>

      <Field label="Ícono" hint="Ícono visual para identificar la materia">
        <IconPicker
          value={watch('icon') || ''}
          onChange={(v) => setValue('icon', v)}
          placeholder="Seleccionar ícono"
        />
      </Field>

      <Field label="Color de identificación">
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              title={c.label}
              onClick={() => setValue('color', selectedColor === c.value ? '' : c.value)}
              className={cn(
                'w-7 h-7 rounded-full border-2 transition-[transform,box-shadow] duration-100',
                selectedColor === c.value
                  ? 'border-p-text-primary scale-110 shadow-[0_0_0_2px_var(--p-bg-base),0_0_0_4px_var(--p-text-primary)]'
                  : 'border-transparent hover:scale-105',
              )}
              style={{ background: c.value }}
            />
          ))}
          {selectedColor && !PRESET_COLORS.find((c) => c.value === selectedColor) && (
            <div className="w-7 h-7 rounded-full border-2 border-p-text-primary" style={{ background: selectedColor }} />
          )}
        </div>
        {selectedColor && (
          <div className="flex items-center gap-2 mt-2 px-3 py-[6px] bg-p-bg-subtle rounded-[8px] border border-p-border">
            <div className="w-3 h-3 rounded-full shrink-0" style={{ background: selectedColor }} />
            <span className="text-[12px] text-p-text-secondary font-mono">{selectedColor}</span>
            <button type="button" onClick={() => setValue('color', '')} className="ml-auto text-p-text-tertiary text-[13px] border-none bg-transparent cursor-pointer">×</button>
          </div>
        )}
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

export default function SubjectsPage() {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [query, setQuery] = useState('');

  const subjects = useSubjects();
  const createSubject = useCreateSubject();
  const updateSubject = useUpdateSubject();
  const deleteSubject = useDeleteSubject();

  const createForm = useForm({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: { name: '', code: '', color: '', icon: '' },
  });

  const editForm = useForm({
    resolver: zodResolver(updateSubjectSchema),
    defaultValues: { name: '', code: '', color: '', icon: '' },
  });

  useEffect(() => {
    if (subjects.error) showApiError(subjects.error);
  }, [subjects.error]);

  useEffect(() => {
    if (editingItem) {
      editForm.reset({
        name: editingItem.name,
        code: editingItem.code || '',
        color: editingItem.color || '',
        icon: editingItem.icon || '',
      });
    }
  }, [editingItem]);

  const sorting = useSorting('name');

  const filtered = useMemo(() => {
    const data = subjects.data ?? [];
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter(
      (s) => s.name.toLowerCase().includes(q) || (s.code || '').toLowerCase().includes(q),
    );
  }, [subjects.data, query]);

  const sorted = useMemo(() => sorting.sort(filtered), [filtered, sorting.sort]);
  const pagination = usePagination(sorted);

  const onSubmitCreate = async (data) => {
    try {
      await createSubject.mutateAsync(data);
      createForm.reset();
      setOpen(false);
    } catch { /* handled by hook */ }
  };

  const onSubmitEdit = async (data) => {
    try {
      await updateSubject.mutateAsync({ id: editingItem.id, ...data });
      setEditingItem(null);
    } catch { /* handled by hook */ }
  };

  const onConfirmDelete = async () => {
    try {
      await deleteSubject.mutateAsync(deletingItem.id);
      setDeletingItem(null);
    } catch { /* handled by hook */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Materias</h1>

        <RoleGate roles={['director']}>
          <Dialog open={open} onOpenChange={(v) => { if (!v) createForm.reset(); setOpen(v); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                Crear Materia
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[480px] p-0 overflow-hidden gap-0">
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-p-border">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-9 h-9 rounded-[10px] bg-p-bg-subtle flex items-center justify-center text-p-text-secondary shrink-0">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <DialogTitle className="text-[15px] font-bold text-p-text-primary tracking-[-0.02em]">Nueva materia</DialogTitle>
                    <p className="text-[12.5px] text-p-text-secondary mt-px">Agrega una materia al catálogo de tu escuela</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="px-6 py-5">
                <SubjectForm
                  form={createForm}
                  onSubmit={onSubmitCreate}
                  loading={createSubject.isPending}
                  submitLabel="Crear materia"
                />
              </div>
            </DialogContent>
          </Dialog>
        </RoleGate>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre o código..." />

      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead field="name" label="Nombre" sorting={sorting} />
            <SortableHead field="code" label="Código" sorting={sorting} />
            <TableHead>Color</TableHead>
            <TableHead>Ícono</TableHead>
            <SortableHead field="createdAt" label="Fecha de Creación" sorting={sorting} />
            <RoleGate roles={['director']}>
              <TableHead className="w-24">Acciones</TableHead>
            </RoleGate>
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
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                {query ? `Sin resultados para "${query}"` : 'No hay materias registradas'}
              </TableCell>
            </TableRow>
          ) : (
            pagination.paginated.map((subject) => (
              <TableRow key={subject.id}>
                <TableCell>{subject.name}</TableCell>
                <TableCell>{subject.code || '—'}</TableCell>
                <TableCell>
                  {subject.color ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border border-p-border shrink-0" style={{ background: subject.color }} />
                      <span className="text-[12px] font-mono text-p-text-tertiary">{subject.code || '—'}</span>
                    </div>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  {subject.icon ? (
                    <div className="flex items-center gap-2">
                      <LucideIcon name={subject.icon} size={15} className="text-p-text-secondary shrink-0" />
                      <span className="text-[12px] text-p-text-tertiary">{subject.icon}</span>
                    </div>
                  ) : '—'}
                </TableCell>
                <TableCell>
                  {subject.createdAt ? format(new Date(subject.createdAt), 'dd/MM/yyyy') : '—'}
                </TableCell>
                <TableCell>
                  <RoleGate roles={['director']}>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditingItem(subject)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingItem(subject)}>
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

      {!subjects.isLoading && filtered.length > 0 && (
        <DataTablePagination {...pagination} total={filtered.length} />
      )}

      <Dialog
        open={!!editingItem}
        onOpenChange={(v) => { if (!v) { editForm.reset(); setEditingItem(null); } }}
      >
        <DialogContent className="max-w-[480px] p-0 overflow-hidden gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-p-border">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-9 h-9 rounded-[10px] bg-p-bg-subtle flex items-center justify-center text-p-text-secondary shrink-0">
                <BookOpen size={16} />
              </div>
              <div>
                <DialogTitle className="text-[15px] font-bold text-p-text-primary tracking-[-0.02em]">Editar materia</DialogTitle>
                <p className="text-[12.5px] text-p-text-secondary mt-px">{editingItem?.name}</p>
              </div>
            </div>
          </DialogHeader>
          <div className="px-6 py-5">
            <SubjectForm
              form={editForm}
              onSubmit={onSubmitEdit}
              loading={updateSubject.isPending}
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
        title="Eliminar Materia"
        description={`¿Estás seguro de que deseas eliminar "${deletingItem?.name}"? Esta acción no se puede deshacer.`}
        isPending={deleteSubject.isPending}
      />
    </div>
  );
}
