import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Trash2, ImagePlus, Loader2 } from 'lucide-react';
import { useStore, addGalleryItem, removeGalleryItem } from '../../lib/store';
import { uploadGalleryImage, deleteGalleryImage } from '../../lib/api';
import { getToken } from '../../lib/auth';

const CATEGORIES = ['Training', 'Coffee', 'Beverages', 'Other'];

const AdminGallery = () => {
  const { gallery } = useStore();
  const navigate = useNavigate();
  const token = getToken();
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({ alt: '', category: CATEGORIES[0] });

  const handleFile = async (file: File) => {
    if (!token) {
      setNotice({ kind: 'error', text: 'You must be signed in to upload.' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      setNotice({ kind: 'error', text: 'Please choose an image file (JPG, PNG, WEBP, GIF).' });
      return;
    }
    setUploading(true);
    setNotice(null);
    try {
      const { url } = await uploadGalleryImage(token, file);
      const alt = form.alt.trim() || file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
      addGalleryItem({ alt, category: form.category, src: url });
      setForm({ alt: '', category: form.category });
      setNotice({ kind: 'success', text: `Uploaded "${alt}".` });
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Upload failed.' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const onRemove = async (id: number, src: string) => {
    if (!token) return;
    setDeleting(id);
    setNotice(null);
    const filename = src.split('/').pop() || '';
    try {
      if (src.startsWith('/uploads/')) {
        await deleteGalleryImage(token, filename);
      }
      removeGalleryItem(id);
      setNotice({ kind: 'success', text: 'Image removed.' });
    } catch (e) {
      setNotice({ kind: 'error', text: e instanceof Error ? e.message : 'Delete failed.' });
    } finally {
      setDeleting(null);
    }
  };

  const inputClass =
    'rounded-lg border border-[var(--coffee-accent)]/40 bg-white px-3 py-2 text-sm text-[var(--text-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--coffee-accent)]';

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <button
        onClick={() => navigate('/admin')}
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-[var(--coffee-dark)] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </button>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-dark)]">Gallery Manager</h1>
        <p className="text-[var(--text-medium)]">Add and remove photos shown on the public gallery page.</p>
      </div>

      <div className="mb-8 rounded-xl border border-[var(--coffee-accent)]/30 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-[var(--text-dark)]">
          <ImagePlus className="h-5 w-5 text-[var(--coffee-light)]" /> Add a photo
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-light)]">Caption / Title</label>
            <input
              type="text"
              value={form.alt}
              onChange={(e) => setForm({ ...form, alt: e.target.value })}
              placeholder="e.g. Latte Art"
              className={`${inputClass} w-full`}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-[var(--text-light)]">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={`${inputClass} w-full`}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-5">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--coffee-dark)] px-6 py-3 text-white text-sm font-semibold hover:bg-[var(--coffee-medium)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? 'Uploading...' : 'Choose image from device'}
          </button>
          <p className="mt-2 text-xs text-[var(--text-light)]">
            Works from your computer or phone. Max 12MB (JPG, PNG, WEBP, GIF).
          </p>
        </div>

        {notice && (
          <p className={`mt-4 flex items-start gap-2 text-sm rounded-lg border px-4 py-2.5 ${
            notice.kind === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {notice.text}
          </p>
        )}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-bold text-[var(--text-dark)]">
          Current photos ({gallery.length})
        </h2>
        {gallery.length === 0 ? (
          <p className="text-[var(--text-light)]">No photos yet. Add your first one above.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {gallery.map((photo) => (
              <div key={photo.id} className="group relative overflow-hidden rounded-xl border border-[var(--coffee-accent)]/20 bg-white shadow-sm">
                <div className="aspect-square overflow-hidden">
                  <img src={photo.src} alt={photo.alt} className="h-full w-full object-cover" />
                </div>
                <div className="p-3">
                  <div className="truncate text-sm font-semibold text-[var(--text-dark)]">{photo.alt}</div>
                  <div className="text-xs text-[var(--text-light)]">{photo.category}</div>
                </div>
                <button
                  onClick={() => onRemove(photo.id, photo.src)}
                  disabled={deleting === photo.id}
                  className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-xs font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-100"
                >
                  {deleting === photo.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminGallery;
