import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserPlus, Image as ImageIcon, Loader2 } from 'lucide-react';
import { registerStudent, reloadFromServer } from '../../lib/store';
import { registerStudentOnServer } from '../../lib/api';
import { getToken } from '../../lib/auth';

const inputClass =
  'mt-1 w-full rounded-lg border border-[var(--coffee-accent)]/40 bg-white px-4 py-2.5 text-[var(--text-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--coffee-accent)]';

const labelClass = 'block text-sm font-semibold text-[var(--text-dark)]';

const RegisterStudent = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '',
    nationalId: '',
    dob: '',
    email: '',
    phone: '',
  });
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    reloadFromServer();
  }, []);

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.nationalId.trim() || !form.dob || !form.email.trim() || !form.phone.trim()) {
      setError('All fields are required.');
      return;
    }
    setError('');
    setSaving(true);
    try {
      const student = registerStudent({ ...form, photo });
      // Persist the new student on the shared server so all team members can
      // see it. If the server save fails, surface the error instead of
      // silently losing the record on reload.
      const token = getToken();
      if (token) {
        try {
          await registerStudentOnServer(token, {
            id: student.id,
            fullName: student.fullName,
            nationalId: student.nationalId,
            dob: student.dob,
            email: student.email,
            phone: student.phone,
            photo: student.photo,
            status: student.status,
            createdAt: student.createdAt,
          });
        } catch (serverErr) {
          setError(`Registered locally, but could not save to the shared server: ${serverErr instanceof Error ? serverErr.message : 'error'}. The record will persist once the push retries.`);
          navigate(`/admin/students/${student.id}`);
          return;
        }
      }
      navigate(`/admin/students/${student.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to register student.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
      <Link to="/admin" className="inline-flex items-center gap-2 text-[var(--coffee-light)] font-semibold hover:underline mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="bg-white rounded-2xl shadow-md border border-[var(--coffee-accent)]/20 p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-[var(--coffee-dark)] rounded-lg flex items-center justify-center">
            <UserPlus className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-dark)]">Register New Student</h1>
            <p className="text-sm text-[var(--text-light)]">Create the student record before enrolling them in training.</p>
          </div>
        </div>

        <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className={labelClass}>Photo</label>
            <div className="mt-1 flex items-center gap-4">
              <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-dashed border-[var(--coffee-accent)]/50 flex items-center justify-center bg-[var(--cream)]">
                {photo ? (
                  <img src={photo} alt="Student" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-7 w-7 text-[var(--text-light)]" />
                )}
              </div>
              <label className="cursor-pointer rounded-lg border border-[var(--coffee-accent)] px-4 py-2 text-sm font-semibold text-[var(--coffee-dark)] hover:bg-[var(--cream)] transition-colors">
                Upload photo
                <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
              </label>
            </div>
          </div>

          <div>
            <label className={labelClass}>Full legal name</label>
            <input type="text" value={form.fullName} onChange={set('fullName')} className={inputClass} placeholder="e.g. Letitia Uwase" />
          </div>
          <div>
            <label className={labelClass}>National ID / Passport</label>
            <input type="text" value={form.nationalId} onChange={set('nationalId')} className={inputClass} placeholder="e.g. 1221/19/0745" />
          </div>
          <div>
            <label className={labelClass}>Date of birth</label>
            <input type="date" value={form.dob} onChange={set('dob')} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input type="tel" value={form.phone} onChange={set('phone')} className={inputClass} placeholder="+250 7xx xxx xxx" />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Email</label>
            <input type="email" value={form.email} onChange={set('email')} className={inputClass} placeholder="student@example.com" />
          </div>

          {error && (
            <p className="sm:col-span-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2">{error}</p>
          )}

          <div className="sm:col-span-2 flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--coffee-dark)] px-6 py-3 text-white font-semibold hover:bg-[var(--coffee-medium)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Register Student'}
            </button>
            <Link
              to="/admin"
              className="rounded-lg border border-[var(--coffee-accent)] px-6 py-3 text-[var(--coffee-dark)] font-semibold hover:bg-[var(--cream)] transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterStudent;