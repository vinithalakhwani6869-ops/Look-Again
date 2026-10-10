import { JournalEntry, WalkPack, CheckResult, EnvironmentType, FocusType, StoryState } from '../types';

const STORAGE_KEY_JOURNAL = 'lookagain_journal_entries_v1';
const STORAGE_KEY_ACTIVE_WALK = 'lookagain_active_walk_v1';
const STORAGE_KEY_STORY = 'lookagain_story_v1';
const STORAGE_KEY_DEMO = 'lookagain_demo_mode_v1';

export interface StoredActiveWalk {
  pack: WalkPack;
  startTime: number;
  targetEndTime: number;
  durationMinutes: number;
  step: 'active_walk' | 'recall' | 'look_again' | 'reflect' | 'unpack';
  recallFreeText?: string;
  recalledAnswers?: Record<number, string>;
  checkResults?: CheckResult[];
  surpriseNote?: string;
  reflections?: Record<string, string>;
}

// Memory cache for immediate sync access
let cachedEntries: JournalEntry[] | null = null;

export async function getJournalEntries(): Promise<JournalEntry[]> {
  if (cachedEntries !== null) {
    return cachedEntries;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY_JOURNAL);
    if (raw) {
      cachedEntries = JSON.parse(raw);
      return cachedEntries || [];
    }
  } catch (e) {
    console.error('Failed to read journal from localStorage:', e);
  }

  cachedEntries = [];
  return [];
}

export async function saveJournalEntry(entry: JournalEntry): Promise<void> {
  const entries = await getJournalEntries();
  const existingIndex = entries.findIndex((e) => e.id === entry.id);

  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.unshift(entry);
  }

  cachedEntries = [...entries];
  try {
    localStorage.setItem(STORAGE_KEY_JOURNAL, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to write journal to localStorage:', e);
  }
}

export async function updateJournalEntry(entry: JournalEntry): Promise<void> {
  return saveJournalEntry(entry);
}

export async function deleteJournalEntry(id: string): Promise<void> {
  const entries = await getJournalEntries();
  const filtered = entries.filter((e) => e.id !== id);
  cachedEntries = filtered;
  try {
    localStorage.setItem(STORAGE_KEY_JOURNAL, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete entry from localStorage:', e);
  }
}

export async function deleteAllJournalEntries(): Promise<void> {
  cachedEntries = [];
  try {
    localStorage.removeItem(STORAGE_KEY_JOURNAL);
    localStorage.removeItem(STORAGE_KEY_ACTIVE_WALK);
    localStorage.removeItem(STORAGE_KEY_STORY);
  } catch (e) {
    console.error('Failed to clear journal in localStorage:', e);
  }
}

// --- Field Stories persistence (pure storage; generation lives in story.ts) ---

const EMPTY_STORY: StoryState = { chapters: [], queue: [], synopsis: '' };

export function getStoredStory(): StoryState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STORY);
    if (!raw) return { ...EMPTY_STORY, chapters: [], queue: [] };
    const parsed = JSON.parse(raw) as Partial<StoryState>;
    return {
      chapters: Array.isArray(parsed.chapters) ? parsed.chapters : [],
      queue: Array.isArray(parsed.queue) ? parsed.queue : [],
      synopsis: typeof parsed.synopsis === 'string' ? parsed.synopsis : '',
    };
  } catch (e) {
    console.error('Failed to read story from localStorage:', e);
    return { ...EMPTY_STORY, chapters: [], queue: [] };
  }
}

export function saveStoredStory(state: StoryState): void {
  try {
    localStorage.setItem(STORAGE_KEY_STORY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to write story to localStorage:', e);
  }
}

export function clearStoredStory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY_STORY);
  } catch (e) {
    console.error('Failed to clear story from localStorage:', e);
  }
}

// --- Demo mode persistence ---

export function getDemoMode(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_DEMO) === 'true';
  } catch (e) {
    return false;
  }
}

export function setDemoMode(enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY_DEMO, enabled ? 'true' : 'false');
  } catch (e) {
    console.error('Failed to persist demo mode:', e);
  }
}

// Active Walk state tracking
export function getStoredActiveWalk(): StoredActiveWalk | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ACTIVE_WALK);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

export function saveStoredActiveWalk(state: StoredActiveWalk | null): void {
  try {
    if (state === null) {
      localStorage.removeItem(STORAGE_KEY_ACTIVE_WALK);
    } else {
      localStorage.setItem(STORAGE_KEY_ACTIVE_WALK, JSON.stringify(state));
    }
  } catch (e) {
    console.error('Failed to persist active walk state:', e);
  }
}

// Compute qualitative plain-language summary of tendencies without numbers
export function computePastTendenciesSummary(entries: JournalEntry[]): string {
  if (entries.length === 0) return '';

  const focusCounts: Record<string, number> = {};
  let totalRight = 0;
  let totalWrong = 0;
  let totalNeverNoticed = 0;

  for (const entry of entries) {
    focusCounts[entry.focus] = (focusCounts[entry.focus] || 0) + 1;
    for (const res of entry.checkResults) {
      if (res.verdict === 'right') totalRight++;
      else if (res.verdict === 'wrong') totalWrong++;
      else if (res.verdict === 'never_noticed') totalNeverNoticed++;
    }
  }

  const frequentFocuses = Object.entries(focusCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([f]) => f);

  const parts: string[] = [];
  if (frequentFocuses.length > 0) {
    parts.push(`User frequently explores: ${frequentFocuses.slice(0, 3).join(', ')}.`);
  }

  if (totalNeverNoticed > totalRight) {
    parts.push('User often encounters details they had completely missed while walking.');
  } else if (totalRight > totalWrong && totalRight > 0) {
    parts.push('User tends to have accurate memory on immediate physical landmarks.');
  }

  return parts.join(' ');
}

// Export / Import
export function exportJournalAsJson(entries: JournalEntry[]): string {
  return JSON.stringify(
    {
      app: 'LOOK AGAIN',
      exportedAt: new Date().toISOString(),
      version: 1,
      entries,
    },
    null,
    2
  );
}

export async function importJournalFromJson(jsonString: string): Promise<number> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.entries || !Array.isArray(data.entries)) {
      throw new Error('Invalid backup file format');
    }

    const current = await getJournalEntries();
    const existingIds = new Set(current.map((e) => e.id));

    let importedCount = 0;
    for (const entry of data.entries) {
      if (entry.id && entry.pack) {
        if (!existingIds.has(entry.id)) {
          current.unshift(entry);
          existingIds.add(entry.id);
          importedCount++;
        }
      }
    }

    cachedEntries = current;
    localStorage.setItem(STORAGE_KEY_JOURNAL, JSON.stringify(current));
    return importedCount;
  } catch (err: any) {
    throw new Error(`Import failed: ${err.message}`);
  }
}
