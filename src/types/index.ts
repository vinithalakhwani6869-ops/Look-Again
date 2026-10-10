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
