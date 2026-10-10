import { JournalEntry, StoryChapter, StoryState, StoryQueueItem } from '../types';
import { getStoredStory, saveStoredStory, getJournalEntries, clearStoredStory } from './storage';
import { generateStoryChapter } from './api';

const MAX_SYNOPSIS_WORDS = 120;
const MAX_QUEUE = 25;

let processing = false;
const listeners = new Set<() => void>();

const EMPTY: StoryState = { chapters: [], queue: [], synopsis: '' };
// Stable snapshot reference for React's useSyncExternalStore. It only changes
// when the store actually changes, so getSnapshot stays referentially stable.
let snapshot: StoryState | null = null;

export function subscribeStory(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  listeners.forEach((l) => l());
}

export function getStory(): StoryState {
  if (snapshot === null) {
    snapshot = getStoredStory();
  }
  return snapshot;
}

function commit(state: StoryState) {
  snapshot = state;
  saveStoredStory(state);
  emit();
}

function trimToWords(text: string, maxWords: number): string {
  const words = (text || '').trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return words.join(' ');
  return words.slice(0, maxWords).join(' ');
}

// Pull a handful of short, REAL observations from a saved entry. Never invents.
export function extractObservations(entry: JournalEntry): string[] {
  const out: string[] = [];
  const push = (value?: string) => {
    const text = (value || '').trim();
    if (text) out.push(text.slice(0, 200));
  };

  push(entry.recallFreeText);
  push(entry.surpriseNote);
  entry.checkResults?.forEach((r) => {
    push(r.actualSeen);
    push(r.answer);
  });
  Object.values(entry.reflections || {}).forEach((v) => push(v));

  return out.slice(0, 6);
}

// A compact plain-text version of the saved entry (facts only) for the Echo sort.
export function buildSavedEntryText(entry: JournalEntry): string {
  const lines: string[] = [];
  if (entry.recallFreeText) lines.push(`Free recall: ${entry.recallFreeText}`);
  if (entry.surpriseNote) lines.push(`Surprise: ${entry.surpriseNote}`);

  entry.checkResults?.forEach((r, i) => {
    const parts = [`Q${i + 1}: ${r.question}`];
    if (r.answer) parts.push(`remembered "${r.answer}"`);
    if (r.actualSeen) parts.push(`actually saw "${r.actualSeen}"`);
    lines.push(parts.join(' — '));
  });

  Object.entries(entry.reflections || {}).forEach(([key, value]) => {
    if (value) lines.push(`${key}: ${value}`);
  });

  return lines.join('\n');
}

function hasChapterForEntry(state: StoryState, entryId: string): boolean {
  return state.chapters.some((c) => c.entryId === entryId);
}

function isQueued(state: StoryState, entryId: string): boolean {
  return state.queue.some((q) => q.entryId === entryId);
}

export function getChapterForEntry(state: StoryState, entryId: string): StoryChapter | undefined {
  return state.chapters.find((c) => c.entryId === entryId);
}

export function getQueueItemForEntry(state: StoryState, entryId: string): StoryQueueItem | undefined {
  return state.queue.find((q) => q.entryId === entryId);
}

// Strict gating: a chapter is requested ONLY when a walk has just been saved,
// and at most one chapter per saved entry. The next chapter cannot be queued
// until another walk is saved and this entry's chapter is settled.
export function requestChapter(entry: JournalEntry): void {
  const state = getStoredStory();
  if (hasChapterForEntry(state, entry.id) || isQueued(state, entry.id)) return;

  const item: StoryQueueItem = {
    entryId: entry.id,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  state.queue = [...state.queue, item].slice(-MAX_QUEUE);
  commit(state);
  void processQueue();
}

// Writes pending chapters one at a time (CPU-only, can take a minute or two).
// Never blocks the UI. On unavailable Ollama the item stays pending so it is
// written when the local AI returns — never a fake or preset chapter.
export async function processQueue(): Promise<void> {
  if (processing) return;
  processing = true;
  try {
    for (;;) {
      const state = getStoredStory();
      const next = state.queue.find((q) => q.status === 'pending');
      if (!next) break;

      const entries = await getJournalEntries();
      const entry = entries.find((e) => e.id === next.entryId);

      if (!entry) {
        // The entry was deleted; drop the orphaned queued chapter.
        const cleanup = getStoredStory();
        cleanup.queue = cleanup.queue.filter((q) => q.entryId !== next.entryId);
        commit(cleanup);
        continue;
      }

      const fresh = getStoredStory();
      if (hasChapterForEntry(fresh, entry.id)) {
        fresh.queue = fresh.queue.filter((q) => q.entryId !== entry.id);
        commit(fresh);
        continue;
      }

      const lastChapter = [...fresh.chapters]
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
        .at(-1);

      try {
        const result = await generateStoryChapter({
          observations: extractObservations(entry),
          synopsis: fresh.synopsis,
          lastLine: lastChapter?.cliffhanger || '',
        });

        const after = getStoredStory();
        const chapter: StoryChapter = {
          id: `story-${entry.id}-${Date.now()}`,
          entryId: entry.id,
          title: result.title,
          chapter: result.chapter,
          cliffhanger: result.cliffhanger,
          createdAt: new Date().toISOString(),
          modelUsed: result.modelUsed,
        };
        after.chapters = [...after.chapters.filter((c) => c.entryId !== entry.id), chapter];
        after.synopsis = trimToWords(result.synopsisUpdate || after.synopsis, MAX_SYNOPSIS_WORDS);
        after.queue = after.queue.filter((q) => q.entryId !== entry.id);
        commit(after);
      } catch (err: any) {
        const failed = getStoredStory();
        const item = failed.queue.find((q) => q.entryId === entry.id);
        if (item) {
          if (err?.offline) {
            // Keep it pending so it is written when local AI returns.
            item.status = 'pending';
            item.offline = true;
            item.error = undefined;
          } else {
            item.status = 'error';
            item.offline = false;
            item.error = err?.message || 'The chapter could not be written.';
          }
        }
        commit(failed);
        // If Ollama is unreachable, stop instead of hammering it.
        if (err?.offline) break;
      }
    }
  } finally {
    processing = false;
  }
}

// Used by "Delete all data" so the UI immediately reflects the cleared stories.
export function clearStory(): void {
  clearStoredStory();
  snapshot = { ...EMPTY };
  emit();
}

export function retryChapter(entryId: string): void {
  const state = getStoredStory();
  const item = state.queue.find((q) => q.entryId === entryId);
  if (!item) return;
  item.status = 'pending';
  item.error = undefined;
  item.offline = false;
  commit(state);
  void processQueue();
}
