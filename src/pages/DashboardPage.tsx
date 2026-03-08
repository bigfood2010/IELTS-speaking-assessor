import { History, Loader2, Mic, Sparkles, Trophy } from 'lucide-react';
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
    if (score >= 7.5) return 'text-vibrant-emerald';
    if (score >= 6.5) return 'text-vibrant-gold';
    return 'text-vibrant-rose';
  };

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Learner';
  const firstName = name.split(' ')[0];
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 font-sans">
      <header className="flex items-center gap-5">
        <div className="relative">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="w-16 h-16 rounded-2xl border-2 border-white shadow-xl object-cover" />
          ) : (
            <div className="w-16 h-16 rounded-2xl border-2 border-white bg-vibrant-emerald flex items-center justify-center shadow-xl">
              <span className="text-2xl font-bold text-white">{user?.email?.[0].toUpperCase()}</span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-vibrant-emerald rounded-full border-2 border-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-studio-ink">
            {getDayGreeting()}, {firstName}
          </h1>
          <p className="text-sm font-medium text-zinc-500">Ready to boost your score today?</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="group relative flex h-full flex-col items-center justify-center space-y-10 rounded-[3rem] border border-studio-silver bg-white p-14 text-center shadow-[0_32px_64px_-12px_rgba(0,0,0,0.06)] transition-all hover:shadow-[0_48px_80px_-12px_rgba(0,0,0,0.08)]">
            <div className="flex h-24 w-24 items-center justify-center rounded-[2.25rem] bg-vibrant-gold/15 text-vibrant-gold shadow-[0_20px_40px_-8px_rgba(255,209,80,0.25)] ring-1 ring-vibrant-gold/20 transition-transform group-hover:scale-110 duration-500">
              <Mic size={40} strokeWidth={2.5} />
            </div>
            <div className="space-y-4">
              <h3 className="text-4xl font-extrabold tracking-tight text-studio-ink">Practice Studio</h3>
              <p className="mx-auto max-w-md text-lg font-medium text-zinc-500 leading-relaxed">
                Start speaking to get instant AI feedback that helps you improve.
              </p>
            </div>
            <Link
              to="/app/speaking"
              className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-vibrant-emerald px-12 py-5 text-lg font-bold text-white shadow-2xl shadow-vibrant-emerald/25 transition-all hover:scale-[1.05] active:scale-[0.95]"
            >
              <span className="relative z-10 flex items-center gap-2">
                Enter Studio
                <Sparkles size={18} className="animate-pulse" />
              </span>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-10 lg:col-span-4">
          <div className="flex flex-1 items-center gap-8 rounded-[2.5rem] border border-studio-silver bg-white p-10 shadow-sm">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-vibrant-rose/10 text-vibrant-rose">
              <Trophy size={32} />
            </div>
            <div className="flex-1">
              <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-zinc-400 mb-2">High Score</p>
              <div className="flex items-baseline gap-2">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
                ) : latestAssessment ? (
                  <>
                    <span className={`text-6xl font-black tracking-tighter ${getScoreColor(latestAssessment.overall_band)}`}>
                      {latestAssessment.overall_band.toFixed(1)}
                    </span>
                    <span className="text-xl font-bold text-zinc-300">/ 9.0</span>
                  </>
                ) : (
                  <span className="text-5xl font-black tracking-tighter text-zinc-200">--</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-1 items-center gap-8 rounded-[2.5rem] border border-studio-silver bg-white p-10 shadow-sm">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-vibrant-emerald/10 text-vibrant-emerald">
              <History size={32} />
            </div>
            <div className="flex-1">
              <p className="text-[12px] font-bold uppercase tracking-[0.25em] text-zinc-400 mb-2">Total Drafts</p>
              <div className="flex items-baseline gap-2">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
                ) : (
                  <>
                    <span className="text-6xl font-black tracking-tighter text-studio-ink">
                      {assessments?.length || 0}
                    </span>
                    <span className="text-lg font-bold text-zinc-400">runs</span>
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
