import { useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useMyCourses } from '@/hooks/useMyCourses';
import { useSubjects } from '@/hooks/useSubjects';
import { useAcademicYears } from '@/hooks/useAcademicYears';
import { useGrades, downloadGradesCSV } from '@/hooks/useGrades';
import { avatarColor, getInitials } from '@/lib/materia-colors';
import { showApiError } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { Download, ArrowLeft, Users, ClipboardList, TrendingUp } from 'lucide-react';

function findName(list, id) {
  return list?.find((i) => i.id === id)?.name || '—';
}

const TIPO_LABEL = {
  tarea: 'Tarea', examen: 'Examen', proyecto: 'Proyecto', lectura: 'Lectura',
};

/* ── Score cell ── */
function ScoreCell({ submission, maxScore }) {
  if (!submission || submission.status === null) {
    return <span className="text-p-text-tertiary text-[13px]">—</span>;
  }
  if (submission.score === null) {
    return (
      <span className="inline-flex items-center gap-[4px] px-[8px] py-[2px] rounded-full text-[11.5px] font-medium bg-[oklch(92%_0.020_250)] dark:bg-[oklch(22%_0.020_250)] text-[oklch(35%_0.06_250)] dark:text-[oklch(72%_0.06_250)]">
        Entregada
      </span>
    );
  }
  const pct = maxScore ? (submission.score / maxScore) * 100 : 0;
  const { bg, color } =
    pct >= 70
      ? { bg: 'var(--p-s-100)', color: 'var(--p-s-700)' }
      : pct >= 50
      ? { bg: 'oklch(94% 0.04 72)', color: 'oklch(38% 0.10 72)' }
      : { bg: 'var(--p-d-100)', color: 'var(--p-d-700)' };

  return (
    <span
      className="inline-block px-[8px] py-[2px] rounded-full text-[12px] font-bold tabular-nums"
      style={{ background: bg, color }}
    >
      {submission.score}/{maxScore}
    </span>
  );
}

/* ── Stat card ── */
function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-p-bg-base border border-p-border rounded-[16px] px-[18px] py-[14px] flex items-center gap-[12px]">
      <div className="w-[36px] h-[36px] rounded-[10px] bg-p-bg-subtle flex items-center justify-center text-p-text-secondary shrink-0">
        <Icon size={16} />
      </div>
      <div>
        <div className="text-[22px] font-extrabold text-p-text-primary tracking-[-0.04em] leading-none mb-[3px] tabular-nums">
          {value}
        </div>
        <div className="text-[12px] text-p-text-secondary">{label}</div>
      </div>
    </div>
  );
}

