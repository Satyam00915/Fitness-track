const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String },
  description: { type: String },
  target_value: { type: Number },
  current_value: { type: Number, default: 0 },
  unit: { type: String },
  deadline: { type: Date },
  is_completed: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Goal', goalSchema);
