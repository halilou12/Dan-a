import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BadgeCheck,
  ShieldAlert,
  SearchX,
  Printer,
  GraduationCap,
  Phone,
  Mail,
  CalendarDays,
  Hash,
  FileCheck2,
} from 'lucide-react';
import {
  findCertificateByToken,
  findCertificateById,
  findStudent,
  programById,
  assessmentsOf,
} from '../../lib/store';
import CertificateDocument from '../../components/CertificateDocument';

const StatusPill = ({ tone, children }: { tone: 'green' | 'red' | 'amber'; children: React.ReactNode }) => {
  const styles = {
    green: 'bg-green-100 text-green-800 border-green-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    amber: 'bg-amber-100 text-amber-800 border-amber-300',
  } as const;
  return <span className={`inline-block px-3 py-1 rounded-full border text-sm font-bold ${styles[tone]}`}>{children}</span>;
};

const LookupForm = ({ onSearch, autoFocus }: { onSearch: (value: string) => void; autoFocus?: boolean }) => {
  const [value, setValue] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSearch(value.trim());
      }}
      className="flex flex-col sm:flex-row gap-3"
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter Certificate ID or token, e.g. KSB-CERT-2026-00001"
        autoFocus={autoFocus}
        className="flex-1 rounded-lg border border-[var(--coffee-accent)]/40 bg-white px-4 py-3 text-[var(--text-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--coffee-accent)]"
      />
      <button
        type="submit"
        className="rounded-lg bg-[var(--coffee-dark)] px-6 py-3 text-white font-semibold hover:bg-[var(--coffee-medium)] transition-colors"
      >
        Verify
      </button>
    </form>
  );
};

