import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Layout from '../components/Layout';
import api from '../api/axios';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [progress, setProgress] = useState([]);
  const [volumeTrend, setVolumeTrend] = useState([]);
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/stats/summary'),
      api.get('/stats/progress'),
      api.get('/stats/volume-trend'),
      api.get('/workouts'),
      api.get('/goals'),
    ]).then(([s, p, v, w, g]) => {
      setSummary(s.data);
      setProgress(p.data);
      setVolumeTrend(v.data);
      setRecentWorkouts(w.data.slice(0, 5));
      setGoals(g.data.filter(g => !g.is_completed).slice(0, 5));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout title="Dashboard"><div className="loading-screen"><div className="spinner spinner-dark" /></div></Layout>;

  const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  const statCards = [
    { label: 'Workouts This Week', value: summary?.workouts_this_week ?? 0, icon: '🏋️', color: 'var(--primary)' },
    { label: 'Calories Burned', value: `${(summary?.calories_this_week ?? 0).toLocaleString()} kcal`, icon: '🔥', color: 'var(--accent-orange)' },
    { label: 'Current Streak', value: `${summary?.current_streak ?? 0} days`, icon: '⚡', color: '#F59E0B' },
    { label: 'Volume This Week', value: `${(summary?.volume_this_week ?? 0).toLocaleString()} kg`, icon: '📈', color: 'var(--accent-teal)' },
  ];

  return (
    <Layout title="Dashboard">
      <div className="page-header">
        <div><h1>Good job! Keep it up 💪</h1><p>Here's your fitness overview</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/log-workout')}>+ Log Workout</button>
      </div>

      {/* Stat Cards */}
      <div className="grid-4 mb-24">
        {statCards.map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color, fontSize: 26 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid-2 mb-24">
        <div className="card">
          <div className="section-title">Workouts — Last 30 Days</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={progress}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="date" tickFormatter={d => d.slice(5)} tick={{ fontSize: 11 }} interval={6} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip formatter={(v) => [v, 'Workouts']} labelFormatter={l => `Date: ${l}`} />
              <Area type="monotone" dataKey="count" stroke="#6C63FF" strokeWidth={2.5} fill="url(#colorCount)" name="Workouts" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div className="section-title">Volume Lifted — Last 8 Weeks</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={volumeTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => [`${v} kg`, 'Volume']} />
              <Bar dataKey="total_volume" fill="#14B8A6" radius={[4, 4, 0, 0]} name="Volume (kg)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent + Goals */}
      <div className="grid-2">
        <div className="card">
          <div className="flex justify-between items-center mb-16">
            <div className="section-title" style={{ marginBottom: 0 }}>Recent Workouts</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>View All</button>
          </div>
          {recentWorkouts.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🏃</div><p>No workouts yet. Log your first!</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {recentWorkouts.map(w => (
                <div key={w.id} onClick={() => navigate('/history')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 10, background: 'var(--bg)', cursor: 'pointer', transition: 'background 0.2s' }}
                  onMouseOver={e => e.currentTarget.style.background = 'var(--primary-light)'}
                  onMouseOut={e => e.currentTarget.style.background = 'var(--bg)'}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{w.title || 'Workout'}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{fmtDate(w.completed_at)} · {w.duration_minutes || 0} min</div>
                  </div>
                  <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{w.exercise_count} ex</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-16">
            <div className="section-title" style={{ marginBottom: 0 }}>Active Goals</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/goals')}>Manage</button>
          </div>
          {goals.length === 0 ? (
            <div className="empty-state"><div className="empty-icon">🎯</div><p>No active goals. Set one now!</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {goals.map(g => {
                const pct = Math.min(100, g.target_value > 0 ? Math.round((g.current_value / g.target_value) * 100) : 0);
                return (
                  <div key={g.id}>
                    <div className="flex justify-between items-center mb-8">
                      <span style={{ fontWeight: 600, fontSize: 13 }}>{g.description || g.type}</span>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{pct}%</span>
                    </div>
                    <div className="progress-bar"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{g.current_value} / {g.target_value} {g.unit}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
