import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useMyChildren } from '@/hooks/useMyChildren';
import { MATERIA_COLORS, avatarColor, getInitials } from '@/lib/materia-colors';
import { Users, GraduationCap, BookOpen, AlertTriangle, ChevronDown, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';

const materiaColor = (m) => MATERIA_COLORS[m] ?? { bg: 'var(--p-bg-subtle)', color: 'var(--p-text-secondary)' };

const RoleBadge = () => (
  <span className="px-[10px] py-[2px] rounded-full text-[11.5px] font-semibold bg-[oklch(91%_0.040_100)] text-[oklch(30%_0.07_100)]">
    Padre
  </span>
);

const PadreEmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 px-6 gap-4 bg-p-bg-base border border-p-border rounded-2xl">
    <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
      <circle cx="44" cy="30" r="16" fill="var(--p-bg-subtle)" stroke="var(--p-border)" strokeWidth="1.5" />
      <path d="M14 74a30 30 0 0 1 60 0" fill="var(--p-bg-subtle)" stroke="var(--p-border)" strokeWidth="1.5" />
      <circle cx="68" cy="32" r="10" fill="var(--p-bg-muted)" stroke="var(--p-border)" strokeWidth="1.5" />
      <path d="M55 62a18 18 0 0 1 26 0" fill="var(--p-bg-muted)" stroke="var(--p-border)" strokeWidth="1.5" />
    </svg>
    <div className="text-center">
      <div className="text-[16px] font-semibold text-p-text-primary mb-[6px]">No tienes hijos vinculados aún</div>
      <div className="text-[13.5px] text-p-text-secondary max-w-[340px]">
        Contacta al director de la institución para vincular a tus hijos a tu cuenta.
      </div>
    </div>
    <div className="flex items-center gap-2 px-4 py-[10px] bg-[oklch(93%_0.018_250)] border border-[oklch(84%_0.032_250)] rounded-[10px] text-[13px] text-[oklch(30%_0.05_250)]">
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
    <div className="bg-p-bg-base border border-p-border rounded-[24px] shadow-p-sm overflow-hidden">
      <div
        onClick={() => setExpanded((e) => !e)}
        className="px-[22px] py-[18px] flex items-center gap-[14px] cursor-pointer select-none"
      >
        <div
          className="w-[46px] h-[46px] rounded-full flex items-center justify-center text-[15px] font-bold text-white shrink-0"
          style={{ background: bg }}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[16px] font-bold text-p-text-primary tracking-[-0.02em]">{nombre}</div>
          <div className="flex items-center gap-[10px] mt-[3px]">
            <span className="text-[12.5px] text-p-text-secondary">{grado}</span>
            <span className="w-[3px] h-[3px] rounded-full bg-p-text-tertiary" />
            <span className="text-[12.5px] text-p-text-secondary">{cursos.length} cursos</span>
          </div>
        </div>
        {pendientes > 0 && (
          <div className="flex items-center gap-[6px] px-3 py-[5px] bg-p-w-100 rounded-full border border-p-w-500">
            <span className="w-[6px] h-[6px] rounded-full bg-p-w-500" />
            <span className="text-[12px] font-semibold text-p-w-700">
              {pendientes} tarea{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''}
            </span>
          </div>
        )}
        <div
          className="text-p-text-tertiary transition-transform duration-200"
          style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <ChevronDown size={16} />
        </div>
      </div>

      {expanded && (
        <div className="border-t border-p-border">
          <div className="grid [grid-template-columns:1fr_1fr_auto] gap-0 px-[22px] py-[7px] bg-p-bg-subtle">
            {['Materia', 'Docente', 'Tareas pend.'].map((h) => (
              <div key={h} className="text-[11px] font-semibold text-p-text-tertiary uppercase tracking-[0.06em]">{h}</div>
            ))}
          </div>
          {cursos.length === 0 ? (
            <div className="px-[22px] py-5 text-center text-p-text-tertiary text-[13px]">
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
                  className="grid [grid-template-columns:1fr_1fr_auto] items-center gap-0 px-[22px] py-3 border-t border-p-border transition-[background] duration-[80ms] hover:bg-p-bg-subtle"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: colors.color }} />
                    <span className="text-[13.5px] font-medium text-p-text-primary">{mat}</span>
                  </div>
                  <div className="text-[13px] text-p-text-secondary">{doc}</div>
                  <div className="flex justify-start">
                    {pend > 0 ? (
                      <span className="px-[9px] py-[2px] rounded-full text-[11.5px] font-bold bg-p-w-100 text-p-w-700 min-w-[28px] text-center">
                        {pend}
                      </span>
                    ) : (
                      <span className="px-[9px] py-[2px] rounded-full text-[11.5px] font-medium bg-p-s-100 text-p-s-700">
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
  <div className={cn(
    'bg-p-bg-base border rounded-2xl px-5 py-4 flex items-center gap-[14px] shadow-p-sm',
    warn ? 'border-p-w-500' : 'border-p-border',
  )}>
    <div className={cn(
      'w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0',
      warn ? 'bg-p-w-100 text-p-w-700' : 'bg-p-bg-subtle text-p-text-secondary',
    )}>
      <Icon size={17} />
    </div>
    <div>
      <div className={cn(
        'text-[26px] font-bold tracking-[-0.04em] leading-none',
        warn ? 'text-p-w-700' : 'text-p-text-primary',
      )}>{val}</div>
      <div className="text-[12px] text-p-text-secondary mt-1 font-medium">{label}</div>
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
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-[10px] mb-1">
            <h1 className="text-[21px] font-bold text-p-text-primary tracking-[-0.03em] m-0">
              {user?.fullName ? `Hola, ${user.fullName.split(' ')[0]}` : 'Panel de Padre'}
            </h1>
            <RoleBadge />
          </div>
          <p className="text-[13px] text-p-text-secondary m-0">
            {hijos.length} hijo{hijos.length === 1 ? '' : 's'} vinculado{hijos.length === 1 ? '' : 's'}
            {totalPend > 0 && (
              <>
                {' · '}
                <span className="text-p-w-700 font-medium">
                  {totalPend} tarea{totalPend > 1 ? 's' : ''} pendiente{totalPend > 1 ? 's' : ''}
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {totalPend > 0 && (
        <div className="px-4 py-3 bg-p-w-100 border border-p-w-500 rounded-2xl flex items-center gap-[10px]">
          <AlertTriangle size={16} className="text-p-w-700 shrink-0" />
          <span className="text-[13.5px] text-p-w-700 font-medium">
            Tus hijos tienen <strong>{totalPend} tarea{totalPend > 1 ? 's' : ''} pendiente{totalPend > 1 ? 's' : ''}</strong> por entregar.
          </span>
        </div>
      )}

      <div className="grid gap-[14px] [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        <StatCardMini label="Hijos vinculados" val={hijos.length} Icon={Users} />
        <StatCardMini label="Cursos en total" val={totalCursos} Icon={GraduationCap} />
        <StatCardMini label="Tareas pendientes" val={totalPend} Icon={BookOpen} warn={totalPend > 0} />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-[14px]">
          {[1, 2].map((i) => (
            <div key={i} className="h-[120px] bg-p-bg-subtle rounded-[24px] animate-pulse" />
          ))}
        </div>
      ) : error || hijos.length === 0 ? (
        <PadreEmptyState />
      ) : (
        <div className="flex flex-col gap-[14px]">
          {hijos.map((h) => (
            <HijoCard key={h.id} hijo={h} />
          ))}
        </div>
      )}
    </div>
  );
}
