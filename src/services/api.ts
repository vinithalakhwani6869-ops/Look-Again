import { WalkPack, EnvironmentType, FocusType, CheckResult, OllamaHealthStatus } from '../types';

export async function checkOllamaHealth(): Promise<OllamaHealthStatus> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) {
      return {
        status: 'unavailable',
        ollamaUrl: 'http://localhost:11434',
        targetModel: 'qwen3:4b',
        modelAvailable: false,
        installedModels: [],
        message: `Health check failed with status ${res.status}`,
      };
    }
    return await res.json();
  } catch (err: any) {
    return {
      status: 'unavailable',
      ollamaUrl: 'http://localhost:11434',
      targetModel: 'qwen3:4b',
      modelAvailable: false,
      installedModels: [],
      message: 'Failed to connect to backend server',
    };
  }
}

export async function generateAIPack(
  durationMinutes: number,
  environment: EnvironmentType,
  focus: FocusType,
  recentHistory?: Array<{ category?: string }>
): Promise<{ pack: WalkPack }> {
  const res = await fetch('/api/pack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      durationMinutes,
      environment,
      focus,
      recentHistory,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate pack with AI');
  }

  return data;
}

export async function generateAISummary(params: {
  pack: WalkPack;
  recallFreeText: string;
  checkResults: CheckResult[];
  surpriseNote?: string;
  reflections?: Record<string, string>;
  pastTendenciesSummary?: string;
}): Promise<{
  journalText: string;
  tendencyNote: string;
  suggestedNextFocus?: FocusType;
  generatedWith?: string;
  generatedAt: string;
}> {
  const res = await fetch('/api/summary', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to generate summary with AI');
  }

  return data.summary;
}
