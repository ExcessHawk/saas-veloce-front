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

function findName(list, id) {
  return list?.find((i) => i.id === id)?.name || '—';
}

/* ── Filter pill tabs ── */
const FilterTabs = ({ value, onChange, options }) => (
  <div style={{ display: 'flex', background: 'var(--p-bg-subtle)', borderRadius: 10, padding: 3, gap: 2 }}>
    {options.map(([val, label]) => (
      <button key={val} onClick={() => onChange(val)}
        style={{ padding: '5px 14px', borderRadius: 8, border: 'none', fontSize: 12.5, fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s',
          background: value === val ? 'var(--p-bg-base)' : 'transparent',
          color: value === val ? 'var(--p-text-primary)' : 'var(--p-text-secondary)',
          boxShadow: value === val ? 'var(--p-shadow-sm)' : 'none' }}>
        {label}
      </button>
    ))}
  </div>
);

/* ── Curso card (Docente) ── */
const DocenteCursoCard = ({ curso, subjectName, classroomName, yearName, onVerTareas }) => {
  const mc = getMateriaColor(subjectName);
  const [hovVer, setHovVer] = useState(false);
  const [hovAdd, setHovAdd] = useState(false);

  return (
    <div style={{ background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 16, boxShadow: 'var(--p-shadow-sm)', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'box-shadow 0.15s, transform 0.15s' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--p-shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--p-shadow-sm)'; e.currentTarget.style.transform = 'none'; }}>

      <div style={{ height: 4, background: mc.color, opacity: 0.7 }} />

      <div style={{ padding: '16px 18px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--p-text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{subjectName}</div>
            <div style={{ fontSize: 12.5, color: 'var(--p-text-secondary)', marginTop: 2 }}>{curso.name}</div>
          </div>
          <span style={{ padding: '2px 9px', borderRadius: '99px', fontSize: 11, fontWeight: 600, flexShrink: 0, marginTop: 2, background: 'var(--p-s-100)', color: 'var(--p-s-700)' }}>
            Activo
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[{ icon: '🏫', label: classroomName }, { icon: '📅', label: yearName }].map(({ icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--p-text-secondary)', fontSize: 12.5 }}>
              <span>{icon}</span><span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--p-border)', padding: '10px 14px', display: 'flex', gap: 8, background: 'var(--p-bg-subtle)' }}>
        <button onMouseEnter={() => setHovVer(true)} onMouseLeave={() => setHovVer(false)}
          onClick={onVerTareas}
          style={{ flex: 1, padding: '7px 0', borderRadius: 10, border: '1px solid var(--p-border)', background: hovVer ? 'var(--p-bg-muted)' : 'var(--p-bg-base)', color: 'var(--p-text-primary)', fontSize: 12.5, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.1s' }}>
          <Eye size={13} /> Ver Tareas
        </button>
        <button onMouseEnter={() => setHovAdd(true)} onMouseLeave={() => setHovAdd(false)}
          onClick={onVerTareas}
          style={{ flex: 1, padding: '7px 0', borderRadius: 10, border: '1px solid transparent', background: hovAdd ? 'var(--p-accent-hover)' : 'var(--p-accent)', color: 'var(--p-accent-text)', fontSize: 12.5, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.1s' }}>
          <Plus size={13} /> Agregar Tarea
        </button>
      </div>
    </div>
  );
};

/* ── Curso card (Estudiante) ── */
const EstudianteCursoCard = ({ curso, subjectName, classroomName, yearName, teacherName, activo = true, onVerTareas }) => {
  const mc = getMateriaColor(subjectName);
  const [hovVer, setHovVer] = useState(false);
  const initials = teacherName ? getInitials(teacherName.replace('Prof. ', '')) : '?';
  const bg = avatarColor(teacherName || '');

  return (
    <div style={{ background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 16, boxShadow: 'var(--p-shadow-sm)', display: 'flex', flexDirection: 'column', overflow: 'hidden', transition: 'box-shadow 0.15s, transform 0.15s' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--p-shadow-md)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--p-shadow-sm)'; e.currentTarget.style.transform = 'none'; }}>

      <div style={{ height: 4, background: mc.color, opacity: 0.7 }} />

      <div style={{ padding: '16px 18px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--p-text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>{subjectName}</div>
            <div style={{ fontSize: 12.5, color: 'var(--p-text-secondary)', marginTop: 2 }}>{curso.name}</div>
          </div>
          <span style={{ padding: '2px 9px', borderRadius: '99px', fontSize: 11, fontWeight: 600, flexShrink: 0, marginTop: 2,
            background: activo ? 'var(--p-s-100)' : 'var(--p-bg-subtle)',
            color: activo ? 'var(--p-s-700)' : 'var(--p-text-tertiary)' }}>
            {activo ? 'Activo' : 'Inactivo'}
          </span>
        </div>

        {/* Teacher chip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 10px', background: 'var(--p-bg-subtle)', borderRadius: 10, border: '1px solid var(--p-border)' }}>
          <div style={{ width: 22, height: 22, borderRadius: '99px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'white', flexShrink: 0 }}>
            {initials}
          </div>
          <span style={{ fontSize: 12.5, color: 'var(--p-text-secondary)', fontWeight: 500 }}>{teacherName || 'Sin docente'}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[{ icon: '🏫', label: classroomName }, { icon: '📅', label: yearName }].map(({ icon, label }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--p-text-secondary)', fontSize: 12.5 }}>
              <span>{icon}</span><span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--p-border)', padding: '10px 14px', background: 'var(--p-bg-subtle)' }}>
        <button onMouseEnter={() => setHovVer(true)} onMouseLeave={() => setHovVer(false)}
          onClick={onVerTareas}
          style={{ width: '100%', padding: '7px 0', borderRadius: 10, border: '1px solid var(--p-border)', background: hovVer ? 'var(--p-accent)' : 'var(--p-bg-base)', color: hovVer ? 'var(--p-accent-text)' : 'var(--p-text-primary)', fontSize: 12.5, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.12s' }}>
          <Eye size={13} /> Ver Tareas
        </button>
      </div>
    </div>
  );
};

/* ── Empty state ── */
const EmptyState = ({ role }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 16 }}>
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
      <rect x="12" y="20" width="64" height="52" rx="8" fill="var(--p-bg-subtle)" stroke="var(--p-border)" strokeWidth="1.5"/>
      <rect x="24" y="8" width="40" height="16" rx="5" fill="var(--p-bg-muted)" stroke="var(--p-border)" strokeWidth="1.5"/>
      <circle cx="44" cy="46" r="14" fill="var(--p-bg-muted)" stroke="var(--p-border)" strokeWidth="1.5"/>
      <line x1="44" y1="39" x2="44" y2="53" stroke="var(--p-border-strong)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="37" y1="46" x2="51" y2="46" stroke="var(--p-border-strong)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--p-text-primary)', marginBottom: 6 }}>
        {role === 'teacher' ? 'Aún no tienes cursos asignados' : 'Aún no estás inscrito en ningún curso'}
      </div>
      <div style={{ fontSize: 13.5, color: 'var(--p-text-secondary)', maxWidth: 320 }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--p-text-primary)', letterSpacing: '-0.03em', margin: 0 }}>Mis Cursos</h1>
            <span style={{ padding: '2px 10px', borderRadius: '99px', fontSize: 11.5, fontWeight: 600, background: badge.bg, color: badge.color }}>
              {badge.label}
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--p-text-secondary)', margin: 0 }}>
            {activeCount} curso{activeCount !== 1 ? 's' : ''} activo{activeCount !== 1 ? 's' : ''} · Ciclo 2024–2025
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200, maxWidth: 320 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--p-text-tertiary)', pointerEvents: 'none', display: 'flex' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Buscar por materia o aula…"
            style={{ width: '100%', paddingLeft: 34, paddingRight: query ? 32 : 11, padding: '7px 11px', paddingLeft: 34, fontSize: 13.5, fontFamily: 'inherit', border: '1px solid var(--p-border)', borderRadius: 10, background: 'var(--p-bg-base)', color: 'var(--p-text-primary)', outline: 'none' }} />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', color: 'var(--p-text-tertiary)', cursor: 'pointer', fontSize: 16, lineHeight: 1, display: 'flex', padding: 0 }}>×</button>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(272px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 200, background: 'var(--p-bg-subtle)', borderRadius: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState role={role} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(272px, 1fr))', gap: 16 }}>
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
