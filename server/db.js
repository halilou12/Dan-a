import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const DB_PATH = process.env.DATABASE_PATH || path.join(DATA_DIR, 'ksb.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Apply the schema on every startup (CREATE IF NOT EXISTS is idempotent).
const schema = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schema);

export default db;