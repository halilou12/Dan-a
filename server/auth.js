import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import speakeasy from 'speakeasy';
import db from './db.js';

const router = Router();

const JWT_SECRET =
  process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const SESSION_TTL_SECONDS = 24 * 60 * 60;
const MAX_ATTEMPTS = 5;
const LOCK_WINDOW_MS = 60 * 1000;
const RESET_TTL_MS = 30 * 60 * 1000;
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

// In-memory attempt tracker. This is a development-grade store; swap for a
// database table in production to survive restarts.
const attempts = new Map();

const attemptKey = (id) => `user:${id}`;

const lockCheck = (id) => {
  const entry = attempts.get(attemptKey(id));
  if (!entry) return null;
  if (entry.lockUntil > Date.now()) {
    const secs = Math.ceil((entry.lockUntil - Date.now()) / 1000);
    return `Too many failed attempts. Try again in ${secs} seconds.`;
  }
  return null;
};

const bumpAttempts = (id) => {
  const key = attemptKey(id);
  const entry = attempts.get(key) || { count: 0, lockUntil: 0 };
  const now = Date.now();
  const withinWindow = entry.lockUntil > now ? entry : { count: 0, lockUntil: 0 };
  const count = withinWindow.count + 1;
  if (count >= MAX_ATTEMPTS) {
    attempts.set(key, { count: 0, lockUntil: now + LOCK_WINDOW_MS });
  } else {
    attempts.set(key, { count, lockUntil: withinWindow.lockUntil });
  }
};

const clearAttempts = (id) => attempts.delete(attemptKey(id));

const normalizeUser = (row) => ({
  id: row.id,
  username: row.username,
  email: row.email,
  role: row.role,
  seeded: Boolean(row.seeded),
  createdAt: row.created_at,
});

const signToken = (user) =>
  jwt.sign(
    { sub: String(user.id), username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: SESSION_TTL_SECONDS },
  );

const randomToken = () =>
  crypto.randomBytes(32).toString('base64url');

const hash64 = (value) =>
  crypto.createHash('sha256').update(value).digest('hex');

const publicUser = (row) => ({
  id: row.id,
  username: row.username,
  email: row.email,
  role: row.role,
  seeded: Boolean(row.seeded),
  totpSecret: row.totp_secret,
});

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Unauthorized.' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch {
    return res.status(401).json({ error: 'Session expired. Please sign in again.' });
  }
};

// Register a new admin account.
router.post('/auth/register', (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !password || !email) {
    return res.status(400).json({ error: 'Username, email and password are required.' });
  }
  if (String(username).trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters.' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email))) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  const existing = db
    .prepare('SELECT id FROM users WHERE username = ? OR email = ?')
    .get(String(username).trim(), String(email).trim().toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'That username or email is already registered.' });
  }
  const passwordHash = bcrypt.hashSync(String(password), 12);
  const totpSecret = speakeasy.generateSecret({ length: 20 }).base32;
  const info = db
    .prepare('INSERT INTO users (username, email, password_hash, totp_secret) VALUES (?, ?, ?, ?)')
    .run(String(username).trim(), String(email).trim().toLowerCase(), passwordHash, totpSecret);
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  res.status(201).json({ user: publicUser(row) });
});

router.get('/auth/session', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.sub);
  if (!row) return res.status(401).json({ error: 'Account no longer exists.' });
  res.json({ user: normalizeUser(row) });
});

// Step 1: username + password.
router.post('/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(String(username || '').trim());
  if (!row) return res.status(401).json({ error: 'Invalid username or password.' });
  const locked = lockCheck(row.id);
  if (locked) return res.status(429).json({ error: locked });
  const valid = bcrypt.compareSync(String(password || ''), row.password_hash);
  if (!valid) {
    bumpAttempts(row.id);
    return res.status(401).json({ error: 'Invalid username or password.' });
  }
  return res.json({
    ok: true,
    step: '2fa',
    user: { id: row.id, username: row.username, totpSecret: row.totp_secret },
  });
});

