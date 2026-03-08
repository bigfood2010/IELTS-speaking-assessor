import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import BookOpen from 'lucide-react/dist/esm/icons/book-open';
import Check from 'lucide-react/dist/esm/icons/check';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import Copy from 'lucide-react/dist/esm/icons/copy';
import HelpCircle from 'lucide-react/dist/esm/icons/help-circle';
import Languages from 'lucide-react/dist/esm/icons/languages';
import MessageSquare from 'lucide-react/dist/esm/icons/message-square';
import Mic from 'lucide-react/dist/esm/icons/mic';
import Save from 'lucide-react/dist/esm/icons/save';
import Sparkles from 'lucide-react/dist/esm/icons/sparkles';
import TrendingUp from 'lucide-react/dist/esm/icons/trending-up';
import X from 'lucide-react/dist/esm/icons/x';
import Loader2 from 'lucide-react/dist/esm/icons/loader-2';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
const AudioRecorder = React.lazy(() => import('@/components/molecules/AudioRecorder').then(m => ({ default: m.AudioRecorder })));
import { useGeminiKey } from '@/hooks/useGeminiKey';
import { formatDateTimeForLocale } from '@/lib/pacificTime';
import { assessSpeaking, GeminiAssessmentError } from '@/services/geminiService';
import { saveAssessmentResult } from '@/services/historyService';
import { useAuth } from '@/store/AuthContext';
import { usePractice, type AssessmentResult, type PartState } from '@/store/PracticeContext';

type IELTSPart = '1' | '2' | '3';
const PART_OPTIONS: IELTSPart[] = ['1', '2', '3'];

const resultSurfaceClass = 'rounded-[2rem] border border-zinc-200/80 bg-white/96 shadow-[0_20px_48px_rgba(15,23,42,0.08)]';

function getAssessmentErrorTitle(error: Error) {
  if (error instanceof GeminiAssessmentError) {
    switch (error.code) {
      case 'quota_exhausted_daily':
        return 'Free daily quota exhausted';
      case 'quota_exhausted_rate':
        return 'Temporary Gemini rate limit';
      case 'invalid_api_key':
        return 'Gemini key needs attention';
      case 'request_too_large':
        return 'Audio request is too large';
      default:
        return 'Gemini request failed';
    }
  }

  return 'Audio analysis failed';
}

const vnRegex = /[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]/i;

function formatProceduralText(text: string) {
  if (!text) return text;

  let cleaned = text.replace(/\(?https?:\/\/[^\s\)]+\)?/gi, '');
  cleaned = cleaned.replace(/[✦➤▪•◈▷➢]/g, '').replace(/\s*=\s*/g, '\n');
  cleaned = cleaned.replace(/\b(Source|Resource|Nguồn|Nguồn tham khảo):\s*[^/\n\(\)]*/gi, '');
  cleaned = cleaned.replace(/^\s*\/\s*/gm, '');

  const strings = cleaned.split(/[\n/]/).map(s => s.trim()).filter(Boolean);
  let finalLines: string[] = [];

  strings.forEach(str => {
    const sentences = str.split(/([.!?])\s*/).filter(Boolean);
    let currentLine = "";
    
    for (let i = 0; i < sentences.length; i++) {
        const part = sentences[i];
        if (part === '.' || part === '!' || part === '?') {
            currentLine += part;
            continue;
        }
        
        const isPartVN = vnRegex.test(part);
        const isCurrentVN = currentLine ? vnRegex.test(currentLine) : isPartVN;
        
        if (currentLine && isPartVN !== isCurrentVN) {
            finalLines.push(currentLine.trim());
            currentLine = part;
        } else {
            currentLine += (currentLine && !/[.!?]$/.test(currentLine) ? ' ' : '') + part;
        }
    }
    if (currentLine) finalLines.push(currentLine.trim());
  });

  return finalLines.join('\n').replace(/\n{3,}/g, '\n\n');
}

