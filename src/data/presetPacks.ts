import { WalkPack, EnvironmentType, FocusType } from '../types';

export const PRESET_PACKS: WalkPack[] = [
  {
    id: 'preset-street-above',
    title: 'The Roofline Skyline',
    lookPrompt: 'Look only above head height at rooflines, wires, window arches, and whatever cuts across the sky.',
    durationMinutes: 10,
    category: 'street:above',
    environment: 'street',
    focus: 'above',
    checkQuestions: [
      'What is the highest man-made object currently in your field of view?',
      'Are the electrical wires in front of you running parallel or intersecting overhead?',
      'What material or color is the closest roof gutter or trim above you?',
      'Did you notice any antennas, chimneys, or rooftop vents along the nearest roofline?',
    ],
    reflectionQuestions: [
      'What architectural detail had you walked under dozens of times without noticing?',
      'How does the street feel when your gaze stays above eye level instead of on the pavement?',
    ],
    isPreset: true,
    generatedAt: '2026-01-01T00:00:00.000Z',
    modelUsed: 'Preset library (curated)',
  },
  {
    id: 'preset-park-sounds',
    title: 'The Acoustic Perimeter',
    lookPrompt: 'Walk slowly with relaxed eyes, tuning your attention entirely to the layers of sound reaching you from near and far.',
    durationMinutes: 10,
    category: 'park:sounds',
    environment: 'park',
    focus: 'sounds',
    checkQuestions: [
      'From which cardinal direction (or landmark) came the single most continuous low hum?',
      'Were tree leaves rustling continuously, in intermittent gusts, or almost silent?',
      'Can you identify the physical surface that the closest footsteps or gravel crunches came from?',
      'What was the highest-pitched natural sound you detected during the walk?',
    ],
    reflectionQuestions: [
      'Which sound was easiest to locate in physical space, and which was diffuse?',
      'Did the ambient soundscape feel busier or calmer once you stopped to isolate it?',
    ],
    isPreset: true,
    generatedAt: '2026-01-01T00:00:00.000Z',
    modelUsed: 'Preset library (curated)',
  },
  {
    id: 'preset-general-light',
    title: 'Angles of Cast Shadow',
    lookPrompt: 'Trace the edges where direct light meets cast shadow across walls, ground, and tree trunks.',
    durationMinutes: 5,
    category: 'general:light',
    environment: 'general',
    focus: 'light',
    checkQuestions: [
      'Which direction were the longest shadows pointing relative to where you stood?',
      'Were the edges of cast shadows on the ground crisp and sharp, or diffuse and soft?',
      'What is the brightest reflective surface currently catching ambient light within 20 paces?',
      'Did you stand in full sunlight, dappled shade, or even overcast shadow?',
    ],
    reflectionQuestions: [
      'How has the light changed the colors of ordinary surfaces around you?',
      'Where was the most unexpected pocket of deep shadow hiding?',
    ],
    isPreset: true,
    generatedAt: '2026-01-01T00:00:00.000Z',
    modelUsed: 'Preset library (curated)',
  },
  {
    id: 'preset-campus-patterns',
    title: 'Repeated Joint & Paver Rythms',
    lookPrompt: 'Observe the repetitions, grids, joints, and recurring spacings built into the paths and structures around you.',
    durationMinutes: 10,
    category: 'campus:patterns',
    environment: 'campus',
    focus: 'patterns',
    checkQuestions: [
      'What geometric pattern do the paving stones or concrete seams beneath you form?',
      'How many vertical poles, pillars, or bollards stand in the immediate line of sight?',
      'Are the window panes on the closest building grouped in pairs, grids, or single sheets?',
      'What repeating texture or color reappears on at least two separate structures nearby?',
    ],
    reflectionQuestions: [
      'Which deliberate design pattern in this space seemed unnoticed by everyday passersby?',
      'Did noticing repeated lines make the open space feel larger or more ordered?',
    ],
    isPreset: true,
    generatedAt: '2026-01-01T00:00:00.000Z',
    modelUsed: 'Preset library (curated)',
  },
  {
    id: 'preset-balcony-periphery',
    title: 'The Edge of Your Field of View',
    lookPrompt: 'Keep your gaze fixed straight ahead while resting your attention on what flickers at the extreme left, right, and behind you.',
    durationMinutes: 5,
    category: 'balcony:periphery',
    environment: 'balcony',
    focus: 'periphery',
    checkQuestions: [
      'What object is located directly behind your left shoulder without turning around?',
      'What is the furthest horizontal boundary visible on the extreme right side of your view?',
      'What color is the wall, railing, or partition immediately behind your back?',
      'Did anything move in your peripheral field without you directly turning your eyes toward it?',
    ],
    reflectionQuestions: [
      'How challenging was it to keep your center of vision still while noticing edges?',
      'What was the most surprising detail lying right outside your usual tunnel of focus?',
    ],
    isPreset: true,
    generatedAt: '2026-01-01T00:00:00.000Z',
    modelUsed: 'Preset library (curated)',
  },
  {
    id: 'preset-street-movement',
    title: 'Drift, Sway, and Transit',
    lookPrompt: 'Track only non-human motion: swaying branches, windblown debris, ripples, and drifting clouds or vapor.',
    durationMinutes: 10,
    category: 'street:movement',
    environment: 'street',
    focus: 'movement',
    checkQuestions: [
      'Which natural object moved the fastest during your observation window?',
      'Were tree tops swaying in rhythm with ground-level shrubs or moving independently?',
      'In which compass direction did the air currents carry fallen leaves or dust?',
      'Was there any continuous mechanical vibration or hum felt or seen in nearby signs or poles?',
    ],
    reflectionQuestions: [
      'How much unintentional movement is happening around us even when the street feels quiet?',
      'What subtle motion caught your eye that you normally dismiss as background noise?',
    ],
    isPreset: true,
    generatedAt: '2026-01-01T00:00:00.000Z',
    modelUsed: 'Preset library (curated)',
  },
  {
    id: 'preset-park-details',
    title: 'Micro-Topography at Ground Level',
    lookPrompt: 'Direct your gaze downward to the six inches above the ground, noticing cracks, moss, pebbles, and subtle grade changes.',
    durationMinutes: 15,
    category: 'park:details',
    environment: 'park',
    focus: 'details',
    checkQuestions: [
      'What is the dominant non-living material resting directly at your feet?',
      'Did you notice any gradual slope or depression in the ground surface under your stride?',
      'How many different ground textures (e.g. soil, packed gravel, grass, mulch, asphalt) did you cross?',
      'What was the smallest distinct contrast in color on the ground within arm’s length?',
    ],
    reflectionQuestions: [
      'What micro-features showed signs of weathering, rain runoff, or foot traffic?',
      'How does slowing down your gaze to the ground change your pacing?',
    ],
    isPreset: true,
    generatedAt: '2026-01-01T00:00:00.000Z',
    modelUsed: 'Preset library (curated)',
  },
  {
    id: 'preset-general-surprise',
    title: 'The Unintentional Assemblage',
    lookPrompt: 'Notice objects, textures, and angles that were placed by different people at different times yet form a curious composition.',
    durationMinutes: 10,
    category: 'general:surprise',
    environment: 'general',
    focus: 'surprise',
    checkQuestions: [
      'What is the oldest-looking man-made surface currently visible from your position?',
      'What two objects of contrasting materials (like metal and bark, or glass and stone) touch each other?',
      'What is directly behind you right now at eye level?',
      'What is the most faded painted color on any surface nearby?',
    ],
    reflectionQuestions: [
      'What detail felt entirely accidental yet striking when examined alone?',
      'Did you find yourself guessing how long that specific arrangement had been there?',
    ],
    isPreset: true,
    generatedAt: '2026-01-01T00:00:00.000Z',
    modelUsed: 'Preset library (curated)',
  },
  {
    id: 'preset-balcony-above',
    title: 'Overhead Canopy and Cloud Layer',
    lookPrompt: 'Look steadily toward the open sky and highest perches without glancing down at street level.',
    durationMinutes: 5,
    category: 'balcony:above',
    environment: 'balcony',
    focus: 'above',
    checkQuestions: [
      'What percentage of the sky visible from your viewpoint has cloud cover versus clear blue or grey?',
      'What is the highest architectural element or mast visible along the horizon?',
      'Are there birds or aircraft crossing the upper airspace in any visible direction?',
      'Which side of the overhead sky is visibly brighter or more saturated right now?',
    ],
    reflectionQuestions: [
      'How does resting your eyes on distant clouds or sky heights affect your depth of field?',
      'What subtle gradient of color in the sky had you not realized was present?',
    ],
    isPreset: true,
    generatedAt: '2026-01-01T00:00:00.000Z',
    modelUsed: 'Preset library (curated)',
  },
  {
    id: 'preset-campus-sounds',
    title: 'Architectural Echoes & Breezeways',
    lookPrompt: 'Notice how sounds reflect, muffle, or amplify between solid walls, covered walkways, and open courtyards.',
    durationMinutes: 15,
    category: 'campus:sounds',
    environment: 'campus',
    focus: 'sounds',
    checkQuestions: [
      'Where did footsteps or door closures create the most distinct acoustic echo?',
      'Can you locate the nearest mechanical hum (like ventilation vents or air handlers)?',
      'Was speech muffled by architecture, or did it carry clearly across long distances?',
      'How many quiet pauses with zero artificial noise occurred during your walk?',
    ],
    reflectionQuestions: [
      'Which surface seemed to bounce sound the hardest, and which absorbed it?',
      'How did moving between covered arches and open sky shift your acoustic awareness?',
    ],
    isPreset: true,
    generatedAt: '2026-01-01T00:00:00.000Z',
    modelUsed: 'Preset library (curated)',
  }
];

export function findMatchingPreset(
  environment: EnvironmentType,
  focus: FocusType,
  durationMinutes: number
): WalkPack {
  // Try exact environment + focus match
  let match = PRESET_PACKS.find(
    (p) => p.environment === environment && p.focus === focus
  );

  // If not found, match by focus
  if (!match) {
    match = PRESET_PACKS.find((p) => p.focus === focus);
  }

  // If not found, match by environment
  if (!match) {
    match = PRESET_PACKS.find((p) => p.environment === environment);
  }

  // Fallback to first
  if (!match) {
    match = PRESET_PACKS[0];
  }

  // Clone with requested duration
  return {
    ...match,
    id: `preset-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    durationMinutes,
    isPreset: true,
    generatedAt: new Date().toISOString(),
  };
}
