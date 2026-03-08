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

  const resultSurfaceClass = 'rounded-[2.5rem] border border-studio-silver bg-white shadow-sm';

  const getScoreColor = (score: number) => {
    if (score >= 7.5) return 'border-vibrant-emerald bg-vibrant-emerald/5 text-vibrant-emerald';
    if (score >= 6.5) return 'border-vibrant-gold/30 bg-vibrant-gold/10 text-vibrant-gold';
    return 'border-vibrant-rose/20 bg-vibrant-rose/5 text-vibrant-rose';
  };

  const vnRegex = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

function formatProceduralText(text: string) {
  if (!text) return text;

  let cleaned = text.replace(/[✦➤▪•◈▷➢]/g, '').replace(/\s*=\s*/g, '\n');

  cleaned = cleaned.replace(/\bSource:\s*.*$/gi, '');

  const sections = cleaned.split('\n').map(s => s.trim()).filter(Boolean);

    let finalLines: string[] = [];
    
    sections.forEach(section => {
      if (section.length > 50 && vnRegex.test(section)) {
        const sentences = section.split('. ');
        let currentPart = "";
        
        sentences.forEach((sentence, idx) => {
          const isFirstVN = vnRegex.test(sentence) && !vnRegex.test(currentPart);
          const cleanSentence = sentence.trim() + (idx < sentences.length - 1 ? '.' : '');
          
          if (isFirstVN && currentPart.length > 0) {
            finalLines.push(currentPart.trim());
            currentPart = cleanSentence;
          } else {
            currentPart += (currentPart ? ' ' : '') + cleanSentence;
          }
        });
        if (currentPart) finalLines.push(currentPart.trim());
      } else {
        finalLines.push(section);
      }
    });

    return finalLines.join('\n');
  }

  function extractSource(text: string): string | null {
    const match = text.match(/\bSource:\s*(.*)$/i);
    return match ? match[1].trim() : null;
  }

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
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 font-sans pb-20">
      <header className="flex items-end justify-between">
        <div className="space-y-2">
          <p className="text-[12px] font-black uppercase tracking-[0.3em] text-vibrant-emerald">Archives</p>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-studio-ink">Studio History</h1>
        </div>
        <div className="text-[12px] font-black text-zinc-300 uppercase tracking-[0.4em] hidden sm:block">
          {assessments?.length || 0} SESSIONS LOGGED
        </div>
      </header>

      {!assessments || assessments.length === 0 ? (
        <div className="p-20 text-center bg-studio-paper/20 rounded-[4rem] border-4 border-dashed border-studio-silver">
          <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl">
            <TrendingUp size={32} className="text-zinc-200" />
          </div>
          <h3 className="text-3xl font-black text-studio-ink mb-4">No Sessions Yet</h3>
          <p className="text-lg font-medium text-zinc-500 mb-10 max-w-sm mx-auto">Complete your first studio session to start building your performance profile.</p>
          <Link
            to="/app/speaking"
            className="px-10 py-4 bg-vibrant-emerald text-white rounded-full text-lg font-black hover:scale-105 transition-all shadow-xl shadow-vibrant-emerald/30 inline-block"
          >
            Open Studio
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {assessments.map((record) => (
            <div key={record.id} className="bg-white rounded-[3rem] border border-studio-silver shadow-sm overflow-hidden group hover:border-vibrant-emerald/30 transition-all hover:shadow-2xl flex flex-col">
              <div className="p-8 border-b border-studio-silver flex-1">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    <Calendar size={14} className="text-vibrant-gold" />
                    {formatDate(record.created_at)}
                  </div>
                  <div className={`px-4 py-1.5 rounded-2xl text-[12px] font-black border-2 shadow-sm ${getScoreColor(record.overall_band)}`}>
                    BAND {record.overall_band.toFixed(1)}
                  </div>
                </div>
                
                <h3 className="text-xl font-extrabold text-studio-ink line-clamp-2 leading-tight mb-4 min-h-[56px] tracking-tight">
                  {record.question}
                </h3>
                
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-studio-paper text-studio-ink rounded-xl text-[10px] font-black uppercase tracking-widest">
                    <BookOpen size={14} className="text-vibrant-emerald" />
                    PART {record.part}
                  </span>
                </div>
              </div>

              <div className="px-8 py-6 bg-studio-paper/40 grid grid-cols-4 gap-4 text-center">
                {[
                  ['FC', record.criteria_fluency, 'vibrant-emerald'],
                  ['LR', record.criteria_lexical, 'vibrant-gold'],
                  ['GR', record.criteria_grammar, 'vibrant-rose'],
                  ['PR', record.criteria_pronunciation, 'studio-ink']
                ].map(([label, score, color]) => (
                  <div key={label}>
                    <div className="text-[9px] font-black text-zinc-400 mb-1 tracking-widest">{label}</div>
                    <div className={`text-lg font-black text-${color}`}>{score}</div>
                  </div>
                ))}
              </div>
              <div className="p-8 pt-0 mt-auto">
                <button
                  onClick={() => setSelectedRecord(record)}
                  className="w-full inline-flex items-center justify-center gap-3 rounded-[1.5rem] border-2 border-studio-silver bg-white py-4 text-[13px] font-black text-studio-ink transition-all hover:border-studio-ink hover:bg-studio-paper"
                >
                  REVIEW SESSION
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
              className="fixed inset-x-4 top-[5%] bottom-[5%] z-50 mx-auto max-w-5xl overflow-hidden rounded-[3.5rem] border border-studio-silver bg-studio-paper shadow-3xl flex flex-col"
            >
              <div className="p-10 md:p-12 border-b border-studio-silver bg-white flex items-center justify-between shrink-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-vibrant-gold">
                    <Calendar size={16} />
                    SESSION // {formatDate(selectedRecord.created_at).toUpperCase()}
                  </div>
                  <h2 className="text-4xl font-black tracking-tight text-studio-ink">
                    Session Reconstruction
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedRecord(null)}
                  className="flex h-14 w-14 items-center justify-center rounded-[2rem] border-2 border-studio-silver bg-white text-zinc-300 transition-all hover:text-vibrant-rose hover:border-vibrant-rose/20"
                >
                  <X size={28} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 md:p-14 space-y-12">
                <div className="rounded-[3rem] border border-studio-silver bg-white p-10 shadow-sm">
                  <div className="mb-6 flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.3em] text-zinc-400">
                    <MessageSquare size={18} className="text-vibrant-gold" />
                    Archive Prompt
                  </div>
                  <h3 className="text-2xl font-black leading-tight text-studio-ink pr-12">
                    {selectedRecord.question}
                  </h3>
                  <div className="mt-8 inline-flex items-center gap-3 rounded-2xl bg-studio-paper px-5 py-2 text-[11px] font-black uppercase tracking-[0.25em] text-studio-ink">
                   <BookOpen size={16} className="text-vibrant-emerald" />
                   IELTS PART {selectedRecord.part}
                  </div>
                </div>

                <div className="rounded-[3rem] border border-studio-silver bg-white p-10 shadow-sm">
                  <div className="space-y-4">
                    <p className="text-[12px] font-black uppercase tracking-[0.3em] text-zinc-400">Achieved Band score</p>
                    <div className="flex items-end gap-3 text-studio-ink">
                      <span className="text-8xl font-black leading-none tracking-tighter">
                        {selectedRecord.overall_band.toFixed(1)}
                      </span>
                      <span className="pb-4 text-3xl font-black text-zinc-200">/ 9.0</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-[3.5rem] border border-studio-silver bg-white p-10 shadow-sm">
                  <div className="mb-8 flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.3em] text-zinc-400">
                    <Languages size={18} className="text-vibrant-emerald" />
                    Neural Transcription
                  </div>
                  <div className="rounded-[2.5rem] bg-studio-paper p-10 text-2xl font-bold leading-[2.8rem] tracking-tight text-studio-ink">
                    {selectedRecord.transcription}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-12 items-start">
                  {Object.entries(selectedRecord.feedback_data.criteria || {}).map(([key, data]: [string, any]) => (
                    <div key={key} className="md:col-span-12 rounded-[3.5rem] border border-studio-silver bg-white p-10 shadow-sm flex flex-col">
                      <div className="mb-8 flex items-start justify-between gap-6">
                        <div className="flex items-center gap-5">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-studio-paper text-vibrant-emerald shadow-inner">
                            <CheckCircle2 size={28} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-zinc-400">Dimension</p>
                            <h3 className="text-2xl font-extrabold tracking-tight text-studio-ink">
                              {CRITERIA_LABELS[key] || key}
                            </h3>
                          </div>
                        </div>
                        <span className={`rounded-2xl border-2 px-5 py-3 text-3xl font-black shadow-lg ${getScoreColor(data.score)}`}>
                          {data.score.toFixed(1)}
                        </span>
                      </div>

                      <div className="space-y-10">
                        <div className="px-2">
                          <p className="text-xl font-bold leading-[2.5rem] tracking-tight text-zinc-700 whitespace-pre-line">
                            {formatProceduralText(data.feedback)}
                          </p>
                        </div>
                        <div className="relative rounded-[3rem] border border-studio-silver bg-studio-paper/40 p-10 pb-16">
                          <div className="mb-6 flex items-center gap-3 text-[12px] font-black uppercase tracking-[0.25em] text-vibrant-emerald">
                            <TrendingUp size={20} />
                            Strategic Gains
                          </div>
                          <p className="text-xl font-bold leading-[2.5rem] tracking-tight text-studio-ink whitespace-pre-line">
                            {formatProceduralText(data.improvement)}
                          </p>
                          {extractSource(data.improvement) ? (
                            <div className="absolute bottom-6 right-10 flex items-center gap-2 rounded-full bg-white px-5 py-2 text-[11px] font-black tracking-widest text-zinc-400 shadow-sm border border-studio-silver">
                              <span className="opacity-60 text-[9px]">SOURCE //</span>
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
