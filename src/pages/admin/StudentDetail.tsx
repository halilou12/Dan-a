import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Award,
  GraduationCap,
  Plus,
  CheckCircle2,
  AlertCircle,
  ShieldX,
  ClipboardList,
  Printer,
} from 'lucide-react';
import QrCode from '../../components/QrCode';
import CertificateDocument from '../../components/CertificateDocument';
import {
  useStore,
  PROGRAMS,
  GRADES,
  ASSESSORS,
  programById,
  enrollmentsOf,
  assessmentsOf,
  certificatesOf,
  graduationProgress,
  verificationURL,
  enrollStudent,
  addAssessment,
  graduateStudent,
  issueCertificate,
  revokeCertificate,
} from '../../lib/store';
import type { Grade } from '../../lib/store';

const inputClass =
  'rounded-lg border border-[var(--coffee-accent)]/40 bg-white px-3 py-2 text-sm text-[var(--text-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--coffee-accent)]';

const messageClass = (kind: 'success' | 'error') =>
  `flex items-start gap-2 text-sm rounded-lg px-4 py-2.5 border ${
    kind === 'success'
      ? 'bg-green-50 border-green-200 text-green-800'
      : 'bg-red-50 border-red-200 text-red-800'
  }`;

interface Notice {
  kind: 'success' | 'error';
  text: string;
}

