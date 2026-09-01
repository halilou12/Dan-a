import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, UserPlus, KeyRound, CheckCircle2 } from 'lucide-react';
import QrCode from '../../components/QrCode';
import {
  getBootstrapStatus,
  bootstrapAdmin,
} from '../../lib/api';
import { setSetupSecret, otpauthURL } from '../../lib/auth';

const inputClass =
  'mt-1 w-full rounded-lg border border-[var(--coffee-accent)]/40 bg-white px-4 py-2.5 text-[var(--text-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--coffee-accent)]';
const labelClass = 'block text-sm font-semibold text-[var(--text-dark)]';

const SetupAdmin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ username: string; totpSecret: string } | null>(null);

  useEffect(() => {
    let alive = true;
    getBootstrapStatus()
      .then((res) => {
        if (!alive) return;
        if (!res.canSetup) navigate('/admin/login', { replace: true });
        else setLoading(false);
      })
      .catch(() => {
        if (alive) {
          setError('Could not check setup status. Please try again.');
          setLoading(false);
        }
      });
    return () => {
      alive = false;
    };
  }, [navigate]);

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setBusy(true);
    const res = await bootstrapAdmin({
      username: form.username,
      email: form.email,
      password: form.password,
    });
    setBusy(false);
    if (!res.user?.totpSecret) {
      setError('Setup failed. Please try again.');
      return;
    }
    setSetupSecret({ username: res.user.username, totpSecret: res.user.totpSecret });
    setDone({ username: res.user.username, totpSecret: res.user.totpSecret });
  };

  if (loading) {
    return <div className="py-24 text-center text-[var(--text-light)]">Checking setup status…</div>;
  }

  const otp = done ? otpauthURL(done.username, done.totpSecret) : '';

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-md mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-[var(--coffee-light)] font-semibold hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to site
      </Link>

      <div className="bg-white rounded-2xl shadow-md border border-[var(--coffee-accent)]/20 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-[var(--coffee-dark)] rounded-lg flex items-center justify-center">
            {done ? <ShieldCheck className="h-6 w-6 text-white" /> : <UserPlus className="h-6 w-6 text-white" />}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-dark)]">
              {done ? 'Account Created' : 'Create First Admin'}
            </h1>
            <p className="text-sm text-[var(--text-light)]">
              {done ? 'Set up your authenticator app' : 'Set up the administrator account'}
            </p>
          </div>
        </div>

        {!done ? (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className={labelClass}>Username</label>
              <input type="text" value={form.username} onChange={set('username')} autoComplete="username" className={inputClass} placeholder="e.g. halilou" />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input type="email" value={form.email} onChange={set('email')} autoComplete="email" className={inputClass} placeholder="you@example.com" />
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" className={inputClass} placeholder="Min 8 characters" />
            </div>
            <div>
              <label className={labelClass}>Confirm password</label>
              <input type="password" value={form.confirm} onChange={set('confirm')} autoComplete="new-password" className={inputClass} />
            </div>

            {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-lg bg-[var(--coffee-dark)] px-6 py-3 text-white font-semibold hover:bg-[var(--coffee-medium)] transition-colors disabled:opacity-50"
            >
              {busy ? 'Creating…' : 'Create administrator account'}
            </button>
            <p className="text-xs text-[var(--text-light)] text-center">
              Only the first person to set this up can create this account. After this, you add team members from the dashboard.
            </p>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="flex items-start gap-4 bg-green-50 border border-green-200 rounded-lg p-4">
              <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div className="text-sm text-[var(--text-medium)]">
                <p className="font-semibold text-[var(--text-dark)] mb-1">Administrator account created</p>
                <p className="mb-1">Scan this code with Google Authenticator or Authy, then enter the 6-digit code when you sign in.</p>
                <p className="text-xs text-[var(--text-light)] break-all font-mono">{done.totpSecret}</p>
              </div>
            </div>
            <div className="flex justify-center bg-[var(--cream)] rounded-lg py-4">
              <div className="flex flex-col items-center gap-2">
                <QrCode value={otp} size={180} />
                <span className="text-xs text-[var(--text-light)]">{done.username}</span>
              </div>
            </div>
            <Link
              to="/admin/login"
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--coffee-dark)] px-6 py-3 text-white font-semibold hover:bg-[var(--coffee-medium)] transition-colors"
            >
              <KeyRound className="h-4 w-4" /> Continue to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SetupAdmin;
