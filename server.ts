import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:4b';

// Exact model-name matching that understands Ollama's implicit ":latest" tag.
// e.g. configured "qwen3:4b" matches only "qwen3:4b";
//      configured "qwen3" matches "qwen3:latest".
function matchesModelName(target: string, installed: string): boolean {
  if (target === installed) return true;
  const targetTagged = target.includes(':') ? target : `${target}:latest`;
  return targetTagged === installed;
}

app.use(express.json({ limit: '2mb' }));

// Health check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return res.json({
        status: 'unavailable',
        ollamaUrl: OLLAMA_URL,
        targetModel: OLLAMA_MODEL,
        modelAvailable: false,
        installedModels: [],
        message: `Ollama replied with status ${response.status}`,
        responseTimeMs: Date.now() - startTime,
      });
    }

    const data = await response.json() as { models?: Array<{ name: string }> };
    const installedModels = (data.models || []).map((m) => m.name);
    const modelAvailable = installedModels.some((m) => matchesModelName(OLLAMA_MODEL, m));

    return res.json({
      status: 'ok',
      ollamaUrl: OLLAMA_URL,
      targetModel: OLLAMA_MODEL,
      modelAvailable,
      installedModels,
      message: modelAvailable
        ? `Connected to Ollama. Model ${OLLAMA_MODEL} is ready.`
        : `Connected to Ollama, but model '${OLLAMA_MODEL}' was not found in installed models. Run 'ollama run ${OLLAMA_MODEL}'.`,
      responseTimeMs: Date.now() - startTime,
    });
  } catch (err: any) {
    const isConnRefused = err.cause?.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED');
    return res.json({
      status: 'unavailable',
      ollamaUrl: OLLAMA_URL,
      targetModel: OLLAMA_MODEL,
      modelAvailable: false,
      installedModels: [],
      message: isConnRefused
        ? `Ollama is not running at ${OLLAMA_URL}. Start it with 'ollama run ${OLLAMA_MODEL}'.`
        : `Could not reach Ollama: ${err.message || 'Connection failed'}`,
      responseTimeMs: Date.now() - startTime,
    });
  }
});

// JSON Schema for Walk Pack
const packJsonSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    lookPrompt: { type: 'string' },
    durationMinutes: { type: 'integer' },
    category: { type: 'string' },
    checkQuestions: {
      type: 'array',
      items: { type: 'string' },
      minItems: 4,
      maxItems: 5,
    },
    reflectionQuestions: {
      type: 'array',
      items: { type: 'string' },
      minItems: 2,
      maxItems: 3,
    },
  },
  required: [
    'title',
    'lookPrompt',
    'durationMinutes',
    'category',
    'checkQuestions',
    'reflectionQuestions',
  ],
};

// JSON Schema for Summary & Tendencies
const summaryJsonSchema = {
  type: 'object',
  properties: {
    journalText: { type: 'string' },
    tendencyNote: { type: 'string' },
    suggestedNextFocus: { type: 'string' },
  },
  required: ['journalText', 'tendencyNote', 'suggestedNextFocus'],
};

// Safety validator for Walk Pack
function validatePackSafety(pack: any): { valid: boolean; reason?: string } {
  if (!pack || typeof pack !== 'object') return { valid: false, reason: 'Invalid pack format' };
  
  const textCorpus = [
    pack.title || '',
    pack.lookPrompt || '',
    ...(pack.checkQuestions || []),
  ].join(' ').toLowerCase();

  const unsafeTerms = [
    'people', 'person', 'stranger', 'watch them', 'follow', 'face', 'stare',
    'private property', 'trespass', 'climb', 'touch plant', 'touch berry', 'eat',
    'touch mushroom', 'touch insect', 'wildlife', 'approach animal', 'danger',
    'photograph', 'take picture', 'record video', 'identify species', 'latin name'
  ];

  for (const term of unsafeTerms) {
    if (textCorpus.includes(term)) {
      return { valid: false, reason: `Safety violation: prompt referenced restricted observation "${term}"` };
    }
  }

  if (!Array.isArray(pack.checkQuestions) || pack.checkQuestions.length < 3) {
    return { valid: false, reason: 'Pack must contain at least 4 check questions' };
  }

  return { valid: true };
}