const CertificateCard = ({ certificate, fullName, programTitle, weeks }: { certificate: { id: string; token: string; issueDate: string; status: 'valid' | 'revoked'; revokedDate?: string; revokedReason?: string }; fullName: string; programTitle: string; weeks?: number }) => {
  const [showRevoke, setShowRevoke] = useState(false);
  const [reason, setReason] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);

  const doRevoke = () => {
    revokeCertificate(certificate.id, reason);
    setNotice({ kind: 'success', text: `Certificate ${certificate.id} revoked. The QR code now shows it as invalid.` });
  };

  return (
    <div className="rounded-xl border border-[var(--coffee-accent)]/30 bg-[var(--cream-light)] p-5 print-break-avoid">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Award className="h-8 w-8 text-[var(--coffee-light)]" />
          <div>
            <div className="font-bold text-[var(--text-dark)]">Certificate</div>
            <div className="font-mono text-xs text-[var(--text-medium)]">{certificate.id}</div>
          </div>
        </div>
        <span className={`inline-block self-start px-3 py-1 rounded-full text-xs font-bold border ${
          certificate.status === 'valid'
            ? 'bg-green-100 text-green-800 border-green-300'
            : 'bg-red-100 text-red-800 border-red-300'
        }`}>
          {certificate.status.toUpperCase()}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row gap-5">
        <div className="flex justify-center">
          <QrCode value={verificationURL(certificate.token)} size={150} />
        </div>
        <div className="flex-1 text-sm space-y-1.5">
          <p><span className="text-[var(--text-light)]">Token:</span> <span className="font-mono">{certificate.token}</span></p>
          <p><span className="text-[var(--text-light)]">Issue date:</span> {certificate.issueDate}</p>
          {certificate.revokedDate && (
            <p><span className="text-[var(--text-light)]">Revoked:</span> {certificate.revokedDate}</p>
          )}
          {certificate.revokedReason && (
            <p><span className="text-[var(--text-light)]">Reason:</span> {certificate.revokedReason}</p>
          )}
          <div className="pt-2 flex flex-wrap gap-2">
            <a
              href={`/verify/${certificate.token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-[var(--coffee-dark)] px-4 py-2 text-white text-xs font-semibold hover:bg-[var(--coffee-medium)] transition-colors"
            >
              Open verification page
            </a>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--coffee-accent)] px-4 py-2 text-xs font-semibold text-[var(--coffee-dark)] hover:bg-[var(--cream)] transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            {certificate.status === 'valid' && !showRevoke && (
              <button
                onClick={() => setShowRevoke(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 px-4 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors"
              >
                <ShieldX className="h-3.5 w-3.5" /> Revoke
              </button>
            )}
          </div>
          {showRevoke && (
            <div className="mt-3 space-y-2">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for revocation (optional)"
                className="w-full rounded-lg border border-red-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
                rows={2}
              />
              <div className="flex gap-2">
                <button onClick={doRevoke} className="rounded-lg bg-red-700 px-4 py-2 text-white text-xs font-semibold hover:bg-red-600 transition-colors">
                  Confirm revocation
                </button>
                <button onClick={() => setShowRevoke(false)} className="rounded-lg border border-[var(--coffee-accent)] px-4 py-2 text-xs font-semibold text-[var(--coffee-dark)] hover:bg-[var(--cream)] transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          )}
          {notice && <p className={messageClass(notice.kind)}>{notice.text}</p>}
        </div>
      </div>
      <p className="text-xs text-[var(--text-light)] mt-2">
        {verificationURL(certificate.token)}
      </p>

      {certificate.status === 'valid' && (
        <div className="mt-6 border-t border-[var(--coffee-accent)]/30 pt-6">
          <CertificateDocument
            certId={certificate.id}
            fullName={fullName}
            programTitle={programTitle}
            issueDate={certificate.issueDate}
            weeks={weeks}
            token={certificate.token}
            status="valid"
          />
        </div>
      )}
    </div>
  );
};

const ProgramCard = ({ studentId, programId }: { studentId: string; programId: string }) => {
  const data = useStore();
  const program = programById(programId)!;
  const assessments = assessmentsOf(studentId, programId);
  const progress = graduationProgress(studentId, programId);
  const student = data.students.find((s) => s.id === studentId)!;
  const certificates = certificatesOf(studentId).filter((c) => c.programId === programId);

  const remainingModules = program.modules.filter(
    (m) => !assessments.some((a) => a.module === m),
  );

  const [form, setForm] = useState({
    module: remainingModules[0] ?? program.modules[0],
    grade: 'Competent' as Grade,
    score: 80,
    assessor: ASSESSORS[0],
  });
  const [notice, setNotice] = useState<Notice | null>(null);

  const submitAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.module) {
      setNotice({ kind: 'error', text: 'Select the module being assessed.' });
      return;
    }
    addAssessment({ studentId, programId, module: form.module, grade: form.grade, score: form.score, assessor: form.assessor });
    setNotice({ kind: 'success', text: `${form.module} recorded for ${student.fullName}.` });
    const next = remainingModules.filter((m) => m !== form.module);
    setForm({ ...form, module: next[0] ?? '' });
  };

  const graduate = () => {
    const res = graduateStudent(studentId, programId);
    setNotice(
      res.ok
        ? { kind: 'success', text: `${student.fullName} marked as graduated. You can now issue the certificate.` }
        : { kind: 'error', text: res.error ?? 'Cannot graduate yet.' },
    );
  };

  const issue = () => {
    const cert = issueCertificate(studentId, programId);
    setNotice(
      cert
        ? { kind: 'success', text: `Certificate ${cert.id} issued. Scan the QR below to open the verification page.` }
        : { kind: 'error', text: 'Certificate already issued or student is not graduated.' },
    );
  };

  const markAllCompetent = () => {
    const remaining = remainingModules.filter((m) => m !== form.module);
    const toRecord = form.module && remainingModules.includes(form.module)
      ? [form.module, ...remaining]
      : remainingModules;
    if (toRecord.length === 0) {
      setNotice({ kind: 'success', text: 'All modules are already assessed.' });
      return;
    }
    toRecord.forEach((m) =>
      addAssessment({ studentId, programId, module: m, grade: 'Competent', score: form.score, assessor: form.assessor }),
    );
    setNotice({ kind: 'success', text: `Marked ${toRecord.length} remaining module(s) as Competent for ${student.fullName}.` });
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-[var(--coffee-accent)]/20 p-6">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-xl font-bold text-[var(--text-dark)]">{program.title}</h3>
          <p className="text-sm text-[var(--text-light)]">{program.weeks} weeks · {program.modules.length} modules</p>
        </div>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
          progress.ready && student.status === 'graduated'
            ? 'bg-green-100 text-green-800 border-green-300'
            : 'bg-amber-100 text-amber-800 border-amber-300'
        }`}>
          {student.status === 'graduated' ? 'GRADUATED' : `${progress.done}/${progress.total} assessed`}
        </span>
      </div>

      <div className="mb-5">
        <div className="flex flex-wrap gap-2 mb-2">
          {program.modules.map((m) => {
            const a = assessments.find((x) => x.module === m);
            return (
              <span key={m} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                !a
                  ? 'border-[var(--coffee-accent)]/40 bg-[var(--cream)] text-[var(--text-light)]'
                  : a.grade === 'Not yet competent'
                    ? 'border-red-300 bg-red-50 text-red-700'
                    : 'border-green-300 bg-green-50 text-green-800'
              }`}>
                {m}
                {a && a.grade !== 'Not yet competent' && <CheckCircle2 className="h-3.5 w-3.5" />}
              </span>
            );
          })}
        </div>
      </div>

      {progress.failed > 0 && (
        <p className="flex items-center gap-2 text-sm text-red-700 mb-4">
          <AlertCircle className="h-4 w-4" /> Reassessment required for modules marked Not yet competent.
        </p>
      )}

      <form onSubmit={submitAssessment} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-5 p-4 rounded-lg border border-dashed border-[var(--coffee-accent)]/50 bg-[var(--cream-light)]">
        <div>
          <label className="block text-xs font-semibold text-[var(--text-light)] mb-1">Module</label>
          <select value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} className={`${inputClass} w-full`}>
            {remainingModules.length > 0 ? (
              remainingModules.map((m) => <option key={m} value={m}>{m}</option>)
            ) : (
              <option value="">All modules assessed</option>
            )}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-light)] mb-1">Grade</label>
          <select value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value as Grade })} className={`${inputClass} w-full`}>
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-light)] mb-1">Score /100</label>
          <input type="number" min={0} max={100} value={form.score} onChange={(e) => setForm({ ...form, score: Number(e.target.value) })} className={`${inputClass} w-full`} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-[var(--text-light)] mb-1">Assessor</label>
          <select value={form.assessor} onChange={(e) => setForm({ ...form, assessor: e.target.value })} className={`${inputClass} w-full`}>
            {ASSESSORS.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="flex items-end">
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--coffee-dark)] px-4 py-2 text-white text-sm font-semibold hover:bg-[var(--coffee-medium)] transition-colors w-full justify-center">
            <Plus className="h-4 w-4" /> Record
          </button>
        </div>
      </form>

      {notice && <p className={messageClass(notice.kind)}>{notice.text}</p>}

      <div className="mt-4">
        <button
          onClick={markAllCompetent}
          disabled={remainingModules.length === 0 || student.status === 'graduated'}
          className="inline-flex items-center gap-2 rounded-lg bg-[var(--coffee-dark)] px-5 py-2.5 text-white text-sm font-semibold hover:bg-[var(--coffee-medium)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
        >
          <CheckCircle2 className="h-4 w-4" /> Mark all remaining ({remainingModules.length}) as Competent
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mt-4">
        <button
          onClick={graduate}
          disabled={!progress.ready || student.status === 'graduated'}
          className="inline-flex items-center gap-2 rounded-lg bg-green-700 px-5 py-2.5 text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <GraduationCap className="h-4 w-4" /> Graduate
        </button>
        {student.status === 'graduated' && certificates.length === 0 && (
          <button
            onClick={issue}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--coffee-accent)] px-5 py-2.5 text-[var(--text-dark)] text-sm font-semibold hover:bg-[var(--coffee-light)] transition-colors"
          >
            <Award className="h-4 w-4" /> Issue Certificate & Generate QR
          </button>
        )}
      </div>

      {certificates.map((c) => (
        <div key={c.id} className="mt-5">
          <CertificateCard
            certificate={c}
            fullName={student.fullName}
            programTitle={program.title}
            weeks={program.weeks}
          />
        </div>
      ))}
    </div>
  );
};

const StudentDetail = () => {
  const { studentId } = useParams();
  const data = useStore();
  const student = data.students.find((s) => s.id === studentId);

  const enrollments = student ? enrollmentsOf(student.id) : [];
  const enrolledIds = enrollments.map((e) => e.programId);
  const availablePrograms = PROGRAMS.filter((p) => !enrolledIds.includes(p.id));

  const [enrollChoice, setEnrollChoice] = useState(availablePrograms[0]?.id ?? '');
  const [enrollNotice, setEnrollNotice] = useState<Notice | null>(null);

  if (!student) {
    return (
      <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <p className="text-[var(--text-medium)] mb-4">No student found with ID {studentId}.</p>
        <Link to="/admin" className="text-[var(--coffee-light)] font-semibold hover:underline">Back to dashboard</Link>
      </div>
    );
  }

  const doEnroll = () => {
    if (!enrollChoice) {
      setEnrollNotice({ kind: 'error', text: 'Select a training program.' });
      return;
    }
    enrollStudent(student.id, enrollChoice);
    setEnrollNotice({ kind: 'success', text: `${student.fullName} enrolled in ${programById(enrollChoice)?.title}.` });
    const remaining = availablePrograms.filter((p) => p.id !== enrollChoice);
    setEnrollChoice(remaining[0]?.id ?? '');
  };

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      <Link to="/admin" className="inline-flex items-center gap-2 text-[var(--coffee-light)] font-semibold hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="bg-white rounded-2xl shadow-md border border-[var(--coffee-accent)]/20 p-6 sm:p-8 mb-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="shrink-0">
            <div className="h-28 w-28 rounded-2xl overflow-hidden border-4 border-[var(--coffee-accent)]/30 mx-auto sm:mx-0">
              {student.photo ? (
                <img src={student.photo} alt={student.fullName} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-[var(--cream)]" />
              )}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-[var(--text-dark)]">{student.fullName}</h1>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                student.status === 'graduated'
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : student.status === 'active'
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-gray-100 text-gray-600 border-gray-300'
              }`}>
                {student.status.toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-[var(--text-medium)]">
              <p><span className="text-[var(--text-light)]">Student ID:</span> <span className="font-mono font-semibold text-[var(--text-dark)]">{student.id}</span></p>
              <p><span className="text-[var(--text-light)]">National ID:</span> {student.nationalId}</p>
              <p><span className="text-[var(--text-light)]">Date of birth:</span> {student.dob}</p>
              <p><span className="text-[var(--text-light)]">Registered:</span> {student.createdAt}</p>
              <p><span className="text-[var(--text-light)]">Email:</span> {student.email}</p>
              <p><span className="text-[var(--text-light)]">Phone:</span> {student.phone}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-[var(--cream)]">
          <h2 className="text-lg font-bold text-[var(--text-dark)] mb-3 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-[var(--coffee-light)]" /> Training Programs
          </h2>

          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <select
              value={enrollChoice}
              onChange={(e) => setEnrollChoice(e.target.value)}
              className={`${inputClass} flex-1`}
            >
              {availablePrograms.length === 0 && <option value="">No more programs available</option>}
              {availablePrograms.map((p) => (
                <option key={p.id} value={p.id}>{p.title} · {p.weeks} weeks</option>
              ))}
            </select>
            <button
              onClick={doEnroll}
              disabled={availablePrograms.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--coffee-dark)] px-5 py-2 text-white text-sm font-semibold hover:bg-[var(--coffee-medium)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-4 w-4" /> Enroll
            </button>
          </div>
          {enrollNotice && <p className={messageClass(enrollNotice.kind)}>{enrollNotice.text}</p>}
        </div>
      </div>

      <div className="space-y-8">
        {enrollments.length === 0 && (
          <p className="text-[var(--text-light)]">No programs yet. Enroll {student.fullName} to start recording assessments.</p>
        )}
        {enrollments.map((e) => (
          <ProgramCard key={e.programId} studentId={student.id} programId={e.programId} />
        ))}
      </div>
    </div>
  );
};

export default StudentDetail;