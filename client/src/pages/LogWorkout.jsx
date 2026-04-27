import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const CARDIO_MUSCLES = ['cardio'];
const TITLES = ['Morning Workout', 'Evening Workout', 'Lunchtime Session', 'Power Session', 'Strength Training', 'Cardio Blast'];

function ExerciseSearch({ onSelect }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (q.length >= 1) {
        api.get(`/exercises?q=${q}`).then(r => { setResults(r.data.slice(0, 8)); setOpen(true); });
      } else { setResults([]); setOpen(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  return (
    <div style={{ position: 'relative' }}>
      <input className="form-input" placeholder="Search exercises..." value={q} onChange={e => setQ(e.target.value)} onFocus={() => results.length && setOpen(true)} />
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1.5px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-lg)', zIndex: 50, maxHeight: 240, overflowY: 'auto' }}>
          {results.map(ex => (
            <div key={ex.id} onClick={() => { onSelect(ex); setQ(''); setOpen(false); }} style={{ padding: '10px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              onMouseOver={e => e.currentTarget.style.background = 'var(--bg)'}
              onMouseOut={e => e.currentTarget.style.background = '#fff'}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{ex.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ex.equipment}</div>
              </div>
              <span className={`badge badge-${ex.muscle_group}`}>{ex.muscle_group}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExerciseBlock({ ex, onChange, onRemove }) {
  const isCardio = CARDIO_MUSCLES.includes(ex.exercise.muscle_group);

  const updateSet = (i, field, value) => {
    const sets = [...ex.sets];
    sets[i] = { ...sets[i], [field]: value };
    onChange({ ...ex, sets });
  };

  const addSet = () => onChange({ ...ex, sets: [...ex.sets, { set_number: ex.sets.length + 1, reps: '', weight_kg: '', duration_seconds: '', distance_km: '' }] });
  const removeSet = (i) => onChange({ ...ex, sets: ex.sets.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, set_number: idx + 1 })) });

  return (
    <div style={{ border: '1.5px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 12 }}>
      <div className="flex justify-between items-center mb-12">
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{ex.exercise.name}</div>
          <span className={`badge badge-${ex.exercise.muscle_group}`} style={{ marginTop: 4 }}>{ex.exercise.muscle_group}</span>
        </div>
        <button className="btn btn-danger btn-sm" onClick={onRemove}>Remove</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: isCardio ? '40px 1fr 1fr' : '40px 1fr 1fr 30px', gap: 8, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>SET</div>
        {isCardio ? <>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>DURATION (sec)</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>DISTANCE (km)</div>
        </> : <>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>REPS</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>WEIGHT (kg)</div>
          <div />
        </>}
      </div>
      {ex.sets.map((set, i) => (
        <div key={i} className="set-row">
          <div className="set-num">{set.set_number}</div>
          {isCardio ? <>
            <input className="set-input" type="number" placeholder="0" value={set.duration_seconds} onChange={e => updateSet(i, 'duration_seconds', e.target.value)} />
            <input className="set-input" type="number" placeholder="0.0" step="0.1" value={set.distance_km} onChange={e => updateSet(i, 'distance_km', e.target.value)} />
          </> : <>
            <input className="set-input" type="number" placeholder="0" value={set.reps} onChange={e => updateSet(i, 'reps', e.target.value)} />
            <input className="set-input" type="number" placeholder="0.0" step="0.5" value={set.weight_kg} onChange={e => updateSet(i, 'weight_kg', e.target.value)} />
            <button onClick={() => removeSet(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', fontSize: 16 }}>✕</button>
          </>}
        </div>
      ))}
      <button className="btn btn-secondary btn-sm mt-8" onClick={addSet}>+ Add Set</button>
    </div>
  );
}

export default function LogWorkout() {
  const navigate = useNavigate();
  const toast = useToast();
  const [title, setTitle] = useState(TITLES[Math.floor(Math.random() * TITLES.length)]);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [calories, setCalories] = useState('');
  const [exerciseBlocks, setExerciseBlocks] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (duration) setCalories(Math.round(parseFloat(duration) * 7));
  }, [duration]);

  const addExercise = useCallback((ex) => {
    setExerciseBlocks(prev => [...prev, {
      exercise: ex,
      exercise_id: ex.id,
      sets: [{ set_number: 1, reps: '', weight_kg: '', duration_seconds: '', distance_km: '' }]
    }]);
  }, []);

  const updateBlock = useCallback((i, data) => {
    setExerciseBlocks(prev => prev.map((b, idx) => idx === i ? data : b));
  }, []);

  const removeBlock = useCallback((i) => {
    setExerciseBlocks(prev => prev.filter((_, idx) => idx !== i));
  }, []);

  const handleSave = async () => {
    if (exerciseBlocks.length === 0) { toast.error('Add at least one exercise'); return; }
    setSaving(true);
    try {
      const payload = {
        title: title || 'Workout',
        duration_minutes: parseInt(duration) || null,
        notes: notes || null,
        calories_burned: parseInt(calories) || null,
        exercises: exerciseBlocks.map(b => ({
          exercise_id: b.exercise_id,
          sets: b.sets.map((s, i) => ({
            set_number: i + 1,
            reps: parseInt(s.reps) || null,
            weight_kg: parseFloat(s.weight_kg) || null,
            duration_seconds: parseInt(s.duration_seconds) || null,
            distance_km: parseFloat(s.distance_km) || null,
          }))
        }))
      };
      await api.post('/workouts', payload);
      toast.success('Workout logged successfully! 🎉');
      navigate('/history');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save workout');
    } finally { setSaving(false); }
  };

  return (
    <Layout title="Log Workout">
      <div className="page-header">
        <div><h1>Log Workout</h1><p>Record your training session</p></div>
      </div>
      <div style={{ maxWidth: 700 }}>
        <div className="card mb-20">
          <div className="section-title">Workout Details</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Workout Title</label>
              <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Morning Workout" />
            </div>
            <div className="form-group">
              <label className="form-label">Duration (minutes)</label>
              <input className="form-input" type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="45" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div className="form-group">
              <label className="form-label">Calories Burned (est.)</label>
              <input className="form-input" type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="Auto-calculated" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes (optional)</label>
            <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="How did it feel? Any PRs?" />
          </div>
        </div>

        <div className="card mb-20">
          <div className="section-title">Exercises</div>
          {exerciseBlocks.map((block, i) => (
            <ExerciseBlock key={i} ex={block} onChange={(d) => updateBlock(i, d)} onRemove={() => removeBlock(i)} />
          ))}
          <div className="form-group">
            <label className="form-label">Add Exercise</label>
            <ExerciseSearch onSelect={addExercise} />
          </div>
        </div>

        <div className="flex gap-12">
          <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
            {saving ? <><span className="spinner" /> Saving...</> : '💾 Save Workout'}
          </button>
          <button className="btn btn-ghost btn-lg" onClick={() => navigate('/history')}>Cancel</button>
        </div>
      </div>
    </Layout>
  );
}
