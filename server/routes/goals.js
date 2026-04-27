const express = require('express');
const { body, validationResult } = require('express-validator');
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/goals
router.get('/', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ user_id: req.user.id })
      .sort({ is_completed: 1, created_at: -1 })
      .lean();
    
    res.json(goals.map(g => ({ ...g, id: g._id })));
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
    const goal = new Goal({
      user_id: req.user.id,
      type,
      description,
      target_value,
      current_value: current_value || 0,
      unit,
      deadline
    });

    await goal.save();
    
    const formattedGoal = goal.toObject();
    formattedGoal.id = formattedGoal._id;
    res.status(201).json(formattedGoal);
  } catch (err) {
    console.error('Create goal error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/goals/:id
router.put('/:id', auth, async (req, res) => {
  const { description, target_value, current_value, unit, deadline, is_completed } = req.body;

  try {
    const goal = await Goal.findOne({ _id: req.params.id, user_id: req.user.id });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    if (description !== undefined) goal.description = description;
    if (target_value !== undefined) goal.target_value = target_value;
    if (current_value !== undefined) goal.current_value = current_value;
    if (unit !== undefined) goal.unit = unit;
    if (deadline !== undefined) goal.deadline = deadline;
    if (is_completed !== undefined) goal.is_completed = is_completed;

    await goal.save();
    
    const formattedGoal = goal.toObject();
    formattedGoal.id = formattedGoal._id;
    res.json(formattedGoal);
  } catch (err) {
    console.error('Update goal error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/goals/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }
    res.json({ message: 'Goal deleted successfully' });
  } catch (err) {
    console.error('Delete goal error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
