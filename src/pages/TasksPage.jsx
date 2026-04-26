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
  active:  { label: 'Activa',   bg: 'var(--p-s-100)',     color: 'var(--p-s-700)'     },
  draft:   { label: 'Borrador', bg: 'var(--p-w-100)',     color: 'var(--p-w-700)'     },
  closed:  { label: 'Cerrada',  bg: 'var(--p-bg-subtle)', color: 'var(--p-text-tertiary)' },
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
  const [hov, setHov] = useState(false);
  const pad = size === 'sm' ? '5px 12px' : size === 'lg' ? '10px 22px' : '7px 16px';
  const fs = size === 'sm' ? 12.5 : size === 'lg' ? 14.5 : 13;
  const v = {
    primary:  { bg: hov ? 'var(--p-accent-hover)' : 'var(--p-accent)', color: 'var(--p-accent-text)', border: 'transparent' },
    secondary:{ bg: hov ? 'var(--p-bg-subtle)' : 'var(--p-bg-base)', color: 'var(--p-text-primary)', border: 'var(--p-border)' },
    ghost:    { bg: hov ? 'var(--p-bg-subtle)' : 'transparent', color: hov ? 'var(--p-text-primary)' : 'var(--p-text-secondary)', border: 'transparent' },
    danger:   { bg: hov ? 'var(--p-d-700)' : 'var(--p-d-500)', color: 'white', border: 'transparent' },
  }[variant];
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: pad,
        borderRadius: 10, border: `1px solid ${v.border}`,
        background: v.bg, color: v.color, fontSize: fs, fontFamily: 'inherit',
        fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'all 0.1s' }}>
      {icon && <Icon name={icon} size={fs} />}
      {children}
    </button>
  );
};

/* ── GhostIcon ── */
const GhostIcon = ({ name, title, onClick, danger }) => {
  const [hov, setHov] = useState(false);
  return (
    <button title={title} onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid transparent',
        background: hov ? (danger ? 'var(--p-d-100)' : 'var(--p-bg-subtle)') : 'transparent',
        color: hov ? (danger ? 'var(--p-d-500)' : 'var(--p-text-primary)') : 'var(--p-text-tertiary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.1s' }}>
      <Icon name={name} size={14} />
    </button>
  );
};

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
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'oklch(0% 0 0/0.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(2px)', padding: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width, maxWidth: 'calc(100vw - 32px)', maxHeight: '90vh',
        background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 24,
        boxShadow: 'var(--p-shadow-lg)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '18px 24px 16px', borderBottom: '1px solid var(--p-border)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--p-text-primary)', letterSpacing: '-0.02em' }}>{title}</div>
            {subtitle && <div style={{ fontSize: 12.5, color: 'var(--p-text-secondary)', marginTop: 3 }}>{subtitle}</div>}
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 10,
            border: '1px solid var(--p-border)', background: 'transparent', cursor: 'pointer',
            color: 'var(--p-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, lineHeight: 1, flexShrink: 0 }}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
};

/* ── Field ── */
const Field = ({ label, error, required, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--p-text-secondary)', marginBottom: 6 }}>
      {label}{required && <span style={{ color: 'var(--p-d-500)', marginLeft: 3 }}>*</span>}
    </label>
    {children}
    {error && <div style={{ fontSize: 11.5, color: 'var(--p-d-500)', marginTop: 4 }}>{error}</div>}
  </div>
);

const inputStyle = {
  width: '100%', padding: '8px 11px', fontSize: 13.5, fontFamily: 'inherit',
  border: '1.5px solid var(--p-border)', borderRadius: 10,
  background: 'var(--p-bg-base)', color: 'var(--p-text-primary)', outline: 'none',
};

