const mongoose = require('mongoose');

const workoutSetSchema = new mongoose.Schema({
  exercise_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
  set_number: { type: Number },
  reps: { type: Number },
  weight_kg: { type: Number },
  duration_seconds: { type: Number },
  distance_km: { type: Number }
});

const workoutSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String },
  notes: { type: String },
  duration_minutes: { type: Number },
  calories_burned: { type: Number },
  completed_at: { type: Date, default: Date.now },
  sets: [workoutSetSchema]
});

module.exports = mongoose.model('Workout', workoutSchema);