// POST /api/pack
app.post('/api/pack', async (req: Request, res: Response) => {
  const { durationMinutes = 10, environment = 'general', focus = 'surprise', recentHistory = [] } = req.body;

  const validEnvironments = ['street', 'park', 'campus', 'balcony', 'general'];
  const validFocuses = ['surprise', 'sounds', 'patterns', 'movement', 'light', 'above', 'periphery', 'details'];

  const envClean = validEnvironments.includes(environment) ? environment : 'general';
  const focusClean = validFocuses.includes(focus) ? focus : 'surprise';
  const durationClean = [5, 10, 15].includes(durationMinutes) ? durationMinutes : 10;

  const recentCategories = (recentHistory as Array<{ category?: string }>)
    .slice(-4)
    .map((h) => h.category)
    .filter(Boolean)
    .join(', ');

  const systemPrompt = `You are the core of "LOOK AGAIN", an outdoor attention companion for the "Touch Grass" philosophy.
Your goal is to give a human a subtle, grounded observation mission for a walk outside.
RULES:
1. Outdoors matters more than the screen. The phone stays in their pocket.
2. Foster curiosity about everyday surroundings. NO people-watching, stranger monitoring, facial expressions, or surveillance.
3. NO camera tasks, NO photo taking, NO species identification (e.g. do not ask for bird/tree/plant names).
4. NO unsafe actions: no trespassing, no touching unknown vegetation/fungi, no touching animals.
5. "lookPrompt" must be ONE concrete, inviting sentence guiding their attention (e.g. "Look only above head height at rooflines, wires, and tree canopies.").
6. "checkQuestions" MUST be 4 or 5 questions that:
   - Can be answered purely from short-term memory after walking.
   - Can be verified IMMEDIATELY and physically by simply turning around and looking again at the exact spot.
   - Examples of good questions: "What is the highest man-made object in view?", "How many distinct sounds did you hear?", "Which way were cast shadows falling?", "What color is directly behind your back?".
7. "reflectionQuestions": 2 thoughtful questions on what surprised them or what they usually overlook.
8. Output pure JSON matching the specified schema. Keep outputs concise.`;

  const userPrompt = `Generate a walk pack with:
- Environment: ${envClean}
- Focus: ${focusClean}
- Duration: ${durationClean} minutes
${recentCategories ? `- Recent user sessions covered: ${recentCategories}. Offer a distinct fresh perspective.` : ''}`;

  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const controller = new AbortController();
      // CPU-only execution timeout: 150 seconds
      const timeout = setTimeout(() => controller.abort(), 150000);

      const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          stream: false,
          think: false,
          options: {
            temperature: 0.3,
          },
          format: packJsonSchema,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Ollama responded with HTTP ${response.status}`);
      }

      const raw = await response.json() as { message?: { content?: string } };
      const content = raw.message?.content;
      if (!content) {
        throw new Error('Ollama returned empty response content');
      }

      const parsed = JSON.parse(content);
      const safety = validatePackSafety(parsed);

      if (!safety.valid) {
        if (attempts >= maxAttempts) {
          return res.status(422).json({
            error: safety.reason || 'Pack validation failed',
            code: 'SAFETY_VALIDATION_FAILED',
          });
        }
        continue;
      }

      const pack = {
        id: `pack-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: parsed.title || `${focusClean.toUpperCase()} Walk`,
        lookPrompt: parsed.lookPrompt,
        durationMinutes: durationClean,
        category: `${envClean}:${focusClean}`,
        environment: envClean,
        focus: focusClean,
        checkQuestions: parsed.checkQuestions.slice(0, 5),
        reflectionQuestions: (parsed.reflectionQuestions || []).slice(0, 3),
        isPreset: false,
        modelUsed: OLLAMA_MODEL,
        generatedAt: new Date().toISOString(),
      };

      return res.json({ pack });
    } catch (err: any) {
      if (attempts >= maxAttempts) {
        const isConnRefused = err.cause?.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED');
        const isTimeout = err.name === 'AbortError' || err.message?.includes('aborted');

        return res.status(503).json({
          error: isConnRefused
            ? `Cannot connect to Ollama at ${OLLAMA_URL}. Ensure Ollama is running ('ollama run ${OLLAMA_MODEL}').`
            : isTimeout
            ? `Ollama timed out while generating pack. CPU inference may be busy.`
            : `AI pack generation failed: ${err.message}`,
          code: isConnRefused ? 'OLLAMA_UNREACHABLE' : isTimeout ? 'TIMEOUT' : 'GENERATION_ERROR',
        });
      }
    }
  }
});

