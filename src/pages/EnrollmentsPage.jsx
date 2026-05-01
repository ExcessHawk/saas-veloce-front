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
import { cn } from '@/lib/utils';

function findName(list, id) {
  return list?.find((i) => i.id === id)?.name || '—';
}

const CursoCard = ({ curso, subjectName, classroomName, teacherName, totalEnrolled, capacity, selected, onClick }) => {
  const [hov, setHov] = useState(false);
  const mc = getMateriaColor(subjectName);
  const pct = totalEnrolled / capacity;
  const full = pct >= 1;

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className={cn(
        'bg-p-bg-base rounded-2xl p-[16px_18px] cursor-pointer transition-all duration-150 relative overflow-hidden',
      )}
      style={{
        border: `1.5px solid ${selected ? mc.color : hov ? 'var(--p-border-strong)' : 'var(--p-border)'}`,
        boxShadow: selected ? `0 0 0 3px ${mc.color}22` : hov ? 'var(--p-shadow-md)' : 'var(--p-shadow-sm)',
        transform: hov && !selected ? 'translateY(-1px)' : 'none',
      }}
    >
      {selected && (
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: mc.color }} />
      )}

      <div className="flex items-start justify-between mb-[10px]">
        <div>
          <div className="text-[14.5px] font-bold text-p-text-primary tracking-[-0.02em]">{subjectName}</div>
          <div className="text-xs text-p-text-secondary mt-[2px]">{classroomName}</div>
        </div>
        <span
          className="px-2 py-[2px] rounded-full text-[11px] font-bold"
          style={{
            background: full ? 'var(--p-d-100)' : mc.bg,
            color: full ? 'var(--p-d-700)' : mc.color,
          }}
        >
          {full ? 'Lleno' : `${totalEnrolled}/${capacity}`}
        </span>
      </div>

      <div className="text-[12.5px] text-p-text-secondary mb-3">
        {teacherName || 'Sin docente asignado'}
      </div>

      <div className="h-1 rounded-full bg-p-bg-subtle">
        <div
          className="h-1 rounded-full transition-[width] duration-[400ms] ease-in-out"
          style={{ width: `${Math.min(pct * 100, 100)}%`, background: full ? 'var(--p-d-500)' : mc.color }}
        />
      </div>
      <div className="text-[11px] text-p-text-tertiary mt-[5px]">{totalEnrolled} inscritos</div>
    </div>
  );
};

