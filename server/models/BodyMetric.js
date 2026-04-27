const mongoose = require('mongoose');

const bodyMetricSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  weight_kg: { type: Number },
  body_fat_pct: { type: Number },
  chest_cm: { type: Number },
  waist_cm: { type: Number },
  hips_cm: { type: Number },
  recorded_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('BodyMetric', bodyMetricSchema);
