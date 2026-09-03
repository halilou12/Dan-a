import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { requireAuth } from './auth.js';
import db from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads', 'gallery');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safeName = file.originalname
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]/g, '-')
      .replace(/\s+/g, '-');
    const ext = path.extname(safeName) || '.jpg';
    const base = path.basename(safeName, ext).slice(0, 40) || 'image';
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPG, PNG, WEBP and GIF images are allowed.'));
  },
});

const router = Router();

// Upload a new gallery image (admin only).
router.post('/', requireAuth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file was provided.' });
  res.status(201).json({
    url: `/uploads/gallery/${req.file.filename}`,
    filename: req.file.filename,
  });
});

router.post('/upload-error', (_req, res) => {
  res.status(400).json({ error: 'Upload failed. Please check the file type and size.' });
});

// Delete a gallery image (admin only).
router.delete('/:filename', requireAuth, async (req, res) => {
  const filename = path.basename(req.params.filename);
  if (filename !== req.params.filename || filename.startsWith('.')) {
    return res.status(400).json({ error: 'Invalid filename.' });
  }
  const filePath = path.join(UPLOAD_DIR, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found.' });
  fs.unlinkSync(filePath);

  // Also remove the entry from app_meta so deleted images don't reappear
  try {
    const { rows } = await db.query('SELECT value FROM app_meta WHERE key = $1', ['gallery']);
    if (rows.length > 0) {
      const gallery = Array.isArray(rows[0].value) ? rows[0].value : [];
      const updated = gallery.filter((g) => {
        const src = g.src || '';
        return !src.endsWith(filename) && !src.includes(`/gallery/${filename}`);
      });
      await db.query(
        'INSERT INTO app_meta (key, value) VALUES ($1, $2::jsonb) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
        ['gallery', JSON.stringify(updated)],
      );
    }
  } catch (err) {
    console.error('Failed to update gallery metadata:', err);
  }

  res.json({ ok: true });
});

export { router as galleryRouter };
