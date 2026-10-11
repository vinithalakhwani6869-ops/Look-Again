import { buildJournalText } from './src/services/storage';
import { JournalEntry, StoryChapter } from './src/types';

const entries: JournalEntry[] = [
  {
    id: 'e1',
    createdAt: '2026-10-08T09:00:00.000Z',
    completedAt: '2026-10-08T09:10:00.000Z',
    pack: {
      id: 'p1',
      title: 'Morning Rooftop Lines',
      lookPrompt: 'Look only above head height at rooflines, wires, and tree canopies.',
      durationMinutes: 10,
      category: 'street:above',
      environment: 'street',
      focus: 'above',
      checkQuestions: ['What is the highest man-made object in view?', 'How many distinct sounds did you hear?'],
      reflectionQuestions: ['What detail do you remember most clearly?', 'What did you notice that you would normally walk right past?'],
      isPreset: false,
      modelUsed: 'qwen3:4b',
      generatedAt: '2026-10-08T08:50:00.000Z',
    },
    durationMinutes: 10,
    environment: 'street',
    focus: 'above',
    recallFreeText:
      'I remember wires crossing the street in a big X, and one white bird resting on an antenna. There was a smell of fresh bread from somewhere.',
    checkResults: [
      { question: 'What is the highest man-made object in view?', answer: 'the rooftop antenna', verdict: 'right', actualSeen: 'a grey antenna on the corner roof' },
      { question: 'How many distinct sounds did you hear?', answer: 'three', verdict: 'wrong', actualSeen: 'five distinct sounds' },
      { question: 'Which way were cast shadows falling?', answer: '', verdict: 'never_noticed' },
    ],
    surpriseNote: 'A kite was stuck in the wires above the bakery.',
    reflections: {
      'What detail do you remember most clearly?': 'The white bird turning its head.',
      'What did you notice that you would normally walk right past?': 'A tiny crack in the pavement shaped like a leaf.',
    },
    aiSummary: {
      journalText: 'A short walk above head height caught wires, a resting bird, and a roof antenna. The same walk held a surprise: a kite caught in the wires. This person notices quiet rooftop life.',
      tendencyNote: 'You consistently caught objects above eye level and ambient sounds, but rarely looked down at the ground.',
      suggestedNextFocus: 'details',
      generatedWith: 'qwen3:4b',
      generatedAt: '2026-10-08T09:11:00.000Z',
    },
    echo: {
      completedAt: '2026-10-09T09:00:00.000Z',
      answer: 'I still remember the white bird and the kite in the wires.',
      result: {
        stillWithYou: ['the white bird on the antenna', 'the kite stuck in the wires'],
        faded: [],
        onlyCameBackNow: ['the smell of fresh bread'],
        note: 'The rooftop scene came back quickly; smells faded but returned when mentioned.',
        manual: false,
        generatedWith: 'qwen3:4b',
        generatedAt: '2026-10-09T09:00:05.000Z',
      },
    },
  },
  {
    id: 'e2',
    createdAt: '2026-10-10T16:00:00.000Z',
    completedAt: '2026-10-10T16:15:00.000Z',
    pack: {
      id: 'p2',
      title: 'Dusk Park Sounds',
      lookPrompt: 'Close your eyes halfway and listen: count the layers of sound around a single bench.',
      durationMinutes: 15,
      category: 'park:sounds',
      environment: 'park',
      focus: 'sounds',
      checkQuestions: ['Which sound was loudest?', 'How many birds did you hear?'],
      reflectionQuestions: [],
      isPreset: true,
      generatedAt: '2026-10-10T15:50:00.000Z',
    },
    durationMinutes: 15,
    environment: 'park',
    focus: 'sounds',
    recallFreeText: '',
    checkResults: [
      { question: 'Which sound was loudest?', answer: 'a distant lawnmower', verdict: 'right', actualSeen: 'a distant lawnmower' },
    ],
    surpriseNote: '',
    reflections: {},
    aiSummary: {
      journalText: '',
      tendencyNote: '',
      suggestedNextFocus: undefined,
      generatedAt: '2026-10-10T16:16:00.000Z',
    },
  },
];

const chapters: StoryChapter[] = [
  {
    id: 'c1',
    entryId: 'e1',
    title: 'The Kite Above the Bakery',
    chapter:
      'Every morning the same white bird returned to the tallest antenna and looked at the street below. One day, the kite appeared, a small grey shape caught between the wires, swaying like a metronome. The wind smelled of warm bread, and the bird tilted its head as if listening to something beyond the roofs. Nobody could say when the kite had arrived, only that the wires hummed a little differently since. The bird kept watch, patient, as if waiting for the sky to finish a sentence it had started long ago.',
    cliffhanger: 'That night, the wires went silent, and the kite was gone.',
    createdAt: '2026-10-08T09:20:00.000Z',
    modelUsed: 'qwen3:4b',
  },
  {
    id: 'c2',
    entryId: 'e2',
    title: 'The Bench That Listened',
    chapter:
      'The park bench had heard a thousand conversations. Tonight it listened to a single person counting sounds: a far-off mower, three birds, wind in the elms. The bench stored each sound like a pressed leaf in a book. Somewhere a gate opened, and the sounds rearranged themselves, as if the park were turning a page.',
    cliffhanger: 'At the top of the hour, the sounds stopped all at once.',
    createdAt: '2026-10-10T16:30:00.000Z',
    modelUsed: 'qwen3:4b',
  },
];

const text = buildJournalText(entries, chapters);
console.log(text);