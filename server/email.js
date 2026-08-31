import nodemailer from 'nodemailer';

// SMTP is configured via environment variables. When they are absent (e.g. local
// development), email() returns false and callers fall back to the devToken path.
const HOST = process.env.SMTP_HOST;
const PORT = Number(process.env.SMTP_PORT || 587);
const USER = process.env.SMTP_USER;
const PASS = process.env.SMTP_PASS;
const FROM = process.env.SMTP_FROM || 'no-reply@ksb.local';

const configured = Boolean(HOST && USER && PASS);

let transport = null;

if (configured) {
  transport = nodemailer.createTransport({
    host: HOST,
    port: PORT,
    secure: PORT === 465,
    auth: { user: USER, pass: PASS },
  });
  console.log(`[startup] SMTP configured (host: ${HOST}:${PORT})`);
} else {
  console.warn('[startup] SMTP not configured — password reset links will fall back to the dev token.');
}

// Send an email. Returns true on success, false when SMTP is not configured or
// delivery failed. Never throws to the caller.
export async function sendEmail({ to, subject, text, html }) {
  if (!transport) return false;
  const safeTo = String(to || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeTo)) return false;
  try {
    await transport.sendMail({
      from: String(FROM || '').trim(),
      to: safeTo,
      subject: String(subject || ''),
      text,
      html,
    });
    return true;
  } catch (err) {
    console.error('Email send failed:', err.message || err);
    return false;
  }
}

// The public origin used to build clickable reset links. In production Render
// injects RENDER_EXTERNAL_URL; fall back to the SMTP_APP_URL override or a sane
// default so the email link always points somewhere reachable.
export function appOrigin() {
  return (
    process.env.RENDER_EXTERNAL_URL ||
    process.env.SMTP_APP_URL ||
    process.env.APP_URL ||
    'http://localhost:5173'
  );
}
