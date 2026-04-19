import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useClassrooms, useCreateClassroom, useUpdateClassroom, useDeleteClassroom } from '@/hooks/useClassrooms';
import { createClassroomSchema, updateClassroomSchema } from '@/schemas/classrooms';
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
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [query, setQuery] = useState('');

  const classrooms = useClassrooms();
  const createClassroom = useCreateClassroom();
  const updateClassroom = useUpdateClassroom();
  const deleteClassroom = useDeleteClassroom();

  const createForm = useForm({
    resolver: zodResolver(createClassroomSchema),
    defaultValues: { name: '', gradeLevel: '' },
  });

  const editForm = useForm({
    resolver: zodResolver(updateClassroomSchema),
    defaultValues: { name: '', gradeLevel: '' },
  });

  useEffect(() => {
    if (classrooms.error) showApiError(classrooms.error);
  }, [classrooms.error]);

  useEffect(() => {
    if (editingItem) {
      editForm.reset({ name: editingItem.name, gradeLevel: editingItem.gradeLevel || '' });
    }
  }, [editingItem]);

  const sorting = useSorting('name');

  const filtered = useMemo(() => {
    const data = classrooms.data ?? [];
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.gradeLevel || '').toLowerCase().includes(q),
    );
  }, [classrooms.data, query]);

  const sorted = useMemo(() => sorting.sort(filtered), [filtered, sorting.sort]);
  const pagination = usePagination(sorted);

  const onSubmitCreate = async (data) => {
    try {
      await createClassroom.mutateAsync(data);
      createForm.reset();
      setOpen(false);
    } catch { /* handled by hook */ }
  };

  const onSubmitEdit = async (data) => {
    try {
      await updateClassroom.mutateAsync({ id: editingItem.id, ...data });
      setEditingItem(null);
    } catch { /* handled by hook */ }
  };

  const onConfirmDelete = async () => {
    try {
      await deleteClassroom.mutateAsync(deletingItem.id);
      setDeletingItem(null);
    } catch { /* handled by hook */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Aulas</h1>

        <RoleGate roles={['director']}>
          <Dialog open={open} onOpenChange={(v) => { if (!v) createForm.reset(); setOpen(v); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1 h-4 w-4" />
                Crear Aula
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Crear Aula</DialogTitle></DialogHeader>
              <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" placeholder="Ej: Aula 101" {...createForm.register('name')} />
                  {createForm.formState.errors.name && (
                    <p className="text-sm text-red-500 mt-1">{createForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="gradeLevel">Nivel de Grado</Label>
                  <Input id="gradeLevel" placeholder="Ej: 1° Primaria" {...createForm.register('gradeLevel')} />
                </div>
                <Button type="submit" className="w-full" disabled={createClassroom.isPending}>
                  {createClassroom.isPending ? 'Creando...' : 'Crear Aula'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </RoleGate>
      </div>

      <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre o nivel..." />

      <Table>
        <TableHeader>
          <TableRow>
            <SortableHead field="name" label="Nombre" sorting={sorting} />
            <SortableHead field="gradeLevel" label="Nivel de Grado" sorting={sorting} />
            <SortableHead field="createdAt" label="Fecha de Creación" sorting={sorting} />
            <RoleGate roles={['director']}>
              <TableHead className="w-24">Acciones</TableHead>
            </RoleGate>
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
          ) : filtered.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                {query ? `Sin resultados para "${query}"` : 'No hay aulas registradas'}
              </TableCell>
            </TableRow>
          ) : (
            pagination.paginated.map((classroom) => (
              <TableRow key={classroom.id}>
                <TableCell>{classroom.name}</TableCell>
                <TableCell>{classroom.gradeLevel || '—'}</TableCell>
                <TableCell>
                  {classroom.createdAt ? format(new Date(classroom.createdAt), 'dd/MM/yyyy') : '—'}
                </TableCell>
                <TableCell>
                  <RoleGate roles={['director']}>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => setEditingItem(classroom)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeletingItem(classroom)}>
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

      {!classrooms.isLoading && filtered.length > 0 && (
        <DataTablePagination {...pagination} total={filtered.length} />
      )}

      <Dialog
        open={!!editingItem}
        onOpenChange={(v) => { if (!v) { editForm.reset(); setEditingItem(null); } }}
      >
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Aula</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre</Label>
              <Input id="edit-name" {...editForm.register('name')} />
              {editForm.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{editForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-gradeLevel">Nivel de Grado</Label>
              <Input id="edit-gradeLevel" {...editForm.register('gradeLevel')} />
            </div>
            <Button type="submit" className="w-full" disabled={updateClassroom.isPending}>
              {updateClassroom.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deletingItem}
        onOpenChange={(v) => !v && setDeletingItem(null)}
        onConfirm={onConfirmDelete}
        title="Eliminar Aula"
        description={`¿Estás seguro de que deseas eliminar "${deletingItem?.name}"? Esta acción no se puede deshacer.`}
        isPending={deleteClassroom.isPending}
      />
    </div>
  );
}
