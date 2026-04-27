const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/goals
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM goals WHERE user_id = $1 ORDER BY is_completed, created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get goals error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/goals
router.post('/', auth, [
  body('type').notEmpty().withMessage('Goal type is required'),
  body('target_value').isNumeric().withMessage('Target value must be a number'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { type, description, target_value, current_value, unit, deadline } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO goals (user_id, type, description, target_value, current_value, unit, deadline)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, type, description || null, target_value, current_value || 0, unit || null, deadline || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create goal error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/goals/:id
router.put('/:id', auth, async (req, res) => {
  const { description, target_value, current_value, unit, deadline, is_completed } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM goals WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    const result = await pool.query(
      `UPDATE goals SET
        description = COALESCE($1, description),
        target_value = COALESCE($2, target_value),
        current_value = COALESCE($3, current_value),
        unit = COALESCE($4, unit),
        deadline = COALESCE($5, deadline),
        is_completed = COALESCE($6, is_completed)
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [description || null, target_value || null, current_value !== undefined ? current_value : null, unit || null, deadline || null, is_completed !== undefined ? is_completed : null, req.params.id, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update goal error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/goals/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json({ message: 'Goal deleted successfully' });
  } catch (err) {
    console.error('Delete goal error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
