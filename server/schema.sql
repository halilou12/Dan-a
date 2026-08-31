-- Kigali Specialist Barista (KSB) — Admin database schema
-- PostgreSQL schema, applied automatically by server/db.js on every startup.
-- All statements are idempotent (CREATE ... IF NOT EXISTS).

-- Admin user accounts.
-- password_hash -> bcrypt hash of the password (cost 12)
-- totp_secret   -> base32 TOTP secret, required for step-2 sign-in
-- role          -> 'admin' (reserved for future roles)
-- seeded        -> legacy demo-account flag (0 now, account comes from registration)
CREATE TABLE IF NOT EXISTS users (
    id            BIGSERIAL PRIMARY KEY,
    username      TEXT      NOT NULL UNIQUE,
    email         TEXT      NOT NULL UNIQUE,
    password_hash TEXT      NOT NULL,
    totp_secret   TEXT      NOT NULL,
    role          TEXT      NOT NULL DEFAULT 'admin',
    seeded        BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Single-use password-reset tokens.
-- token_hash -> SHA-256 of the raw token (raw value is shown/emailed to the user)
-- expires_at -> epoch milliseconds; the token is invalid after this timestamp
-- used       -> true once the token has been consumed
CREATE TABLE IF NOT EXISTS reset_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT      NOT NULL,
    expires_at BIGINT    NOT NULL,
    used       BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reset_user ON reset_tokens(user_id);
