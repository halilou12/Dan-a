import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  KeyRound as KeyRoundIcon,
} from 'lucide-react';
import QrCode from '../../components/QrCode';
import {
  useAuth,
  login,
  verify2fa,
  isPending2fa,
  getSetupSecret,
  getPending2faSecret,
  otpauthURL,
  currentTotpCode,
  otpSecondsLeft,
  requestPasswordReset,
  completePasswordReset,
} from '../../lib/auth';

type Mode = 'login' | 'forgot' | 'forgot-reset';

const inputClass =
  'mt-1 w-full rounded-lg border border-[var(--coffee-accent)]/40 bg-white px-4 py-2.5 text-[var(--text-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--coffee-accent)]';

const labelClass = 'block text-sm font-semibold text-[var(--text-dark)]';

const TfaStep = ({ onBack }: { onBack: () => void }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [liveCode, setLiveCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(30);
  const navigate = useNavigate();
  const liveSecret = getPending2faSecret();
  const setup = getSetupSecret();
  const secret = liveSecret ?? setup?.totpSecret ?? '';
  const account = liveSecret
    ? { username: 'admin', totpSecret: liveSecret }
    : setup;

  useEffect(() => {
    const run = () => {
      setSecondsLeft(otpSecondsLeft());
      if (secret) {
        currentTotpCode(secret)
          .then((value) => setLiveCode(value))
          .catch(() => setLiveCode(''));
      }
    };
    run();
    const interval = setInterval(run, 1000);
    return () => clearInterval(interval);
  }, [secret]);

  if (!account) return null;

  const otp = otpauthURL(account.username, account.totpSecret ?? '');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length !== 6) {
      setError('Enter the 6-digit verification code.');
      return;
    }
    const res = await verify2fa(code);
    if (res.ok) {
      navigate('/admin', { replace: true });
    } else {
      setError(res.error ?? 'Verification failed.');
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="flex items-start gap-4 bg-[var(--cream-light)] border border-[var(--coffee-accent)]/30 rounded-lg p-4">
        <QrCode value={otp} size={140} />
        <div className="text-sm text-[var(--text-medium)]">
          <p className="font-semibold text-[var(--text-dark)] mb-1">Two-factor authentication</p>
          <p className="mb-1">
            Scan this code with Google Authenticator or Authy, then enter the 6-digit code.
          </p>
          <p className="text-xs text-[var(--text-light)] break-all font-mono">{account.totpSecret}</p>
        </div>
      </div>

      <div className="bg-[var(--cream)] border border-[var(--coffee-accent)]/30 rounded-lg p-4 text-center">
        <p className="text-xs text-[var(--text-light)] mb-1">Authenticator app shows</p>
        <p className="text-3xl font-bold tracking-[0.3em] text-[var(--coffee-dark)]">{liveCode}</p>
        <p className="text-xs text-[var(--text-light)] mt-1">expires in {secondsLeft}s</p>
      </div>

      <div>
        <label className={labelClass}>6-digit verification code</label>
        <input
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          className={`${inputClass} text-center text-2xl tracking-[0.5em] font-bold`}
          placeholder="000000"
        />
      </div>

      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}

      <button
        type="submit"
        className="w-full rounded-lg bg-[var(--coffee-dark)] px-6 py-3 text-white font-semibold hover:bg-[var(--coffee-medium)] transition-colors"
      >
        Verify & sign in
      </button>
      <button
        type="button"
        onClick={onBack}
        className="w-full text-sm text-[var(--coffee-light)] font-semibold hover:underline"
      >
        Back to login
      </button>
    </form>
  );
};

