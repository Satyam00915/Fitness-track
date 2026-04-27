const express = require('express');
const { body, validationResult } = require('express-validator');
const Exercise = require('../models/Exercise');
const Workout = require('../models/Workout');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/exercises — list all with optional search
router.get('/', async (req, res) => {
  const { q, muscle } = req.query;
  try {
    let query = {};

    if (q) {
      query.name = { $regex: new RegExp(q, 'i') };
    }

    if (muscle && muscle !== 'all') {
      query.muscle_group = muscle;
    }

    const exercises = await Exercise.find(query)
      .populate('created_by', 'name')
      .sort({ is_custom: 1, muscle_group: 1, name: 1 })
      .lean();

    const formattedExercises = exercises.map(ex => ({
      ...ex,
      id: ex._id,
      created_by_name: ex.created_by ? ex.created_by.name : null,
      created_by: ex.created_by ? ex.created_by._id : null
    }));

    res.json(formattedExercises);
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
    const exercise = new Exercise({
      name,
      muscle_group,
      equipment,
      description,
      is_custom: true,
      created_by: req.user.id
    });
    
    await exercise.save();
    
    const formattedExercise = exercise.toObject();
    formattedExercise.id = formattedExercise._id;
    
    res.status(201).json(formattedExercise);
  } catch (err) {
    console.error('Create exercise error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/exercises/:id/history — exercise usage history for current user
router.get('/:id/history', auth, async (req, res) => {
  try {
    const workouts = await Workout.find({ 
      user_id: req.user.id,
      'sets.exercise_id': req.params.id 
    })
    .sort({ completed_at: -1 })
    .limit(20)
    .lean();

    let history = [];
    workouts.forEach(workout => {
      workout.sets.forEach(set => {
        if (set.exercise_id && set.exercise_id.toString() === req.params.id) {
          history.push({
            id: set._id,
            workout_id: workout._id,
            exercise_id: set.exercise_id,
            set_number: set.set_number,
            reps: set.reps,
            weight_kg: set.weight_kg,
            duration_seconds: set.duration_seconds,
            distance_km: set.distance_km,
            completed_at: workout.completed_at,
            title: workout.title
          });
        }
      });
    });

    res.json(history);
  } catch (err) {
    console.error('Exercise history error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
