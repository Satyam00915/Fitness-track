const express = require('express');
const pool = require('../db/pool');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/stats/summary — weekly summary
router.get('/summary', auth, async (req, res) => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Weekly workouts count
    const workoutsResult = await pool.query(
      `SELECT COUNT(*) as count, 
        COALESCE(SUM(calories_burned), 0) as calories,
        COALESCE(SUM(duration_minutes), 0) as total_minutes
       FROM workouts 
       WHERE user_id = $1 AND completed_at >= $2`,
      [req.user.id, weekAgo]
    );

    // Weekly volume (total kg lifted)
    const volumeResult = await pool.query(
      `SELECT COALESCE(SUM(ws.weight_kg * ws.reps), 0) as total_volume
       FROM workout_sets ws
       JOIN workouts w ON ws.workout_id = w.id
       WHERE w.user_id = $1 AND w.completed_at >= $2`,
      [req.user.id, weekAgo]
    );

    // Streak calculation
    const streakResult = await pool.query(
      `SELECT DISTINCT DATE(completed_at) as workout_date
       FROM workouts
       WHERE user_id = $1 AND completed_at >= NOW() - INTERVAL '60 days'
       ORDER BY workout_date DESC`,
      [req.user.id]
    );

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = streakResult.rows.map(r => {
      const d = new Date(r.workout_date);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });

    let checkDate = today.getTime();
    for (const date of dates) {
      if (date === checkDate || date === checkDate - 86400000) {
        streak++;
        checkDate = date - 86400000;
      } else if (date < checkDate - 86400000) {
        break;
      }
    }

    res.json({
      workouts_this_week: parseInt(workoutsResult.rows[0].count),
      calories_this_week: Math.round(parseFloat(workoutsResult.rows[0].calories)),
      volume_this_week: Math.round(parseFloat(volumeResult.rows[0].total_volume)),
      current_streak: streak,
      total_minutes: parseInt(workoutsResult.rows[0].total_minutes),
    });
  } catch (err) {
    console.error('Stats summary error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats/progress — workout count per day last 30 days
router.get('/progress', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        DATE(completed_at) as date,
        COUNT(*) as count
       FROM workouts
       WHERE user_id = $1 AND completed_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(completed_at)
       ORDER BY date`,
      [req.user.id]
    );

    // Fill in missing days with 0
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const found = result.rows.find(r => r.date.toISOString().split('T')[0] === dateStr);
      data.push({ date: dateStr, count: found ? parseInt(found.count) : 0 });
    }

    res.json(data);
  } catch (err) {
    console.error('Stats progress error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats/personal-bests — max weight per exercise
router.get('/personal-bests', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        e.id as exercise_id,
        e.name as exercise_name,
        e.muscle_group,
        MAX(ws.weight_kg) as max_weight_kg,
        MAX(ws.reps) as max_reps,
        MAX(w.completed_at) as last_performed
       FROM workout_sets ws
       JOIN workouts w ON ws.workout_id = w.id
       JOIN exercises e ON ws.exercise_id = e.id
       WHERE w.user_id = $1 AND ws.weight_kg IS NOT NULL AND ws.weight_kg > 0
       GROUP BY e.id, e.name, e.muscle_group
       ORDER BY e.muscle_group, e.name`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Personal bests error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats/volume-trend — total kg lifted per week last 8 weeks
router.get('/volume-trend', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        DATE_TRUNC('week', w.completed_at) as week_start,
        COALESCE(SUM(ws.weight_kg * ws.reps), 0) as total_volume
       FROM workouts w
       LEFT JOIN workout_sets ws ON ws.workout_id = w.id
       WHERE w.user_id = $1 AND w.completed_at >= NOW() - INTERVAL '8 weeks'
       GROUP BY DATE_TRUNC('week', w.completed_at)
       ORDER BY week_start`,
      [req.user.id]
    );

    // Fill missing weeks
    const data = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekStr = weekStart.toISOString().split('T')[0];

      const found = result.rows.find(r => {
        const rWeek = new Date(r.week_start);
        rWeek.setDate(rWeek.getDate() - rWeek.getDay());
        return rWeek.toISOString().split('T')[0] === weekStr;
      });

      data.push({
        week: `W${8 - i}`,
        week_start: weekStr,
        total_volume: found ? Math.round(parseFloat(found.total_volume)) : 0
      });
    }

    res.json(data);
  } catch (err) {
    console.error('Volume trend error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
