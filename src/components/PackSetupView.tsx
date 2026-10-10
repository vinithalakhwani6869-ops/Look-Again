import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Clock, MapPin, Sparkles, Compass, AlertCircle, ArrowLeft, ArrowRight, Loader2, Bookmark } from 'lucide-react';
import { EnvironmentType, FocusType, WalkPack, OllamaHealthStatus } from '../types';
import { generateAIPack } from '../services/api';
import { findMatchingPreset } from '../data/presetPacks';
import { JournalEntry } from '../types';

interface PackSetupViewProps {
  onBack: () => void;
  onPackReady: (pack: WalkPack) => void;
  ollamaStatus: OllamaHealthStatus | null;
  pastEntries: JournalEntry[];
  onOpenOllamaModal: () => void;
}

export const PackSetupView: React.FC<PackSetupViewProps> = ({
  onBack,
  onPackReady,
  ollamaStatus,
  pastEntries,
  onOpenOllamaModal,
}) => {
  const [duration, setDuration] = useState<number>(10);
  const [environment, setEnvironment] = useState<EnvironmentType>('general');
  const [focus, setFocus] = useState<FocusType>('surprise');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingElapsed, setLoadingElapsed] = useState(0);

  const isOllamaReady = ollamaStatus?.status === 'ok' && ollamaStatus?.modelAvailable;

  const environments: Array<{ id: EnvironmentType; label: string; desc: string }> = [
    { id: 'street', label: 'Street / Neighborhood', desc: 'Sidewalks, facades, powerlines, paving' },
    { id: 'park', label: 'Park / Garden', desc: 'Grass, soil paths, tree canopy, wind' },
    { id: 'campus', label: 'Campus / Courtyard', desc: 'Arcades, shared plazas, steps, brickwork' },
    { id: 'balcony', label: 'Balcony / Window', desc: 'Fixed viewpoint, sky, rooftops, distant horizon' },
    { id: 'general', label: 'General Outdoors', desc: 'Any open air space or immediate outdoor perimeter' },
  ];

  const focuses: Array<{ id: FocusType; label: string; desc: string }> = [
    { id: 'surprise', label: 'Surprise me', desc: 'Unusual accidental juxtapositions' },
    { id: 'sounds', label: 'Sounds & Echoes', desc: 'Layers of acoustics, hums, and rustles' },
    { id: 'patterns', label: 'Patterns & Grids', desc: 'Repeated joints, seams, textures, pavers' },
    { id: 'movement', label: 'Movement & Drift', desc: 'Non-human motion, swaying branches, dust' },
    { id: 'light', label: 'Light & Cast Shadow', desc: 'Angles of illumination, sharp vs soft edges' },
    { id: 'above', label: 'Above Eye Level', desc: 'Rooflines, sky canopy, high perches' },
    { id: 'periphery', label: 'Behind & Periphery', desc: 'Edges of sight and what sits at your back' },
    { id: 'details', label: 'Small Details', desc: 'Micro-cracks, moss, pebble strata within arm’s reach' },
  ];

  const handleGenerateAI = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    setLoadingElapsed(0);

    const timer = setInterval(() => {
      setLoadingElapsed((prev) => prev + 1);
    }, 1000);

    try {
      const recentHistory = pastEntries.slice(0, 5).map((e) => ({
        category: e.pack.category,
      }));

      const res = await generateAIPack(duration, environment, focus, recentHistory);
      clearInterval(timer);
      onPackReady(res.pack);
    } catch (err: any) {
      clearInterval(timer);
      console.warn('AI Pack generation failed:', err);
      setErrorMsg(err.message || 'Could not connect to Ollama. You can switch to curated presets below.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsePreset = () => {
    const preset = findMatchingPreset(environment, focus, duration);
    onPackReady(preset);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-4 sm:py-8 animate-in fade-in duration-200">
      {/* Top back navigation */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Back to home</span>
      </button>

      {/* Main Glass Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="liquid-glass rounded-3xl p-6 sm:p-10 border border-white/15 backdrop-blur-2xl shadow-2xl space-y-8"
      >
        {/* Title */}
        <div>
          <h1 className="text-2xl sm:text-4xl font-normal text-white">
            Prepare Your Walk Pack
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mt-1.5 font-light">
            Pick your time, setting, and sensory focus. A targeted prompt will be prepared before you step outside.
          </p>
        </div>

        {/* Loading Overlay State */}
        {isLoading ? (
          <div className="p-8 text-center flex flex-col items-center gap-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
            <div className="w-12 h-12 rounded-full bg-white/10 text-white flex items-center justify-center animate-spin">
              <Loader2 className="w-6 h-6" />
            </div>

            <div className="max-w-md">
              <h3 className="text-lg font-medium text-white">
                Consulting local model ({ollamaStatus?.targetModel || 'qwen3:4b'})...
              </h3>
              <p className="text-xs text-white/60 mt-1.5 leading-relaxed font-light">
                Because this runs entirely on your local CPU without sending your data to any cloud, generation takes 15–30 seconds. Take a slow breath and get your shoes ready.
              </p>
              <div className="mt-3 font-mono text-xs text-white/50">
                Elapsed: {loadingElapsed}s
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setIsLoading(false);
                  handleUsePreset();
                }}
                className="text-xs px-4 py-2 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all cursor-pointer shadow-md"
              >
                Don't wait: use curated preset instead
              </button>
              <button
                onClick={() => setIsLoading(false)}
                className="text-xs text-white/60 hover:text-white px-3 py-2 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Section 1: Duration */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-white/60 mb-3 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Available Time
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[5, 10, 15].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDuration(mins)}
                    className={`py-3.5 px-2 rounded-2xl text-center border transition-all cursor-pointer backdrop-blur-md ${
                      duration === mins
                        ? 'bg-white text-black border-white shadow-lg font-semibold'
                        : 'bg-white/5 text-white/80 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-xl font-medium">{mins} min</div>
                    <div className="text-[10px] opacity-75 uppercase tracking-wider mt-0.5">
                      {mins === 5 ? 'Short pause' : mins === 10 ? 'Standard walk' : 'Deep stroll'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 2: Environment */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-white/60 mb-3 flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-sky-400" />
                Environment
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {environments.map((env) => (
                  <button
                    key={env.id}
                    type="button"
                    onClick={() => setEnvironment(env.id)}
                    className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer backdrop-blur-md ${
                      environment === env.id
                        ? 'bg-white/20 text-white border-white/40 shadow-inner'
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="font-medium text-xs sm:text-sm text-white">{env.label}</div>
                    <div className="text-[11px] text-white/50 mt-0.5 line-clamp-1">{env.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Section 3: Focus */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-white/60 mb-3 flex items-center gap-2">
                <Compass className="w-3.5 h-3.5 text-purple-400" />
                Sensory Focus
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {focuses.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFocus(f.id)}
                    className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between backdrop-blur-md ${
                      focus === f.id
                        ? 'bg-white/20 text-white border-white/40 shadow-inner'
                        : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="font-medium text-xs text-white">{f.label}</div>
                    <div className="text-[10px] text-white/50 mt-1 line-clamp-2">{f.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Error Banner if AI failed */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-200 flex flex-col gap-2.5 backdrop-blur-md">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <div className="font-semibold text-white">Ollama notification</div>
                    <div className="mt-0.5 opacity-90">{errorMsg}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-1">
                  <button
                    onClick={handleUsePreset}
                    className="px-3.5 py-1.5 bg-white text-black font-semibold rounded-xl hover:bg-white/90 transition-all cursor-pointer"
                  >
                    Use curated preset for {environment} & {focus}
                  </button>
                  <button
                    onClick={onOpenOllamaModal}
                    className="underline text-white/80 hover:text-white cursor-pointer"
                  >
                    Ollama setup help
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              {isOllamaReady ? (
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white text-black font-semibold text-sm hover:bg-white/90 active:scale-95 transition-all shadow-xl cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>Generate with Local Ollama ({ollamaStatus?.targetModel})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleUsePreset}
                  className="flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-2xl bg-white text-black font-semibold text-sm hover:bg-white/90 active:scale-95 transition-all shadow-xl cursor-pointer"
                >
                  <Bookmark className="w-4 h-4 text-black" />
                  <span>Use Curated Preset Pack (Offline)</span>
                </button>
              )}

              {isOllamaReady ? (
                <button
                  type="button"
                  onClick={handleUsePreset}
                  className="py-4 px-6 rounded-2xl bg-white/10 text-white border border-white/20 hover:bg-white/20 active:scale-95 font-medium text-xs sm:text-sm transition-all backdrop-blur-md cursor-pointer"
                >
                  <span>Use preset pack</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  className="py-4 px-6 rounded-2xl bg-white/10 text-white border border-white/20 hover:bg-white/20 active:scale-95 font-medium text-xs sm:text-sm transition-all backdrop-blur-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white/70" />
                  <span>Try Ollama anyway</span>
                </button>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
