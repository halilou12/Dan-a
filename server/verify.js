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

const mapStudent = (r) => ({
  id: r.id,
  fullName: r.full_name,
  nationalId: r.national_id ?? '',
  dob: r.dob ?? '',
  email: r.email ?? '',
  phone: r.phone ?? '',
  photo: r.photo ?? null,
  status: r.status,
  createdAt: r.created_at ?? '',
});

// Admin-only: fetch the full shared dataset (all records that every admin
// sees). Returns the snapshot plus a flag so the client knows whether the
// server is authoritative yet or still needs its first baseline.
router.get('/admin/data', requireAuth, async (_req, res) => {
  try {
    await seedPrograms();
    const [students, enrollments, assessments, certificates, meta] = await Promise.all([
      db.query('SELECT * FROM students ORDER BY id'),
      db.query(
        'SELECT student_id, program_id, enrolled_date FROM enrollments ORDER BY student_id, program_id',
      ),
      db.query(
        `SELECT id, student_id, program_id, module, grade, score, assessed_date, assessor
         FROM assessments ORDER BY student_id, module`,
      ),
      db.query(
        `SELECT id, token, student_id, program_id, issue_date, status, revoked_date, revoked_reason
         FROM certificates ORDER BY issue_date`,
      ),
      db.query('SELECT value FROM app_meta WHERE key = $1', ['gallery']),
    ]);

    const galleryRows = meta.rows;
    res.json({
      serverHasData: students.rows.length > 0,
      students: students.rows.map(mapStudent),
      enrollments: enrollments.rows.map((r) => ({
        studentId: r.student_id,
        programId: r.program_id,
        enrolledDate: r.enrolled_date ?? '',
      })),
      assessments: assessments.rows.map((r) => ({
        id: String(r.id),
        studentId: r.student_id,
        programId: r.program_id,
        module: r.module,
        grade: r.grade,
        score: r.score,
        assessedDate: r.assessed_date ?? '',
        assessor: r.assessor ?? '',
      })),
      certificates: certificates.rows.map((r) => ({
        id: r.id,
        studentId: r.student_id,
        programId: r.program_id,
        token: r.token,
        issueDate: r.issue_date,
        status: r.status,
        revokedDate: r.revoked_date ?? undefined,
        revokedReason: r.revoked_reason ?? undefined,
      })),
      gallery: galleryRows.length > 0 && Array.isArray(galleryRows[0].value)
        ? galleryRows[0].value
        : [],
      counters: { student: students.rows.length, cert: certificates.rows.length },
    });
  } catch (err) {
    console.error('fetch shared data error:', err);
    res.status(500).json({ error: 'Failed to load shared data.' });
  }
});

