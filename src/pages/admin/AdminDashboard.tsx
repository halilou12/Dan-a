import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Users,
  GraduationCap,
  Award,
  ShieldX,
  ShieldCheck,
  LogOut,
  KeyRound,
  RefreshCw,
  Image,
  Trash2,
  History,
  ClipboardList,
} from 'lucide-react';
import QrCode from '../../components/QrCode';
import {
  logout,
  changePassword,
  getAccount,
  getToken,
  otpauthURL,
  regenerate2fa,
  fetchTotpSecret,
} from '../../lib/auth';
import {
  listAdminUsers,
  addAdminUser,
  deleteAdminUser,
  deleteStudentOnServer,
  listActivity,
} from '../../lib/api';
import type { AdminUser, Activity } from '../../lib/api';
import {
  useStore,
  programById,
  enrollmentsOf,
  deleteStudent,
  reloadFromServer,
} from '../../lib/store';
import type { Student } from '../../lib/store';

const statusStyles: Record<string, string> = {
  active: 'bg-amber-100 text-amber-800',
  graduated: 'bg-green-100 text-green-800',
  withdrawn: 'bg-gray-100 text-gray-600',
  valid: 'bg-green-100 text-green-800',
  revoked: 'bg-red-100 text-red-800',
};

const activityLabel: Record<string, string> = {
  sign_in: 'Signed in',
  change_password: 'Changed password',
  password_reset: 'Reset password',
  regenerate_2fa: 'Regenerated 2FA secret',
  add_admin: 'Added team member',
  remove_admin: 'Removed team member',
  bootstrap_admin: 'Bootstrapped first admin',
  issue_certificate: 'Issued certificate',
  delete_student: 'Deleted student',
};

const formatActivity = (a: Activity) => {
  let label = activityLabel[a.action] ?? a.action;
  const detail = a.detail as { student?: string; program?: string } | null | undefined;
  if (a.action === 'issue_certificate' && detail?.student) {
    label += ` for ${detail.student} (${detail.program ?? ''})`;
  }
  return label;
};

