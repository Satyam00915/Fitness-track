const pool = require('./pool');

const exercises = [
  // Chest
  { name: 'Barbell Bench Press', muscle_group: 'chest', equipment: 'barbell', description: 'Lie on a flat bench and press a barbell upward from chest level. Classic compound chest exercise.' },
  { name: 'Incline Dumbbell Press', muscle_group: 'chest', equipment: 'dumbbell', description: 'Press dumbbells upward on an incline bench, targeting the upper chest.' },
  { name: 'Dumbbell Flyes', muscle_group: 'chest', equipment: 'dumbbell', description: 'Lie on a flat bench and arc dumbbells outward then inward to stretch and contract the chest.' },
  { name: 'Push-Up', muscle_group: 'chest', equipment: 'bodyweight', description: 'Classic bodyweight exercise targeting chest, triceps, and shoulders.' },
  { name: 'Cable Chest Fly', muscle_group: 'chest', equipment: 'machine', description: 'Using cable machine to perform chest fly motion with constant tension.' },

  // Back
  { name: 'Deadlift', muscle_group: 'back', equipment: 'barbell', description: 'Lift a barbell from the floor to hip level. King of all compound lifts targeting full posterior chain.' },
  { name: 'Pull-Up', muscle_group: 'back', equipment: 'bodyweight', description: 'Hang from a bar and pull yourself up until chin is above the bar. Excellent back width builder.' },
  { name: 'Barbell Row', muscle_group: 'back', equipment: 'barbell', description: 'Hinge at the hips and row a barbell to your lower chest, targeting mid back thickness.' },
  { name: 'Lat Pulldown', muscle_group: 'back', equipment: 'machine', description: 'Pull a cable bar down to chest level targeting the latissimus dorsi muscles.' },
  { name: 'Seated Cable Row', muscle_group: 'back', equipment: 'machine', description: 'Sit and pull a cable handle to your midsection, targeting mid-back muscles.' },
  { name: 'Dumbbell Row', muscle_group: 'back', equipment: 'dumbbell', description: 'One arm at a time, row a dumbbell to your hip while braced on a bench.' },

  // Legs
  { name: 'Barbell Squat', muscle_group: 'legs', equipment: 'barbell', description: 'Place barbell on traps, squat down until thighs parallel to floor. The king of leg exercises.' },
  { name: 'Romanian Deadlift', muscle_group: 'legs', equipment: 'barbell', description: 'Hip hinge movement with slight knee bend targeting hamstrings and glutes.' },
  { name: 'Leg Press', muscle_group: 'legs', equipment: 'machine', description: 'Push a weighted platform away with your feet while seated in the leg press machine.' },
  { name: 'Walking Lunges', muscle_group: 'legs', equipment: 'dumbbell', description: 'Step forward into a lunge alternating legs while holding dumbbells.' },
  { name: 'Leg Curl', muscle_group: 'legs', equipment: 'machine', description: 'Curl your legs against resistance from a lying or seated position, targeting hamstrings.' },
  { name: 'Calf Raise', muscle_group: 'legs', equipment: 'machine', description: 'Rise on toes against resistance to target the calf muscles.' },
  { name: 'Bulgarian Split Squat', muscle_group: 'legs', equipment: 'dumbbell', description: 'Rear foot elevated lunge variation that targets quads and glutes with high intensity.' },

  // Shoulders
  { name: 'Overhead Press', muscle_group: 'shoulders', equipment: 'barbell', description: 'Press a barbell overhead from shoulder height. Primary overhead pushing movement.' },
  { name: 'Dumbbell Lateral Raise', muscle_group: 'shoulders', equipment: 'dumbbell', description: 'Raise dumbbells out to the sides to target the lateral deltoid head.' },
  { name: 'Dumbbell Shoulder Press', muscle_group: 'shoulders', equipment: 'dumbbell', description: 'Press dumbbells overhead from shoulder height, allowing a wider range of motion.' },
  { name: 'Face Pull', muscle_group: 'shoulders', equipment: 'machine', description: 'Pull a rope attachment toward your face to target rear deltoids and rotator cuff.' },
  { name: 'Arnold Press', muscle_group: 'shoulders', equipment: 'dumbbell', description: 'Rotating dumbbell press that targets all three deltoid heads through full rotation.' },

  // Arms
  { name: 'Barbell Bicep Curl', muscle_group: 'arms', equipment: 'barbell', description: 'Curl a barbell from hip to shoulder height to target the biceps.' },
  { name: 'Dumbbell Hammer Curl', muscle_group: 'arms', equipment: 'dumbbell', description: 'Curl dumbbells with neutral (hammer) grip targeting brachialis and biceps.' },
  { name: 'Tricep Pushdown', muscle_group: 'arms', equipment: 'machine', description: 'Push a cable attachment downward to extend the elbow and target triceps.' },
  { name: 'Skull Crusher', muscle_group: 'arms', equipment: 'barbell', description: 'Lower a barbell to your forehead and extend back to target the triceps.' },
  { name: 'Preacher Curl', muscle_group: 'arms', equipment: 'barbell', description: 'Curl with arms braced on a preacher bench for isolated bicep activation.' },

  // Core
  { name: 'Plank', muscle_group: 'core', equipment: 'bodyweight', description: 'Hold a push-up position with body straight from head to heels. Timed isometric core exercise.' },
  { name: 'Crunch', muscle_group: 'core', equipment: 'bodyweight', description: 'Curl your upper body toward your knees to target the rectus abdominis.' },
  { name: 'Russian Twist', muscle_group: 'core', equipment: 'bodyweight', description: 'Sit with feet lifted and rotate a weight side to side targeting the obliques.' },
  { name: 'Cable Woodchop', muscle_group: 'core', equipment: 'machine', description: 'Rotational pulling movement from high to low position targeting entire core.' },

  // Cardio
  { name: 'Running', muscle_group: 'cardio', equipment: 'cardio', description: 'Steady-state or interval running for cardiovascular fitness and calorie burning.' },
  { name: 'Cycling', muscle_group: 'cardio', equipment: 'cardio', description: 'Stationary or outdoor cycling targeting cardiovascular system and lower body.' },
  { name: 'Jump Rope', muscle_group: 'cardio', equipment: 'cardio', description: 'High-intensity cardio using a jump rope, excellent for coordination and endurance.' },
  { name: 'Rowing Machine', muscle_group: 'cardio', equipment: 'cardio', description: 'Full-body cardio on a rowing ergometer targeting legs, back, and arms simultaneously.' },
  { name: 'Elliptical', muscle_group: 'cardio', equipment: 'cardio', description: 'Low-impact cardio machine providing full-body workout with reduced joint stress.' },
  { name: 'Burpee', muscle_group: 'cardio', equipment: 'bodyweight', description: 'Full-body explosive movement combining squat, push-up, and jump for intense cardio.' },
  { name: 'Mountain Climber', muscle_group: 'core', equipment: 'bodyweight', description: 'Plank position with alternating knee drives targeting core and cardio simultaneously.' },
  { name: 'Box Jump', muscle_group: 'legs', equipment: 'bodyweight', description: 'Explosive jump onto a raised platform developing lower body power and coordination.' },
];

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Seeding exercises...');
    
    // Check if exercises already exist
    const existing = await client.query('SELECT COUNT(*) FROM exercises WHERE is_custom = false');
    if (parseInt(existing.rows[0].count) > 0) {
      console.log(`ℹ️  ${existing.rows[0].count} exercises already seeded. Skipping.`);
      return;
    }

    for (const ex of exercises) {
      await client.query(
        `INSERT INTO exercises (name, muscle_group, equipment, description, is_custom)
         VALUES ($1, $2, $3, $4, false)
         ON CONFLICT DO NOTHING`,
        [ex.name, ex.muscle_group, ex.equipment, ex.description]
      );
    }

    console.log(`✅ Seeded ${exercises.length} exercises successfully`);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
