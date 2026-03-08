import React from 'react';
import { History, Loader2, Mic, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/store/AuthContext';
import { getUserAssessments } from '@/services/historyService';

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: assessments, isLoading } = useQuery({
    queryKey: ['assessments', user?.id],
    queryFn: () => getUserAssessments(user!.id),
    enabled: !!user,
  });

  const latestAssessment = assessments?.[0];

  const getDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-emerald-500';
    if (score >= 6) return 'text-blue-500';
    return 'text-amber-500';
  };

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Learner';
  const firstName = name.split(' ')[0];
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex items-center gap-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt="Avatar" className="w-14 h-14 rounded-full border border-zinc-200 shadow-sm" />
        ) : (
          <div className="w-14 h-14 rounded-full border border-zinc-200 bg-white flex items-center justify-center shadow-sm">
            <span className="text-xl font-semibold text-zinc-500">{user?.email?.[0].toUpperCase()}</span>
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            {getDayGreeting()}, {firstName}
          </h1>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="flex h-full flex-col items-center justify-center space-y-8 rounded-[2.5rem] border border-zinc-200 bg-white p-12 text-center shadow-sm">
            <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-heritage-sage/30 text-heritage-forest shadow-sm transition-transform hover:scale-105 active:scale-95">
              <Mic size={32} />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl font-bold tracking-tight text-zinc-950">Start New Practice</h3>
              <p className="mx-auto max-w-md text-base text-zinc-500 leading-relaxed">
                Unlock immediate AI assessment for your IELTS speaking response.
              </p>
            </div>
            <Link
              to="/app/speaking"
              className="rounded-full bg-luxe-espresso px-10 py-4 text-base font-semibold text-white shadow-[0_16px_32px_rgba(45,91,255,0.15)] ring-1 ring-white/10 transition-all hover:bg-zinc-900 hover:scale-[1.02] active:scale-[0.98]"
            >
              Enter Studio
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-8 lg:col-span-4">
          <div className="flex flex-1 items-center gap-6 rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="shrink-0 rounded-2xl bg-heritage-sage/40 p-4 text-heritage-forest">
              <Trophy size={28} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">Recent Score</p>
              <div className="flex items-baseline gap-2">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                ) : latestAssessment ? (
                  <>
                    <span className={`text-5xl font-bold tracking-tight ${getScoreColor(latestAssessment.overall_band)}`}>
                      {latestAssessment.overall_band.toFixed(1)}
                    </span>
                    <span className="text-xl font-medium text-zinc-300">/ 9.0</span>
                  </>
                ) : (
                  <span className="text-4xl font-bold tracking-tight text-zinc-300">--</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-1 items-center gap-6 rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-sm">
            <div className="shrink-0 rounded-2xl bg-heritage-sage/20 p-4 text-heritage-forest/80">
              <History size={28} />
            </div>
            <div className="flex-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1">Total Practices</p>
              <div className="flex items-baseline gap-2">
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
                ) : (
                  <>
                    <span className="text-5xl font-bold tracking-tight text-zinc-950">
                      {assessments?.length || 0}
                    </span>
                    <span className="text-base font-medium text-zinc-400">sessions</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
