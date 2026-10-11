import React from 'react';
import { motion } from 'motion/react';
import { JournalEntry, StoryState, AppScreen } from '../types';
import { getChapterForEntry, getQueueItemForEntry } from '../services/story';
import { BookOpen, ArrowRight, Loader2, RefreshCw, Feather, Clock, WifiOff } from 'lucide-react';

interface PostSaveViewProps {
  entry: JournalEntry;
  story: StoryState;
  isFirstWalk: boolean;
  onNavigate: (screen: AppScreen) => void;
  onRetryChapter: (entryId: string) => void;
}

export const PostSaveView: React.FC<PostSaveViewProps> = ({
  entry,
  story,
  isFirstWalk,
  onNavigate,
  onRetryChapter,
}) => {
  const chapter = getChapterForEntry(story, entry.id);
  const queueItem = getQueueItemForEntry(story, entry.id);

  const isWriting = Boolean(queueItem) && !chapter && !queueItem?.offline && queueItem?.status === 'pending';
  const isQueuedOffline = Boolean(queueItem) && !chapter && queueItem?.offline;
  const hasError = Boolean(queueItem) && !chapter && queueItem?.status === 'error' && !queueItem?.offline;

  return (
    <div className="w-full max-w-2xl mx-auto px-4 py-4 sm:py-8 animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="liquid-glass rounded-3xl p-6 sm:p-10 border border-white/15 backdrop-blur-2xl shadow-2xl space-y-7"
      >
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-widest text-white/50">
            Saved to your private field journal
          </div>
          <h1 className="text-2xl sm:text-4xl font-normal text-white mt-1">
            Walk filed on your device
          </h1>
          <p className="text-xs sm:text-sm text-white/60 mt-1 font-light">
            {entry.pack.title}
          </p>
        </div>

        {isFirstWalk && (
          <div className="flex items-start gap-3 border-t border-white/10 pt-5">
            <Clock className="w-4 h-4 mt-0.5 shrink-0 text-white/70" />
            <p className="text-sm text-white/85 font-light">
              Come back tomorrow. Your first Echo will be waiting.
            </p>
          </div>
        )}

        {/* Field Stories: one fictional chapter per saved walk, generated locally */}
        {(chapter || queueItem) && (
          <div className="border-t border-white/10 pt-5 space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-white/60">
              <Feather className="w-3.5 h-3.5 text-white/70" />
              Fiction inspired by your walk
            </div>

            {chapter && (
              <div className="space-y-3">
                <h2 className="text-xl sm:text-2xl font-normal text-white">{chapter.title}</h2>
                <p className="text-sm text-white/85 leading-relaxed whitespace-pre-line font-light">
                  {chapter.chapter}
                </p>
                <p className="text-sm text-white/70 italic border-l-2 border-white/25 pl-3">
                  {chapter.cliffhanger}
                </p>
              </div>
            )}

            {isWriting && (
              <div className="flex items-start gap-3 py-1" role="status" aria-live="polite">
                <Loader2 className="w-4 h-4 mt-0.5 shrink-0 text-white/70 motion-safe:animate-spin" />
                <div>
                  <p className="text-sm text-white/90 font-light">Writing your chapter…</p>
                  <p className="text-xs text-white/55 mt-1 font-light">
                    The local model runs on your CPU, so this can take a minute or two. You can keep
                    exploring — it continues in the background.
                  </p>
                </div>
              </div>
            )}

            {isQueuedOffline && (
              <div className="flex items-start gap-3 py-1">
                <WifiOff className="w-4 h-4 mt-0.5 shrink-0 text-white/70" />
                <div>
                  <p className="text-sm text-white/90 font-light">
                    The local AI isn&apos;t available right now.
                  </p>
                  <p className="text-xs text-white/55 mt-1 font-light">
                    Your chapter will be written when the local AI is available. Nothing is sent off
                    your device.
                  </p>
                  <button
                    type="button"
                    onClick={() => onRetryChapter(entry.id)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry
                  </button>
                </div>
              </div>
            )}

            {hasError && (
              <div className="flex items-start gap-3 py-1">
                <WifiOff className="w-4 h-4 mt-0.5 shrink-0 text-white/70" />
                <div>
                  <p className="text-sm text-white/90 font-light">
                    {queueItem?.error || 'The chapter could not be written.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => onRetryChapter(entry.id)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-semibold hover:bg-white/90 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-1 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => onNavigate('journal')}
            className="flex-1 flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl bg-white text-black text-base font-semibold hover:bg-white/90 active:scale-95 transition-all shadow-xl cursor-pointer group"
          >
            <BookOpen className="w-4 h-4" />
            <span>Read your journal</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
