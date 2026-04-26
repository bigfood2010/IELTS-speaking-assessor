import History from "lucide-react/dist/esm/icons/history";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import Mic from "lucide-react/dist/esm/icons/mic";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import Trophy from "lucide-react/dist/esm/icons/trophy";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/store/AuthContext";
import { getUserAssessments } from "@/services/historyService";
import { getScoreTextColor } from "@/lib/scores";

const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibrant-emerald/40 focus-visible:ring-offset-2";

export default function DashboardPage() {
  const { user } = useAuth();

  const { data: assessments, isLoading } = useQuery({
    queryKey: ["assessments", user?.id],
    queryFn: () => getUserAssessments(user!.id),
    enabled: !!user,
  });

  const latestAssessment = assessments?.[0];

  const getDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const name =
    user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Learner";
  const firstName = name.split(" ")[0];
  const avatarUrl = user?.user_metadata?.avatar_url;

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans">
      <header className="flex items-center gap-4">
        <div className="relative">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="h-12 w-12 rounded-xl border-2 border-white object-cover shadow-sm"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-white bg-vibrant-emerald shadow-sm">
              <span className="text-lg font-bold text-white">
                {user?.email?.[0].toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white bg-vibrant-emerald" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-studio-ink sm:text-4xl">
            {getDayGreeting()}, {firstName}
          </h1>
          <p className="text-sm font-medium text-zinc-500">
            Ready to boost your score today?
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <div className="group relative flex h-full flex-col items-center justify-center space-y-7 rounded-[1.75rem] border border-studio-silver bg-white p-8 text-center shadow-sm transition-shadow hover:shadow-lg">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-vibrant-gold/15 text-vibrant-gold ring-1 ring-vibrant-gold/20 transition-transform duration-300 group-hover:scale-105">
              <Mic size={28} strokeWidth={2.5} />
            </div>
            <div className="space-y-3">
              <h3 className="text-2xl font-extrabold text-studio-ink">
                Practice Studio
              </h3>
              <p className="mx-auto max-w-md text-sm font-medium leading-relaxed text-zinc-500">
                Start speaking to get instant AI feedback that helps you
                improve.
              </p>
            </div>
            <Link
              to="/app/speaking"
              className={`group relative inline-flex h-12 items-center justify-center overflow-hidden rounded-xl bg-vibrant-emerald px-6 text-sm font-bold text-white shadow-sm shadow-vibrant-emerald/20 transition-transform hover:scale-[1.02] active:scale-[0.98] ${focusRingClass}`}
            >
              <span className="relative z-10 flex items-center gap-2">
                Enter Studio
              </span>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20" />
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-5 lg:col-span-4">
          <div className="flex flex-1 items-center gap-5 rounded-[1.75rem] border border-studio-silver bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-vibrant-rose/10 text-vibrant-rose">
              <Trophy size={24} />
            </div>
            <div className="flex-1">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                High Score
              </p>
              <div className="flex items-baseline gap-2">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
                ) : latestAssessment ? (
                  <>
                    <span
                      className={`text-4xl font-extrabold tabular-nums ${getScoreTextColor(latestAssessment.overall_band)}`}
                    >
                      {latestAssessment.overall_band.toFixed(1)}
                    </span>
                    <span className="text-lg font-semibold text-zinc-300">
                      / 9.0
                    </span>
                  </>
                ) : (
                  <span className="text-4xl font-extrabold text-zinc-200">
                    --
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-1 items-center gap-5 rounded-[1.75rem] border border-studio-silver bg-white p-6 shadow-sm">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-vibrant-emerald/10 text-vibrant-emerald">
              <History size={24} />
            </div>
            <div className="flex-1">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                Total Sessions
              </p>
              <div className="flex items-baseline gap-2">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-zinc-300" />
                ) : (
                  <>
                    <span className="text-4xl font-extrabold tabular-nums text-studio-ink">
                      {assessments?.length || 0}
                    </span>
                    <span className="text-sm font-semibold text-zinc-400">
                      runs
                    </span>
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
