import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Download, Loader2, Mic, Square, Trash2, Upload } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (base64: string, mimeType: string, url: string) => void;
  onClear: () => void;
  audioUrl: string | null;
  isProcessing: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onRecordingComplete,
  onClear,
  audioUrl,
  isProcessing,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);



  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);



  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const base64 = base64data.split(',')[1];
          onRecordingComplete(base64, 'audio/webm', url);
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = window.setInterval(() => {
        setDuration((currentDuration) => currentDuration + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      window.alert('Could not access the microphone. Please check browser permissions.');
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) {
      return;
    }

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    setIsRecording(false);

    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('audio/')) {
      window.alert('Please upload a valid audio file.');
      return;
    }

    const url = URL.createObjectURL(file);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onloadend = () => {
      const base64data = reader.result as string;
      const base64 = base64data.split(',')[1];
      onRecordingComplete(base64, file.type, url);
    };
  };

  const downloadAudio = () => {
    if (!audioUrl) {
      return;
    }

    const anchor = document.createElement('a');
    anchor.href = audioUrl;
    anchor.download = `ielts-speaking-response-${Date.now()}.webm`;
    anchor.click();
  };

  const clearAudio = () => {
    onClear();
    setDuration(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 rounded-[1.7rem] border border-zinc-200 bg-[linear-gradient(180deg,rgba(250,250,250,0.96),rgba(244,244,245,0.92))] p-5 shadow-inner">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-base font-semibold tracking-[-0.02em] text-zinc-950">Capture your response</p>
          <p className="text-sm leading-6 text-zinc-500">
            Record directly in the browser or upload an existing speaking answer.
          </p>
        </div>

        {isRecording ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-heritage-red/10 bg-heritage-red/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-heritage-red shadow-sm animate-pulse">
            <span className="h-2 w-2 rounded-full bg-heritage-red" />
            Recording
          </span>
        ) : audioUrl ? (
          <span className="inline-flex items-center rounded-full bg-heritage-sage/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-heritage-forest">
            Ready
          </span>
        ) : null}
      </div>

      {!isRecording && !audioUrl && (
        <div className="grid gap-3 sm:grid-cols-2">
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
            type="button"
            onClick={startRecording}
            disabled={isProcessing}
            className="inline-flex items-center justify-center gap-2.5 rounded-2xl bg-luxe-espresso px-4 py-2.5 text-left text-white shadow-[0_12px_24px_rgba(45,91,255,0.12)] ring-1 ring-white/10 transition-colors hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
              <Mic size={16} />
            </span>
            <span className="text-sm font-semibold">Record Audio</span>
          </motion.button>

          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.985 }}
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="inline-flex items-center justify-center gap-2.5 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-left text-zinc-900 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-100">
              <Upload size={16} />
            </span>
            <span className="text-sm font-semibold z-10">Upload Audio</span>
          </motion.button>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      )}

      {isRecording && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-[1.6rem] bg-luxe-espresso px-5 py-5 text-white shadow-[0_18px_34px_rgba(45,91,255,0.15)] ring-1 ring-white/10"
        >
          <div className="flex flex-col gap-5">
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/60">Live capture</p>
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="text-4xl font-semibold leading-none tracking-[-0.06em]">{formatTime(duration)}</span>
                <span className="text-sm text-white/65">Keep speaking naturally</span>
              </div>
            </div>

            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.985 }}
              type="button"
              onClick={stopRecording}
              className="inline-flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-zinc-100 sm:w-auto"
            >
              <Square size={16} fill="currentColor" />
              Stop recording
            </motion.button>
          </div>
        </motion.div>
      )}

      {audioUrl && !isRecording && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 rounded-[1.6rem] border border-zinc-200 bg-white p-5 shadow-sm"
        >
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-zinc-950">Audio ready for assessment</p>
            <p className="text-sm leading-6 text-zinc-500">
              Review the clip, then wait while Gemini analyzes your response.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <audio src={audioUrl} controls className="h-12 w-full min-w-0" />
            <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={downloadAudio}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-colors hover:border-zinc-300 hover:text-zinc-950"
                title="Download recording"
              >
                <Download size={18} />
              </button>
              <button
                type="button"
                onClick={clearAudio}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                title="Clear recording"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role="status"
            aria-live="polite"
            className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700"
          >
            <Loader2 size={16} className="animate-spin" />
            Analyzing your response...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
