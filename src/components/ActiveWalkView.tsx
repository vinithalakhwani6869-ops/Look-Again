import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { WalkPack } from '../types';
import { Smartphone, Bell, Volume2, VolumeX, ArrowRight, X } from 'lucide-react';
import { notifyWalkComplete } from '../services/audio';

interface ActiveWalkViewProps {
  pack: WalkPack;
  targetEndTime: number;
  onFinishWalk: () => void;
  onCancelWalk: () => void;
}

export const ActiveWalkView: React.FC<ActiveWalkViewProps> = ({
  pack,
  targetEndTime,
  onFinishWalk,
  onCancelWalk,
}) => {
  const [timeLeftMs, setTimeLeftMs] = useState<number>(() => Math.max(0, targetEndTime - Date.now()));
  const [isFinished, setIsFinished] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const hasNotifiedRef = useRef<boolean>(false);

  const totalDurationMs = pack.durationMinutes * 60 * 1000;

  useEffect(() => {
    const checkTimer = () => {
      const remaining = targetEndTime - Date.now();
      if (remaining <= 0) {
        setTimeLeftMs(0);
        setIsFinished(true);

        if (!hasNotifiedRef.current) {
          hasNotifiedRef.current = true;
          if (soundEnabled) {
            notifyWalkComplete();
          }
        }
      } else {
        setTimeLeftMs(remaining);
      }
    };

    checkTimer();
    const interval = setInterval(checkTimer, 1000);
    return () => clearInterval(interval);
  }, [targetEndTime, soundEnabled]);

  const minutes = Math.floor(timeLeftMs / 60000);
  const seconds = Math.floor((timeLeftMs % 60000) / 1000);
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const progressFraction = Math.max(0, Math.min(1, 1 - timeLeftMs / totalDurationMs));

  return (
    <div className="w-full max-w-xl mx-auto px-4 py-6 flex flex-col justify-between min-h-[75vh] animate-in fade-in duration-300">
      {/* Top status bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancelWalk}
          className="text-xs text-white/60 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
        >
          <X className="w-4 h-4" />
          <span>Abandon walk</span>
        </button>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer backdrop-blur-md"
          title={soundEnabled ? 'Mute audio chime' : 'Enable audio chime'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 opacity-50" />}
        </button>
      </div>

      {/* Main Focus Center */}
      <div className="flex flex-col items-center text-center my-auto py-8">
        {!isFinished ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center w-full"
          >
            {/* Pocket instruction */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-6 animate-pulse backdrop-blur-md">
              <Smartphone className="w-4 h-4" />
              <span>Put your phone in your pocket</span>
            </div>

            {/* Countdown display */}
            <div className="text-7xl sm:text-8xl font-normal tracking-tight text-white mb-6 font-mono drop-shadow-2xl">
              {formattedTime}
            </div>

            {/* Progress bar */}
            <div className="w-56 sm:w-72 h-2 bg-white/10 rounded-full overflow-hidden mb-8 backdrop-blur-md border border-white/10">
              <div
                className="h-full bg-white transition-all duration-1000 ease-linear rounded-full shadow-[0_0_12px_rgba(255,255,255,0.8)]"
                style={{ width: `${progressFraction * 100}%` }}
              />
            </div>

            {/* Mission prompt reminder */}
            <div className="liquid-glass rounded-3xl p-6 max-w-md border border-white/15 backdrop-blur-2xl shadow-2xl">
              <div className="text-[11px] font-semibold uppercase tracking-widest text-white/50 mb-1.5">
                Your Single Mission
              </div>
              <p className="text-base sm:text-xl text-white font-light italic leading-relaxed">
                "{pack.lookPrompt}"
              </p>
            </div>

            <p className="text-xs text-white/50 mt-6 max-w-xs font-light">
              The screen does not need to stay open. Time will continue accurately even if your phone locks.
            </p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="liquid-glass rounded-3xl p-8 sm:p-12 border border-white/20 backdrop-blur-2xl shadow-2xl flex flex-col items-center text-center max-w-md w-full"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/15 text-white flex items-center justify-center mb-5 backdrop-blur-md">
              <Bell className="w-8 h-8 animate-bounce text-emerald-400" />
            </div>

            <h2 className="text-3xl font-normal text-white mb-2">
              Time is complete.
            </h2>
            <p className="text-sm text-white/70 max-w-sm mb-8 leading-relaxed font-light">
              Stop where you are. Stand still. Keep your back turned away from what you were observing.
            </p>

            <button
              onClick={onFinishWalk}
              className="w-full flex items-center justify-center gap-2 py-4 px-8 rounded-2xl bg-white text-black font-semibold text-base hover:bg-white/90 active:scale-95 transition-all shadow-xl cursor-pointer group"
            >
              <span>Begin memory recall</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </div>

      {/* Bottom Option */}
      {!isFinished && (
        <div className="text-center pt-4">
          <button
            onClick={onFinishWalk}
            className="text-xs text-white/60 hover:text-white py-2 px-4 rounded-xl hover:bg-white/10 transition-all cursor-pointer font-medium"
          >
            I'm ready now — Finish walk early
          </button>
        </div>
      )}
    </div>
  );
};
