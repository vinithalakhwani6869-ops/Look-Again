export type EnvironmentType = 'street' | 'park' | 'campus' | 'balcony' | 'general';

export type FocusType = 
  | 'surprise'
  | 'sounds'
  | 'patterns'
  | 'movement'
  | 'light'
  | 'above'
  | 'periphery'
  | 'details';

export interface WalkPack {
  id: string;
  title: string;
  lookPrompt: string; // One concrete sentence, no "identify X"
  durationMinutes: number; // 5, 10, 15
  category: string; // e.g. "street:above", "park:sounds"
  environment: EnvironmentType;
  focus: FocusType;
  checkQuestions: string[]; // 4-5 questions answerable from memory AND verifiable by looking again
  reflectionQuestions: string[]; // 2-3 gentle prompts
  isPreset: boolean;
  modelUsed?: string;
  generatedAt: string;
}

export type CheckVerdict = 'right' | 'wrong' | 'never_noticed';

export interface CheckResult {
  question: string;
  answer: string; // User's recall from memory
  verdict: CheckVerdict;
  actualSeen?: string; // What was actually there when checking
}

export interface JournalEntry {
  id: string;
  createdAt: string; // ISO date string
  completedAt: string;
  pack: WalkPack;
  durationMinutes: number;
  environment: EnvironmentType;
  focus: FocusType;
  recallFreeText: string;
  checkResults: CheckResult[];
  surpriseNote: string;
  reflections: Record<string, string>;
  aiSummary?: {
    journalText: string;
    tendencyNote: string;
    suggestedNextFocus?: FocusType;
    generatedWith?: string;
    generatedAt: string;
  };
  echo?: EchoRecord;
}

// --- Field Stories (Fiction inspired by your walk) ---

export interface StoryChapter {
  id: string;
  entryId: string; // links the chapter to the journal entry that unlocked it
  title: string;
  chapter: string; // 150-220 words
  cliffhanger: string; // one sentence
  createdAt: string;
  modelUsed?: string;
}

export type StoryQueueStatus = 'pending' | 'error';

export interface StoryQueueItem {
  entryId: string;
  status: StoryQueueStatus;
  error?: string;
  offline?: boolean;
  createdAt: string;
}

export interface StoryState {
  chapters: StoryChapter[];
  queue: StoryQueueItem[];
  synopsis: string; // running synopsis, max ~120 words
}

// --- Echo (next-day memory test) ---

export interface EchoSort {
  stillWithYou: string[];
  faded: string[];
  onlyCameBackNow: string[];
  note: string;
  manual?: boolean;
  generatedWith?: string;
  generatedAt: string;
}

export interface EchoRecord {
  completedAt: string;
  answer: string;
  skipped?: boolean;
  result?: EchoSort;
}

export type AppScreen = 
  | 'home'
  | 'pack_setup'
  | 'pack_ready'
  | 'active_walk'
  | 'recall'
  | 'look_again'
  | 'reflect'
  | 'unpack'
  | 'post_save'
  | 'echo'
  | 'journal'
  | 'entry_detail';

export interface OllamaHealthStatus {
  status: 'ok' | 'unavailable';
  ollamaUrl: string;
  targetModel: string;
  modelAvailable: boolean;
  installedModels: string[];
  message?: string;
  responseTimeMs?: number;
}