const ForgotMode = ({ onReset }: { onReset: () => void }) => {
  const [email, setEmail] = useState('');
  const [devToken, setDevToken] = useState<string | null>(null);
  const [form, setForm] = useState({ token: '', email: '', password: '', confirm: '' });
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const request = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    const res = await requestPasswordReset(email);
    setBusy(false);
    if (!res.ok) {
      setMessage({ kind: 'error', text: res.error ?? 'Request failed.' });
      return;
    }
    setForm((f) => ({ ...f, email }));
    if (res.devToken) {
      setDevToken(res.devToken);
    }
    setMessage({
      kind: 'success',
      text: res.emailed
        ? 'We sent a password reset link to your email. Please check your inbox (and spam folder).'
        : res.devToken
          ? 'Password recovery link generated. Copy the code below and use it to set a new password.'
          : 'If that email has an admin account, a recovery link has been sent.',
    });
  };

  const reset = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (form.password !== form.confirm) {
      setMessage({ kind: 'error', text: 'Passwords do not match.' });
      return;
    }
    if (form.password.length < 8) {
      setMessage({ kind: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    setBusy(true);
    const res = await completePasswordReset({
      token: form.token,
      email: form.email,
      newPassword: form.password,
    });
    setBusy(false);
    if (res.ok) {
      setMessage({ kind: 'success', text: 'Password updated. Sign in with your new password.' });
      setTimeout(onReset, 1200);
    } else {
      setMessage({ kind: 'error', text: res.error ?? 'Reset failed.' });
    }
  };

  return (
    <div className="space-y-5">
      {devToken && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <p className="text-xs text-amber-800 mb-1 font-semibold">Your recovery code (copy it)</p>
          <p className="font-mono text-sm break-all text-amber-900">{devToken}</p>
          <p className="text-[11px] text-amber-700 mt-1">It expires in 30 minutes and can be used once.</p>
        </div>
      )}

      {!devToken ? (
        <form onSubmit={request} className="space-y-5">
          <div>
            <label className={labelClass}>Admin account email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className={inputClass}
              placeholder="admin@example.com"
            />
          </div>
          {message && (
            <p className={`text-sm rounded-lg px-4 py-2 border ${
              message.kind === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-[var(--coffee-dark)] px-6 py-3 text-white font-semibold hover:bg-[var(--coffee-medium)] transition-colors disabled:opacity-50"
          >
            {busy ? 'Sending…' : 'Send recovery link'}
          </button>
        </form>
      ) : (
        <form onSubmit={reset} className="space-y-4">
          <div>
            <label className={labelClass}>Recovery code</label>
            <input
              type="text"
              value={form.token}
              onChange={(e) => setForm({ ...form, token: e.target.value })}
              className={inputClass}
              placeholder="Paste the recovery code above"
            />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>New password</label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
              className={inputClass}
              placeholder="Min 8 characters"
            />
          </div>
          <div>
            <label className={labelClass}>Confirm new password</label>
            <input
              type="password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              autoComplete="new-password"
              className={inputClass}
            />
          </div>
          {message && (
            <p className={`text-sm rounded-lg px-4 py-2 border ${
              message.kind === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-[var(--coffee-dark)] px-6 py-3 text-white font-semibold hover:bg-[var(--coffee-medium)] transition-colors disabled:opacity-50"
          >
            {busy ? 'Resetting…' : 'Reset password'}
          </button>
          <button
            type="button"
            onClick={() => {
              setDevToken(null);
              setEmail('');
              setForm({ token: '', email: '', password: '', confirm: '' });
            }}
            className="w-full text-sm text-[var(--coffee-light)] font-semibold hover:underline"
          >
            Start again
          </button>
        </form>
      )}
    </div>
  );
};

const AdminLogin = () => {
  const authed = useAuth();
  const [mode, setMode] = useState<Mode>(() =>
    isPending2fa() ? 'login' : 'login',
  );
  const [step, setStep] = useState<'credentials' | '2fa'>(
    isPending2fa() ? '2fa' : 'credentials',
  );
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const modeTitle: Record<Mode, { title: string; sub: string }> = {
    login: { title: 'Admin Login', sub: 'Step 1 of 2 · Credentials' },
    forgot: { title: 'Recover Password', sub: 'Get back into your account' },
    'forgot-reset': { title: 'Reset Password', sub: 'Set a new password' },
  };

  if (authed) {
    return <Navigate to="/admin" replace />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Enter both username and password.');
      return;
    }
    const res = await login(username, password);
    if (res.ok && res.step === '2fa') {
      setStep('2fa');
      setError('');
      setPassword('');
    } else {
      setError(res.error ?? 'Login failed.');
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError('');
    setPassword('');
  };

  const iconFor = (): React.ReactNode => {
    if (mode === 'forgot' || mode === 'forgot-reset') return <Mail className="h-6 w-6 text-white" />;
    return <KeyRoundIcon className="h-6 w-6 text-white" />;
  };

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-md mx-auto">
      <Link to="/" className="inline-flex items-center gap-2 text-[var(--coffee-light)] font-semibold hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to site
      </Link>

      <div className="bg-white rounded-2xl shadow-md border border-[var(--coffee-accent)]/20 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[var(--coffee-dark)] rounded-lg flex items-center justify-center">
            {iconFor()}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-dark)]">{modeTitle[mode].title}</h1>
            <p className="text-sm text-[var(--text-light)]">{modeTitle[mode].sub}</p>
          </div>
        </div>

        {mode === 'login' && (
          <>
            {step === 'credentials' ? (
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <label className={labelClass}>Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className={inputClass}
                  />
                </div>

                {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>}

                <button
                  type="submit"
                  className="w-full rounded-lg bg-[var(--coffee-dark)] px-6 py-3 text-white font-semibold hover:bg-[var(--coffee-medium)] transition-colors"
                >
                  Continue to verification
                </button>
              </form>
            ) : (
              <TfaStep onBack={() => setStep('credentials')} />
            )}

            {step === 'credentials' && (
              <div className="mt-5 border-t border-[var(--cream)] pt-5 space-y-2.5 text-sm">
                <Link
                  to="#"
                  onClick={() => switchMode('forgot')}
                  className="block w-full text-center text-[var(--coffee-light)] font-semibold hover:underline"
                >
                  Forgot your password? Recover it
                </Link>
              </div>
            )}
          </>
        )}

        {mode === 'forgot' && (
          <>
            <ForgotMode onReset={() => switchMode('login')} />
            <div className="mt-5 text-center">
              <Link
                to="#"
                onClick={() => switchMode('login')}
                className="text-sm text-[var(--coffee-light)] font-semibold hover:underline"
              >
                Back to sign in
              </Link>
            </div>
          </>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-[var(--text-light)]">
          <ShieldCheck className="h-4 w-4" /> Two-step sign-in active · Sessions expire after 24 hours
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;