const AdminDashboard = () => {
  const { students, certificates } = useStore();
  const navigate = useNavigate();
  const account = getAccount();

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMessage, setPwMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [show2fa, setShow2fa] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchTotpSecret().then((res) => {
      if (!alive || !res) return;
      setSecret(res.secret);
    });
    return () => {
      alive = false;
    };
  }, []);

  const doLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const doChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) {
      setPwMessage({ kind: 'error', text: 'New password and confirmation do not match.' });
      return;
    }
    const res = await changePassword(pw.current, pw.next);
    if (res.ok) {
      setPwMessage({ kind: 'success', text: 'Password updated. Use it next time you sign in.' });
      setPw({ current: '', next: '', confirm: '' });
    } else {
      setPwMessage({ kind: 'error', text: res.error ?? 'Could not change the password.' });
    }
  };

  const doRegenerate2fa = async () => {
    const next = await regenerate2fa();
    if (!next) return;
    setSecret(next.secret);
    setShow2fa(true);
  };

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdmin, setNewAdmin] = useState({ username: '', email: '', password: '', confirm: '' });
  const [teamMsg, setTeamMsg] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  const loadAdmins = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await listAdminUsers(token);
      setAdmins(res.users);
    } catch {
      setAdmins([]);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const doAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setTeamMsg(null);
    if (newAdmin.password.length < 8) {
      setTeamMsg({ kind: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    if (newAdmin.password !== newAdmin.confirm) {
      setTeamMsg({ kind: 'error', text: 'Password confirmation does not match.' });
      return;
    }
    try {
      await addAdminUser(token, {
        username: newAdmin.username.trim(),
        email: newAdmin.email.trim(),
        password: newAdmin.password,
      });
      setNewAdmin({ username: '', email: '', password: '', confirm: '' });
      setTeamMsg({ kind: 'success', text: 'Team member added.' });
      loadAdmins();
    } catch (err) {
      setTeamMsg({ kind: 'error', text: (err as Error).message });
    }
  };

  const doDeleteStudent = async (student: Student) => {
    const token = getToken();
    const confirmed = window.confirm(
      `Delete ${student.fullName} (${student.id})? This permanently removes their enrollments, assessments and certificates — their QR code will stop verifying.`,
    );
    if (!confirmed) return;
    deleteStudent(student.id);
    if (token) {
      try {
        await deleteStudentOnServer(token, student.id);
      } catch {
        // Local removal already applied; server record could not be deleted.
      }
    }
  };

  const doDeleteAdmin = async (id: number, name: string) => {
    const token = getToken();
    if (!token) return;
    if (!window.confirm(`Remove team member "${name}"? They will no longer be able to sign in.`)) return;
    try {
      await deleteAdminUser(token, id);
      setTeamMsg({ kind: 'success', text: 'Team member removed.' });
      loadAdmins();
      loadActivity();
    } catch (err) {
      setTeamMsg({ kind: 'error', text: (err as Error).message });
    }
  };

  const [activities, setActivities] = useState<Activity[]>([]);
  const [syncing, setSyncing] = useState(false);

  const loadActivity = async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await listActivity(token);
      setActivities(res.activities);
    } catch {
      setActivities([]);
    }
  };

  useEffect(() => {
    loadActivity();
    reloadFromServer();
  }, []);

  const doSync = async () => {
    setSyncing(true);
    try {
      await reloadFromServer();
      await loadActivity();
    } finally {
      setSyncing(false);
    }
  };

  const graduated = students.filter((s) => s.status === 'graduated').length;
  const validCerts = certificates.filter((c) => c.status === 'valid').length;
  const revokedCerts = certificates.length - validCerts;

  const stats = [
    { label: 'Total Students', value: students.length, icon: Users, accent: 'from-[var(--coffee-dark)] to-[var(--coffee-medium)]' },
    { label: 'Graduated', value: graduated, icon: GraduationCap, accent: 'from-green-700 to-green-600' },
    { label: 'Certificates Issued', value: certificates.length, icon: Award, accent: 'from-[var(--coffee-light)] to-[var(--coffee-accent)]' },
    { label: 'Certificates Revoked', value: revokedCerts, icon: ShieldX, accent: 'from-red-700 to-red-500' },
  ];

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-[var(--text-dark)] mb-2">Admin Portal</h1>
          <p className="text-[var(--text-medium)]">Register students, manage training records and issue certificates.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            to="/admin/register"
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--coffee-dark)] px-5 py-3 text-white font-semibold hover:bg-[var(--coffee-medium)] transition-colors"
          >
            <UserPlus className="h-4 w-4" /> Register New Student
          </Link>
          <Link
            to="/admin/daily-marks"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--coffee-accent)] px-5 py-3 text-[var(--coffee-dark)] font-semibold hover:bg-[var(--cream)] transition-colors"
          >
            <ClipboardList className="h-4 w-4" /> Daily Marks
          </Link>
          <Link
            to="/admin/gallery"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--coffee-accent)] px-5 py-3 text-[var(--coffee-dark)] font-semibold hover:bg-[var(--cream)] transition-colors"
          >
            <Image className="h-4 w-4" /> Manage Gallery
          </Link>
          <button
            onClick={doLogout}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--coffee-accent)] px-5 py-3 text-[var(--coffee-dark)] font-semibold hover:bg-[var(--cream)] transition-colors"
          >
            <LogOut className="h-4 w-4" /> Log out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-6 shadow-md border border-[var(--coffee-accent)]/20 card-hover">
            <div className={`w-11 h-11 bg-gradient-to-br ${s.accent} rounded-lg flex items-center justify-center mb-4`}>
              <s.icon className="h-5 w-5 text-white" />
            </div>
            <div className="text-3xl font-bold text-[var(--text-dark)]">{s.value}</div>
            <div className="text-sm text-[var(--text-light)]">{s.label}</div>
          </div>
        ))}
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[var(--text-dark)] mb-6 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-[var(--coffee-light)]" /> Account Security
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-md border border-[var(--coffee-accent)]/20">
            <h3 className="font-bold text-[var(--text-dark)] mb-4 flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-[var(--coffee-light)]" /> Change password
            </h3>
            <form onSubmit={doChangePassword} className="space-y-3">
              <input
                type="password"
                value={pw.current}
                onChange={(e) => setPw({ ...pw, current: e.target.value })}
                placeholder="Current password"
                autoComplete="current-password"
                className="w-full rounded-lg border border-[var(--coffee-accent)]/40 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coffee-accent)]"
              />
              <input
                type="password"
                value={pw.next}
                onChange={(e) => setPw({ ...pw, next: e.target.value })}
                placeholder="New password (min 8 characters)"
                autoComplete="new-password"
                className="w-full rounded-lg border border-[var(--coffee-accent)]/40 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coffee-accent)]"
              />
              <input
                type="password"
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                placeholder="Confirm new password"
                autoComplete="new-password"
                className="w-full rounded-lg border border-[var(--coffee-accent)]/40 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coffee-accent)]"
              />
              {pwMessage && (
                <p className={`text-sm rounded-lg px-4 py-2 border ${
                  pwMessage.kind === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {pwMessage.text}
                </p>
              )}
              <button type="submit" className="rounded-lg bg-[var(--coffee-dark)] px-5 py-2.5 text-white text-sm font-semibold hover:bg-[var(--coffee-medium)] transition-colors">
                Update password
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-md border border-[var(--coffee-accent)]/20">
            <h3 className="font-bold text-[var(--text-dark)] mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[var(--coffee-light)]" /> Two-factor authentication
            </h3>
            <p className="text-sm text-[var(--text-medium)] mb-3">
              Sign-in requires your password plus a 6-digit code. Scan the QR below with an authenticator app,
              or press regenerate to roll a fresh secret.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <QrCode value={otpauthURL(account?.username ?? 'admin', secret ?? '')} size={140} />
              <div className="text-sm space-y-1.5">
                <p><span className="text-[var(--text-light)]">Account:</span> {account?.username}</p>
                <p>
                  <span className="text-[var(--text-light)]">Status:</span>{' '}
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-300">ENROLLED</span>
                </p>
                <p className="break-all font-mono text-xs text-[var(--text-light)]">{secret}</p>
                <button
                  onClick={doRegenerate2fa}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--coffee-accent)] px-4 py-2 text-xs font-semibold text-[var(--coffee-dark)] hover:bg-[var(--cream)] transition-colors mt-1"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Regenerate 2FA secret
                </button>
                {show2fa && (
                  <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    New secret active. Rescan the QR with your authenticator app.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[var(--text-dark)] mb-6 flex items-center gap-2">
          <ShieldCheck className="h-6 w-6 text-[var(--coffee-light)]" /> Team Members
        </h2>
        <div className="bg-white rounded-xl p-6 shadow-md border border-[var(--coffee-accent)]/20">
          <p className="text-sm text-[var(--text-medium)] mb-5">
            Only the people listed here can sign in and manage the portal. Visitors stay read-only.
          </p>
          {teamMsg && (
            <p className={`text-sm rounded-lg px-4 py-2 mb-4 border ${
              teamMsg.kind === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {teamMsg.text}
            </p>
          )}
          <ul className="mb-6 divide-y divide-[var(--cream)]">
            {admins.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--text-dark)] truncate">
                    {u.username}
                    <span className="ml-2 text-xs font-bold text-[var(--coffee-light)] uppercase">{u.role}</span>
                  </p>
                  <p className="text-xs text-[var(--text-medium)] truncate">{u.email}</p>
                </div>
                <button
                  onClick={() => doDeleteAdmin(u.id, u.username)}
                  disabled={u.username === account?.username}
                  title={u.username === account?.username ? 'You cannot remove yourself' : 'Remove'}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Remove
                </button>
              </li>
            ))}
          </ul>
          <h3 className="font-bold text-[var(--text-dark)] mb-4 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[var(--coffee-light)]" /> Add a team member
          </h3>
          <form onSubmit={doAddAdmin} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={newAdmin.username}
                onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                placeholder="Username"
                autoComplete="off"
                required
                className="w-full rounded-lg border border-[var(--coffee-accent)]/40 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coffee-accent)]"
              />
              <input
                type="email"
                value={newAdmin.email}
                onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                placeholder="Email (for password recovery)"
                autoComplete="off"
                required
                className="w-full rounded-lg border border-[var(--coffee-accent)]/40 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coffee-accent)]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                placeholder="Password (min 8 characters)"
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-[var(--coffee-accent)]/40 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coffee-accent)]"
              />
              <input
                type="password"
                value={newAdmin.confirm}
                onChange={(e) => setNewAdmin({ ...newAdmin, confirm: e.target.value })}
                placeholder="Confirm password"
                autoComplete="new-password"
                required
                className="w-full rounded-lg border border-[var(--coffee-accent)]/40 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--coffee-accent)]"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--coffee-dark)] px-5 py-2.5 text-white text-sm font-semibold hover:bg-[var(--coffee-medium)] transition-colors"
            >
              <UserPlus className="h-4 w-4" /> Add team member
            </button>
          </form>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[var(--text-dark)] mb-2 flex items-center gap-2">
          <History className="h-6 w-6 text-[var(--coffee-light)]" /> Recent Activity
        </h2>
        <p className="text-sm text-[var(--text-medium)] mb-6">
          All administrators work on the same shared records — pull the latest changes from your teammates with
          Refresh, and any edit anyone makes is saved to the shared database automatically. Every action by a team
          member (sign-ins, password changes, certificates issued, students deleted, team changes) is recorded here so
          nothing happens unnoticed.
        </p>
        <div className="bg-white rounded-xl shadow-md border border-[var(--coffee-accent)]/20 overflow-hidden">
          <div className="p-3 border-b border-[var(--cream)] flex justify-end">
            <button
              onClick={doSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--coffee-accent)] px-3 py-1.5 text-xs font-semibold text-[var(--coffee-dark)] hover:bg-[var(--cream)] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing…' : 'Refresh'}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--cream)] text-left text-[var(--text-light)]">
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">User</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-[var(--text-light)]">
                      No activity recorded yet.
                    </td>
                  </tr>
                )}
                {activities.map((a) => (
                  <tr key={a.id} className="border-t border-[var(--cream)]">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-[var(--text-medium)]">
                      {new Date(a.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[var(--text-dark)]">
                      {a.username ?? 'System'}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-medium)]">{formatActivity(a)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-bold text-[var(--text-dark)] mb-6 flex items-center gap-2">
          <Users className="h-6 w-6 text-[var(--coffee-light)]" /> Students
        </h2>
        <div className="bg-white rounded-xl shadow-md border border-[var(--coffee-accent)]/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--cream)] text-left text-[var(--text-light)]">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Student ID</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Program</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Certificates</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {students.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[var(--text-light)]">
                      No students registered yet.
                    </td>
                  </tr>
                )}
                {students.map((s) => {
                  const certs = certificates.filter((c) => c.studentId === s.id);
                  const enrollment = enrollmentsOf(s.id)[0];
                  const program = enrollment ? programById(enrollment.programId) : undefined;
                  return (
                    <tr key={s.id} className="border-t border-[var(--cream)]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {s.photo && (
                            <img src={s.photo} alt={s.fullName} className="h-9 w-9 rounded-full object-cover" />
                          )}
                          <span className="font-semibold text-[var(--text-dark)]">{s.fullName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-medium)]">{s.id}</td>
                      <td className="px-4 py-3 text-[var(--text-medium)]">{s.phone}</td>
                      <td className="px-4 py-3 text-[var(--text-medium)]">
                        {program?.title ?? '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyles[s.status]}`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-[var(--text-medium)]">
                          {certs.length > 0 && <ShieldCheck className="h-4 w-4 text-green-600" />}
                          {certs.length}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <Link to={`/admin/students/${s.id}`} className="text-[var(--coffee-light)] font-semibold hover:underline mr-4">
                          View
                        </Link>
                        <button
                          onClick={() => doDeleteStudent(s)}
                          title="Delete student"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold text-[var(--text-dark)] mb-6 flex items-center gap-2">
          <Award className="h-6 w-6 text-[var(--coffee-light)]" /> Certificates
        </h2>
        <div className="bg-white rounded-xl shadow-md border border-[var(--coffee-accent)]/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--cream)] text-left text-[var(--text-light)]">
                  <th className="px-4 py-3 font-medium">Certificate ID</th>
                  <th className="px-4 py-3 font-medium">Holder</th>
                  <th className="px-4 py-3 font-medium">Program</th>
                  <th className="px-4 py-3 font-medium">Issued</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Verify Link</th>
                  <th className="px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {certificates.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-[var(--text-light)]">
                      No certificates issued yet.
                    </td>
                  </tr>
                )}
                {certificates.map((c) => {
                  const holder = students.find((s) => s.id === c.studentId);
                  return (
                    <tr key={c.id} className="border-t border-[var(--cream)]">
                      <td className="px-4 py-3 font-mono text-xs text-[var(--text-dark)]">{c.id}</td>
                      <td className="px-4 py-3 font-semibold text-[var(--text-dark)]">{holder?.fullName ?? c.studentId}</td>
                      <td className="px-4 py-3 text-[var(--text-medium)]">{programById(c.programId)?.title ?? c.programId}</td>
                      <td className="px-4 py-3 text-[var(--text-medium)]">{c.issueDate}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${statusStyles[c.status]}`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/verify/${c.token}`} className="font-mono text-xs text-[var(--coffee-light)] hover:underline">
                          /verify/{c.token}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/admin/students/${c.studentId}`} className="text-[var(--coffee-light)] font-semibold hover:underline">
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;