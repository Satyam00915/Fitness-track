const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/exercises — list all with optional search
router.get('/', async (req, res) => {
  const { q, muscle } = req.query;
  try {
    let query = `
      SELECT e.*, u.name as created_by_name
      FROM exercises e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      params.push(`%${q}%`);
      query += ` AND LOWER(e.name) LIKE LOWER($${params.length})`;
    }

    if (muscle && muscle !== 'all') {
      params.push(muscle);
      query += ` AND e.muscle_group = $${params.length}`;
    }

    query += ' ORDER BY e.is_custom, e.muscle_group, e.name';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get exercises error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/exercises — create custom exercise
router.post('/', auth, [
  body('name').trim().notEmpty().withMessage('Exercise name is required'),
  body('muscle_group').notEmpty().withMessage('Muscle group is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { name, muscle_group, equipment, description } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO exercises (name, muscle_group, equipment, description, is_custom, created_by)
       VALUES ($1, $2, $3, $4, true, $5)
       RETURNING *`,
      [name, muscle_group, equipment || null, description || null, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create exercise error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/exercises/:id/history — exercise usage history for current user
router.get('/:id/history', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT ws.*, w.completed_at, w.title
       FROM workout_sets ws
       JOIN workouts w ON ws.workout_id = w.id
       WHERE ws.exercise_id = $1 AND w.user_id = $2
       ORDER BY w.completed_at DESC
       LIMIT 20`,
      [req.params.id, req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Exercise history error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