// POST /api/summary
app.post('/api/summary', async (req: Request, res: Response) => {
  const { pack, recallFreeText = '', checkResults = [], surpriseNote = '', reflections = {}, pastTendenciesSummary = '' } = req.body;

  if (!pack || !checkResults) {
    return res.status(400).json({ error: 'Missing pack or check results', code: 'INVALID_INPUT' });
  }

  const resultsSummary = checkResults.map((r: any, idx: number) => {
    return `Q${idx + 1}: "${r.question}"
User recalled: "${r.answer || 'Not recalled'}"
User verdict: ${r.verdict} (${r.verdict === 'right' ? 'Recall matched reality' : r.verdict === 'wrong' ? 'Recall did not match' : 'Did not notice until checked'})
What was actually there: "${r.actualSeen || 'Not specified'}"`;
  }).join('\n\n');

  const reflectionsSummary = Object.entries(reflections)
    .filter(([_, v]) => Boolean(v))
    .map(([k, v]) => `- ${k}: "${v}"`)
    .join('\n');

  const systemPrompt = `You are the field journal archivist for "LOOK AGAIN".
You turn a person's raw outdoor observation walk into a private, grounded, concise field-journal entry.
STRICT PRINCIPLES:
1. Use ONLY what the user reported. Preserve their exact wording and tone where possible.
2. NEVER invent details, scenery, weather, thoughts, or observations they did not explicitly state.
3. Zero scores, zero percentages, zero badges, zero gamification.
4. "tendencyNote": ONE gentle plain-language note about tendencies across this session and past sessions (e.g., "You consistently caught ambient sounds and ground textures, but rarely looked up above eye level").
5. "suggestedNextFocus": Recommend a focus gap to explore next time (choose one of: sounds, patterns, movement, light, above, periphery, details, surprise).
6. Return pure JSON matching the schema.`;

  const userPrompt = `Pack Title: ${pack.title}
Environment: ${pack.environment} | Focus: ${pack.focus} | Duration: ${pack.durationMinutes} min
Look Prompt: "${pack.lookPrompt}"

User's Free Recall at end of walk:
"${recallFreeText || 'None recorded'}"

Check Questions & Verification:
${resultsSummary}

Surprise Note:
"${surpriseNote || 'None recorded'}"

User Reflections:
${reflectionsSummary || 'None recorded'}

${pastTendenciesSummary ? `Past sessions tendency context: ${pastTendenciesSummary}` : ''}`;

  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    attempts++;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 150000);

      const response = await fetch(`${OLLAMA_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          stream: false,
          think: false,
          options: {
            temperature: 0.3,
          },
          format: summaryJsonSchema,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
      });
      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Ollama responded with HTTP ${response.status}`);
      }

      const raw = await response.json() as { message?: { content?: string } };
      const content = raw.message?.content;
      if (!content) {
        throw new Error('Ollama returned empty response');
      }

      const parsed = JSON.parse(content);

      return res.json({
        summary: {
          journalText: parsed.journalText || 'Walk completed. Observations recorded.',
          tendencyNote: parsed.tendencyNote || 'You took time to observe your surroundings.',
          suggestedNextFocus: parsed.suggestedNextFocus || 'surprise',
          generatedWith: OLLAMA_MODEL,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      if (attempts >= maxAttempts) {
        const isConnRefused = err.cause?.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED');
        return res.status(503).json({
          error: isConnRefused
            ? `Ollama is offline. Your walk data has been saved locally.`
            : `AI unpack summary generation failed: ${err.message}`,
          code: isConnRefused ? 'OLLAMA_UNREACHABLE' : 'SUMMARY_ERROR',
        });
      }
    }
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  // Bind to 0.0.0.0 so phones on local Wi-Fi can open the app
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LOOK AGAIN] Server listening on http://localhost:${PORT}`);
    console.log(`[LOOK AGAIN] Ollama target: ${OLLAMA_URL} (Model: ${OLLAMA_MODEL})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
