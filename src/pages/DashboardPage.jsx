import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useStats, useActivity } from '@/hooks/useDashboard';
import { useAcademicYears } from '@/hooks/useAcademicYears';
import { useCourses } from '@/hooks/useCourses';
import { useMyCourses } from '@/hooks/useMyCourses';
import { useMySubmissions } from '@/hooks/useSubmissions';
import { useSubscription } from '@/hooks/useBilling';
import { StatCard } from '@/components/StatCard';
import { getMateriaColor } from '@/lib/materia-colors';
import MyChildrenPage from '@/pages/MyChildrenPage';
import { cn } from '@/lib/utils';
import {
  DoorOpen, BookOpen, GraduationCap, Users,
  ClipboardList, CheckCircle, AlertCircle, CreditCard, Clock,
} from 'lucide-react';

/* ── Badge de rol ── */
const ROL_STYLE = {
  director: { cls: 'bg-[oklch(91%_0.040_250)] dark:bg-[oklch(22%_0.040_250)] text-[oklch(30%_0.06_250)] dark:text-[oklch(75%_0.06_250)]' },
  teacher:  { cls: 'bg-[oklch(90%_0.035_200)] dark:bg-[oklch(22%_0.035_200)] text-[oklch(30%_0.07_200)] dark:text-[oklch(75%_0.07_200)]' },
  student:  { cls: 'bg-[oklch(93%_0.040_150)] dark:bg-[oklch(22%_0.040_150)] text-[oklch(32%_0.09_150)] dark:text-[oklch(72%_0.09_150)]' },
  parent:   { cls: 'bg-[oklch(91%_0.040_100)] dark:bg-[oklch(22%_0.040_100)] text-[oklch(30%_0.07_100)] dark:text-[oklch(75%_0.07_100)]' },
};
const ROL_LABEL = { director: 'Director', teacher: 'Docente', student: 'Estudiante', parent: 'Padre/Madre' };

const RoleBadge = ({ role }) => {
  const s = ROL_STYLE[role] ?? ROL_STYLE.student;
  return (
    <span className={`px-[10px] py-[2px] rounded-full text-[11.5px] font-semibold ${s.cls}`}>
      {ROL_LABEL[role] ?? role}
    </span>
  );
};

const TYPE_ICON  = {
  member:     Users,
  course:     GraduationCap,
  enrollment: BookOpen,
  task:       ClipboardList,
  submission: CheckCircle,
};
const TYPE_COLOR = {
  member:     'bg-[oklch(88%_0.040_250)] dark:bg-[oklch(22%_0.040_250)]',
  course:     'bg-[oklch(88%_0.060_150)] dark:bg-[oklch(22%_0.060_150)]',
  enrollment: 'bg-[oklch(90%_0.050_75)]  dark:bg-[oklch(22%_0.050_75)]',
  task:       'bg-[oklch(91%_0.040_300)] dark:bg-[oklch(22%_0.040_300)]',
  submission: 'bg-[oklch(93%_0.040_150)] dark:bg-[oklch(22%_0.040_150)]',
};

