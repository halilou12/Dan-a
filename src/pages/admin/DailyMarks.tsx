import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
  Plus,
  Trash2,
  Loader2,
  BookOpen,
  Wrench,
} from 'lucide-react';
import { useStore, enrollmentsOf, programById, enrollStudent, PROGRAMS } from '../../lib/store';
import {
  getToken,
} from '../../lib/auth';
import {
  fetchSessions,
  createSession,
  deleteSession,
} from '../../lib/api';
import type { TrainingSession } from '../../lib/api';

const inputClass =
  'rounded-lg border border-[var(--coffee-accent)]/40 bg-white px-3 py-2 text-sm text-[var(--text-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--coffee-accent)]';

const labelClass = 'block text-xs font-semibold text-[var(--text-light)] mb-1';

const workTypeLabels: Record<string, string> = {
  theory: 'Theory',
  practical: 'Practical',
  both: 'Theory + Practical',
};

const workTypeColors: Record<string, string> = {
  theory: 'bg-blue-100 text-blue-800 border-blue-300',
  practical: 'bg-amber-100 text-amber-800 border-amber-300',
  both: 'bg-purple-100 text-purple-800 border-purple-300',
};

const DailyMarks = () => {
  const { students, assessments } = useStore();
  const navigate = useNavigate();
  const token = getToken();

  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [workType, setWorkType] = useState<'theory' | 'practical' | 'both'>('theory');
  const [score, setScore] = useState(50);
  const [notes, setNotes] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const studentEnrollments = selectedStudent ? enrollmentsOf(selectedStudent) : [];
  const enrolledProgramIds = studentEnrollments.map((e) => e.programId);
  const selectedProg = selectedProgram ? programById(selectedProgram) : undefined;
  const modules = selectedProg?.modules ?? [];
  // Programs the student is not enrolled in yet — choosing one from the list
  // will auto-enroll the student so their modules become available for marks.
  const availablePrograms = PROGRAMS.filter((p) => !enrolledProgramIds.includes(p.id));

  // When student changes, auto-select first enrolled program
  useEffect(() => {
    if (enrolledProgramIds.length > 0 && !enrolledProgramIds.includes(selectedProgram)) {
      setSelectedProgram(enrolledProgramIds[0]);
    }
  }, [selectedStudent]);

  const handleProgramChange = (programId: string) => {
    setSelectedProgram(programId);
    setSelectedModule('');
    if (programId && !enrolledProgramIds.includes(programId)) {
      enrollStudent(selectedStudent, programId);
      setNotice({ kind: 'success', text: `${student?.fullName ?? 'Student'} enrolled in ${programById(programId)?.title ?? 'program'}. You can now record daily marks.` });
    }
  };

  // Load sessions when student + program selected
  useEffect(() => {
    if (!token || !selectedStudent || !selectedProgram) {
      setSessions([]);
      return;
    }
    setLoading(true);
    fetchSessions(token, { studentId: selectedStudent, programId: selectedProgram })
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, [token, selectedStudent, selectedProgram]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedStudent || !selectedProgram || !selectedModule) return;
    setSubmitting(true);
    setNotice(null);
    try {
      const session = await createSession(token, {
        studentId: selectedStudent,
        programId: selectedProgram,
        module: selectedModule,
        sessionDate,
        workType,
        score,
        notes: notes.trim() || undefined,
        assessor: undefined,
      });
      setSessions((prev) => [session, ...prev]);
      setScore(50);
      setNotes('');
      setNotice({ kind: 'success', text: 'Training session recorded.' });
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Failed to record.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!token) return;
    try {
      await deleteSession(token, id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      setNotice({ kind: 'success', text: 'Session deleted.' });
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Delete failed.' });
    }
  };

  // Compute per-module summary from sessions
  const moduleSummary = modules.map((m) => {
    const moduleSessions = sessions.filter((s) => s.module === m);
    const theoryCount = moduleSessions.filter((s) => s.work_type === 'theory' || s.work_type === 'both').length;
    const practicalCount = moduleSessions.filter((s) => s.work_type === 'practical' || s.work_type === 'both').length;
    const avgScore = moduleSessions.length > 0
      ? Math.round(moduleSessions.reduce((sum, s) => sum + s.score, 0) / moduleSessions.length)
      : 0;
    const existingAssessment = assessments.find((a) => a.studentId === selectedStudent && a.programId === selectedProgram && a.module === m);
    return { module: m, theoryCount, practicalCount, totalSessions: moduleSessions.length, avgScore, assessed: !!existingAssessment };
  });

  const student = students.find((s) => s.id === selectedStudent);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <button
        onClick={() => navigate('/admin')}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--coffee-dark)] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-dark)] flex items-center gap-2">
          <ClipboardList className="h-7 w-7 text-[var(--coffee-light)]" /> Daily Marks
        </h1>
        <p className="text-[var(--text-medium)]">
          Record theory and practical work for each student day by day. At the end, review per-module summary.
        </p>
      </div>

      {/* Notice */}
      {notice && (
        <p className={`mb-6 flex items-start gap-2 text-sm rounded-lg border px-4 py-2.5 ${
          notice.kind === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {notice.text}
        </p>
      )}

      {/* Student & Program Selection */}
      <div className="mb-8 rounded-xl border border-[var(--coffee-accent)]/30 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-bold text-[var(--text-dark)]">Select Student & Program</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Student</label>
            <select
              value={selectedStudent}
              onChange={(e) => { setSelectedStudent(e.target.value); setSelectedProgram(''); setSelectedModule(''); }}
              className={`${inputClass} w-full`}
            >
              <option value="">— Choose student —</option>
              {students.filter((s) => s.status === 'active').map((s) => (
                <option key={s.id} value={s.id}>{s.fullName} ({s.id})</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Program</label>
            <select
              value={selectedProgram}
              onChange={(e) => handleProgramChange(e.target.value)}
              className={`${inputClass} w-full`}
              disabled={!selectedStudent}
            >
              <option value="">— Choose program —</option>
              {PROGRAMS.map((prog) => <option key={prog.id} value={prog.id}>{prog.title}</option>)}
            </select>
            {selectedStudent && availablePrograms.length > 0 && (
              <p className="mt-1 text-xs text-[var(--coffee-light)]">
                Not enrolled yet — choosing a program below will enroll {student?.fullName?.split(' ')[0]} in it so their modules appear.
              </p>
            )}
          </div>
        </div>
      </div>

      {selectedStudent && selectedProgram && (
        <>
          {/* Record Session Form */}
          <div className="mb-8 rounded-xl border border-[var(--coffee-accent)]/30 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--text-dark)]">
              <Plus className="h-5 w-5 text-[var(--coffee-light)]" /> Record Session — {student?.fullName}
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>Date</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className={`${inputClass} w-full`}
                  required
                />
              </div>
              <div>
                <label className={labelClass}>Module</label>
                <select
                  value={selectedModule}
                  onChange={(e) => setSelectedModule(e.target.value)}
                  className={`${inputClass} w-full`}
                  required
                >
                  <option value="">— Choose module —</option>
                  {modules.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Work Type</label>
                <div className="flex gap-2 mt-1">
                  {(['theory', 'practical', 'both'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setWorkType(t)}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                        workType === t
                          ? workTypeColors[t]
                          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {t === 'theory' && <BookOpen className="h-3.5 w-3.5" />}
                      {t === 'practical' && <Wrench className="h-3.5 w-3.5" />}
                      {t === 'both' && <><BookOpen className="h-3.5 w-3.5" />+<Wrench className="h-3.5 w-3.5" /></>}
                      {workTypeLabels[t]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Score /100</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className={`${inputClass} w-full`}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Notes (optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Reviewed espresso extraction techniques"
                  className={`${inputClass} w-full`}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={submitting || !selectedModule}
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--coffee-dark)] px-5 py-2.5 text-white text-sm font-semibold hover:bg-[var(--coffee-medium)] transition-colors disabled:opacity-50 w-full justify-center"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {submitting ? 'Saving...' : 'Record Session'}
                </button>
              </div>
            </form>
          </div>

          {/* Session History */}
          <div className="mb-8 rounded-xl border border-[var(--coffee-accent)]/30 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[var(--text-dark)]">
              Session History ({sessions.length})
            </h2>
            {loading ? (
              <p className="text-sm text-[var(--text-light)] flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading sessions...
              </p>
            ) : sessions.length === 0 ? (
              <p className="text-sm text-[var(--text-light)]">No sessions recorded yet for this student/program.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[var(--cream)] text-left text-[var(--text-light)]">
                      <th className="pb-2 pr-4 font-medium">Date</th>
                      <th className="pb-2 pr-4 font-medium">Module</th>
                      <th className="pb-2 pr-4 font-medium">Type</th>
                      <th className="pb-2 pr-4 font-medium">Score</th>
                      <th className="pb-2 pr-4 font-medium">Notes</th>
                      <th className="pb-2 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr key={s.id} className="border-b border-[var(--cream)] last:border-0">
                        <td className="py-2.5 pr-4 text-[var(--text-medium)]">{s.session_date}</td>
                        <td className="py-2.5 pr-4 font-semibold text-[var(--text-dark)]">{s.module}</td>
                        <td className="py-2.5 pr-4">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${workTypeColors[s.work_type]}`}>
                            {workTypeLabels[s.work_type]}
                          </span>
                        </td>
                        <td className="py-2.5 pr-4 font-mono text-[var(--text-dark)]">{s.score}</td>
                        <td className="py-2.5 pr-4 text-[var(--text-light)] max-w-[200px] truncate">{s.notes || '—'}</td>
                        <td className="py-2.5">
                          <button
                            onClick={() => handleDelete(s.id)}
                            title="Delete session"
                            className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Module Summary */}
          <div className="rounded-xl border border-[var(--coffee-accent)]/30 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-[var(--text-dark)]">
              Module Summary
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--cream)] text-left text-[var(--text-light)]">
                    <th className="pb-2 pr-4 font-medium">Module</th>
                    <th className="pb-2 pr-4 font-medium text-center">Theory Sessions</th>
                    <th className="pb-2 pr-4 font-medium text-center">Practical Sessions</th>
                    <th className="pb-2 pr-4 font-medium text-center">Total</th>
                    <th className="pb-2 pr-4 font-medium text-center">Avg Score</th>
                    <th className="pb-2 font-medium text-center">Assessment</th>
                  </tr>
                </thead>
                <tbody>
                  {moduleSummary.map((ms) => (
                    <tr key={ms.module} className="border-b border-[var(--cream)] last:border-0">
                      <td className="py-2.5 pr-4 font-semibold text-[var(--text-dark)]">{ms.module}</td>
                      <td className="py-2.5 pr-4 text-center text-[var(--text-medium)]">{ms.theoryCount}</td>
                      <td className="py-2.5 pr-4 text-center text-[var(--text-medium)]">{ms.practicalCount}</td>
                      <td className="py-2.5 pr-4 text-center font-semibold text-[var(--text-dark)]">{ms.totalSessions}</td>
                      <td className="py-2.5 pr-4 text-center font-mono text-[var(--text-dark)]">
                        {ms.totalSessions > 0 ? ms.avgScore : '—'}
                      </td>
                      <td className="py-2.5 text-center">
                        {ms.assessed ? (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-300">
                            Assessed
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                            Pending
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!selectedStudent && (
        <div className="text-center py-12 text-[var(--text-light)]">
          <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Select a student above to start recording daily marks.</p>
        </div>
      )}
    </div>
  );
};

export default DailyMarks;