/* ── Toggle ── */
const Toggle = ({ checked, onChange, label, sub }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
    <div>
      <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--p-text-primary)' }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--p-text-secondary)', marginTop: 2 }}>{sub}</div>}
    </div>
    <button type="button" onClick={() => onChange(!checked)}
      style={{ width: 40, height: 22, borderRadius: 99, border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0,
        background: checked ? 'var(--p-accent)' : 'var(--p-bg-muted)', transition: 'background 0.2s', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 2, width: 18, height: 18, borderRadius: 99, background: 'white',
        boxShadow: '0 1px 3px oklch(0% 0 0/0.2)',
        transform: checked ? 'translateX(20px)' : 'translateX(2px)', transition: 'transform 0.2s' }} />
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
      await grade.mutateAsync({
        submissionId: submission.id,
        score: score !== '' ? Number(score) : null,
        feedback: feedback || null,
        status,
      });
      setSaved(true);
      setTimeout(onClose, 1400);
    } catch { /* handled */ }
  };

  return (
    <Modal open onClose={onClose}
      title={`Revisión — ${submission.studentFullName}`}
      subtitle={`${task.title} · Entregada ${fmtDate(submission.submittedAt) ?? '—'}`}
      width={att && (isImage(att.contentType) || isPdf(att.contentType)) ? 720 : 540}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* File viewer */}
        {att && (
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--p-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Evidencia</div>
            {attLoading ? (
              <div style={{ height: 80, background: 'var(--p-bg-subtle)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--p-text-tertiary)', fontSize: 13 }}>Cargando…</div>
            ) : isImage(att.contentType) ? (
              attUrl ? (
                <img src={attUrl} alt={att.filename}
                  style={{ maxWidth: '100%', maxHeight: 420, borderRadius: 12, border: '1px solid var(--p-border)', objectFit: 'contain', display: 'block' }} />
              ) : null
            ) : isPdf(att.contentType) ? (
              attUrl ? (
                <iframe key={attUrl} src={attUrl} title={att.filename}
                  style={{ width: '100%', height: 420, borderRadius: 12, border: '1px solid var(--p-border)', background: '#f5f5f5' }} />
              ) : null
            ) : (
              <div style={{ padding: '14px 16px', background: 'var(--p-bg-subtle)', border: '1px solid var(--p-border)', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
                <Icon name="inbox" size={16} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--p-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{att.filename}</div>
                  {att.size && <div style={{ fontSize: 11.5, color: 'var(--p-text-tertiary)' }}>{(att.size / 1024).toFixed(1)} KB · {att.contentType || 'archivo'}</div>}
                </div>
                <a href={attUrl} download={att.filename} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                  <Btn variant="secondary" size="sm" icon="upload">Descargar</Btn>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Student note */}
        {submission.content && (
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--p-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Nota del alumno</div>
            <div style={{ padding: '12px 14px', background: 'var(--p-bg-subtle)', borderRadius: 12, border: '1px solid var(--p-border)', fontSize: 13.5, color: 'var(--p-text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {submission.content}
            </div>
          </div>
        )}

        {/* Grade form */}
        <div style={{ borderTop: '1px solid var(--p-border)', paddingTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--p-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Calificación</div>
          <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 12 }}>
            <Field label={`Puntaje (máx ${task.maxScore})`}>
              <input type="number" min={0} max={task.maxScore} value={score}
                onChange={(e) => setScore(e.target.value)} placeholder="—" style={inputStyle} />
            </Field>
            <Field label="Estado">
              <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputStyle}>
                <option value="graded">Calificada</option>
                <option value="returned">Devuelta al alumno</option>
              </select>
            </Field>
          </div>
          <Field label="Retroalimentación">
            <textarea value={feedback} onChange={(e) => setFeedback(e.target.value)}
              rows={3} placeholder="Comentarios para el alumno…"
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }} />
          </Field>
        </div>
      </div>

      <div style={{ padding: '14px 24px', borderTop: '1px solid var(--p-border)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--p-bg-subtle)', flexShrink: 0 }}>
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
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Rate */}
          <div style={{ background: 'var(--p-bg-subtle)', borderRadius: 16, padding: '16px 18px', border: '1px solid var(--p-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--p-text-primary)' }}>Tasa de entrega</span>
              <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em', color: pct >= 70 ? 'var(--p-s-700)' : pct >= 40 ? 'oklch(50% 0.12 72)' : 'var(--p-d-500)' }}>{pct}%</span>
            </div>
            <div style={{ height: 8, borderRadius: 99, background: 'var(--p-border)', overflow: 'hidden' }}>
              <div style={{ height: 8, borderRadius: 99, width: `${pct}%`, transition: 'width 0.4s',
                background: pct >= 70 ? 'var(--p-s-500)' : pct >= 40 ? 'oklch(72% 0.15 72)' : 'var(--p-d-500)' }} />
            </div>
            <div style={{ display: 'flex', gap: 18, marginTop: 10, fontSize: 12.5 }}>
              <span style={{ color: 'var(--p-s-700)' }}>✓ {subs.length} entregadas</span>
              <span style={{ color: 'var(--p-text-tertiary)' }}>○ {notSent.length} pendientes</span>
              <span style={{ color: 'var(--p-text-secondary)' }}>{enrolled.length} inscritos total</span>
            </div>
          </div>

          {/* Submitted */}
          {subs.length > 0 && (
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--p-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Entregadas ({subs.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {subs.map((sub) => {
                  const sm = STATUS_SUB[sub.status] ?? STATUS_SUB.submitted;
                  const bg = avatarColor(sub.studentFullName || sub.studentEmail);
                  const ini = getInitials(sub.studentFullName || sub.studentEmail);
                  return (
                    <div key={sub.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '99px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0 }}>{ini}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--p-text-primary)' }}>{sub.studentFullName}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--p-text-tertiary)', marginTop: 1 }}>
                          {fmtDate(sub.submittedAt)}
                          {sub.score !== null && sub.score !== undefined && ` · ${sub.score}/${task.maxScore} pts`}
                        </div>
                      </div>
                      <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: 11.5, fontWeight: 600, background: sm.bg, color: sm.color }}>{sm.label}</span>
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
              <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--p-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Sin entregar ({notSent.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {notSent.map((e) => {
                  const bg  = avatarColor(e.fullName || e.email);
                  const ini = getInitials(e.fullName || e.email);
                  return (
                    <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', background: 'var(--p-bg-subtle)', border: '1px solid var(--p-border)', borderRadius: 12, opacity: 0.65 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '99px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', flexShrink: 0, filter: 'grayscale(0.6)' }}>{ini}</div>
                      <div style={{ flex: 1 }}><div style={{ fontSize: 13.5, color: 'var(--p-text-secondary)' }}>{e.fullName || e.email}</div></div>
                      <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: 11.5, fontWeight: 500, background: 'var(--p-bg-muted)', color: 'var(--p-text-tertiary)' }}>Pendiente</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {(submissions.isLoading || enrollments.isLoading) && (
            <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--p-text-tertiary)', fontSize: 13.5 }}>Cargando…</div>
          )}

          {!submissions.isLoading && !enrollments.isLoading && enrolled.length === 0 && (
            <div style={{ padding: '32px 24px', textAlign: 'center', color: 'var(--p-text-tertiary)', fontSize: 13.5 }}>Sin alumnos inscritos en este curso.</div>
          )}
        </div>

        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--p-border)', background: 'var(--p-bg-subtle)', flexShrink: 0 }}>
          <Btn variant="secondary" onClick={onClose}>Cerrar</Btn>
        </div>
      </Modal>

      {reviewing && (
        <EvidenceModal
          submission={reviewing}
          task={task}
          courseId={courseId}
          onClose={() => setReviewing(null)}
        />
      )}
    </>
  );
};

/* ════════════════════════════════════════════
   TEACHER VIEW
   ════════════════════════════════════════════ */

const TareaFormModal = ({ open, onClose, initial, onSave, isPending }) => {
  const isEdit = !!initial;
  const [titulo,   setTitulo]   = useState(initial?.title       || '');
  const [desc,     setDesc]     = useState(initial?.description || '');
  const [limite,   setLimite]   = useState(initial?.dueDate ? new Date(initial.dueDate).toISOString().slice(0, 10) : '');
  const [puntaje,  setPuntaje]  = useState(initial?.maxScore    || 10);
  const [tipo,     setTipo]     = useState(initial?.type        || 'tarea');
  const [publicar, setPublicar] = useState(initial ? initial.status === 'active' : true);
  const [statusSel,setStatusSel]= useState(initial?.status      || 'active');
  const [errors,   setErrors]   = useState({});

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
    onSave({
      title: titulo.trim(),
      description: desc.trim() || undefined,
      dueDate: limite || undefined,
      maxScore: +puntaje,
      type: tipo,
      status: isEdit ? statusSel : (publicar ? 'active' : 'draft'),
    });
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Editar tarea' : 'Nueva tarea'}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Field label="Tipo de actividad" required>
            <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={inputStyle}>
              {Object.entries(TIPO_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Puntaje máximo" required error={errors.puntaje}>
            <input type="number" min={1} max={100} value={puntaje} onChange={(e) => setPuntaje(e.target.value)} style={inputStyle} />
          </Field>
        </div>

        <Field label="Título" required error={errors.titulo}>
          <input value={titulo} onChange={(e) => { setTitulo(e.target.value); setErrors((p) => ({ ...p, titulo: '' })); }}
            placeholder="Ej. Ejercicios capítulo 3" style={inputStyle} />
        </Field>

        <Field label="Descripción / instrucciones">
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4}
            placeholder="Instrucciones detalladas para los estudiantes…"
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }} />
        </Field>

        <Field label="Fecha límite">
          <input type="date" value={limite} onChange={(e) => setLimite(e.target.value)} style={inputStyle} />
        </Field>

        {isEdit ? (
          <Field label="Estado">
            <select value={statusSel} onChange={(e) => setStatusSel(e.target.value)} style={inputStyle}>
              <option value="active">Activa</option>
              <option value="draft">Borrador</option>
              <option value="closed">Cerrada</option>
            </select>
          </Field>
        ) : (
          <div style={{ padding: '14px 16px', background: 'var(--p-bg-subtle)', borderRadius: 16, border: '1px solid var(--p-border)' }}>
            <Toggle checked={publicar} onChange={setPublicar}
              label="Publicar inmediatamente"
              sub={publicar ? 'Los alumnos verán esta tarea al guardar.' : 'Se guardará como borrador. Los alumnos no la verán.'} />
          </div>
        )}
      </div>

      <div style={{ padding: '14px 24px', borderTop: '1px solid var(--p-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--p-bg-subtle)', flexShrink: 0 }}>
        <span style={{ fontSize: 12, color: publicar && !isEdit ? 'var(--p-s-700)' : 'var(--p-text-tertiary)', fontWeight: publicar && !isEdit ? 500 : 400 }}>
          {!isEdit && (publicar ? '✓ Se publicará para los alumnos' : 'Se guardará como borrador')}
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
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
        <div style={{ padding: '20px 24px' }}>
          <div style={{ width: 44, height: 44, borderRadius: 16, background: 'var(--p-d-100)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--p-d-500)', marginBottom: 14 }}>
            <Icon name="trash" size={20} />
          </div>
          <p style={{ fontSize: 14, color: 'var(--p-text-secondary)', lineHeight: 1.65 }}>
            ¿Eliminar la tarea <strong style={{ color: 'var(--p-text-primary)' }}>{tarea.title}</strong>? Esta acción no se puede deshacer.
          </p>
        </div>
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--p-border)', display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--p-bg-subtle)' }}>
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
  const tm = TIPO_META[tarea.type]   || TIPO_META.tarea;
  const em = ESTADO_META[tarea.status] || ESTADO_META.active;
  const dl = daysLeft(tarea.dueDate);
  const overdue = dl !== null && dl < 0 && tarea.status === 'active';

  return (
    <div style={{ background: 'var(--p-bg-base)', border: '1px solid var(--p-border)', borderRadius: 16,
      boxShadow: 'var(--p-shadow-sm)', padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'flex-start', transition: 'box-shadow 0.12s' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = 'var(--p-shadow-md)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'var(--p-shadow-sm)'; }}>

      <div style={{ width: 40, height: 40, borderRadius: 10, background: tm.bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: tm.color, flexShrink: 0 }}>
        <Icon name={tm.icon} size={18} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5, flexWrap: 'wrap' }}>
              <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: 11.5, fontWeight: 600, background: tm.bg, color: tm.color }}>{tm.label}</span>
              <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: 11.5, fontWeight: 600, background: em.bg, color: em.color }}>{em.label}</span>
            </div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--p-text-primary)', letterSpacing: '-0.02em', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {tarea.title}
            </div>
            {tarea.description && (
              <div style={{ fontSize: 13, color: 'var(--p-text-secondary)', lineHeight: 1.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {tarea.description}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <GhostIcon name="edit"  title="Editar"   onClick={() => onEdit(tarea)} />
            <GhostIcon name="trash" title="Eliminar" onClick={() => onDelete(tarea)} danger />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 10, flexWrap: 'wrap' }}>
          {tarea.dueDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5,
              color: overdue ? 'var(--p-d-500)' : 'var(--p-text-secondary)', fontWeight: overdue ? 500 : 400 }}>
              <Icon name="clock" size={12} />
              <span>{fmtDate(tarea.dueDate)}</span>
              {dl !== null && (
                <span style={{ fontSize: 11.5, color: overdue ? 'var(--p-d-500)' : dl === 0 ? 'var(--p-w-700)' : dl <= 3 ? 'var(--p-w-500)' : 'var(--p-text-tertiary)' }}>
                  ({overdue ? `venció hace ${-dl}d` : dl === 0 ? 'hoy' : `en ${dl}d`})
                </span>
              )}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--p-text-secondary)' }}>
            <Icon name="star" size={12} />
            <span>{tarea.maxScore} pts</span>
          </div>
          {onReview && (
            <button onClick={() => onReview(tarea)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8,
                border: '1px solid var(--p-border)', background: 'transparent', color: 'var(--p-text-secondary)',
                fontSize: 12, fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer', transition: 'all 0.1s' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--p-bg-subtle)'; e.currentTarget.style.color = 'var(--p-text-primary)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--p-text-secondary)'; }}>
              <Icon name="inbox" size={12} /> Ver entregas
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyStateDocente = ({ onNew }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 24px', gap: 18 }}>
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
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--p-text-primary)', marginBottom: 8, letterSpacing: '-0.02em' }}>Sin tareas aún</div>
      <div style={{ fontSize: 14, color: 'var(--p-text-secondary)', maxWidth: 320 }}>
        Crea la primera tarea para este grupo y los alumnos la verán de inmediato.
      </div>
    </div>
    <Btn variant="primary" icon="plus" size="lg" onClick={onNew}>Crear primera tarea</Btn>
  </div>
);

