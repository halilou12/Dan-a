import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DISK_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', 'uploads', 'gallery');

// Netlify Functions run on AWS Lambda; uploads written to the local disk are
// discarded between invocations, so production stores gallery images in
// Netlify Blobs. Local development (`node server/index.js`) keeps using disk.
const USE_BLOBS = Boolean(
  process.env.NETLIFY === 'true' ||
    process.env.NETLIFY_BLOBS_CONTEXT ||
    process.env.AWS_LAMBDA_FUNCTION_NAME,
);

const CONTENT_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

const contentTypeFor = (filename) =>
  CONTENT_TYPES[path.extname(filename).toLowerCase()] || 'application/octet-stream';

let storePromise;
async function galleryStore() {
  if (!storePromise) {
    storePromise = import('@netlify/blobs').then(({ getStore }) => getStore('gallery'));
  }
  return storePromise;
}

export async function putGalleryImage(filename, buffer, contentType) {
  if (USE_BLOBS) {
    const store = await galleryStore();
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    );
    await store.set(filename, arrayBuffer, { metadata: { contentType } });
    return `/uploads/gallery/${filename}`;
  }
  fs.mkdirSync(DISK_DIR, { recursive: true });
  fs.writeFileSync(path.join(DISK_DIR, path.basename(filename)), buffer);
  return `/uploads/gallery/${filename}`;
}

export async function getGalleryImage(filename) {
  const safeName = path.basename(filename);
  if (USE_BLOBS) {
    const store = await galleryStore();
    const result = await store.getWithMetadata(safeName, { type: 'arrayBuffer' });
    if (!result || !result.data) return null;
    return {
      buffer: Buffer.from(result.data),
      contentType: result.metadata?.contentType || contentTypeFor(safeName),
    };
  }
  const filePath = path.join(DISK_DIR, safeName);
  if (!fs.existsSync(filePath)) return null;
  return { buffer: fs.readFileSync(filePath), contentType: contentTypeFor(safeName) };
}

export async function deleteGalleryImage(filename) {
  const safeName = path.basename(filename);
  if (USE_BLOBS) {
    const store = await galleryStore();
    await store.delete(safeName);
    return true;
  }
  const filePath = path.join(DISK_DIR, safeName);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}
