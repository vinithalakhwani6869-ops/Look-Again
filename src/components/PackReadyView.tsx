import React from 'react';
import { motion } from 'motion/react';
import { WalkPack } from '../types';
import { Compass, Clock, Lock, ArrowRight, ArrowLeft, Bookmark, Sparkles, CheckCircle2 } from 'lucide-react';

interface PackReadyViewProps {
  pack: WalkPack;
  onStartWalk: () => void;
  onBackToSetup: () => void;
}

export const PackReadyView: React.FC<PackReadyViewProps> = ({
  pack,
  onStartWalk,
  onBackToSetup,
}) => {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-8 animate-in fade-in duration-200">
      {/* Back button */}
      <button
        onClick={onBackToSetup}
        className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Change settings</span>
      </button>

      {/* Main Pack Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="liquid-glass rounded-3xl p-6 sm:p-10 border border-white/15 backdrop-blur-2xl shadow-2xl flex flex-col gap-6"
      >
        {/* Pack Meta */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-white/15 text-white text-xs font-mono font-medium backdrop-blur-md">
              {pack.durationMinutes} min
            </span>
            <span className="px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs capitalize font-medium backdrop-blur-md">
              {pack.environment} • {pack.focus}
            </span>
          </div>

          <div className="text-xs">
            {pack.isPreset ? (
              <span className="inline-flex items-center gap-1.5 text-white/70 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                <Bookmark className="w-3 h-3 text-white/60" />
                <span>Preset, not AI-generated</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-white/80 bg-white/5 border border-white/15 px-3 py-1 rounded-full font-mono text-[11px]">
                <Sparkles className="w-3 h-3 text-white/70" />
                <span>AI: {pack.modelUsed || 'qwen3:4b'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Title & Mission */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
            Observation Mission
          </div>
          <h1 className="text-2xl sm:text-4xl font-normal text-white mt-1 mb-5">
            {pack.title}
          </h1>

          <div className="border-l-2 border-white/20 pl-5">
            <p className="text-lg sm:text-2xl text-white font-light italic leading-relaxed">
              "{pack.lookPrompt}"
            </p>
          </div>
        </div>

        {/* Locked Check Questions Notice */}
        <div className="flex items-start gap-3 border-t border-white/10 pt-5">
          <div className="w-8 h-8 rounded-xl bg-white/10 text-white flex items-center justify-center shrink-0 mt-0.5">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-semibold text-white">
              {pack.checkQuestions.length} Check Questions Sealed
            </div>
            <p className="text-xs text-white/60 mt-0.5 leading-relaxed font-light">
              To keep your observation organic, check questions stay locked until your timer concludes. You will answer from memory before looking back.
            </p>
          </div>
        </div>

        {/* Offline Cache Assurance */}
        <div className="flex items-center gap-2 text-xs text-white/70 font-light">
          <CheckCircle2 className="w-4 h-4 text-white/70 shrink-0" />
          <span>
            Pack is cached on your device. You can lock your screen or walk outside without internet.
          </span>
        </div>

        {/* CTA */}
        <div className="pt-2">
          <button
            onClick={onStartWalk}
            className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-white text-black text-base font-semibold hover:bg-white/90 active:scale-95 transition-all shadow-xl cursor-pointer group"
          >
            <span>Save pack and go outside</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
