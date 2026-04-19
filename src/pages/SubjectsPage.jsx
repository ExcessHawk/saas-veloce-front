import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
            <DialogContent>
              <DialogHeader><DialogTitle>Crear Materia</DialogTitle></DialogHeader>
              <form onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre</Label>
                  <Input id="name" placeholder="Ej: Matemáticas" {...createForm.register('name')} />
                  {createForm.formState.errors.name && (
                    <p className="text-sm text-red-500 mt-1">{createForm.formState.errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="code">Código</Label>
                  <Input id="code" placeholder="Ej: MAT-101" {...createForm.register('code')} />
                </div>
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input id="color" placeholder="Ej: #3B82F6" {...createForm.register('color')} />
                </div>
                <div>
                  <Label htmlFor="icon">Ícono</Label>
                  <Input id="icon" placeholder="Ej: calculator" {...createForm.register('icon')} />
                </div>
                <Button type="submit" className="w-full" disabled={createSubject.isPending}>
                  {createSubject.isPending ? 'Creando...' : 'Crear Materia'}
                </Button>
              </form>
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
                <TableCell>{subject.color || '—'}</TableCell>
                <TableCell>{subject.icon || '—'}</TableCell>
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
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Materia</DialogTitle></DialogHeader>
          <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Nombre</Label>
              <Input id="edit-name" {...editForm.register('name')} />
              {editForm.formState.errors.name && (
                <p className="text-sm text-red-500 mt-1">{editForm.formState.errors.name.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="edit-code">Código</Label>
              <Input id="edit-code" {...editForm.register('code')} />
            </div>
            <div>
              <Label htmlFor="edit-color">Color</Label>
              <Input id="edit-color" {...editForm.register('color')} />
            </div>
            <div>
              <Label htmlFor="edit-icon">Ícono</Label>
              <Input id="edit-icon" {...editForm.register('icon')} />
            </div>
            <Button type="submit" className="w-full" disabled={updateSubject.isPending}>
              {updateSubject.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </form>
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
