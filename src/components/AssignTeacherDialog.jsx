import { useState, useMemo, useEffect } from 'react';
import { Search, Check, AlertTriangle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMembers } from '@/hooks/useMembers';
import { useCourses, useAssignTeacher } from '@/hooks/useCourses';
import { avatarColor, getInitials, getMateriaColor } from '@/lib/materia-colors';
import { cn } from '@/lib/utils';

export function AssignTeacherDialog({ open, onOpenChange, course, subjectName, classroomName, yearName }) {
  const members = useMembers();
  const courses = useCourses();
  const assignTeacher = useAssignTeacher();

  const [query, setQuery] = useState('');
  const [pending, setPending] = useState(null);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setPending(null);
    }
  }, [open]);

  const teachers = useMemo(
    () => (members.data ?? []).filter((m) => m.role === 'teacher'),
    [members.data],
  );

  const teacherCourseCount = (teacherId) =>
    (courses.data ?? []).filter((c) => c.teacherMemberId === teacherId).length;

  const currentTeacher = course?.teacherMemberId
    ? teachers.find((t) => t.id === course.teacherMemberId)
    : null;

  const disponibles = teachers.filter((t) => {
    if (currentTeacher && t.id === currentTeacher.id) return false;
    const q = query.toLowerCase();
    if (!q) return true;
    return (t.fullName || '').toLowerCase().includes(q) || (t.email || '').toLowerCase().includes(q);
  });

  const mc = getMateriaColor(subjectName);

  const handleGuardar = async () => {
    if (!course) return;
    try {
      await assignTeacher.mutateAsync({
        id: course.id,
        teacherMemberId: pending ? pending.id : null,
      });
      onOpenChange(false);
    } catch { /* handled by hook */ }
  };

  const handleRemove = async () => {
    if (!course) return;
    try {
      await assignTeacher.mutateAsync({ id: course.id, teacherMemberId: null });
      onOpenChange(false);
    } catch { /* handled */ }
  };

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[520px] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-4 border-b border-p-border">
          <DialogTitle className="text-[15px] font-bold tracking-[-0.02em]">
            Asignar Docente
          </DialogTitle>
          <div className="text-[13px] text-p-text-secondary mt-[2px]">
            {subjectName} — {classroomName}
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          {/* Chips */}
          <div className="px-6 pt-[14px] flex flex-wrap gap-2">
            {[subjectName, classroomName, yearName].filter(Boolean).map((label) => (
              <div key={label} className="inline-flex items-center gap-[6px] px-[10px] py-1 rounded-full bg-p-bg-subtle border border-p-border text-[12.5px] text-p-text-secondary">
                {label}
              </div>
            ))}
          </div>

          {/* Docente actual */}
          <div className="px-6 pt-4">
            <div className="text-[11.5px] font-semibold text-p-text-tertiary uppercase tracking-[0.07em] mb-[10px]">
              Docente actual
            </div>

            {currentTeacher ? (
              <div className="flex items-center gap-3 px-[14px] py-3 bg-p-bg-subtle border border-p-border rounded-2xl">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                  style={{ background: avatarColor(currentTeacher.fullName || '') }}
                >
                  {getInitials(currentTeacher.fullName || currentTeacher.email)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-p-text-primary">
                    {currentTeacher.fullName || currentTeacher.email}
                  </div>
                  <div className="flex items-center gap-2 mt-[3px]">
                    <span className="px-2 py-px rounded-full text-[11px] font-semibold bg-[oklch(90%_0.035_200)] dark:bg-[oklch(25%_0.035_200)] text-[oklch(30%_0.07_200)] dark:text-[oklch(75%_0.07_200)]">Docente</span>
                    <span className="text-[11.5px] text-p-text-tertiary">
                      {teacherCourseCount(currentTeacher.id)} curso{teacherCourseCount(currentTeacher.id) === 1 ? '' : 's'} activo{teacherCourseCount(currentTeacher.id) === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleRemove}
                  disabled={assignTeacher.isPending}
                  className={cn(
                    'px-3 py-[5px] rounded-[10px] border border-p-d-500 bg-transparent text-p-d-500 text-[12px] font-medium font-sans whitespace-nowrap transition-all duration-100 hover:bg-p-d-100',
                    assignTeacher.isPending && 'cursor-not-allowed opacity-50',
                  )}
                >
                  Quitar asignación
                </button>
              </div>
            ) : (
              <div className="px-[14px] py-[14px] bg-p-w-100 border border-dashed border-p-w-500 rounded-2xl text-[13px] text-p-w-700 flex items-center gap-2">
                <AlertTriangle size={14} />
                Este curso no tiene docente asignado
              </div>
            )}
          </div>

          {/* Pending preview */}
          {pending && (
            <div
              className="mx-6 mt-[14px] px-[14px] py-[10px] rounded-2xl flex items-center gap-[10px] border"
              style={{ background: mc.bg, borderColor: `${mc.color}44` }}
            >
              <Check size={14} style={{ color: mc.color }} />
              <span className="text-[13px] font-medium" style={{ color: mc.color }}>
                Se asignará a <strong>{pending.fullName || pending.email}</strong> al guardar
              </span>
              <button
                onClick={() => setPending(null)}
                className="ml-auto border-none bg-transparent cursor-pointer text-[14px] flex"
                style={{ color: mc.color }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Buscar nuevo docente */}
          <div className="px-6 pt-4 pb-5">
            <div className="text-[11.5px] font-semibold text-p-text-tertiary uppercase tracking-[0.07em] mb-[10px]">
              Asignar nuevo docente
            </div>
            <div className="relative mb-3">
              <span className="absolute left-[10px] top-1/2 -translate-y-1/2 text-p-text-tertiary flex">
                <Search size={14} />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar docente por nombre o email…"
                className={cn('w-full py-[7px] pl-8 text-[13.5px] border border-p-border rounded-[10px] bg-p-bg-base text-p-text-primary outline-none font-sans', query ? 'pr-8' : 'pr-[11px]')}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-[10px] top-1/2 -translate-y-1/2 border-none bg-transparent text-p-text-tertiary cursor-pointer text-[16px] leading-none p-0"
                >×</button>
              )}
            </div>

            <div className="border border-p-border rounded-2xl overflow-hidden">
              {members.isLoading ? (
                <div className="p-5 text-center text-p-text-tertiary text-[13px]">
                  Cargando docentes…
                </div>
              ) : disponibles.length === 0 ? (
                <div className="p-5 text-center text-p-text-tertiary text-[13px]">
                  {query ? 'Sin resultados para tu búsqueda' : 'No hay otros docentes disponibles'}
                </div>
              ) : (
                disponibles.map((t, i) => {
                  const isPending = pending?.id === t.id;
                  const cnt = teacherCourseCount(t.id);
                  return (
                    <div
                      key={t.id}
                      className={cn(
                        'flex items-center gap-3 px-[14px] py-[11px] transition-[background] duration-[80ms]',
                        i > 0 && 'border-t border-p-border',
                        isPending ? 'bg-p-bg-subtle' : 'bg-transparent hover:bg-p-bg-subtle',
                      )}
                    >
                      <div
                        className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                        style={{ background: avatarColor(t.fullName || '') }}
                      >
                        {getInitials(t.fullName || t.email)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium text-p-text-primary">
                          {t.fullName || t.email}
                        </div>
                        <div className="flex items-center gap-2 mt-[2px]">
                          <span className="text-[11.5px] text-p-text-tertiary">{t.email}</span>
                          <span className="w-[3px] h-[3px] rounded-full bg-p-text-tertiary" />
                          <span className={cn('text-[11.5px]', cnt === 0 ? 'text-p-s-700' : 'text-p-text-tertiary')}>
                            {cnt === 0 ? 'Sin cursos' : `${cnt} curso${cnt > 1 ? 's' : ''}`}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setPending(t)}
                        className={cn(
                          'px-[14px] py-[5px] rounded-[10px] border text-[12.5px] font-medium font-sans whitespace-nowrap transition-all duration-100 cursor-pointer',
                          isPending
                            ? 'border-transparent text-white'
                            : 'border-p-border bg-transparent text-p-text-secondary',
                        )}
                        style={isPending ? { background: mc.color } : undefined}
                      >
                        {isPending ? '✓ Seleccionado' : 'Asignar'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-[14px] border-t border-p-border flex justify-end gap-2 bg-p-bg-subtle">
          <button
            onClick={() => onOpenChange(false)}
            className="px-[15px] py-[7px] rounded-[10px] border border-p-border bg-p-bg-base text-p-text-primary text-[13px] font-medium font-sans cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={!pending || assignTeacher.isPending}
            className={cn(
              'px-[15px] py-[7px] rounded-[10px] border border-p-accent bg-p-accent text-p-accent-text text-[13px] font-medium font-sans',
              (!pending || assignTeacher.isPending) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            )}
          >
            {assignTeacher.isPending ? 'Guardando…' : 'Guardar asignación'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
