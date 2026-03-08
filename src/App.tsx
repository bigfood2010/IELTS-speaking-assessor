import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';

const AppLayout = lazy(() => import('@/components/templates/AppLayout'));
const SpeakingPage = lazy(() => import('@/pages/SpeakingPage'));
const DashboardPage = lazy(() => import('@/pages/DashboardPage'));
const HistoryPage = lazy(() => import('@/pages/HistoryPage'));
const SettingsPage = lazy(() => import('@/pages/SettingsPage'));
const LoginPage = lazy(() => import('@/pages/LoginPage'));
const AuthCallbackPage = lazy(() => import('@/pages/AuthCallbackPage'));
import ProtectedRoute from '@/components/organisms/ProtectedRoute';

export default function App() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-screen items-center justify-center bg-studio-paper">
        <Loader2 size={40} className="animate-spin text-vibrant-emerald opacity-20" />
      </div>
    }>
      <Routes>
        <Route path="/" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/app" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="speaking" element={<SpeakingPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
}
