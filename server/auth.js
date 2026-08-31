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
  id: String(row.id),
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
router.post('/auth/register', async (_req, res) => {
  res.status(403).json({
    error: 'Administrator registration is closed. Access is granted only to authorized staff.',
  });
});

// Seed the team of administrators (the only people allowed to log in and manage
// the project). Reads ADMIN_USERS as a JSON array: [{username, email, password}].
// Idempotent: existing accounts are left untouched, so 2FA stays intact.
async function seedAdmins() {
  let raw = process.env.ADMIN_USERS;
  if (!raw) return;
  // Tolerate common paste/editor quirks: surrounding quotes, HTML entities,
  // surrounding whitespace, and line breaks inside the JSON.
  raw = String(raw).trim().replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
  while ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
    raw = raw.slice(1, -1).trim();
  }
  raw = raw.replace(/\r?\n[\s]*/g, '').replace(/}\s*,?\s*{/g, '},{');

  let users;
  try {
    users = JSON.parse(raw);
  } catch (err) {
    console.warn('ADMIN_USERS is not valid JSON. Provide a JSON array like [{"username":...}].', err.message);
    return;
  }
  if (!Array.isArray(users) || users.length === 0) return;

  for (const u of users) {
    const username = String(u.username || '').trim();
    const email = String(u.email || '').trim().toLowerCase();
    const password = String(u.password || '');
    if (!username || !email || password.length < 8) continue;

    try {
      const existing = await db.query('SELECT id FROM users WHERE username = $1 OR email = $2', [
        username,
        email,
      ]);
      if (existing.rows.length > 0) continue;
      const passwordHash = bcrypt.hashSync(password, 12);
      const totpSecret = speakeasy.generateSecret({ length: 20 }).base32;
      await db.query(
        `INSERT INTO users (username, email, password_hash, totp_secret, seeded)
         VALUES ($1, $2, $3, $4, TRUE)`,
        [username, email, passwordHash, totpSecret],
      );
      console.log(`Seeded administrator account: ${username}`);
    } catch (err) {
      console.warn(`Could not seed administrator ${username}:`, err.message || err);
    }
  }
}

seedAdmins().catch((err) => {
  console.warn('Admin seeding failed:', err.message || err);
});

router.get('/auth/session', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.user.sub]);
    if (rows.length === 0) return res.status(401).json({ error: 'Account no longer exists.' });
    res.json({ user: normalizeUser(rows[0]) });
  } catch (err) {
    console.error('session error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Step 1: username + password.
router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    const { rows } = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [String(username || '').trim()],
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid username or password.' });
    const row = rows[0];
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
      user: { id: String(row.id), username: row.username, totpSecret: row.totp_secret },
    });
  } catch (err) {
    console.error('login error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Step 2: TOTP verification.
router.post('/auth/verify-2fa', async (req, res) => {
  try {
    const { username, code } = req.body || {};
    if (!username || !code) {
      return res.status(400).json({ error: 'Username and verification code are required.' });
    }
    const { rows } = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [String(username).trim()],
    );
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid username or password.' });
    const row = rows[0];
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
  } catch (err) {
    console.error('verify-2fa error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

router.post('/auth/logout', requireAuth, (_req, res) => {
  res.json({ ok: true });
});

// Request a password reset. Issues a single-use token returned to the client.
// In production, email this token to the user instead of returning it directly.
router.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required.' });
    const { rows } = await db.query(
      'SELECT * FROM users WHERE email = $1',
      [String(email).trim().toLowerCase()],
    );
    // Always respond the same way to avoid leaking which accounts exist.
    if (rows.length === 0) return res.json({ ok: true });
    const row = rows[0];

    // Invalidate any prior unused tokens for this user.
    await db.query(
      'UPDATE reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE',
      [row.id],
    );

    const raw = randomToken();
    const expiresAt = Date.now() + RESET_TTL_MS;
    await db.query(
      'INSERT INTO reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [row.id, hash64(raw), expiresAt],
    );

    // For the demo we return the token so the flow can be completed in the UI.
    // Replace with real email delivery for a production deployment.
    res.json({
      ok: true,
      devToken: raw,
      expiresInSeconds: Math.floor(RESET_TTL_MS / 1000),
    });
  } catch (err) {
    console.error('forgot-password error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Complete the password reset with a valid token.
router.post('/auth/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body || {};
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required.' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }
    const { rows } = await db.query('SELECT * FROM reset_tokens WHERE token_hash = $1', [
      hash64(String(token).trim()),
    ]);
    if (rows.length === 0 || rows[0].used) {
      return res.status(400).json({ error: 'This reset link is invalid or has already been used.' });
    }
    const resetRow = rows[0];
    if (resetRow.expires_at < Date.now()) {
      return res.status(410).json({ error: 'This reset link has expired. Request a new one.' });
    }
    if (email) {
      const { rows: userRows } = await db.query('SELECT * FROM users WHERE id = $1', [
        resetRow.user_id,
      ]);
      const userRow = userRows[0];
      if (!userRow || userRow.email.toLowerCase() !== String(email).trim().toLowerCase()) {
        return res
          .status(400)
          .json({ error: 'This reset link does not match the requested account.' });
      }
    }
    const passwordHash = bcrypt.hashSync(String(newPassword), 12);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      passwordHash,
      resetRow.user_id,
    ]);
    await db.query('UPDATE reset_tokens SET used = TRUE WHERE id = $1', [resetRow.id]);
    clearAttempts(resetRow.user_id);
    res.json({ ok: true });
  } catch (err) {
    console.error('reset-password error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Change password for the signed-in user.
router.post('/auth/change-password', requireAuth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.user.sub]);
    if (rows.length === 0) return res.status(401).json({ error: 'Account no longer exists.' });
    const row = rows[0];
    const valid = bcrypt.compareSync(String(currentPassword || ''), row.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }
    if (String(newPassword || '').length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }
    const passwordHash = bcrypt.hashSync(String(newPassword), 12);
    await db.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, row.id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('change-password error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Fetch the current TOTP secret (for displaying the QR on the dashboard).
router.get('/auth/totp', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.user.sub]);
    if (rows.length === 0) return res.status(401).json({ error: 'Account no longer exists.' });
    res.json({ totpSecret: rows[0].totp_secret, username: rows[0].username });
  } catch (err) {
    console.error('totp error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Regenerate the TOTP secret for the signed-in user.
router.post('/auth/regenerate-totp', requireAuth, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.user.sub]);
    if (rows.length === 0) return res.status(401).json({ error: 'Account no longer exists.' });
    const totpSecret = speakeasy.generateSecret({ length: 20 }).base32;
    await db.query('UPDATE users SET totp_secret = $1 WHERE id = $2', [totpSecret, rows[0].id]);
    res.json({ totpSecret, username: rows[0].username });
  } catch (err) {
    console.error('regenerate-totp error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

export { router as authRouter, requireAuth };