function extractSource(text: string): string | null {
  const match = text.match(/\b(Source|Resource):\s*([^/\n\.\(]+)/i);
  if (!match) return null;
  
  let source = match[2].trim();
  source = source.split(/\s(for|to|on|about)\s/i)[0];
  
  return source.trim() || null;
}

const CRITERIA_LABELS: Record<string, string> = {
  fluency: 'Fluency & Coherence',
  lexical: 'Lexical Resource',
  grammar: 'Grammatical Range',
  pronunciation: 'Pronunciation',
};

const controlSurfaceClass = 'rounded-[2rem] border border-zinc-200/80 bg-white/92 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm';

export default function SpeakingPage() {
  const { 
    activePart: part, 
    setActivePart: setPart, 
    partStates, 
    updatePartState,
    clearPartData,
    clearAllSessionData
  } = usePractice();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const currentState = partStates[part];
  const { questions, result, audioUrl } = currentState;

  const updateCurrentPartState = React.useCallback((updates: Partial<PartState>) => {
    updatePartState(part, updates);
  }, [part, updatePartState]);

  const { apiKey } = useGeminiKey();
  const { user } = useAuth();

  const assessMutation = useMutation({
    mutationFn: async ({ base64, mimeType }: { base64: string; mimeType: string }) => {
      if (!apiKey) {
        throw new Error('API key is missing. Add it in Settings before starting a practice session.');
      }

      return assessSpeaking(apiKey, base64, mimeType, questions, part);
    },
    onSuccess: (data) => {
      updateCurrentPartState({
        result: data,
        questions: data.suggestedQuestion && !questions.trim() ? data.suggestedQuestion : questions,
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error('You must be signed in to save results.');
      }

      if (!result) {
        throw new Error('No result is available to save.');
      }

      return saveAssessmentResult(user.id, part, questions, result);
    },
  });

  const copyToClipboard = React.useCallback((text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    });
  }, []);

  const clearAudio = React.useCallback(() => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    updateCurrentPartState({ audioUrl: null, base64: null, mimeType: null, result: null });
  }, [audioUrl, updateCurrentPartState]);

  const handleRecordingComplete = React.useCallback((base64: string, mimeType: string, url: string) => {
    updateCurrentPartState({ base64, mimeType, audioUrl: url });
    assessMutation.mutate({ base64, mimeType });
  }, [updateCurrentPartState, assessMutation]);

  const getScoreColor = (score: number) => {
    if (score >= 7.5) return 'border-vibrant-emerald bg-vibrant-emerald/5 text-vibrant-emerald';
    if (score >= 6.5) return 'border-vibrant-gold/30 bg-vibrant-gold/10 text-vibrant-gold';
    return 'border-vibrant-rose/20 bg-vibrant-rose/5 text-vibrant-rose';
  };

  const questionPlaceholder = part === '2'
    ? 'Describe a time when you learned something difficult. Leave this empty to let the AI generate a cue card.'
    : 'What do you enjoy most about your hometown? Leave this empty to let the AI suggest a question.';
  const assessmentError = assessMutation.error;
  const quotaError = assessmentError instanceof GeminiAssessmentError ? assessmentError : null;
  const showSettingsShortcut = quotaError && ['quota_exhausted_daily', 'quota_exhausted_rate', 'invalid_api_key'].includes(quotaError.code);

  if (!apiKey) {
    return (
      <div className="max-w-3xl space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 font-sans">
        <div className="space-y-4">
          <span className="inline-flex items-center rounded-full border border-vibrant-emerald/20 bg-vibrant-emerald/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-vibrant-emerald shadow-sm">
            Speaking Studio
          </span>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl sm:text-5xl font-black tracking-tight text-studio-ink">
              Ready to master <br/>your speaking score?
            </h1>
            <p className="max-w-2xl text-lg font-medium leading-relaxed text-zinc-500">
              Add your Gemini API key once to unlock the full potential of our high-fidelity AI assessment studio.
            </p>
          </div>
        </div>

        <div className="rounded-[3rem] border-2 border-dashed border-studio-silver bg-white/80 p-14 shadow-2xl backdrop-blur-xl">
          <div className="space-y-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2.25rem] bg-vibrant-rose text-white shadow-2xl shadow-vibrant-rose/40">
              <Sparkles size={28} />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold tracking-tight text-studio-ink">API Key Required</h2>
              <p className="mx-auto max-w-xl text-lg font-medium text-zinc-500">
                This studio runs on your own high-speed Gemini key. It takes 30 seconds to set up and provides unlimited deep-dives.
              </p>
            </div>
            <Link
              to="/app/settings"
              className="inline-flex items-center rounded-full bg-vibrant-emerald px-10 py-4 text-lg font-bold text-white shadow-2xl shadow-vibrant-emerald/30 transition-all hover:scale-[1.05] active:scale-[0.98]"
            >
              Configure Studio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 font-sans pb-20">
      <header className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <section className="max-w-4xl space-y-4">
          <span className="inline-flex items-center rounded-full border border-vibrant-emerald/20 bg-vibrant-emerald/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-vibrant-emerald">
            Live Practice
          </span>
          <div className="space-y-1.5">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-studio-ink">
              Expert Session
            </h1>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-4">
          {Object.values(partStates).some(s => s.audioUrl || s.result) ? (
            <button
              onClick={() => {
                if (confirm('Clear all unsaved practice data for all parts?')) {
                  clearAllSessionData();
                }
              }}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-studio-silver bg-white px-6 py-3 text-sm font-bold text-zinc-400 transition-all hover:border-vibrant-rose/30 hover:bg-vibrant-rose/5 hover:text-vibrant-rose"
            >
              <X size={18} />
              Reset All
            </button>
          ) : null}

          <button
            onClick={() => setIsGuideOpen(true)}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-studio-silver bg-white px-8 py-3 text-sm font-bold text-studio-ink shadow-sm transition-all hover:border-zinc-300 hover:bg-studio-paper"
          >
            <HelpCircle size={18} />
            Studio Guide
          </button>
        </div>
      </header>

      <AnimatePresence>
        {isGuideOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGuideOpen(false)}
              className="fixed inset-0 z-50 bg-studio-ink/20 backdrop-blur-xl"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="fixed inset-x-6 top-[8%] z-50 mx-auto max-w-3xl overflow-hidden rounded-[3rem] border border-studio-silver bg-white shadow-3xl md:top-[12%]"
            >
              <div className="relative p-10 md:p-14">
                <button
                  onClick={() => setIsGuideOpen(false)}
                  className="absolute right-8 top-8 flex h-12 w-12 items-center justify-center rounded-2xl border border-studio-silver bg-white text-zinc-400 transition-all hover:text-vibrant-rose hover:border-vibrant-rose/20"
                >
                  <X size={24} />
                </button>

                <div className="flex flex-col gap-12">
                  <div className="space-y-4">
                    <p className="text-[12px] font-black uppercase tracking-[0.3em] text-vibrant-emerald">Pro Workflow</p>
                    <h3 className="text-4xl font-extrabold tracking-tight text-studio-ink leading-tight">
                      Master the Studio
                    </h3>
                  </div>

                  <div className="flex flex-col items-center justify-center text-center py-6">
                    <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-[2.5rem] bg-studio-paper text-zinc-300 shadow-inner">
                      <Mic size={48} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-2xl font-bold tracking-tight text-studio-ink">
                        Input → AI → Score
                      </h4>
                      <p className="mx-auto max-w-xl text-lg font-medium leading-relaxed text-zinc-500">
                        Our studio analyzes every phoneme and grammatical structure to provide high-fidelity band estimates.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    {[
                      ['1', 'vibrant-gold', 'Pick your IELTS part from the selector'],
                      ['2', 'vibrant-rose', 'Record or upload your audio file'],
                      ['3', 'vibrant-emerald', 'Receive detailed band feedback'],
                    ].map(([step, color, label]) => (
                      <div key={step} className="group rounded-[2rem] border border-studio-silver bg-studio-paper/40 p-6 transition-all hover:bg-white hover:shadow-xl">
                        <span className={`text-[12px] font-black uppercase tracking-widest text-${color}`}>Phase {step}</span>
                        <p className="mt-3 text-[15px] font-bold text-studio-ink leading-snug">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <div className="grid gap-10 lg:grid-cols-[24rem_minmax(0,1fr)] xl:grid-cols-[28rem_minmax(0,1fr)]">
        <div className="space-y-6 lg:sticky lg:top-10 lg:self-start">
          <div className="rounded-[2.5rem] border border-studio-silver bg-white/80 p-8 shadow-sm backdrop-blur-md">
            <div className="mb-6 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-400">
              <BookOpen size={16} className="text-vibrant-emerald" />
              IELTS Session Part
            </div>
            <div className="grid grid-cols-3 gap-3">
              {PART_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPart(option)}
                  aria-pressed={part === option}
                  className={`relative overflow-hidden rounded-[1.5rem] border-2 px-3 py-6 text-center transition-all duration-500 ${
                    part === option
                      ? 'border-vibrant-emerald bg-vibrant-emerald text-white shadow-xl shadow-vibrant-emerald/20'
                      : 'border-studio-silver bg-studio-paper/40 text-zinc-400 hover:border-zinc-300 hover:bg-white hover:text-studio-ink'
                  }`}
                >
                  <span className="relative z-10 block text-[10px] font-black uppercase tracking-[0.2em] opacity-80">Part</span>
                  <span className="relative z-10 mt-1 block text-2xl font-black">{option}</span>
                  {part === option && (
                    <motion.div 
                      layoutId="part-active"
                      className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-[2.5rem] border border-studio-silver bg-white/80 p-8 shadow-sm backdrop-blur-md">
            <div className="mb-5 flex items-center justify-between gap-3">
              <label htmlFor="speaking-question" className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-400">
                <MessageSquare size={16} className="text-vibrant-gold" />
                Prompt Focus
              </label>
              <span className="rounded-full bg-studio-paper px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-zinc-400">Optional</span>
            </div>
            <textarea
              id="speaking-question"
              value={questions}
              onChange={(event) => updateCurrentPartState({ questions: event.target.value })}
              placeholder={questionPlaceholder}
              className="min-h-48 w-full resize-none rounded-[2rem] border-2 border-studio-silver bg-studio-paper/30 px-6 py-6 text-lg font-medium leading-relaxed text-studio-ink outline-none transition-all placeholder:text-zinc-300 focus:border-vibrant-emerald/30 focus:bg-white focus:shadow-inner"
            />
          </div>

          <div className="rounded-[2.5rem] border border-studio-silver bg-white/80 p-8 shadow-sm backdrop-blur-md">
            <div className="mb-5 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.25em] text-zinc-400">
              <Mic size={16} className="text-vibrant-rose" />
              Live Input
            </div>
            <React.Suspense fallback={
              <div className="flex h-32 items-center justify-center rounded-[1.7rem] border border-zinc-200 bg-studio-paper/20">
                <Loader2 size={24} className="animate-spin text-zinc-300" />
              </div>
            }>
              <AudioRecorder
                onRecordingComplete={handleRecordingComplete}
                onClear={clearAudio}
                audioUrl={audioUrl}
                isProcessing={assessMutation.isPending}
              />
            </React.Suspense>


          </div>

          {assessMutation.isError && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              role="alert"
              className="rounded-[2rem] border-2 border-vibrant-rose/20 bg-vibrant-rose/5 px-6 py-6 text-vibrant-rose shadow-sm"
            >
              <div className="flex items-start gap-4">
                <AlertCircle size={22} className="mt-1 shrink-0" />
                <div className="min-w-0 space-y-2">
                  <p className="text-lg font-black tracking-tight">{getAssessmentErrorTitle(assessmentError)}</p>
                  <p className="text-[15px] font-medium leading-relaxed opacity-90">{assessmentError?.message || 'Studio failed to process audio.'}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <div className="min-w-0">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="space-y-6"
              >
                {result.suggestedQuestion ? (
                  <div className="group relative overflow-hidden rounded-[3rem] border-2 border-vibrant-gold/20 bg-vibrant-gold/5 p-8 backdrop-blur-sm transition-all hover:bg-vibrant-gold/10">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(result.suggestedQuestion!, 'suggested')}
                      className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-white bg-white/50 text-vibrant-gold shadow-sm backdrop-blur-md transition-all hover:scale-110 active:scale-90"
                      title="Copy goal question"
                    >
                      {copiedId === 'suggested' ? <Check size={20} className="text-vibrant-emerald" /> : <Copy size={20} />}
                    </button>
                    <div className="space-y-4 pr-16">
                      <div className="inline-flex items-center gap-2 rounded-xl bg-vibrant-gold px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-white">
                        <Sparkles size={14} />
                        Suggested Question
                      </div>
                      <p className="max-w-3xl text-xl font-bold leading-relaxed tracking-tight text-studio-ink">
                        {result.suggestedQuestion}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-[2.5rem] border border-studio-silver bg-white p-8 shadow-xl shadow-black/5">
                  <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Overall Band Score</p>
                        <div className="flex items-end gap-2.5 text-studio-ink">
                          <span className="text-7xl font-black leading-none tracking-tighter">
                            {result.overallBand.toFixed(1)}
                          </span>
                          <span className="pb-2 text-2xl font-black text-zinc-200">/ 9.0</span>
                        </div>
                      </div>
                      <p className="max-w-xl text-base font-medium leading-relaxed text-zinc-500">
                        Detailed analysis based on your fluency, vocabulary, grammar, and pronunciation.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveMutation.mutate()}
                      disabled={saveMutation.isPending || saveMutation.isSuccess}
                      className={`group relative inline-flex h-16 w-48 items-center justify-center overflow-hidden rounded-2xl text-base font-black transition-all hover:scale-105 active:scale-95 ${
                        saveMutation.isSuccess 
                          ? 'bg-vibrant-gold text-white shadow-vibrant-gold/30' 
                          : 'bg-vibrant-rose text-white shadow-lg shadow-vibrant-rose/30'
                      }`}
                    >
                      <span className="relative z-10 flex items-center gap-2.5">
                        {saveMutation.isSuccess ? <CheckCircle2 size={20} /> : <Save size={20} />}
                        {saveMutation.isPending ? 'SAVING...' : saveMutation.isSuccess ? 'SAVED' : 'SAVE SCORE'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="rounded-[3.5rem] border border-studio-silver bg-white p-10 shadow-xl">
                  <div className="mb-6 flex items-center gap-2 text-[12px] font-black uppercase tracking-[0.3em] text-zinc-400">
                    <Languages size={18} className="text-vibrant-emerald" />
                    Transcription
                  </div>
                  <div className="rounded-[2.5rem] bg-studio-paper p-10 text-lg font-medium leading-relaxed tracking-tight text-studio-ink shadow-inner">
                    {result.transcription}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-12 items-start">
                  {Object.entries(result.criteria).map(([key, data]) => (
                    <div key={key} className="md:col-span-12 rounded-[2.5rem] border border-studio-silver bg-white p-8 shadow-xl transition-all hover:shadow-2xl">
                      <div className="mb-6 flex items-start justify-between gap-6">
                        <div className="flex items-center gap-4">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-inner transition-colors duration-500 ${
                            data.score >= 7 ? 'bg-vibrant-emerald/10 text-vibrant-emerald' : 
                            data.score >= 5 ? 'bg-vibrant-gold/10 text-vibrant-gold' : 
                            'bg-vibrant-rose/10 text-vibrant-rose'
                          }`}>
                            <CheckCircle2 size={24} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400">Criterion</p>
                            <h3 className="text-xl font-extrabold tracking-tight text-studio-ink">
                              {CRITERIA_LABELS[key] || key}
                            </h3>
                          </div>
                        </div>
                        <span className={`rounded-xl border-2 px-4 py-2 text-2xl font-black shadow-lg ${getScoreColor(data.score)}`}>
                          {data.score.toFixed(1)}
                        </span>
                      </div>

                      <div className="space-y-8">
                        <div className="px-1">
                          <p className="text-base font-medium leading-relaxed tracking-tight text-zinc-700 whitespace-pre-line">
                            {formatProceduralText(data.feedback)}
                          </p>
                        </div>
                        <div className="relative rounded-[2rem] border border-studio-silver bg-studio-paper/40 p-8 pb-14">
                          <div className="mb-4 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.25em] text-vibrant-emerald">
                            <TrendingUp size={18} />
                            Improvement
                          </div>
                          <p className="text-base font-medium leading-relaxed tracking-tight text-studio-ink whitespace-pre-line">
                            {formatProceduralText(data.improvement)}
                          </p>
                          {extractSource(data.improvement) && (
                            <div className="absolute bottom-5 left-8 flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-zinc-400">
                              <span className="opacity-50 text-[9px]">SOURCE //</span>
                              <span>{extractSource(data.improvement).toUpperCase()}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}


                </div>

                {result.sampleResponse ? (
                  <div className="rounded-[4rem] border border-studio-silver bg-white p-12 shadow-2xl">
                    <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-2">
                        <p className="text-[12px] font-black uppercase tracking-[0.3em] text-vibrant-gold">Model Answer</p>
                        <h3 className="text-4xl font-extrabold tracking-tight text-studio-ink">
                          Platinum Reference ({result.sampleResponse.level})
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-10">
                      <div className="rounded-[3rem] bg-studio-paper p-12 shadow-inner border border-studio-silver">
                        <p className="text-xl font-medium leading-relaxed tracking-tight text-studio-ink/90 italic">
                          "{result.sampleResponse.text}"
                        </p>

                      </div>

                      <div className="overflow-hidden rounded-[2.4rem] border border-studio-silver bg-white shadow-[0_16px_34px_rgba(15,23,42,0.04)]">
                        <div className="border-b border-studio-silver bg-studio-paper/85 px-6 py-5 sm:px-7">
                          <h4 className="text-[12px] font-black uppercase tracking-[0.22em] text-studio-ink">
                            High-Yield Vocabulary
                          </h4>
                        </div>
                        <div className="overflow-x-auto px-4 py-3 sm:px-6">
                          <table className="w-full min-w-[30rem] table-fixed">
                            <colgroup>
                              <col className="w-[32%]" />
                              <col className="w-[30%]" />
                              <col className="w-[38%]" />
                            </colgroup>
                            <thead>
                              <tr className="border-b border-studio-silver text-left text-[12px] font-bold tracking-[0.04em] text-zinc-600">
                                <th className="px-4 pb-4 pt-2">Vocabulary Term</th>
                                <th className="px-4 pb-4 pt-2">Pronunciation (IPA)</th>
                                <th className="px-4 pb-4 pt-2">Meaning in Vietnamese</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.sampleResponse.vocabulary.map((item, index) => (
                                <tr
                                  key={`${item.word}-${index}`}
                                  className="group border-b border-studio-paper/80 transition-colors duration-200 last:border-b-0 hover:bg-studio-paper/70"
                                >
                                  <td className="px-4 py-4 align-top sm:py-5">
                                    <span className="inline-block text-[1.05rem] font-bold leading-7 tracking-[-0.025em] text-vibrant-emerald transition-colors duration-200 group-hover:text-studio-ink sm:text-[1.15rem]">
                                      {item.word}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 align-top sm:py-5">
                                    <span className="inline-block max-w-full whitespace-normal break-words rounded-2xl border border-vibrant-rose/15 bg-vibrant-rose/[0.07] px-3 py-2 font-mono text-[13px] font-medium leading-5 text-vibrant-rose/80">
                                      {item.ipa}
                                    </span>
                                  </td>
                                  <td className="px-4 py-4 align-top sm:py-5">
                                    <span className="text-[15px] font-semibold leading-6 text-studio-ink/85 sm:text-base">
                                      {item.vietnamese}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>


                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex min-h-[45rem] flex-col items-center justify-center rounded-[4rem] border-4 border-dashed border-studio-silver bg-studio-paper/20 p-12 text-center"
              >
                <div className="group relative mb-10 flex h-32 w-32 items-center justify-center">
                  <div className="absolute inset-0 animate-ping rounded-full bg-vibrant-emerald/10" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-[2.25rem] bg-white shadow-2xl transition-transform group-hover:scale-110 duration-500">
                    <Mic size={40} className="text-zinc-200" />
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="text-3xl font-black tracking-tight text-studio-ink">Studio Standby</h3>
                  <p className="mx-auto max-w-sm text-lg font-medium leading-relaxed text-zinc-400">
                    Connect your spoken response and start the AI sequence.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