// Step 2: TOTP verification.
router.post('/auth/verify-2fa', (req, res) => {
  const { username, code } = req.body || {};
  if (!username || !code) {
    return res.status(400).json({ error: 'Username and verification code are required.' });
  }
  const row = db.prepare('SELECT * FROM users WHERE username = ?').get(String(username).trim());
  if (!row) return res.status(401).json({ error: 'Invalid username or password.' });
  const locked = lockCheck(row.id);
  if (locked) return res.status(429).json({ error: locked });

  const valid = speakeasy.totp.verify({
    secret: row.totp_secret,
    encoding: 'base32',
    token: String(code).replace(/\D/g, ''),
    window: 1,
  });
  if (!valid) {
    bumpAttempts(row.id);
    return res.status(401).json({ error: 'Invalid verification code.' });
  }
  clearAttempts(row.id);
  const token = signToken(row);
  res.json({
    ok: true,
    token,
    expiresAt: Date.now() + SESSION_TTL_MS,
    user: normalizeUser(row),
  });
});

router.post('/auth/logout', requireAuth, (_req, res) => {
  res.json({ ok: true });
});

// Request a password reset. Issues a single-use token returned to the client.
// In production, email this token to the user instead of returning it directly.
router.post('/auth/forgot-password', (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'Email is required.' });
  const row = db
    .prepare('SELECT * FROM users WHERE email = ?')
    .get(String(email).trim().toLowerCase());
  // Always respond the same way to avoid leaking which accounts exist.
  if (!row) return res.json({ ok: true });

  // Invalidate any prior unused tokens for this user.
  db.prepare('UPDATE reset_tokens SET used = 1 WHERE user_id = ? AND used = 0').run(row.id);

  const raw = randomToken();
  const expiresAt = Date.now() + RESET_TTL_MS;
  db.prepare(
    'INSERT INTO reset_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
  ).run(row.id, hash64(raw), expiresAt);

  // For the demo we return the token so the flow can be completed in the UI.
  // Replace with real email delivery for a production deployment.
  res.json({
    ok: true,
    devToken: raw,
    expiresInSeconds: Math.floor(RESET_TTL_MS / 1000),
  });
});

// Complete the password reset with a valid token.
router.post('/auth/reset-password', (req, res) => {
  const { token, email, newPassword } = req.body || {};
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Reset token and new password are required.' });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }
  const resetRow = db
    .prepare('SELECT * FROM reset_tokens WHERE token_hash = ?')
    .get(hash64(String(token).trim()));
  if (!resetRow || resetRow.used) {
    return res.status(400).json({ error: 'This reset link is invalid or has already been used.' });
  }
  if (resetRow.expires_at < Date.now()) {
    return res.status(410).json({ error: 'This reset link has expired. Request a new one.' });
  }
  if (email) {
    const userRow = db.prepare('SELECT * FROM users WHERE id = ?').get(resetRow.user_id);
    if (!userRow || userRow.email.toLowerCase() !== String(email).trim().toLowerCase()) {
      return res.status(400).json({ error: 'This reset link does not match the requested account.' });
    }
  }
  const passwordHash = bcrypt.hashSync(String(newPassword), 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, resetRow.user_id);
  db.prepare('UPDATE reset_tokens SET used = 1 WHERE id = ?').run(resetRow.id);
  clearAttempts(resetRow.user_id);
  res.json({ ok: true });
});

// Change password for the signed-in user.
router.post('/auth/change-password', requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.sub);
  if (!row) return res.status(401).json({ error: 'Account no longer exists.' });
  const valid = bcrypt.compareSync(String(currentPassword || ''), row.password_hash);
  if (!valid) {
    return res.status(400).json({ error: 'Current password is incorrect.' });
  }
  if (String(newPassword || '').length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters.' });
  }
  const passwordHash = bcrypt.hashSync(String(newPassword), 12);
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(passwordHash, row.id);
  res.json({ ok: true });
});

// Fetch the current TOTP secret (for displaying the QR on the dashboard).
router.get('/auth/totp', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.sub);
  if (!row) return res.status(401).json({ error: 'Account no longer exists.' });
  res.json({ totpSecret: row.totp_secret, username: row.username });
});

// Regenerate the TOTP secret for the signed-in user.
router.post('/auth/regenerate-totp', requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.sub);
  if (!row) return res.status(401).json({ error: 'Account no longer exists.' });
  const totpSecret = speakeasy.generateSecret({ length: 20 }).base32;
  db.prepare('UPDATE users SET totp_secret = ? WHERE id = ?').run(totpSecret, row.id);
  res.json({ totpSecret, username: row.username });
});

export { router as authRouter, requireAuth };
