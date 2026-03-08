import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/store/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <Loader2 className="w-8 h-8 text-zinc-900 animate-spin" />
      </div>
    );
  }

  if (!session) {
    // If we're not logged in, redirect to login page (or dashboard root if login is integrated there)
    // Note: We'll create a simple Login/Landing page later when the user is signed out.
    // For now, redirecting to a /login route.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
