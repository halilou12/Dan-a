import serverless from 'serverless-http';
import { app } from '../../server/app.js';

const serverlessHandler = serverless(app, {
  // Responses with these content types must be base64-encoded for Netlify.
  binary: ['image/*', 'application/octet-stream'],
});

// Netlify may hand the function the rewritten path (/.netlify/functions/api/…)
// instead of the original request path. Normalise it so Express routes like
// /api/* and /uploads/* keep matching.
const normalizePath = (pathname) => {
  const prefix = '/.netlify/functions/api';
  if (pathname === prefix) return '/';
  if (pathname.startsWith(`${prefix}/`)) return pathname.slice(prefix.length);
  return pathname;
};

export const handler = async (event, context) => {
  if (event?.path) {
    event.path = normalizePath(event.path);
  }
  return serverlessHandler(event, context);
};
