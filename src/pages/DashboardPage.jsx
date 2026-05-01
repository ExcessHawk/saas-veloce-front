import { useAuthStore } from '@/stores/authStore';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useSubjects } from '@/hooks/useSubjects';
import { useCourses } from '@/hooks/useCourses';
import { useMembers } from '@/hooks/useMembers';
import { useSubscription } from '@/hooks/useBilling';
import { useActivity } from '@/hooks/useDashboard';
import { StatCard } from '@/components/StatCard';
import MyChildrenPage from '@/pages/MyChildrenPage';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  DoorOpen, BookOpen, GraduationCap, Users,
  GraduationCap as CourseIcon, ClipboardList, AlertCircle, CreditCard,
} from 'lucide-react';

/* ── Badge de rol ── */
const ROL_STYLE = {
  director:  { bg: 'oklch(93%_0.025_250)', color: 'oklch(30%_0.06_250)' },
  teacher:   { bg: 'oklch(90%_0.035_200)', color: 'oklch(30%_0.07_200)' },
  student:   { bg: 'oklch(93%_0.040_150)', color: 'oklch(32%_0.09_150)' },
  parent:    { bg: 'oklch(91%_0.040_100)', color: 'oklch(30%_0.07_100)' },
};
const ROL_LABEL = { director: 'Director', teacher: 'Docente', student: 'Estudiante', parent: 'Padre/Madre' };

const RoleBadge = ({ role }) => {
  const s = ROL_STYLE[role] ?? ROL_STYLE.student;
  return (
    <span
      className="px-[10px] py-[2px] rounded-full text-[11.5px] font-semibold"
      style={{ background: `oklch(${s.bg.replace(/_/g, ' ')})`, color: `oklch(${s.color.replace(/_/g, ' ')})` }}
    >
      {ROL_LABEL[role] ?? role}
    </span>
  );
};

