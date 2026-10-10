import React from 'react';
import { Eye, BookOpen, Sparkles, Compass, AlertCircle, Wifi, CheckCircle2 } from 'lucide-react';
import { AppScreen, OllamaHealthStatus } from '../types';

interface HeaderProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  journalCount: number;
  ollamaStatus: OllamaHealthStatus | null;
  onOpenOllamaModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScreen,
  onNavigate,
  journalCount,
  ollamaStatus,
  onOpenOllamaModal,
}) => {
  const isOllamaReady = ollamaStatus?.status === 'ok' && ollamaStatus?.modelAvailable;
  const isOllamaConnectedNoModel = ollamaStatus?.status === 'ok' && !ollamaStatus?.modelAvailable;

  return (
    <header className="sticky top-4 z-40 w-full max-w-7xl px-4 sm:px-6 mb-8">
      <div className="liquid-glass rounded-2xl px-4 py-3 sm:px-6 flex items-center justify-between border border-white/10 shadow-2xl">
        {/* Brand */}
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-3 text-left group transition-all hover:opacity-90 cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 text-white flex items-center justify-center font-bold text-sm shadow-inner backdrop-blur-md">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 256 256"
              fill="currentColor"
            >
              <path d="M 4.688 136 C 68.373 136 120 187.627 120 251.312 C 120 252.883 119.967 254.445 119.905 256 L 0 256 L 0 136.096 C 1.555 136.034 3.117 136 4.688 136 Z M 251.312 136 C 252.883 136 254.445 136.034 256 136.096 L 256 256 L 136.095 256 C 136.032 254.438 136.001 252.875 136 251.312 C 136 187.627 187.627 136 251.312 136 Z M 119.905 0 C 119.967 1.555 120 3.117 120 4.688 C 120 68.373 68.373 120 4.687 120 C 3.117 120 1.555 119.967 0 119.905 L 0 0 Z M 256 119.905 C 254.445 119.967 252.883 120 251.312 120 C 187.627 120 136 68.373 136 4.687 C 136 3.117 136.033 1.555 136.095 0 L 256 0 Z" />
            </svg>
          </div>
          <div>
            <div className="font-sans font-semibold text-lg text-white leading-none tracking-wider flex items-center gap-1.5">
              LOOK AGAIN
            </div>
            <div className="text-[10px] tracking-widest uppercase text-white/50 font-medium mt-1">
              Outdoor Attention
            </div>
          </div>
        </button>

        {/* Right side navigation & status */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Ollama Status Button */}
          <button
            onClick={onOpenOllamaModal}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all cursor-pointer backdrop-blur-md ${
              isOllamaReady
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                : isOllamaConnectedNoModel
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
            }`}
            title="Local AI Engine Status"
          >
            <span
              className={`w-2 h-2 rounded-full inline-block ${
                isOllamaReady
                  ? 'bg-emerald-400 animate-pulse'
                  : isOllamaConnectedNoModel
                  ? 'bg-amber-400'
                  : 'bg-white/40'
              }`}
            />
            <span className="hidden sm:inline font-sans font-medium text-[11px]">
              {isOllamaReady
                ? `${ollamaStatus?.targetModel}`
                : isOllamaConnectedNoModel
                ? 'Model needed'
                : 'Offline / Presets'}
            </span>
            <span className="sm:hidden text-[11px] font-sans font-medium">
              {isOllamaReady ? 'AI' : 'Local'}
            </span>
          </button>

          {/* Journal Button */}
          <button
            onClick={() => onNavigate('journal')}
            className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer backdrop-blur-md ${
              currentScreen === 'journal' || currentScreen === 'entry_detail'
                ? 'bg-white/20 text-white border-white/30 shadow-inner'
                : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Journal</span>
            {journalCount > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  currentScreen === 'journal' || currentScreen === 'entry_detail'
                    ? 'bg-white/30 text-white'
                    : 'bg-white/10 text-white/90'
                }`}
              >
                {journalCount}
              </span>
            )}
          </button>

          {/* New Walk CTA */}
          {currentScreen !== 'pack_setup' &&
            currentScreen !== 'active_walk' &&
            currentScreen !== 'pack_ready' &&
            currentScreen !== 'recall' &&
            currentScreen !== 'look_again' &&
            currentScreen !== 'reflect' &&
            currentScreen !== 'unpack' && (
              <button
                onClick={() => onNavigate('pack_setup')}
                className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-1.5 rounded-xl bg-white text-black hover:bg-white/90 active:scale-95 transition-all shadow-lg cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-black" />
                <span>Notice</span>
              </button>
            )}
        </div>
      </div>
    </header>
  );
};
