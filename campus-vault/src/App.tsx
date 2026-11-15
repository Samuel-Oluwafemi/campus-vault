import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import LandingPage from '@/pages/LandingPage';

const AuthPage = lazy(() => import('@/pages/AuthPage'));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Suspense fallback={<p className="auth-loading">Loading sign in…</p>}><AuthPage /></Suspense>} />
      <Route path="/register" element={<Suspense fallback={<p className="auth-loading">Loading account setup…</p>}><AuthPage /></Suspense>} />
      <Route path="/forgot-password" element={<Suspense fallback={<p className="auth-loading">Loading password reset…</p>}><AuthPage /></Suspense>} />
      <Route path="/verify-email" element={<Suspense fallback={<p className="auth-loading">Loading verification…</p>}><AuthPage /></Suspense>} />
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}
