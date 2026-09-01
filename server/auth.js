import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import speakeasy from 'speakeasy';
import db, { schemaReady } from './db.js';
import { sendEmail, appOrigin } from './email.js';

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

// Append a row to the audit trail (never throws to callers).
async function logActivity({ userId = null, username = null, action, entityType = null, entityId = null, detail = null }) {
  try {
    await db.query(
      `INSERT INTO activity_logs (user_id, username, action, entity_type, entity_id, detail)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, username, action, entityType, entityId, detail ? JSON.stringify(detail) : null],
    );
  } catch (err) {
    console.warn('logActivity error:', err.message || err);
  }
}

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

// Auth required: most recent admin activity, newest first.
router.get('/activity', requireAuth, async (_req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 200',
    );
    res.json({
      activities: rows.map((r) => ({
        id: r.id,
        userId: r.user_id,
        username: r.username,
        action: r.action,
        entityType: r.entity_type,
        entityId: r.entity_id,
        detail: r.detail,
        createdAt: r.created_at,
      })),
    });
  } catch (err) {
    console.error('activity error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Seed the team of administrators (the only people allowed to log in and manage
// the project). Reads ADMIN_USERS as a JSON array: [{username, email, password}].
// Idempotent: existing matching accounts are left untouched, so 2FA stays
// intact. On every start it logs each ADMIN_USERS account's TOTP secret so the
// operator can add it to an authenticator app and complete step-2 sign-in.
async function seedAdmins() {
  let raw = process.env.ADMIN_USERS;
  if (!raw) return;
  // Tolerate common paste/editor quirks: surrounding quotes, HTML entities,
  // surrounding whitespace, and line breaks inside the JSON.
  raw = String(raw)
    .trim()
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
  while (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    raw = raw.slice(1, -1).trim();
  }
  raw = raw.replace(/\r?\n[\s]*/g, '').replace(/}\s*,?\s*{/g, '},{');

  let users;
  try {
    users = JSON.parse(raw);
  } catch (err) {
    console.warn(
      'ADMIN_USERS is not valid JSON. Provide an array like [{"username":...}].',
      err.message,
    );
    return;
  }
  if (!Array.isArray(users) || users.length === 0) return;

  for (const u of users) {
    const username = String(u.username || '').trim();
    const email = String(u.email || '').trim().toLowerCase();
    const password = String(u.password || '');
    if (!username || !email || password.length < 8) {
      console.warn(
        '[seed] Skipping ADMIN_USERS entry (needs username, email, and a password of at least 8 characters):',
        JSON.stringify(u),
      );
      continue;
    }
    try {
      const existing = await db.query(
        'SELECT * FROM users WHERE username = $1 OR email = $2',
        [username, email],
      );
      if (existing.rows.length > 0) {
        console.warn(
          `[seed] Administrator "${username}" already exists. For sign-in step 2, add this TOTP secret to Google Authenticator: ${existing.rows[0].totp_secret}`,
        );
        continue;
      }
      const passwordHash = bcrypt.hashSync(password, 12);
      const totpSecret = speakeasy.generateSecret({ length: 20 }).base32;
      await db.query(
        `INSERT INTO users (username, email, password_hash, totp_secret, seeded)
         VALUES ($1, $2, $3, $4, TRUE)`,
        [username, email, passwordHash, totpSecret],
      );
      console.warn(
        `[seed] Created administrator "${username}". Add this TOTP secret to Google Authenticator, then sign in (step 2 will ask for a 6-digit code): ${totpSecret}`,
      );
    } catch (err) {
      console.warn(`[seed] Could not seed administrator "${username}":`, err.message || err);
    }
  }
}

schemaReady
  .then(() => seedAdmins())
  .catch((err) => {
    console.warn('Admin seeding failed:', err.message || err);
  });

// Count admin accounts. Used to gate the one-time bootstrap.
async function adminCount() {
  const { rows } = await db.query('SELECT COUNT(*)::int AS n FROM users');
  return Number(rows[0]?.n ?? 0);
}

// Public: is the site in "first admin" setup state? True only while zero admin
// accounts exist. Once the first admin is created this permanently flips false.
router.get('/bootstrap-status', async (_req, res) => {
  try {
    const n = await adminCount();
    res.json({ canSetup: n === 0 });
  } catch (err) {
    console.error('bootstrap-status error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Public: create the very FIRST admin account. Only works while zero admin
// accounts exist, so exactly the person who sets it up gets the initial account.
router.post('/bootstrap', async (req, res) => {
  try {
    if ((await adminCount()) > 0) {
      return res.status(409).json({ error: 'An administrator already exists.' });
    }
    const { username, email, password } = req.body || {};
    const uname = String(username || '').trim();
    const em = String(email || '').trim().toLowerCase();
    if (uname.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    if (String(password || '').length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    const existing = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [uname, em],
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'That username or email is already in use.' });
    }
    const passwordHash = bcrypt.hashSync(String(password), 12);
    const totpSecret = speakeasy.generateSecret({ length: 20 }).base32;
    const info = await db.query(
      `INSERT INTO users (username, email, password_hash, totp_secret, seeded)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING *`,
      [uname, em, passwordHash, totpSecret],
    );
    await logActivity({
      userId: info.rows[0].id,
      username: info.rows[0].username,
      action: 'bootstrap_admin',
      entityType: 'user',
      entityId: uname,
    });
    res.status(201).json({
      user: {
        id: String(info.rows[0].id),
        username: info.rows[0].username,
        email: info.rows[0].email,
        role: info.rows[0].role,
        seeded: true,
        totpSecret,
      },
    });
  } catch (err) {
    console.error('bootstrap error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Auth required: list the admin team (used to manage the 4-person access list).
router.get('/users', requireAuth, async (_req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, username, email, role, seeded, created_at FROM users ORDER BY created_at',
    );
    res.json({ users: rows.map(normalizeUser) });
  } catch (err) {
    console.error('list users error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Auth required: an existing admin adds a team member (creates their account).
router.post('/users', requireAuth, async (req, res) => {
  try {
    const { username, email, password } = req.body || {};
    const uname = String(username || '').trim();
    const em = String(email || '').trim().toLowerCase();
    if (uname.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }
    if (String(password || '').length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    const existing = await db.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [uname, em],
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'That username or email is already in use.' });
    }
    const passwordHash = bcrypt.hashSync(String(password), 12);
    const totpSecret = speakeasy.generateSecret({ length: 20 }).base32;
    const info = await db.query(
      `INSERT INTO users (username, email, password_hash, totp_secret)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [uname, em, passwordHash, totpSecret],
    );
    await logActivity({
      userId: req.user.sub,
      username: req.user.username,
      action: 'add_admin',
      entityType: 'user',
      entityId: uname,
    });
    res.status(201).json({ user: normalizeUser(info.rows[0]) });
  } catch (err) {
    console.error('add user error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Auth required: remove a team member. You cannot remove yourself or the last admin.
router.delete('/users/:id', requireAuth, async (req, res) => {
  try {
    const id = String(req.params.id || '');
    const { rows } = await db.query('SELECT id, username FROM users WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found.' });
    if (String(rows[0].id) === String(req.user.sub)) {
      return res.status(400).json({ error: 'You cannot remove your own account.' });
    }
    const count = await adminCount();
    if (count <= 1) {
      return res.status(400).json({ error: 'You cannot remove the last administrator.' });
    }
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    await logActivity({
      userId: req.user.sub,
      username: req.user.username,
      action: 'remove_admin',
      entityType: 'user',
      entityId: rows[0].username,
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('delete user error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
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
    await logActivity({
      userId: row.id,
      username: row.username,
      action: 'sign_in',
      entityType: 'user',
      entityId: String(row.id),
    });
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

// Request a password reset. Issues a single-use token and emails a clickable
// reset link to the account's address. If SMTP is not configured (local dev),
// the token is returned to the client so the flow can still be completed.
router.post('/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Email is required.' });
    const normalized = String(email).trim().toLowerCase();
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [normalized]);
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

    const resetUrl = `${appOrigin()}/admin/reset?token=${encodeURIComponent(raw)}`;
    const mintes = Math.floor(RESET_TTL_MS / 60000);

    const sent = await sendEmail({
      to: normalized,
      subject: 'Reset your KSB admin password',
      text: `We received a request to reset your KSB admin password.\n\nClick the link below to set a new password. This link expires in ${mintes} minutes and can be used once.\n\n${resetUrl}\n\nIf you did not request this, you can safely ignore this email.`,
      html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;padding:24px;border:1px solid #e3d8c8;border-radius:12px">
        <h2 style="color:#3b2a1a;margin-top:0">The Kigali Specialist Barista</h2>
        <p>We received a request to reset your admin password.</p>
        <p><a href="${resetUrl}" style="display:inline-block;background:#6f4e37;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">Reset my password</a></p>
        <p style="color:#8a6d53;font-size:13px">This link expires in ${mintes} minutes and can be used once. If you did not request this, you can safely ignore this email.</p>
      </div>`,
    });

    return res.json({
      ok: true,
      // Only returned when SMTP is not configured, so local dev still works.
      devToken: sent ? undefined : raw,
      emailed: sent,
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
    const { rows: actorRows } = await db.query(
      'SELECT username FROM users WHERE id = $1',
      [resetRow.user_id],
    );
    await logActivity({
      userId: resetRow.user_id,
      username: actorRows[0]?.username ?? null,
      action: 'password_reset',
      entityType: 'user',
      entityId: String(resetRow.user_id),
    });
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
    await logActivity({
      userId: row.id,
      username: row.username,
      action: 'change_password',
      entityType: 'user',
      entityId: String(row.id),
    });
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
    await logActivity({
      userId: rows[0].id,
      username: rows[0].username,
      action: 'regenerate_2fa',
      entityType: 'user',
      entityId: String(rows[0].id),
    });
    res.json({ totpSecret, username: rows[0].username });
  } catch (err) {
    console.error('regenerate-totp error:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

export { router as authRouter, requireAuth };
