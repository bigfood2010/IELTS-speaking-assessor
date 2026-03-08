import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, BookOpen, Check, CheckCircle2, Copy, HelpCircle, Languages, MessageSquare, Mic, Save, Sparkles, TrendingUp, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AudioRecorder } from '@/components/molecules/AudioRecorder';
import { useGeminiKey } from '@/hooks/useGeminiKey';
import { formatDateTimeForLocale } from '@/lib/pacificTime';
import { assessSpeaking, GeminiAssessmentError, type AssessmentResult } from '@/services/geminiService';
import { saveAssessmentResult } from '@/services/historyService';
import { useAuth } from '@/store/AuthContext';

type IELTSPart = '1' | '2' | '3';

const PART_OPTIONS: IELTSPart[] = ['1', '2', '3'];
const CRITERIA_LABELS: Record<string, string> = {
  fluency: 'Fluency & Coherence',
  lexical: 'Lexical Resource',
  grammar: 'Grammatical Range',
  pronunciation: 'Pronunciation',
};

interface PartState {
  questions: string;
  result: AssessmentResult | null;
  audioUrl: string | null;
  base64: string | null;
  mimeType: string | null;
}

const INITIAL_PART_STATE: PartState = {
  questions: '',
  result: null,
  audioUrl: null,
  base64: null,
  mimeType: null,
};

const controlSurfaceClass = 'rounded-[2rem] border border-zinc-200/80 bg-white/92 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm';
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