function relTime(iso) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'Hace un momento';
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} h`;
  const d = Math.floor(h / 24);
  return `Hace ${d} día${d > 1 ? 's' : ''}`;
}

/* ── Quick links ── */
const QuickLinks = () => (
  <div className="bg-p-bg-base border border-p-border rounded-2xl shadow-p-sm p-5">
    <div className="text-sm font-semibold text-p-text-primary mb-[14px]">Accesos rápidos</div>
    <div className="flex flex-col gap-[2px]">
      {[
        { icon: DoorOpen,      label: 'Gestionar aulas',     href: '/dashboard/classrooms' },
        { icon: BookOpen,      label: 'Ver materias',         href: '/dashboard/subjects' },
        { icon: GraduationCap, label: 'Ver cursos',           href: '/dashboard/courses' },
        { icon: Users,         label: 'Gestionar miembros',   href: '/dashboard/members' },
        { icon: ClipboardList, label: 'Niveles de grado',     href: '/dashboard/grade-levels' },
      ].map(({ icon: Icon, label, href }) => (
        <a
          key={href}
          href={href}
          className="flex items-center gap-[10px] px-[10px] py-[9px] rounded-[10px] text-p-text-secondary text-[13.5px] no-underline transition-all duration-100 hover:bg-p-bg-subtle hover:text-p-text-primary"
        >
          <Icon size={15} />
          <span className="flex-1">{label}</span>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </a>
      ))}
    </div>
  </div>
);

/* ── Activity feed ── */
const ActivityFeed = () => {
  const { data: activities, isLoading } = useActivity();
  return (
    <div className="bg-p-bg-base border border-p-border rounded-2xl shadow-p-sm p-5">
      <div className="text-sm font-semibold text-p-text-primary mb-4">Actividad reciente</div>
      {isLoading ? (
        <div className="flex flex-col gap-[10px]">
          {[1, 2, 3].map((i) => <div key={`skeleton-activity-${i}`} className="h-9 bg-p-bg-subtle rounded-lg animate-pulse" />)}
        </div>
      ) : !activities?.length ? (
        <div className="text-[13px] text-p-text-tertiary text-center py-4">Sin actividad reciente</div>
      ) : (
        <div className="flex flex-col">
          {activities.map((a, i) => {
            const Icon = TYPE_ICON[a.type] ?? GraduationCap;
            const colorCls = TYPE_COLOR[a.type] ?? 'bg-p-bg-subtle';
            return (
              <div
                key={a.id ?? `activity-${i}`}
                className={cn(
                  'flex gap-3',
                  i < activities.length - 1 && 'pb-[14px] mb-[14px] border-b border-p-border',
                )}
              >
                <div className={cn('size-8 rounded-[10px] flex items-center justify-center text-p-text-primary dark:text-p-text-secondary shrink-0', colorCls)}>
                  <Icon size={14} />
                </div>
                <div className="flex-1">
                  <div className="text-[13.5px] font-medium text-p-text-primary">{a.text}</div>
                  <div className="text-[12.5px] text-p-text-secondary mt-[2px]">{a.detail}</div>
                  <div className="text-[11px] text-p-text-tertiary mt-1">{relTime(a.createdAt)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

/* ── Director dashboard ── */
function DirectorDashboard({ user, currentYearName }) {
  const stats = useStats();
  const courses = useCourses();
  const academicYears = useAcademicYears();
  const { data: sub } = useSubscription();

  const academicYearsMap = useMemo(
    () => Object.fromEntries((academicYears.data ?? []).map((y) => [y.id, y.name])),
    [academicYears.data],
  );

  const getCourseName = (c) => {
    if (c.name && !c.name.startsWith('course:')) return c.name;
    return '—';
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[22px] font-bold text-p-text-primary tracking-[-0.03em]">
            Bienvenido, {user?.fullName?.split(' ')[0] || user?.email || 'Director'}
          </div>
          <div className="flex items-center gap-2 mt-[6px]">
            <RoleBadge role="director" />
            {currentYearName && (
              <span className="text-[12.5px] text-p-text-tertiary">{currentYearName}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
        <StatCard label="Aulas"     value={stats.data?.classrooms ?? 0} icon={DoorOpen}      isLoading={stats.isLoading} />
        <StatCard label="Materias"  value={stats.data?.subjects ?? 0}   icon={BookOpen}      isLoading={stats.isLoading} />
        <StatCard label="Cursos"    value={stats.data?.courses ?? 0}    icon={GraduationCap} isLoading={stats.isLoading} />
        <StatCard label="Alumnos"   value={stats.data?.students ?? 0}   icon={Users}         isLoading={stats.isLoading} />
        <StatCard label="Docentes"  value={stats.data?.teachers ?? 0}   icon={ClipboardList} isLoading={stats.isLoading} />
      </div>

      <div className="grid gap-[14px] items-start [grid-template-columns:1fr_296px]">
        <div className="bg-p-bg-base border border-p-border rounded-2xl shadow-p-sm overflow-hidden">
          <div className="px-5 pt-[18px] pb-[14px] flex items-center justify-between border-b border-p-border">
            <div>
              <div className="text-sm font-semibold text-p-text-primary">Últimos cursos</div>
              <div className="text-[12px] text-p-text-tertiary mt-[2px]">
                {currentYearName ?? 'Ciclo vigente'}
              </div>
            </div>
            <a href="/dashboard/courses" className="px-3 py-[5px] rounded-lg border border-p-border bg-transparent text-p-text-secondary text-[12.5px] font-medium no-underline hover:bg-p-bg-subtle">
              Ver todos
            </a>
          </div>
          {courses.isLoading ? (
            <div className="p-5">{[1, 2, 3].map((i) => <div key={`skeleton-course-dir-${i}`} className="h-11 bg-p-bg-subtle rounded-lg mb-2 animate-pulse" />)}</div>
          ) : courses.data?.length === 0 ? (
            <div className="px-5 py-10 text-center text-p-text-tertiary text-[13.5px]">No hay cursos registrados aún</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-p-bg-subtle">
                    {['Nombre', 'Año académico'].map((h) => (
                      <th key={h} className="px-5 py-[9px] text-left text-[11px] font-semibold text-p-text-tertiary uppercase tracking-[0.06em]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {courses.data?.slice(0, 6).map((c, i) => (
                    <tr key={c.id} className={cn('hover:bg-p-bg-subtle', i !== 0 && 'border-t border-p-border')}>
                      <td className="px-5 py-3 text-[13.5px] font-medium text-p-text-primary">{getCourseName(c)}</td>
                      <td className="px-5 py-3">
                        <span className="text-[12px] font-mono text-p-text-secondary bg-p-bg-subtle px-2 py-[2px] rounded">
                          {c.academicYearId ? (academicYearsMap[c.academicYearId] ?? '—') : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-[14px]">
          {sub && (
            <a href="/dashboard/billing" className="no-underline">
              <div className="bg-p-bg-base border border-p-border rounded-2xl p-[14px] px-4 flex items-center gap-3">
                <div className="size-8 rounded-[10px] bg-[oklch(92%_0.020_250)] dark:bg-[oklch(22%_0.020_250)] flex items-center justify-center shrink-0">
                  <CreditCard size={15} color="oklch(35% 0.050 250)" className="dark:hidden" />
                  <CreditCard size={15} color="oklch(72% 0.050 250)" className="hidden dark:block" />
                </div>
                <div className="flex-1">
                  <div className="text-[12.5px] font-semibold text-p-text-primary">Plan {sub.planName}</div>
                  <div className="text-[11.5px] text-p-text-tertiary mt-[1px]">
                    {sub.currentPeriodEnd ? `Vence ${new Date(sub.currentPeriodEnd).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })}` : sub.status}
                  </div>
                </div>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--p-text-tertiary)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </a>
          )}
          <QuickLinks />
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}

/* ── Teacher dashboard ── */
function TeacherDashboard({ user, currentYearName }) {
  const myCourses = useMyCourses();
  const academicYears = useAcademicYears();

  const yearMap = useMemo(
    () => Object.fromEntries((academicYears.data ?? []).map((y) => [y.id, y.name])),
    [academicYears.data],
  );

  const courses = myCourses.data ?? [];

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-[22px] font-bold text-p-text-primary tracking-[-0.03em]">
          Bienvenido, {user?.fullName?.split(' ')[0] || user?.email || 'Docente'}
        </div>
        <div className="flex items-center gap-2 mt-[6px]">
          <RoleBadge role="teacher" />
          {currentYearName && <span className="text-[12.5px] text-p-text-tertiary">{currentYearName}</span>}
        </div>
      </div>

      <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
        <StatCard label="Mis cursos" value={courses.length} icon={GraduationCap} isLoading={myCourses.isLoading} />
      </div>

      {myCourses.isLoading ? (
        <div className="flex flex-col gap-3">{[1, 2, 3].map((i) => <div key={`skeleton-course-teacher-${i}`} className="h-20 bg-p-bg-subtle rounded-2xl animate-pulse" />)}</div>
      ) : courses.length === 0 ? (
        <div className="bg-p-bg-base border border-p-border rounded-2xl px-6 py-12 text-center">
          <GraduationCap size={36} className="text-p-text-tertiary mx-auto mb-3" />
          <div className="text-[14px] font-semibold text-p-text-primary mb-1">Sin cursos asignados</div>
          <div className="text-[13px] text-p-text-secondary">El director aún no te ha asignado a ningún curso.</div>
        </div>
      ) : (
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
          {courses.map((c) => {
            const mc = getMateriaColor(c.name);
            const yearName = c.academicYearId ? (yearMap[c.academicYearId] ?? '') : '';
            return (
              <a
                key={c.id}
                href={`/dashboard/tareas/${c.id}`}
                state={{ curso: c }}
                className="bg-p-bg-base border border-p-border rounded-2xl shadow-p-sm overflow-hidden no-underline hover:shadow-p-md hover:-translate-y-px transition-all duration-150 flex flex-col"
              >
                <div className="h-1 opacity-70" style={{ background: mc.color }} />
                <div className="p-4 flex flex-col gap-2">
                  <div className="text-[14.5px] font-bold text-p-text-primary tracking-[-0.02em] leading-snug">{c.name}</div>
                  {yearName && <div className="text-[12px] text-p-text-tertiary">{yearName}</div>}
                  <div className="mt-1 self-start px-2 py-[2px] rounded-full text-[11px] font-medium bg-p-s-100 text-p-s-700">
                    Ver tareas →
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Student dashboard ── */
function StudentDashboard({ user, currentYearName }) {
  const myCourses = useMyCourses();
  const mySubmissions = useMySubmissions();
  const academicYears = useAcademicYears();

  const yearMap = useMemo(
    () => Object.fromEntries((academicYears.data ?? []).map((y) => [y.id, y.name])),
    [academicYears.data],
  );

  const courses = myCourses.data ?? [];
  const submissions = mySubmissions.data ?? [];

  const submittedTaskIds = useMemo(() => new Set(submissions.map((s) => s.taskId)), [submissions]);

  const recentGrades = useMemo(
    () => submissions.filter((s) => s.score !== null && s.score !== undefined).slice(0, 5),
    [submissions],
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="text-[22px] font-bold text-p-text-primary tracking-[-0.03em]">
          Hola, {user?.fullName?.split(' ')[0] || user?.email || 'Estudiante'}
        </div>
        <div className="flex items-center gap-2 mt-[6px]">
          <RoleBadge role="student" />
          {currentYearName && <span className="text-[12.5px] text-p-text-tertiary">{currentYearName}</span>}
        </div>
      </div>

      <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
        <StatCard label="Mis cursos"   value={courses.length}        icon={GraduationCap} isLoading={myCourses.isLoading} />
        <StatCard label="Entregas"     value={submissions.length}    icon={CheckCircle}   isLoading={mySubmissions.isLoading} />
        <StatCard label="Calificados"  value={recentGrades.length}   icon={AlertCircle}   isLoading={mySubmissions.isLoading} />
      </div>

      <div className="grid gap-[14px] items-start [grid-template-columns:1fr_280px]">
        <div className="bg-p-bg-base border border-p-border rounded-2xl shadow-p-sm overflow-hidden">
          <div className="px-5 pt-[18px] pb-[14px] border-b border-p-border">
            <div className="text-sm font-semibold text-p-text-primary">Mis cursos</div>
          </div>
          {myCourses.isLoading ? (
            <div className="p-4 flex flex-col gap-2">{[1,2,3].map((i) => <div key={`skeleton-course-student-${i}`} className="h-12 bg-p-bg-subtle rounded-lg animate-pulse" />)}</div>
          ) : courses.length === 0 ? (
            <div className="py-10 text-center text-p-text-tertiary text-[13.5px]">No estás inscrito en ningún curso aún.</div>
          ) : (
            <div className="divide-y divide-p-border">
              {courses.map((c) => {
                const mc = getMateriaColor(c.name);
                const yearName = c.academicYearId ? (yearMap[c.academicYearId] ?? '') : '';
                return (
                  <a key={c.id} href={`/dashboard/tareas/${c.id}`} state={{ curso: c }}
                    className="flex items-center gap-3 px-5 py-[13px] no-underline hover:bg-p-bg-subtle transition-colors duration-100">
                    <div className="w-[6px] h-[6px] rounded-full shrink-0" style={{ background: mc.color }} />
                    <div className="flex-1">
                      <div className="text-[13.5px] font-medium text-p-text-primary">{c.name}</div>
                      {yearName && <div className="text-[12px] text-p-text-tertiary mt-[1px]">{yearName}</div>}
                    </div>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--p-text-tertiary)" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-p-bg-base border border-p-border rounded-2xl shadow-p-sm overflow-hidden">
          <div className="px-5 pt-[18px] pb-[14px] border-b border-p-border">
            <div className="text-sm font-semibold text-p-text-primary">Últimas calificaciones</div>
          </div>
          {mySubmissions.isLoading ? (
            <div className="p-4 flex flex-col gap-2">{[1,2,3].map((i) => <div key={`skeleton-grade-student-${i}`} className="h-10 bg-p-bg-subtle rounded-lg animate-pulse" />)}</div>
          ) : recentGrades.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-p-text-tertiary">Sin calificaciones aún</div>
          ) : (
            <div className="divide-y divide-p-border">
              {recentGrades.map((s) => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-[11px]">
                  <Clock size={13} className="text-p-text-tertiary shrink-0" />
                  <div className="flex-1 text-[13px] text-p-text-secondary truncate">
                    {s.taskTitle ?? 'Tarea'}
                  </div>
                  <span className={cn(
                    'text-[14px] font-bold tabular-nums',
                    s.score >= 7 ? 'text-p-s-700' : s.score >= 5 ? 'text-p-w-700' : 'text-p-d-700',
                  )}>
                    {s.score}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main export ── */
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'student';

  const academicYears = useAcademicYears();
  const currentYearName = useMemo(
    () => (academicYears.data ?? []).find((y) => y.isCurrent)?.name ?? null,
    [academicYears.data],
  );

  if (role === 'director') {
    return <DirectorDashboard user={user} currentYearName={currentYearName} />;
  }

  if (role === 'teacher') {
    return <TeacherDashboard user={user} currentYearName={currentYearName} />;
  }

  if (role === 'student') {
    return <StudentDashboard user={user} currentYearName={currentYearName} />;
  }

  if (role === 'parent') {
    return <MyChildrenPage />;
  }

  return null;
}
