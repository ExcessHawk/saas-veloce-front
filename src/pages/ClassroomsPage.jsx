import { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { useClassrooms, useCreateClassroom, useUpdateClassroom, useDeleteClassroom } from '@/hooks/useClassrooms';
import { useGradeLevels, useCreateGradeLevel, useUpdateGradeLevel, useDeleteGradeLevel } from '@/hooks/useGradeLevels';
import { showApiError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { SearchInput } from '@/components/SearchInput';
import { DataTablePagination } from '@/components/DataTablePagination';
import { RoleGate } from '@/components/RoleGate';
import { SortableHead } from '@/components/SortableHead';
import { usePagination } from '@/hooks/usePagination';
import { useSorting } from '@/hooks/useSorting';
import { format } from 'date-fns';

/* ── Grade Level selector ── */
function GradeLevelSelect({ value, onChange, levels }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full px-[10px] py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] text-sm font-[inherit]"
    >
      <option value="">— Sin nivel —</option>
      {(levels ?? []).map((l) => (
        <option key={l.id} value={l.id}>{l.name}</option>
      ))}
    </select>
  );
}

/* ── Classroom form ── */
function ClassroomForm({ initial, levels, onSave, onCancel, loading, submitLabel }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [gradeLevelId, setGradeLevelId] = useState(initial?.gradeLevelId ?? null);
  const [capacity, setCapacity] = useState(initial?.capacity ?? '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('El nombre es requerido'); return; }
    onSave({ name: name.trim(), gradeLevelId: gradeLevelId || null, capacity: capacity ? Number(capacity) : null });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Nombre</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Aula 1-A" />
      </div>
      <div>
        <Label>Nivel de Grado</Label>
        <GradeLevelSelect value={gradeLevelId} onChange={setGradeLevelId} levels={levels} />
        {levels?.length === 0 && (
          <p className="text-xs text-muted-foreground mt-1">No hay niveles creados. Crea uno en la sección "Niveles de Grado".</p>
        )}
      </div>
      <div>
        <Label>Capacidad (alumnos)</Label>
        <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="Ej: 30" />
      </div>
      <div className="flex gap-2">
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? 'Guardando…' : submitLabel}
        </Button>
        {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancelar</Button>}
      </div>
    </form>
  );
}

