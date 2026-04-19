import { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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

function toDateInputValue(date) {
  if (!date) return '';
  return format(new Date(date), 'yyyy-MM-dd');
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

  const DateFields = ({ register, control, errors }) => (
    <>
      <div>
        <Label htmlFor="startDate">Fecha de Inicio</Label>
        <Input id="startDate" type="date" {...register('startDate')} />
        {errors.startDate && <p className="text-sm text-red-500 mt-1">{errors.startDate.message}</p>}
      </div>
      <div>
        <Label htmlFor="endDate">Fecha de Fin</Label>
        <Input id="endDate" type="date" {...register('endDate')} />
        {errors.endDate && <p className="text-sm text-red-500 mt-1">{errors.endDate.message}</p>}
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
    </>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Años Académicos</h1>

        <RoleGate roles={['director']}>
          <Dialog open={open} onOpenChange={(v) => { if (!v) createForm.reset(); setOpen(v); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                Crear Año Académico
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Crear Año Académico</DialogTitle></DialogHeader>
              <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" placeholder="Ej: 2025" {...createForm.register('name')} />
                  {createForm.formState.errors.name && (
                    <p className="text-sm text-red-500 mt-1">{createForm.formState.errors.name.message}</p>
                  )}
                </div>
                <DateFields
                  register={createForm.register}
                  control={createForm.control}
                  errors={createForm.formState.errors}
                />
                <Button type="submit" className="w-full" disabled={createAcademicYear.isPending}>
                  {createAcademicYear.isPending ? 'Creando...' : 'Crear Año Académico'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </RoleGate>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre..." />

      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead field="name" label="Nombre" sorting={sorting} />
            <SortableHead field="startDate" label="Fecha de Inicio" sorting={sorting} />
            <SortableHead field="endDate" label="Fecha de Fin" sorting={sorting} />
            <TableHead>Actual</TableHead>
            <SortableHead field="createdAt" label="Fecha de Creación" sorting={sorting} />
            <RoleGate roles={['director']}>
              <TableHead className="w-24">Acciones</TableHead>
            </RoleGate>
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
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                {query ? `Sin resultados para "${query}"` : 'No hay años académicos registrados'}
              </TableCell>
            </TableRow>
          ) : (
            pagination.paginated.map((year) => (
              <TableRow key={year.id}>
                <TableCell>{year.name}</TableCell>
                <TableCell>{year.startDate ? format(new Date(year.startDate), 'dd/MM/yyyy') : '—'}</TableCell>
                <TableCell>{year.endDate ? format(new Date(year.endDate), 'dd/MM/yyyy') : '—'}</TableCell>
                <TableCell>
                  <Badge variant={year.isCurrent ? 'default' : 'secondary'}>
                    {year.isCurrent ? 'Sí' : 'No'}
                  </Badge>
                </TableCell>
                <TableCell>{year.createdAt ? format(new Date(year.createdAt), 'dd/MM/yyyy') : '—'}</TableCell>
                <TableCell>
                  <RoleGate roles={['director']}>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditingItem(year)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingItem(year)}>
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

      {!academicYears.isLoading && filtered.length > 0 && (
        <DataTablePagination {...pagination} total={filtered.length} />
      )}

      <Dialog
        open={!!editingItem}
        onOpenChange={(v) => { if (!v) { editForm.reset(); setEditingItem(null); } }}
      >
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Año Académico</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre</Label>
              <Input id="edit-name" {...editForm.register('name')} />
              {editForm.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{editForm.formState.errors.name.message}</p>
              )}
            </div>
            <DateFields
              register={editForm.register}
              control={editForm.control}
              errors={editForm.formState.errors}
            />
            <Button type="submit" className="w-full" disabled={updateAcademicYear.isPending}>
              {updateAcademicYear.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deletingItem}
        onOpenChange={(v) => !v && setDeletingItem(null)}
        onConfirm={onConfirmDelete}
        title="Eliminar Año Académico"
        description={`¿Estás seguro de que deseas eliminar "${deletingItem?.name}"? Esta acción no se puede deshacer.`}
        isPending={deleteAcademicYear.isPending}
      />
    </div>
  );
}