const VerifyCertificate = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const hasToken = Boolean(token && token.trim());
  const certificate = hasToken
    ? findCertificateByToken(token!) ?? findCertificateById(token!)
    : undefined;
  const isLoaded = hasToken;

  const search = (value: string) => navigate(`/verify/${encodeURIComponent(value)}`, { replace: true });

  if (!isLoaded) {
    return (
      <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-md border border-[var(--coffee-accent)]/20 p-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <img src="/images/KBS.jpeg" alt="KSB logo" className="h-12 w-12 rounded-full object-cover" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-dark)]">Certificate Verification</h1>
              <p className="text-sm text-[var(--text-light)]">The Kigali Specialist Barista · Official Verification</p>
            </div>
          </div>
          <p className="text-[var(--text-medium)] mb-6">
            Scan the QR code on any KSB certificate, or enter its Certificate ID below to confirm whether it is genuine.
          </p>
          <LookupForm onSearch={search} autoFocus />
          <p className="mt-6 text-xs text-[var(--text-light)]">
            This page loads only from the official KSB domain and displays public certificate data. Private student data is never shown.
          </p>
        </div>
      </div>
    );
  }

  if (!certificate) {
    return (
      <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-md border border-red-200 p-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <img src="/images/KBS.jpeg" alt="KSB logo" className="h-12 w-12 rounded-full object-cover" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-dark)]">Certificate Verification</h1>
              <p className="text-sm text-[var(--text-light)]">The Kigali Specialist Barista · Official Verification</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <StatusPill tone="amber">Not Found</StatusPill>
            <h2 className="text-xl font-bold text-[var(--text-dark)]">We could not match this certificate</h2>
          </div>
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <SearchX className="h-6 w-6 text-amber-600 shrink-0" />
            <p className="text-sm text-[var(--text-medium)]">
              No certificate matches the reference <span className="font-mono bg-amber-100 px-1.5 py-0.5 rounded">{token}</span>.
              It may be mistyped, or the document may not be an official KSB certificate. Please contact
              The Kigali Specialist Barista directly for confirmation.
            </p>
          </div>
          <LookupForm onSearch={search} />
        </div>
      </div>
    );
  }

  const student = findStudent(certificate.studentId);
  const program = programById(certificate.programId);
  const record = assessmentsOf(certificate.studentId, certificate.programId);

  if (certificate.status === 'revoked') {
    return (
      <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-md border border-red-200 p-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-6">
            <img src="/images/KBS.jpeg" alt="KSB logo" className="h-12 w-12 rounded-full object-cover" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--text-dark)]">Certificate Verification</h1>
              <p className="text-sm text-[var(--text-light)]">The Kigali Specialist Barista · Official Verification</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <StatusPill tone="red">INVALID · REVOKED</StatusPill>
            <h2 className="text-xl font-bold text-[var(--text-dark)]">This certificate is no longer valid</h2>
          </div>
          <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <ShieldAlert className="h-6 w-6 text-red-600 shrink-0" />
            <div className="text-sm text-[var(--text-medium)]">
              <p className="font-semibold text-red-800 mb-1">Certificate ID: {certificate.id}</p>
              {certificate.revokedDate && (
                <p className="mb-1">Revoked on: <span className="font-medium">{certificate.revokedDate}</span></p>
              )}
              {certificate.revokedReason && (
                <p className="mb-2">Reason: {certificate.revokedReason}</p>
              )}
              <p>This holder is not currently certified by The Kigali Specialist Barista for {program?.title}. Please contact KSB for further details.</p>
            </div>
          </div>
          <LookupForm onSearch={search} />
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-md border border-green-200 overflow-hidden animate-fade-in">
        <div className="bg-gradient-to-r from-[var(--coffee-dark)] to-[var(--coffee-medium)] px-6 sm:px-8 py-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-white">
            <img src="/images/KBS.jpeg" alt="KSB logo" className="h-11 w-11 rounded-full object-cover" />
            <div>
              <h1 className="text-lg sm:text-xl font-bold leading-tight">Certificate Verification</h1>
              <p className="text-xs text-gray-200">The Kigali Specialist Barista · Official</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-green-600 text-white rounded-full px-4 py-1.5">
            <BadgeCheck className="h-5 w-5" />
            <span className="text-sm font-bold">GENUINE</span>
          </div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="ksb-print-page">
            <CertificateDocument
              certId={certificate.id}
              fullName={student?.fullName ?? ''}
              programTitle={program?.title ?? ''}
              issueDate={certificate.issueDate}
              weeks={program?.weeks}
              photo={student?.photo}
              token={certificate.token}
              status="valid"
            />
          </div>

          <p className="text-xs uppercase tracking-wider text-[var(--text-light)] mb-1 mt-8">This is to certify that</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-dark)] mb-1">{student?.fullName}</h2>
          <p className="text-[var(--text-medium)] mb-6">
            has successfully completed the <span className="font-semibold text-[var(--coffee-dark)]">{program?.title}</span>
            {program ? ` (${program.weeks} weeks)` : ''} barista training programme.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="flex items-center gap-3 rounded-xl border border-[var(--coffee-accent)]/30 bg-[var(--cream-light)] p-4">
              <Hash className="h-6 w-6 text-[var(--coffee-light)]" />
              <div>
                <div className="text-xs text-[var(--text-light)]">Certificate ID</div>
                <div className="font-mono text-sm font-semibold text-[var(--text-dark)]">{certificate.id}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--coffee-accent)]/30 bg-[var(--cream-light)] p-4">
              <CalendarDays className="h-6 w-6 text-[var(--coffee-light)]" />
              <div>
                <div className="text-xs text-[var(--text-light)]">Issued</div>
                <div className="text-sm font-semibold text-[var(--text-dark)]">{certificate.issueDate}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-[var(--coffee-accent)]/30 bg-[var(--cream-light)] p-4">
              <FileCheck2 className="h-6 w-6 text-[var(--coffee-light)]" />
              <div>
                <div className="text-xs text-[var(--text-light)]">Status</div>
                <div className="text-sm font-semibold text-green-700">Valid · Verified</div>
              </div>
            </div>
          </div>

          {student?.photo && (
            <div className="flex items-center gap-4 mb-8">
              <img src={student.photo} alt={student.fullName} className="h-20 w-20 rounded-full object-cover border-4 border-[var(--coffee-accent)]/30" />
              <div>
                <div className="text-xs text-[var(--text-light)]">Certificate holder</div>
                <div className="font-semibold text-[var(--text-dark)]">{student.fullName}</div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-[var(--coffee-accent)]/30 overflow-hidden mb-8">
            <div className="bg-[var(--coffee-dark)] text-white px-4 py-3 flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              <h3 className="font-bold">Academic Record</h3>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--cream)] text-[var(--text-light)]">
                  <th className="text-left px-4 py-2 font-medium">Module</th>
                  <th className="text-left px-4 py-2 font-medium">Grade</th>
                  <th className="text-right px-4 py-2 font-medium">Score</th>
                  <th className="text-left px-4 py-2 font-medium">Assessed</th>
                  <th className="text-left px-4 py-2 font-medium">Assessor</th>
                </tr>
              </thead>
              <tbody>
                {program ? program.modules.map((m) => {
                  const a = record.find((x) => x.module === m);
                  return (
                    <tr key={m} className="border-t border-[var(--cream)]">
                      <td className="px-4 py-2 font-medium text-[var(--text-dark)]">{m}</td>
                      <td className="px-4 py-2">
                        {a ? (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                            a.grade === 'Competent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {a.grade}
                          </span>
                        ) : (
                          <span className="text-[var(--text-light)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right text-[var(--text-dark)]">{a ? `${a.score}/100` : '—'}</td>
                      <td className="px-4 py-2 text-[var(--text-medium)]">{a ? a.assessedDate : '—'}</td>
                      <td className="px-4 py-2 text-[var(--text-medium)]">{a ? a.assessor : '—'}</td>
                    </tr>
                  );
                }) : (
                  <tr className="border-t border-[var(--cream)]">
                    <td colSpan={5} className="px-4 py-2 text-[var(--text-light)]">—</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-900">
              <span className="font-bold">Verified genuine.</span> This certificate was issued by The Kigali Specialist
              Barista (KSB) and was confirmed online on {new Date().toLocaleDateString()}. Scanned copies should always
              be cross-checked by scanning the QR code.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--coffee-dark)] px-6 py-3 text-white font-semibold hover:bg-[var(--coffee-medium)] transition-colors"
            >
              <Printer className="h-4 w-4" /> Print verification
            </button>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--coffee-accent)] px-6 py-3 text-[var(--coffee-dark)] font-semibold hover:bg-[var(--cream)] transition-colors"
            >
              <Phone className="h-4 w-4" /> Contact KSB about this certificate
            </Link>
          </div>

          <div className="mt-8 pt-6 border-t border-[var(--cream)]">
            <p className="flex items-center gap-2 text-sm text-[var(--text-light)]">
              <Mail className="h-4 w-4" /> kigalispecialistbarista@gmail.com · +250 789 698 317 · KN 197 St, Kigali, Rwanda
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyCertificate;