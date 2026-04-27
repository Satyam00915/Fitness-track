import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';

function GoalModal({ onClose, onSave }) {
  const toast = useToast();
  const [form, setForm] = useState({ type: 'target_weight', description: '', target_value: '', current_value: '0', unit: 'kg', deadline: '' });
  const [saving, setSaving] = useState(false);
  const F = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const typeDefaults = {
    target_weight: { unit: 'kg', placeholder: 'e.g. Reach 70 kg' },
    weekly_workouts: { unit: 'workouts/week', placeholder: 'e.g. Workout 4 times per week' },
    strength: { unit: 'kg', placeholder: 'e.g. Bench press 100 kg' },
  };

  const handleSave = async () => {
    if (!form.target_value) { toast.error('Target value is required'); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/goals', form);
      onSave(data);
      toast.success('Goal created! 🎯');
    } catch { toast.error('Failed to create goal'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Create New Goal</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Goal Type</label>
            <select className="form-select" name="type" value={form.type} onChange={e => { F(e); setForm(p => ({ ...p, unit: typeDefaults[e.target.value]?.unit || 'kg' })); }}>
              <option value="target_weight">Target Weight</option>
              <option value="weekly_workouts">Weekly Workouts</option>
              <option value="strength">Strength Goal</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input className="form-input" name="description" value={form.description} onChange={F} placeholder={typeDefaults[form.type]?.placeholder} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Target Value</label>
              <input className="form-input" name="target_value" type="number" step="0.1" value={form.target_value} onChange={F} placeholder="100" />
            </div>
            <div className="form-group">
              <label className="form-label">Current Value</label>
              <input className="form-input" name="current_value" type="number" step="0.1" value={form.current_value} onChange={F} placeholder="0" />
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <input className="form-input" name="unit" value={form.unit} onChange={F} placeholder="kg" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Deadline</label>
            <input className="form-input" name="deadline" type="date" value={form.deadline} onChange={F} />
          </div>
          <div className="flex gap-12" style={{ justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <span className="spinner" /> : '🎯 Create Goal'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoalCard({ goal, onUpdate, onDelete }) {
  const toast = useToast();
  const [value, setValue] = useState(goal.current_value);
  const [updating, setUpdating] = useState(false);
  const pct = Math.min(100, goal.target_value > 0 ? Math.round((goal.current_value / goal.target_value) * 100) : 0);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const { data } = await api.put(`/goals/${goal.id}`, { current_value: parseFloat(value) });
      onUpdate(data);
      toast.success('Progress updated!');
    } catch { toast.error('Failed to update'); }
    finally { setUpdating(false); }
  };

  const handleComplete = async () => {
    setUpdating(true);
    try {
      const { data } = await api.put(`/goals/${goal.id}`, { is_completed: true, current_value: goal.target_value });
      onUpdate(data);
      toast.success('Goal completed! 🎉');
    } catch { toast.error('Failed to update'); }
    finally { setUpdating(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this goal?')) return;
    try {
      await api.delete(`/goals/${goal.id}`);
      onDelete(goal.id);
      toast.success('Goal deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const daysLeft = goal.deadline ? Math.ceil((new Date(goal.deadline) - new Date()) / 86400000) : null;

  return (
    <div className={`goal-card ${goal.is_completed ? 'completed' : ''}`}>
      <div className="flex justify-between items-center mb-12">
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{goal.description || goal.type.replace('_', ' ')}</div>
          <div className="flex gap-8 mt-8">
            <span className="badge badge-purple">{goal.type.replace(/_/g, ' ')}</span>
            {daysLeft !== null && (
              <span className={`badge ${daysLeft < 0 ? 'badge-orange' : daysLeft < 7 ? 'badge-orange' : 'badge-green'}`}>
                {daysLeft < 0 ? 'Overdue' : `${daysLeft}d left`}
              </span>
            )}
          </div>
        </div>
        {goal.is_completed && <span style={{ fontSize: 28 }}>✅</span>}
      </div>

      <div className="mb-12">
        <div className="flex justify-between mb-8">
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{goal.current_value} / {goal.target_value} {goal.unit}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: pct >= 100 ? 'var(--accent-green)' : 'var(--primary)' }}>{pct}%</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${pct}%`, background: pct >= 100 ? 'var(--accent-green)' : undefined }} />
        </div>
      </div>

      {!goal.is_completed && (
        <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
          <input type="number" className="form-input" style={{ width: 90, height: 32 }} value={value} onChange={e => setValue(e.target.value)} step="0.1" />
          <button className="btn btn-secondary btn-sm" onClick={handleUpdate} disabled={updating}>Update</button>
          <button className="btn btn-primary btn-sm" onClick={handleComplete} disabled={updating}>Mark Complete</button>
          <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
        </div>
      )}
      {goal.is_completed && (
        <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
      )}
    </div>
  );
}

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get('/goals').then(r => setGoals(r.data)).finally(() => setLoading(false));
  }, []);

  const activeGoals = goals.filter(g => !g.is_completed);
  const completedGoals = goals.filter(g => g.is_completed);

  const onUpdate = (updated) => setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
  const onDelete = (id) => setGoals(prev => prev.filter(g => g.id !== id));

  if (loading) return <Layout title="Goals"><div className="loading-screen"><div className="spinner spinner-dark" /></div></Layout>;

  return (
    <Layout title="Goals">
      <div className="page-header">
        <div><h1>My Goals</h1><p>{activeGoals.length} active · {completedGoals.length} completed</p></div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ New Goal</button>
      </div>

      {activeGoals.length === 0 ? (
        <div className="empty-state card mb-24"><div className="empty-icon">🎯</div><p>No active goals. Set one to stay motivated!</p></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 32 }}>
          {activeGoals.map(g => <GoalCard key={g.id} goal={g} onUpdate={onUpdate} onDelete={onDelete} />)}
        </div>
      )}

      {completedGoals.length > 0 && (
        <>
          <div className="section-title" style={{ color: 'var(--text-secondary)' }}>Completed Goals</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {completedGoals.map(g => <GoalCard key={g.id} goal={g} onUpdate={onUpdate} onDelete={onDelete} />)}
          </div>
        </>
      )}

      {showModal && <GoalModal onClose={() => setShowModal(false)} onSave={(g) => { setGoals(prev => [g, ...prev]); setShowModal(false); }} />}
    </Layout>
  );
}
