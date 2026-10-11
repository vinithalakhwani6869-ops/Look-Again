// Shared safety validator for AI-generated Walk Packs.
//
// This lives outside server.ts so it can be unit-tested without starting the
// HTTP server (see scripts/pack-safety.test.ts).

export interface PackSafetyResult {
  valid: boolean;
  reason?: string;
}

// Terms that must never appear in a generated pack. Matching is word-boundary
// based (case-insensitive), so a blocked term only matches as a whole word.
// This means valid words such as "surface" (face), "great" (eat), "repeat"
// (peat) and "feature" (eat) are NOT rejected, while the risky standalone
// words still are.
export const UNSAFE_TERMS = [
  'people',
  'person',
  'stranger',
  'watch them',
  'follow',
  'face',
  'stare',
  'private property',
  'trespass',
  'climb',
  'touch plant',
  'touch berry',
  'eat',
  'touch mushroom',
  'touch insect',
  'wildlife',
  'approach animal',
  'danger',
  'photograph',
  'take picture',
  'record video',
  'identify species',
  'latin name',
] as const;

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// One compiled pattern per term. `\b` on both ends gives whole-word matching;
// it works for multi-word phrases too (e.g. "take picture").
export const UNSAFE_PATTERNS: RegExp[] = UNSAFE_TERMS.map(
  (term) => new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i'),
);

export function findUnsafeTerm(text: string): string | null {
  for (let i = 0; i < UNSAFE_PATTERNS.length; i++) {
    if (UNSAFE_PATTERNS[i].test(text)) return UNSAFE_TERMS[i];
  }
  return null;
}

export function validatePackSafety(pack: any): PackSafetyResult {
  if (!pack || typeof pack !== 'object') return { valid: false, reason: 'Invalid pack format' };

  const textCorpus = [
    pack.title || '',
    pack.lookPrompt || '',
    ...(Array.isArray(pack.checkQuestions) ? pack.checkQuestions : []),
  ].join(' ');

  const term = findUnsafeTerm(textCorpus);
  if (term) {
    return {
      valid: false,
      reason: `Safety violation: prompt referenced restricted observation "${term}"`,
    };
  }

  if (!Array.isArray(pack.checkQuestions) || pack.checkQuestions.length < 4) {
    return { valid: false, reason: 'Pack must contain at least 4 check questions' };
  }

  return { valid: true };
}
