import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useMyChildren } from '@/hooks/useMyChildren';
import { MATERIA_COLORS, avatarColor, getInitials } from '@/lib/materia-colors';
import { Users, GraduationCap, BookOpen, AlertTriangle, ChevronDown, Mail } from 'lucide-react';

const materiaColor = (m) => MATERIA_COLORS[m] ?? { bg: 'var(--p-bg-subtle)', color: 'var(--p-text-secondary)' };

const RoleBadge = () => (
  <span style={{ padding: '2px 10px', borderRadius: '99px', fontSize: 11.5, fontWeight: 600, background: 'oklch(91% 0.040 100)', color: 'oklch(30% 0.07 100)' }}>
    Padre
  </span>
);

const PadreEmptyState = () => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 16, background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 16 }}>
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
      <circle cx="44" cy="30" r="16" fill="var(--p-bg-subtle)" stroke="var(--p-border)" strokeWidth="1.5" />
      <path d="M14 74a30 30 0 0 1 60 0" fill="var(--p-bg-subtle)" stroke="var(--p-border)" strokeWidth="1.5" />
      <circle cx="68" cy="32" r="10" fill="var(--p-bg-muted)" stroke="var(--p-border)" strokeWidth="1.5" />
      <path d="M55 62a18 18 0 0 1 26 0" fill="var(--p-bg-muted)" stroke="var(--p-border)" strokeWidth="1.5" />
    </svg>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--p-text-primary)', marginBottom: 6 }}>No tienes hijos vinculados aún</div>
      <div style={{ fontSize: 13.5, color: 'var(--p-text-secondary)', maxWidth: 340 }}>
        Contacta al director de la institución para vincular a tus hijos a tu cuenta.
      </div>
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'oklch(93% 0.018 250)', border: '1px solid oklch(84% 0.032 250)', borderRadius: 10, fontSize: 13, color: 'oklch(30% 0.05 250)' }}>
      <Mail size={14} />
      <span>Escribe al director de tu escuela</span>
    </div>
  </div>
);

