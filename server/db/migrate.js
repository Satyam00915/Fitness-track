const pool = require('./pool');

const migrations = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  age INT,
  height_cm FLOAT,
  weight_kg FLOAT,
  fitness_goal VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exercises table
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(150) NOT NULL,
  muscle_group VARCHAR(80),
  equipment VARCHAR(80),
  description TEXT,
  is_custom BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Workouts table
CREATE TABLE IF NOT EXISTS workouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(150),
  notes TEXT,
  duration_minutes INT,
  calories_burned INT,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workout sets table
CREATE TABLE IF NOT EXISTS workout_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE SET NULL,
  set_number INT,
  reps INT,
  weight_kg FLOAT,
  duration_seconds INT,
  distance_km FLOAT
);

-- Body metrics table
CREATE TABLE IF NOT EXISTS body_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  weight_kg FLOAT,
  body_fat_pct FLOAT,
  chest_cm FLOAT,
  waist_cm FLOAT,
  hips_cm FLOAT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(80),
  description TEXT,
  target_value FLOAT,
  current_value FLOAT DEFAULT 0,
  unit VARCHAR(40),
  deadline DATE,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Running migrations...');
    await client.query(migrations);
    console.log('✅ Migrations completed successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(err => {
  console.error(err);
  process.exit(1);
});