const StudentRow = ({ name, email, onAction, actionLabel, danger, disabled }) => {
  const [hov, setHov] = useState(false);
  const bg = avatarColor(name);
  return (
    <div className="flex items-center gap-[10px] py-[9px] border-b border-p-border">
      <div
        className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
        style={{ background: bg }}
      >
        {getInitials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13.5px] font-medium text-p-text-primary whitespace-nowrap overflow-hidden text-ellipsis">{name}</div>
        <div className="text-[11.5px] text-p-text-tertiary">{email}</div>
      </div>
      <button
        onClick={onAction}
        disabled={disabled}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        className={cn(
          'px-[10px] py-1 rounded-lg text-xs font-medium cursor-pointer transition-all duration-100 whitespace-nowrap font-[inherit]',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
        style={{
          border: `1px solid ${danger ? 'var(--p-d-500)' : 'var(--p-border)'}`,
          background: hov ? (danger ? 'var(--p-d-100)' : 'var(--p-bg-subtle)') : 'transparent',
          color: danger ? 'var(--p-d-500)' : 'var(--p-text-secondary)',
        }}
      >
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
    <div className="flex gap-5 items-start min-h-full">
      {/* LEFT */}
      <div className="flex-1 min-w-0 flex flex-col gap-[18px]">
        <div className="flex items-start justify-between flex-wrap gap-[10px]">
          <div>
            <h1 className="text-[21px] font-bold text-p-text-primary tracking-[-0.03em] m-0">Inscripciones</h1>
            <p className="text-[13px] text-p-text-secondary mt-1 mb-0">Selecciona un curso para gestionar sus alumnos</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12.5px] text-p-text-secondary font-medium">Año</span>
            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setSelected(null); }}
              className="px-3 py-[6px] text-[13px] font-medium border border-p-border rounded-[10px] bg-p-bg-base text-p-text-primary cursor-pointer font-[inherit] outline-none"
            >
              <option value="">— Todos —</option>
              {(academicYears.data ?? []).map((y) => (
                <option key={y.id} value={y.id}>{y.name}{y.isCurrent ? ' (actual)' : ''}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Course grid */}
        {courses.isLoading ? (
          <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-[140px] bg-p-bg-subtle rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : yearCourses.length === 0 ? (
          <div className="py-[60px] px-6 text-center bg-p-bg-base border border-p-border rounded-2xl text-p-text-tertiary text-sm">
            {selectedYear ? 'No hay cursos en este año académico.' : 'Selecciona un año académico.'}
          </div>
        ) : (
          <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fill,minmax(220px,1fr))]">
            {yearCourses.map((c) => {
              const subjName = findName(subjects.data, c.subjectId);
              const classroomName = findName(classrooms.data, c.classroomId);
              const tMember = members.data?.find((m) => m.id === c.teacherMemberId);
              const tName = tMember ? `Prof. ${tMember.fullName}` : null;
              return (
                <CursoCard
                  key={c.id}
                  curso={c}
                  subjectName={subjName}
                  classroomName={classroomName}
                  teacherName={tName}
                  totalEnrolled={(qc.getQueryData(['enrollments', c.id]) ?? (selected === c.id ? enrolledList : [])).length}
                  capacity={classrooms.data?.find((cl) => cl.id === c.classroomId)?.capacity ?? DEFAULT_CAPACITY}
                  selected={selected === c.id}
                  onClick={() => { setSelected(c.id); setBusqueda(''); setQueryInsc(''); }}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* RIGHT panel */}
      <div
        className="shrink-0 overflow-hidden transition-[width] duration-300"
        style={{ width: selected ? 360 : 0, transitionTimingFunction: 'cubic-bezier(0.4,0,0.2,1)' }}
      >
        {selected && selectedCourse && (
          <div className="w-[360px] bg-p-bg-base border border-p-border rounded-[20px] shadow-p-lg flex flex-col overflow-hidden sticky top-0 max-h-[calc(100vh-120px)]">
            <div className="px-5 pt-4 pb-[14px] border-b border-p-border">
              <div className="flex items-start justify-between mb-[10px]">
                <div>
                  <div className="text-sm font-bold text-p-text-primary">{selectedSubject} — {selectedClassroom}</div>
                  <div className="text-xs text-p-text-secondary mt-[2px]">{teacherName || 'Sin docente'}</div>
                </div>
                <button
                  onClick={() => setSelected(null)}
                  className="w-[26px] h-[26px] rounded-lg border border-p-border bg-transparent cursor-pointer text-p-text-tertiary flex items-center justify-center text-[15px] shrink-0"
                >
                  ×
                </button>
              </div>
              <div className="flex items-center justify-between mb-[6px]">
                <span
                  className="px-[10px] py-[3px] rounded-full text-xs font-bold"
                  style={{
                    background: enrolledList.length >= max ? 'var(--p-d-100)' : 'var(--p-s-100)',
                    color: enrolledList.length >= max ? 'var(--p-d-700)' : 'var(--p-s-700)',
                  }}
                >
                  {enrolledList.length} / {max} alumnos
                </span>
                <span className="text-[11.5px] text-p-text-tertiary">{pct}% capacidad</span>
              </div>
              <div className="h-1 rounded-full bg-p-bg-subtle">
                <div
                  className="h-1 rounded-full transition-[width] duration-[400ms]"
                  style={{ width: `${Math.min(pct, 100)}%`, background: pct >= 100 ? 'var(--p-d-500)' : mc.color }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pt-[14px]">
              <div className="text-[11.5px] font-semibold text-p-text-tertiary uppercase tracking-[0.07em] mb-2">Alumnos inscritos</div>
              <div className="relative mb-[10px]">
                <input
                  value={queryInsc}
                  onChange={(e) => setQueryInsc(e.target.value)}
                  placeholder="Filtrar inscritos…"
                  className="w-full px-[11px] py-[6px] text-[12.5px] font-[inherit] border border-p-border rounded-[10px] bg-p-bg-base text-p-text-primary outline-none box-border"
                />
              </div>
              {enrollments.isLoading ? (
                <div className="py-5 text-center text-p-text-tertiary text-[13px]">Cargando…</div>
              ) : enrolledFiltered.length === 0 ? (
                <div className="py-5 text-center text-p-text-tertiary text-[13px]">
                  {enrolledList.length === 0 ? 'Sin alumnos inscritos' : 'Sin resultados'}
                </div>
              ) : (
                enrolledFiltered.map((e) => (
                  <StudentRow
                    key={e.id}
                    name={e.fullName || e.email}
                    email={e.email}
                    actionLabel="Quitar"
                    danger
                    disabled={removeEnrollment.isPending}
                    onAction={() => handleRemove(e.id)}
                  />
                ))
              )}
            </div>

            <div className="px-5 py-[14px] border-t border-p-border bg-p-bg-subtle shrink-0">
              <div className="text-[11.5px] font-semibold text-p-text-tertiary uppercase tracking-[0.07em] mb-2">Agregar alumno</div>
              <div className={cn('relative', searchResults.length ? 'mb-2' : 'mb-0')}>
                <input
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por nombre o email…"
                  className="w-full px-[11px] py-[6px] text-[12.5px] font-[inherit] border border-p-border rounded-[10px] bg-p-bg-base text-p-text-primary outline-none box-border"
                />
                {busqueda && (
                  <button
                    onClick={() => setBusqueda('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 border-none bg-transparent text-p-text-tertiary cursor-pointer text-[15px]"
                  >
                    ×
                  </button>
                )}
              </div>

              {busqueda.length >= 2 && (
                <div className="bg-p-bg-base border border-p-border rounded-[10px] overflow-hidden">
                  {searchResults.length === 0 ? (
                    <div className="px-[14px] py-3 text-[12.5px] text-p-text-tertiary">Sin resultados</div>
                  ) : (
                    searchResults.slice(0, 5).map((s, i) => (
                      <div
                        key={s.id}
                        className={cn('flex items-center gap-[9px] px-3 py-2 hover:bg-p-bg-subtle', i > 0 && 'border-t border-p-border')}
                      >
                        <div
                          className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                          style={{ background: avatarColor(s.fullName || s.email) }}
                        >
                          {getInitials(s.fullName || s.email)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-medium text-p-text-primary">{s.fullName}</div>
                          <div className="text-[11px] text-p-text-tertiary">{s.email}</div>
                        </div>
                        <button
                          onClick={() => handleEnroll(s.id)}
                          disabled={enrollStudent.isPending || enrolledList.length >= max}
                          className={cn(
                            'px-3 py-1 rounded-lg border-none bg-p-accent text-p-accent-text text-xs font-medium font-[inherit] cursor-pointer',
                            enrolledList.length >= max && 'opacity-50',
                          )}
                        >
                          Inscribir
                        </button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {enrolledList.length >= max && (
                <div className="mt-2 px-3 py-2 bg-p-d-100 rounded-[10px] text-xs text-p-d-700 font-medium">
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
