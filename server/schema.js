// PostgreSQL schema, applied automatically by server/db.js on every startup.
// Kept as a JS string (not a .sql file) so it is bundled into the Netlify
// serverless function — a standalone schema.sql would not ship with the bundle.
export default String.raw`
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

CREATE TABLE IF NOT EXISTS reset_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT      NOT NULL,
    expires_at BIGINT    NOT NULL,
    used       BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reset_user ON reset_tokens(user_id);

CREATE TABLE IF NOT EXISTS activity_logs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT,
    username    TEXT,
    action      TEXT      NOT NULL,
    entity_type TEXT,
    entity_id   TEXT,
    detail      JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_time ON activity_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS programs (
    id        TEXT PRIMARY KEY,
    title     TEXT NOT NULL,
    weeks     INTEGER NOT NULL,
    modules   JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS students (
    id          TEXT PRIMARY KEY,
    full_name   TEXT NOT NULL,
    national_id TEXT,
    dob         TEXT,
    email       TEXT,
    phone       TEXT,
    photo       TEXT,
    status      TEXT NOT NULL DEFAULT 'active',
    created_at  TEXT
);

CREATE TABLE IF NOT EXISTS enrollments (
    id             BIGSERIAL PRIMARY KEY,
    student_id     TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    program_id     TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    enrolled_date  TEXT,
    UNIQUE (student_id, program_id)
);

CREATE TABLE IF NOT EXISTS assessments (
    id            BIGSERIAL PRIMARY KEY,
    student_id    TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    program_id    TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    module        TEXT NOT NULL,
    grade         TEXT NOT NULL,
    score         INTEGER NOT NULL,
    assessed_date TEXT,
    assessor      TEXT,
    UNIQUE (student_id, program_id, module)
);

CREATE TABLE IF NOT EXISTS training_sessions (
    id            BIGSERIAL PRIMARY KEY,
    student_id    TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    program_id    TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    module        TEXT NOT NULL,
    session_date  TEXT NOT NULL,
    work_type     TEXT NOT NULL DEFAULT 'theory',
    score         INTEGER NOT NULL DEFAULT 0,
    notes         TEXT,
    assessor      TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_session_student ON training_sessions(student_id);

CREATE TABLE IF NOT EXISTS certificates (
    id             TEXT PRIMARY KEY,
    token          TEXT NOT NULL UNIQUE,
    student_id     TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    program_id     TEXT NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    issue_date     TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'valid',
    revoked_date   TEXT,
    revoked_reason TEXT,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cert_token ON certificates(token);
CREATE INDEX IF NOT EXISTS idx_assessment_student ON assessments(student_id);

CREATE TABLE IF NOT EXISTS app_meta (
    key   TEXT PRIMARY KEY,
    value JSONB NOT NULL
);
`;
