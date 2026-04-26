import { useState, useMemo, useEffect } from 'react';
import { Search, Check, AlertTriangle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useMembers } from '@/hooks/useMembers';
import { useCourses, useAssignTeacher } from '@/hooks/useCourses';
import { avatarColor, getInitials, getMateriaColor } from '@/lib/materia-colors';

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
        <DialogHeader className="px-6 pt-5 pb-4 border-b" style={{ borderColor: 'var(--p-border)' }}>
          <DialogTitle style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.02em' }}>
            Asignar Docente
          </DialogTitle>
          <div style={{ fontSize: 13, color: 'var(--p-text-secondary)', marginTop: 2 }}>
            {subjectName} — {classroomName}
          </div>
        </DialogHeader>

        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
          <div style={{ padding: '14px 24px 0', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[subjectName, classroomName, yearName].filter(Boolean).map((label) => (
              <div key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: '99px', background: 'var(--p-bg-subtle)', border: '1px solid var(--p-border)', fontSize: 12.5, color: 'var(--p-text-secondary)' }}>
                {label}
              </div>
            ))}
          </div>

          <div style={{ padding: '16px 24px 0' }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--p-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Docente actual
            </div>

            {currentTeacher ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--p-bg-subtle)', border: '1px solid var(--p-border)', borderRadius: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: '99px', background: avatarColor(currentTeacher.fullName || ''), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {getInitials(currentTeacher.fullName || currentTeacher.email)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--p-text-primary)' }}>
                    {currentTeacher.fullName || currentTeacher.email}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                    <span style={{ padding: '1px 8px', borderRadius: '99px', fontSize: 11, fontWeight: 600, background: 'oklch(90% 0.035 200)', color: 'oklch(30% 0.07 200)' }}>Docente</span>
                    <span style={{ fontSize: 11.5, color: 'var(--p-text-tertiary)' }}>
                      {teacherCourseCount(currentTeacher.id)} curso{teacherCourseCount(currentTeacher.id) === 1 ? '' : 's'} activo{teacherCourseCount(currentTeacher.id) === 1 ? '' : 's'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleRemove}
                  disabled={assignTeacher.isPending}
                  style={{ padding: '5px 12px', borderRadius: 10, border: '1px solid var(--p-d-500)', background: 'transparent', color: 'var(--p-d-500)', fontSize: 12, fontFamily: 'inherit', fontWeight: 500, cursor: assignTeacher.isPending ? 'not-allowed' : 'pointer', opacity: assignTeacher.isPending ? 0.5 : 1, whiteSpace: 'nowrap', transition: 'all 0.1s' }}
                  onMouseEnter={(e) => { if (!assignTeacher.isPending) e.currentTarget.style.background = 'var(--p-d-100)'; }}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  Quitar asignación
                </button>
              </div>
            ) : (
              <div style={{ padding: 14, background: 'var(--p-w-100)', border: '1px dashed var(--p-w-500)', borderRadius: 16, fontSize: 13, color: 'var(--p-w-700)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} />
                Este curso no tiene docente asignado
              </div>
            )}
          </div>

          {pending && (
            <div style={{ margin: '14px 24px 0', padding: '10px 14px', background: mc.bg, border: `1px solid ${mc.color}44`, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Check size={14} style={{ color: mc.color }} />
              <span style={{ fontSize: 13, color: mc.color, fontWeight: 500 }}>
                Se asignará a <strong>{pending.fullName || pending.email}</strong> al guardar
              </span>
              <button onClick={() => setPending(null)} style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: mc.color, cursor: 'pointer', fontSize: 14, display: 'flex' }}>
                <X size={14} />
              </button>
            </div>
          )}

          <div style={{ padding: '16px 24px 20px' }}>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--p-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
              Asignar nuevo docente
            </div>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--p-text-tertiary)', display: 'flex' }}>
                <Search size={14} />
              </span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar docente por nombre o email…"
                style={{ width: '100%', padding: '7px 11px', paddingLeft: 32, paddingRight: query ? 32 : 11, fontSize: 13.5, fontFamily: 'inherit', border: '1px solid var(--p-border)', borderRadius: 10, background: 'var(--p-bg-base)', color: 'var(--p-text-primary)', outline: 'none' }}
              />
              {query && (
                <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: 'var(--p-text-tertiary)', cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>
              )}
            </div>

            <div style={{ border: '1px solid var(--p-border)', borderRadius: 16, overflow: 'hidden' }}>
              {members.isLoading ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--p-text-tertiary)', fontSize: 13 }}>
                  Cargando docentes…
                </div>
              ) : disponibles.length === 0 ? (
                <div style={{ padding: 20, textAlign: 'center', color: 'var(--p-text-tertiary)', fontSize: 13 }}>
                  {query ? 'Sin resultados para tu búsqueda' : 'No hay otros docentes disponibles'}
                </div>
              ) : (
                disponibles.map((t, i) => {
                  const isPending = pending?.id === t.id;
                  const cnt = teacherCourseCount(t.id);
                  return (
                    <div
                      key={t.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderTop: i > 0 ? '1px solid var(--p-border)' : 'none', background: isPending ? 'var(--p-bg-subtle)' : 'transparent', transition: 'background 0.08s' }}
                      onMouseEnter={(e) => { if (!isPending) e.currentTarget.style.background = 'var(--p-bg-subtle)'; }}
                      onMouseLeave={(e) => { if (!isPending) e.currentTarget.style.background = 'transparent'; }}
                    >
                      <div style={{ width: 34, height: 34, borderRadius: '99px', background: avatarColor(t.fullName || ''), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                        {getInitials(t.fullName || t.email)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--p-text-primary)' }}>
                          {t.fullName || t.email}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                          <span style={{ fontSize: 11.5, color: 'var(--p-text-tertiary)' }}>{t.email}</span>
                          <span style={{ width: 3, height: 3, borderRadius: '99px', background: 'var(--p-text-tertiary)' }} />
                          <span style={{ fontSize: 11.5, color: cnt === 0 ? 'var(--p-s-700)' : 'var(--p-text-tertiary)' }}>
                            {cnt === 0 ? 'Sin cursos' : `${cnt} curso${cnt > 1 ? 's' : ''}`}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setPending(t)}
                        style={{
                          padding: '5px 14px', borderRadius: 10,
                          border: isPending ? '1px solid transparent' : '1px solid var(--p-border)',
                          background: isPending ? mc.color : 'transparent',
                          color: isPending ? 'white' : 'var(--p-text-secondary)',
                          fontSize: 12.5, fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer',
                          transition: 'all 0.1s', whiteSpace: 'nowrap',
                        }}
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

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--p-border)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--p-bg-subtle)' }}>
          <button
            onClick={() => onOpenChange(false)}
            style={{ padding: '7px 15px', borderRadius: 10, border: '1px solid var(--p-border)', background: 'var(--p-bg-base)', color: 'var(--p-text-primary)', fontSize: 13, fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardar}
            disabled={!pending || assignTeacher.isPending}
            style={{ padding: '7px 15px', borderRadius: 10, border: '1px solid var(--p-accent)', background: 'var(--p-accent)', color: 'var(--p-accent-text)', fontSize: 13, fontFamily: 'inherit', fontWeight: 500, cursor: (!pending || assignTeacher.isPending) ? 'not-allowed' : 'pointer', opacity: (!pending || assignTeacher.isPending) ? 0.5 : 1 }}
          >
            {assignTeacher.isPending ? 'Guardando…' : 'Guardar asignación'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
