import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { useMyCourses } from '@/hooks/useMyCourses';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useSubjects } from '@/hooks/useSubjects';
import { useAcademicYears } from '@/hooks/useAcademicYears';
import { useMembers } from '@/hooks/useMembers';
import { getMateriaColor, getInitials, avatarColor } from '@/lib/materia-colors';
import { showApiError } from '@/lib/errors';
import { Eye, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

function findName(list, id) {
  return list?.find((i) => i.id === id)?.name || '—';
}

/* ── Filter pill tabs ── */
const FilterTabs = ({ value, onChange, options }) => (
  <div className="flex bg-p-bg-subtle rounded-[10px] p-[3px] gap-[2px]">
    {options.map(([val, label]) => (
      <button key={val} onClick={() => onChange(val)}
        className={cn(
          'px-[14px] py-[5px] rounded-lg border-none text-[12.5px] font-medium font-sans cursor-pointer transition-all duration-[120ms]',
          value === val
            ? 'bg-p-bg-base text-p-text-primary shadow-p-sm'
            : 'bg-transparent text-p-text-secondary',
        )}>
        {label}
      </button>
    ))}
  </div>
);

/* ── Curso card (Docente) ── */
const DocenteCursoCard = ({ curso, subjectName, classroomName, yearName, onVerTareas }) => {
  const mc = getMateriaColor(subjectName);

  return (
    <div className="bg-p-bg-base border border-p-border rounded-2xl shadow-p-sm flex flex-col overflow-hidden transition-[box-shadow,transform] duration-150 hover:shadow-p-md hover:-translate-y-px">
      <div className="h-1 opacity-70" style={{ background: mc.color }} />

      <div className="px-[18px] pt-4 pb-[14px] flex-1 flex flex-col gap-[10px]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[15.5px] font-bold text-p-text-primary tracking-[-0.02em] leading-[1.2]">{subjectName}</div>
            <div className="text-[12.5px] text-p-text-secondary mt-[2px]">{curso.name}</div>
          </div>
          <span className="px-[9px] py-[2px] rounded-full text-[11px] font-semibold shrink-0 mt-[2px] bg-p-s-100 text-p-s-700">
            Activo
          </span>
        </div>

        <div className="flex flex-col gap-[5px]">
          {[{ icon: '🏫', label: classroomName }, { icon: '📅', label: yearName }].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-[6px] text-p-text-secondary text-[12.5px]">
              <span>{icon}</span><span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-p-border px-[14px] py-[10px] flex gap-2 bg-p-bg-subtle">
        <button
          onClick={onVerTareas}
          className="flex-1 py-[7px] rounded-[10px] border border-p-border bg-p-bg-base text-p-text-primary text-[12.5px] font-medium font-sans cursor-pointer flex items-center justify-center gap-[5px] transition-all duration-100 hover:bg-p-bg-muted"
        >
          <Eye size={13} /> Ver Tareas
        </button>
        <button
          onClick={onVerTareas}
          className="flex-1 py-[7px] rounded-[10px] border border-transparent bg-p-accent text-p-accent-text text-[12.5px] font-medium font-sans cursor-pointer flex items-center justify-center gap-[5px] transition-all duration-100 hover:bg-p-accent-hover"
        >
          <Plus size={13} /> Agregar Tarea
        </button>
      </div>
    </div>
  );
};

/* ── Curso card (Estudiante) ── */
const EstudianteCursoCard = ({ curso, subjectName, classroomName, yearName, teacherName, activo = true, onVerTareas }) => {
  const mc = getMateriaColor(subjectName);
  const initials = teacherName ? getInitials(teacherName.replace('Prof. ', '')) : '?';
  const bg = avatarColor(teacherName || '');

  return (
    <div className="bg-p-bg-base border border-p-border rounded-2xl shadow-p-sm flex flex-col overflow-hidden transition-[box-shadow,transform] duration-150 hover:shadow-p-md hover:-translate-y-px">
      <div className="h-1 opacity-70" style={{ background: mc.color }} />

      <div className="px-[18px] pt-4 pb-[14px] flex-1 flex flex-col gap-[10px]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[15.5px] font-bold text-p-text-primary tracking-[-0.02em] leading-[1.2]">{subjectName}</div>
            <div className="text-[12.5px] text-p-text-secondary mt-[2px]">{curso.name}</div>
          </div>
          <span className={cn(
            'px-[9px] py-[2px] rounded-full text-[11px] font-semibold shrink-0 mt-[2px]',
            activo ? 'bg-p-s-100 text-p-s-700' : 'bg-p-bg-subtle text-p-text-tertiary',
          )}>
            {activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        {/* Teacher chip */}
        <div className="flex items-center gap-[7px] px-[10px] py-[6px] bg-p-bg-subtle rounded-[10px] border border-p-border">
          <div
            className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0"
            style={{ background: bg }}
          >
            {initials}
          </div>
          <span className="text-[12.5px] text-p-text-secondary font-medium">{teacherName || 'Sin docente'}</span>
        </div>

        <div className="flex flex-col gap-[5px]">
          {[{ icon: '🏫', label: classroomName }, { icon: '📅', label: yearName }].map(({ icon, label }) => (
            <div key={label} className="flex items-center gap-[6px] text-p-text-secondary text-[12.5px]">
              <span>{icon}</span><span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-p-border px-[14px] py-[10px] bg-p-bg-subtle">
        <button
          onClick={onVerTareas}
          className="w-full py-[7px] rounded-[10px] border border-p-border bg-p-bg-base text-p-text-primary text-[12.5px] font-medium font-sans cursor-pointer flex items-center justify-center gap-[6px] transition-all duration-[120ms] hover:bg-p-accent hover:text-p-accent-text hover:border-transparent"
        >
          <Eye size={13} /> Ver Tareas
        </button>
      </div>
    </div>
  );
};

/* ── Empty state ── */
const EmptyState = ({ role }) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 gap-4">
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
      <rect x="12" y="20" width="64" height="52" rx="8" fill="var(--p-bg-subtle)" stroke="var(--p-border)" strokeWidth="1.5"/>
      <rect x="24" y="8" width="40" height="16" rx="5" fill="var(--p-bg-muted)" stroke="var(--p-border)" strokeWidth="1.5"/>
      <circle cx="44" cy="46" r="14" fill="var(--p-bg-muted)" stroke="var(--p-border)" strokeWidth="1.5"/>
      <line x1="44" y1="39" x2="44" y2="53" stroke="var(--p-border-strong)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="37" y1="46" x2="51" y2="46" stroke="var(--p-border-strong)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
    <div className="text-center">
      <div className="text-[17px] font-semibold text-p-text-primary mb-[6px]">
        {role === 'teacher' ? 'Aún no tienes cursos asignados' : 'Aún no estás inscrito en ningún curso'}
      </div>
      <div className="text-[13.5px] text-p-text-secondary max-w-[320px]">
        {role === 'teacher'
          ? 'El director de tu institución te asignará cursos.'
          : 'Tu institución te asignará cursos cuando estén disponibles.'}
      </div>
    </div>
  </div>
);

/* ── Rol badge ── */
const ROL_BADGE = {
  teacher: { bg: 'oklch(90% 0.035 200)', color: 'oklch(30% 0.07 200)', label: 'Docente' },
  student: { bg: 'oklch(93% 0.040 150)', color: 'oklch(32% 0.09 150)', label: 'Estudiante' },
};

export default function MyCoursesPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'student';
  const navigate = useNavigate();

  const myCourses = useMyCourses();
  const classrooms = useClassrooms();
  const subjects = useSubjects();
  const academicYears = useAcademicYears();
  const members = useMembers();

  const [query, setQuery] = useState('');
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    if (myCourses.error) showApiError(myCourses.error);
  }, [myCourses.error]);

  const currentYearIds = useMemo(
    () => new Set((academicYears.data ?? []).filter((y) => y.isCurrent).map((y) => y.id)),
    [academicYears.data],
  );

  const isCursoActivo = (c) => !c.academicYearId || currentYearIds.has(c.academicYearId);

  const filtered = useMemo(() => {
    const data = myCourses.data ?? [];
    return data.filter((c) => {
      const subjectName = findName(subjects.data, c.subjectId).toLowerCase();
      const classroomName = findName(classrooms.data, c.classroomId).toLowerCase();
      const matchQ = !query.trim() || subjectName.includes(query.toLowerCase()) || classroomName.includes(query.toLowerCase()) || c.name.toLowerCase().includes(query.toLowerCase());
      const activo = isCursoActivo(c);
      const matchF = filtro === 'todos' ? true : filtro === 'activos' ? activo : !activo;
      return matchQ && matchF;
    });
  }, [myCourses.data, subjects.data, classrooms.data, query, filtro, currentYearIds]);

  const badge = ROL_BADGE[role] ?? ROL_BADGE.student;
  const activeCount = (myCourses.data ?? []).filter(isCursoActivo).length;

  const onVerTareas = (curso) => {
    navigate(`/dashboard/tareas/${curso.id}`, { state: { curso } });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-[10px]">
        <div>
          <div className="flex items-center gap-[10px] mb-1">
            <h1 className="text-[21px] font-bold text-p-text-primary tracking-[-0.03em] m-0">Mis Cursos</h1>
            <span
              className="px-[10px] py-[2px] rounded-full text-[11.5px] font-semibold"
              style={{ background: badge.bg, color: badge.color }}
            >
              {badge.label}
            </span>
          </div>
          <p className="text-[13px] text-p-text-secondary m-0">
            {activeCount} curso{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''} · Ciclo 2024–2025
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-[10px] flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <span className="absolute left-[11px] top-1/2 -translate-y-1/2 text-p-text-tertiary pointer-events-none flex">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por materia o aula…"
            className="w-full pl-[34px] pr-[11px] py-[7px] text-[13.5px] border border-p-border rounded-[10px] bg-p-bg-base text-p-text-primary outline-none font-sans"
            style={{ paddingRight: query ? 32 : 11 }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-[10px] top-1/2 -translate-y-1/2 border-none bg-transparent text-p-text-tertiary cursor-pointer text-[16px] leading-none flex p-0"
            >×</button>
          )}
        </div>
        {role === 'student' && (
          <FilterTabs
            value={filtro}
            onChange={setFiltro}
            options={[['todos', 'Todos'], ['activos', 'Activos'], ['inactivos', 'Inactivos']]}
          />
        )}
      </div>

      {/* Grid */}
      {myCourses.isLoading ? (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(272px,1fr))]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[200px] bg-p-bg-subtle rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState role={role} />
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(272px,1fr))]">
          {filtered.map((curso) => {
            const subjectName = findName(subjects.data, curso.subjectId);
            const classroomName = findName(classrooms.data, curso.classroomId);
            const yearName = findName(academicYears.data, curso.academicYearId);

            if (role === 'teacher') {
              return (
                <DocenteCursoCard key={curso.id} curso={curso}
                  subjectName={subjectName} classroomName={classroomName} yearName={yearName}
                  onVerTareas={() => onVerTareas(curso)} />
              );
            }

            const teacherMember = members.data?.find((m) => m.id === curso.teacherMemberId);
            const teacherName = teacherMember ? `Prof. ${teacherMember.fullName}` : '—';
            return (
              <EstudianteCursoCard key={curso.id} curso={curso}
                subjectName={subjectName} classroomName={classroomName} yearName={yearName}
                teacherName={teacherName}
                activo={isCursoActivo(curso)}
                onVerTareas={() => onVerTareas(curso)} />
            );
          })}
        </div>
      )}
    </div>
  );
}
