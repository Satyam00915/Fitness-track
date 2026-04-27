import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ name: '', email: '', age: '', height_cm: '', weight_kg: '', fitness_goal: '' });
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm_password: '' });
  const [stats, setStats] = useState(null);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');

  useEffect(() => {
    if (user) setForm({ name: user.name || '', email: user.email || '', age: user.age || '', height_cm: user.height_cm || '', weight_kg: user.weight_kg || '', fitness_goal: user.fitness_goal || '' });
    api.get('/stats/summary').then(r => setStats(r.data));
  }, [user]);

  const F = (setter) => (e) => setter(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/auth/profile', form);
      updateUser(data);
      toast.success('Profile updated!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (pwForm.new_password !== pwForm.confirm_password) { toast.error('Passwords do not match'); return; }
    if (pwForm.new_password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setSavingPw(true);
    try {
      await api.put('/auth/profile', { old_password: pwForm.old_password, new_password: pwForm.new_password });
      setPwForm({ old_password: '', new_password: '', confirm_password: '' });
      toast.success('Password changed!');
    } catch (err) { toast.error(err.response?.data?.error || 'Failed to change password'); }
    finally { setSavingPw(false); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== 'DELETE') { toast.error('Type DELETE to confirm'); return; }
    try {
      await api.delete('/auth/account');
      logout();
    } catch { toast.error('Failed to delete account'); }
  };

  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—';

  return (
    <Layout title="Profile">
      <div className="page-header"><h1>Profile Settings</h1><p>Manage your account and preferences</p></div>
      <div style={{ maxWidth: 680, display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Stats Summary */}
        {stats && (
          <div className="card">
            <div className="section-title">Account Overview</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: 'Member Since', value: memberSince, icon: '📅' },
                { label: 'Workouts This Week', value: stats.workouts_this_week, icon: '🏋️' },
                { label: 'Volume This Week', value: `${stats.volume_this_week} kg`, icon: '📈' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center', padding: 16, background: 'var(--bg)', borderRadius: 12 }}>
                  <div style={{ fontSize: 24, marginBottom: 6 }}>{s.icon}</div>
                  <div style={{ fontWeight: 800, fontSize: 18 }}>{s.value}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Form */}
        <div className="card">
          <div className="section-title">Personal Information</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Full Name</label>
              <input className="form-input" name="name" value={form.name} onChange={F(setForm)} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Email</label>
              <input className="form-input" name="email" type="email" value={form.email} onChange={F(setForm)} />
            </div>
            <div className="form-group">
              <label className="form-label">Age</label>
              <input className="form-input" name="age" type="number" value={form.age} onChange={F(setForm)} />
            </div>
            <div className="form-group">
              <label className="form-label">Height (cm)</label>
              <input className="form-input" name="height_cm" type="number" step="0.1" value={form.height_cm} onChange={F(setForm)} />
            </div>
            <div className="form-group">
              <label className="form-label">Weight (kg)</label>
              <input className="form-input" name="weight_kg" type="number" step="0.1" value={form.weight_kg} onChange={F(setForm)} />
            </div>
            <div className="form-group">
              <label className="form-label">Fitness Goal</label>
              <select className="form-select" name="fitness_goal" value={form.fitness_goal} onChange={F(setForm)}>
                <option value="">Select...</option>
                <option value="lose_weight">Lose Weight</option>
                <option value="build_muscle">Build Muscle</option>
                <option value="maintain">Maintain Fitness</option>
              </select>
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saving}>
            {saving ? <span className="spinner" /> : '💾 Save Changes'}
          </button>
        </div>

        {/* Change Password */}
        <div className="card">
          <div className="section-title">Change Password</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input className="form-input" name="old_password" type="password" value={pwForm.old_password} onChange={F(setPwForm)} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input className="form-input" name="new_password" type="password" value={pwForm.new_password} onChange={F(setPwForm)} placeholder="Min 6 characters" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" name="confirm_password" type="password" value={pwForm.confirm_password} onChange={F(setPwForm)} placeholder="Re-enter new password" />
            </div>
            <button className="btn btn-secondary" onClick={handleChangePassword} disabled={savingPw} style={{ alignSelf: 'flex-start' }}>
              {savingPw ? <span className="spinner spinner-dark" /> : '🔑 Change Password'}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card" style={{ border: '1.5px solid #FEE2E2' }}>
          <div className="section-title" style={{ color: 'var(--error)' }}>⚠️ Danger Zone</div>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 16 }}>Once you delete your account, all data is permanently removed.</p>
          <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>Delete Account</button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" style={{ color: 'var(--error)' }}>⚠️ Delete Account</div>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>This action is irreversible. All your workouts, metrics, and goals will be permanently deleted.</p>
            <div className="form-group mb-16">
              <label className="form-label">Type <strong>DELETE</strong> to confirm</label>
              <input className="form-input" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
            </div>
            <div className="flex gap-12">
              <button className="btn btn-ghost" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteAccount}>Delete My Account</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
