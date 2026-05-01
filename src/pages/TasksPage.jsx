import { useState, useMemo, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { useMySubmissions, useSubmitTask, useTaskSubmissions, useGradeSubmission } from '@/hooks/useSubmissions';
import { useEnrollments } from '@/hooks/useEnrollments';
import { uploadFile, MAX_FILE_SIZE, ALLOWED_MIME_TYPES, useSignedUrl } from '@/hooks/useUploads';
import { avatarColor, getInitials } from '@/lib/materia-colors';
import { useClassrooms } from '@/hooks/useClassrooms';
import { useSubjects } from '@/hooks/useSubjects';
import { useAcademicYears } from '@/hooks/useAcademicYears';
import { useMembers } from '@/hooks/useMembers';
import { showApiError } from '@/lib/errors';
import { cn } from '@/lib/utils';

/* ── helpers ── */
function findName(list, id) {
  return list?.find((i) => i.id === id)?.name || '—';
}

function fmtDate(d) {
  if (!d) return null;
  const t = new Date(d);
  if (isNaN(t.getTime())) return null;
  const day = t.getDate();
  const mes = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'][t.getMonth()];
  return `${day} ${mes} ${t.getFullYear()}`;
}

function daysLeft(d) {
  if (!d) return null;
  const target = new Date(d); target.setHours(0, 0, 0, 0);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.ceil((target - today) / 86400000);
}

const TIPO_META = {
  tarea:    { label: 'Tarea',    bg: 'oklch(91% 0.040 250)', color: 'oklch(32% 0.07 250)', icon: 'book'   },
  examen:   { label: 'Examen',   bg: 'oklch(94% 0.040 25)',  color: 'oklch(38% 0.12 25)',  icon: 'star'   },
  proyecto: { label: 'Proyecto', bg: 'oklch(93% 0.035 300)', color: 'oklch(32% 0.07 300)', icon: 'layers' },
  lectura:  { label: 'Lectura',  bg: 'oklch(93% 0.040 150)', color: 'oklch(32% 0.09 150)', icon: 'book'   },
};

const ESTADO_META = {
  active:  { label: 'Activa',   bg: 'var(--p-s-100)',     color: 'var(--p-s-700)'          },
  draft:   { label: 'Borrador', bg: 'var(--p-w-100)',     color: 'var(--p-w-700)'          },
  closed:  { label: 'Cerrada',  bg: 'var(--p-bg-subtle)', color: 'var(--p-text-tertiary)'  },
};

function urgMeta(dl) {
  if (dl === null) return { label: 'Sin fecha', bg: 'var(--p-bg-subtle)', color: 'var(--p-text-secondary)', dot: 'var(--p-text-tertiary)' };
  if (dl <= 0)  return { label: 'Hoy',         bg: 'var(--p-d-100)',    color: 'var(--p-d-700)',    dot: 'var(--p-d-500)'    };
  if (dl === 1) return { label: 'Mañana',       bg: 'var(--p-w-100)',   color: 'var(--p-w-700)',   dot: 'var(--p-w-500)'   };
  if (dl <= 7)  return { label: 'Esta semana',  bg: 'var(--p-w-100)',   color: 'oklch(48% 0.100 72)', dot: 'oklch(72% 0.150 72)' };
  return              { label: `En ${dl} días`, bg: 'var(--p-bg-subtle)', color: 'var(--p-text-secondary)', dot: 'var(--p-text-tertiary)' };
}

/* ── Icon ── */
const ICON_PATHS = {
  book:    <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
  star:    <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
  layers:  <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
  clock:   <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  check:   <><polyline points="20 6 9 17 4 12"/></>,
  trash:   <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>,
  edit:    <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
  plus:    <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  upload:  <><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></>,
  lock:    <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
  back:    <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
  inbox:   <><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></>,
  x:       <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
};

const Icon = ({ name, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    {ICON_PATHS[name]}
  </svg>
);

/* ── Btn ── */
const Btn = ({ children, variant = 'primary', onClick, disabled, icon, size = 'md', type = 'button' }) => {
  const pad = size === 'sm' ? 'px-3 py-[5px] text-[12.5px]' : size === 'lg' ? 'px-[22px] py-[10px] text-[14.5px]' : 'px-4 py-[7px] text-[13px]';
  const v = {
    primary:   'bg-p-accent text-p-accent-text border-transparent hover:bg-p-accent-hover',
    secondary: 'bg-p-bg-base text-p-text-primary border-p-border hover:bg-p-bg-subtle',
    ghost:     'bg-transparent text-p-text-secondary border-transparent hover:bg-p-bg-subtle hover:text-p-text-primary',
    danger:    'bg-p-d-500 text-white border-transparent hover:bg-p-d-700',
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={cn(
        'inline-flex items-center gap-[6px] rounded-[10px] border font-sans font-medium transition-all duration-100',
        pad, v,
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      )}>
      {icon && <Icon name={icon} size={size === 'sm' ? 12.5 : size === 'lg' ? 14.5 : 13} />}
      {children}
    </button>
  );
};

/* ── GhostIcon ── */
const GhostIcon = ({ name, title, onClick, danger }) => (
  <button title={title} onClick={onClick}
    className={cn(
      'w-[30px] h-[30px] rounded-md border border-transparent bg-transparent flex items-center justify-center cursor-pointer transition-all duration-100',
      danger
        ? 'text-p-text-tertiary hover:bg-p-d-100 hover:text-p-d-500'
        : 'text-p-text-tertiary hover:bg-p-bg-subtle hover:text-p-text-primary',
    )}>
    <Icon name={name} size={14} />
  </button>
);

/* ── Modal shell ── */
const Modal = ({ open, onClose, title, subtitle, children, width = 520 }) => {
  useEffect(() => {
    if (!open) return;
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div onClick={onClose}
      className="fixed inset-0 z-[1000] bg-[oklch(0%_0_0/0.45)] flex items-center justify-center backdrop-blur-[2px] p-4">
      <div onClick={(e) => e.stopPropagation()}
        className="max-w-[calc(100vw-32px)] max-h-[90vh] bg-p-bg-base border border-p-border rounded-[24px] shadow-p-lg flex flex-col overflow-hidden"
        style={{ width }}>
        <div className="px-6 pt-[18px] pb-4 border-b border-p-border flex items-start justify-between shrink-0">
          <div>
            <div className="text-[15px] font-bold text-p-text-primary tracking-[-0.02em]">{title}</div>
            {subtitle && <div className="text-[12.5px] text-p-text-secondary mt-[3px]">{subtitle}</div>}
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-[10px] border border-p-border bg-transparent cursor-pointer text-p-text-tertiary flex items-center justify-center text-[16px] leading-none shrink-0">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* ── Field ── */
const Field = ({ label, error, required, children }) => (
  <div>
    <label className="block text-[12.5px] font-semibold text-p-text-secondary mb-[6px]">
      {label}{required && <span className="text-p-d-500 ml-[3px]">*</span>}
    </label>
    {children}
    {error && <div className="text-[11.5px] text-p-d-500 mt-1">{error}</div>}
  </div>
);

const inputCls = 'w-full px-[11px] py-2 text-[13.5px] font-sans border-[1.5px] border-p-border rounded-[10px] bg-p-bg-base text-p-text-primary outline-none';

/* ── Toggle ── */
const Toggle = ({ checked, onChange, label, sub }) => (
  <div className="flex items-start justify-between gap-3">
    <div>
      <div className="text-[13.5px] font-medium text-p-text-primary">{label}</div>
      {sub && <div className="text-[12px] text-p-text-secondary mt-[2px]">{sub}</div>}
    </div>
    <button type="button" onClick={() => onChange(!checked)}
      className={cn(
        'w-10 h-[22px] rounded-full border-none cursor-pointer p-0 shrink-0 relative transition-[background] duration-200',
        checked ? 'bg-p-accent' : 'bg-p-bg-muted',
      )}>
      <div className={cn(
        'absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-[0_1px_3px_oklch(0%_0_0/0.2)] transition-transform duration-200',
        checked ? 'translate-x-[20px]' : 'translate-x-[2px]',
      )} />
    </button>
  </div>
);

/* ════════════════════════════════════════════
   TEACHER SUBMISSIONS REVIEW
   ════════════════════════════════════════════ */

const STATUS_SUB = {
  submitted: { label: 'Entregada',  bg: 'oklch(93% 0.025 250)', color: 'oklch(32% 0.07 250)' },
  graded:    { label: 'Calificada', bg: 'var(--p-s-100)',        color: 'var(--p-s-700)'      },
  returned:  { label: 'Devuelta',   bg: 'var(--p-w-100)',        color: 'var(--p-w-700)'      },
};

function isImage(ct) { return ct && ct.startsWith('image/'); }
function isPdf(ct)   { return ct === 'application/pdf'; }

const EvidenceModal = ({ submission, task, courseId, onClose }) => {
  const grade = useGradeSubmission(courseId, task.id);
  const [score,    setScore]    = useState(submission.score    ?? '');
  const [feedback, setFeedback] = useState(submission.feedback ?? '');
  const [status,   setStatus]   = useState(submission.status === 'graded' || submission.status === 'returned' ? submission.status : 'graded');
  const [saved,    setSaved]    = useState(false);

  const att = (submission.attachments ?? [])[0];
  const { url: attUrl, loading: attLoading } = useSignedUrl(att?.url ?? null, att?.contentType ?? '');

  const handleSave = async () => {
    try {
      await grade.mutateAsync({ submissionId: submission.id, score: score !== '' ? Number(score) : null, feedback: feedback || null, status });
      setSaved(true);
      setTimeout(onClose, 1400);
    } catch { /* handled */ }
  };

  return (
    <Modal open onClose={onClose}
      title={`Revisión — ${submission.studentFullName}`}
      subtitle={`${task.title} · Entregada ${fmtDate(submission.submittedAt) ?? '—'}`}
      width={att && (isImage(att.contentType) || isPdf(att.contentType)) ? 720 : 540}>
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-[18px]">

        {/* File viewer */}
        {att && (
          <div>
            <div className="text-[11.5px] font-bold text-p-text-tertiary uppercase tracking-[0.07em] mb-2">Evidencia</div>
            {attLoading ? (
              <div className="h-20 bg-p-bg-subtle rounded-[12px] flex items-center justify-center text-p-text-tertiary text-[13px]">Cargando…</div>
            ) : isImage(att.contentType) ? (
              attUrl ? <img src={attUrl} alt={att.filename} className="max-w-full max-h-[420px] rounded-[12px] border border-p-border object-contain block" /> : null
            ) : isPdf(att.contentType) ? (
              attUrl ? <iframe key={attUrl} src={attUrl} title={att.filename} className="w-full h-[420px] rounded-[12px] border border-p-border bg-[#f5f5f5]" /> : null
            ) : (
              <div className="px-4 py-[14px] bg-p-bg-subtle border border-p-border rounded-[12px] flex items-center gap-3">
                <Icon name="inbox" size={16} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-medium text-p-text-primary whitespace-nowrap overflow-hidden text-ellipsis">{att.filename}</div>
                  {att.size && <div className="text-[11.5px] text-p-text-tertiary">{(att.size / 1024).toFixed(1)} KB · {att.contentType || 'archivo'}</div>}
                </div>
                <a href={attUrl} download={att.filename} target="_blank" rel="noreferrer" className="no-underline">
                  <Btn variant="secondary" size="sm" icon="upload">Descargar</Btn>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Student note */}
        {submission.content && (
          <div>
            <div className="text-[11.5px] font-bold text-p-text-tertiary uppercase tracking-[0.07em] mb-[6px]">Nota del alumno</div>
            <div className="px-[14px] py-3 bg-p-bg-subtle rounded-[12px] border border-p-border text-[13.5px] text-p-text-primary leading-[1.6] whitespace-pre-wrap">
              {submission.content}
            </div>
          </div>
        )}

        {/* Grade form */}
        <div className="border-t border-p-border pt-[18px] flex flex-col gap-[14px]">
          <div className="text-[11.5px] font-bold text-p-text-tertiary uppercase tracking-[0.07em]">Calificación</div>
          <div className="grid gap-3 [grid-template-columns:150px_1fr]">
            <Field label={`Puntaje (máx ${task.maxScore})`}>
              <input type="number" min={0} max={task.maxScore} value={score}
                onChange={(e) => setScore(e.target.value)} placeholder="—" className={inputCls} />
            </Field>
            <Field label="Estado">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
                <option value="graded">Calificada</option>
                <option value="returned">Devuelta al alumno</option>
              </select>
            </Field>
          </div>
          <Field label="Retroalimentación">
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)}
              rows={3} placeholder="Comentarios para el alumno…"
              className={cn(inputCls, 'resize-y leading-[1.55]')} />
          </Field>
        </div>
      </div>

      <div className="px-6 py-[14px] border-t border-p-border flex justify-end gap-2 bg-p-bg-subtle shrink-0">
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn variant="primary" onClick={handleSave} disabled={grade.isPending}>
          {saved ? '¡Guardado!' : grade.isPending ? 'Guardando…' : 'Guardar calificación'}
        </Btn>
      </div>
    </Modal>
  );
};

const SubmissionsModal = ({ task, courseId, onClose }) => {
  const submissions = useTaskSubmissions(courseId, task.id);
  const enrollments = useEnrollments(courseId);
  const [reviewing, setReviewing] = useState(null);

  const enrolled = enrollments.data ?? [];
  const subs     = submissions.data ?? [];
  const subMap   = new Map(subs.map((s) => [s.studentMemberId, s]));
  const notSent  = enrolled.filter((e) => !subMap.has(e.studentMemberId));
  const pct      = enrolled.length ? Math.round((subs.length / enrolled.length) * 100) : 0;

  return (
    <>
      <Modal open onClose={onClose}
        title={`Entregas — ${task.title}`}
        subtitle={`${subs.length} de ${enrolled.length} inscritos entregaron`}
        width={680}>
        <div className="flex-1 overflow-y-auto px-6 py-[18px] flex flex-col gap-[18px]">

          {/* Rate */}
          <div className="bg-p-bg-subtle rounded-2xl px-[18px] py-4 border border-p-border">
            <div className="flex items-center justify-between mb-[10px]">
              <span className="text-[13px] font-semibold text-p-text-primary">Tasa de entrega</span>
              <span className="text-[22px] font-extrabold tracking-[-0.03em]"
                style={{ color: pct >= 70 ? 'var(--p-s-700)' : pct >= 40 ? 'oklch(50% 0.12 72)' : 'var(--p-d-500)' }}>
                {pct}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-p-border overflow-hidden">
              <div className="h-2 rounded-full transition-[width] duration-[400ms]"
                style={{ width: `${pct}%`, background: pct >= 70 ? 'var(--p-s-500)' : pct >= 40 ? 'oklch(72% 0.15 72)' : 'var(--p-d-500)' }} />
            </div>
            <div className="flex gap-[18px] mt-[10px] text-[12.5px]">
              <span className="text-p-s-700">✓ {subs.length} entregadas</span>
              <span className="text-p-text-tertiary">○ {notSent.length} pendientes</span>
              <span className="text-p-text-secondary">{enrolled.length} inscritos total</span>
            </div>
          </div>

          {/* Submitted */}
          {subs.length > 0 && (
            <div>
              <div className="text-[11.5px] font-bold text-p-text-tertiary uppercase tracking-[0.07em] mb-[10px]">Entregadas ({subs.length})</div>
              <div className="flex flex-col gap-2">
                {subs.map((sub) => {
                  const sm = STATUS_SUB[sub.status] ?? STATUS_SUB.submitted;
                  const bg = avatarColor(sub.studentFullName || sub.studentEmail);
                  const ini = getInitials(sub.studentFullName || sub.studentEmail);
                  return (
                    <div key={sub.id} className="flex items-center gap-3 px-[14px] py-[10px] bg-p-bg-base border border-p-border rounded-[12px]">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                        style={{ background: bg }}>{ini}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13.5px] font-medium text-p-text-primary">{sub.studentFullName}</div>
                        <div className="text-[11.5px] text-p-text-tertiary mt-px">
                          {fmtDate(sub.submittedAt)}
                          {sub.score !== null && sub.score !== undefined && ` · ${sub.score}/${task.maxScore} pts`}
                        </div>
                      </div>
                      <span className="px-2 py-[2px] rounded-full text-[11.5px] font-semibold"
                        style={{ background: sm.bg, color: sm.color }}>{sm.label}</span>
                      <Btn variant="secondary" size="sm" onClick={() => setReviewing(sub)}>
                        {sub.status === 'graded' || sub.status === 'returned' ? 'Ver' : 'Revisar'}
                      </Btn>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Not submitted */}
          {notSent.length > 0 && (
            <div>
              <div className="text-[11.5px] font-bold text-p-text-tertiary uppercase tracking-[0.07em] mb-2">Sin entregar ({notSent.length})</div>
              <div className="flex flex-col gap-[6px]">
                {notSent.map((e) => {
                  const bg  = avatarColor(e.fullName || e.email);
                  const ini = getInitials(e.fullName || e.email);
                  return (
                    <div key={e.id} className="flex items-center gap-3 px-[14px] py-2 bg-p-bg-subtle border border-p-border rounded-[12px] opacity-65">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 grayscale-[0.6]"
                        style={{ background: bg }}>{ini}</div>
                      <div className="flex-1"><div className="text-[13.5px] text-p-text-secondary">{e.fullName || e.email}</div></div>
                      <span className="px-2 py-[2px] rounded-full text-[11.5px] font-medium bg-p-bg-muted text-p-text-tertiary">Pendiente</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(submissions.isLoading || enrollments.isLoading) && (
            <div className="py-8 text-center text-p-text-tertiary text-[13.5px]">Cargando…</div>
          )}
          {!submissions.isLoading && !enrollments.isLoading && enrolled.length === 0 && (
            <div className="py-8 text-center text-p-text-tertiary text-[13.5px]">Sin alumnos inscritos en este curso.</div>
          )}
        </div>

        <div className="px-6 py-[14px] border-t border-p-border bg-p-bg-subtle shrink-0">
          <Btn variant="secondary" onClick={onClose}>Cerrar</Btn>
        </div>
      </Modal>

      {reviewing && (
        <EvidenceModal submission={reviewing} task={task} courseId={courseId} onClose={() => setReviewing(null)} />
      )}
    </>
  );
};

/* ════════════════════════════════════════════
   TEACHER VIEW
   ════════════════════════════════════════════ */

const TareaFormModal = ({ open, onClose, initial, onSave, isPending }) => {
  const isEdit = !!initial;
  const [titulo,   setTitulo]    = useState(initial?.title       || '');
  const [desc,     setDesc]      = useState(initial?.description || '');
  const [limite,   setLimite]    = useState(initial?.dueDate ? new Date(initial.dueDate).toISOString().slice(0, 10) : '');
  const [puntaje,  setPuntaje]   = useState(initial?.maxScore    || 10);
  const [tipo,     setTipo]      = useState(initial?.type        || 'tarea');
  const [publicar, setPublicar]  = useState(initial ? initial.status === 'active' : true);
  const [statusSel,setStatusSel] = useState(initial?.status      || 'active');
  const [errors,   setErrors]    = useState({});

  useEffect(() => {
    if (open && initial) {
      setTitulo(initial.title); setDesc(initial.description || ''); setLimite(initial.dueDate ? new Date(initial.dueDate).toISOString().slice(0, 10) : '');
      setPuntaje(initial.maxScore); setTipo(initial.type); setPublicar(initial.status === 'active');
      setStatusSel(initial.status); setErrors({});
    } else if (open && !initial) {
      setTitulo(''); setDesc(''); setLimite(''); setPuntaje(10); setTipo('tarea'); setPublicar(true); setStatusSel('active'); setErrors({});
    }
  }, [open, initial]);

  const submit = (e) => {
    e?.preventDefault();
    const errs = {};
    if (!titulo.trim()) errs.titulo = 'El título es requerido';
    if (+puntaje < 1 || +puntaje > 100) errs.puntaje = 'Entre 1 y 100';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    onSave({ title: titulo.trim(), description: desc.trim() || undefined, dueDate: limite || undefined, maxScore: +puntaje, type: tipo, status: isEdit ? statusSel : (publicar ? 'active' : 'draft') });
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar tarea' : 'Nueva tarea'}>
      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Tipo de actividad" required>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} className={inputCls}>
              {Object.entries(TIPO_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Puntaje máximo" required error={errors.puntaje}>
            <input type="number" min={1} max={100} value={puntaje} onChange={(e) => setPuntaje(e.target.value)} className={inputCls} />
          </Field>
        </div>

        <Field label="Título" required error={errors.titulo}>
          <input value={titulo} onChange={(e) => { setTitulo(e.target.value); setErrors((p) => ({ ...p, titulo: '' })); }}
            placeholder="Ej. Ejercicios capítulo 3" className={inputCls} />
        </Field>

        <Field label="Descripción / instrucciones">
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4}
            placeholder="Instrucciones detalladas para los estudiantes…"
            className={cn(inputCls, 'resize-y leading-[1.55]')} />
        </Field>

        <Field label="Fecha límite">
          <input type="date" value={limite} onChange={(e) => setLimite(e.target.value)} className={inputCls} />
        </Field>

        {isEdit ? (
          <Field label="Estado">
            <select value={statusSel} onChange={(e) => setStatusSel(e.target.value)} className={inputCls}>
              <option value="active">Activa</option>
              <option value="draft">Borrador</option>
              <option value="closed">Cerrada</option>
            </select>
          </Field>
        ) : (
          <div className="px-4 py-[14px] bg-p-bg-subtle rounded-2xl border border-p-border">
            <Toggle checked={publicar} onChange={setPublicar}
              label="Publicar inmediatamente"
              sub={publicar ? 'Los alumnos verán esta tarea al guardar.' : 'Se guardará como borrador. Los alumnos no la verán.'} />
          </div>
        )}
      </div>

      <div className="px-6 py-[14px] border-t border-p-border flex justify-between items-center bg-p-bg-subtle shrink-0">
        <span className={cn('text-[12px]', publicar && !isEdit ? 'text-p-s-700 font-medium' : 'text-p-text-tertiary font-normal')}>
          {!isEdit && (publicar ? '✓ Se publicará para los alumnos' : 'Se guardará como borrador')}
        </span>
        <div className="flex gap-2">
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" onClick={submit} disabled={isPending}>
            {isPending ? 'Guardando…' : isEdit ? 'Guardar cambios' : (publicar ? 'Publicar tarea' : 'Guardar borrador')}
          </Btn>
        </div>
      </div>
    </Modal>
  );
};

const DeleteModal = ({ open, tarea, onClose, onConfirm, isPending }) => (
  <Modal open={open} onClose={onClose} title="Eliminar tarea" width={400}>
    {tarea && (
      <>
        <div className="px-6 py-5">
          <div className="w-11 h-11 rounded-2xl bg-p-d-100 flex items-center justify-center text-p-d-500 mb-[14px]">
            <Icon name="trash" size={20} />
          </div>
          <p className="text-[14px] text-p-text-secondary leading-[1.65] m-0">
            ¿Eliminar la tarea <strong className="text-p-text-primary">{tarea.title}</strong>? Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="px-6 py-[14px] border-t border-p-border flex justify-end gap-2 bg-p-bg-subtle">
          <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
          <Btn variant="danger" onClick={onConfirm} disabled={isPending}>
            {isPending ? 'Eliminando…' : 'Eliminar tarea'}
          </Btn>
        </div>
      </>
    )}
  </Modal>
);

const TareaCard = ({ tarea, onEdit, onDelete, onReview }) => {
  const tm = TIPO_META[tarea.type]    || TIPO_META.tarea;
  const em = ESTADO_META[tarea.status] || ESTADO_META.active;
  const dl = daysLeft(tarea.dueDate);
  const overdue = dl !== null && dl < 0 && tarea.status === 'active';

  return (
    <div className="bg-p-bg-base border border-p-border rounded-2xl shadow-p-sm px-5 py-[18px] flex gap-4 items-start transition-[box-shadow] duration-[120ms] hover:shadow-p-md">
      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0"
        style={{ background: tm.bg, color: tm.color }}>
        <Icon name={tm.icon} size={18} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 mb-[6px]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-[7px] mb-[5px] flex-wrap">
              <span className="px-2 py-[2px] rounded-full text-[11.5px] font-semibold" style={{ background: tm.bg, color: tm.color }}>{tm.label}</span>
              <span className="px-2 py-[2px] rounded-full text-[11.5px] font-semibold" style={{ background: em.bg, color: em.color }}>{em.label}</span>
            </div>
            <div className="text-[15px] font-bold text-p-text-primary tracking-[-0.02em] mb-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {tarea.title}
            </div>
            {tarea.description && (
              <div className="text-[13px] text-p-text-secondary leading-[1.5] whitespace-nowrap overflow-hidden text-ellipsis">
                {tarea.description}
              </div>
            )}
          </div>
          <div className="flex gap-[2px] shrink-0">
            <GhostIcon name="edit"  title="Editar"   onClick={() => onEdit(tarea)} />
            <GhostIcon name="trash" title="Eliminar" onClick={() => onDelete(tarea)} danger />
          </div>
        </div>

        <div className="flex items-center gap-[18px] mt-[10px] flex-wrap">
          {tarea.dueDate && (
            <div className={cn('flex items-center gap-[5px] text-[12.5px]', overdue ? 'text-p-d-500 font-medium' : 'text-p-text-secondary')}>
              <Icon name="clock" size={12} />
              <span>{fmtDate(tarea.dueDate)}</span>
              {dl !== null && (
                <span className="text-[11.5px]"
                  style={{ color: overdue ? 'var(--p-d-500)' : dl === 0 ? 'var(--p-w-700)' : dl <= 3 ? 'var(--p-w-500)' : 'var(--p-text-tertiary)' }}>
                  ({overdue ? `venció hace ${-dl}d` : dl === 0 ? 'hoy' : `en ${dl}d`})
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-[5px] text-[12.5px] text-p-text-secondary">
            <Icon name="star" size={12} />
            <span>{tarea.maxScore} pts</span>
          </div>
          {onReview && (
            <button onClick={() => onReview(tarea)}
              className="inline-flex items-center gap-[5px] px-[10px] py-1 rounded-lg border border-p-border bg-transparent text-p-text-secondary text-[12px] font-sans font-medium cursor-pointer transition-all duration-100 hover:bg-p-bg-subtle hover:text-p-text-primary">
              <Icon name="inbox" size={12} /> Ver entregas
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyStateDocente = ({ onNew }) => (
  <div className="flex flex-col items-center justify-center py-20 px-6 gap-[18px]">
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      <rect x="12" y="20" width="72" height="60" rx="10" fill="var(--p-bg-subtle)" stroke="var(--p-border)" strokeWidth="1.5"/>
      <rect x="26" y="8" width="44" height="18" rx="6" fill="var(--p-bg-muted)" stroke="var(--p-border)" strokeWidth="1.5"/>
      <line x1="26" y1="44" x2="70" y2="44" stroke="var(--p-border)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="26" y1="54" x2="58" y2="54" stroke="var(--p-border)" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="26" y1="64" x2="50" y2="64" stroke="var(--p-border)" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="72" cy="70" r="14" fill="var(--p-bg-base)" stroke="var(--p-border)" strokeWidth="1.5"/>
      <line x1="72" y1="63" x2="72" y2="77" stroke="var(--p-border-strong)" strokeWidth="2.5" strokeLinecap="round"/>
      <line x1="65" y1="70" x2="79" y2="70" stroke="var(--p-border-strong)" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
    <div className="text-center">
      <div className="text-[18px] font-bold text-p-text-primary mb-2 tracking-[-0.02em]">Sin tareas aún</div>
      <div className="text-[14px] text-p-text-secondary max-w-[320px]">
        Crea la primera tarea para este grupo y los alumnos la verán de inmediato.
      </div>
    </div>
    <Btn variant="primary" icon="plus" size="lg" onClick={onNew}>Crear primera tarea</Btn>
  </div>
);

function TeacherView({ cursoId, courseName, tasks, createTask, updateTask, deleteTask }) {
  const [modal,     setModal]     = useState(null);
  const [deleteT,   setDeleteT]   = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [filter,    setFilter]    = useState('todas');
  const navigate = useNavigate();

  useEffect(() => { if (tasks.error) showApiError(tasks.error); }, [tasks.error]);

  const filtered = useMemo(() => {
    const all = tasks.data ?? [];
    return filter === 'todas' ? all : all.filter((t) => t.status === filter);
  }, [tasks.data, filter]);

  const activas    = (tasks.data ?? []).filter((t) => t.status === 'active').length;
  const borradores = (tasks.data ?? []).filter((t) => t.status === 'draft').length;

  const handleSave = async (data) => {
    try {
      if (modal.mode === 'create') await createTask.mutateAsync(data);
      else await updateTask.mutateAsync({ id: modal.tarea.id, ...data });
      setModal(null);
    } catch { /* handled by hook */ }
  };

  const handleDelete = async () => {
    try { await deleteTask.mutateAsync(deleteT.id); setDeleteT(null); } catch { /* handled */ }
  };

  const FILTROS = [['todas', 'Todas'], ['active', 'Activas'], ['draft', 'Borradores'], ['closed', 'Cerradas']];

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <button onClick={() => navigate(-1)}
          className="inline-flex items-center gap-[6px] text-[12.5px] text-p-text-secondary bg-transparent border-none cursor-pointer pb-[10px] font-sans hover:text-p-text-primary transition-colors">
          <Icon name="back" size={14} /> Volver
        </button>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-[22px] font-extrabold text-p-text-primary tracking-[-0.03em] m-0 mb-[6px]">
              Tareas · {courseName}
            </h1>
            <div className="flex gap-[14px] flex-wrap">
              <span className="text-[13px] text-p-text-secondary flex items-center gap-[5px]">
                <span className="w-[7px] h-[7px] rounded-full bg-p-s-500 inline-block" />
                {activas} activa{activas !== 1 ? 's' : ''}
              </span>
              {borradores > 0 && (
                <span className="text-[13px] text-p-text-secondary flex items-center gap-[5px]">
                  <span className="w-[7px] h-[7px] rounded-full bg-p-w-500 inline-block" />
                  {borradores} borrador{borradores !== 1 ? 'es' : ''}
                </span>
              )}
            </div>
          </div>
          <Btn variant="primary" icon="plus" size="lg" onClick={() => setModal({ mode: 'create' })}>Nueva Tarea</Btn>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-[10px] flex-wrap">
        <div className="flex bg-p-bg-subtle rounded-[10px] p-[3px] gap-[2px]">
          {FILTROS.map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={cn(
                'px-[13px] py-[5px] rounded-md border-none text-[12.5px] font-medium font-sans cursor-pointer transition-all duration-[120ms]',
                filter === v ? 'bg-p-bg-base text-p-text-primary shadow-p-sm' : 'bg-transparent text-p-text-secondary',
              )}>
              {l}
            </button>
          ))}
        </div>
        <span className="text-[12.5px] text-p-text-tertiary">{filtered.length} tarea{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Task list */}
      {tasks.isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-[100px] bg-p-bg-subtle rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        filter === 'todas'
          ? <EmptyStateDocente onNew={() => setModal({ mode: 'create' })} />
          : <div className="py-12 px-6 text-center text-p-text-tertiary text-[14px]">No hay tareas en este estado.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((t) => (
            <TareaCard key={t.id} tarea={t}
              onEdit={(t) => setModal({ mode: 'edit', tarea: t })}
              onDelete={setDeleteT}
              onReview={setReviewing} />
          ))}
        </div>
      )}

      <TareaFormModal open={!!modal} onClose={() => setModal(null)} initial={modal?.tarea} onSave={handleSave} isPending={createTask.isPending || updateTask.isPending} />
      <DeleteModal open={!!deleteT} tarea={deleteT} onClose={() => setDeleteT(null)} onConfirm={handleDelete} isPending={deleteTask.isPending} />
      {reviewing && <SubmissionsModal task={reviewing} courseId={cursoId} onClose={() => setReviewing(null)} />}
    </div>
  );
}

/* ════════════════════════════════════════════
   STUDENT VIEW
   ════════════════════════════════════════════ */

const SubmissionFilePicker = ({ file, progress, uploading, error, onPick, onClear }) => {
  const [drag, setDrag] = useState(false);
  const onDrop = (e) => {
    e.preventDefault(); setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onPick(f);
  };

  return (
    <div>
      <label className="block text-[12.5px] font-semibold text-p-text-secondary mb-[6px]">
        Archivo adjunto <span className="text-p-text-tertiary font-normal">(opcional, hasta 25 MB)</span>
      </label>

      {!file ? (
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={cn(
            'flex flex-col items-center gap-[6px] px-[14px] py-[18px] cursor-pointer rounded-[12px] border-[1.5px] border-dashed text-p-text-secondary text-[13px] transition-[border-color,background] duration-[120ms]',
            drag ? 'border-p-accent bg-p-bg-subtle' : 'border-p-border bg-p-bg-base',
          )}>
          <Icon name="upload" size={20} />
          <div className="text-center">
            <div className="font-medium">Click o arrastra un archivo aquí</div>
            <div className="text-[11.5px] text-p-text-tertiary mt-[2px]">
              PDF, Word, Excel, PowerPoint, imágenes o texto
            </div>
          </div>
          <input type="file" className="hidden" onChange={(e) => onPick(e.target.files?.[0] ?? null)} />
        </label>
      ) : (
        <div className="flex items-center gap-[10px] px-3 py-[10px] border border-p-border rounded-[12px] bg-p-bg-subtle">
          <div className="w-8 h-8 rounded-lg bg-p-accent text-p-accent-text flex items-center justify-center shrink-0">
            <Icon name="upload" size={14} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-p-text-primary whitespace-nowrap overflow-hidden text-ellipsis">{file.name}</div>
            <div className="text-[11.5px] text-p-text-tertiary mt-px">
              {(file.size / 1024).toFixed(1)} KB · {file.type || 'desconocido'}
              {uploading && ` · subiendo ${progress}%`}
            </div>
          </div>
          {!uploading && (
            <button type="button" onClick={onClear}
              className="bg-transparent border-none cursor-pointer text-p-text-tertiary flex p-1" aria-label="Quitar archivo">
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      )}

      {error && <div className="mt-[6px] text-[12px] text-p-d-700">{error}</div>}
    </div>
  );
};

const EntregarModal = ({ tarea, courseId, onClose, onSuccess }) => {
  const [contenido,  setContenido]  = useState('');
  const [comentario, setComentario] = useState('');
  const [file,       setFile]       = useState(null);
  const [progress,   setProgress]   = useState(0);
  const [uploading,  setUploading]  = useState(false);
  const [fileError,  setFileError]  = useState(null);
  const [done,       setDone]       = useState(false);
  const submit = useSubmitTask(courseId);
  const tm = TIPO_META[tarea?.type] || TIPO_META.tarea;

  const onPickFile = (f) => {
    setFileError(null);
    if (!f) { setFile(null); return; }
    if (f.size > MAX_FILE_SIZE) { setFileError(`Excede el máximo de ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB`); return; }
    const ct = (f.type || 'application/octet-stream').toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(ct)) { setFileError(`Tipo de archivo no permitido: ${ct || 'desconocido'}`); return; }
    setFile(f);
  };

  const handleSubmit = async () => {
    try {
      let attachments;
      if (file) {
        setUploading(true); setProgress(0);
        const att = await uploadFile(file, { kind: 'submission', courseId, taskId: tarea.id }, { onProgress: setProgress });
        attachments = [att]; setUploading(false);
      }
      await submit.mutateAsync({ taskId: tarea.id, content: [contenido.trim(), comentario.trim()].filter(Boolean).join('\n\n') || undefined, attachments });
      setDone(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1600);
    } catch (err) {
      setUploading(false);
      if (err?.message && !err?.response) setFileError(err.message);
    }
  };

  if (done) return (
    <Modal open onClose={onClose} title="Entrega registrada" width={400}>
      <div className="py-9 px-6 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-p-s-100 flex items-center justify-center text-p-s-700">
          <Icon name="check" size={30} />
        </div>
        <div>
          <div className="text-[16px] font-bold text-p-text-primary mb-[6px]">¡Tarea entregada!</div>
          <div className="text-[13.5px] text-p-text-secondary leading-[1.6]">
            Tu entrega fue registrada. El docente la revisará pronto.
          </div>
        </div>
      </div>
    </Modal>
  );

  return (
    <Modal open onClose={onClose} title={`Entregar — ${tarea?.title}`} subtitle={`${tm.label} · ${tarea?.maxScore} pts`}>
      <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto flex-1">
        <div className="px-[14px] py-[10px] bg-p-bg-subtle border border-p-border rounded-2xl flex items-center gap-[10px]">
          <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0" style={{ background: tm.bg, color: tm.color }}>
            <Icon name="book" size={14} />
          </div>
          <div>
            <div className="text-[13px] font-medium text-p-text-primary">{tarea?.title}</div>
            <div className="text-[11.5px] text-p-text-tertiary mt-px">
              {tarea?.dueDate && `Fecha límite: ${fmtDate(tarea.dueDate)} · `}Puntaje: {tarea?.maxScore} pts
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[12.5px] font-semibold text-p-text-secondary mb-[6px]">
            Enlace <span className="text-p-text-tertiary font-normal">(opcional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-[10px] top-1/2 -translate-y-1/2 text-p-text-tertiary flex pointer-events-none">
              <Icon name="upload" size={14} />
            </span>
            <input value={contenido} onChange={(e) => setContenido(e.target.value)}
              placeholder="https://drive.google.com/…"
              className={cn(inputCls, 'pl-8')} />
          </div>
        </div>

        <SubmissionFilePicker file={file} progress={progress} uploading={uploading} error={fileError}
          onPick={onPickFile} onClear={() => { setFile(null); setFileError(null); setProgress(0); }} />

        <div>
          <label className="block text-[12.5px] font-semibold text-p-text-secondary mb-[6px]">
            Comentarios para el docente
          </label>
          <textarea value={comentario} onChange={(e) => setComentario(e.target.value)}
            placeholder="Escribe cualquier nota o aclaración sobre tu entrega…" rows={4}
            className={cn(inputCls, 'resize-y leading-[1.55]')} />
        </div>
      </div>

      <div className="px-6 py-[14px] border-t border-p-border flex justify-end gap-2 bg-p-bg-subtle shrink-0">
        <Btn variant="secondary" onClick={onClose} disabled={uploading || submit.isPending}>Cancelar</Btn>
        <Btn variant="primary" onClick={handleSubmit} disabled={uploading || submit.isPending}>
          {uploading ? `Subiendo… ${progress}%` : submit.isPending ? 'Enviando…' : 'Confirmar entrega'}
        </Btn>
      </div>
    </Modal>
  );
};

const TabPendientes = ({ tareas, onEntregar }) => {
  if (tareas.length === 0) return (
    <div className="flex flex-col items-center py-[60px] px-6 gap-[14px]">
      <div className="w-[52px] h-[52px] rounded-full bg-p-s-100 flex items-center justify-center text-p-s-700">
        <Icon name="check" size={24} />
      </div>
      <div className="text-center">
        <div className="text-[16px] font-semibold text-p-text-primary mb-[6px]">¡Todo al día!</div>
        <div className="text-[13.5px] text-p-text-secondary">No tienes tareas pendientes por entregar.</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      {tareas.map((t) => {
        const tm = TIPO_META[t.type] || TIPO_META.tarea;
        const dl = daysLeft(t.dueDate);
        const um = urgMeta(dl);
        return (
          <div key={t.id}
            className="bg-p-bg-base border border-p-border rounded-2xl px-5 py-[18px] flex gap-4 items-start shadow-p-sm transition-[box-shadow] duration-[120ms] hover:shadow-p-md">
            <div className="w-[3px] self-stretch rounded-full shrink-0 min-h-[40px]" style={{ background: um.dot }} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-[7px] mb-[7px] flex-wrap">
                <span className="px-2 py-[2px] rounded-full text-[11.5px] font-semibold" style={{ background: tm.bg, color: tm.color }}>{tm.label}</span>
                <span className="px-2 py-[2px] rounded-full text-[11.5px] font-bold" style={{ background: um.bg, color: um.color }}>{um.label}</span>
              </div>
              <div className="text-[15px] font-bold text-p-text-primary tracking-[-0.02em] mb-[5px]">{t.title}</div>
              {t.description && (
                <div className="text-[13px] text-p-text-secondary leading-[1.55] mb-[10px] whitespace-nowrap overflow-hidden text-ellipsis max-w-[560px]">
                  {t.description}
                </div>
              )}
              <div className="flex items-center gap-[18px] flex-wrap">
                {t.dueDate && (
                  <span className={cn('flex items-center gap-[5px] text-[12.5px]', dl !== null && dl <= 1 ? 'text-p-d-500 font-medium' : 'text-p-text-secondary')}>
                    <Icon name="clock" size={12} />
                    {fmtDate(t.dueDate)}
                    {dl !== null && (
                      <span className="text-[11.5px]" style={{ color: dl <= 0 ? 'var(--p-d-500)' : 'var(--p-text-tertiary)' }}>
                        ({dl <= 0 ? 'hoy' : `en ${dl}d`})
                      </span>
                    )}
                  </span>
                )}
                <span className="flex items-center gap-[5px] text-[12.5px] text-p-text-secondary">
                  <Icon name="star" size={12} />{t.maxScore} pts
                </span>
              </div>
            </div>
            <div className="shrink-0 pt-1">
              <Btn variant="primary" size="sm" onClick={() => onEntregar(t)}>Entregar</Btn>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TabEntregadas = ({ tareas, submissionsByTaskId }) => {
  if (tareas.length === 0) return (
    <div className="flex flex-col items-center py-[60px] px-6 gap-[14px]">
      <div className="w-[52px] h-[52px] rounded-full bg-p-bg-subtle flex items-center justify-center text-p-text-tertiary">
        <Icon name="upload" size={24} />
      </div>
      <div className="text-center">
        <div className="text-[16px] font-semibold text-p-text-primary mb-[6px]">Sin entregas aún</div>
        <div className="text-[13.5px] text-p-text-secondary">Tus entregas aparecerán aquí cuando las envíes.</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-[10px]">
      {tareas.map((t) => {
        const tm  = TIPO_META[t.type] || TIPO_META.tarea;
        const sub = submissionsByTaskId.get(t.id);
        const graded = sub?.status === 'graded';
        const pct = graded && sub.score !== null ? Math.round((sub.score / t.maxScore) * 100) : null;
        const aprobado = pct !== null && pct >= 60;

        return (
          <div key={t.id}
            className="bg-p-bg-base border border-p-border rounded-2xl px-5 py-4 flex gap-[14px] items-center shadow-p-sm transition-[box-shadow] duration-[120ms] hover:shadow-p-md">
            <div className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0"
              style={{ background: tm.bg, color: tm.color }}>
              <Icon name="book" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14.5px] font-semibold text-p-text-primary tracking-[-0.01em] mb-[3px]">{t.title}</div>
              <div className="flex items-center gap-[14px] flex-wrap">
                {sub?.submittedAt && <span className="text-[12.5px] text-p-text-secondary">Entregada el {fmtDate(sub.submittedAt)}</span>}
                <span className="flex items-center gap-[5px] text-[12.5px] text-p-text-secondary">
                  <Icon name="star" size={11} />{t.maxScore} pts
                </span>
              </div>
            </div>
            <div className="shrink-0 text-center">
              {!graded ? (
                <span className="inline-flex items-center gap-[6px] px-[11px] py-1 rounded-full text-[12px] font-medium bg-p-bg-subtle text-p-text-secondary border border-p-border">
                  <Icon name="clock" size={12} />Por revisar
                </span>
              ) : sub.score === null ? (
                <span className="text-[13px] text-p-text-tertiary">—</span>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <div className="text-[22px] font-extrabold tracking-[-0.04em] leading-none"
                    style={{ color: aprobado ? 'var(--p-s-700)' : 'var(--p-d-500)' }}>
                    {sub.score}<span className="text-[14px] font-medium text-p-text-tertiary">/{t.maxScore}</span>
                  </div>
                  <span className="px-2 py-[2px] rounded-full text-[11px] font-bold"
                    style={{ background: aprobado ? 'var(--p-s-100)' : 'var(--p-d-100)', color: aprobado ? 'var(--p-s-700)' : 'var(--p-d-700)' }}>
                    {aprobado ? 'Aprobado' : 'Reprobado'}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const TabVencidas = ({ tareas }) => {
  if (tareas.length === 0) return (
    <div className="flex flex-col items-center py-[60px] px-6 gap-[14px]">
      <div className="w-[52px] h-[52px] rounded-full bg-p-s-100 flex items-center justify-center text-p-s-700">
        <Icon name="check" size={24} />
      </div>
      <div className="text-center">
        <div className="text-[16px] font-semibold text-p-text-primary mb-[6px]">Sin tareas vencidas</div>
        <div className="text-[13.5px] text-p-text-secondary">¡Bien hecho! No tienes tareas vencidas sin entregar.</div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-[10px]">
      {tareas.map((t) => {
        const tm = TIPO_META[t.type] || TIPO_META.tarea;
        const dl = daysLeft(t.dueDate);
        return (
          <div key={t.id} className="bg-p-bg-base border border-p-d-100 rounded-2xl px-5 py-4 flex gap-[14px] items-start shadow-p-sm opacity-85">
            <div className="w-[3px] self-stretch rounded-full bg-p-d-500 shrink-0 min-h-[36px]" />
            <div className="w-9 h-9 rounded-[10px] bg-p-d-100 flex items-center justify-center text-p-d-500 shrink-0">
              <Icon name="lock" size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-[5px]">
                <span className="px-2 py-[2px] rounded-full text-[11.5px] font-semibold" style={{ background: tm.bg, color: tm.color }}>{tm.label}</span>
                <span className="px-2 py-[2px] rounded-full text-[11.5px] font-bold bg-p-d-100 text-p-d-700">Vencida</span>
              </div>
              <div className="text-[14.5px] font-semibold text-p-text-primary tracking-[-0.01em] mb-1 line-through opacity-70">
                {t.title}
              </div>
              {t.description && (
                <div className="text-[13px] text-p-text-secondary leading-[1.55] mb-2 whitespace-nowrap overflow-hidden text-ellipsis">
                  {t.description}
                </div>
              )}
              <div className="flex items-center gap-[14px]">
                <span className="flex items-center gap-[5px] text-[12.5px] text-p-d-500 font-medium">
                  <Icon name="clock" size={12} />
                  Venció el {fmtDate(t.dueDate)}{dl !== null ? ` (${Math.abs(dl)}d atrás)` : ''}
                </span>
                <span className="flex items-center gap-[5px] text-[12.5px] text-p-text-secondary">
                  <Icon name="star" size={11} />{t.maxScore} pts
                </span>
              </div>
            </div>
          </div>
        );
      })}

      <div className="px-4 py-[14px] bg-p-d-100 border border-p-d-500 rounded-2xl flex items-center gap-[10px] mt-1">
        <Icon name="x" size={16} />
        <span className="text-[13px] text-p-d-700">
          Contacta a tu docente si necesitas una prórroga para estas entregas.
        </span>
      </div>
    </div>
  );
};

function StudentView({ cursoId, courseName, curso, tasks, mySubmissions }) {
  const navigate = useNavigate();
  const [tab,       setTab]       = useState('pendientes');
  const [entregarT, setEntregarT] = useState(null);

  const classrooms    = useClassrooms();
  const subjects      = useSubjects();
  const academicYears = useAcademicYears();
  const members       = useMembers();

  const subjectName   = curso ? findName(subjects.data, curso.subjectId) : courseName;
  const classroomName = curso ? findName(classrooms.data, curso.classroomId) : '';
  const yearName      = curso ? findName(academicYears.data, curso.academicYearId) : '';
  const teacherMember = curso ? members.data?.find((m) => m.id === curso.teacherMemberId) : null;
  const teacherName   = teacherMember ? `Prof. ${teacherMember.fullName}` : '—';

  const submissionsByTaskId = useMemo(() => {
    const subs = (mySubmissions.data ?? []).filter((s) => s.courseId === cursoId);
    return new Map(subs.map((s) => [s.taskId, s]));
  }, [mySubmissions.data, cursoId]);

  const now = new Date(); now.setHours(0, 0, 0, 0);
  const allTasks = tasks.data ?? [];

  const pendientes = allTasks.filter((t) => {
    if (t.status !== 'active') return false;
    if (submissionsByTaskId.has(t.id)) return false;
    const due = t.dueDate ? new Date(t.dueDate) : null;
    if (due) due.setHours(0, 0, 0, 0);
    return !due || due >= now;
  });

  const entregadas = allTasks.filter((t) => submissionsByTaskId.has(t.id));

  const vencidas = allTasks.filter((t) => {
    if (submissionsByTaskId.has(t.id)) return false;
    const due = t.dueDate ? new Date(t.dueDate) : null;
    if (!due) return false;
    due.setHours(0, 0, 0, 0);
    return (t.status === 'active' || t.status === 'closed') && due < now;
  });

  const TABS = [
    { id: 'pendientes', label: 'Pendientes', count: pendientes.length },
    { id: 'entregadas', label: 'Entregadas', count: entregadas.length },
    { id: 'vencidas',   label: 'Vencidas',   count: vencidas.length   },
  ];

  return (
    <div className="flex flex-col gap-0">
      {/* Back */}
      <button onClick={() => navigate(-1)}
        className="inline-flex items-center gap-[6px] text-[12.5px] text-p-text-secondary bg-transparent border-none cursor-pointer pb-[14px] font-sans self-start hover:text-p-text-primary transition-colors">
        <Icon name="back" size={14} /> Volver
      </button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-extrabold text-p-text-primary tracking-[-0.03em] m-0">
          Tareas · {subjectName}
        </h1>
        <div className="flex items-center gap-[10px] mt-2 flex-wrap">
          <span className="px-[10px] py-[2px] rounded-full text-[11.5px] font-semibold bg-[oklch(93%_0.040_50)] text-[oklch(35%_0.09_50)]">Estudiante</span>
          {teacherName !== '—' && <span className="text-[13px] text-p-text-secondary">{teacherName}</span>}
          {classroomName && classroomName !== '—' && (
            <>
              <span className="w-[3px] h-[3px] rounded-full bg-p-text-tertiary shrink-0" />
              <span className="text-[13px] text-p-text-secondary">{classroomName}{yearName && yearName !== '—' ? ` · ${yearName}` : ''}</span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-p-border mb-6">
        {TABS.map((t) => {
          const active = tab === t.id;
          const danger = t.id === 'vencidas' && t.count > 0;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={cn(
                'px-[18px] py-[10px] border-none bg-transparent text-[13.5px] font-sans cursor-pointer flex items-center gap-[7px] -mb-px transition-all duration-[120ms]',
                active
                  ? 'border-b-2 border-b-p-accent font-semibold text-p-text-primary'
                  : 'border-b-2 border-b-transparent font-medium text-p-text-secondary',
              )}>
              {t.label}
              {t.count > 0 && (
                <span className="px-[7px] py-[1px] rounded-full text-[11.5px] font-bold"
                  style={{
                    background: danger ? 'var(--p-d-100)' : active ? 'var(--p-bg-subtle)' : 'var(--p-bg-muted)',
                    color: danger ? 'var(--p-d-700)' : active ? 'var(--p-text-primary)' : 'var(--p-text-tertiary)',
                  }}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tasks.isLoading || mySubmissions.isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-[100px] bg-p-bg-subtle rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {tab === 'pendientes' && <TabPendientes tareas={pendientes} onEntregar={setEntregarT} />}
          {tab === 'entregadas' && <TabEntregadas tareas={entregadas} submissionsByTaskId={submissionsByTaskId} />}
          {tab === 'vencidas'   && <TabVencidas   tareas={vencidas} />}
        </>
      )}

      {entregarT && (
        <EntregarModal tarea={entregarT} courseId={cursoId} onClose={() => setEntregarT(null)} onSuccess={() => setEntregarT(null)} />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   MAIN EXPORT
   ════════════════════════════════════════════ */
export default function TasksPage() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role ?? 'student';
  const isDocente = role === 'teacher' || role === 'director';

  const location   = useLocation();
  const { cursoId } = useParams();
  const curso      = location.state?.curso ?? null;
  const courseName = curso?.name || 'Curso';

  const tasks         = useTasks(cursoId);
  const createTask    = useCreateTask(cursoId);
  const updateTask    = useUpdateTask(cursoId);
  const deleteTask    = useDeleteTask(cursoId);
  const mySubmissions = useMySubmissions(!isDocente);

  if (isDocente) {
    return <TeacherView cursoId={cursoId} courseName={courseName} tasks={tasks} createTask={createTask} updateTask={updateTask} deleteTask={deleteTask} />;
  }

  return <StudentView cursoId={cursoId} courseName={courseName} curso={curso} tasks={tasks} mySubmissions={mySubmissions} />;
}
