import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Layout from '../components/Layout';
import api from '../api/axios';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';

function getBMICategory(bmi) {
  if (bmi < 18.5) return { label: 'Underweight', color: '#3B82F6' };
  if (bmi < 25) return { label: 'Normal', color: 'var(--accent-green)' };
  if (bmi < 30) return { label: 'Overweight', color: 'var(--accent-orange)' };
  return { label: 'Obese', color: 'var(--error)' };
}

export default function BodyMetrics() {
  const { user } = useAuth();
  const toast = useToast();
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ weight_kg: '', body_fat_pct: '', chest_cm: '', waist_cm: '', hips_cm: '', recorded_at: new Date().toISOString().split('T')[0] });
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    api.get('/metrics').then(r => setMetrics(r.data)).finally(() => setLoading(false));
  }, []);

  const F = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.post('/metrics', form);
      setMetrics(prev => [data, ...prev]);
      setForm({ weight_kg: '', body_fat_pct: '', chest_cm: '', waist_cm: '', hips_cm: '', recorded_at: new Date().toISOString().split('T')[0] });
      toast.success('Body metrics logged!');
    } catch { toast.error('Failed to save metrics'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    setDeleting(id);
    try {
      await api.delete(`/metrics/${id}`);
      setMetrics(prev => prev.filter(m => m.id !== id));
      toast.success('Entry deleted');
    } catch { toast.error('Failed to delete'); }
    finally { setDeleting(null); }
  };

  const chartData = metrics.slice(0, 90).reverse().map(m => ({
    date: new Date(m.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    weight: m.weight_kg,
    bodyFat: m.body_fat_pct,
  }));

  const latestWeight = metrics[0]?.weight_kg;
  const bmi = latestWeight && user?.height_cm ? parseFloat((latestWeight / Math.pow(user.height_cm / 100, 2)).toFixed(1)) : null;
  const bmiCat = bmi ? getBMICategory(bmi) : null;

  if (loading) return <Layout title="Body Metrics"><div className="loading-screen"><div className="spinner spinner-dark" /></div></Layout>;

  return (
    <Layout title="Body Metrics">
      <div className="page-header"><h1>Body Metrics</h1><p>Track your body composition over time</p></div>

      <div className="grid-2 mb-24">
        {/* Log Form */}
        <div className="card">
          <div className="section-title">Log New Entry</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input className="form-input" name="weight_kg" type="number" step="0.1" value={form.weight_kg} onChange={F} placeholder="70.5" />
            </div>
            <div className="form-group">
              <label className="form-label">Body Fat %</label>
              <input className="form-input" name="body_fat_pct" type="number" step="0.1" value={form.body_fat_pct} onChange={F} placeholder="15.0" />
            </div>
            <div className="form-group">
              <label className="form-label">Chest (cm)</label>
              <input className="form-input" name="chest_cm" type="number" step="0.5" value={form.chest_cm} onChange={F} placeholder="95" />
            </div>
            <div className="form-group">
              <label className="form-label">Waist (cm)</label>
              <input className="form-input" name="waist_cm" type="number" step="0.5" value={form.waist_cm} onChange={F} placeholder="80" />
            </div>
            <div className="form-group">
              <label className="form-label">Hips (cm)</label>
              <input className="form-input" name="hips_cm" type="number" step="0.5" value={form.hips_cm} onChange={F} placeholder="90" />
            </div>
            <div className="form-group">
              <label className="form-label">Date</label>
              <input className="form-input" name="recorded_at" type="date" value={form.recorded_at} onChange={F} />
            </div>
          </div>
          <button className="btn btn-primary mt-16" onClick={handleSave} disabled={saving}>
            {saving ? <span className="spinner" /> : '📏 Log Metrics'}
          </button>
        </div>

        {/* BMI Card */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚖️</div>
          <div className="section-title" style={{ textAlign: 'center' }}>BMI Calculator</div>
          {bmi ? <>
            <div style={{ fontSize: 56, fontWeight: 800, color: bmiCat.color, lineHeight: 1 }}>{bmi}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: bmiCat.color, marginTop: 8 }}>{bmiCat.label}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 8, textAlign: 'center' }}>
              Based on {latestWeight} kg · {user.height_cm} cm height
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20, fontSize: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              {[['< 18.5', 'Underweight', '#3B82F6'], ['18.5–24.9', 'Normal', 'var(--accent-green)'], ['25–29.9', 'Overweight', 'var(--accent-orange)'], ['≥ 30', 'Obese', 'var(--error)']].map(([range, label, color]) => (
                <span key={label} style={{ padding: '4px 10px', borderRadius: 100, background: `${color}20`, color, fontWeight: 600 }}>{range} {label}</span>
              ))}
            </div>
          </> : (
            <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              <p>Log your weight and update your height in Profile to see BMI</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      {chartData.length > 1 && (
        <div className="card mb-24">
          <div className="section-title">Weight & Body Fat Over Time</div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="weight" stroke="#6C63FF" strokeWidth={2.5} dot={{ r: 3 }} name="Weight (kg)" />
              <Line yAxisId="right" type="monotone" dataKey="bodyFat" stroke="#14B8A6" strokeWidth={2.5} dot={{ r: 3 }} name="Body Fat %" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* History Table */}
      <div className="card">
        <div className="section-title">History</div>
        {metrics.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📏</div><p>No metrics logged yet</p></div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Weight (kg)</th><th>Body Fat %</th><th>Chest</th><th>Waist</th><th>Hips</th><th></th></tr></thead>
              <tbody>
                {metrics.map(m => (
                  <tr key={m.id}>
                    <td>{new Date(m.recorded_at).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 700 }}>{m.weight_kg || '—'}</td>
                    <td>{m.body_fat_pct ? `${m.body_fat_pct}%` : '—'}</td>
                    <td>{m.chest_cm ? `${m.chest_cm} cm` : '—'}</td>
                    <td>{m.waist_cm ? `${m.waist_cm} cm` : '—'}</td>
                    <td>{m.hips_cm ? `${m.hips_cm} cm` : '—'}</td>
                    <td>
                      <button className="btn btn-danger btn-sm" disabled={deleting === m.id} onClick={() => handleDelete(m.id)}>
                        {deleting === m.id ? '…' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