const TYPE_ICON  = { member: Users, course: GraduationCap, enrollment: BookOpen };
const TYPE_COLOR = { member: 'oklch(88% 0.040 250)', course: 'oklch(88% 0.060 150)', enrollment: 'oklch(90% 0.050 75)' };

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
        { icon: DoorOpen,      label: 'Gestionar aulas',   href: '/dashboard/classrooms' },
        { icon: BookOpen,      label: 'Ver materias',       href: '/dashboard/subjects' },
        { icon: GraduationCap, label: 'Ver cursos',         href: '/dashboard/courses' },
        { icon: Users,         label: 'Gestionar miembros', href: '/dashboard/members' },
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
          {[1, 2, 3].map((i) => <div key={i} className="h-9 bg-p-bg-subtle rounded-lg animate-pulse" />)}
        </div>
      ) : !activities?.length ? (
        <div className="text-[13px] text-p-text-tertiary text-center py-4">Sin actividad reciente</div>
      ) : (
        <div className="flex flex-col">
          {activities.map((a, i) => {
            const Icon = TYPE_ICON[a.type] ?? GraduationCap;
            const color = TYPE_COLOR[a.type] ?? 'var(--p-bg-subtle)';
            return (
              <div
                key={i}
                className={cn(
                  'flex gap-3',
                  i < activities.length - 1 && 'pb-[14px] mb-[14px] border-b border-p-border',
                )}
              >
                <div
                  className="w-8 h-8 rounded-[10px] flex items-center justify-center text-[oklch(30%_0.010_80)] shrink-0"
                  style={{ background: color }}
                >
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
function DirectorDashboard({ user, classrooms, subjects, courses, members }) {
  const classroomMap = Object.fromEntries((classrooms.data ?? []).map((c) => [c.id, c.name]));
  const subjectMap = Object.fromEntries((subjects.data ?? []).map((s) => [s.id, s.name]));
  const { data: sub } = useSubscription();

  // Resolve course display name: use subject name if c.name looks like a raw ID
  const getCourseName = (c) => {
    if (c.name && !c.name.startsWith('course:')) return c.name;
    const subjectName = subjectMap[c.subjectId];
    return subjectName ?? c.name ?? '—';
  };
  return (
    <div className="flex flex-col gap-5">
      {/* Welcome */}
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <div className="text-[22px] font-bold text-p-text-primary tracking-[-0.03em]">
            Bienvenido, {user?.fullName?.split(' ')[0] || user?.email || 'Director'}
          </div>
          <div className="flex items-center gap-2 mt-[6px]">
            <RoleBadge role="director" />
            <span className="text-[12.5px] text-p-text-tertiary">Ciclo 2024–2025</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
        <StatCard label="Aulas"    value={classrooms.data?.length ?? 0} icon={DoorOpen}      isLoading={classrooms.isLoading} />
        <StatCard label="Materias" value={subjects.data?.length ?? 0}   icon={BookOpen}      isLoading={subjects.isLoading}   />
        <StatCard label="Cursos"   value={courses.data?.length ?? 0}    icon={GraduationCap} isLoading={courses.isLoading}    />
        <StatCard label="Miembros" value={members.data?.length ?? 0}    icon={Users}         isLoading={members.isLoading}    />
      </div>

      {/* Table + right col */}
      <div className="grid gap-[14px] items-start [grid-template-columns:1fr_296px]">
        {/* Courses table */}
        <div className="bg-p-bg-base border border-p-border rounded-2xl shadow-p-sm overflow-hidden">
          <div className="px-5 pt-[18px] pb-[14px] flex items-center justify-between border-b border-p-border">
            <div>
              <div className="text-sm font-semibold text-p-text-primary">Últimos cursos</div>
              <div className="text-[12px] text-p-text-tertiary mt-[2px]">Ciclo vigente</div>
            </div>
            <a
              href="/dashboard/courses"
              className="px-3 py-[5px] rounded-lg border border-p-border bg-transparent text-p-text-secondary text-[12.5px] font-medium no-underline transition-all duration-100 hover:bg-p-bg-subtle"
            >
              Ver todos
            </a>
          </div>
          {courses.isLoading ? (
            <div className="p-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-11 bg-p-bg-subtle rounded-lg mb-2 animate-pulse" />
              ))}
            </div>
          ) : courses.data?.length === 0 ? (
            <div className="px-5 py-10 text-center text-p-text-tertiary text-[13.5px]">
              No hay cursos registrados aún
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-p-bg-subtle">
                    {['Nombre', 'Aula', 'Año académico'].map((h) => (
                      <th key={h} className="px-5 py-[9px] text-left text-[11px] font-semibold text-p-text-tertiary uppercase tracking-[0.06em] whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {courses.data?.slice(0, 6).map((c, i) => (
                    <tr
                      key={c.id}
                      className={cn('hover:bg-p-bg-subtle', i !== 0 && 'border-t border-p-border')}
                    >
                      <td className="px-5 py-3 text-[13.5px] font-medium text-p-text-primary">{getCourseName(c)}</td>
                      <td className="px-5 py-3 text-[13px] text-p-text-secondary">{classroomMap[c.classroomId] ?? '—'}</td>
                      <td className="px-5 py-3">
                        <span className="text-[12px] font-mono text-p-text-secondary bg-p-bg-subtle px-2 py-[2px] rounded">
                          {c.createdAt ? format(new Date(c.createdAt), 'yyyy') : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-[14px]">
          {sub && (
            <a href="/dashboard/billing" className="no-underline">
              <div className="bg-p-bg-base border border-p-border rounded-2xl p-[14px] px-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-[10px] bg-[oklch(92%_0.020_250)] flex items-center justify-center shrink-0">
                  <CreditCard size={15} color="oklch(35% 0.050 250)" />
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

/* ── Teacher / Student / Parent placeholder dashboards ── */
function SimpleDashboard({ user, role }) {
  const roleLabel = ROL_LABEL[role] ?? role;
  const greeting = role === 'student' ? 'Hola' : 'Bienvenido';
  return (
    <div className="flex flex-col gap-5">
      <div>
        <div className="flex items-center gap-[10px] mb-1">
          <div className="text-[22px] font-bold text-p-text-primary tracking-[-0.03em]">
            {greeting}, {user?.fullName?.split(' ')[0] || user?.email || roleLabel}
          </div>
          <RoleBadge role={role} />
        </div>
        <div className="text-[13px] text-p-text-secondary">Ciclo 2024–2025</div>
      </div>
      <div className="flex flex-col items-center justify-center px-6 py-20 gap-[14px] bg-p-bg-base border border-p-border rounded-2xl">
        <GraduationCap size={44} className="text-p-text-tertiary" />
        <div className="text-center">
          <div className="text-base font-semibold text-p-text-primary mb-[6px]">
            {role === 'parent' ? 'Panel de Padre' : 'Ve a Mis Cursos'}
          </div>
          <div className="text-[13.5px] text-p-text-secondary">
            {role === 'parent'
              ? 'Pronto podrás ver el avance de tus hijos desde aquí.'
              : 'Accede a tus cursos y tareas desde el menú lateral.'}
          </div>
        </div>
        {role !== 'parent' && (
          <a
            href="/dashboard/mis-cursos"
            className="px-[18px] py-2 rounded-[10px] bg-p-accent text-p-accent-text text-[13.5px] font-medium no-underline transition-all duration-100"
          >
            Ver mis cursos →
          </a>
        )}
      </div>
    </div>
  );
}

/* ── Main export ── */
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'student';

  const classrooms = useClassrooms();
  const subjects = useSubjects();
  const courses = useCourses();
  const members = useMembers();

  if (role === 'director') {
    return <DirectorDashboard user={user} classrooms={classrooms} subjects={subjects} courses={courses} members={members} />;
  }

  if (role === 'parent') {
    return <MyChildrenPage />;
  }

  return <SimpleDashboard user={user} role={role} />;
}
