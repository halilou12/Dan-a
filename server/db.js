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

async function initSchema() {
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
  await pool.query(schema);
}

initSchema().catch((err) => {
  console.error('Failed to apply database schema:', err);
  process.exit(1);
});

export default {
  query: (text, params) => pool.query(text, params),
};
