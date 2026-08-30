-- Kigali Specialist Barista (KSB) — Admin database schema
-- SQLite schema, applied automatically by server/db.js on every startup.
-- All statements are idempotent (CREATE ... IF NOT EXISTS).

-- Admin user accounts.
-- password_hash -> bcrypt hash of the password (cost 12)
-- totp_secret   -> base32 TOTP secret, required for step-2 sign-in
-- role          -> 'admin' (reserved for future roles)
-- seeded        -> legacy demo-account flag (0 now, account comes from registration)
CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    NOT NULL UNIQUE,
    email         TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    totp_secret   TEXT    NOT NULL,
    role          TEXT    NOT NULL DEFAULT 'admin',
    seeded        INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- Single-use password-reset tokens.
-- token_hash -> SHA-256 of the raw token (raw value is shown/emailed to the user)
-- expires_at -> epoch milliseconds; the token is invalid after this timestamp
-- used       -> 1 once the token has been consumed
CREATE TABLE IF NOT EXISTS reset_tokens (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT    NOT NULL,
    expires_at INTEGER NOT NULL,
    used       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_reset_user ON reset_tokens(user_id);
