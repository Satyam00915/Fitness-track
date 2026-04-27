import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../api/axios';

export default function LoginPage() {
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', password: '', age: '', height_cm: '', weight_kg: '', fitness_goal: '' });
  const [errors, setErrors] = useState({});

  const validate = (form, type) => {
    const errs = {};
    if (type === 'register' && !form.name) errs.name = 'Name is required';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email address';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters';
    return errs;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const errs = validate(loginForm, 'login');
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', loginForm);
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const errs = validate(registerForm, 'register');
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', registerForm);
      login(data.token, data.user);
      toast.success(`Welcome to FitTrack, ${data.user.name}!`);
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed');
    } finally { setLoading(false); }
  };

  const F = (setter) => (e) => { setter(p => ({ ...p, [e.target.name]: e.target.value })); setErrors(p => ({ ...p, [e.target.name]: '' })); };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div style={{ fontSize: 64, marginBottom: 24 }}>💪</div>
        <h1 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16, lineHeight: 1.2 }}>Track Your Fitness Journey</h1>
        <p style={{ fontSize: 16, opacity: 0.8, maxWidth: 340, textAlign: 'center', lineHeight: 1.7 }}>
          Log workouts, track body metrics, set goals, and visualize your progress with beautiful charts.
        </p>
        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {['🏋️ Log unlimited workouts', '📊 Track body metrics & progress', '🎯 Set and achieve fitness goals', '📈 Beautiful analytics & charts'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15, opacity: 0.9 }}>
              <span>{f.split(' ')[0]}</span>
              <span>{f.split(' ').slice(1).join(' ')}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card">
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary)' }}>FitTrack</div>
            <div style={{ color: 'var(--text-secondary)', marginTop: 4 }}>Your personal fitness companion</div>
          </div>
          <div className="auth-tabs">
            <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => { setTab('login'); setErrors({}); }}>Sign In</button>
            <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => { setTab('register'); setErrors({}); }}>Create Account</button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input id="login-email" name="email" type="email" className={`form-input ${errors.email ? 'error' : ''}`} placeholder="you@example.com" value={loginForm.email} onChange={F(setLoginForm)} />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input id="login-password" name="password" type="password" className={`form-input ${errors.password ? 'error' : ''}`} placeholder="••••••••" value={loginForm.password} onChange={F(setLoginForm)} />
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>
              <button id="login-submit" type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? <span className="spinner" /> : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input id="reg-name" name="name" className={`form-input ${errors.name ? 'error' : ''}`} placeholder="John Doe" value={registerForm.name} onChange={F(setRegisterForm)} />
                {errors.name && <span className="field-error">{errors.name}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input id="reg-email" name="email" type="email" className={`form-input ${errors.email ? 'error' : ''}`} placeholder="you@example.com" value={registerForm.email} onChange={F(setRegisterForm)} />
                {errors.email && <span className="field-error">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input id="reg-password" name="password" type="password" className={`form-input ${errors.password ? 'error' : ''}`} placeholder="Min 6 characters" value={registerForm.password} onChange={F(setRegisterForm)} />
                {errors.password && <span className="field-error">{errors.password}</span>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Age</label>
                  <input id="reg-age" name="age" type="number" className="form-input" placeholder="25" value={registerForm.age} onChange={F(setRegisterForm)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Height (cm)</label>
                  <input id="reg-height" name="height_cm" type="number" className="form-input" placeholder="175" value={registerForm.height_cm} onChange={F(setRegisterForm)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Weight (kg)</label>
                  <input id="reg-weight" name="weight_kg" type="number" className="form-input" placeholder="70" value={registerForm.weight_kg} onChange={F(setRegisterForm)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Fitness Goal</label>
                <select id="reg-goal" name="fitness_goal" className="form-select" value={registerForm.fitness_goal} onChange={F(setRegisterForm)}>
                  <option value="">Select goal...</option>
                  <option value="lose_weight">Lose Weight</option>
                  <option value="build_muscle">Build Muscle</option>
                  <option value="maintain">Maintain Fitness</option>
                </select>
              </div>
              <button id="register-submit" type="submit" className="btn btn-primary btn-lg w-full" disabled={loading} style={{ marginTop: 4 }}>
                {loading ? <span className="spinner" /> : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
