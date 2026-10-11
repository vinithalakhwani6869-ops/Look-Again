import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { WalkPack, CheckResult, JournalEntry, OllamaHealthStatus, FocusType } from '../types';
import { generateAISummary } from '../services/api';
import { buildJournalText, SaveJournalResult } from '../services/storage';
import { BookOpen, Sparkles, ArrowRight, Loader2, RefreshCw, Download, AlertTriangle } from 'lucide-react';

interface UnpackViewProps {
  pack: WalkPack;
  durationMinutes: number;
  recallFreeText: string;
  checkResults: CheckResult[];
  surpriseNote: string;
  reflections: Record<string, string>;
  ollamaStatus: OllamaHealthStatus | null;
  pastTendenciesSummary: string;
  onSaveToJournal: (entry: JournalEntry) => Promise<SaveJournalResult>;
  onOpenOllamaModal: () => void;
}

export const UnpackView: React.FC<UnpackViewProps> = ({
  pack,
  durationMinutes,
  recallFreeText,
  checkResults,
  surpriseNote,
  reflections,
  ollamaStatus,
  pastTendenciesSummary,
  onSaveToJournal,
  onOpenOllamaModal,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationElapsed, setGenerationElapsed] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const pendingEntryRef = useRef<JournalEntry | null>(null);

  const [aiSummary, setAiSummary] = useState<{
    journalText: string;
    tendencyNote: string;
    suggestedNextFocus?: FocusType;
    generatedWith?: string;
    generatedAt: string;
  } | null>(null);

  const isOllamaReady = ollamaStatus?.status === 'ok' && ollamaStatus?.modelAvailable;

  const generateFallbackSynthesis = () => {
    const verifiedPoints: string[] = [];

    checkResults.forEach((r) => {
      if (r.verdict === 'right') {
        verifiedPoints.push(`accurately recalled "${r.answer || 'landmark'}"`);
      } else if (r.verdict === 'wrong') {
        verifiedPoints.push(`thought "${r.answer || 'detail'}", but actually saw "${r.actualSeen || 'different reality'}"`);
      } else if (r.verdict === 'never_noticed') {
        verifiedPoints.push(`did not notice until checking: "${r.actualSeen || r.question}"`);
      }
    });

    const bodyParts: string[] = [];
    if (recallFreeText) {
      bodyParts.push(`Immediate impressions: ${recallFreeText}.`);
    }
    if (verifiedPoints.length > 0) {
      bodyParts.push(`Verification: You ${verifiedPoints.join(', ')}.`);
    }
    if (surpriseNote) {
      bodyParts.push(`Key surprise: ${surpriseNote}.`);
    }

    let tendency = 'You completed a quiet outdoor observation walk.';
    if (pack.focus === 'sounds') {
      tendency = 'You tuned into the ambient acoustic layer of your surroundings.';
    } else if (pack.focus === 'above') {
      tendency = 'You shifted your gaze toward rooftops and overhead structures.';
    } else if (pack.focus === 'details') {
      tendency = 'You focused down on micro-textures and subtle ground elements.';
    } else if (pack.focus === 'light') {
      tendency = 'You observed cast angles and sharp light gradients.';
    }

    return {
      journalText: bodyParts.length > 0 ? bodyParts.join(' ') : 'Walk completed and observations recorded.',
      tendencyNote: tendency,
      suggestedNextFocus: pack.focus === 'above' ? ('details' as FocusType) : ('above' as FocusType),
      generatedWith: 'Direct synthesis (client)',
      generatedAt: new Date().toISOString(),
    };
  };

  const handleRunOllamaUnpack = async () => {
    setIsGenerating(true);
    setErrorMsg(null);
    setGenerationElapsed(0);

    const timer = setInterval(() => {
      setGenerationElapsed((prev) => prev + 1);
    }, 1000);

    try {
      const summary = await generateAISummary({
        pack,
        recallFreeText,
        checkResults,
        surpriseNote,
        reflections,
        pastTendenciesSummary,
      });
      clearInterval(timer);
      setAiSummary(summary);
    } catch (err: any) {
      clearInterval(timer);
      console.warn('Ollama unpack failed:', err);
      setErrorMsg(err.message || 'Could not generate summary with Ollama.');
      if (!aiSummary) {
        setAiSummary(generateFallbackSynthesis());
      }
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOllamaReady && !aiSummary && !isGenerating) {
      handleRunOllamaUnpack();
    } else if (!isOllamaReady && !aiSummary) {
      setAiSummary(generateFallbackSynthesis());
    }
  }, []);

  const buildEntry = (): JournalEntry => {
    const summaryToSave = aiSummary || generateFallbackSynthesis();
    return {
      id: `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      pack,
      durationMinutes,
      environment: pack.environment,
      focus: pack.focus,
      recallFreeText,
      checkResults,
      surpriseNote,
      reflections,
      aiSummary: summaryToSave,
    };
  };

  const handleSave = async () => {
    if (isSaving) return;
    const entry = buildEntry();
    pendingEntryRef.current = entry;
    setSaveError(null);
    setIsSaving(true);
    try {
      const result = await onSaveToJournal(entry);
      if (!result.ok) {
        // The entry is kept in memory (and visible in the journal UI), but the
        // write to this browser failed. Tell the user and offer Retry + Download.
        setSaveError(result.error || 'This entry could not be saved to this browser.');
      }
    } catch {
      setSaveError('This entry could not be saved to this browser. Your walk notes are still here.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetrySave = async () => {
    const entry = pendingEntryRef.current;
    if (!entry || isSaving) return;
    setSaveError(null);
    setIsSaving(true);
    try {
      const result = await onSaveToJournal(entry);
      if (!result.ok) {
        setSaveError(result.error || 'This entry could not be saved to this browser.');
      }
    } catch {
      setSaveError('This entry could not be saved to this browser.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadEntry = () => {
    const entry = pendingEntryRef.current || buildEntry();
    const text = buildJournalText([entry], []);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const pad = (n: number) => String(n).padStart(2, '0');
    const now = new Date();
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    a.href = url;
    a.download = `look-again-walk-${date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-8 animate-in fade-in duration-200">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
          Final Step • Field Journal Synthesis
        </div>
        <h1 className="text-2xl sm:text-4xl font-normal text-white mt-1">
          Unpacking Your Walk
        </h1>
        <p className="text-xs sm:text-sm text-white/60 mt-1 font-light">
          Review your recorded observations before they are permanently filed in your local journal.
        </p>
      </div>

      {isGenerating && (
        <div className="liquid-glass rounded-2xl p-6 text-center flex flex-col items-center gap-3 mb-6 border border-white/15 backdrop-blur-2xl">
          <div className="w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center animate-spin">
            <Loader2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">
              Unpacking observation via local model ({ollamaStatus?.targetModel})...
            </h3>
            <p className="text-xs text-white/60 mt-1 max-w-sm font-light">
              Synthesizing your exact field observations. Running locally on CPU.
            </p>
            <div className="font-mono text-xs text-white/50 mt-2">
              Elapsed: {generationElapsed}s
            </div>
          </div>
        </div>
      )}

      {/* Visible AI error / busy message (keeps the fallback summary usable). */}
      {errorMsg && !isGenerating && (
        <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300 mt-0.5" />
          <p className="text-xs text-white/85 leading-relaxed flex-1 font-light">
            {errorMsg}
          </p>
          {isOllamaReady && (
            <button
              onClick={handleRunOllamaUnpack}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry with local AI
            </button>
          )}
        </div>
      )}

      {/* Main Glass Journal Preview Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="liquid-glass rounded-3xl p-6 sm:p-10 border border-white/15 backdrop-blur-2xl shadow-2xl space-y-6"
      >
        {/* Header */}
        <div className="border-b border-white/10 pb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase font-mono tracking-widest text-white/50">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
            <h2 className="text-xl sm:text-3xl font-normal text-white mt-1">
              {pack.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/15 text-white text-xs font-mono backdrop-blur-md">
              {durationMinutes} min
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs capitalize font-medium backdrop-blur-md">
              {pack.environment} • {pack.focus}
            </span>
          </div>
        </div>

        {/* Prompt */}
        <div className="bg-white/5 p-5 rounded-2xl border border-white/10 backdrop-blur-md">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-1">
            Observation Focus
          </div>
          <p className="text-sm sm:text-base italic text-white/90 font-light">
            "{pack.lookPrompt}"
          </p>
        </div>

        {/* AI Synthesis Note */}
        {aiSummary && (
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-2 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5 text-white/70" />
                Field Note Synthesis
              </div>
              <p className="text-sm text-white/90 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md font-light">
                {aiSummary.journalText}
              </p>
            </div>

            {/* Tendencies Note */}
            <div className="bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
              <div className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1.5 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-white/70" />
                Tendencies Note (No scores or percentages)
              </div>
              <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-light">
                {aiSummary.tendencyNote}
              </p>
              {aiSummary.suggestedNextFocus && (
                <div className="text-xs text-white/70 font-medium mt-3 pt-3 border-t border-white/10">
                  Suggested focus for next walk: <strong className="capitalize text-white">{aiSummary.suggestedNextFocus}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Results summary breakdown */}
        <div className="border-t border-white/10 pt-5">
          <div className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3">
            Memory Checks & Reality
          </div>
          <div className="space-y-2.5">
            {checkResults.map((r, idx) => (
              <div
                key={idx}
                className="text-xs p-3.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-1.5 backdrop-blur-md"
              >
                <div className="font-medium text-white">
                  <span className="font-mono text-white/40 mr-2">{idx + 1}.</span>
                  {r.question}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-white/70 mt-0.5">
                  <span
                    className={`px-2.5 py-0.5 rounded-lg font-semibold text-[10px] ${
                      r.verdict === 'right'
                        ? 'bg-white text-black border border-white'
                        : r.verdict === 'wrong'
                        ? 'bg-transparent text-white border border-white/60'
                        : 'bg-transparent text-white border border-dashed border-white/50'
                    }`}
                  >
                    {r.verdict === 'right' ? 'Right' : r.verdict === 'wrong' ? 'Wrong' : 'Never noticed'}
                  </span>
                  <span>Recalled: "{r.answer || 'Blank'}"</span>
                  {r.actualSeen && (
                    <span className="text-white font-medium">• Reality: "{r.actualSeen}"</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Surprise Note */}
        {surpriseNote && (
          <div className="border-t border-white/10 pt-5 text-xs">
            <span className="font-semibold text-white/60 uppercase tracking-widest text-[11px] block mb-1.5">
              Surprise Detail:
            </span>
            <p className="text-sm text-white/90 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-md font-light">
              "{surpriseNote}"
            </p>
          </div>
        )}

        {/* Save failure banner: entry is kept in memory and recoverable. */}
        {saveError && (
          <div className="rounded-2xl border border-amber-300/30 bg-amber-400/10 p-4 flex flex-col gap-3 border-t-0">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-medium text-white">{saveError}</p>
                <p className="text-[11px] text-white/60 mt-1 font-light">
                  Your walk notes are kept in memory and will not be lost on this screen.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleRetrySave}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Retry save
              </button>
              <button
                onClick={handleDownloadEntry}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-white border border-white/20 hover:bg-white/20 text-xs font-medium transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Download as text
              </button>
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3 border-t border-white/10">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-white text-black text-base font-semibold hover:bg-white/90 active:scale-95 transition-all shadow-xl cursor-pointer group disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving…</span>
              </>
            ) : (
              <>
                <span>Save to Private Field Journal</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          {isOllamaReady && !isGenerating && (
            <button
              onClick={handleRunOllamaUnpack}
              className="py-3.5 px-4 rounded-2xl bg-white/10 text-white border border-white/20 hover:bg-white/20 text-xs font-medium transition-all flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md"
            >
              <RefreshCw className="w-3.5 h-3.5 text-white/70" />
              <span>Regenerate</span>
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