export default function GradesPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { cursoId } = useParams();
  const [exporting, setExporting] = useState(false);

  const myCourses    = useMyCourses();
  const subjects     = useSubjects();
  const academicYears = useAcademicYears();
  const grades       = useGrades(cursoId);

  const stateCurso  = location.state?.curso ?? null;
  const curso       = stateCurso ?? (myCourses.data?.find((c) => c.id === cursoId) ?? null);
  const subjectName = curso
    ? findName(subjects.data, curso.subjectId)
    : (grades.data?.courseName || 'Curso');
  const yearName    = curso ? findName(academicYears.data, curso.academicYearId) : '';

  const tasks    = grades.data?.tasks    ?? [];
  const students = grades.data?.students ?? [];

  /* task averages */
  const taskAvgs = tasks.map((_, ti) => {
    const scores = students
      .map((s) => s.submissions[ti]?.score)
      .filter((sc) => sc !== null && sc !== undefined);
    if (!scores.length) return null;
    return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  });

  /* overall class average */
  const allScores = students.flatMap((s) =>
    s.submissions.filter((sub) => sub.score !== null && sub.score !== undefined).map((sub) => sub.score),
  );
  const classAvg = allScores.length
    ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 10) / 10
    : null;

  const handleExport = async () => {
    setExporting(true);
    try { await downloadGradesCSV(cursoId, subjectName); }
    catch (err) { showApiError(err); }
    finally { setExporting(false); }
  };

  /* ── Loading ── */
  if (grades.isLoading) {
    return (
      <div className="flex flex-col gap-4 max-w-full">
        <div className="h-7 bg-p-bg-subtle rounded-lg w-40 animate-pulse" />
        <div className="h-10 bg-p-bg-subtle rounded-xl w-72 animate-pulse" />
        <div className="grid gap-3 [grid-template-columns:repeat(3,1fr)]">
          {[1,2,3].map((i) => <div key={`skeleton-grade-${i}`} className="h-[72px] bg-p-bg-subtle rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-[320px] bg-p-bg-subtle rounded-2xl animate-pulse" />
      </div>
    );
  }

  /* ── Error ── */
  if (grades.error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
        <div className="text-[16px] font-semibold text-p-text-primary">No se pudo cargar el libro de calificaciones</div>
        <div className="text-[13.5px] text-p-text-secondary">Verifica que tienes acceso a este curso.</div>
        <button onClick={() => navigate(-1)} className="mt-2 text-[13px] text-p-accent underline bg-transparent border-none cursor-pointer font-sans">
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-[6px] text-[12.5px] text-p-text-secondary bg-transparent border-none cursor-pointer font-sans self-start hover:text-p-text-primary transition-colors"
      >
        <ArrowLeft size={14} /> Volver
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[22px] font-semibold text-p-text-primary tracking-[-0.03em] m-0 mb-[6px]">
            Calificaciones · {subjectName}
          </h1>
          <div className="flex items-center gap-2 flex-wrap text-[13px] text-p-text-secondary">
            {yearName && yearName !== '—' && (
              <>
                <span>{yearName}</span>
                <span className="w-[3px] h-[3px] rounded-full bg-p-text-tertiary shrink-0" />
              </>
            )}
            <span>{students.length} alumno{students.length !== 1 ? 's' : ''}</span>
            <span className="w-[3px] h-[3px] rounded-full bg-p-text-tertiary shrink-0" />
            <span>{tasks.length} tarea{tasks.length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        <button
          onClick={handleExport}
          disabled={exporting || !students.length || !tasks.length}
          className={cn(
            'inline-flex items-center gap-[6px] px-[14px] py-[8px] rounded-[10px] border text-[13px] font-semibold font-sans transition-all duration-[120ms]',
            exporting || !students.length || !tasks.length
              ? 'opacity-50 cursor-not-allowed bg-p-bg-base border-p-border text-p-text-secondary'
              : 'bg-p-bg-base border-p-border text-p-text-primary hover:bg-p-bg-subtle cursor-pointer',
          )}
        >
          <Download size={13} />
          {exporting ? 'Exportando…' : 'Exportar CSV'}
        </button>
      </div>

      {/* Stats */}
      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
        <StatCard icon={Users}         label="Alumnos inscritos" value={students.length} />
        <StatCard icon={ClipboardList} label="Tareas"            value={tasks.length}    />
        <StatCard icon={TrendingUp}    label="Promedio del grupo" value={classAvg !== null ? classAvg : '—'} />
      </div>

      {/* Empty: no tasks */}
      {tasks.length === 0 && (
        <div className="bg-p-bg-base border border-p-border rounded-2xl py-16 flex flex-col items-center gap-3 text-center">
          <ClipboardList size={36} className="text-p-text-tertiary" />
          <div className="text-[15px] font-semibold text-p-text-primary">Sin tareas</div>
          <div className="text-[13.5px] text-p-text-secondary">Crea al menos una tarea para ver el libro de calificaciones.</div>
        </div>
      )}

      {/* Empty: no students */}
      {tasks.length > 0 && students.length === 0 && (
        <div className="bg-p-bg-base border border-p-border rounded-2xl py-16 flex flex-col items-center gap-3 text-center">
          <Users size={36} className="text-p-text-tertiary" />
          <div className="text-[15px] font-semibold text-p-text-primary">Sin alumnos inscritos</div>
          <div className="text-[13.5px] text-p-text-secondary">Aún no hay alumnos inscritos en este curso.</div>
        </div>
      )}

      {/* Gradebook table */}
      {tasks.length > 0 && students.length > 0 && (
        <div className="bg-p-bg-base border border-p-border rounded-[24px] shadow-p-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table
              className="w-full border-collapse"
              style={{ minWidth: `${Math.max(560, 220 + tasks.length * 140)}px` }}
            >
              <thead>
                <tr className="border-b border-p-border bg-p-bg-subtle">
                  <th className="text-left px-5 py-[12px] text-[11.5px] font-bold text-p-text-tertiary uppercase tracking-[0.07em] min-w-[200px]">
                    Alumno
                  </th>
                  {tasks.map((task) => (
                    <th key={task.id} className="px-3 py-[10px] text-center min-w-[130px]">
                      <div className="text-[12px] font-semibold text-p-text-primary leading-tight truncate max-w-[120px] mx-auto" title={task.title}>
                        {task.title}
                      </div>
                      <div className="text-[11px] text-p-text-tertiary mt-[2px]">
                        {TIPO_LABEL[task.type] ?? 'Tarea'} · {task.maxScore} pts
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-[12px] text-center min-w-[100px] border-l border-p-border">
                    <div className="text-[11.5px] font-bold text-p-text-tertiary uppercase tracking-[0.07em]">Promedio</div>
                  </th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => {
                  const ini = getInitials(student.fullName || student.email);
                  const bg  = avatarColor(student.fullName || student.email);
                  return (
                    <tr key={student.memberId} className="border-b border-p-border last:border-0 hover:bg-p-bg-subtle transition-colors duration-75">
                      <td className="px-5 py-[11px]">
                        <div className="flex items-center gap-[10px]">
                          <div
                            className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                            style={{ background: bg }}
                          >
                            {ini}
                          </div>
                          <div className="min-w-0">
                            <div className="text-[13.5px] font-medium text-p-text-primary truncate max-w-[160px]">
                              {student.fullName || '—'}
                            </div>
                            <div className="text-[11.5px] text-p-text-tertiary truncate max-w-[160px]">
                              {student.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {tasks.map((task, ti) => (
                        <td key={task.id} className="px-3 py-[11px] text-center">
                          <ScoreCell submission={student.submissions[ti]} maxScore={task.maxScore} />
                        </td>
                      ))}

                      <td className="px-4 py-[11px] text-center border-l border-p-border">
                        {student.average !== null ? (
                          <span className="text-[13.5px] font-bold tabular-nums text-p-text-primary">
                            {student.average}
                          </span>
                        ) : (
                          <span className="text-p-text-tertiary text-[13px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* Class average row */}
                <tr className="border-t-2 border-p-border bg-p-bg-subtle">
                  <td className="px-5 py-[10px]">
                    <span className="text-[11.5px] font-bold text-p-text-secondary uppercase tracking-[0.06em]">
                      Promedio del grupo
                    </span>
                  </td>
                  {tasks.map((task, ti) => (
                    <td key={task.id} className="px-3 py-[10px] text-center">
                      {taskAvgs[ti] !== null ? (
                        <span className="text-[12.5px] font-bold text-p-text-secondary tabular-nums">
                          {taskAvgs[ti]}/{task.maxScore}
                        </span>
                      ) : (
                        <span className="text-p-text-tertiary text-[12px]">—</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-[10px] text-center border-l border-p-border">
                    <span className="text-[13.5px] font-extrabold text-p-text-primary tabular-nums">
                      {classAvg !== null ? classAvg : '—'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
