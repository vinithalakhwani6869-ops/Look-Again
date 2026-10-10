import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { WalkPack, CheckResult, JournalEntry, OllamaHealthStatus, FocusType } from '../types';
import { generateAISummary } from '../services/api';
import { BookOpen, Sparkles, ArrowRight, Loader2, RefreshCw } from 'lucide-react';

interface UnpackViewProps {
  pack: WalkPack;
  durationMinutes: number;
  recallFreeText: string;
  checkResults: CheckResult[];
  surpriseNote: string;
  reflections: Record<string, string>;
  ollamaStatus: OllamaHealthStatus | null;
  pastTendenciesSummary: string;
  onSaveToJournal: (entry: JournalEntry) => void;
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

  const handleSave = () => {
    const summaryToSave = aiSummary || generateFallbackSynthesis();
    const entry: JournalEntry = {
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
    onSaveToJournal(entry);
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

        {/* Action button */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3 border-t border-white/10">
          <button
            onClick={handleSave}
            className="flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-white text-black text-base font-semibold hover:bg-white/90 active:scale-95 transition-all shadow-xl cursor-pointer group"
          >
            <span>Save to Private Field Journal</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
