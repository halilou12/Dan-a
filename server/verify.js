import { Router } from 'express';
import db from './db.js';
import { requireAuth } from './auth.js';

const router = Router();

// Public programs catalog (mirrors PROGRAMS in the client store).
const PROGRAMS = [
  {
    id: 'PRG-BF',
    title: 'Barista Foundation',
    weeks: 4,
    modules: [
      'Introduction to Coffee',
      'Coffee Processing',
      'Grinder Basics',
      'Water Quality',
      'Espresso',
      'Milk Science & Milk Steaming',
      'Latte Art Basics',
      'Mastery of Brewing Methods',
      'Coffee M.D',
      'Tea M.D',
      'Coffee Management',
      'Customer Service & Workflow',
      'Barista Interview Preferences & Tips',
      'Juice M.D',
      'V60 Pour Over',
      'Chemex',
      'Siphon',
      'French Press',
      'Cupping',
    ],
  },
  {
    id: 'PRG-SB',
    title: 'Specialty Brewing',
    weeks: 3,
    modules: ['V60 Pour Over', 'Chemex', 'Siphon', 'French Press', 'Cupping'],
  },
  {
    id: 'PRG-LA',
    title: 'Latte Art Mastery',
    weeks: 2,
    modules: ['Milk Texture', 'Heart, Rosetta & Tulip', 'Free Pour Techniques', 'Etching & Design'],
  },
];

// Seed the fixed program catalog so foreign keys resolve.
async function seedPrograms() {
  for (const p of PROGRAMS) {
    await db.query(
      `INSERT INTO programs (id, title, weeks, modules)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (id) DO NOTHING`,
      [p.id, p.title, p.weeks, JSON.stringify(p.modules)],
    );
  }
}

seedPrograms().catch((err) => {
  console.warn('Could not seed programs:', err.message || err);
});

// Seed the demo certificates (the same ones shipped in the client store) so the
// sample QR codes verify out-of-the-box. Idempotent.
const DEMO_CERTS = [
  {
    cert: {
      id: 'KSB-CERT-2026-00001',
      token: 'XVZ4K-9QWPL-8HRTU',
      studentId: 'KSB-S-0001',
      programId: 'PRG-BF',
      issueDate: '2026-07-29',
      status: 'valid',
    },
    student: { id: 'KSB-S-0001', fullName: 'Letitia Uwase', photo: '/images/IMG-20260408-WA0013.jpg' },
    scores: [88, 90, 85, 87, 84, 91, 83, 86, 89, 80, 88, 92, 87, 85, 90, 86, 84, 89, 92],
  },
  {
    cert: {
      id: 'KSB-CERT-2026-00002',
      token: 'MK7QR-2PTRS-LN45X',
      studentId: 'KSB-S-0003',
      programId: 'PRG-LA',
      issueDate: '2026-05-20',
      status: 'revoked',
      revokedDate: '2026-08-02',
      revokedReason: 'Certificate holder breached the KSB professional code of conduct.',
    },
    student: { id: 'KSB-S-0003', fullName: 'Aline Mukamana', photo: null },
    scores: [96, 85, 88, 90],
  },
];

async function seedDemo() {
  for (const demo of DEMO_CERTS) {
    const program = PROGRAMS.find((p) => p.id === demo.cert.programId);
    if (!program) continue;

    await db.query(
      `INSERT INTO students (id, full_name, photo, status)
       VALUES ($1, $2, $3, 'graduated')
       ON CONFLICT (id) DO NOTHING`,
      [demo.student.id, demo.student.fullName, demo.student.photo],
    );

    await db.query(
      `INSERT INTO enrollments (student_id, program_id, enrolled_date)
       VALUES ($1, $2, $3)
       ON CONFLICT (student_id, program_id) DO NOTHING`,
      [demo.student.id, demo.cert.programId, demo.cert.issueDate],
    );

    program.modules.forEach(async (module, i) => {
      const score = demo.scores[i] ?? 85;
      await db.query(
        `INSERT INTO assessments (student_id, program_id, module, grade, score, assessed_date, assessor)
         VALUES ($1, $2, $3, 'Competent', $4, $5, 'SIBOMANA Assouman')
         ON CONFLICT (student_id, program_id, module) DO NOTHING`,
        [demo.student.id, demo.cert.programId, module, score, demo.cert.issueDate],
      );
    });

    await db.query(
      `INSERT INTO certificates (id, token, student_id, program_id, issue_date, status, revoked_date, revoked_reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (id) DO NOTHING`,
      [
        demo.cert.id,
        demo.cert.token,
        demo.cert.studentId,
        demo.cert.programId,
        demo.cert.issueDate,
        demo.cert.status,
        demo.cert.revokedDate ?? null,
        demo.cert.revokedReason ?? null,
      ],
    );
  }
}

