const express = require('express');
const { body, validationResult } = require('express-validator');
const Workout = require('../models/Workout');
const Exercise = require('../models/Exercise');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper function to format workout with populated exercises
const formatWorkout = (w) => {
  const sets = w.sets.map(s => ({
    id: s._id,
    exercise_id: s.exercise_id ? (s.exercise_id._id || s.exercise_id) : null,
    exercise_name: s.exercise_id ? s.exercise_id.name : null,
    muscle_group: s.exercise_id ? s.exercise_id.muscle_group : null,
    equipment: s.exercise_id ? s.exercise_id.equipment : null,
    set_number: s.set_number,
    reps: s.reps,
    weight_kg: s.weight_kg,
    duration_seconds: s.duration_seconds,
    distance_km: s.distance_km
  })).sort((a, b) => {
    if (a.exercise_name === b.exercise_name) {
      return a.set_number - b.set_number;
    }
    return (a.exercise_name || '').localeCompare(b.exercise_name || '');
  });

  const uniqueExercises = new Set(w.sets.map(s => s.exercise_id ? (s.exercise_id._id || s.exercise_id).toString() : null));
  
  return {
    ...w,
    id: w._id,
    sets,
    exercise_count: uniqueExercises.size,
    set_count: w.sets.length
  };
};

// GET /api/workouts
router.get('/', auth, async (req, res) => {
  try {
    const workouts = await Workout.find({ user_id: req.user.id })
      .populate('sets.exercise_id', 'name muscle_group')
      .sort({ completed_at: -1 })
      .lean();
    
    res.json(workouts.map(formatWorkout));
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

  try {
    let setsToInsert = [];
    if (exercises && Array.isArray(exercises)) {
      for (const exercise of exercises) {
        if (exercise.sets && Array.isArray(exercise.sets)) {
          for (const set of exercise.sets) {
            setsToInsert.push({
              exercise_id: exercise.exercise_id,
              set_number: set.set_number,
              reps: set.reps,
              weight_kg: set.weight_kg,
              duration_seconds: set.duration_seconds,
              distance_km: set.distance_km
            });
          }
        }
      }
    }

    const newWorkout = new Workout({
      user_id: req.user.id,
      title: title || 'Workout',
      notes,
      duration_minutes,
      calories_burned,
      completed_at: completed_at || new Date(),
      sets: setsToInsert
    });

    await newWorkout.save();
    
    const populatedWorkout = await Workout.findById(newWorkout._id)
      .populate('sets.exercise_id', 'name muscle_group')
      .lean();

    res.status(201).json(formatWorkout(populatedWorkout));
  } catch (err) {
    console.error('Create workout error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/workouts/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const workout = await Workout.findOne({ _id: req.params.id, user_id: req.user.id })
      .populate('sets.exercise_id', 'name muscle_group equipment')
      .lean();

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    res.json(formatWorkout(workout));
  } catch (err) {
    console.error('Get workout error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/workouts/:id
router.put('/:id', auth, async (req, res) => {
  const { title, notes, duration_minutes, calories_burned, exercises } = req.body;

  try {
    const workout = await Workout.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    if (title !== undefined) workout.title = title;
    if (notes !== undefined) workout.notes = notes;
    if (duration_minutes !== undefined) workout.duration_minutes = duration_minutes;
    if (calories_burned !== undefined) workout.calories_burned = calories_burned;

    if (exercises && Array.isArray(exercises)) {
      let setsToInsert = [];
      for (const exercise of exercises) {
        if (exercise.sets && Array.isArray(exercise.sets)) {
          for (const set of exercise.sets) {
            setsToInsert.push({
              exercise_id: exercise.exercise_id,
              set_number: set.set_number,
              reps: set.reps,
              weight_kg: set.weight_kg,
              duration_seconds: set.duration_seconds,
              distance_km: set.distance_km
            });
          }
        }
      }
      workout.sets = setsToInsert;
    }

    await workout.save();

    const populatedWorkout = await Workout.findById(workout._id)
      .populate('sets.exercise_id', 'name muscle_group equipment')
      .lean();

    res.json(formatWorkout(populatedWorkout));
  } catch (err) {
    console.error('Update workout error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/workouts/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const workout = await Workout.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }
    res.json({ message: 'Workout deleted successfully' });
  } catch (err) {
    console.error('Delete workout error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
