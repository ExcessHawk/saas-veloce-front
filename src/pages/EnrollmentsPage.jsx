import { useState, useMemo, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCourses } from '@/hooks/useCourses';
import { useAcademicYears } from '@/hooks/useAcademicYears';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useSubjects } from '@/hooks/useSubjects';
import { useMembers } from '@/hooks/useMembers';
import { useEnrollments, useEnrollStudent, useRemoveEnrollment } from '@/hooks/useEnrollments';
import { showApiError } from '@/lib/errors';
import { getMateriaColor, avatarColor, getInitials } from '@/lib/materia-colors';

function findName(list, id) {
  return list?.find((i) => i.id === id)?.name || '—';
}

const CursoCard = ({ curso, subjectName, classroomName, teacherName, totalEnrolled, capacity, selected, onClick }) => {
  const [hov, setHov] = useState(false);
  const mc = getMateriaColor(subjectName);
  const pct = totalEnrolled / capacity;
  const full = pct >= 1;

  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'var(--p-bg-base)', border: `1.5px solid ${selected ? mc.color : hov ? 'var(--p-border-strong)' : 'var(--p-border)'}`, borderRadius: 16, padding: '16px 18px', cursor: 'pointer', transition: 'all 0.15s', boxShadow: selected ? `0 0 0 3px ${mc.color}22` : hov ? 'var(--p-shadow-md)' : 'var(--p-shadow-sm)', transform: hov && !selected ? 'translateY(-1px)' : 'none', position: 'relative', overflow: 'hidden' }}>
      {selected && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: mc.color }} />}

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--p-text-primary)', letterSpacing: '-0.02em' }}>{subjectName}</div>
          <div style={{ fontSize: 12, color: 'var(--p-text-secondary)', marginTop: 2 }}>{classroomName}</div>
        </div>
        <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: 11, fontWeight: 700, background: full ? 'var(--p-d-100)' : mc.bg, color: full ? 'var(--p-d-700)' : mc.color }}>
          {full ? 'Lleno' : `${totalEnrolled}/${capacity}`}
        </span>
      </div>

      <div style={{ fontSize: 12.5, color: 'var(--p-text-secondary)', marginBottom: 12 }}>
        {teacherName || 'Sin docente asignado'}
      </div>

      <div style={{ height: 4, borderRadius: 99, background: 'var(--p-bg-subtle)' }}>
        <div style={{ height: 4, borderRadius: 99, width: `${Math.min(pct * 100, 100)}%`, background: full ? 'var(--p-d-500)' : mc.color, transition: 'width 0.4s ease' }} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--p-text-tertiary)', marginTop: 5 }}>{totalEnrolled} inscritos</div>
    </div>
  );
};

