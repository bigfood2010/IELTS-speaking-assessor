import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { parseAuthCallbackState } from '@/lib/authCallback';
import { supabase, supabaseConfigError } from '@/lib/supabase';

export default function AuthCallbackPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const callbackState = parseAuthCallbackState(location.search, location.hash);

  useEffect(() => {
    let cancelled = false;
    let fallbackTimer: number | undefined;

    const completeSignIn = async () => {
      if (supabaseConfigError) {
        if (!cancelled) {
          setErrorMessage(supabaseConfigError);
        }
        return;
      }

      if (callbackState.errorMessage) {
        if (!cancelled) {
          setErrorMessage(callbackState.errorMessage);
        }
        return;
      }

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!cancelled && session) {
          if (fallbackTimer) {
            window.clearTimeout(fallbackTimer);
          }
          navigate(callbackState.nextPath, { replace: true });
        }
      });

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (cancelled) {
        subscription.unsubscribe();
        return;
      }

      if (error) {
        setErrorMessage(error.message);
        subscription.unsubscribe();
        return;
      }

      if (session) {
        subscription.unsubscribe();
        navigate(callbackState.nextPath, { replace: true });
        return;
      }

      fallbackTimer = window.setTimeout(() => {
        if (!cancelled) {
          setErrorMessage(
            callbackState.hasImplicitTokens
              ? 'Authentication finished, but no Supabase session was created.'
              : 'No authentication session was returned from Google sign-in.'
          );
        }
        subscription.unsubscribe();
      }, 2500);
    };

    void completeSignIn();

    return () => {
      cancelled = true;
      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
    };
  }, [callbackState.errorMessage, callbackState.hasImplicitTokens, callbackState.nextPath, navigate]);

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm text-center space-y-6">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center">
            <AlertCircle size={28} />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Google sign-in failed</h1>
            <p className="text-sm text-zinc-500">{errorMessage}</p>
          </div>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-6 py-3 bg-zinc-900 text-white rounded-xl font-medium hover:bg-zinc-800 transition-colors shadow-md"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm text-center space-y-5">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-zinc-900 text-white flex items-center justify-center">
          <Loader2 size={24} className="animate-spin" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Signing you in</h1>
          <p className="text-sm text-zinc-500">Completing your Google authentication and preparing your dashboard.</p>
        </div>
      </div>
    </div>
  );
}
