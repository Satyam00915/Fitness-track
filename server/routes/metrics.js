const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/metrics
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM body_metrics WHERE user_id = $1 ORDER BY recorded_at DESC LIMIT 90`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get metrics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/metrics
router.post('/', auth, async (req, res) => {
  const { weight_kg, body_fat_pct, chest_cm, waist_cm, hips_cm, recorded_at } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO body_metrics (user_id, weight_kg, body_fat_pct, chest_cm, waist_cm, hips_cm, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [req.user.id, weight_kg || null, body_fat_pct || null, chest_cm || null, waist_cm || null, hips_cm || null, recorded_at || new Date()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create metric error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/metrics/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM body_metrics WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Metric not found' });
    }
    res.json({ message: 'Metric deleted successfully' });
  } catch (err) {
    console.error('Delete metric error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
