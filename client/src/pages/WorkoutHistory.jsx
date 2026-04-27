import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

function Calendar({ workoutDates, onSelectDate }) {
  const [current, setCurrent] = useState(new Date());
  const year = current.getFullYear();
  const month = current.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const hasWorkout = (day) => {
    if (!day) return false;
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return workoutDates.has(dateStr);
  };

  const isToday = (day) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div>
      <div className="flex justify-between items-center mb-16">
        <button className="btn btn-ghost btn-sm" onClick={() => setCurrent(new Date(year, month - 1, 1))}>‹ Prev</button>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{current.toLocaleString('default', { month: 'long', year: 'numeric' })}</div>
        <button className="btn btn-ghost btn-sm" onClick={() => setCurrent(new Date(year, month + 1, 1))}>Next ›</button>
      </div>
      <div className="calendar-header">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => <span key={d}>{d}</span>)}
      </div>
      <div className="calendar-grid">
        {days.map((day, i) => (
          <div key={i} className={`calendar-day ${day ? '' : 'other-month'} ${hasWorkout(day) ? 'has-workout' : ''} ${isToday(day) ? 'today' : ''}`}
            onClick={() => day && hasWorkout(day) && onSelectDate(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`)}>
            {day || ''}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WorkoutHistory() {
  const [workouts, setWorkouts] = useState([]);
  const [personalBests, setPersonalBests] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [filterDate, setFilterDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const toast = useToast();

  useEffect(() => {
    Promise.all([api.get('/workouts'), api.get('/stats/personal-bests')])
      .then(([w, pb]) => { setWorkouts(w.data); setPersonalBests(pb.data); })
      .finally(() => setLoading(false));
  }, []);

  const workoutDates = new Set(workouts.map(w => new Date(w.completed_at).toISOString().split('T')[0]));

  const filtered = filterDate
    ? workouts.filter(w => new Date(w.completed_at).toISOString().split('T')[0] === filterDate)
    : workouts;

  const handleDelete = async (id) => {
    if (!confirm('Delete this workout?')) return;
    setDeleting(id);
    try {
      await api.delete(`/workouts/${id}`);
      setWorkouts(prev => prev.filter(w => w.id !== id));
      toast.success('Workout deleted');
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const loadDetail = async (id) => {
    if (expanded === id) { setExpanded(null); return; }
    const { data } = await api.get(`/workouts/${id}`);
    setWorkouts(prev => prev.map(w => w.id === id ? { ...w, sets: data.sets } : w));
    setExpanded(id);
  };

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  if (loading) return <Layout title="Workout History"><div className="loading-screen"><div className="spinner spinner-dark" /></div></Layout>;

  return (
    <Layout title="Workout History">
      <div className="page-header"><h1>Workout History</h1><p>{workouts.length} workouts logged</p></div>

      <div className="grid-2 mb-24">
        <div className="card">
          <Calendar workoutDates={workoutDates} onSelectDate={d => setFilterDate(f => f === d ? null : d)} />
          {filterDate && (
            <div className="mt-8 flex justify-between items-center">
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Filtered: {filterDate}</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setFilterDate(null)}>Clear</button>
            </div>
          )}
        </div>

        {/* Personal Bests */}
        <div className="card">
          <div className="section-title">🏆 Personal Bests</div>
          {personalBests.length === 0 ? (
            <div className="empty-state"><p>Log workouts with weights to see your PRs</p></div>
          ) : (
            <div className="table-wrap" style={{ maxHeight: 280, overflowY: 'auto' }}>
              <table>
                <thead><tr><th>Exercise</th><th>Max Weight</th><th>Group</th></tr></thead>
                <tbody>
                  {personalBests.map(pb => (
                    <tr key={pb.exercise_id}>
                      <td style={{ fontWeight: 600 }}>{pb.exercise_name}</td>
                      <td style={{ color: 'var(--primary)', fontWeight: 700 }}>{pb.max_weight_kg} kg</td>
                      <td><span className={`badge badge-${pb.muscle_group}`}>{pb.muscle_group}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Workout List */}
      <div className="section-title">All Workouts</div>
      {filtered.length === 0 ? (
        <div className="empty-state card"><div className="empty-icon">🏃</div><p>No workouts found</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(w => (
            <div key={w.id} className="workout-card">
              <div className="workout-card-header">
                <div>
                  <div className="workout-card-title">{w.title || 'Workout'}</div>
                  <div className="workout-card-meta">
                    <span>📅 {fmtDate(w.completed_at)}</span>
                    <span>⏱ {w.duration_minutes || 0} min</span>
                    <span>🏋️ {w.exercise_count || 0} exercises</span>
                    {w.calories_burned && <span>🔥 {w.calories_burned} kcal</span>}
                  </div>
                </div>
                <div className="flex gap-8">
                  <button className="btn btn-ghost btn-sm" onClick={() => loadDetail(w.id)}>
                    {expanded === w.id ? 'Collapse' : 'Expand'}
                  </button>
                  <button className="btn btn-danger btn-sm" disabled={deleting === w.id} onClick={() => handleDelete(w.id)}>
                    {deleting === w.id ? <span className="spinner spinner-dark" style={{ width: 14, height: 14 }} /> : 'Delete'}
                  </button>
                </div>
              </div>

              {expanded === w.id && w.sets && (
                <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  {w.notes && <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, fontStyle: 'italic' }}>"{w.notes}"</p>}
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Exercise</th><th>Set</th><th>Reps</th><th>Weight</th><th>Duration</th><th>Distance</th></tr></thead>
                      <tbody>
                        {w.sets.map((s, i) => (
                          <tr key={i}>
                            <td style={{ fontWeight: 600 }}>{s.exercise_name}</td>
                            <td>{s.set_number}</td>
                            <td>{s.reps || '—'}</td>
                            <td>{s.weight_kg ? `${s.weight_kg} kg` : '—'}</td>
                            <td>{s.duration_seconds ? `${s.duration_seconds}s` : '—'}</td>
                            <td>{s.distance_km ? `${s.distance_km} km` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
