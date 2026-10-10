import React, { useState } from 'react';
import { motion } from 'motion/react';
import { WalkPack, CheckResult, CheckVerdict } from '../types';
import { Eye, Check, X, HelpCircle, ArrowRight, Sparkles } from 'lucide-react';

interface LookAgainViewProps {
  pack: WalkPack;
  recalledAnswers: Record<number, string>;
  initialCheckResults?: CheckResult[];
  initialSurpriseNote?: string;
  onCompleteLookAgain: (checkResults: CheckResult[], surpriseNote: string) => void;
}

export const LookAgainView: React.FC<LookAgainViewProps> = ({
  pack,
  recalledAnswers,
  initialCheckResults,
  initialSurpriseNote = '',
  onCompleteLookAgain,
}) => {
  const [results, setResults] = useState<CheckResult[]>(() => {
    if (initialCheckResults && initialCheckResults.length > 0) {
      return initialCheckResults;
    }
    return pack.checkQuestions.map((q, idx) => ({
      question: q,
      answer: recalledAnswers[idx] || '',
      verdict: 'never_noticed' as CheckVerdict,
      actualSeen: '',
    }));
  });

  const [surpriseNote, setSurpriseNote] = useState<string>(initialSurpriseNote);

  const handleVerdictChange = (index: number, verdict: CheckVerdict) => {
    setResults((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], verdict };
      return copy;
    });
  };

  const handleActualSeenChange = (index: number, val: string) => {
    setResults((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], actualSeen: val };
      return copy;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCompleteLookAgain(results, surpriseNote);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-8 animate-in fade-in duration-200">
      {/* Guidance Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="liquid-glass rounded-2xl p-5 mb-6 border border-white/15 backdrop-blur-2xl shadow-xl flex items-start gap-4"
      >
        <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0 mt-0.5">
          <Eye className="w-5 h-5 text-white/70" />
        </div>
        <div>
          <h2 className="text-base font-medium text-white">
            Now turn around. Look directly at reality.
          </h2>
          <p className="text-xs text-white/60 mt-0.5 leading-relaxed font-light">
            Compare your memory against the scene. For each item, mark whether your recall was accurate, mistaken, or something you didn't notice at all.
          </p>
        </div>
      </motion.div>

      {/* Mission Reminder */}
      <div className="liquid-glass rounded-2xl p-4 mb-6 border border-white/15 backdrop-blur-2xl">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-1">
          Your Walk Prompt Was:
        </div>
        <p className="text-sm sm:text-base text-white/90 italic font-light">
          "{pack.lookPrompt}"
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {results.map((item, idx) => (
            <div
              key={idx}
              className="liquid-glass rounded-3xl p-6 border border-white/15 backdrop-blur-2xl shadow-xl flex flex-col gap-3.5"
            >
              {/* Question */}
              <div className="text-sm sm:text-base font-normal text-white">
                <span className="text-white/40 font-mono mr-2 text-xs">0{idx + 1}.</span>
                {item.question}
              </div>

              {/* Recalled Memory */}
              <div className="bg-white/5 px-4 py-2.5 rounded-xl text-xs text-white/80 border border-white/10 backdrop-blur-md">
                <span className="text-white/50">What you recalled: </span>
                <span className="text-white font-medium">
                  {item.answer ? `"${item.answer}"` : 'No recall recorded'}
                </span>
              </div>

              {/* Verdict Buttons: Right, Wrong, Never noticed */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-2">
                  Your verdict on reality vs. memory:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleVerdictChange(idx, 'right')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer backdrop-blur-md ${
                      item.verdict === 'right'
                        ? 'bg-white text-black border-white shadow-none'
                        : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Right</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVerdictChange(idx, 'wrong')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer backdrop-blur-md ${
                      item.verdict === 'wrong'
                        ? 'bg-transparent text-white border-white/60 shadow-none'
                        : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Wrong</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleVerdictChange(idx, 'never_noticed')}
                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer backdrop-blur-md ${
                      item.verdict === 'never_noticed'
                        ? 'bg-transparent text-white border-dashed border-white/50 shadow-none'
                        : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Never noticed</span>
                  </button>
                </div>
              </div>

              {/* Actual Seen note */}
              <div>
                <input
                  type="text"
                  value={item.actualSeen || ''}
                  onChange={(e) => handleActualSeenChange(idx, e.target.value)}
                  placeholder="What was actually there in reality? (a few words)..."
                  className="w-full text-xs sm:text-sm p-3 rounded-xl bg-white/5 border border-white/15 focus:border-white focus:bg-white/10 focus:outline-hidden text-white placeholder:text-white/30 backdrop-blur-md"
                />
              </div>
            </div>
          ))}
        </div>

        {/* One thing that surprised me */}
        <div className="liquid-glass rounded-3xl p-6 border border-white/15 backdrop-blur-2xl shadow-xl">
          <label className="block text-xs font-semibold uppercase tracking-widest text-white/60 mb-1 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-white/70" />
            One Thing That Surprised Me
          </label>
          <p className="text-xs text-white/50 mb-3 font-light">
            What was the most unexpected detail between what you thought you saw and what was truly there?
          </p>
          <input
            type="text"
            value={surpriseNote}
            onChange={(e) => setSurpriseNote(e.target.value)}
            placeholder="e.g. The fire escape was completely painted in dark green, not black..."
            className="w-full text-xs sm:text-sm p-3.5 rounded-2xl bg-white/5 border border-white/15 focus:border-white focus:bg-white/10 focus:outline-hidden text-white placeholder:text-white/30 backdrop-blur-md"
          />
        </div>

        {/* Continue button */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white text-black text-base font-semibold hover:bg-white/90 active:scale-95 transition-all shadow-xl cursor-pointer group"
          >
            <span>Proceed to Reflection</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </form>
    </div>
  );
};
