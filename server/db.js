import pg from 'pg';
import schemaSql from './schema.js';

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/postgres';

// Managed Postgres (Neon, etc.) requires SSL. Enable it for production or
// whenever the connection string explicitly asks for it.
const useSSL =
  /sslmode=require/.test(connectionString) || process.env.NODE_ENV === 'production';

export const pool = new Pool({
  connectionString,
  ssl: useSSL ? { rejectUnauthorized: false } : undefined,
  // Serverless functions are short-lived: keep the pool tiny and let idle
  // connections close so Lambda freezes cleanly.
  max: Number(process.env.PGPOOL_MAX || 3),
  allowExitOnIdle: true,
  // Fail fast instead of hanging requests when the database is unreachable.
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  statement_timeout: 10000,
  query_timeout: 10000,
});

let dbReady = false;

async function initSchema() {
  await pool.query(schemaSql);
  dbReady = true;
}

// Last connection/schema error, exposed on /api/health for diagnostics.
export let lastDbError = null;

// Resolves (even when the schema init is skipped) once the first startup
// attempt to create the schema has finished. Seeders await this before they
// touch any tables, so INSERTs never race against CREATE TABLE.
export const schemaReady = initSchema().catch((err) => {
  lastDbError = err;
  console.warn('Database unavailable (schema init skipped):', err.message || err);
});

export const requireDb = (_req, res, next) => {
  if (!dbReady) {
    return res.status(503).json({ error: 'Database is not available. Please try again later.' });
  }
  next();
};

export default {
  query: (text, params) => pool.query(text, params),
};
