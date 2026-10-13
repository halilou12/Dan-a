import express from 'express';
import compression from 'compression';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { requireDb } from './db.js';
import { authRouter } from './auth.js';
import { galleryRouter } from './gallery.js';
import { verifyRouter } from './verify.js';
import { sessionsRouter } from './sessions.js';
import { getGalleryImage } from './storage.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Startup diagnostics — help confirm what the running build has access to.
if (process.env.DATABASE_URL) {
  try {
    const dbHost = new URL(process.env.DATABASE_URL).host;
    console.log(`[startup] DATABASE_URL is set (host: ${dbHost})`);
  } catch {
    console.log('[startup] DATABASE_URL is set (could not parse host)');
  }
} else {
  console.warn(
    '[startup] DATABASE_URL is NOT set — DB calls will fall back to localhost and fail in production.',
  );
}

app.use(compression());
// Netlify caps request bodies at ~6MB (base64 adds ~30%, so ~4.5MB binary).
// Keep the JSON limit in line with that ceiling.
app.use(express.json({ limit: '6mb' }));

// Serve admin-uploaded gallery images (Netlify Blobs in production, disk
// locally). Falls through to the static handler below when not found.
app.get('/uploads/gallery/:filename', async (req, res, next) => {
  try {
    const image = await getGalleryImage(req.params.filename);
    if (!image) return res.status(404).end();
    res.setHeader('Content-Type', image.contentType);
    res.setHeader('Cache-Control', 'public, max-age=604800, immutable');
    res.end(image.buffer);
  } catch (err) {
    next(err);
  }
});

// Local development: serve any other uploaded files straight from disk. On
// Netlify this directory isn't part of the function bundle, so skip it.
if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
  const uploadDir = path.join(__dirname, '..', 'uploads');
  if (fs.existsSync(uploadDir)) {
    app.use('/uploads', express.static(uploadDir, { maxAge: '7d' }));
  }
}

app.use('/api/admin', requireDb, authRouter);
app.use('/api/gallery', requireDb, galleryRouter);
app.use('/api', requireDb, sessionsRouter);
app.use('/api', verifyRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'ksb-admin-api' });
});

// Central error handler for API routes (bad JSON, oversized bodies, etc.).
app.use('/api', (err, _req, res, _next) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'Image is too large. Maximum size is 4MB.' });
  }
  console.error('API error:', err);
  res.status(err?.status || 500).json({ error: err?.message || 'Something went wrong.' });
});

// Serve the built frontend when it exists (local production preview). On
// Netlify the static site is served by the CDN, not this function.
const distDir = path.join(__dirname, '..', 'dist');
const indexHtml = path.join(distDir, 'index.html');

if (fs.existsSync(distDir)) {
  app.use(
    '/assets',
    express.static(path.join(distDir, 'assets'), { immutable: true, maxAge: '1y' }),
  );
  app.use(
    express.static(distDir, {
      maxAge: '7d',
      setHeaders(res, filePath) {
        if (filePath.endsWith('.html')) res.setHeader('Cache-Control', 'no-cache');
      },
    }),
  );
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

export { app };
export default app;
