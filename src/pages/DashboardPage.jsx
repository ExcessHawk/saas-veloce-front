import { useAuthStore } from '@/stores/authStore';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useSubjects } from '@/hooks/useSubjects';
import { useCourses } from '@/hooks/useCourses';
import { useMembers } from '@/hooks/useMembers';
import { useSubscription } from '@/hooks/useBilling';
import { useActivity } from '@/hooks/useDashboard';
import { StatCard } from '@/components/StatCard';
import MyChildrenPage from '@/pages/MyChildrenPage';
import { format } from 'date-fns';
import {
  DoorOpen, BookOpen, GraduationCap, Users,
  GraduationCap as CourseIcon, ClipboardList, AlertCircle, CreditCard,
} from 'lucide-react';

/* ── Badge de rol ── */
const ROL_STYLE = {
  director:  { bg: 'oklch(93% 0.025 250)', color: 'oklch(30% 0.06 250)' },
  teacher:   { bg: 'oklch(90% 0.035 200)', color: 'oklch(30% 0.07 200)' },
  student:   { bg: 'oklch(93% 0.040 150)', color: 'oklch(32% 0.09 150)' },
  parent:    { bg: 'oklch(91% 0.040 100)', color: 'oklch(30% 0.07 100)' },
};
const ROL_LABEL = { director: 'Director', teacher: 'Docente', student: 'Estudiante', parent: 'Padre/Madre' };

