import { Router } from 'express';
import db from './db.js';
import { requireAuth } from './auth.js';

const router = Router();

// List all training sessions, optionally filtered by student.
router.get('/sessions', requireAuth, async (req, res) => {
  const { studentId } = req.query;
  try {
    if (studentId) {
      const { rows } = await db.query(
        'SELECT * FROM training_sessions WHERE student_id = $1 ORDER BY session_date DESC, created_at DESC',
        [String(studentId)],
      );
      return res.json({ sessions: rows });
    }
    const { rows } = await db.query(
      'SELECT * FROM training_sessions ORDER BY session_date DESC, created_at DESC',
    );
    res.json({ sessions: rows });
  } catch (err) {
    console.error('list sessions error:', err);
    res.status(500).json({ error: 'Failed to load training sessions.' });
  }
});

// Get sessions for a single student + program.
router.get('/sessions/student/:studentId', requireAuth, async (req, res) => {
  const { studentId } = req.params;
  const { programId } = req.query;
  try {
    const params = [];
    let sql = 'SELECT * FROM training_sessions WHERE student_id = $1';
    params.push(studentId);
    if (programId) {
      params.push(String(programId));
      sql += ` AND program_id = $${params.length}`;
    }
    sql += ' ORDER BY session_date DESC, created_at DESC';
    const { rows } = await db.query(sql, params);
    res.json({ sessions: rows });
  } catch (err) {
    console.error('student sessions error:', err);
    res.status(500).json({ error: 'Failed to load training sessions.' });
  }
});

// Create a training session (record daily marks).
router.post('/sessions', requireAuth, async (req, res) => {
  const { studentId, programId, module, sessionDate, workType, score, notes, assessor } = req.body || {};
  if (!studentId || !programId || !module || !sessionDate) {
    return res.status(400).json({ error: 'Student, program, module and date are required.' });
  }
  const type = workType === 'practical' || workType === 'both' ? workType : 'theory';
  const s = Math.max(0, Math.min(100, Number(score) || 0));
  try {
    const { rows } = await db.query(
      `INSERT INTO training_sessions
         (student_id, program_id, module, session_date, work_type, score, notes, assessor)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [studentId, programId, module, sessionDate, type, s, notes ?? null, assessor ?? null],
    );
    res.status(201).json({ session: rows[0] });
  } catch (err) {
    console.error('create session error:', err);
    res.status(500).json({ error: 'Failed to record training session.' });
  }
});

// Update a training session.
router.put('/sessions/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { module, sessionDate, workType, score, notes, assessor } = req.body || {};
  try {
    const type = workType ? (workType === 'practical' || workType === 'both' ? workType : 'theory') : undefined;
    const s = score !== undefined ? Math.max(0, Math.min(100, Number(score) || 0)) : undefined;
    const { rows } = await db.query(
      `UPDATE training_sessions SET
         module = COALESCE($2, module),
         session_date = COALESCE($3, session_date),
         work_type = COALESCE($4, work_type),
         score = COALESCE($5, score),
         notes = COALESCE($6, notes),
         assessor = COALESCE($7, assessor)
       WHERE id = $1 RETURNING *`,
      [id, module ?? null, sessionDate ?? null, type ?? null, s ?? null, notes ?? null, assessor ?? null],
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Session not found.' });
    res.json({ session: rows[0] });
  } catch (err) {
    console.error('update session error:', err);
    res.status(500).json({ error: 'Failed to update training session.' });
  }
});

// Delete a training session.
router.delete('/sessions/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await db.query(
      'DELETE FROM training_sessions WHERE id = $1 RETURNING *',
      [id],
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Session not found.' });
    res.json({ ok: true });
  } catch (err) {
    console.error('delete session error:', err);
    res.status(500).json({ error: 'Failed to delete training session.' });
  }
});

export { router as sessionsRouter };