const StudentRow = ({ name, email, onAction, actionLabel, danger, disabled }) => {
  const [hov, setHov] = useState(false);
  const bg = avatarColor(name);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid var(--p-border)' }}>
      <div style={{ width: 30, height: 30, borderRadius: '99px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>
        {getInitials(name)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--p-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
        <div style={{ fontSize: 11.5, color: 'var(--p-text-tertiary)' }}>{email}</div>
      </div>
      <button onClick={onAction} disabled={disabled}
        onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
        style={{ padding: '4px 10px', borderRadius: 8, border: `1px solid ${danger ? 'var(--p-d-500)' : 'var(--p-border)'}`, background: hov ? (danger ? 'var(--p-d-100)' : 'var(--p-bg-subtle)') : 'transparent', color: danger ? 'var(--p-d-500)' : 'var(--p-text-secondary)', fontSize: 12, fontFamily: 'inherit', fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1, transition: 'all 0.1s', whiteSpace: 'nowrap' }}>
        {actionLabel}
      </button>
    </div>
  );
};

const DEFAULT_CAPACITY = 30;

export default function EnrollmentsPage() {
  const qc = useQueryClient();
  const courses = useCourses();
  const academicYears = useAcademicYears();
  const classrooms = useClassrooms();
  const subjects = useSubjects();
  const members = useMembers();

  const [selectedYear, setSelectedYear] = useState('');
  const [selected, setSelected] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [queryInsc, setQueryInsc] = useState('');

  const enrollments = useEnrollments(selected);
  const enrollStudent = useEnrollStudent(selected);
  const removeEnrollment = useRemoveEnrollment(selected);

  // Auto-select current year on first load
  useEffect(() => {
    if (!selectedYear && academicYears.data?.length) {
      const current = academicYears.data.find((y) => y.isCurrent) ?? academicYears.data[0];
      setSelectedYear(current.id);
    }
  }, [academicYears.data, selectedYear]);

  useEffect(() => {
    if (courses.error) showApiError(courses.error);
  }, [courses.error]);

  const yearCourses = useMemo(() => {
    if (!selectedYear) return [];
    return (courses.data ?? []).filter((c) => c.academicYearId === selectedYear);
  }, [courses.data, selectedYear]);

  const selectedCourse = courses.data?.find((c) => c.id === selected);
  const selectedSubject = selectedCourse ? findName(subjects.data, selectedCourse.subjectId) : '';
  const selectedClassroom = selectedCourse ? findName(classrooms.data, selectedCourse.classroomId) : '';
  const teacherMember = members.data?.find((m) => m.id === selectedCourse?.teacherMemberId);
  const teacherName = teacherMember ? `Prof. ${teacherMember.fullName}` : null;

  const enrolledList = enrollments.data ?? [];
  const enrolledFiltered = enrolledList.filter((e) => (e.fullName || '').toLowerCase().includes(queryInsc.toLowerCase()));

  // Find students of the school not yet enrolled
  const allStudents = useMemo(() => (members.data ?? []).filter((m) => m.role === 'student'), [members.data]);
  const enrolledIds = new Set(enrolledList.map((e) => e.studentMemberId));
  const searchResults = busqueda.trim().length < 2 ? [] :
    allStudents.filter((s) =>
      !enrolledIds.has(s.id) &&
      ((s.fullName || '').toLowerCase().includes(busqueda.toLowerCase()) || s.email.toLowerCase().includes(busqueda.toLowerCase()))
    );

  const selectedClassroomData = classrooms.data?.find((c) => c.id === selectedCourse?.classroomId);
  const mc = selectedCourse ? getMateriaColor(selectedSubject) : {};
  const max = selectedClassroomData?.capacity ?? DEFAULT_CAPACITY;
  const pct = Math.round((enrolledList.length / max) * 100);

  const handleEnroll = async (studentMemberId) => {
    try {
      await enrollStudent.mutateAsync(studentMemberId);
      setBusqueda('');
    } catch { /* handled by hook */ }
  };

  const handleRemove = async (enrollmentId) => {
    try {
      await removeEnrollment.mutateAsync(enrollmentId);
    } catch { /* handled by hook */ }
  };

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', minHeight: '100%' }}>
      {/* LEFT */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--p-text-primary)', letterSpacing: '-0.03em', margin: 0 }}>Inscripciones</h1>
            <p style={{ fontSize: 13, color: 'var(--p-text-secondary)', margin: '4px 0 0' }}>Selecciona un curso para gestionar sus alumnos</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12.5, color: 'var(--p-text-secondary)', fontWeight: 500 }}>Año</span>
            <select value={selectedYear} onChange={(e) => { setSelectedYear(e.target.value); setSelected(null); }}
              style={{ padding: '6px 12px', fontSize: 13, fontWeight: 500, border: '1px solid var(--p-border)', borderRadius: 10, background: 'var(--p-bg-base)', color: 'var(--p-text-primary)', cursor: 'pointer', fontFamily: 'inherit', outline: 'none' }}>
              <option value="">— Todos —</option>
              {(academicYears.data ?? []).map((y) => <option key={y.id} value={y.id}>{y.name}{y.isCurrent ? ' (actual)' : ''}</option>)}
            </select>
          </div>
        </div>

        {/* Course grid */}
        {courses.isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} style={{ height: 140, background: 'var(--p-bg-subtle)', borderRadius: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : yearCourses.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 16, color: 'var(--p-text-tertiary)', fontSize: 14 }}>
            {selectedYear ? 'No hay cursos en este año académico.' : 'Selecciona un año académico.'}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
            {yearCourses.map((c) => {
              const subjName = findName(subjects.data, c.subjectId);
              const classroomName = findName(classrooms.data, c.classroomId);
              const tMember = members.data?.find((m) => m.id === c.teacherMemberId);
              const tName = tMember ? `Prof. ${tMember.fullName}` : null;
              return (
                <CursoCard key={c.id} curso={c}
                  subjectName={subjName} classroomName={classroomName} teacherName={tName}
                  totalEnrolled={(qc.getQueryData(['enrollments', c.id]) ?? (selected === c.id ? enrolledList : [])).length}
                  capacity={classrooms.data?.find((cl) => cl.id === c.classroomId)?.capacity ?? DEFAULT_CAPACITY}
                  selected={selected === c.id}
                  onClick={() => { setSelected(c.id); setBusqueda(''); setQueryInsc(''); }} />
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT panel */}
      <div style={{ width: selected ? 360 : 0, flexShrink: 0, overflow: 'hidden', transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)' }}>
        {selected && selectedCourse && (
          <div style={{ width: 360, background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 20, boxShadow: 'var(--p-shadow-lg)', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 120px)', overflow: 'hidden', position: 'sticky', top: 0 }}>
            <div style={{ padding: '16px 20px 14px', borderBottom: '1px solid var(--p-border)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--p-text-primary)' }}>{selectedSubject} — {selectedClassroom}</div>
                  <div style={{ fontSize: 12, color: 'var(--p-text-secondary)', marginTop: 2 }}>{teacherName || 'Sin docente'}</div>
                </div>
                <button onClick={() => setSelected(null)} style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid var(--p-border)', background: 'transparent', cursor: 'pointer', color: 'var(--p-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, flexShrink: 0 }}>×</button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ padding: '3px 10px', borderRadius: '99px', fontSize: 12, fontWeight: 700, background: enrolledList.length >= max ? 'var(--p-d-100)' : 'var(--p-s-100)', color: enrolledList.length >= max ? 'var(--p-d-700)' : 'var(--p-s-700)' }}>
                  {enrolledList.length} / {max} alumnos
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--p-text-tertiary)' }}>{pct}% capacidad</span>
              </div>
              <div style={{ height: 4, borderRadius: 99, background: 'var(--p-bg-subtle)' }}>
                <div style={{ height: 4, borderRadius: 99, width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? 'var(--p-d-500)' : mc.color, transition: 'width 0.4s' }} />
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px 0' }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--p-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Alumnos inscritos</div>
              <div style={{ position: 'relative', marginBottom: 10 }}>
                <input value={queryInsc} onChange={(e) => setQueryInsc(e.target.value)} placeholder="Filtrar inscritos…"
                  style={{ width: '100%', padding: '6px 11px', fontSize: 12.5, fontFamily: 'inherit', border: '1px solid var(--p-border)', borderRadius: 10, background: 'var(--p-bg-base)', color: 'var(--p-text-primary)', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              {enrollments.isLoading ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--p-text-tertiary)', fontSize: 13 }}>Cargando…</div>
              ) : enrolledFiltered.length === 0 ? (
                <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--p-text-tertiary)', fontSize: 13 }}>
                  {enrolledList.length === 0 ? 'Sin alumnos inscritos' : 'Sin resultados'}
                </div>
              ) : (
                enrolledFiltered.map((e) => (
                  <StudentRow key={e.id} name={e.fullName || e.email} email={e.email} actionLabel="Quitar" danger
                    disabled={removeEnrollment.isPending}
                    onAction={() => handleRemove(e.id)} />
                ))
              )}
            </div>

            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--p-border)', background: 'var(--p-bg-subtle)', flexShrink: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--p-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Agregar alumno</div>
              <div style={{ position: 'relative', marginBottom: searchResults.length ? 8 : 0 }}>
                <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre o email…"
                  style={{ width: '100%', padding: '6px 11px', fontSize: 12.5, fontFamily: 'inherit', border: '1px solid var(--p-border)', borderRadius: 10, background: 'var(--p-bg-base)', color: 'var(--p-text-primary)', outline: 'none', boxSizing: 'border-box' }} />
                {busqueda && <button onClick={() => setBusqueda('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: 'var(--p-text-tertiary)', cursor: 'pointer', fontSize: 15 }}>×</button>}
              </div>

              {busqueda.length >= 2 && (
                <div style={{ background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 10, overflow: 'hidden' }}>
                  {searchResults.length === 0
                    ? <div style={{ padding: '12px 14px', fontSize: 12.5, color: 'var(--p-text-tertiary)' }}>Sin resultados</div>
                    : searchResults.slice(0, 5).map((s, i) => (
                        <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 12px', borderTop: i > 0 ? '1px solid var(--p-border)' : 'none' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--p-bg-subtle)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ width: 26, height: 26, borderRadius: '99px', background: avatarColor(s.fullName || s.email), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0 }}>{getInitials(s.fullName || s.email)}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--p-text-primary)' }}>{s.fullName}</div>
                            <div style={{ fontSize: 11, color: 'var(--p-text-tertiary)' }}>{s.email}</div>
                          </div>
                          <button
                            onClick={() => handleEnroll(s.id)}
                            disabled={enrollStudent.isPending || enrolledList.length >= max}
                            style={{ padding: '4px 12px', borderRadius: 8, border: 'none', background: 'var(--p-accent)', color: 'var(--p-accent-text)', fontSize: 12, fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer', opacity: enrolledList.length >= max ? 0.5 : 1 }}>
                            Inscribir
                          </button>
                        </div>
                      ))
                  }
                </div>
              )}

              {enrolledList.length >= max && (
                <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--p-d-100)', borderRadius: 10, fontSize: 12, color: 'var(--p-d-700)', fontWeight: 500 }}>
                  El curso está lleno ({max}/{max}).
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
