import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import BookOpen from "lucide-react/dist/esm/icons/book-open";
import Check from "lucide-react/dist/esm/icons/check";
import CheckCircle2 from "lucide-react/dist/esm/icons/check-circle-2";
import Copy from "lucide-react/dist/esm/icons/copy";
import HelpCircle from "lucide-react/dist/esm/icons/help-circle";
import Languages from "lucide-react/dist/esm/icons/languages";
import MessageSquare from "lucide-react/dist/esm/icons/message-square";
import Mic from "lucide-react/dist/esm/icons/mic";
import Save from "lucide-react/dist/esm/icons/save";
import Sparkles from "lucide-react/dist/esm/icons/sparkles";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import X from "lucide-react/dist/esm/icons/x";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
const AudioRecorder = React.lazy(() =>
  import("@/components/molecules/AudioRecorder").then((m) => ({
    default: m.AudioRecorder,
  })),
);
import { useGeminiKey } from "@/hooks/useGeminiKey";
import {
  assessSpeaking,
  GeminiAssessmentError,
} from "@/services/geminiService";
import { saveAssessmentResult } from "@/services/historyService";
import { useAuth } from "@/store/AuthContext";
import { usePractice, type PartState } from "@/store/PracticeContext";
import { getScoreColor } from "@/lib/scores";
import { formatProceduralText, extractSource } from "@/lib/formatters";
import { CRITERIA_LABELS } from "@/lib/constants";
import type { AssessmentResult } from "@/services/geminiService";

interface CriteriaData {
  score: number;
  feedback: string;
  improvement?: string;
  [key: string]: unknown;
}

type IELTSPart = "1" | "2" | "3";
const PART_OPTIONS: IELTSPart[] = ["1", "2", "3"];
const focusRingClass =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibrant-emerald/40 focus-visible:ring-offset-2";

function getAssessmentErrorTitle(error: Error) {
  if (error instanceof GeminiAssessmentError) {
    switch (error.code) {
      case "quota_exhausted_daily":
        return "Free daily quota exhausted";
      case "quota_exhausted_rate":
        return "Temporary Gemini rate limit";
      case "invalid_api_key":
        return "Gemini key needs attention";
      case "request_too_large":
        return "Audio request is too large";
      default:
        return "Gemini request failed";
    }
  }

  return "Audio analysis failed";
}

