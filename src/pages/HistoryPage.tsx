import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/store/AuthContext';
import { getUserAssessments, type AssessmentRecord } from '@/services/historyService';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import Calendar from 'lucide-react/dist/esm/icons/calendar';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import Languages from 'lucide-react/dist/esm/icons/languages';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import X from 'lucide-react/dist/esm/icons/x';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { getScoreColor } from '@/lib/scores';
import { formatProceduralText, extractSource } from '@/lib/formatters';
import { CRITERIA_LABELS } from '@/lib/constants';

const focusRingClass = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibrant-emerald/40 focus-visible:ring-offset-2';

export default function HistoryPage() {
  const { user } = useAuth();
  const [selectedRecord, setSelectedRecord] = useState<AssessmentRecord | null>(null);

  const { data: assessments, isLoading, isError } = useQuery({
    queryKey: ['assessments', user?.id],
    queryFn: () => getUserAssessments(user!.id),
    enabled: !!user,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-10 h-10 text-vibrant-emerald animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-10 text-center bg-vibrant-rose/5 text-vibrant-rose rounded-[3rem] border border-vibrant-rose/10 font-bold">
        Failed to reconstruct your practice archive.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 font-sans pb-20">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-studio-ink sm:text-4xl">History</h1>
        </div>
        <div className="hidden text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-300 sm:block">
          {assessments?.length || 0} SESSIONS LOGGED
        </div>
      </header>

      {!assessments || assessments.length === 0 ? (
        <div className="rounded-[1.75rem] border border-dashed border-studio-silver bg-studio-paper/20 p-10 text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-sm">
            <TrendingUp size={26} className="text-zinc-200" />
          </div>
          <h3 className="mb-3 text-2xl font-extrabold text-studio-ink">No Sessions Yet</h3>
          <p className="mx-auto mb-8 max-w-sm text-sm font-medium leading-relaxed text-zinc-500">Complete your first studio session to start building your performance profile.</p>
          <Link
            to="/app/speaking"
            className={`inline-block rounded-xl bg-vibrant-emerald px-6 py-3 text-sm font-bold text-white shadow-sm shadow-vibrant-emerald/20 transition-transform hover:scale-[1.02] active:scale-[0.98] ${focusRingClass}`}
          >
            Open Studio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {assessments.map((record) => (
            <div key={record.id} className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-studio-silver bg-white shadow-sm transition-shadow hover:border-vibrant-emerald/30 hover:shadow-lg">
              <div className="flex-1 border-b border-studio-silver p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    <Calendar size={14} className="text-vibrant-gold" />
                    {formatDate(record.created_at)}
                  </div>
                  <div className={`rounded-xl border px-3 py-1.5 text-[11px] font-bold shadow-sm ${getScoreColor(record.overall_band)}`}>
                    BAND {record.overall_band.toFixed(1)}
                  </div>
                </div>

                <h3 className="mb-4 min-h-[48px] text-base font-extrabold leading-6 text-studio-ink line-clamp-2">
                  {record.question}
                </h3>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-lg bg-studio-paper px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-studio-ink">
                    <BookOpen size={14} className="text-vibrant-emerald" />
                    PART {record.part}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-studio-paper/40 px-6 py-5 text-center sm:grid-cols-4">
                {[
                  ['Fluency', record.criteria_fluency, 'vibrant-emerald'],
                  ['Lexical', record.criteria_lexical, 'vibrant-gold'],
                  ['Grammar', record.criteria_grammar, 'vibrant-rose'],
                  ['Pronunciation', record.criteria_pronunciation, 'studio-ink']
                ].map(([label, score, color]) => (
                  <div key={label}>
                    <div className="mb-1 text-[9px] font-bold uppercase tracking-widest text-zinc-400">{label}</div>
                    <div className={`text-sm font-extrabold text-${color}`}>{score}</div>
                  </div>
                ))}
              </div>
              <div className="mt-auto p-6 pt-0">
                <button
                  onClick={() => setSelectedRecord(record)}
                  className={`inline-flex w-full items-center justify-center gap-3 rounded-xl border border-studio-silver bg-white py-3 text-sm font-bold text-studio-ink transition-colors hover:border-studio-ink hover:bg-studio-paper ${focusRingClass}`}
                >
                  View
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedRecord ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecord(null)}
              className="fixed inset-0 z-50 bg-studio-ink/20 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="history-session-title"
              className="fixed inset-x-4 top-[5%] bottom-[5%] z-50 mx-auto flex max-w-5xl flex-col overflow-hidden rounded-[2rem] border border-studio-silver bg-studio-paper shadow-3xl"
            >
              <div className="flex shrink-0 items-center justify-between border-b border-studio-silver bg-white p-7 md:p-8">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-vibrant-gold">
                    <Calendar size={16} />
                    SESSION // {formatDate(selectedRecord.created_at).toUpperCase()}
                  </div>
                  <h2 id="history-session-title" className="text-3xl font-extrabold text-studio-ink">
                    Session Details
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRecord(null)}
                  aria-label="Close session details"
                  className={`flex h-10 w-10 items-center justify-center rounded-xl border border-studio-silver bg-white text-zinc-300 transition-colors hover:border-vibrant-rose/20 hover:text-vibrant-rose ${focusRingClass}`}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto p-7 md:p-8">
                <div className="rounded-[1.75rem] border border-studio-silver bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                    <MessageSquare size={18} className="text-vibrant-gold" />
                    Archive Prompt
                  </div>
                  <h3 className="pr-12 text-base font-extrabold leading-6 text-studio-ink">
                    {selectedRecord.question}
                  </h3>
                  <div className="mt-6 inline-flex items-center gap-2 rounded-lg bg-studio-paper px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-studio-ink">
                   <BookOpen size={16} className="text-vibrant-emerald" />
                   IELTS PART {selectedRecord.part}
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-studio-silver bg-white p-6 shadow-sm">
                  <div className="space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">Achieved Band score</p>
                    <div className="flex items-end gap-2 text-studio-ink">
                      <span className="text-5xl font-extrabold leading-none tabular-nums">
                        {selectedRecord.overall_band.toFixed(1)}
                      </span>
                      <span className="pb-1 text-xl font-semibold text-zinc-300">/ 9.0</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.75rem] border border-studio-silver bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                    <Languages size={18} className="text-vibrant-emerald" />
                    Neural Transcription
                  </div>
                  <div className="rounded-2xl bg-studio-paper p-5 text-sm font-medium leading-6 text-studio-ink">
                    {selectedRecord.transcription}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-12 items-start">
                  {Object.entries(selectedRecord.feedback_data.criteria || {}).map(([key, data]: [string, any]) => (
                    <div key={key} className="md:col-span-12 rounded-[1.75rem] border border-studio-silver bg-white p-6 shadow-sm flex flex-col">
                      <div className="mb-5 flex items-start justify-between gap-5">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-studio-paper text-vibrant-emerald shadow-inner">
                            <CheckCircle2 size={20} />
                          </div>
                          <div>
                            <h3 className="text-base font-extrabold tracking-tight text-studio-ink">
                              {CRITERIA_LABELS[key] || key}
                            </h3>
                          </div>
                        </div>
                        <span className={`rounded-xl border-2 px-3.5 py-1.5 text-lg font-black shadow-sm ${getScoreColor(data.score)}`}>
                          {data.score.toFixed(1)}
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-[1.25rem] bg-studio-paper/45 p-5">
                          <p className="text-sm font-medium leading-6 text-zinc-700 whitespace-pre-line">
                            {formatProceduralText(data.feedback)}
                          </p>
                        </div>
                        <div className="rounded-[1.25rem] border border-studio-silver bg-white p-5">
                          <div className="mb-3 flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.2em] text-vibrant-emerald">
                            <TrendingUp size={16} />
                            Strategic Gains
                          </div>
                          <p className="text-sm font-medium leading-6 text-studio-ink whitespace-pre-line">
                            {formatProceduralText(data.improvement)}
                          </p>
                          {extractSource(data.improvement) ? (
                            <div className="mt-4 flex w-fit items-center gap-2 rounded-full bg-studio-paper px-4 py-1.5 text-[9px] font-bold tracking-widest text-zinc-400 border border-studio-silver">
                              <span className="opacity-60 text-[8px]">SOURCE //</span>
                              <span>{extractSource(data.improvement)!.toUpperCase()}</span>
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
