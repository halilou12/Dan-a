import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { authRouter } from './auth.js';
import { galleryRouter } from './gallery.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json({ limit: '5mb' }));

app.use(express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/admin', authRouter);
app.use('/api/gallery', galleryRouter);

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
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`KSB admin API listening on http://localhost:${PORT}`);
});
