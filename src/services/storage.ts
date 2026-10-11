import { JournalEntry, WalkPack, CheckResult, EnvironmentType, FocusType, StoryState, StoryChapter } from '../types';

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

export interface SaveJournalResult {
  ok: boolean;
  error?: string;
}

// Memory cache for immediate sync access
let cachedEntries: JournalEntry[] | null = null;

// A human-readable note about the most recent storage problem. Consumed by the
// UI (via consumeStorageIssue) so the user is never silently told "saved"
// when a write failed or corrupt data was merely discarded.
let storageIssue: string | null = null;

export function consumeStorageIssue(): string | null {
  const issue = storageIssue;
  storageIssue = null;
  return issue;
}

function describeWriteError(e: unknown): string {
  const err = e as any;
  if (err?.name === 'QuotaExceededError' || err?.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
    return 'Storage is full. Your entry was kept in memory but could not be saved to this browser.';
  }
  if (err?.name === 'SecurityError') {
    return 'This browser blocked storage access, so the entry could not be saved to disk.';
  }
  return 'The journal could not be saved to this browser. Your entry was kept in memory.';
}

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
    // Corrupt data: back it up under a recoverable key, tell the user, and
    // return an empty list WITHOUT silently overwriting on the next save.
    try {
      const rawValue = localStorage.getItem(STORAGE_KEY_JOURNAL);
      if (rawValue !== null) {
        const backupKey = `${STORAGE_KEY_JOURNAL}-corrupt-${Date.now()}`;
        localStorage.setItem(backupKey, rawValue);
        storageIssue =
          `Your journal data was not readable and was backed up under "${backupKey}" so ` +
          'nothing is lost. New walks start from an empty journal.';
      }
    } catch {
      storageIssue =
        'Your journal data in this browser was not readable and could not be backed up either. ' +
        'You can restore it by opening the Developer Tools and copying the "lookagain_journal_entries_v1" value.';
    }
    console.error('Failed to read journal from localStorage:', e);
  }

  cachedEntries = [];
  return [];
}

export async function saveJournalEntry(entry: JournalEntry): Promise<SaveJournalResult> {
  const entries = await getJournalEntries();
  const existingIndex = entries.findIndex((e) => e.id === entry.id);

  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.unshift(entry);
  }

  // Always keep the in-memory copy so a failed write never loses the entry.
  cachedEntries = [...entries];
  try {
    localStorage.setItem(STORAGE_KEY_JOURNAL, JSON.stringify(entries));
    storageIssue = null;
    return { ok: true };
  } catch (e) {
    storageIssue = describeWriteError(e);
    console.error('Failed to write journal to localStorage:', e);
    return { ok: false, error: storageIssue };
  }
}

export async function updateJournalEntry(entry: JournalEntry): Promise<SaveJournalResult> {
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

// --- Readable text export -------------------------------------------------
// Produces a plain-text copy of the field journal, written for a person to
// read in Notepad (not a machine backup). Nothing is ever imported back.

const EXPORT_DIVIDER = '='.repeat(66);
const EXPORT_SUBDIVIDER = '-'.repeat(66);
// Keep lines readable in a plain text editor without hard-wrapping mid-word.
const EXPORT_WIDTH = 96;

function textValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
}

// Wrap long lines on word boundaries, preserving existing line breaks and
// blank lines so paragraphs and lists stay intact.
function wrapText(text: string, width = EXPORT_WIDTH): string {
  const normalized = textValue(text).replace(/\r\n?/g, '\n').trimEnd();
  const out: string[] = [];
  for (const line of normalized.split('\n')) {
    if (line.length <= width) {
      out.push(line);
      continue;
    }
    const words = line.split(/\s+/);
    let current = '';
    for (const word of words) {
      if (current === '') {
        current = word;
      } else if (current.length + 1 + word.length <= width) {
        current += ` ${word}`;
      } else {
        out.push(current);
        current = word;
      }
    }
    if (current !== '') out.push(current);
  }
  return out.join('\n');
}

function indentBlock(text: string, prefix = '  '): string {
  return text
    .split('\n')
    .map((line) => (line.length > 0 ? prefix + line : ''))
    .join('\n');
}

function verdictLabel(verdict: CheckResult['verdict']): string {
  if (verdict === 'right') return 'Right';
  if (verdict === 'wrong') return 'Wrong';
  return 'Never noticed';
}

