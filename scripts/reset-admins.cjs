// Reset administrator accounts so the one-time /admin/setup flow re-enables.
// Run from Render Shell: node scripts/reset-admins.cjs
// This TRUNCATES the users table and anything that cascades from it (like
// password-reset tokens). Programs, students and certificates are untouched.
const { Client } = require('pg');

(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('DATABASE_URL is not set in this environment.');
    process.exit(1);
  }
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    const before = await client.query('SELECT COUNT(*) AS n FROM users');
    await client.query('TRUNCATE TABLE users CASCADE');
    const after = await client.query('SELECT COUNT(*) AS n FROM users');
    console.log(
      `Removed ${before.rows[0].n} admin account(s), ${after.rows[0].n} remain. ` +
        'The /admin/setup page is now available (or restart the service to reseed from ADMIN_USERS).',
    );
  } catch (err) {
    console.error('Reset failed:', err.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
})();