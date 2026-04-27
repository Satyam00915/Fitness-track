import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import PrivateRoute from './components/PrivateRoute';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LogWorkout = lazy(() => import('./pages/LogWorkout'));
const WorkoutHistory = lazy(() => import('./pages/WorkoutHistory'));
const Exercises = lazy(() => import('./pages/Exercises'));
const BodyMetrics = lazy(() => import('./pages/BodyMetrics'));
const Goals = lazy(() => import('./pages/Goals'));
const Profile = lazy(() => import('./pages/Profile'));

const Loader = () => (
  <div className="loading-screen" style={{ height: '100vh' }}>
    <div className="spinner spinner-dark" style={{ width: 40, height: 40 }} />
  </div>
);

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Suspense fallback={<Loader />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/log-workout" element={<PrivateRoute><LogWorkout /></PrivateRoute>} />
              <Route path="/history" element={<PrivateRoute><WorkoutHistory /></PrivateRoute>} />
              <Route path="/exercises" element={<PrivateRoute><Exercises /></PrivateRoute>} />
              <Route path="/metrics" element={<PrivateRoute><BodyMetrics /></PrivateRoute>} />
              <Route path="/goals" element={<PrivateRoute><Goals /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </Suspense>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