const RoleBadge = ({ role }) => {
  const s = ROL_STYLE[role] ?? ROL_STYLE.student;
  return (
    <span style={{ padding: '2px 10px', borderRadius: '99px', fontSize: 11.5, fontWeight: 600, background: s.bg, color: s.color }}>
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
  <div style={{ background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 16, boxShadow: 'var(--p-shadow-sm)', padding: 20 }}>
    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--p-text-primary)', marginBottom: 14 }}>Accesos rápidos</div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {[
        { icon: DoorOpen,      label: 'Gestionar aulas',   href: '/dashboard/classrooms' },
        { icon: BookOpen,      label: 'Ver materias',       href: '/dashboard/subjects' },
        { icon: GraduationCap, label: 'Ver cursos',         href: '/dashboard/courses' },
        { icon: Users,         label: 'Gestionar miembros', href: '/dashboard/members' },
      ].map(({ icon: Icon, label, href }) => (
        <a key={href} href={href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, color: 'var(--p-text-secondary)', fontSize: 13.5, textDecoration: 'none', transition: 'all 0.1s' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--p-bg-subtle)'; e.currentTarget.style.color = 'var(--p-text-primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--p-text-secondary)'; }}>
          <Icon size={15} />
          <span style={{ flex: 1 }}>{label}</span>
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
    <div style={{ background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 16, boxShadow: 'var(--p-shadow-sm)', padding: 20 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--p-text-primary)', marginBottom: 16 }}>Actividad reciente</div>
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[1, 2, 3].map((i) => <div key={i} style={{ height: 36, background: 'var(--p-bg-subtle)', borderRadius: 8 }} />)}
        </div>
      ) : !activities?.length ? (
        <div style={{ fontSize: 13, color: 'var(--p-text-tertiary)', textAlign: 'center', padding: '16px 0' }}>Sin actividad reciente</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {activities.map((a, i) => {
            const Icon = TYPE_ICON[a.type] ?? GraduationCap;
            const color = TYPE_COLOR[a.type] ?? 'var(--p-bg-subtle)';
            return (
              <div key={i} style={{ display: 'flex', gap: 12, paddingBottom: i < activities.length - 1 ? 14 : 0, marginBottom: i < activities.length - 1 ? 14 : 0, borderBottom: i < activities.length - 1 ? '1px solid var(--p-border)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'oklch(30% 0.010 80)', flexShrink: 0 }}>
                  <Icon size={14} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--p-text-primary)' }}>{a.text}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--p-text-secondary)', marginTop: 2 }}>{a.detail}</div>
                  <div style={{ fontSize: 11, color: 'var(--p-text-tertiary)', marginTop: 4 }}>{relTime(a.createdAt)}</div>
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
  const { data: sub } = useSubscription();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Welcome */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--p-text-primary)', letterSpacing: '-0.03em' }}>
            Bienvenido, {user?.fullName?.split(' ')[0] || user?.email || 'Director'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
            <RoleBadge role="director" />
            <span style={{ fontSize: 12.5, color: 'var(--p-text-tertiary)' }}>Ciclo 2024–2025</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        <StatCard label="Aulas"    value={classrooms.data?.length ?? 0} icon={DoorOpen}      isLoading={classrooms.isLoading} />
        <StatCard label="Materias" value={subjects.data?.length ?? 0}   icon={BookOpen}      isLoading={subjects.isLoading}   />
        <StatCard label="Cursos"   value={courses.data?.length ?? 0}    icon={GraduationCap} isLoading={courses.isLoading}    />
        <StatCard label="Miembros" value={members.data?.length ?? 0}    icon={Users}         isLoading={members.isLoading}    />
      </div>

      {/* Table + right col */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 296px', gap: 14, alignItems: 'start' }}>
        {/* Courses table */}
        <div style={{ background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 16, boxShadow: 'var(--p-shadow-sm)', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--p-border)' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--p-text-primary)' }}>Últimos cursos</div>
              <div style={{ fontSize: 12, color: 'var(--p-text-tertiary)', marginTop: 2 }}>Ciclo vigente</div>
            </div>
            <a href="/dashboard/courses" style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--p-border)', background: 'transparent', color: 'var(--p-text-secondary)', fontSize: 12.5, fontWeight: 500, textDecoration: 'none', transition: 'all 0.1s' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--p-bg-subtle)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
              Ver todos
            </a>
          </div>
          {courses.isLoading ? (
            <div style={{ padding: 20 }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ height: 44, background: 'var(--p-bg-subtle)', borderRadius: 8, marginBottom: 8 }} />
              ))}
            </div>
          ) : courses.data?.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--p-text-tertiary)', fontSize: 13.5 }}>
              No hay cursos registrados aún
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--p-bg-subtle)' }}>
                    {['Nombre', 'Aula', 'Año académico'].map((h) => (
                      <th key={h} style={{ padding: '9px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--p-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {courses.data?.slice(0, 6).map((c, i) => (
                    <tr key={c.id} style={{ borderTop: i === 0 ? 'none' : '1px solid var(--p-border)' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--p-bg-subtle)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 20px', fontSize: 13.5, fontWeight: 500, color: 'var(--p-text-primary)' }}>{c.name}</td>
                      <td style={{ padding: '12px 20px', fontSize: 13, color: 'var(--p-text-secondary)' }}>{classroomMap[c.classroomId] ?? '—'}</td>
                      <td style={{ padding: '12px 20px' }}>
                        <span style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--p-text-secondary)', background: 'var(--p-bg-subtle)', padding: '2px 8px', borderRadius: 4 }}>
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {sub && (
            <a href="/dashboard/billing" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: 'oklch(92% 0.020 250)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CreditCard size={15} color="oklch(35% 0.050 250)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--p-text-primary)' }}>Plan {sub.planName}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--p-text-tertiary)', marginTop: 1 }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--p-text-primary)', letterSpacing: '-0.03em' }}>
            {greeting}, {user?.fullName?.split(' ')[0] || user?.email || roleLabel}
          </div>
          <RoleBadge role={role} />
        </div>
        <div style={{ fontSize: 13, color: 'var(--p-text-secondary)' }}>Ciclo 2024–2025</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 14, background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 16 }}>
        <GraduationCap size={44} style={{ color: 'var(--p-text-tertiary)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--p-text-primary)', marginBottom: 6 }}>
            {role === 'parent' ? 'Panel de Padre' : 'Ve a Mis Cursos'}
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--p-text-secondary)' }}>
            {role === 'parent'
              ? 'Pronto podrás ver el avance de tus hijos desde aquí.'
              : 'Accede a tus cursos y tareas desde el menú lateral.'}
          </div>
        </div>
        {role !== 'parent' && (
          <a href="/dashboard/mis-cursos" style={{ padding: '8px 18px', borderRadius: 10, background: 'var(--p-accent)', color: 'var(--p-accent-text)', fontSize: 13.5, fontWeight: 500, textDecoration: 'none', transition: 'all 0.1s' }}>
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
