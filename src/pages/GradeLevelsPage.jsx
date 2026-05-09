import { useState } from 'react';
import { Plus, Pencil, Trash2, GraduationCap } from 'lucide-react';
import { useGradeLevels, useCreateGradeLevel, useUpdateGradeLevel, useDeleteGradeLevel } from '@/hooks/useGradeLevels';
import { ConfirmDeleteDialog } from '@/components/ConfirmDeleteDialog';
import { RoleGate } from '@/components/RoleGate';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

const inputCls = 'w-full px-[10px] py-[9px] rounded-[10px] border border-p-border bg-p-bg-base text-p-text-primary text-[13.5px] font-[inherit] outline-none transition-[border-color] duration-[120ms] focus:border-p-border-strong';

function InlineForm({ initial, onSave, onCancel, loading }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [order, setOrder] = useState(initial?.order != null ? String(initial.order) : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), order: order !== '' ? Number(order) : 0 });
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre del nivel"
        className={cn(inputCls, 'flex-1')}
        autoFocus
      />
      <input
        type="number"
        min={0}
        value={order}
        onChange={(e) => setOrder(e.target.value)}
        placeholder="Orden"
        className={cn(inputCls, 'w-[90px]')}
      />
      <button
        type="submit"
        disabled={!name.trim() || loading}
        className="px-4 py-[9px] rounded-[10px] bg-p-accent text-p-accent-text text-[13.5px] font-semibold border-none cursor-pointer disabled:opacity-50 whitespace-nowrap"
      >
        {loading ? 'Guardando…' : (initial ? 'Guardar' : 'Agregar')}
      </button>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-[9px] rounded-[10px] border border-p-border bg-p-bg-base text-p-text-secondary text-[13.5px] cursor-pointer"
        >
          Cancelar
        </button>
      )}
    </form>
  );
}

export default function GradeLevelsPage() {
  const { data: levels, isLoading } = useGradeLevels();
  const createLevel = useCreateGradeLevel();
  const updateLevel = useUpdateGradeLevel();
  const deleteLevel = useDeleteGradeLevel();

  const [editId, setEditId] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);

  const handleCreate = async (data) => {
    try {
      await createLevel.mutateAsync(data);
    } catch { /* handled */ }
  };

  const handleUpdate = async (data) => {
    try {
      await updateLevel.mutateAsync({ id: editId, ...data });
      setEditId(null);
    } catch { /* handled */ }
  };

  const handleDelete = async () => {
    try {
      await deleteLevel.mutateAsync(deletingItem.id);
      setDeletingItem(null);
    } catch { /* handled */ }
  };

  const sorted = [...(levels ?? [])].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Niveles de Grado</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define los niveles académicos de tu institución (ej. 1° Primaria, 2° Secundaria).
          </p>
        </div>
      </div>

      <RoleGate roles={['director']}>
        <div className="bg-p-bg-base border border-p-border rounded-2xl p-5">
          <div className="text-[13px] font-semibold text-p-text-secondary mb-3 flex items-center gap-2">
            <Plus size={14} /> Nuevo nivel
          </div>
          <InlineForm onSave={handleCreate} loading={createLevel.isPending} />
        </div>
      </RoleGate>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">#</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead className="w-24">Orden</TableHead>
            <RoleGate roles={['director']}>
              <TableHead className="w-24">Acciones</TableHead>
            </RoleGate>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <TableRow key={`skeleton-${i}`}>
                {[1, 2, 3].map((j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}
              </TableRow>
            ))
          ) : sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No hay niveles de grado registrados
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((level, idx) => (
              <TableRow key={level.id}>
                <TableCell className="text-p-text-tertiary text-[13px]">{idx + 1}</TableCell>
                <TableCell>
                  {editId === level.id ? (
                    <InlineForm
                      initial={level}
                      onSave={handleUpdate}
                      onCancel={() => setEditId(null)}
                      loading={updateLevel.isPending}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-[8px] bg-p-bg-subtle flex items-center justify-center shrink-0">
                        <GraduationCap size={13} className="text-p-text-secondary" />
                      </div>
                      <span className="text-[14px] font-medium text-p-text-primary">{level.name}</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {editId !== level.id && (
                    <span className="text-[12px] font-mono text-p-text-secondary bg-p-bg-subtle px-2 py-[2px] rounded">
                      {level.order}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <RoleGate roles={['director']}>
                    {editId !== level.id && (
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setEditId(level.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeletingItem(level)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </RoleGate>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ConfirmDeleteDialog
        open={!!deletingItem}
        onOpenChange={(v) => !v && setDeletingItem(null)}
        onConfirm={handleDelete}
        title="Eliminar Nivel de Grado"
        description={`¿Eliminar "${deletingItem?.name}"? Las aulas que lo usen quedarán sin nivel asignado.`}
        isPending={deleteLevel.isPending}
      />
    </div>
  );
}
