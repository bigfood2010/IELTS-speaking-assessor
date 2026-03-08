import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  MessageSquare, 
  Trophy, 
  ChevronRight, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Languages,
  Mic,
  Save,
  History,
  Trash2,
  Download,
  Copy,
  Check
} from 'lucide-react';
import { AudioRecorder } from './components/AudioRecorder';
import { assessSpeaking, AssessmentResult } from './services/geminiService';

type IELTSPart = '1' | '2' | '3';

interface SavedAssessment extends AssessmentResult {
  id: string;
  date: string;
  part: IELTSPart;
  question: string;
  audioBase64?: string;
}

export default function App() {
  const [part, setPart] = useState<IELTSPart>('1');
  const [questions, setQuestions] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentAudio, setCurrentAudio] = useState<string | null>(null);
  const [history, setHistory] = useState<SavedAssessment[]>(() => {
    const saved = localStorage.getItem('ielts_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [showHistory, setShowHistory] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const handleRecordingComplete = async (base64: string, mimeType: string) => {
    setError(null);
    setIsProcessing(true);
    setCurrentAudio(base64);
    try {
      const assessment = await assessSpeaking(base64, mimeType, questions, part);
      setResult(assessment);
      // If AI suggested a question and user didn't provide one, update the UI
      if (assessment.suggestedQuestion && !questions.trim()) {
        setQuestions(assessment.suggestedQuestion);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to analyze audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveToHistory = () => {
    if (!result) return;
    
    const newEntry: SavedAssessment = {
      ...result,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      part,
      question: questions || result.suggestedQuestion || 'No question provided',
      audioBase64: currentAudio || undefined
    };

    const updatedHistory = [newEntry, ...history];
    setHistory(updatedHistory);
    localStorage.setItem('ielts_history', JSON.stringify(updatedHistory));
    alert('Assessment saved to history!');
  };

  const deleteFromHistory = (id: string) => {
    const updatedHistory = history.filter(h => h.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('ielts_history', JSON.stringify(updatedHistory));
  };

  const downloadAudioFromHistory = (base64: string, date: string) => {
    const link = document.createElement('a');
    link.href = `data:audio/webm;base64,${base64}`;
    link.download = `ielts-response-${new Date(date).getTime()}.webm`;
    link.click();
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 6) return 'text-blue-600 bg-blue-50 border-blue-100';
    return 'text-amber-600 bg-amber-50 border-amber-100';
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-zinc-900 font-sans pb-20">
      {/* Header */}
      <header className="bg-white border-b border-zinc-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Trophy size={18} className="text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">IELTS Assessor</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                showHistory ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100'
              }`}
            >
              <History size={16} />
              History
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-12">
        <AnimatePresence mode="wait">
          {showHistory ? (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Practice History</h2>
                <button onClick={() => setShowHistory(false)} className="text-sm text-zinc-500 hover:text-zinc-900">Back to Assessor</button>
              </div>

              {history.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-zinc-200">
                  <p className="text-zinc-400">No saved assessments yet.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {history.map((item) => (
                    <div key={item.id} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 rounded text-[10px] font-bold uppercase">Part {item.part}</span>
                          <span className="text-xs text-zinc-400">{new Date(item.date).toLocaleDateString()}</span>
                        </div>
                        <h4 className="font-bold line-clamp-1 text-zinc-800">{item.question}</h4>
                        <p className="text-xs text-zinc-500 line-clamp-1 italic">"{item.transcription}"</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="flex flex-col items-end">
                          <span className="text-2xl font-black">{item.overallBand.toFixed(1)}</span>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Band Score</span>
                        </div>
                        <div className="flex items-center gap-2 border-l border-zinc-100 pl-4">
                          {item.audioBase64 && (
                            <button 
                              onClick={() => downloadAudioFromHistory(item.audioBase64!, item.date)}
                              className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors"
                              title="Download Audio"
                            >
                              <Download size={18} />
                            </button>
                          )}
                          <button 
                            onClick={() => {
                              setResult(item);
                              setPart(item.part);
                              setQuestions(item.question);
                              setShowHistory(false);
                            }}
                            className="p-2 text-zinc-400 hover:text-blue-600 transition-colors"
                            title="View Details"
                          >
                            <ChevronRight size={18} />
                          </button>
                          <button 
                            onClick={() => deleteFromHistory(item.id)}
                            className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="assessor"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-12"
            >
              {/* Left Column: Input */}
              <div className="lg:col-span-5 space-y-8">
                <section>
                  <h1 className="text-3xl font-bold tracking-tight mb-2">Speaking Assessment</h1>
                  <p className="text-zinc-500">Get instant feedback on your IELTS speaking performance using AI.</p>
                </section>

                <div className="space-y-6">
                  {/* Part Selection */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <BookOpen size={14} />
                      Select IELTS Part
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['1', '2', '3'] as IELTSPart[]).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPart(p)}
                          className={`py-3 rounded-xl border-2 transition-all font-medium ${
                            part === p 
                              ? 'border-zinc-900 bg-zinc-900 text-white shadow-md' 
                              : 'border-zinc-100 bg-white text-zinc-500 hover:border-zinc-200'
                          }`}
                        >
                          Part {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Question Input */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                        <MessageSquare size={14} />
                        Question / Cue Card Text
                      </label>
                      <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Optional</span>
                    </div>
                    <textarea
                      value={questions}
                      onChange={(e) => setQuestions(e.target.value)}
                      placeholder={part === '2' ? "Describe a time when... (Leave blank to let AI suggest)" : "What do you like about your hometown? (Leave blank to let AI suggest)"}
                      className="w-full h-40 p-4 bg-white rounded-2xl border border-zinc-200 focus:ring-2 focus:ring-zinc-900 focus:border-transparent transition-all resize-none outline-none text-zinc-800"
                    />
                  </div>

                  {/* Audio Recorder */}
                  <div className="space-y-3">
                    <label className="text-sm font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                      <Mic size={14} />
                      Your Response
                    </label>
                    <AudioRecorder 
                      onRecordingComplete={handleRecordingComplete} 
                      isProcessing={isProcessing} 
                    />
                  </div>

                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-sm"
                    >
                      <AlertCircle size={18} className="shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Right Column: Results */}
              <div className="lg:col-span-7">
                <AnimatePresence mode="wait">
                  {result ? (
                    <motion.div
                      key="result"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-8"
                    >
                      {/* Suggested Question / Context */}
                      {result.suggestedQuestion && (
                        <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 space-y-3 relative group">
                          <button 
                            onClick={() => copyToClipboard(result.suggestedQuestion!, 'suggested')}
                            className="absolute top-4 right-4 p-2 bg-white/50 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                            title="Copy to Word"
                          >
                            {copiedId === 'suggested' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-zinc-400" />}
                          </button>
                          <h3 className="font-bold text-sm uppercase tracking-widest text-blue-400 flex items-center gap-2">
                            <Info size={14} />
                            AI Suggested {part === '2' ? 'Cue Card' : 'Question'}
                          </h3>
                          <p className="text-blue-900 font-medium leading-relaxed">
                            {result.suggestedQuestion}
                          </p>
                        </div>
                      )}

                      {/* Transcription */}
                      <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-4 relative group">
                        <button 
                          onClick={() => copyToClipboard(result.transcription, 'transcription')}
                          className="absolute top-6 right-6 p-2 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                          title="Copy to Word"
                        >
                          {copiedId === 'transcription' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-zinc-400" />}
                        </button>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          <Languages size={20} className="text-zinc-400" />
                          Transcription
                        </h3>
                        <div className="p-4 bg-zinc-50 rounded-xl text-zinc-600 text-sm italic leading-relaxed">
                          "{result.transcription}"
                        </div>
                      </div>

                      {/* Overall Score Header */}
                      <div className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm flex items-center justify-between relative group">
                        <button 
                          onClick={() => copyToClipboard(`Overall Band Score: ${result.overallBand.toFixed(1)} / 9.0`, 'overall')}
                          className="absolute top-4 right-4 p-2 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                          title="Copy to Word"
                        >
                          {copiedId === 'overall' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-zinc-400" />}
                        </button>
                        <div>
                          <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-400 mb-1">Estimated Band Score</h2>
                          <div className="flex items-baseline gap-2">
                            <span className="text-6xl font-black tracking-tighter">{result.overallBand.toFixed(1)}</span>
                            <span className="text-zinc-400 font-medium">/ 9.0</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                          <button 
                            onClick={saveToHistory}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-full text-sm font-medium hover:bg-zinc-800 transition-all shadow-md"
                          >
                            <Save size={16} />
                            Save to History
                          </button>
                        </div>
                      </div>

                      {/* Criteria Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Object.entries(result.criteria).map(([key, data]) => (
                          <div key={key} className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-4 relative group">
                            <button 
                              onClick={() => copyToClipboard(`${key.toUpperCase()}\nScore: ${data.score}\nFeedback:\n${data.feedback}\nImprovement:\n${data.improvement}`, `criteria-${key}`)}
                              className="absolute top-4 right-4 p-2 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                              title="Copy to Word"
                            >
                              {copiedId === `criteria-${key}` ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-zinc-400" />}
                            </button>
                            <div className="flex items-center justify-between">
                              <h3 className="font-bold capitalize text-red-600">
                                {key === 'lexical' ? 'Lexical Resource' : 
                                 key === 'grammar' ? 'Grammatical Range' : 
                                 key === 'fluency' ? 'Fluency & Coherence' : key}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getScoreColor(data.score)}`}>
                                {data.score.toFixed(1)}
                              </span>
                            </div>
                            <div className="space-y-3">
                              <div className="flex gap-2">
                                <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-1" />
                                <div className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                                  {data.feedback}
                                </div>
                              </div>
                              <div className="flex gap-2 pt-2 border-t border-zinc-50">
                                <TrendingUp size={16} className="text-blue-500 shrink-0 mt-1" />
                                <div className="text-sm text-zinc-600 leading-relaxed whitespace-pre-line">
                                  <span className="font-bold text-zinc-800 block mb-1">Improvement:</span>
                                  {data.improvement}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Sample Response */}
                      {result.sampleResponse && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white p-8 rounded-3xl border border-zinc-100 shadow-sm space-y-6 relative group"
                        >
                          <button 
                            onClick={() => {
                              const vocabText = result.sampleResponse!.vocabulary.map(v => `${v.word} [${v.ipa}] - ${v.vietnamese}`).join('\n');
                              copyToClipboard(`MODEL ANSWER (${result.sampleResponse!.level})\n\n${result.sampleResponse!.text}\n\nVOCABULARY:\n${vocabText}`, 'sample');
                            }}
                            className="absolute top-6 right-6 p-2 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                            title="Copy to Word"
                          >
                            {copiedId === 'sample' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-zinc-400" />}
                          </button>
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-xl text-zinc-900">Model Answer ({result.sampleResponse.level})</h3>
                            <span className="px-3 py-1 bg-zinc-100 text-zinc-500 rounded-full text-xs font-medium uppercase tracking-wider">Recommended Practice</span>
                          </div>
                          
                          <p className="text-zinc-600 leading-relaxed italic">
                            {result.sampleResponse.text}
                          </p>

                          <div className="space-y-4 pt-6 border-t border-zinc-100">
                            <h4 className="font-bold text-sm uppercase tracking-widest text-zinc-400">Academic Vocabulary</h4>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-left text-zinc-400 border-b border-zinc-100">
                                    <th className="pb-2 font-medium">Vocabulary</th>
                                    <th className="pb-2 font-medium">IPA</th>
                                    <th className="pb-2 font-medium">Vietnamese</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-50">
                                  {result.sampleResponse.vocabulary.map((v, i) => (
                                    <tr key={i}>
                                      <td className="py-3 font-semibold text-zinc-900">{v.word}</td>
                                      <td className="py-3 text-zinc-400 font-mono text-xs">{v.ipa}</td>
                                      <td className="py-3 text-zinc-600">{v.vietnamese}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white rounded-3xl border border-dashed border-zinc-200">
                      <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                        <Info size={32} className="text-zinc-300" />
                      </div>
                      <h3 className="text-xl font-bold mb-2">No Assessment Yet</h3>
                      <p className="text-zinc-400 max-w-xs">
                        Select a part, enter the question, and record your response to see your detailed IELTS assessment.
                      </p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
