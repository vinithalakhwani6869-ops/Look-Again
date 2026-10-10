import React, { useState } from 'react';
import { motion } from 'motion/react';
import { JournalEntry, EchoRecord, EchoSort } from '../types';
import { extractObservations, buildSavedEntryText } from '../services/story';
import { formatEchoDayLabel } from '../services/echo';
import { generateEchoSort } from '../services/api';
import { ArrowLeft, Loader2, RefreshCw, Check, Clock, MapPin, Calendar, Sparkles } from 'lucide-react';

interface EchoViewProps {
  entry: JournalEntry;
  daysAgo: number;
  onComplete: (echo: EchoRecord) => void;
  onSkip: () => void;
  onBack: () => void;
}

type EchoStep = 'ask' | 'working' | 'result' | 'manual';

export const EchoView: React.FC<EchoViewProps> = ({ entry, daysAgo, onComplete, onSkip, onBack }) => {
  const [step, setStep] = useState<EchoStep>('ask');
  const [answer, setAnswer] = useState('');
  const [sort, setSort] = useState<EchoSort | null>(null);
  const [manualVerdicts, setManualVerdicts] = useState<Record<number, 'still' | 'faded'>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const savedItems = extractObservations(entry);

  const created = new Date(entry.createdAt);
  const dateLabel = created.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timeLabel = created.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

  const submit = async () => {
    setStep('working');
    setErrorMsg(null);
    try {
      const result = await generateEchoSort({
        savedText: buildSavedEntryText(entry),
        echoAnswer: answer.trim(),
      });
      setSort(result);
      setStep('result');
    } catch (err: any) {
      // Local model unavailable: plain manual view. We never pretend AI sorted.
      setManualVerdicts(
        Object.fromEntries(savedItems.map((_, i) => [i, 'still' as const]))
      );
      setStep('manual');
    }
  };

  const completeAI = () => {
    if (!sort) return;
    onComplete({
      completedAt: new Date().toISOString(),
      answer: answer.trim(),
      result: sort,
    });
  };

  const completeManual = () => {
    const stillWithYou: string[] = [];
    const faded: string[] = [];
    savedItems.forEach((item, i) => {
      if (manualVerdicts[i] === 'faded') faded.push(item);
      else stillWithYou.push(item);
    });
    const result: EchoSort = {
      stillWithYou,
      faded,
      onlyCameBackNow: [],
      note: 'Sorted by hand, because the local model was unavailable.',
      manual: true,
      generatedAt: new Date().toISOString(),
    };
    onComplete({
      completedAt: new Date().toISOString(),
      answer: answer.trim(),
      result,
    });
  };

  const renderList = (title: string, items: string[], tone: string) => (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
      <div className={`text-[10px] font-semibold uppercase tracking-widest mb-2 ${tone}`}>{title}</div>
      {items.length === 0 ? (
        <p className="text-xs text-white/40 font-light">Nothing here.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="text-xs text-white/85 font-light">
              — {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-8 animate-in fade-in duration-200">
      <button
        type="button"
        onClick={step === 'ask' ? onBack : () => setStep('ask')}
        className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white mb-6 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>{step === 'ask' ? 'Back' : 'Back to the question'}</span>
      </button>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="liquid-glass rounded-3xl p-6 sm:p-10 border border-white/15 backdrop-blur-2xl shadow-2xl space-y-6"
      >
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
            Echo • a next-day memory test
          </div>
          <h1 className="text-2xl sm:text-4xl font-normal text-white mt-1">
            {step === 'ask' ? 'What still echoes?' : 'Your Echo'}
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mt-1 font-light capitalize">
            {formatEchoDayLabel(daysAgo)}
          </p>
        </div>

        {/* Context only — never the saved notes or answers */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-white/55">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {dateLabel}
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {timeLabel}
          </span>
          <span>•</span>
          <span className="inline-flex items-center gap-1.5 capitalize">
            <MapPin className="w-3.5 h-3.5" />
            {entry.environment} • {entry.focus}
          </span>
        </div>

        {step === 'ask' && (
          <div className="space-y-4">
            <label htmlFor="echo-answer" className="block text-sm text-white/85 font-light">
              What do you still remember about this walk?
            </label>
            <textarea
              id="echo-answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={5}
              placeholder="Write whatever comes back to you — the light, a sound, a detail…"
              className="w-full text-sm p-4 rounded-2xl bg-white/5 border border-white/15 focus:border-white focus:outline-hidden text-white placeholder:text-white/30 backdrop-blur-md"
            />

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={submit}
                disabled={answer.trim().length === 0}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-white text-black text-sm font-semibold hover:bg-white/90 active:scale-95 transition-all shadow-lg cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-4 h-4" />
                <span>Reveal &amp; sort my memory</span>
              </button>
              <button
                type="button"
                onClick={onSkip}
                className="py-3.5 px-6 rounded-2xl bg-white/10 text-white border border-white/20 hover:bg-white/20 text-sm font-medium transition-all cursor-pointer backdrop-blur-md"
              >
                Skip
              </button>
            </div>
          </div>
        )}

        {step === 'working' && (
          <div className="flex items-start gap-3 py-2" role="status" aria-live="polite">
            <Loader2 className="w-4 h-4 mt-0.5 shrink-0 text-white/70 motion-safe:animate-spin" />
            <div>
              <p className="text-sm text-white/90 font-light">
                Comparing with your saved notes using the local model…
              </p>
              <p className="text-xs text-white/55 mt-1 font-light">
                This runs on your CPU and can take a minute or two.
              </p>
            </div>
          </div>
        )}

        {(step === 'result' || step === 'manual') && (
          <div className="space-y-5">
            {/* Saved entry next to the new answer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-2">
                  What you wrote today
                </div>
                <p className="text-xs text-white/85 leading-relaxed whitespace-pre-line font-light">
                  {answer.trim() || '(nothing written)'}
                </p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-2">
                  Your saved entry that day
                </div>
                <ul className="space-y-1.5">
                  {savedItems.length === 0 ? (
                    <li className="text-xs text-white/40 font-light">No saved notes for this walk.</li>
                  ) : (
                    savedItems.map((item, i) => (
                      <li key={i} className="text-xs text-white/75 font-light">
                        — {item}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>

            {step === 'result' && sort && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {renderList('Still with you', sort.stillWithYou, 'text-white/80')}
                  {renderList('Faded', sort.faded, 'text-white/50')}
                  {renderList('Only came back now', sort.onlyCameBackNow, 'text-white/70')}
                </div>
                {sort.note && (
                  <p className="text-sm text-white/80 leading-relaxed bg-white/5 border border-white/10 rounded-2xl p-4 font-light">
                    {sort.note}
                  </p>
                )}
                <button
                  type="button"
                  onClick={completeAI}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-white text-black text-sm font-semibold hover:bg-white/90 active:scale-95 transition-all shadow-lg cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save this Echo to the walk</span>
                </button>
              </>
            )}

            {step === 'manual' && (
              <>
                <div className="rounded-2xl border border-white/15 bg-white/5 p-4 flex items-start gap-3 backdrop-blur-md">
                  <RefreshCw className="w-4 h-4 mt-0.5 shrink-0 text-white/70" />
                  <p className="text-xs text-white/70 leading-relaxed font-light">
                    The local model isn&apos;t available, so nothing was sorted automatically. Tap each
                    memory from your saved entry below.
                  </p>
                </div>

                <div className="space-y-2.5">
                  {savedItems.length === 0 && (
                    <p className="text-xs text-white/50 font-light">
                      There were no saved notes to compare.
                    </p>
                  )}
                  {savedItems.map((item, i) => (
                    <div
                      key={i}
                      className="bg-white/5 border border-white/10 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 backdrop-blur-md"
                    >
                      <span className="text-xs text-white/85 font-light">{item}</span>
                      <div className="flex items-center gap-2 shrink-0" role="group" aria-label="Memory verdict">
                        <button
                          type="button"
                          onClick={() => setManualVerdicts((prev) => ({ ...prev, [i]: 'still' }))}
                          aria-pressed={manualVerdicts[i] !== 'faded'}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                            manualVerdicts[i] !== 'faded'
                              ? 'bg-white text-black'
                              : 'bg-transparent text-white/70 border border-white/25 hover:bg-white/10'
                          }`}
                        >
                          Still remember
                        </button>
                        <button
                          type="button"
                          onClick={() => setManualVerdicts((prev) => ({ ...prev, [i]: 'faded' }))}
                          aria-pressed={manualVerdicts[i] === 'faded'}
                          className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer ${
                            manualVerdicts[i] === 'faded'
                              ? 'bg-white text-black'
                              : 'bg-transparent text-white/70 border border-white/25 hover:bg-white/10'
                          }`}
                        >
                          Faded
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={completeManual}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-white text-black text-sm font-semibold hover:bg-white/90 active:scale-95 transition-all shadow-lg cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Save this Echo to the walk</span>
                </button>
              </>
            )}
          </div>
        )}

        {errorMsg && (
          <p className="text-xs text-white/70 border border-white/15 rounded-2xl p-3.5 font-light">
            {errorMsg}
          </p>
        )}
      </motion.div>
    </div>
  );
};
