import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { requireDb } from './db.js';
import { authRouter } from './auth.js';
import { galleryRouter } from './gallery.js';
import { verifyRouter } from './verify.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json({ limit: '5mb' }));

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/admin', requireDb, authRouter);
app.use('/api/gallery', requireDb, galleryRouter);
app.use('/api', verifyRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'ksb-admin-api' });
});

// Central error handler for API routes (multer/file-size/type errors).
app.use('/api', (err, _req, res, _next) => {
  const message =
    err instanceof multer.MulterError
      ? err.code === 'LIMIT_FILE_SIZE'
        ? 'Image is too large. Maximum size is 12MB.'
        : `Upload error: ${err.message}`
      : err.message || 'Unexpected upload error.';
  res.status(400).json({ error: message });
});

// Serve the built frontend when it exists (production).
const distDir = path.join(__dirname, '..', 'dist');
const indexHtml = path.join(distDir, 'index.html');

if (fs.existsSync(distDir)) {
  // Serve assets (JS/CSS/images) and index.html for any non-API route so
  // client-side routing (e.g. /admin/login, /verify/:token) always works.
  app.use(express.static(distDir));
  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    if (!fs.existsSync(indexHtml)) {
      return res
        .status(200)
        .send(
          '<!doctype html><html><head><meta charset="utf-8"><title>The Kigali Specialist Barista</title></head><body><h1>The Kigali Specialist Barista</h1><p>Loading…</p></body></html>',
        );
    }
    res.sendFile(indexHtml);
  });
} else {
  console.warn('No dist/ directory found. Frontend route serving is disabled.');
}

app.listen(PORT, () => {
  console.log(`KSB admin API listening on http://localhost:${PORT}`);
});