function TeacherView({ cursoId, courseName, tasks, createTask, updateTask, deleteTask }) {
  const [modal,     setModal]     = useState(null);
  const [deleteT,   setDeleteT]   = useState(null);
  const [reviewing, setReviewing] = useState(null); // task being reviewed
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header */}
      <div>
        <button onClick={() => navigate(-1)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--p-text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 0 10px', fontFamily: 'inherit' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--p-text-primary)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--p-text-secondary)')}>
          <Icon name="back" size={14} /> Volver
        </button>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--p-text-primary)', letterSpacing: '-0.03em', margin: 0, marginBottom: 6 }}>
              Tareas · {courseName}
            </h1>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'var(--p-text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 7, height: 7, borderRadius: '99px', background: 'var(--p-s-500)', display: 'inline-block' }} />
                {activas} activa{activas !== 1 ? 's' : ''}
              </span>
              {borradores > 0 && (
                <span style={{ fontSize: 13, color: 'var(--p-text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '99px', background: 'var(--p-w-500)', display: 'inline-block' }} />
                  {borradores} borrador{borradores !== 1 ? 'es' : ''}
                </span>
              )}
            </div>
          </div>
          <Btn variant="primary" icon="plus" size="lg" onClick={() => setModal({ mode: 'create' })}>Nueva Tarea</Btn>
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', background: 'var(--p-bg-subtle)', borderRadius: 10, padding: 3, gap: 2 }}>
          {FILTROS.map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              style={{ padding: '5px 13px', borderRadius: 6, border: 'none', fontSize: 12.5,
                fontFamily: 'inherit', fontWeight: 500, cursor: 'pointer', transition: 'all 0.12s',
                background: filter === v ? 'var(--p-bg-base)' : 'transparent',
                color: filter === v ? 'var(--p-text-primary)' : 'var(--p-text-secondary)',
                boxShadow: filter === v ? 'var(--p-shadow-sm)' : 'none' }}>
              {l}
            </button>
          ))}
        </div>
        <span style={{ fontSize: 12.5, color: 'var(--p-text-tertiary)' }}>{filtered.length} tarea{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Task list */}
      {tasks.isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 100, background: 'var(--p-bg-subtle)', borderRadius: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        filter === 'todas'
          ? <EmptyStateDocente onNew={() => setModal({ mode: 'create' })} />
          : <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--p-text-tertiary)', fontSize: 14 }}>No hay tareas en este estado.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((t) => (
            <TareaCard key={t.id} tarea={t}
              onEdit={(t) => setModal({ mode: 'edit', tarea: t })}
              onDelete={setDeleteT}
              onReview={setReviewing} />
          ))}
        </div>
      )}

      <TareaFormModal
        open={!!modal} onClose={() => setModal(null)}
        initial={modal?.tarea}
        onSave={handleSave}
        isPending={createTask.isPending || updateTask.isPending} />

      <DeleteModal
        open={!!deleteT} tarea={deleteT}
        onClose={() => setDeleteT(null)} onConfirm={handleDelete}
        isPending={deleteTask.isPending} />

      {reviewing && (
        <SubmissionsModal
          task={reviewing}
          courseId={cursoId}
          onClose={() => setReviewing(null)}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   STUDENT VIEW
   ════════════════════════════════════════════ */

const SubmissionFilePicker = ({ file, progress, uploading, error, onPick, onClear }) => {
  const [drag, setDrag] = useState(false);
  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onPick(f);
  };

  return (
    <div>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--p-text-secondary)', marginBottom: 6 }}>
        Archivo adjunto <span style={{ color: 'var(--p-text-tertiary)', fontWeight: 400 }}>(opcional, hasta 25 MB)</span>
      </label>

      {!file ? (
        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
            padding: '18px 14px', cursor: 'pointer',
            border: `1.5px dashed ${drag ? 'var(--p-accent)' : 'var(--p-border)'}`,
            borderRadius: 12,
            background: drag ? 'var(--p-bg-subtle)' : 'var(--p-bg-base)',
            color: 'var(--p-text-secondary)', fontSize: 13,
            transition: 'border-color 0.12s, background 0.12s',
          }}>
          <Icon name="upload" size={20} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 500 }}>Click o arrastra un archivo aquí</div>
            <div style={{ fontSize: 11.5, color: 'var(--p-text-tertiary)', marginTop: 2 }}>
              PDF, Word, Excel, PowerPoint, imágenes o texto
            </div>
          </div>
          <input
            type="file"
            style={{ display: 'none' }}
            onChange={(e) => onPick(e.target.files?.[0] ?? null)}
          />
        </label>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', border: '1px solid var(--p-border)', borderRadius: 12,
          background: 'var(--p-bg-subtle)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, background: 'var(--p-accent)',
            color: 'var(--p-accent-text)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon name="upload" size={14} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 500, color: 'var(--p-text-primary)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>{file.name}</div>
            <div style={{ fontSize: 11.5, color: 'var(--p-text-tertiary)', marginTop: 1 }}>
              {(file.size / 1024).toFixed(1)} KB · {file.type || 'desconocido'}
              {uploading && ` · subiendo ${progress}%`}
            </div>
          </div>
          {!uploading && (
            <button type="button" onClick={onClear}
              style={{
                background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--p-text-tertiary)', display: 'flex', padding: 4,
              }}
              aria-label="Quitar archivo">
              <Icon name="x" size={14} />
            </button>
          )}
        </div>
      )}

      {error && (
        <div style={{ marginTop: 6, fontSize: 12, color: 'var(--p-d-700)' }}>{error}</div>
      )}
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
    if (f.size > MAX_FILE_SIZE) {
      setFileError(`Excede el máximo de ${Math.round(MAX_FILE_SIZE / 1024 / 1024)} MB`);
      return;
    }
    const ct = (f.type || 'application/octet-stream').toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(ct)) {
      setFileError(`Tipo de archivo no permitido: ${ct || 'desconocido'}`);
      return;
    }
    setFile(f);
  };

  const handleSubmit = async () => {
    try {
      let attachments;
      if (file) {
        setUploading(true);
        setProgress(0);
        const att = await uploadFile(
          file,
          { kind: 'submission', courseId, taskId: tarea.id },
          { onProgress: setProgress },
        );
        attachments = [att];
        setUploading(false);
      }
      await submit.mutateAsync({
        taskId: tarea.id,
        content: [contenido.trim(), comentario.trim()].filter(Boolean).join('\n\n') || undefined,
        attachments,
      });
      setDone(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1600);
    } catch (err) {
      setUploading(false);
      if (err?.message && !err?.response) setFileError(err.message);
      // axios errors are surfaced by the hook's onError
    }
  };

  if (done) return (
    <Modal open onClose={onClose} title="Entrega registrada" width={400}>
      <div style={{ padding: '36px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '99px', background: 'var(--p-s-100)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--p-s-700)' }}>
          <Icon name="check" size={30} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--p-text-primary)', marginBottom: 6 }}>¡Tarea entregada!</div>
          <div style={{ fontSize: 13.5, color: 'var(--p-text-secondary)', lineHeight: 1.6 }}>
            Tu entrega fue registrada. El docente la revisará pronto.
          </div>
        </div>
      </div>
    </Modal>
  );

  return (
    <Modal open onClose={onClose} title={`Entregar — ${tarea?.title}`} subtitle={`${tm.label} · ${tarea?.maxScore} pts`}>
      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto', flex: 1 }}>
        <div style={{ padding: '10px 14px', background: 'var(--p-bg-subtle)', border: '1px solid var(--p-border)',
          borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: tm.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: tm.color, flexShrink: 0 }}>
            <Icon name="book" size={14} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--p-text-primary)' }}>{tarea?.title}</div>
            <div style={{ fontSize: 11.5, color: 'var(--p-text-tertiary)', marginTop: 1 }}>
              {tarea?.dueDate && `Fecha límite: ${fmtDate(tarea.dueDate)} · `}Puntaje: {tarea?.maxScore} pts
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--p-text-secondary)', marginBottom: 6 }}>
            Enlace <span style={{ color: 'var(--p-text-tertiary)', fontWeight: 400 }}>(opcional)</span>
          </label>
          <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--p-text-tertiary)', display: 'flex', pointerEvents: 'none' }}>
              <Icon name="upload" size={14} />
            </span>
            <input value={contenido} onChange={(e) => setContenido(e.target.value)}
              placeholder="https://drive.google.com/…"
              style={{ ...inputStyle, padding: '9px 11px 9px 32px' }} />
          </div>
        </div>

        <SubmissionFilePicker
          file={file}
          progress={progress}
          uploading={uploading}
          error={fileError}
          onPick={onPickFile}
          onClear={() => { setFile(null); setFileError(null); setProgress(0); }}
        />

        <div>
          <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--p-text-secondary)', marginBottom: 6 }}>
            Comentarios para el docente
          </label>
          <textarea value={comentario} onChange={(e) => setComentario(e.target.value)}
            placeholder="Escribe cualquier nota o aclaración sobre tu entrega…" rows={4}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.55 }} />
        </div>
      </div>

      <div style={{ padding: '14px 24px', borderTop: '1px solid var(--p-border)',
        display: 'flex', justifyContent: 'flex-end', gap: 8, background: 'var(--p-bg-subtle)', flexShrink: 0 }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
      <div style={{ width: 52, height: 52, borderRadius: '99px', background: 'var(--p-s-100)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--p-s-700)' }}>
        <Icon name="check" size={24} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--p-text-primary)', marginBottom: 6 }}>¡Todo al día!</div>
        <div style={{ fontSize: 13.5, color: 'var(--p-text-secondary)' }}>No tienes tareas pendientes por entregar.</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {tareas.map((t) => {
        const tm = TIPO_META[t.type] || TIPO_META.tarea;
        const dl = daysLeft(t.dueDate);
        const um = urgMeta(dl);
        return (
          <div key={t.id} style={{ background: 'var(--p-bg-base)', border: '1px solid var(--p-border)',
            borderRadius: 16, padding: '18px 20px',
            display: 'flex', gap: 16, alignItems: 'flex-start', boxShadow: 'var(--p-shadow-sm)', transition: 'box-shadow 0.12s' }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = 'var(--p-shadow-md)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'var(--p-shadow-sm)')}>

            <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 99, background: um.dot, flexShrink: 0, minHeight: 40 }} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7, flexWrap: 'wrap' }}>
                <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: 11.5, fontWeight: 600, background: tm.bg, color: tm.color }}>{tm.label}</span>
                <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: 11.5, fontWeight: 700, background: um.bg, color: um.color }}>{um.label}</span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--p-text-primary)', letterSpacing: '-0.02em', marginBottom: 5 }}>{t.title}</div>
              {t.description && (
                <div style={{ fontSize: 13, color: 'var(--p-text-secondary)', lineHeight: 1.55, marginBottom: 10,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 560 }}>
                  {t.description}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
                {t.dueDate && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5,
                    color: dl !== null && dl <= 1 ? 'var(--p-d-500)' : 'var(--p-text-secondary)',
                    fontWeight: dl !== null && dl <= 1 ? 500 : 400 }}>
                    <Icon name="clock" size={12} />
                    {fmtDate(t.dueDate)}
                    {dl !== null && (
                      <span style={{ fontSize: 11.5, color: dl <= 0 ? 'var(--p-d-500)' : 'var(--p-text-tertiary)' }}>
                        ({dl <= 0 ? 'hoy' : `en ${dl}d`})
                      </span>
                    )}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--p-text-secondary)' }}>
                  <Icon name="star" size={12} />{t.maxScore} pts
                </span>
              </div>
            </div>

            <div style={{ flexShrink: 0, paddingTop: 4 }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
      <div style={{ width: 52, height: 52, borderRadius: '99px', background: 'var(--p-bg-subtle)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--p-text-tertiary)' }}>
        <Icon name="upload" size={24} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--p-text-primary)', marginBottom: 6 }}>Sin entregas aún</div>
        <div style={{ fontSize: 13.5, color: 'var(--p-text-secondary)' }}>Tus entregas aparecerán aquí cuando las envíes.</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {tareas.map((t) => {
        const tm  = TIPO_META[t.type] || TIPO_META.tarea;
        const sub = submissionsByTaskId.get(t.id);
        const graded = sub?.status === 'graded';
        const pct = graded && sub.score !== null ? Math.round((sub.score / t.maxScore) * 100) : null;
        const aprobado = pct !== null && pct >= 60;

        return (
          <div key={t.id} style={{ background: 'var(--p-bg-base)', border: '1px solid var(--p-border)',
            borderRadius: 16, padding: '16px 20px',
            display: 'flex', gap: 14, alignItems: 'center', boxShadow: 'var(--p-shadow-sm)', transition: 'box-shadow 0.12s' }}
            onMouseEnter={(e) => (e.currentTarget.style.boxShadow = 'var(--p-shadow-md)')}
            onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'var(--p-shadow-sm)')}>

            <div style={{ width: 38, height: 38, borderRadius: 10, background: tm.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: tm.color, flexShrink: 0 }}>
              <Icon name="book" size={16} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--p-text-primary)', letterSpacing: '-0.01em', marginBottom: 3 }}>{t.title}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                {sub?.submittedAt && (
                  <span style={{ fontSize: 12.5, color: 'var(--p-text-secondary)' }}>
                    Entregada el {fmtDate(sub.submittedAt)}
                  </span>
                )}
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--p-text-secondary)' }}>
                  <Icon name="star" size={11} />{t.maxScore} pts
                </span>
              </div>
            </div>

            <div style={{ flexShrink: 0, textAlign: 'center' }}>
              {!graded ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 11px',
                  borderRadius: '99px', fontSize: 12, fontWeight: 500,
                  background: 'var(--p-bg-subtle)', color: 'var(--p-text-secondary)', border: '1px solid var(--p-border)' }}>
                  <Icon name="clock" size={12} />Por revisar
                </span>
              ) : sub.score === null ? (
                <span style={{ fontSize: 13, color: 'var(--p-text-tertiary)' }}>—</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: aprobado ? 'var(--p-s-700)' : 'var(--p-d-500)', letterSpacing: '-0.04em', lineHeight: 1 }}>
                    {sub.score}<span style={{ fontSize: 14, fontWeight: 500, color: 'var(--p-text-tertiary)' }}>/{t.maxScore}</span>
                  </div>
                  <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: 11, fontWeight: 700,
                    background: aprobado ? 'var(--p-s-100)' : 'var(--p-d-100)',
                    color: aprobado ? 'var(--p-s-700)' : 'var(--p-d-700)' }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px', gap: 14 }}>
      <div style={{ width: 52, height: 52, borderRadius: '99px', background: 'var(--p-s-100)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--p-s-700)' }}>
        <Icon name="check" size={24} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--p-text-primary)', marginBottom: 6 }}>Sin tareas vencidas</div>
        <div style={{ fontSize: 13.5, color: 'var(--p-text-secondary)' }}>¡Bien hecho! No tienes tareas vencidas sin entregar.</div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {tareas.map((t) => {
        const tm = TIPO_META[t.type] || TIPO_META.tarea;
        const dl = daysLeft(t.dueDate);
        return (
          <div key={t.id} style={{ background: 'var(--p-bg-base)', border: '1px solid var(--p-d-100)',
            borderRadius: 16, padding: '16px 20px',
            display: 'flex', gap: 14, alignItems: 'flex-start', boxShadow: 'var(--p-shadow-sm)', opacity: 0.85 }}>
            <div style={{ width: 3, alignSelf: 'stretch', borderRadius: 99, background: 'var(--p-d-500)', flexShrink: 0, minHeight: 36 }} />
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--p-d-100)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--p-d-500)', flexShrink: 0 }}>
              <Icon name="lock" size={16} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: 11.5, fontWeight: 600, background: tm.bg, color: tm.color }}>{tm.label}</span>
                <span style={{ padding: '2px 8px', borderRadius: '99px', fontSize: 11.5, fontWeight: 700, background: 'var(--p-d-100)', color: 'var(--p-d-700)' }}>Vencida</span>
              </div>
              <div style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--p-text-primary)', letterSpacing: '-0.01em', marginBottom: 4, textDecoration: 'line-through', opacity: 0.7 }}>
                {t.title}
              </div>
              {t.description && (
                <div style={{ fontSize: 13, color: 'var(--p-text-secondary)', lineHeight: 1.55, marginBottom: 8, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {t.description}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--p-d-500)', fontWeight: 500 }}>
                  <Icon name="clock" size={12} />
                  Venció el {fmtDate(t.dueDate)}{dl !== null ? ` (${Math.abs(dl)}d atrás)` : ''}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: 'var(--p-text-secondary)' }}>
                  <Icon name="star" size={11} />{t.maxScore} pts
                </span>
              </div>
            </div>
          </div>
        );
      })}

      <div style={{ padding: '14px 16px', background: 'var(--p-d-100)', border: '1px solid var(--p-d-500)',
        borderRadius: 16, display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
        <Icon name="x" size={16} />
        <span style={{ fontSize: 13, color: 'var(--p-d-700)' }}>
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

  const classrooms   = useClassrooms();
  const subjects     = useSubjects();
  const academicYears= useAcademicYears();
  const members      = useMembers();

  const subjectName  = curso ? findName(subjects.data, curso.subjectId) : courseName;
  const classroomName= curso ? findName(classrooms.data, curso.classroomId) : '';
  const yearName     = curso ? findName(academicYears.data, curso.academicYearId) : '';
  const teacherMember= curso ? members.data?.find((m) => m.id === curso.teacherMemberId) : null;
  const teacherName  = teacherMember ? `Prof. ${teacherMember.fullName}` : '—';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Back */}
      <button onClick={() => navigate(-1)}
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--p-text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 0 14px', fontFamily: 'inherit', alignSelf: 'flex-start' }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--p-text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--p-text-secondary)')}>
        <Icon name="back" size={14} /> Volver
      </button>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--p-text-primary)', letterSpacing: '-0.03em', marginBottom: 8, margin: 0 }}>
          Tareas · {subjectName}
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
          <span style={{ padding: '2px 10px', borderRadius: '99px', fontSize: 11.5, fontWeight: 600,
            background: 'oklch(93% 0.040 50)', color: 'oklch(35% 0.09 50)' }}>Estudiante</span>
          {teacherName !== '—' && <span style={{ fontSize: 13, color: 'var(--p-text-secondary)' }}>{teacherName}</span>}
          {classroomName && classroomName !== '—' && (
            <>
              <span style={{ width: 3, height: 3, borderRadius: '99px', background: 'var(--p-text-tertiary)', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: 'var(--p-text-secondary)' }}>{classroomName}{yearName && yearName !== '—' ? ` · ${yearName}` : ''}</span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--p-border)', marginBottom: 24 }}>
        {TABS.map((t) => {
          const active = tab === t.id;
          const danger = t.id === 'vencidas' && t.count > 0;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ padding: '10px 18px', border: 'none', borderBottom: active ? '2px solid var(--p-accent)' : '2px solid transparent',
                background: 'transparent', fontSize: 13.5, fontFamily: 'inherit',
                fontWeight: active ? 600 : 500, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
                color: active ? 'var(--p-text-primary)' : 'var(--p-text-secondary)',
                marginBottom: -1, transition: 'all 0.12s' }}>
              {t.label}
              {t.count > 0 && (
                <span style={{ padding: '1px 7px', borderRadius: '99px', fontSize: 11.5, fontWeight: 700,
                  background: danger ? 'var(--p-d-100)' : active ? 'var(--p-bg-subtle)' : 'var(--p-bg-muted)',
                  color: danger ? 'var(--p-d-700)' : active ? 'var(--p-text-primary)' : 'var(--p-text-tertiary)' }}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {tasks.isLoading || mySubmissions.isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map((i) => <div key={i} style={{ height: 100, background: 'var(--p-bg-subtle)', borderRadius: 16, animation: 'pulse 1.5s ease-in-out infinite' }} />)}
        </div>
      ) : (
        <>
          {tab === 'pendientes' && <TabPendientes tareas={pendientes} onEntregar={setEntregarT} />}
          {tab === 'entregadas' && <TabEntregadas tareas={entregadas} submissionsByTaskId={submissionsByTaskId} />}
          {tab === 'vencidas'   && <TabVencidas   tareas={vencidas} />}
        </>
      )}

      {entregarT && (
        <EntregarModal
          tarea={entregarT}
          courseId={cursoId}
          onClose={() => setEntregarT(null)}
          onSuccess={() => setEntregarT(null)} />
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



