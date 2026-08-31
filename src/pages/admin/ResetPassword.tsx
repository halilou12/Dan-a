import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, KeyRound as KeyRoundIcon, CheckCircle2 } from 'lucide-react';
import { completePasswordReset } from '../../lib/auth';

const inputClass =
  'mt-1 w-full rounded-lg border border-[var(--coffee-accent)]/40 bg-white px-4 py-2.5 text-[var(--text-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--coffee-accent)]';
const labelClass = 'block text-sm font-semibold text-[var(--text-dark)]';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (!token) {
      setStatus({ kind: 'error', text: 'This reset link is invalid or has expired. Request a new one.' });
      return;
    }
    if (password !== confirm) {
      setStatus({ kind: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (password.length < 8) {
      setStatus({ kind: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setBusy(true);
    const res = await completePasswordReset({ token, email, newPassword: password });
    setBusy(false);
    if (res.ok) {
      setStatus({ kind: 'success', text: 'Password updated. You can now sign in with your new password.' });
      setPassword('');
      setConfirm('');
    } else {
      setStatus({ kind: 'error', text: res.error ?? 'Password reset failed.' });
    }
  };

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-md mx-auto">
      <Link to="/admin/login" className="inline-flex items-center gap-2 text-[var(--coffee-light)] font-semibold hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>

      <div className="bg-white rounded-2xl shadow-md border border-[var(--coffee-accent)]/20 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[var(--coffee-dark)] rounded-lg flex items-center justify-center">
            <KeyRoundIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-dark)]">Reset Password</h1>
            <p className="text-sm text-[var(--text-light)]">Set a new password for your account</p>
          </div>
        </div>

        {!token ? (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            This reset link is invalid or has expired. Please request a new one from the login page.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                className={inputClass}
                placeholder="your@email.com"
                required
              />
            </div>
            <div>
              <label className={labelClass}>New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                className={inputClass}
                placeholder="Min 8 characters"
                required
              />
            </div>
            <div>
              <label className={labelClass}>Confirm new password</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                className={inputClass}
                required
              />
            </div>

            {status && (
              <p className={`flex items-start gap-2 text-sm rounded-lg border px-4 py-2.5 ${
                status.kind === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`}>
                {status.kind === 'success' && <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />}
                {status.text}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[var(--coffee-dark)] px-6 py-3 text-white font-semibold hover:bg-[var(--coffee-medium)] transition-colors disabled:opacity-50"
            >
              {busy ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
