const express = require('express');
const mongoose = require('mongoose');
const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/stats/summary — weekly summary
router.get('/summary', auth, async (req, res) => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const userId = new mongoose.Types.ObjectId(req.user.id);

    // Weekly workouts count, calories, duration and volume
    const weeklyStats = await Workout.aggregate([
      { $match: { user_id: userId, completed_at: { $gte: weekAgo } } },
      { 
        $project: {
          calories_burned: 1,
          duration_minutes: 1,
          sets: 1
        }
      },
      {
        $group: {
          _id: null,
          count: { $sum: 1 },
          calories: { $sum: '$calories_burned' },
          total_minutes: { $sum: '$duration_minutes' },
          sets_array: { $push: '$sets' }
        }
      }
    ]);

    let volume_this_week = 0;
    let workouts_this_week = 0;
    let calories_this_week = 0;
    let total_minutes = 0;

    if (weeklyStats.length > 0) {
      workouts_this_week = weeklyStats[0].count;
      calories_this_week = weeklyStats[0].calories || 0;
      total_minutes = weeklyStats[0].total_minutes || 0;
      
      weeklyStats[0].sets_array.forEach(sets => {
        sets.forEach(set => {
          if (set.weight_kg && set.reps) {
            volume_this_week += (set.weight_kg * set.reps);
          }
        });
      });
    }

    // Streak calculation
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

    const workouts = await Workout.find({ 
      user_id: userId, 
      completed_at: { $gte: sixtyDaysAgo } 
    }).sort({ completed_at: -1 }).select('completed_at').lean();

    const dates = [...new Set(workouts.map(w => {
      const d = new Date(w.completed_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }))].sort((a, b) => b - a); // Descending

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

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
      workouts_this_week,
      calories_this_week: Math.round(calories_this_week),
      volume_this_week: Math.round(volume_this_week),
      current_streak: streak,
      total_minutes: Math.round(total_minutes),
    });
  } catch (err) {
    console.error('Stats summary error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats/progress — workout count per day last 30 days
router.get('/progress', auth, async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const workouts = await Workout.aggregate([
      { $match: { user_id: userId, completed_at: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$completed_at" } },
          count: { $sum: 1 }
        }
      }
    ]);

    const workoutMap = {};
    workouts.forEach(w => {
      workoutMap[w._id] = w.count;
    });

    const data = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      data.push({ date: dateStr, count: workoutMap[dateStr] || 0 });
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
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const bests = await Workout.aggregate([
      { $match: { user_id: userId } },
      { $unwind: "$sets" },
      { $match: { "sets.weight_kg": { $gt: 0 } } },
      {
        $group: {
          _id: "$sets.exercise_id",
          max_weight_kg: { $max: "$sets.weight_kg" },
          max_reps: { $max: "$sets.reps" },
          last_performed: { $max: "$completed_at" }
        }
      },
      {
        $lookup: {
          from: "exercises",
          localField: "_id",
          foreignField: "_id",
          as: "exercise"
        }
      },
      { $unwind: "$exercise" },
      {
        $project: {
          _id: 0,
          exercise_id: "$_id",
          exercise_name: "$exercise.name",
          muscle_group: "$exercise.muscle_group",
          max_weight_kg: 1,
          max_reps: 1,
          last_performed: 1
        }
      },
      { $sort: { muscle_group: 1, exercise_name: 1 } }
    ]);

    res.json(bests);
  } catch (err) {
    console.error('Personal bests error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/stats/volume-trend — total kg lifted per week last 8 weeks
router.get('/volume-trend', auth, async (req, res) => {
  try {
    const eightWeeksAgo = new Date();
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);
    eightWeeksAgo.setHours(0, 0, 0, 0);

    const userId = new mongoose.Types.ObjectId(req.user.id);

    const workouts = await Workout.aggregate([
      { $match: { user_id: userId, completed_at: { $gte: eightWeeksAgo } } },
      { $unwind: "$sets" },
      {
        $project: {
          completed_at: 1,
          volume: { $multiply: [{ $ifNull: ["$sets.weight_kg", 0] }, { $ifNull: ["$sets.reps", 0] }] }
        }
      }
    ]);

    // Calculate in memory to handle week boundaries correctly
    const weekMap = {};
    workouts.forEach(w => {
      const d = new Date(w.completed_at);
      d.setDate(d.getDate() - d.getDay()); // Start of week (Sunday)
      d.setHours(0, 0, 0, 0);
      const weekStr = d.toISOString().split('T')[0];
      
      if (!weekMap[weekStr]) weekMap[weekStr] = 0;
      weekMap[weekStr] += w.volume;
    });

    const data = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (i * 7));
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekStr = weekStart.toISOString().split('T')[0];

      data.push({
        week: `W${8 - i}`,
        week_start: weekStr,
        total_volume: Math.round(weekMap[weekStr] || 0)
      });
    }

    res.json(data);
  } catch (err) {
    console.error('Volume trend error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
