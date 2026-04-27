import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/log-workout', icon: '➕', label: 'Log Workout' },
  { to: '/history', icon: '📅', label: 'Workout History' },
  { to: '/exercises', icon: '🏋️', label: 'Exercises' },
  { to: '/metrics', icon: '📈', label: 'Body Metrics' },
  { to: '/goals', icon: '🎯', label: 'Goals' },
  { to: '/profile', icon: '👤', label: 'Profile' },
];

export default function Layout({ children, title }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };
  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="app-layout">
      {/* Overlay */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-icon">💪</div>
          <span>FitTrack</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <button className="nav-link" onClick={handleLogout} style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer' }}>
            <span className="nav-icon">🚪</span>
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="top-header">
          <div className="flex items-center gap-12">
            <button className="hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
            <div>
              <div className="header-title">{title}</div>
            </div>
          </div>
          <div className="header-user" onClick={() => navigate('/profile')}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{user?.fitness_goal?.replace('_', ' ') || 'No goal set'}</div>
            </div>
            <div className="user-avatar">{initials}</div>
          </div>
        </header>
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