const HijoCard = ({ hijo }) => {
  const [expanded, setExpanded] = useState(true);
  const cursos = hijo.cursos ?? [];
  const pendientes = cursos.reduce((a, c) => a + (c.tareasPendientes || 0), 0);
  const bg = hijo.avatarBg || avatarColor(hijo.nombre || hijo.name || '');
  const initials = hijo.avatar || getInitials(hijo.nombre || hijo.name || '');
  const nombre = hijo.nombre || hijo.name || 'Alumno';
  const grado = hijo.grado || hijo.gradeLevel || '—';

  return (
    <div style={{ background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 24, boxShadow: 'var(--p-shadow-sm)', overflow: 'hidden' }}>
      <div
        onClick={() => setExpanded((e) => !e)}
        style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', userSelect: 'none' }}
      >
        <div style={{ width: 46, height: 46, borderRadius: '99px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: 'white', flexShrink: 0 }}>
          {initials}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--p-text-primary)', letterSpacing: '-0.02em' }}>{nombre}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 3 }}>
            <span style={{ fontSize: 12.5, color: 'var(--p-text-secondary)' }}>{grado}</span>
            <span style={{ width: 3, height: 3, borderRadius: '99px', background: 'var(--p-text-tertiary)' }} />
            <span style={{ fontSize: 12.5, color: 'var(--p-text-secondary)' }}>{cursos.length} cursos</span>
          </div>
        </div>
        {pendientes > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', background: 'var(--p-w-100)', borderRadius: '99px', border: '1px solid var(--p-w-500)' }}>
            <span style={{ width: 6, height: 6, borderRadius: '99px', background: 'var(--p-w-500)' }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--p-w-700)' }}>
              {pendientes} tarea{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''}
            </span>
          </div>
        )}
        <div style={{ color: 'var(--p-text-tertiary)', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <ChevronDown size={16} />
        </div>
      </div>

      {expanded && (
        <div style={{ borderTop: '1px solid var(--p-border)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 0, padding: '7px 22px', background: 'var(--p-bg-subtle)' }}>
            {['Materia', 'Docente', 'Tareas pend.'].map((h) => (
              <div key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--p-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
            ))}
          </div>
          {cursos.length === 0 ? (
            <div style={{ padding: '20px 22px', textAlign: 'center', color: 'var(--p-text-tertiary)', fontSize: 13 }}>
              Aún no hay cursos asignados.
            </div>
          ) : (
            cursos.map((curso, i) => {
              const mat = curso.materia || curso.subjectName || '—';
              const doc = curso.docente || curso.teacherName || 'Sin docente';
              const pend = curso.tareasPendientes ?? 0;
              const colors = materiaColor(mat);
              return (
                <div
                  key={curso.id || i}
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', alignItems: 'center', gap: 0, padding: '12px 22px', borderTop: '1px solid var(--p-border)', transition: 'background 0.08s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--p-bg-subtle)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '99px', background: colors.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--p-text-primary)' }}>{mat}</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--p-text-secondary)' }}>{doc}</div>
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    {pend > 0 ? (
                      <span style={{ padding: '2px 9px', borderRadius: '99px', fontSize: 11.5, fontWeight: 700, background: 'var(--p-w-100)', color: 'var(--p-w-700)', minWidth: 28, textAlign: 'center' }}>
                        {pend}
                      </span>
                    ) : (
                      <span style={{ padding: '2px 9px', borderRadius: '99px', fontSize: 11.5, fontWeight: 500, background: 'var(--p-s-100)', color: 'var(--p-s-700)' }}>
                        Al día
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

const StatCardMini = ({ label, val, Icon, warn }) => (
  <div style={{ background: 'var(--p-bg-base)', border: `1px solid ${warn ? 'var(--p-w-500)' : 'var(--p-border)'}`, borderRadius: 16, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, boxShadow: 'var(--p-shadow-sm)' }}>
    <div style={{ width: 38, height: 38, borderRadius: 10, background: warn ? 'var(--p-w-100)' : 'var(--p-bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: warn ? 'var(--p-w-700)' : 'var(--p-text-secondary)', flexShrink: 0 }}>
      <Icon size={17} />
    </div>
    <div>
      <div style={{ fontSize: 26, fontWeight: 700, color: warn ? 'var(--p-w-700)' : 'var(--p-text-primary)', letterSpacing: '-0.04em', lineHeight: 1 }}>{val}</div>
      <div style={{ fontSize: 12, color: 'var(--p-text-secondary)', marginTop: 4, fontWeight: 500 }}>{label}</div>
    </div>
  </div>
);

export default function MyChildrenPage() {
  const user = useAuthStore((s) => s.user);
  const { data: hijos = [], isLoading, error } = useMyChildren();

  const totalCursos = hijos.reduce((a, h) => a + (h.cursos?.length || 0), 0);
  const totalPend = hijos.reduce(
    (a, h) => a + (h.cursos?.reduce((b, c) => b + (c.tareasPendientes || 0), 0) || 0),
    0,
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 21, fontWeight: 700, color: 'var(--p-text-primary)', letterSpacing: '-0.03em', margin: 0 }}>
              {user?.fullName ? `Hola, ${user.fullName.split(' ')[0]}` : 'Panel de Padre'}
            </h1>
            <RoleBadge />
          </div>
          <p style={{ fontSize: 13, color: 'var(--p-text-secondary)', margin: 0 }}>
            {hijos.length} hijo{hijos.length === 1 ? '' : 's'} vinculado{hijos.length === 1 ? '' : 's'}
            {totalPend > 0 && (
              <>
                {' · '}
                <span style={{ color: 'var(--p-w-700)', fontWeight: 500 }}>
                  {totalPend} tarea{totalPend > 1 ? 's' : ''} pendiente{totalPend > 1 ? 's' : ''}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {totalPend > 0 && (
        <div style={{ padding: '12px 16px', background: 'var(--p-w-100)', border: '1px solid var(--p-w-500)', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <AlertTriangle size={16} style={{ color: 'var(--p-w-700)', flexShrink: 0 }} />
          <span style={{ fontSize: 13.5, color: 'var(--p-w-700)', fontWeight: 500 }}>
            Tus hijos tienen <strong>{totalPend} tarea{totalPend > 1 ? 's' : ''} pendiente{totalPend > 1 ? 's' : ''}</strong> por entregar.
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <StatCardMini label="Hijos vinculados" val={hijos.length} Icon={Users} />
        <StatCardMini label="Cursos en total" val={totalCursos} Icon={GraduationCap} />
        <StatCardMini label="Tareas pendientes" val={totalPend} Icon={BookOpen} warn={totalPend > 0} />
      </div>

      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ height: 120, background: 'var(--p-bg-subtle)', borderRadius: 24, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : error ? (
        <PadreEmptyState />
      ) : hijos.length === 0 ? (
        <PadreEmptyState />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {hijos.map((h) => (
            <HijoCard key={h.id} hijo={h} />
          ))}
        </div>
      )}
    </div>
  );
}
