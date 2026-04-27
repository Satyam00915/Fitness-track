const express = require('express');
const { body, validationResult } = require('express-validator');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/workouts
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.*,
        COUNT(DISTINCT ws.exercise_id) as exercise_count,
        COUNT(ws.id) as set_count
       FROM workouts w
       LEFT JOIN workout_sets ws ON ws.workout_id = w.id
       WHERE w.user_id = $1
       GROUP BY w.id
       ORDER BY w.completed_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Get workouts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/workouts
router.post('/', auth, [
  body('title').optional().trim(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }

  const { title, notes, duration_minutes, calories_burned, completed_at, exercises } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const workoutResult = await client.query(
      `INSERT INTO workouts (user_id, title, notes, duration_minutes, calories_burned, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        req.user.id,
        title || 'Workout',
        notes || null,
        duration_minutes || null,
        calories_burned || null,
        completed_at || new Date()
      ]
    );

    const workout = workoutResult.rows[0];

    if (exercises && Array.isArray(exercises)) {
      for (const exercise of exercises) {
        if (exercise.sets && Array.isArray(exercise.sets)) {
          for (const set of exercise.sets) {
            await client.query(
              `INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg, duration_seconds, distance_km)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [
                workout.id,
                exercise.exercise_id,
                set.set_number,
                set.reps || null,
                set.weight_kg || null,
                set.duration_seconds || null,
                set.distance_km || null
              ]
            );
          }
        }
      }
    }

    await client.query('COMMIT');

    // Return full workout with sets
    const fullWorkout = await pool.query(
      `SELECT w.*, 
        json_agg(
          json_build_object(
            'id', ws.id,
            'exercise_id', ws.exercise_id,
            'exercise_name', e.name,
            'muscle_group', e.muscle_group,
            'set_number', ws.set_number,
            'reps', ws.reps,
            'weight_kg', ws.weight_kg,
            'duration_seconds', ws.duration_seconds,
            'distance_km', ws.distance_km
          ) ORDER BY e.name, ws.set_number
        ) FILTER (WHERE ws.id IS NOT NULL) as sets
       FROM workouts w
       LEFT JOIN workout_sets ws ON ws.workout_id = w.id
       LEFT JOIN exercises e ON ws.exercise_id = e.id
       WHERE w.id = $1
       GROUP BY w.id`,
      [workout.id]
    );

    res.status(201).json(fullWorkout.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Create workout error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// GET /api/workouts/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ws.id,
              'exercise_id', ws.exercise_id,
              'exercise_name', e.name,
              'muscle_group', e.muscle_group,
              'equipment', e.equipment,
              'set_number', ws.set_number,
              'reps', ws.reps,
              'weight_kg', ws.weight_kg,
              'duration_seconds', ws.duration_seconds,
              'distance_km', ws.distance_km
            ) ORDER BY e.name, ws.set_number
          ) FILTER (WHERE ws.id IS NOT NULL),
          '[]'
        ) as sets
       FROM workouts w
       LEFT JOIN workout_sets ws ON ws.workout_id = w.id
       LEFT JOIN exercises e ON ws.exercise_id = e.id
       WHERE w.id = $1 AND w.user_id = $2
       GROUP BY w.id`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get workout error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/workouts/:id
router.put('/:id', auth, async (req, res) => {
  const { title, notes, duration_minutes, calories_burned, exercises } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify ownership
    const existing = await client.query('SELECT id FROM workouts WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Workout not found' });
    }

    await client.query(
      `UPDATE workouts SET
        title = COALESCE($1, title),
        notes = COALESCE($2, notes),
        duration_minutes = COALESCE($3, duration_minutes),
        calories_burned = COALESCE($4, calories_burned)
       WHERE id = $5`,
      [title || null, notes || null, duration_minutes || null, calories_burned || null, req.params.id]
    );

    if (exercises && Array.isArray(exercises)) {
      // Delete existing sets and re-insert
      await client.query('DELETE FROM workout_sets WHERE workout_id = $1', [req.params.id]);

      for (const exercise of exercises) {
        if (exercise.sets && Array.isArray(exercise.sets)) {
          for (const set of exercise.sets) {
            await client.query(
              `INSERT INTO workout_sets (workout_id, exercise_id, set_number, reps, weight_kg, duration_seconds, distance_km)
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
              [req.params.id, exercise.exercise_id, set.set_number, set.reps || null, set.weight_kg || null, set.duration_seconds || null, set.distance_km || null]
            );
          }
        }
      }
    }

    await client.query('COMMIT');

    const updated = await pool.query(
      `SELECT w.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', ws.id, 'exercise_id', ws.exercise_id,
              'exercise_name', e.name, 'set_number', ws.set_number,
              'reps', ws.reps, 'weight_kg', ws.weight_kg,
              'duration_seconds', ws.duration_seconds, 'distance_km', ws.distance_km
            ) ORDER BY e.name, ws.set_number
          ) FILTER (WHERE ws.id IS NOT NULL),
          '[]'
        ) as sets
       FROM workouts w
       LEFT JOIN workout_sets ws ON ws.workout_id = w.id
       LEFT JOIN exercises e ON ws.exercise_id = e.id
       WHERE w.id = $1 GROUP BY w.id`,
      [req.params.id]
    );

    res.json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Update workout error:', err);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// DELETE /api/workouts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM workouts WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    res.json({ message: 'Workout deleted successfully' });
  } catch (err) {
    console.error('Delete workout error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
