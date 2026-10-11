// Unit-style checks for the Walk Pack safety validator.
// Run with: npm run test:safety
import { validatePackSafety, findUnsafeTerm } from '../src/lib/packSafety';

let failures = 0;
let checks = 0;

function expect(condition: boolean, label: string) {
  checks++;
  if (condition) {
    console.log(`  ok   - ${label}`);
  } else {
    failures++;
    console.error(`  FAIL - ${label}`);
  }
}

function makePack(overrides: Record<string, unknown> = {}) {
  return {
    title: 'Roofline Walk',
    lookPrompt: 'Look only above head height at rooflines, wires, and tree canopies.',
    durationMinutes: 10,
    category: 'street:above',
    checkQuestions: [
      'What is the highest man-made object in view?',
      'How many distinct sounds did you hear?',
      'Which way were cast shadows falling?',
      'What color is directly behind your back?',
    ],
    reflectionQuestions: ['What surprised you?', 'What do you usually overlook?'],
    ...overrides,
  };
}

console.log('Valid packs must pass:');
// Words that previously triggered naive substring matching must now pass.
for (const word of ['surface', 'great', 'repeat', 'feature', 'peat', 'faces', 'greatest']) {
  expect(validatePackSafety(makePack({ lookPrompt: `Notice any ${word} nearby.` })).valid, `accepts "${word}"`);
}
expect(validatePackSafety(makePack()).valid, 'accepts a normal pack');
expect(validatePackSafety(makePack({ title: 'A peaceful walk' })).valid, 'accepts ordinary prose');

console.log('Unsafe packs must still be rejected:');
const unsafeCases: Array<[string, Record<string, unknown>]> = [
  ['standalone "face"', { lookPrompt: 'Look at the face across the street.' }],
  ['standalone "eat"', { lookPrompt: 'Eat what you find.' }],
  ['"watch them"', { lookPrompt: 'Watch them from a distance.' }],
  ['"follow"', { lookPrompt: 'Follow the path of strangers.' }],
  ['"private property"', { lookPrompt: 'Look at the private property.' }],
  ['"trespass"', { lookPrompt: 'Trespass quietly.' }],
  ['"photograph"', { lookPrompt: 'Photograph the scene.' }],
  ['"people"', { lookPrompt: 'Count the people you see.' }],
];
for (const [label, overrides] of unsafeCases) {
  expect(!validatePackSafety(makePack(overrides)).valid, `rejects ${label}`);
}

console.log('Structural checks:');
expect(!validatePackSafety(makePack({ checkQuestions: ['one', 'two', 'three'] })).valid, 'rejects fewer than 4 questions');
expect(validatePackSafety(makePack({ checkQuestions: ['a', 'b', 'c', 'd'] })).valid, 'accepts exactly 4 questions');
expect(!validatePackSafety(null).valid, 'rejects null pack');

console.log('Word-boundary sanity:');
expect(findUnsafeTerm('surface area is great') === null, 'no false positive in common words');
expect(findUnsafeTerm('do not eat this') === 'eat', 'detects whole-word "eat"');

console.log(`\n${checks - failures}/${checks} checks passed.`);
if (failures > 0) {
  console.error(`${failures} check(s) failed.`);
  process.exit(1);
}
console.log('All pack-safety checks passed.');
