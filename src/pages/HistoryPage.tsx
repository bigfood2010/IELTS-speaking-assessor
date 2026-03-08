import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/store/AuthContext';
import { getUserAssessments, type AssessmentRecord } from '@/services/historyService';
import { Loader2, Calendar, BookOpen, TrendingUp, Languages, MessageSquare, CheckCircle2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';

export default function HistoryPage() {
  const { user } = useAuth();
  const [selectedRecord, setSelectedRecord] = useState<AssessmentRecord | null>(null);

  const { data: assessments, isLoading, isError } = useQuery({
    queryKey: ['assessments', user?.id],
    queryFn: () => getUserAssessments(user!.id),
    enabled: !!user,
  });

  const CRITERIA_LABELS: Record<string, string> = {
    fluency: 'Fluency & Coherence',
    lexical: 'Lexical Resource',
    grammar: 'Grammatical Range',
    pronunciation: 'Pronunciation',
  };

  const resultSurfaceClass = 'rounded-[2rem] border border-zinc-200/80 bg-white shadow-sm';

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 6) return 'text-blue-600 bg-blue-50 border-blue-100';
    return 'text-amber-600 bg-amber-50 border-amber-100';
  };

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
        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-3xl border border-red-100">
        Failed to load your practice history.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">Practice History</h1>
        </div>
        <div className="text-sm font-bold text-zinc-400 uppercase tracking-widest hidden sm:block">
          {assessments?.length || 0} Sessions
        </div>
      </header>

      {!assessments || assessments.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-dashed border-zinc-200">
          <div className="w-16 h-16 bg-zinc-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <TrendingUp size={24} className="text-zinc-300" />
          </div>
          <h3 className="text-lg font-bold mb-2">No history yet</h3>
          <p className="text-zinc-500 mb-6">Complete your first mock test to start tracking your progress.</p>
          <Link
            to="/app/speaking"
            className="px-6 py-2.5 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-colors shadow-sm inline-block"
          >
            Start Practice
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assessments.map((record) => (
            <div key={record.id} className="bg-white rounded-3xl border border-zinc-100 shadow-sm overflow-hidden group hover:border-zinc-300 transition-colors flex flex-col">
              <div className="p-6 border-b border-zinc-50 flex-1">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    <Calendar size={14} />
                    {formatDate(record.created_at)}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(record.overall_band)}`}>
                    Band {record.overall_band.toFixed(1)}
                  </div>
                </div>
                
                <h3 className="font-bold text-zinc-900 line-clamp-2 leading-snug mb-3 min-h-[48px]">
                  {record.question}
                </h3>
                
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 text-zinc-500 rounded-lg text-xs font-semibold">
                    <BookOpen size={12} />
                    Part {record.part}
                  </span>
                </div>
              </div>

              {/* Criteria minimap */}
              <div className="px-6 py-4 bg-zinc-50 grid grid-cols-4 gap-2 text-center text-xs">
                <div>
                  <div className="text-zinc-400 font-medium mb-1 truncate">FC</div>
                  <div className="font-bold text-zinc-700">{record.criteria_fluency}</div>
                </div>
                <div>
                  <div className="text-zinc-400 font-medium mb-1 truncate">LR</div>
                  <div className="font-bold text-zinc-700">{record.criteria_lexical}</div>
                </div>
                <div>
                  <div className="text-zinc-400 font-medium mb-1 truncate">GR</div>
                  <div className="font-bold text-zinc-700">{record.criteria_grammar}</div>
                </div>
                <div>
                  <div className="text-zinc-400 font-medium mb-1 truncate">PR</div>
                  <div className="font-bold text-zinc-700">{record.criteria_pronunciation}</div>
                </div>
              </div>
              <div className="p-6 pt-0 mt-auto">
                <button
                  onClick={() => setSelectedRecord(record)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-700 transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedRecord && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecord(null)}
              className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-[5%] bottom-[5%] z-50 mx-auto max-w-4xl overflow-hidden rounded-[2.5rem] border border-zinc-200 bg-[#F9FAFB] shadow-2xl flex flex-col"
            >
              <div className="p-6 md:p-8 border-b border-zinc-100 bg-white flex items-center justify-between shrink-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-zinc-400">
                    <Calendar size={14} />
                    {formatDate(selectedRecord.created_at)}
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight text-zinc-950">
                    Review Practice Session
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-100 bg-white text-zinc-400 transition-colors hover:text-zinc-950"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
                <div className={`${resultSurfaceClass} p-8`}>
                  <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                    <MessageSquare size={15} />
                    The Question
                  </div>
                  <h3 className="text-xl font-semibold leading-relaxed text-zinc-900">
                    {selectedRecord.question}
                  </h3>
                  <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                    <BookOpen size={13} />
                    IELTS Part {selectedRecord.part}
                  </div>
                </div>

                <div className={`${resultSurfaceClass} overflow-hidden p-8`}>
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Overall Band Score</p>
                    <div className="flex items-end gap-3">
                      <span className="text-6xl font-semibold leading-none tracking-tight text-zinc-950">
                        {selectedRecord.overall_band.toFixed(1)}
                      </span>
                      <span className="pb-2 text-lg font-medium text-zinc-400">/ 9.0</span>
                    </div>
                  </div>
                </div>

                <div className={`${resultSurfaceClass} p-8`}>
                  <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                    <Languages size={15} />
                    Transcript
                  </div>
                  <div className="rounded-[1.5rem] bg-zinc-50 px-6 py-6 text-[1.05rem] leading-relaxed text-zinc-800">
                    {selectedRecord.transcription}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {Object.entries(selectedRecord.feedback_data.criteria || {}).map(([key, data]: [string, any]) => (
                    <div key={key} className={`${resultSurfaceClass} p-6`}>
                      <div className="mb-5 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Criterion</p>
                          <h3 className="text-lg font-semibold tracking-[-0.03em] text-zinc-950">
                            {CRITERIA_LABELS[key] || key}
                          </h3>
                        </div>
                        <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${getScoreColor(data.score)}`}>
                          {data.score.toFixed(1)}
                        </span>
                      </div>

                      <div className="space-y-4 text-sm leading-relaxed text-zinc-700">
                        <div className="flex gap-3">
                          <CheckCircle2 size={17} className="mt-1 shrink-0 text-emerald-500" />
                          <p className="whitespace-pre-line">{data.feedback}</p>
                        </div>
                        <div className="rounded-[1.35rem] bg-zinc-50 p-4">
                          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                            <TrendingUp size={14} />
                            Improvement
                          </div>
                          <p className="whitespace-pre-line">{data.improvement}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
