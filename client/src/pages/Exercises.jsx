import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Layout from '../components/Layout';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

const MUSCLES = ['all', 'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'cardio'];

function ExerciseModal({ onClose, onSave }) {
  const [form, setForm] = useState({ name: '', muscle_group: 'chest', equipment: 'barbell', description: '' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const F = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!form.name) { toast.error('Exercise name is required'); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/exercises', form);
      onSave(data);
      toast.success('Custom exercise created!');
    } catch { toast.error('Failed to create exercise'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Create Custom Exercise</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Exercise Name *</label>
            <input className="form-input" name="name" value={form.name} onChange={F} placeholder="e.g. Incline Cable Fly" />
          </div>
          <div className="form-group">
            <label className="form-label">Muscle Group</label>
            <select className="form-select" name="muscle_group" value={form.muscle_group} onChange={F}>
              {['chest','back','legs','shoulders','arms','core','cardio'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Equipment</label>
            <select className="form-select" name="equipment" value={form.equipment} onChange={F}>
              {['barbell','dumbbell','machine','bodyweight','cardio'].map(e => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" name="description" value={form.description} onChange={F} placeholder="Describe the exercise..." />
          </div>
          <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : 'Create Exercise'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExercisePanel({ ex, onClose }) {
  const [history, setHistory] = useState([]);
  useEffect(() => {
    api.get(`/exercises/${ex.id}/history`).then(r => setHistory(r.data));
  }, [ex.id]);

  const chartData = history.filter(h => h.weight_kg > 0).map(h => ({
    date: new Date(h.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: h.weight_kg,
  })).slice(0, 15).reverse();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="side-panel" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">{ex.name}</div>
            <span className={`badge badge-${ex.muscle_group}`}>{ex.muscle_group}</span>
            {' '}
            <span className={`badge badge-${ex.equipment}`}>{ex.equipment}</span>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {ex.description && <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>{ex.description}</p>}

        {chartData.length > 1 && (
          <>
            <div className="section-title">Weight Progression</div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={v => [`${v} kg`, 'Weight']} />
                <Line type="monotone" dataKey="weight" stroke="#6C63FF" strokeWidth={2.5} dot={{ r: 4, fill: '#6C63FF' }} />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}

        <div className="section-title" style={{ marginTop: 20 }}>History</div>
        {history.length === 0 ? (
          <div className="empty-state"><p>You haven't done this exercise yet</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Set</th><th>Reps</th><th>Weight</th></tr></thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={i}>
                    <td>{new Date(h.completed_at).toLocaleDateString()}</td>
                    <td>{h.set_number}</td>
                    <td>{h.reps || '—'}</td>
                    <td>{h.weight_kg ? `${h.weight_kg} kg` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Exercises() {
  const [exercises, setExercises] = useState([]);
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      api.get(`/exercises?q=${q}&muscle=${muscle}`).then(r => setExercises(r.data)).finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q, muscle]);

  return (
    <Layout title="Exercise Library">
      <div className="page-header">
        <div><h1>Exercise Library</h1><p>{exercises.length} exercises available</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Custom Exercise</button>
      </div>

      <div className="flex gap-12 mb-20" style={{ flexWrap: 'wrap' }}>
        <input className="form-input" style={{ width: 240 }} placeholder="Search exercises..." value={q} onChange={e => setQ(e.target.value)} />
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          {MUSCLES.map(m => (
            <button key={m} className={`btn btn-sm ${muscle === m ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setMuscle(m)}>
              {m.charAt(0).toUpperCase() + m.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className="loading-screen"><div className="spinner spinner-dark" /></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {exercises.map(ex => (
            <div key={ex.id} className="exercise-card" onClick={() => setSelected(ex)}>
              <h4>{ex.name}</h4>
              <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
                <span className={`badge badge-${ex.muscle_group}`}>{ex.muscle_group}</span>
                <span className={`badge badge-${ex.equipment}`}>{ex.equipment}</span>
                {ex.is_custom && <span className="badge badge-orange">Custom</span>}
              </div>
              {ex.description && <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{ex.description}</p>}
            </div>
          ))}
        </div>
      )}

      {showModal && <ExerciseModal onClose={() => setShowModal(false)} onSave={(ex) => { setExercises(prev => [ex, ...prev]); setShowModal(false); }} />}
      {selected && <ExercisePanel ex={selected} onClose={() => setSelected(null)} />}
    </Layout>
  );
}
