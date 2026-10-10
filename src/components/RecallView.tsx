import React, { useState } from 'react';
import { motion } from 'motion/react';
import { WalkPack } from '../types';
import { EyeOff, ArrowRight } from 'lucide-react';

interface RecallViewProps {
  pack: WalkPack;
  initialFreeRecall?: string;
  initialAnswers?: Record<number, string>;
  onCompleteRecall: (freeRecall: string, answers: Record<number, string>) => void;
}

export const RecallView: React.FC<RecallViewProps> = ({
  pack,
  initialFreeRecall = '',
  initialAnswers = {},
  onCompleteRecall,
}) => {
  const [freeRecall, setFreeRecall] = useState<string>(initialFreeRecall);
  const [answers, setAnswers] = useState<Record<number, string>>(initialAnswers);

  const handleAnswerChange = (index: number, val: string) => {
    setAnswers((prev) => ({ ...prev, [index]: val }));
  };

  const handleMarkUnsure = (index: number) => {
    setAnswers((prev) => ({ ...prev, [index]: "Don't recall / Not sure" }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCompleteRecall(freeRecall, answers);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-8 animate-in fade-in duration-200">
      {/* Back turned guidance */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="liquid-glass rounded-2xl p-5 mb-6 border border-white/15 backdrop-blur-2xl shadow-xl flex items-start gap-4"
      >
        <div className="w-9 h-9 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0 mt-0.5">
          <EyeOff className="w-5 h-5 text-white/70" />
        </div>
        <div>
          <h2 className="text-base font-medium text-white">
            Stand with your back turned
          </h2>
          <p className="text-xs text-white/60 mt-0.5 leading-relaxed font-light">
            Do not turn around to look yet. Answer from your immediate memory. Being uncertain or wrong is the whole point — that is where the magic lives.
          </p>
        </div>
      </motion.div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Free recall box */}
        <div className="liquid-glass rounded-3xl p-6 border border-white/15 backdrop-blur-2xl shadow-xl">
          <label className="block text-xs font-semibold uppercase tracking-widest text-white/60 mb-1">
            Free Recall (Optional)
          </label>
          <p className="text-xs text-white/50 mb-3 font-light">
            What stands out in your mind right now from your walk?
          </p>
          <textarea
            value={freeRecall}
            onChange={(e) => setFreeRecall(e.target.value)}
            placeholder="e.g. A rhythmic clatter on metal, cold wind from the left, cracked yellow curb..."
            rows={2}
            className="w-full text-sm p-3.5 rounded-2xl bg-white/5 border border-white/15 focus:border-white focus:bg-white/10 focus:outline-hidden transition-all text-white placeholder:text-white/30 backdrop-blur-md"
          />
        </div>

        {/* Check Questions from memory */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3 px-1">
            Answer the Sealed Questions From Memory
          </div>

          <div className="space-y-4">
            {pack.checkQuestions.map((question, idx) => (
              <div
                key={idx}
                className="liquid-glass rounded-2xl p-5 border border-white/15 backdrop-blur-2xl shadow-xl transition-all"
              >
                <div className="text-sm sm:text-base font-normal text-white mb-3">
                  <span className="text-white/40 font-mono mr-2 text-xs">0{idx + 1}.</span>
                  {question}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={answers[idx] || ''}
                    onChange={(e) => handleAnswerChange(idx, e.target.value)}
                    placeholder="What you recall from memory..."
                    className="flex-1 text-xs sm:text-sm p-3 rounded-xl bg-white/5 border border-white/15 focus:border-white focus:bg-white/10 focus:outline-hidden text-white placeholder:text-white/30 backdrop-blur-md"
                  />
                  <button
                    type="button"
                    onClick={() => handleMarkUnsure(idx)}
                    className="text-xs px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition-colors cursor-pointer shrink-0 font-medium"
                  >
                    Not sure
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Proceed CTA */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white text-black text-base font-semibold hover:bg-white/90 active:scale-95 transition-all shadow-xl cursor-pointer group"
          >
            <span>Done recalling — Now turn around & Look Again</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </form>
    </div>
  );
};
