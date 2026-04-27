const express = require('express');
const { body, validationResult } = require('express-validator');
const BodyMetric = require('../models/BodyMetric');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/metrics
router.get('/', auth, async (req, res) => {
  try {
    const metrics = await BodyMetric.find({ user_id: req.user.id })
      .sort({ recorded_at: -1 })
      .limit(90)
      .lean();
    
    res.json(metrics.map(m => ({ ...m, id: m._id })));
  } catch (err) {
    console.error('Get metrics error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/metrics
router.post('/', auth, async (req, res) => {
  const { weight_kg, body_fat_pct, chest_cm, waist_cm, hips_cm, recorded_at } = req.body;

  try {
    const metric = new BodyMetric({
      user_id: req.user.id,
      weight_kg,
      body_fat_pct,
      chest_cm,
      waist_cm,
      hips_cm,
      recorded_at: recorded_at || new Date()
    });

    await metric.save();
    
    const formattedMetric = metric.toObject();
    formattedMetric.id = formattedMetric._id;
    res.status(201).json(formattedMetric);
  } catch (err) {
    console.error('Create metric error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/metrics/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const metric = await BodyMetric.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
    if (!metric) {
      return res.status(404).json({ error: 'Metric not found' });
    }
    res.json({ message: 'Metric deleted successfully' });
  } catch (err) {
    console.error('Delete metric error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
