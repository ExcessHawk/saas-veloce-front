import { useState, useMemo, useEffect } from 'react';
import { Plus, Pencil, Trash2, GraduationCap, DoorOpen, Users, UserPlus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useClassrooms, useCreateClassroom, useUpdateClassroom, useDeleteClassroom, useClassroomStudents, useAddClassroomStudent, useRemoveClassroomStudent } from '@/hooks/useClassrooms';
import { useGradeLevels, useCreateGradeLevel, useUpdateGradeLevel, useDeleteGradeLevel } from '@/hooks/useGradeLevels';
import { useAcademicYears } from '@/hooks/useAcademicYears';
import { useMembers } from '@/hooks/useMembers';
import { showApiError } from '@/lib/errors';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { cn } from '@/lib/utils';

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

/* ── Grade Level selector ── */
function GradeLevelSelect({ value, onChange, levels }) {
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || null)}
      className="w-full px-[10px] py-[9px] rounded-[10px] border border-p-border bg-p-bg-base text-p-text-primary text-[13.5px] font-[inherit] outline-none transition-[border-color] duration-[120ms] focus:border-p-border-strong"
    >
      <option value="">Sin nivel</option>
      {(levels ?? []).map((l) => (
        <option key={l.id} value={l.id}>{l.name}</option>
      ))}
    </select>
  );
}

/* ── Classroom form ── */
function ClassroomForm({ initial, levels, academicYears, teachers, onSave, onCancel, loading, submitLabel }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [gradeLevelId, setGradeLevelId] = useState(initial?.gradeLevelId ?? null);
  const [academicYearId, setAcademicYearId] = useState(initial?.academicYearId ?? null);
  const [tutorMemberId, setTutorMemberId] = useState(initial?.tutorMemberId ?? null);
  const [capacity, setCapacity] = useState(initial?.capacity ?? '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('El nombre es requerido'); return; }
    onSave({
      name: name.trim(),
      gradeLevelId: gradeLevelId || null,
      academicYearId: academicYearId || null,
      tutorMemberId: tutorMemberId || null,
      capacity: capacity ? Number(capacity) : null,
    });
  };

  const inputCls = 'w-full px-[10px] py-[9px] rounded-[10px] border border-p-border bg-p-bg-base text-p-text-primary text-[13.5px] font-[inherit] outline-none transition-[border-color] duration-[120ms] focus:border-p-border-strong';
  const selectCls = inputCls;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Nombre del aula *">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Aula 1-A"
          className={inputCls}
        />
      </Field>
      <Field
        label="Nivel de grado"
        hint={levels?.length === 0 ? 'No hay niveles creados. Crea uno en el panel lateral.' : undefined}
      >
        <GradeLevelSelect value={gradeLevelId} onChange={setGradeLevelId} levels={levels} />
      </Field>
      <Field label="Año académico">
        <select
          value={academicYearId ?? ''}
          onChange={(e) => setAcademicYearId(e.target.value || null)}
          className={selectCls}
        >
          <option value="">Sin año</option>
          {(academicYears ?? []).map((y) => (
            <option key={y.id} value={y.id}>{y.name}{y.isCurrent ? ' (vigente)' : ''}</option>
          ))}
        </select>
      </Field>
      <Field label="Tutor/a responsable">
        <select
          value={tutorMemberId ?? ''}
          onChange={(e) => setTutorMemberId(e.target.value || null)}
          className={selectCls}
        >
          <option value="">Sin tutor</option>
          {(teachers ?? []).map((t) => (
            <option key={t.id} value={t.id}>{t.fullName || t.email}</option>
          ))}
        </select>
      </Field>
      <Field label="Capacidad máxima">
        <div className="relative">
          <Users size={14} className="absolute left-[10px] top-1/2 -translate-y-1/2 text-p-text-tertiary pointer-events-none" />
          <input
            type="number"
            min={1}
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            placeholder="Ej: 30"
            className={cn(inputCls, 'pl-[32px]')}
          />
        </div>
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
                  <Button size="sm" variant="outline" className="h-7 text-[12px]" onClick={() => handleUpdate(l.id)} disabled={updateLevel.isPending}>Guardar</Button>
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => setEditId(null)}>✕</Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-[13px]">{l.name}</span>
                  <span className="text-[11px] text-[hsl(var(--muted-foreground))]">orden {l.order}</span>
                  <Button size="sm" variant="ghost" className="size-[26px] p-0"
                    onClick={() => { setEditId(l.id); setEditName(l.name); setEditOrder(String(l.order)); }}>
                    <Pencil size={12} />
                  </Button>
                  <Button size="sm" variant="ghost" className="size-[26px] p-0 text-[hsl(var(--destructive))]"
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

