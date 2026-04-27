const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { name, email, password, age, height_cm, weight_kg, fitness_goal } = req.body;

  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, age, height_cm, weight_kg, fitness_goal)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, name, email, age, height_cm, weight_kg, fitness_goal, created_at`,
      [name, email, password_hash, age || null, height_cm || null, weight_kg || null, fitness_goal || null]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
    const { password_hash, ...safeUser } = user;

    res.json({ token, user: safeUser });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, email, age, height_cm, weight_kg, fitness_goal, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/auth/profile
router.put('/profile', auth, [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { name, email, age, height_cm, weight_kg, fitness_goal, old_password, new_password } = req.body;

  try {
    // If changing password
    if (new_password) {
      if (!old_password) {
        return res.status(400).json({ error: 'Old password is required to change password' });
      }
      const userResult = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
      const valid = await bcrypt.compare(old_password, userResult.rows[0].password_hash);
      if (!valid) {
        return res.status(400).json({ error: 'Old password is incorrect' });
      }
      const newHash = await bcrypt.hash(new_password, 10);
      await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHash, req.user.id]);
    }

    const result = await pool.query(
      `UPDATE users SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        age = COALESCE($3, age),
        height_cm = COALESCE($4, height_cm),
        weight_kg = COALESCE($5, weight_kg),
        fitness_goal = COALESCE($6, fitness_goal)
       WHERE id = $7
       RETURNING id, name, email, age, height_cm, weight_kg, fitness_goal, created_at`,
      [name || null, email || null, age || null, height_cm || null, weight_kg || null, fitness_goal || null, req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/auth/account
router.delete('/account', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
