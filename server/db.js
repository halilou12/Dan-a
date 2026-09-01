import pg from 'pg';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const { Pool } = pg;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

const connectionString =
  process.env.DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/postgres';

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

let dbReady = false;

async function initSchema() {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  await pool.query(schema);
  dbReady = true;
}

// Resolves (even when the schema init is skipped) once the first startup
// attempt to create the schema has finished. Seeders await this before they
// touch any tables, so INSERTs never race against CREATE TABLE.
export const schemaReady = initSchema().catch((err) => {
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