// Admin-only: replace the shared dataset with the incoming snapshot. The whole
// set is written inside one transaction (last push wins), so every admin sees
// the records that were just changed by their teammate.
router.post('/admin/data', requireAuth, async (req, res) => {
  const body = req.body || {};
  const students = Array.isArray(body.students) ? body.students : [];
  const enrollments = Array.isArray(body.enrollments) ? body.enrollments : [];
  const assessments = Array.isArray(body.assessments) ? body.assessments : [];
  const certificates = Array.isArray(body.certificates) ? body.certificates : [];
  const gallery = Array.isArray(body.gallery) ? body.gallery : [];

  const client = await db.connect();
  try {
    await client.query('BEGIN');

    for (const p of PROGRAMS) {
      await client.query(
        `INSERT INTO programs (id, title, weeks, modules)
         VALUES ($1, $2, $3, $4::jsonb)
         ON CONFLICT (id) DO UPDATE
           SET title = EXCLUDED.title, weeks = EXCLUDED.weeks, modules = EXCLUDED.modules`,
        [p.id, p.title, p.weeks, JSON.stringify(p.modules)],
      );
    }

    // Replace every record (cascade also clears enrollments, assessments and
    // certificates), then rebuild from this snapshot.
    await client.query('TRUNCATE students CASCADE');

    for (const s of students) {
      if (!s || !s.id) continue;
      await client.query(
        `INSERT INTO students (id, full_name, national_id, dob, email, phone, photo, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE
           SET full_name = EXCLUDED.full_name, national_id = EXCLUDED.national_id,
               dob = EXCLUDED.dob, email = EXCLUDED.email, phone = EXCLUDED.phone,
               photo = EXCLUDED.photo, status = EXCLUDED.status, created_at = EXCLUDED.created_at`,
        [
          s.id,
          s.fullName ?? '',
          s.nationalId ?? '',
          s.dob ?? '',
          s.email ?? '',
          s.phone ?? '',
          s.photo ?? null,
          s.status ?? 'active',
          s.createdAt ?? '',
        ],
      );
    }

    for (const e of enrollments) {
      if (!e || !e.studentId || !e.programId) continue;
      await client.query(
        `INSERT INTO enrollments (student_id, program_id, enrolled_date)
         VALUES ($1, $2, $3)
         ON CONFLICT (student_id, program_id) DO UPDATE SET enrolled_date = EXCLUDED.enrolled_date`,
        [e.studentId, e.programId, e.enrolledDate ?? ''],
      );
    }

    for (const a of assessments) {
      if (!a || !a.studentId || !a.programId || !a.module) continue;
      await client.query(
        `INSERT INTO assessments (student_id, program_id, module, grade, score, assessed_date, assessor)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (student_id, program_id, module) DO UPDATE
           SET grade = EXCLUDED.grade, score = EXCLUDED.score,
               assessed_date = EXCLUDED.assessed_date, assessor = EXCLUDED.assessor`,
        [
          a.studentId,
          a.programId,
          a.module,
          a.grade ?? 'Competent',
          Number(a.score) || 0,
          a.assessedDate ?? '',
          a.assessor ?? '',
        ],
      );
    }

    for (const c of certificates) {
      if (!c || !c.id || !c.token) continue;
      await client.query(
        `INSERT INTO certificates (id, token, student_id, program_id, issue_date, status, revoked_date, revoked_reason)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE
           SET token = EXCLUDED.token, status = EXCLUDED.status,
               revoked_date = EXCLUDED.revoked_date, revoked_reason = EXCLUDED.revoked_reason`,
        [
          c.id,
          String(c.token).toUpperCase(),
          c.studentId ?? '',
          c.programId ?? '',
          c.issueDate ?? '',
          c.status ?? 'valid',
          c.revokedDate ?? null,
          c.revokedReason ?? null,
        ],
      );
    }

    await client.query(
      `INSERT INTO app_meta (key, value) VALUES ($1, $2::jsonb)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      ['gallery', JSON.stringify(gallery)],
    );

    await client.query('COMMIT');
    res.status(201).json({
      ok: true,
      counts: {
        students: students.length,
        enrollments: enrollments.length,
        assessments: assessments.length,
        certificates: certificates.length,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('push shared data error:', err);
    res.status(500).json({ error: 'Failed to save shared data.' });
  } finally {
    client.release();
  }
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

    await db.query(
      `INSERT INTO activity_logs (user_id, username, action, entity_type, entity_id, detail)
       VALUES ($1, $2, 'issue_certificate', 'certificate', $3, $4::jsonb)`,
      [
        req.user.sub ?? null,
        req.user.username ?? null,
        String(id),
        JSON.stringify({ student: studentName, program: programTitle }),
      ],
    );

    res.status(201).json({ ok: true });
  } catch (err) {
    console.error('certificate sync error:', err);
    res.status(500).json({ error: 'Failed to save certificate.' });
  }
});

// Admin-only: permanently delete a student. Foreign-key cascades remove their
// enrollments, assessments and certificates, so their QR stops verifying.
router.delete('/admin/students/:id', requireAuth, async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const { rowCount } = await db.query('DELETE FROM students WHERE id = $1', [id]);
    if (rowCount === 0) return res.status(404).json({ error: 'Student not found.' });
    await db.query(
      `INSERT INTO activity_logs (user_id, username, action, entity_type, entity_id, detail)
       VALUES ($1, $2, 'delete_student', 'student', $3, $4::jsonb)`,
      [
        req.user.sub ?? null,
        req.user.username ?? null,
        id,
        JSON.stringify({ note: 'Permanently deleted with cascade' }),
      ],
    );
    res.json({ ok: true });
  } catch (err) {
    console.error('delete student error:', err);
    res.status(500).json({ error: 'Failed to delete student.' });
  }
});

// Register a single student without truncating the whole shared dataset.
// This makes registration reliable for a multi-admin team: it writes (or
// upserts) just this one record instead of relying on a full snapshot push.
router.post('/admin/students', requireAuth, async (req, res) => {
  const { id, fullName, nationalId, dob, email, phone, photo, status, createdAt } = req.body || {};
  if (!id || !fullName) {
    return res.status(400).json({ error: 'Student id and full name are required.' });
  }
  try {
    await db.query(
      `INSERT INTO students (id, full_name, national_id, dob, email, phone, photo, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       ON CONFLICT (id) DO UPDATE
         SET full_name = EXCLUDED.full_name, national_id = EXCLUDED.national_id,
             dob = EXCLUDED.dob, email = EXCLUDED.email, phone = EXCLUDED.phone,
             photo = EXCLUDED.photo, status = EXCLUDED.status, created_at = EXCLUDED.created_at`,
      [
        String(id),
        String(fullName),
        nationalId ?? null,
        dob ?? null,
        email ?? null,
        phone ?? null,
        photo ?? null,
        (status || 'active'),
        createdAt ?? new Date().toISOString().slice(0, 10),
      ],
    );
    await db.query(
      `INSERT INTO activity_logs (user_id, username, action, entity_type, entity_id, detail)
       VALUES ($1, $2, 'register_student', 'student', $3, $4::jsonb)`,
      [
        req.user.sub ?? null,
        req.user.username ?? null,
        String(id),
        JSON.stringify({ fullName }),
      ],
    );
    res.status(201).json({ ok: true, id: String(id) });
  } catch (err) {
    console.error('register student error:', err);
    res.status(500).json({ error: 'Failed to register student.' });
  }
});

export { router as verifyRouter };