seedDemo().catch((err) => {
  console.warn('Could not seed demo certificates:', err.message || err);
});

// Public: verify a certificate by its unique token.
// Returns only public data — never national ID, DOB, phone or email.
router.get('/verify/:token', async (req, res) => {
  try {
    const token = String(req.params.token || '').trim().toUpperCase();
    if (!token) {
      return res.status(400).json({ error: 'A verification token is required.' });
    }

    const { rows } = await db.query(
      `SELECT c.*, s.full_name, s.photo,
              p.title AS program_title, p.weeks, p.modules
       FROM certificates c
       JOIN students s ON s.id = c.student_id
       JOIN programs p ON p.id = c.program_id
       WHERE c.token = $1`,
      [token],
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Certificate not found.' });
    }

    const cert = rows[0];
    const assessments = (
      await db.query(
        `SELECT module, grade, score, assessed_date, assessor
         FROM assessments WHERE student_id = $1 AND program_id = $2
         ORDER BY id`,
        [cert.student_id, cert.program_id],
      )
    ).rows;

    res.json({
      certificate: {
        id: cert.id,
        studentId: cert.student_id,
        programId: cert.program_id,
        token: cert.token,
        issueDate: cert.issue_date,
        status: cert.status,
        revokedDate: cert.revoked_date,
        revokedReason: cert.revoked_reason,
      },
      student: {
        fullName: cert.full_name,
        photo: cert.photo,
      },
      program: {
        title: cert.program_title,
        weeks: cert.weeks,
        modules: cert.modules,
      },
      academicRecord: assessments.map((a) => ({
        module: a.module,
        grade: a.grade,
        score: a.score,
        assessedDate: a.assessed_date,
        assessor: a.assessor,
      })),
    });
  } catch (err) {
    console.error('verify error:', err);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// Admin-only: sync an issued certificate (and its student + academic record)
// to the database so it can be verified by QR code anywhere.
router.post('/admin/certificates', requireAuth, async (req, res) => {
  try {
    const body = req.body || {};
    const {
      id,
      token,
      studentId,
      studentName,
      studentPhoto,
      programId,
      programTitle,
      programWeeks,
      modules,
      issueDate,
      status,
      assessments = [],
    } = body;

    if (!id || !token || !studentId || !studentName || !programId || !programTitle) {
      return res.status(400).json({ error: 'Missing certificate data.' });
    }

    await db.query(
      `INSERT INTO programs (id, title, weeks, modules)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, weeks = EXCLUDED.weeks, modules = EXCLUDED.modules`,
      [programId, programTitle, programWeeks ?? 0, JSON.stringify(modules ?? [])],
    );

    await db.query(
      `INSERT INTO students (id, full_name, photo, status)
       VALUES ($1, $2, $3, 'graduated')
       ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, photo = EXCLUDED.photo`,
      [studentId, studentName, studentPhoto ?? null],
    );

    await db.query(
      `INSERT INTO enrollments (student_id, program_id, enrolled_date)
       VALUES ($1, $2, $3)
       ON CONFLICT (student_id, program_id) DO NOTHING`,
      [studentId, programId, issueDate ?? null],
    );

    for (const a of assessments) {
      if (!a || !a.module) continue;
      await db.query(
        `INSERT INTO assessments (student_id, program_id, module, grade, score, assessed_date, assessor)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (student_id, program_id, module) DO UPDATE
           SET grade = EXCLUDED.grade, score = EXCLUDED.score,
               assessed_date = EXCLUDED.assessed_date, assessor = EXCLUDED.assessor`,
        [
          studentId,
          programId,
          a.module,
          a.grade ?? 'Competent',
          Number(a.score) || 0,
          a.assessedDate ?? issueDate ?? null,
          a.assessor ?? null,
        ],
      );
    }

    await db.query(
      `INSERT INTO certificates (id, token, student_id, program_id, issue_date, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status`,
      [id, String(token).toUpperCase(), studentId, programId, issueDate ?? '', status ?? 'valid'],
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('certificate sync error:', err);
    res.status(500).json({ error: 'Failed to save certificate.' });
  }
});

export { router as verifyRouter };