export default function SpeakingPage() {
  const {
    activePart: part,
    setActivePart: setPart,
    partStates,
    updatePartState,
    clearPartData,
    clearAllSessionData,
  } = usePractice();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  const currentState = partStates[part];
  const { questions, result, audioUrl } = currentState;

  const updateCurrentPartState = React.useCallback(
    (updates: Partial<PartState>) => {
      updatePartState(part, updates);
    },
    [part, updatePartState],
  );

  const { apiKey } = useGeminiKey();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const assessMutation = useMutation({
    mutationFn: async ({
      base64,
      mimeType,
    }: {
      base64: string;
      mimeType: string;
    }) => {
      if (!apiKey) {
        throw new Error(
          "API key is missing. Add it in Settings before starting a practice session.",
        );
      }

      return assessSpeaking(apiKey, base64, mimeType, questions, part);
    },
    onSuccess: (data) => {
      updateCurrentPartState({
        result: data,
        questions:
          data.suggestedQuestion && !questions.trim()
            ? data.suggestedQuestion
            : questions,
      });
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) {
        throw new Error("You must be signed in to save results.");
      }

      if (!result) {
        throw new Error("No result is available to save.");
      }

      return saveAssessmentResult(user.id, part, questions, result);
    },
    onSuccess: () => {
      if (user) {
        void queryClient.invalidateQueries({
          queryKey: ["assessments", user.id],
        });
      }
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
    updateCurrentPartState({
      audioUrl: null,
      base64: null,
      mimeType: null,
      result: null,
    });
  }, [audioUrl, updateCurrentPartState]);

  const handleRecordingComplete = React.useCallback(
    (base64: string, mimeType: string, url: string) => {
      updateCurrentPartState({ base64, mimeType, audioUrl: url });
      assessMutation.mutate({ base64, mimeType });
    },
    [updateCurrentPartState, assessMutation],
  );

  const questionPlaceholder =
    part === "2"
      ? "Describe a time when you learned something difficult. Leave this empty to let the AI generate a cue card."
      : "What do you enjoy most about your hometown? Leave this empty to let the AI suggest a question.";
  const assessmentError = assessMutation.error;
  const quotaError =
    assessmentError instanceof GeminiAssessmentError ? assessmentError : null;
  const showSettingsShortcut =
    quotaError &&
    [
      "quota_exhausted_daily",
      "quota_exhausted_rate",
      "invalid_api_key",
    ].includes(quotaError.code);

  if (!apiKey) {
    return (
      <div className="max-w-3xl space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 font-sans">
        <div className="space-y-4">
          <span className="inline-flex items-center rounded-full border border-vibrant-emerald/20 bg-vibrant-emerald/5 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-vibrant-emerald shadow-sm">
            Speaking Studio
          </span>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl sm:text-5xl font-black tracking-tight text-studio-ink">
              Ready to master <br />
              your speaking score?
            </h1>
            <p className="max-w-2xl text-base font-medium leading-relaxed text-zinc-500">
              Add your Gemini API key once to unlock the full potential of our
              high-fidelity AI assessment studio.
            </p>
          </div>
        </div>

        <div className="rounded-[3rem] border-2 border-dashed border-studio-silver bg-white/80 p-14 shadow-2xl backdrop-blur-xl">
          <div className="space-y-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[2.25rem] bg-vibrant-rose text-white shadow-2xl shadow-vibrant-rose/40">
              <Sparkles size={28} />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-extrabold tracking-tight text-studio-ink">
                API Key Required
              </h2>
              <p className="mx-auto max-w-xl text-base font-medium text-zinc-500">
                This studio runs on your own high-speed Gemini key. It takes 30
                seconds to set up and provides unlimited deep-dives.
              </p>
            </div>
            <Link
              to="/app/settings"
              className="inline-flex items-center rounded-full bg-vibrant-emerald px-10 py-4 text-lg font-bold text-white shadow-2xl shadow-vibrant-emerald/30 transition-transform hover:scale-[1.05] active:scale-[0.98]"
            >
              Configure Studio
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700 font-sans pb-20">
      <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <section className="max-w-4xl">
          <div className="space-y-1.5">
            <h1 className="text-3xl font-extrabold text-pretty text-studio-ink sm:text-4xl">
              Practice Studio
            </h1>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-4">
          {Object.values(partStates).some((s) => s.audioUrl || s.result) ? (
            <button
              onClick={() => {
                if (confirm("Clear all unsaved practice data for all parts?")) {
                  clearAllSessionData();
                }
              }}
              className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-studio-silver bg-white px-4 text-sm font-semibold text-zinc-500 transition-colors hover:border-vibrant-rose/30 hover:bg-vibrant-rose/5 hover:text-vibrant-rose ${focusRingClass}`}
            >
              <X size={18} />
              Reset All
            </button>
          ) : null}

          <button
            onClick={() => setIsGuideOpen(true)}
            className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-full border border-studio-silver bg-white px-5 text-sm font-semibold text-studio-ink shadow-sm transition-colors hover:border-zinc-300 hover:bg-studio-paper ${focusRingClass}`}
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
              role="dialog"
              aria-modal="true"
              aria-labelledby="studio-guide-title"
              className="fixed inset-x-6 top-[8%] z-50 mx-auto max-w-3xl overflow-hidden rounded-[2rem] border border-studio-silver bg-white shadow-3xl md:top-[12%]"
            >
              <div className="relative p-8 md:p-10">
                <button
                  type="button"
                  onClick={() => setIsGuideOpen(false)}
                  aria-label="Close studio guide"
                  className={`absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-xl border border-studio-silver bg-white text-zinc-400 transition-colors hover:border-vibrant-rose/20 hover:text-vibrant-rose ${focusRingClass}`}
                >
                  <X size={20} />
                </button>

                <div className="flex flex-col gap-8">
                  <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-vibrant-emerald">
                      Workflow
                    </p>
                    <h3
                      id="studio-guide-title"
                      className="text-3xl font-extrabold leading-tight text-pretty text-studio-ink"
                    >
                      Master the Studio
                    </h3>
                  </div>

                  <div className="flex flex-col items-center justify-center py-4 text-center">
                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-studio-paper text-zinc-300 shadow-inner">
                      <Mic size={34} strokeWidth={1.5} />
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-xl font-bold text-studio-ink">
                        Input → AI → Score
                      </h4>
                      <p className="mx-auto max-w-xl text-base font-medium leading-relaxed text-zinc-500">
                        Our studio analyzes every phoneme and grammatical
                        structure to provide high-fidelity band estimates.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-3">
                    {[
                      [
                        "1",
                        "vibrant-gold",
                        "Pick your IELTS part from the selector",
                      ],
                      ["2", "vibrant-rose", "Record or upload your audio file"],
                      [
                        "3",
                        "vibrant-emerald",
                        "Receive detailed band feedback",
                      ],
                    ].map(([step, color, label]) => (
                      <div
                        key={step}
                        className="group rounded-2xl border border-studio-silver bg-studio-paper/40 p-5 transition-colors hover:bg-white"
                      >
                        <span
                          className={`text-[11px] font-bold uppercase tracking-widest text-${color}`}
                        >
                          Phase {step}
                        </span>
                        <p className="mt-3 text-sm font-semibold leading-snug text-studio-ink">
                          {label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <div className="grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[24rem_minmax(0,1fr)]">
        <div className="space-y-5 lg:sticky lg:top-10 lg:self-start">
          <div className="rounded-[1.75rem] border border-studio-silver bg-white/85 p-6 shadow-sm backdrop-blur-md">
            <div className="mb-5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
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
                  className={`relative overflow-hidden rounded-2xl border px-3 py-4 text-center transition-colors duration-200 ${focusRingClass} ${
                    part === option
                      ? "border-vibrant-emerald bg-vibrant-emerald text-white shadow-lg shadow-vibrant-emerald/15"
                      : "border-studio-silver bg-studio-paper/40 text-zinc-400 hover:border-zinc-300 hover:bg-white hover:text-studio-ink"
                  }`}
                >
                  <span className="relative z-10 block text-[9px] font-bold uppercase tracking-[0.18em] opacity-80">
                    Part
                  </span>
                  <span className="relative z-10 mt-1 block text-xl font-extrabold">
                    {option}
                  </span>
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

          <div className="rounded-[1.75rem] border border-studio-silver bg-white/85 p-6 shadow-sm backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between gap-3">
              <label
                htmlFor="speaking-question"
                className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400"
              >
                <MessageSquare size={16} className="text-vibrant-gold" />
                Practice question
              </label>
              <span className="rounded-full bg-studio-paper px-2.5 py-1 text-[9px] font-bold uppercase tracking-widest text-zinc-400">
                Optional
              </span>
            </div>
            <textarea
              id="speaking-question"
              value={questions}
              onChange={(event) =>
                updateCurrentPartState({ questions: event.target.value })
              }
              placeholder={questionPlaceholder}
              spellCheck={true}
              className="min-h-40 w-full resize-none rounded-2xl border border-studio-silver bg-studio-paper/30 px-5 py-4 text-sm font-medium leading-6 text-studio-ink transition-colors placeholder:text-zinc-300 focus:border-vibrant-emerald/30 focus:bg-white focus:shadow-inner focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibrant-emerald/25"
            />
          </div>

          <div className="rounded-[1.75rem] border border-studio-silver bg-white/85 p-6 shadow-sm backdrop-blur-md">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
              <Mic size={16} className="text-vibrant-rose" />
              Live Input
            </div>
            <React.Suspense
              fallback={
                <div className="flex h-32 items-center justify-center rounded-[1.7rem] border border-zinc-200 bg-studio-paper/20">
                  <Loader2 size={24} className="animate-spin text-zinc-300" />
                </div>
              }
            >
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
                  <p className="text-base font-black tracking-tight">
                    {getAssessmentErrorTitle(assessmentError)}
                  </p>
                  <p className="text-[15px] font-medium leading-relaxed opacity-90">
                    {assessmentError?.message ||
                      "Studio failed to process audio."}
                  </p>
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
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="space-y-5"
              >
                {result.suggestedQuestion ? (
                  <div className="group relative overflow-hidden rounded-[1.75rem] border border-vibrant-gold/20 bg-vibrant-gold/5 p-6 backdrop-blur-sm transition-colors hover:bg-vibrant-gold/10">
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(result.suggestedQuestion!, "suggested")
                      }
                      aria-label="Copy suggested question"
                      className={`absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-xl border border-white bg-white/70 text-vibrant-gold shadow-sm backdrop-blur-md transition-transform hover:scale-105 active:scale-95 ${focusRingClass}`}
                      title="Copy goal question"
                    >
                      {copiedId === "suggested" ? (
                        <Check size={20} className="text-vibrant-emerald" />
                      ) : (
                        <Copy size={20} />
                      )}
                    </button>
                    <div className="space-y-3 pr-14">
                      <div className="inline-flex items-center gap-2 rounded-lg bg-vibrant-gold px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                        <Sparkles size={14} />
                        Suggested Question
                      </div>
                      <p className="max-w-3xl text-base font-semibold leading-7 text-studio-ink">
                        {result.suggestedQuestion}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-[1.75rem] border border-studio-silver bg-white p-6 shadow-sm">
                  <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                          Overall Band Score
                        </p>
                        <div className="flex items-end gap-2 text-studio-ink">
                          <span className="text-5xl font-extrabold leading-none tabular-nums">
                            {result.overallBand.toFixed(1)}
                          </span>
                          <span className="pb-1 text-xl font-semibold text-zinc-300">
                            / 9.0
                          </span>
                        </div>
                      </div>
                      <p className="max-w-xl text-sm font-medium leading-relaxed text-zinc-500">
                        Detailed analysis based on your fluency, vocabulary,
                        grammar, and pronunciation.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveMutation.mutate()}
                      disabled={
                        saveMutation.isPending || saveMutation.isSuccess
                      }
                      className={`group relative inline-flex h-12 w-full items-center justify-center overflow-hidden rounded-xl text-sm font-bold transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed lg:w-40 ${focusRingClass} ${
                        saveMutation.isSuccess
                          ? "bg-vibrant-gold text-white shadow-vibrant-gold/20"
                          : "bg-vibrant-rose text-white shadow-sm shadow-vibrant-rose/20"
                      }`}
                    >
                      <span className="relative z-10 flex items-center gap-2.5">
                        {saveMutation.isSuccess ? (
                          <CheckCircle2 size={20} />
                        ) : (
                          <Save size={20} />
                        )}
                        {saveMutation.isPending
                          ? "Saving…"
                          : saveMutation.isSuccess
                            ? "Saved"
                            : "Save Score"}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-studio-silver bg-white p-7 shadow-sm">
                  <div className="mb-4 flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-zinc-400">
                    <Languages size={18} className="text-vibrant-emerald" />
                    Transcription
                  </div>
                  <div className="rounded-[1.5rem] bg-studio-paper p-6 text-sm font-medium leading-7 tracking-tight text-studio-ink shadow-inner">
                    {result.transcription}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 md:grid-cols-12 items-start">
                  {Object.entries(result.criteria).map(
                    ([key, data]: [string, CriteriaData]) => (
                      <div
                        key={key}
                        className="md:col-span-12 rounded-[1.75rem] border border-studio-silver bg-white p-6 shadow-sm transition-shadow hover:shadow-lg"
                      >
                        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3.5">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-inner transition-colors duration-500 ${
                                data.score >= 7
                                  ? "bg-vibrant-emerald/10 text-vibrant-emerald"
                                  : data.score >= 5
                                    ? "bg-vibrant-gold/10 text-vibrant-gold"
                                    : "bg-vibrant-rose/10 text-vibrant-rose"
                              }`}
                            >
                              <CheckCircle2 size={20} />
                            </div>
                            <div>
                              <h3 className="text-base font-extrabold tracking-tight text-studio-ink">
                                {CRITERIA_LABELS[key] || key}
                              </h3>
                            </div>
                          </div>
                          <span
                            className={`w-fit rounded-xl border-2 px-3.5 py-1.5 text-lg font-black shadow-sm ${getScoreColor(data.score)}`}
                          >
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
                              Improvement
                            </div>
                            <p className="text-sm font-medium leading-6 text-studio-ink whitespace-pre-line">
                              {formatProceduralText(data.improvement)}
                            </p>
                            {extractSource(data.improvement) && (
                              <div className="mt-4 flex items-center gap-1.5 text-[9px] font-bold tracking-widest text-zinc-400">
                                <span className="opacity-50 text-[8px]">
                                  SOURCE //
                                </span>
                                <span>
                                  {extractSource(
                                    data.improvement,
                                  ).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>

                {result.sampleResponse ? (
                  <div className="rounded-[2.5rem] border border-studio-silver bg-white p-8 shadow-xl">
                    <div className="mb-7 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-vibrant-gold">
                          Model Answer
                        </p>
                        <h3 className="text-3xl font-extrabold tracking-tight text-studio-ink">
                          Reference ({result.sampleResponse.level})
                        </h3>
                      </div>
                    </div>

                    <div className="space-y-7">
                      <div className="rounded-[2rem] bg-studio-paper p-8 shadow-inner border border-studio-silver">
                        <p className="text-base font-medium leading-8 tracking-tight text-studio-ink/90 italic">
                          "{result.sampleResponse.text}"
                        </p>
                      </div>

                      <div className="overflow-hidden rounded-[1.75rem] border border-studio-silver bg-white shadow-[0_12px_24px_rgba(15,23,42,0.035)]">
                        <div className="border-b border-studio-silver bg-studio-paper/85 px-5 py-4 sm:px-6">
                          <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-studio-ink">
                            Vocabulary
                          </h4>
                        </div>
                        <div className="overflow-x-auto px-4 py-2 sm:px-5">
                          <table className="w-full min-w-[30rem] table-fixed">
                            <colgroup>
                              <col className="w-[32%]" />
                              <col className="w-[30%]" />
                              <col className="w-[38%]" />
                            </colgroup>
                            <thead>
                              <tr className="border-b border-studio-silver text-left text-[11px] font-bold tracking-[0.04em] text-zinc-600">
                                <th className="px-3 pb-3 pt-2">
                                  Vocabulary Term
                                </th>
                                <th className="px-3 pb-3 pt-2">
                                  Pronunciation (IPA)
                                </th>
                                <th className="px-3 pb-3 pt-2">
                                  Meaning in Vietnamese
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.sampleResponse.vocabulary.map(
                                (item, index) => (
                                  <tr
                                    key={`${item.word}-${index}`}
                                    className="group border-b border-studio-paper/80 transition-colors duration-200 last:border-b-0 hover:bg-studio-paper/70"
                                  >
                                    <td className="px-3 py-3 align-top sm:py-4">
                                      <span className="inline-block text-base font-bold leading-6 tracking-[-0.025em] text-vibrant-emerald transition-colors duration-200 group-hover:text-studio-ink">
                                        {item.word}
                                      </span>
                                    </td>
                                    <td className="px-3 py-3 align-top sm:py-4">
                                      <span className="inline-block max-w-full whitespace-normal break-words rounded-xl border border-vibrant-rose/15 bg-vibrant-rose/[0.07] px-2.5 py-1.5 font-mono text-[12px] font-medium leading-5 text-vibrant-rose/80">
                                        {item.ipa}
                                      </span>
                                    </td>
                                    <td className="px-3 py-3 align-top sm:py-4">
                                      <span className="text-sm font-semibold leading-6 text-studio-ink/85">
                                        {item.vietnamese}
                                      </span>
                                    </td>
                                  </tr>
                                ),
                              )}
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
                  <h3 className="text-3xl font-black tracking-tight text-studio-ink">
                    Studio Standby
                  </h3>
                  <p className="mx-auto max-w-sm text-base font-medium leading-relaxed text-zinc-400">
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