export default function SpeakingPage() {
  const [part, setPart] = useState<IELTSPart>('1');
  const [partStates, setPartStates] = useState<Record<IELTSPart, PartState>>({
    '1': { ...INITIAL_PART_STATE },
    '2': { ...INITIAL_PART_STATE },
    '3': { ...INITIAL_PART_STATE },
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const currentState = partStates[part];
  const { questions, result, audioUrl } = currentState;

  const updateCurrentPartState = (updates: Partial<PartState>) => {
    setPartStates((prev) => ({
      ...prev,
      [part]: { ...prev[part], ...updates },
    }));
  };

  const partStatesRef = useRef(partStates);
  useEffect(() => {
    partStatesRef.current = partStates;
  }, [partStates]);

  useEffect(() => {
    return () => {
      Object.values(partStatesRef.current).forEach((ps) => {
        if (ps.audioUrl) {
          URL.revokeObjectURL(ps.audioUrl);
        }
      });
    };
  }, []);

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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const clearAudio = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    updateCurrentPartState({ audioUrl: null, base64: null, mimeType: null, result: null });
  };

  const handleRecordingComplete = (base64: string, mimeType: string, url: string) => {
    updateCurrentPartState({ base64, mimeType, audioUrl: url });
    assessMutation.mutate({ base64, mimeType });
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'border-heritage-sage bg-heritage-sage/10 text-heritage-forest';
    if (score >= 6) return 'border-zinc-200 bg-zinc-50 text-zinc-700';
    return 'border-heritage-red/20 bg-heritage-red/5 text-heritage-red';
  };

  const questionPlaceholder = part === '2'
    ? 'Describe a time when you learned something difficult. Leave this empty to let the AI generate a cue card.'
    : 'What do you enjoy most about your hometown? Leave this empty to let the AI suggest a question.';
  const assessmentError = assessMutation.error;
  const quotaError = assessmentError instanceof GeminiAssessmentError ? assessmentError : null;
  const showSettingsShortcut = quotaError && ['quota_exhausted_daily', 'quota_exhausted_rate', 'invalid_api_key'].includes(quotaError.code);

  if (!apiKey) {
    return (
      <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="space-y-4">
          <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 shadow-sm">
            Speaking Studio
          </span>
          <div className="space-y-3">
            <h1 className="max-w-2xl text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
              Prepare, record, and assess your speaking response in one workspace.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-zinc-600">
              Add your Gemini API key once, then return here to practice with the full IELTS speaking workflow.
            </p>
          </div>
        </div>

        <div className="rounded-[2rem] border border-dashed border-zinc-300 bg-white/95 p-10 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-zinc-950 text-white shadow-[0_14px_30px_rgba(15,23,42,0.18)]">
              <Sparkles size={22} />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-950">Gemini API key required</h2>
              <p className="mx-auto max-w-xl text-base leading-7 text-zinc-600">
                This practice workspace runs on your own Gemini key. Add it in Settings, then come back to start recording and receive detailed band feedback.
              </p>
            </div>
            <Link
              to="/app/settings"
              className="inline-flex items-center rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(15,23,42,0.18)] transition-colors hover:bg-zinc-800"
            >
              Open Settings
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <section className="max-w-4xl space-y-4">
          <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500 shadow-sm">
            Speaking Studio
          </span>
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
              Practice Session
            </h1>
          </div>
        </section>

        <button
          onClick={() => setIsGuideOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950"
        >
          <HelpCircle size={16} />
          How to use
        </button>
      </header>

      {/* Guide Modal */}
      <AnimatePresence>
        {isGuideOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGuideOpen(false)}
              className="fixed inset-0 z-50 bg-zinc-950/20 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-6 top-[10%] z-50 mx-auto max-w-2xl overflow-hidden rounded-[2.5rem] border border-zinc-200 bg-white shadow-2xl md:top-[15%]"
            >
              <div className="relative p-8 md:p-12">
                <button
                  onClick={() => setIsGuideOpen(false)}
                  className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-zinc-100 bg-white text-zinc-400 transition-colors hover:text-zinc-950 md:right-8 md:top-8"
                >
                  <X size={20} />
                </button>

                <div className="flex flex-col justify-between gap-10">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Assessment Stage</p>
                      <h3 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-zinc-950">
                        Ready when you are
                      </h3>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center text-center">
                    <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-zinc-50 text-zinc-400">
                      <Mic size={34} />
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-2xl font-semibold tracking-tight text-zinc-950">
                        Start a practice response
                      </h4>
                      <p className="mx-auto max-w-xl text-base leading-7 text-zinc-500">
                        Pick an IELTS part, then record or upload your answer.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      ['1', 'Choose your part'],
                      ['2', 'Record or upload'],
                      ['3', 'Review the score'],
                    ].map(([step, label]) => (
                      <div key={step} className="rounded-[1.5rem] border border-zinc-100 bg-zinc-50/50 px-5 py-5 text-left">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Step {step}</span>
                        <p className="mt-2 text-sm font-medium text-zinc-900">{label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="grid gap-8 lg:grid-cols-[24rem_minmax(0,1fr)] xl:grid-cols-[26rem_minmax(0,1fr)]">
        <div className="space-y-5 xl:sticky xl:top-10 xl:self-start">
          <fieldset className={controlSurfaceClass}>
            <legend className="mb-5 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              <BookOpen size={14} />
              IELTS Part
            </legend>
            <div className="grid grid-cols-3 gap-2.5">
              {PART_OPTIONS.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setPart(option)}
                  aria-pressed={part === option}
                  className={`rounded-[1.35rem] border px-3 py-4 text-center text-sm font-semibold transition-all duration-300 ${
                    part === option
                      ? 'border-heritage-forest bg-heritage-forest text-white shadow-[0_12px_24px_rgba(109,158,81,0.25)] ring-1 ring-heritage-sage/50'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300 hover:bg-white hover:text-zinc-950'
                  }`}
                >
                  <span className="block text-[11px] uppercase tracking-[0.22em] opacity-70">Part</span>
                  <span className="mt-1 block text-base">{option}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className={controlSurfaceClass}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <label htmlFor="speaking-question" className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                <MessageSquare size={14} />
                Question / Cue Card
              </label>
              <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-zinc-400">Optional</span>
            </div>
            <textarea
              id="speaking-question"
              value={questions}
              onChange={(event) => updateCurrentPartState({ questions: event.target.value })}
              placeholder={questionPlaceholder}
              className="min-h-44 w-full resize-none rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-4 text-[0.98rem] leading-7 text-zinc-800 outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-950 focus:bg-white"
            />
            <p className="mt-3 text-sm leading-6 text-zinc-500">
              Leave this blank if you want the AI to generate a suitable IELTS question for the selected part.
            </p>
          </div>

          <div className={controlSurfaceClass}>
            <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
              <Mic size={14} />
              Your Response
            </div>
            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
              onClear={clearAudio}
              audioUrl={audioUrl}
              isProcessing={assessMutation.isPending}
            />
          </div>

          {assessMutation.isError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <div className="min-w-0 space-y-2">
                  <p className="font-semibold text-red-800">{getAssessmentErrorTitle(assessmentError)}</p>
                  <p className="leading-6">{assessmentError?.message || 'Failed to analyze audio. Please try again.'}</p>
                  {quotaError?.resetAt && (
                    <p className="text-xs font-medium text-red-700/90">
                      Next Pacific reset: {formatDateTimeForLocale(quotaError.resetAt)} in your local time.
                    </p>
                  )}
                  {showSettingsShortcut && (
                    <div className="pt-1">
                      <Link
                        to="/app/settings"
                        className="inline-flex items-center rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-100"
                      >
                        Open Settings to update key
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {saveMutation.isError && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              role="alert"
              className="flex items-start gap-3 rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700 shadow-sm"
            >
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <p className="leading-6">Failed to save this score. Please try again.</p>
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
                {result.suggestedQuestion && (
                  <div className={`${resultSurfaceClass} relative overflow-hidden border-heritage-sage bg-heritage-cream/40 p-6`}>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(result.suggestedQuestion!, 'suggested')}
                      className="absolute right-5 top-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/70 bg-white/90 text-zinc-500 shadow-sm transition-colors hover:text-zinc-950"
                      title="Copy suggested question"
                    >
                      {copiedId === 'suggested' ? <Check size={15} className="text-heritage-forest" /> : <Copy size={15} />}
                    </button>
                    <div className="space-y-3 pr-14">
                      <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-heritage-forest">
                        <Sparkles size={13} />
                        AI Suggested {part === '2' ? 'Cue Card' : 'Question'}
                      </div>
                      <p className="max-w-3xl text-lg font-medium leading-8 text-zinc-900">
                        {result.suggestedQuestion}
                      </p>
                    </div>
                  </div>
                )}

                <div className={`${resultSurfaceClass} overflow-hidden p-7 lg:p-8`}>
                  <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Estimated Band Score</p>
                        <div className="flex items-end gap-3">
                          <span className="text-6xl sm:text-7xl font-semibold leading-none tracking-tight text-zinc-950">
                            {result.overallBand.toFixed(1)}
                          </span>
                          <span className="pb-3 text-lg font-medium text-zinc-400">/ 9.0</span>
                        </div>
                      </div>
                      <p className="max-w-xl text-base leading-7 text-zinc-600">
                        Your feedback is broken down by IELTS criteria so you can see where you already sound strong and where your next gains will come from.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveMutation.mutate()}
                      disabled={saveMutation.isPending || saveMutation.isSuccess}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-luxe-espresso px-6 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(45,91,255,0.15)] ring-1 ring-white/10 transition-colors hover:bg-zinc-900 disabled:cursor-not-allowed disabled:bg-emerald-600 disabled:shadow-none"
                    >
                      {saveMutation.isSuccess ? <Check size={16} /> : <Save size={16} />}
                      {saveMutation.isPending ? 'Saving...' : saveMutation.isSuccess ? 'Saved' : 'Save Score'}
                    </button>
                  </div>
                </div>

                <div className={`${resultSurfaceClass} p-7 lg:p-8`}>
                  <div className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                    <Languages size={15} />
                    Transcript
                  </div>
                  <div className="rounded-[1.5rem] bg-zinc-50 px-5 py-5 text-[1.1rem] leading-9 text-zinc-900">
                    {result.transcription}
                  </div>
                </div>

                <div className="grid gap-6 2xl:grid-cols-2">
                  {Object.entries(result.criteria).map(([key, data]) => (
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

                      <div className="space-y-4">
                        <div className="flex gap-3">
                          <CheckCircle2 size={17} className="mt-1 shrink-0 text-emerald-500" />
                          <p className="text-base leading-8 text-zinc-800 whitespace-pre-line">
                            {data.feedback}
                          </p>
                        </div>
                        <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 px-4 py-4">
                          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                            <TrendingUp size={14} />
                            Improvement Focus
                          </div>
                          <p className="text-base leading-8 text-zinc-800 whitespace-pre-line">
                            {data.improvement}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {result.sampleResponse && (
                  <div className={`${resultSurfaceClass} p-7 lg:p-8`}>
                    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Model Answer</p>
                        <h3 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-zinc-950">
                          Sample response for {result.sampleResponse.level}
                        </h3>
                      </div>
                      <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-600">
                        Recommended Practice
                      </span>
                    </div>

                    <div className="space-y-6">
                      <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-5 py-5 text-zinc-800">
                        <p className="text-[1.1rem] leading-9">
                          {result.sampleResponse.text}
                        </p>
                      </div>

                      <div className="rounded-[1.5rem] border border-zinc-200 bg-white">
                        <div className="border-b border-zinc-100 px-5 py-4">
                          <h4 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">
                            Academic Vocabulary
                          </h4>
                        </div>
                        <div className="overflow-x-auto px-5 py-3">
                          <table className="w-full min-w-[34rem] text-sm">
                            <thead>
                              <tr className="border-b border-zinc-100 text-left text-zinc-500">
                                <th className="pb-3 font-semibold">Vocabulary</th>
                                <th className="pb-3 font-semibold">IPA</th>
                                <th className="pb-3 font-semibold">Vietnamese</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                              {result.sampleResponse.vocabulary.map((item, index) => (
                                <tr key={`${item.word}-${index}`}>
                                  <td className="py-3 font-semibold text-zinc-900">{item.word}</td>
                                  <td className="py-3 font-mono text-xs text-zinc-500">{item.ipa}</td>
                                  <td className="py-3 text-zinc-600">{item.vietnamese}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.24, ease: 'easeOut' }}
                className="flex min-h-[40rem] flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border border-dashed border-zinc-200 bg-zinc-50/30 p-8 text-center"
              >
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-white shadow-sm ring-1 ring-zinc-200/50">
                  <Mic size={28} className="text-zinc-400" />
                </div>
                <h3 className="text-2xl font-semibold tracking-tight text-zinc-950">Waiting for response</h3>
                <p className="mt-3 max-w-sm text-base leading-7 text-zinc-500">
                  Pick a part and start recording on the left. Your full band score assessment and transcript will appear here.
                </p>
                <button
                  onClick={() => setIsGuideOpen(true)}
                  className="mt-8 text-sm font-semibold text-zinc-400 transition-colors hover:text-zinc-950 underline underline-offset-4"
                >
                  Need help getting started?
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
