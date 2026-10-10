import React, { useState } from 'react';
import { motion } from 'motion/react';
import { WalkPack } from '../types';
import { ArrowRight } from 'lucide-react';

interface ReflectViewProps {
  pack: WalkPack;
  initialReflections?: Record<string, string>;
  onCompleteReflect: (reflections: Record<string, string>) => void;
}

export const ReflectView: React.FC<ReflectViewProps> = ({
  pack,
  initialReflections = {},
  onCompleteReflect,
}) => {
  const defaultQuestions = [
    'What detail do you remember most clearly?',
    'What did you notice that you would normally walk right past?',
  ];

  const questionsToAsk = pack.reflectionQuestions && pack.reflectionQuestions.length > 0
    ? pack.reflectionQuestions
    : defaultQuestions;

  const [reflections, setReflections] = useState<Record<string, string>>(initialReflections);

  const handleChange = (q: string, text: string) => {
    setReflections((prev) => ({ ...prev, [q]: text }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCompleteReflect(reflections);
  };

  const handleSkip = () => {
    onCompleteReflect(reflections);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-8 animate-in fade-in duration-200">
      <div className="mb-6">
        <div className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
          Step 4 of 4 • Optional Reflection
        </div>
        <h1 className="text-2xl sm:text-4xl font-normal text-white mt-1">
          Pause & Reflect
        </h1>
        <p className="text-xs sm:text-sm text-white/60 mt-1 font-light">
          These questions are completely optional. Take a moment if you wish, or skip directly to unpacking your journal entry.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          {questionsToAsk.map((q, idx) => (
            <div
              key={idx}
              className="liquid-glass rounded-3xl p-6 border border-white/15 backdrop-blur-2xl shadow-xl"
            >
              <label className="block text-sm sm:text-base font-normal text-white mb-3">
                {q}
              </label>
              <textarea
                value={reflections[q] || ''}
                onChange={(e) => handleChange(q, e.target.value)}
                placeholder="A sentence or two from your experience..."
                rows={2}
                className="w-full text-xs sm:text-sm p-3.5 rounded-2xl bg-white/5 border border-white/15 focus:border-white focus:bg-white/10 focus:outline-hidden text-white placeholder:text-white/30 backdrop-blur-md"
              />
            </div>
          ))}
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white text-black text-base font-semibold hover:bg-white/90 active:scale-95 transition-all shadow-xl cursor-pointer group"
          >
            <span>Unpack & Save to Journal</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="py-4 px-6 rounded-2xl bg-white/10 text-white border border-white/20 hover:bg-white/20 active:scale-95 text-xs sm:text-sm font-medium transition-all backdrop-blur-md cursor-pointer"
          >
            Skip Reflections
          </button>
        </div>
      </form>
    </div>
  );
};
