import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Trash2, Loader2, Download, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AudioRecorderProps {
  onRecordingComplete: (base64: string, mimeType: string) => void;
  isProcessing: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, isProcessing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const base64 = base64data.split(',')[1];
          onRecordingComplete(base64, 'audio/webm');
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      timerRef.current = window.setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        alert('Please upload a valid audio file.');
        return;
      }

      setAudioBlob(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const base64 = base64data.split(',')[1];
        onRecordingComplete(base64, file.type);
      };
    }
  };

  const downloadAudio = () => {
    if (audioUrl) {
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `ielts-speaking-response-${new Date().getTime()}.webm`;
      a.click();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const clearAudio = () => {
    setAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-4 p-6 bg-white rounded-2xl border border-zinc-100 shadow-sm">
      <div className="flex items-center gap-4">
        {!isRecording && !audioUrl && (
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startRecording}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-full font-medium disabled:opacity-50"
            >
              <Mic size={20} />
              Start Recording
            </motion.button>
            <div className="w-px h-8 bg-zinc-100 mx-1" />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-3 bg-white text-zinc-900 border border-zinc-200 rounded-full font-medium disabled:opacity-50 hover:bg-zinc-50 transition-colors"
            >
              <Upload size={20} />
              Upload Audio
            </motion.button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="audio/*"
              className="hidden"
            />
          </div>
        )}

        {isRecording && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={stopRecording}
            className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-full font-medium"
          >
            <Square size={20} fill="currentColor" />
            Stop ({formatTime(duration)})
          </motion.button>
        )}

        {audioUrl && !isRecording && (
          <div className="flex items-center gap-3">
            <audio src={audioUrl} controls className="h-10" />
            <div className="flex items-center gap-1">
              <button
                onClick={downloadAudio}
                className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                title="Download recording"
              >
                <Download size={20} />
              </button>
              <button
                onClick={clearAudio}
                className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                title="Clear recording"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 text-zinc-500 text-sm"
          >
            <Loader2 size={16} className="animate-spin" />
            Analyzing your speech...
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