export function buildJournalText(entries: JournalEntry[], chapters: StoryChapter[]): string {
  const lines: string[] = [];

  const exportDate = new Date().toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Chronological order: oldest first.
  const ordered = [...entries].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  lines.push('LOOK AGAIN: Field Journal');
  lines.push(`Exported: ${exportDate}`);
  lines.push(`Walks: ${ordered.length}`);
  lines.push('');
  lines.push(
    'This is a readable copy of your private field journal. The original data is stored only on'
  );
  lines.push('this device, inside this browser.');
  lines.push('');

  ordered.forEach((entry, index) => {
    const pack = entry.pack || ({} as WalkPack);
    lines.push(EXPORT_DIVIDER);
    lines.push(`WALK ${index + 1}`);
    lines.push(EXPORT_DIVIDER);
    lines.push('');

    lines.push(`Title:        ${textValue(pack.title) || 'Untitled walk'}`);
    lines.push(`Date:         ${new Date(entry.createdAt).toLocaleString()}`);
    lines.push(`Duration:     ${textValue(entry.durationMinutes)} minutes`);
    lines.push(`Environment:  ${textValue(entry.environment)}`);
    lines.push(`Focus:        ${textValue(entry.focus)}`);
    lines.push('');

    const prompt = textValue(pack.lookPrompt).trim();
    if (prompt) {
      lines.push('Walk prompt:');
      lines.push(indentBlock(wrapText(prompt)));
      lines.push('');
    }

    const recall = textValue(entry.recallFreeText).trim();
    if (recall) {
      lines.push('What I remembered:');
      lines.push(indentBlock(wrapText(recall)));
      lines.push('');
    }

    if (Array.isArray(entry.checkResults) && entry.checkResults.length > 0) {
      lines.push('Memory checks:');
      lines.push('');
      entry.checkResults.forEach((result, i) => {
        const question = textValue(result.question).trim();
        if (question) {
          lines.push(indentBlock(wrapText(`${i + 1}. ${question}`)));
        }
        const answer = textValue(result.answer).trim();
        if (answer) {
          lines.push(indentBlock(wrapText(`My answer:  "${answer}"`, EXPORT_WIDTH - 2), '  '));
        }
        lines.push(indentBlock(`Verdict:    ${verdictLabel(result.verdict)}`, '  '));
        const actual = textValue(result.actualSeen).trim();
        if (actual) {
          lines.push(indentBlock(wrapText(`I actually saw:  "${actual}"`, EXPORT_WIDTH - 2), '  '));
        }
        lines.push('');
      });
    }

    const surprise = textValue(entry.surpriseNote).trim();
    if (surprise) {
      lines.push('One thing that surprised me:');
      lines.push(indentBlock(wrapText(surprise)));
      lines.push('');
    }

    const reflectionEntries = Object.entries(entry.reflections || {}).filter(
      ([, value]) => textValue(value).trim().length > 0
    );
    if (reflectionEntries.length > 0) {
      lines.push('Reflections:');
      reflectionEntries.forEach(([question, value]) => {
        lines.push(indentBlock(wrapText(`Q: ${question}`)));
        lines.push(indentBlock(wrapText(`A: ${textValue(value).trim()}`, EXPORT_WIDTH - 2), '  '));
      });
      lines.push('');
    }

    if (entry.aiSummary) {
      const summaryText = textValue(entry.aiSummary.journalText).trim();
      const tendency = textValue(entry.aiSummary.tendencyNote).trim();
      const nextFocus = textValue(entry.aiSummary.suggestedNextFocus).trim();
      if (summaryText || tendency || nextFocus) {
        lines.push('AI field journal summary:');
        if (summaryText) lines.push(indentBlock(wrapText(summaryText)));
        if (tendency) {
          lines.push(indentBlock('Tendency note:'));
          lines.push(indentBlock(wrapText(tendency)));
        }
        if (nextFocus) lines.push(indentBlock(`Suggested next focus: ${nextFocus}`));
        lines.push('');
      }
    }

    if (entry.echo) {
      lines.push('Echo (next-day memory):');
      lines.push(indentBlock(`Recorded: ${new Date(entry.echo.completedAt).toLocaleString()}`));
      if (entry.echo.skipped) {
        lines.push(indentBlock('This Echo was skipped.'));
      } else {
        const echoAnswer = textValue(entry.echo.answer).trim();
        if (echoAnswer) {
          lines.push(indentBlock('What came back:'));
          lines.push(indentBlock(wrapText(echoAnswer, EXPORT_WIDTH - 2), '    '));
        }
        const result = entry.echo.result;
        if (result) {
          const echoSections: Array<[string, string[]]> = [
            ['Still with you', result.stillWithYou],
            ['Faded', result.faded],
            ['Only came back now', result.onlyCameBackNow],
          ];
          echoSections.forEach(([title, items]) => {
            const clean = (Array.isArray(items) ? items : []).map((it) => textValue(it).trim()).filter(Boolean);
            lines.push(indentBlock(`${title}:`));
            if (clean.length === 0) {
              lines.push(indentBlock('Nothing here.', '    '));
            } else {
              clean.forEach((it) => lines.push(indentBlock(wrapText(`- ${it}`, EXPORT_WIDTH - 4), '    ')));
            }
          });
          const note = textValue(result.note).trim();
          if (note) {
            lines.push(indentBlock('Note:'));
            lines.push(indentBlock(wrapText(note, EXPORT_WIDTH - 2), '    '));
          }
          if (result.manual) {
            lines.push(indentBlock('(Sorted by hand, because the local model was unavailable.)'));
          }
        }
      }
      lines.push('');
    }

    // Subtle separator between walks.
    lines.push(EXPORT_SUBDIVIDER);
    lines.push('');
  });

  const orderedChapters = [...chapters].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  if (orderedChapters.length > 0) {
    lines.push(EXPORT_DIVIDER);
    lines.push('FIELD STORIES (fiction inspired by your walks)');
    lines.push(EXPORT_DIVIDER);
    lines.push('');
    lines.push('These chapters are works of fiction inspired by your walks. They are kept');
    lines.push('separate from the journal facts above.');
    lines.push('');

    orderedChapters.forEach((chapter, index) => {
      const title = textValue(chapter.title).trim();
      lines.push(`CHAPTER ${index + 1}${title ? ` — ${title}` : ''}`);
      lines.push(`Date: ${new Date(chapter.createdAt).toLocaleString()}`);
      lines.push('');
      const body = textValue(chapter.chapter).trim();
      if (body) {
        lines.push(wrapText(body));
        lines.push('');
      }
      const cliffhanger = textValue(chapter.cliffhanger).trim();
      if (cliffhanger) {
        lines.push(`Cliffhanger: ${cliffhanger}`);
        lines.push('');
      }
      lines.push(EXPORT_SUBDIVIDER);
      lines.push('');
    });
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