/* ── Grade Level management panel ── */
function GradeLevelsPanel() {
  const { data: levels, isLoading } = useGradeLevels();
  const createLevel = useCreateGradeLevel();
  const updateLevel = useUpdateGradeLevel();
  const deleteLevel = useDeleteGradeLevel();

  const [newName, setNewName] = useState('');
  const [newOrder, setNewOrder] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editOrder, setEditOrder] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await createLevel.mutateAsync({ name: newName.trim(), order: newOrder ? Number(newOrder) : 0 });
      setNewName(''); setNewOrder('');
    } catch { /* handled */ }
  };

  const handleUpdate = async (id) => {
    try {
      await updateLevel.mutateAsync({ id, name: editName, order: editOrder ? Number(editOrder) : 0 });
      setEditId(null);
    } catch { /* handled */ }
  };

  return (
    <div className="bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-[14px]">
        <GraduationCap size={15} />
        <span className="text-sm font-semibold">Niveles de Grado</span>
      </div>

      <form onSubmit={handleCreate} className="flex gap-2 mb-3">
        <Input
          value={newName} onChange={(e) => setNewName(e.target.value)}
          placeholder="Ej: 1° Primaria" className="flex-1"
        />
        <Input
          type="number" min={0} value={newOrder} onChange={(e) => setNewOrder(e.target.value)}
          placeholder="Orden" className="w-[72px]"
        />
        <Button type="submit" size="sm" disabled={!newName.trim() || createLevel.isPending}>
          <Plus size={14} />
        </Button>
      </form>

      {isLoading ? (
        <Skeleton className="h-8 w-full" />
      ) : levels?.length === 0 ? (
        <p className="text-[13px] text-[hsl(var(--muted-foreground))]">Sin niveles. Crea el primero arriba.</p>
      ) : (
        <div className="flex flex-col gap-[6px]">
          {levels.map((l) => (
            <div key={l.id} className="flex items-center gap-2 px-[10px] py-[6px] bg-[hsl(var(--muted))] rounded-lg">
              {editId === l.id ? (
                <>
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 h-7 text-[13px]" />
                  <Input type="number" min={0} value={editOrder} onChange={(e) => setEditOrder(e.target.value)} className="w-[60px] h-7 text-[13px]" />
                  <Button size="sm" variant="outline" className="h-7 text-[12px]" onClick={() => handleUpdate(l.id)} disabled={updateLevel.isPending}>OK</Button>
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditId(null)}>✕</Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-[13px]">{l.name}</span>
                  <span className="text-[11px] text-[hsl(var(--muted-foreground))]">orden {l.order}</span>
                  <Button size="sm" variant="ghost" className="h-[26px] w-[26px] p-0"
                    onClick={() => { setEditId(l.id); setEditName(l.name); setEditOrder(String(l.order)); }}>
                    <Pencil size={12} />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-[26px] w-[26px] p-0 text-[hsl(var(--destructive))]"
                    onClick={() => deleteLevel.mutateAsync(l.id)}>
                    <Trash2 size={12} />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ══ Page ══ */
export default function ClassroomsPage() {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [query, setQuery] = useState('');

  const classrooms = useClassrooms();
  const { data: levels } = useGradeLevels();
  const createClassroom = useCreateClassroom();
  const updateClassroom = useUpdateClassroom();
  const deleteClassroom = useDeleteClassroom();

  useEffect(() => { if (classrooms.error) showApiError(classrooms.error); }, [classrooms.error]);

  const levelMap = useMemo(() => Object.fromEntries((levels ?? []).map((l) => [l.id, l.name])), [levels]);

  const sorting = useSorting('name');

  const filtered = useMemo(() => {
    const data = classrooms.data ?? [];
    if (!query.trim()) return data;
    const q = query.toLowerCase();
    return data.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (levelMap[c.gradeLevelId] || '').toLowerCase().includes(q)
    );
  }, [classrooms.data, query, levelMap]);

  const sorted = useMemo(() => sorting.sort(filtered), [filtered, sorting.sort]);
  const pagination = usePagination(sorted);

  const handleCreate = async (data) => {
    try { await createClassroom.mutateAsync(data); setOpen(false); } catch { /* handled */ }
  };

  const handleUpdate = async (data) => {
    try { await updateClassroom.mutateAsync({ id: editingItem.id, ...data }); setEditingItem(null); } catch { /* handled */ }
  };

  const handleDelete = async () => {
    try { await deleteClassroom.mutateAsync(deletingItem.id); setDeletingItem(null); } catch { /* handled */ }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Aulas</h1>
          <p className="text-sm text-muted-foreground mt-1">Espacios físicos donde ocurren los cursos. Asigna nivel de grado y capacidad.</p>
        </div>
        <RoleGate roles={['director']}>
          <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1 h-4 w-4" />Crear Aula</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Crear Aula</DialogTitle></DialogHeader>
              <ClassroomForm levels={levels} onSave={handleCreate} loading={createClassroom.isPending} submitLabel="Crear Aula" />
            </DialogContent>
          </Dialog>
        </RoleGate>
      </div>

      <div className="grid gap-5 items-start [grid-template-columns:1fr_320px]">
        <div className="space-y-4">
          <SearchInput value={query} onChange={setQuery} placeholder="Buscar por nombre o nivel…" />

          <Table>
            <TableHeader>
              <TableRow>
                <SortableHead field="name" label="Nombre" sorting={sorting} />
                <TableHead>Nivel de Grado</TableHead>
                <TableHead>Capacidad</TableHead>
                <SortableHead field="createdAt" label="Creada" sorting={sorting} />
                <RoleGate roles={['director']}><TableHead className="w-24">Acciones</TableHead></RoleGate>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classrooms.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {[1,2,3,4].map((j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {query ? `Sin resultados para "${query}"` : 'No hay aulas registradas'}
                  </TableCell>
                </TableRow>
              ) : (
                pagination.paginated.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{levelMap[c.gradeLevelId] ?? '—'}</TableCell>
                    <TableCell>{c.capacity ? `${c.capacity} alumnos` : '—'}</TableCell>
                    <TableCell>{c.createdAt ? format(new Date(c.createdAt), 'dd/MM/yyyy') : '—'}</TableCell>
                    <TableCell>
                      <RoleGate roles={['director']}>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" onClick={() => setEditingItem(c)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingItem(c)}><Trash2 className="h-4 w-4" /></Button>
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
        </div>

        <RoleGate roles={['director']}>
          <GradeLevelsPanel />
        </RoleGate>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editingItem} onOpenChange={(v) => !v && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Aula</DialogTitle></DialogHeader>
          {editingItem && (
            <ClassroomForm
              initial={editingItem}
              levels={levels}
              onSave={handleUpdate}
              onCancel={() => setEditingItem(null)}
              loading={updateClassroom.isPending}
              submitLabel="Guardar Cambios"
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deletingItem}
        onOpenChange={(v) => !v && setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Eliminar Aula"
        description={`¿Eliminar "${deletingItem?.name}"? Se desvinculará de los cursos que la usan.`}
        isPending={deleteClassroom.isPending}
      />
    </div>
  );
}
