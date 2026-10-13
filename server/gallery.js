import { Router } from 'express';
import path from 'node:path';
import { requireAuth } from './auth.js';
import db from './db.js';
import { putGalleryImage, deleteGalleryImage } from './storage.js';

const router = Router();

const MAX_BYTES = 4 * 1024 * 1024;
const EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

// Build a safe, unique filename from the uploaded image's original name.
const buildFilename = (originalName, contentType) => {
  const ext = EXTENSIONS[contentType] || '.jpg';
  const base =
    path
      .basename(String(originalName || 'image').replace(/\.[^.]+$/, ''))
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]/g, '-')
      .replace(/\s+/g, '-')
      .slice(0, 40) || 'image';
  return `${Date.now()}-${base}${ext}`;
};

// Upload a new gallery image (admin only). The client sends the image as a
// base64 data URL so the request is plain JSON — Netlify Functions cannot
// parse multipart/form-data reliably and cap bodies at ~4.5MB binary.
router.post('/', requireAuth, async (req, res) => {
  const { filename, contentType, data } = req.body || {};
  const type = String(contentType || '').toLowerCase();
  if (!EXTENSIONS[type]) {
    return res.status(400).json({ error: 'Only JPG, PNG, WEBP and GIF images are allowed.' });
  }
  if (!data || typeof data !== 'string') {
    return res.status(400).json({ error: 'No image file was provided.' });
  }

  let buffer;
  try {
    buffer = Buffer.from(data, 'base64');
  } catch {
    return res.status(400).json({ error: 'Invalid image data.' });
  }
  if (buffer.length === 0) {
    return res.status(400).json({ error: 'No image file was provided.' });
  }
  if (buffer.length > MAX_BYTES) {
    return res.status(413).json({ error: 'Image is too large. Maximum size is 4MB.' });
  }

  try {
    const safeName = buildFilename(filename, type);
    const url = await putGalleryImage(safeName, buffer, type);
    res.status(201).json({ url, filename: safeName });
  } catch (err) {
    console.error('gallery upload error:', err);
    res.status(500).json({ error: 'Upload failed. Please try again.' });
  }
});

// Delete a gallery image (admin only).
router.delete('/:filename', requireAuth, async (req, res) => {
  const filename = path.basename(req.params.filename);
  if (filename !== req.params.filename || filename.startsWith('.')) {
    return res.status(400).json({ error: 'Invalid filename.' });
  }

  try {
    await deleteGalleryImage(filename);
  } catch (err) {
    console.error('gallery delete error:', err);
  }

  // Also remove the entry from app_meta so deleted images don't reappear.
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