/* ── Students dialog ── */
function StudentsDialog({ classroom, onClose }) {
  const { data: students = [], isLoading } = useClassroomStudents(classroom?.id);
  const { data: allMembers = [] } = useMembers();
  const addStudent = useAddClassroomStudent();
  const removeStudent = useRemoveClassroomStudent();
  const [selectedMemberId, setSelectedMemberId] = useState('');

  const enrolledMemberIds = new Set(students.map((s) => s.memberId));
  const availableStudents = allMembers.filter((m) => m.role === 'student' && !enrolledMemberIds.has(m.id));

  const selectCls = 'w-full px-[10px] py-[9px] rounded-[10px] border border-p-border bg-p-bg-base text-p-text-primary text-[13.5px] font-[inherit] outline-none transition-[border-color] duration-[120ms] focus:border-p-border-strong';

  const handleAdd = async () => {
    if (!selectedMemberId) return;
    try {
      await addStudent.mutateAsync({ classroomId: classroom.id, studentMemberId: selectedMemberId });
      setSelectedMemberId('');
    } catch { /* handled */ }
  };

  const handleRemove = async (studentId) => {
    try { await removeStudent.mutateAsync({ classroomId: classroom.id, studentId }); }
    catch { /* handled */ }
  };

  return (
    <Dialog open={!!classroom} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[480px] p-0 overflow-hidden gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-p-border">
          <div className="flex items-center gap-3 mb-1">
            <div className="size-9 rounded-[10px] bg-p-bg-subtle flex items-center justify-center text-p-text-secondary shrink-0">
              <Users size={16} />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-bold text-p-text-primary tracking-[-0.02em]">Alumnos</DialogTitle>
              <p className="text-[12.5px] text-p-text-secondary mt-px">{classroom?.name}</p>
            </div>
          </div>
        </DialogHeader>
        <div className="px-6 py-5 space-y-4">
          <RoleGate roles={['director']}>
            <div className="flex gap-2">
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className={cn(selectCls, 'flex-1')}
              >
                <option value="">Seleccionar alumno</option>
                {availableStudents.map((m) => (
                  <option key={m.id} value={m.id}>{m.fullName || m.email}</option>
                ))}
              </select>
              <button
                onClick={handleAdd}
                disabled={!selectedMemberId || addStudent.isPending}
                className="px-4 py-[9px] rounded-[10px] bg-p-accent text-p-accent-text text-[13.5px] font-semibold border-none cursor-pointer disabled:opacity-50 flex items-center gap-[6px] whitespace-nowrap"
              >
                <UserPlus size={14} />
              </button>
            </div>
          </RoleGate>

          <div className="max-h-[300px] overflow-y-auto space-y-[6px]">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => <Skeleton key={`skeleton-${i}`} className="h-10 w-full" />)
            ) : students.length === 0 ? (
              <p className="text-center text-[13px] text-p-text-tertiary py-6">
                No hay alumnos asignados a esta aula
              </p>
            ) : (
              students.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-3 py-[7px] bg-p-bg-subtle rounded-[10px]">
                  <div className="size-7 rounded-full bg-p-bg-base border border-p-border flex items-center justify-center text-[11px] font-bold text-p-text-secondary shrink-0">
                    {(s.fullName || '?').slice(0, 1).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-medium text-p-text-primary truncate">{s.fullName || '—'}</div>
                    <div className="text-[11.5px] text-p-text-tertiary truncate">{s.email}</div>
                  </div>
                  <RoleGate roles={['director']}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      onClick={() => handleRemove(s.id)}
                      disabled={removeStudent.isPending}
                    >
                      <X size={13} />
                    </Button>
                  </RoleGate>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ══ Page ══ */
export default function ClassroomsPage() {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [studentsClassroom, setStudentsClassroom] = useState(null);
  const [query, setQuery] = useState('');

  const classrooms = useClassrooms();
  const { data: levels } = useGradeLevels();
  const { data: academicYears } = useAcademicYears();
  const { data: allMembers } = useMembers();
  const createClassroom = useCreateClassroom();
  const updateClassroom = useUpdateClassroom();
  const deleteClassroom = useDeleteClassroom();

  useEffect(() => { if (classrooms.error) showApiError(classrooms.error); }, [classrooms.error]);

  const levelMap = useMemo(() => Object.fromEntries((levels ?? []).map((l) => [l.id, l.name])), [levels]);
  const yearMap = useMemo(() => Object.fromEntries((academicYears ?? []).map((y) => [y.id, y.name])), [academicYears]);
  const memberMap = useMemo(() => Object.fromEntries((allMembers ?? []).map((m) => [m.id, m.fullName || m.email])), [allMembers]);
  const teachers = useMemo(() => (allMembers ?? []).filter((m) => m.role === 'teacher'), [allMembers]);

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
          <h1 className="text-2xl font-semibold">Aulas</h1>
          <p className="text-sm text-muted-foreground mt-1">Espacios físicos donde ocurren los cursos. Asigna nivel de grado y capacidad.</p>
        </div>
        <RoleGate roles={['director']}>
          <Dialog open={open} onOpenChange={(v) => setOpen(v)}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-1 size-4" />Crear Aula</Button>
            </DialogTrigger>
            <DialogContent className="max-w-[460px] p-0 overflow-hidden gap-0">
              <DialogHeader className="px-6 pt-6 pb-4 border-b border-p-border">
                <div className="flex items-center gap-3 mb-1">
                  <div className="size-9 rounded-[10px] bg-p-bg-subtle flex items-center justify-center text-p-text-secondary shrink-0">
                    <DoorOpen size={16} />
                  </div>
                  <div>
                    <DialogTitle className="text-[15px] font-bold text-p-text-primary tracking-[-0.02em]">Nueva aula</DialogTitle>
                    <p className="text-[12.5px] text-p-text-secondary mt-px">Define el espacio físico y su capacidad</p>
                  </div>
                </div>
              </DialogHeader>
              <div className="px-6 py-5">
                <ClassroomForm levels={levels} academicYears={academicYears} teachers={teachers} onSave={handleCreate} loading={createClassroom.isPending} submitLabel="Crear aula" />
              </div>
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
                <TableHead>Año académico</TableHead>
                <TableHead>Tutor</TableHead>
                <TableHead>Capacidad</TableHead>
                <TableHead className="w-24">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {classrooms.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={`skeleton-${i}`}>
                    {[1,2,3,4].map((j) => <TableCell key={j}><Skeleton className="h-4 w-24" /></TableCell>)}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {query ? `Sin resultados para "${query}"` : 'No hay aulas registradas'}
                  </TableCell>
                </TableRow>
              ) : (
                pagination.paginated.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{levelMap[c.gradeLevelId] ?? '—'}</TableCell>
                    <TableCell>{c.academicYearId ? (yearMap[c.academicYearId] ?? '—') : '—'}</TableCell>
                    <TableCell>{c.tutorMemberId ? (memberMap[c.tutorMemberId] ?? '—') : '—'}</TableCell>
                    <TableCell>{c.capacity ? `${c.capacity} alumnos` : '—'}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setStudentsClassroom(c)} title="Alumnos"><Users className="size-4" /></Button>
                        <RoleGate roles={['director']}>
                          <Button variant="ghost" size="icon" onClick={() => setEditingItem(c)}><Pencil className="size-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => setDeletingItem(c)}><Trash2 className="size-4" /></Button>
                        </RoleGate>
                      </div>
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
        <DialogContent className="max-w-[460px] p-0 overflow-hidden gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-p-border">
            <div className="flex items-center gap-3 mb-1">
              <div className="size-9 rounded-[10px] bg-p-bg-subtle flex items-center justify-center text-p-text-secondary shrink-0">
                <DoorOpen size={16} />
              </div>
              <div>
                <DialogTitle className="text-[15px] font-bold text-p-text-primary tracking-[-0.02em]">Editar aula</DialogTitle>
                <p className="text-[12.5px] text-p-text-secondary mt-px">{editingItem?.name}</p>
              </div>
            </div>
          </DialogHeader>
          <div className="px-6 py-5">
            {editingItem && (
              <ClassroomForm
                initial={editingItem}
                levels={levels}
                academicYears={academicYears}
                teachers={teachers}
                onSave={handleUpdate}
                onCancel={() => setEditingItem(null)}
                loading={updateClassroom.isPending}
                submitLabel="Guardar cambios"
              />
            )}
          </div>
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

      <StudentsDialog classroom={studentsClassroom} onClose={() => setStudentsClassroom(null)} />
    </div>
  );
}
