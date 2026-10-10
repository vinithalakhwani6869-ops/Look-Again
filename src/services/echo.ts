import { JournalEntry } from '../types';

export interface EchoCandidate {
  entry: JournalEntry;
  daysAgo: number;
}

function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

// Echo is offered for the most recent saved walk whose local calendar date is
// before today and which has no completed Echo yet. Demo mode pretends a day
// has passed so the most recent un-echoed walk becomes eligible immediately.
export function getEchoCandidate(entries: JournalEntry[], demoMode: boolean): EchoCandidate | null {
  const todayStart = startOfLocalDay(new Date());
  const todayKey = localDateKey(new Date());

  const eligible = entries.filter((entry) => {
    if (entry.echo?.completedAt) return false;
    const d = new Date(entry.createdAt);
    const beforeToday = localDateKey(d) !== todayKey && d.getTime() < todayStart;
    return beforeToday || demoMode;
  });

  if (eligible.length === 0) return null;

  const entry = [...eligible].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  const realDaysAgo = Math.max(
    0,
    Math.round((todayStart - startOfLocalDay(new Date(entry.createdAt))) / 86400000)
  );
  const daysAgo = demoMode ? Math.max(1, realDaysAgo) : realDaysAgo;

  return { entry, daysAgo };
}

export function formatEchoDayLabel(daysAgo: number): string {
  if (daysAgo <= 0) return 'from today';
  if (daysAgo === 1) return 'your walk yesterday';
  return `your walk ${daysAgo} days ago`;
}
