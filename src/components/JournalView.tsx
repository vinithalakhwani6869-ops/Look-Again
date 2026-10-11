import React, { useState } from 'react';
import { motion } from 'motion/react';
import { JournalEntry, StoryState } from '../types';
import { 
  BookOpen, Trash2, Edit3, ArrowLeft, Download, 
  Search, Sparkles, Check, Calendar, Clock, Share2, Save,
  Feather, RefreshCw, Loader2, WifiOff
} from 'lucide-react';
import { buildJournalText } from '../services/storage';
import { FocusFilterDropdown, FocusOption } from './FocusFilterDropdown';
import { DeleteConfirmModal } from './DeleteConfirmModal';

const FOCUS_OPTIONS: FocusOption[] = [
  { value: 'all', label: 'All Focuses' },
  { value: 'surprise', label: 'Surprise' },
  { value: 'sounds', label: 'Sounds' },
  { value: 'patterns', label: 'Patterns' },
  { value: 'movement', label: 'Movement' },
  { value: 'light', label: 'Light & Shadow' },
  { value: 'above', label: 'Above Eye Level' },
  { value: 'periphery', label: 'Periphery' },
  { value: 'details', label: 'Small Details' },
];

interface JournalViewProps {
  entries: JournalEntry[];
  story: StoryState;
  onBack: () => void;
  onUpdateEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
  onDeleteAllEntries: () => void;
  onStartNewWalk: () => void;
  onRetryChapter: (entryId: string) => void;
}

export const JournalView: React.FC<JournalViewProps> = ({
  entries,
  story,
  onBack,
  onUpdateEntry,
  onDeleteEntry,
  onDeleteAllEntries,
  onStartNewWalk,
  onRetryChapter,
}) => {
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterFocus, setFilterFocus] = useState<string>('all');
  const [isEditing, setIsEditing] = useState(false);

  const [editFreeRecall, setEditFreeRecall] = useState('');
  const [editSurpriseNote, setEditSurpriseNote] = useState('');

  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  const selectedEntry = entries.find((e) => e.id === selectedEntryId) || null;

  const orderedChapters = [...story.chapters].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const pendingStoryItems = story.queue;

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      searchQuery === '' ||
      entry.pack.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.pack.lookPrompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.recallFreeText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.aiSummary?.journalText || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFocus = filterFocus === 'all' || entry.focus === filterFocus;

    return matchesSearch && matchesFocus;
  });

  const handleSelectEntry = (entry: JournalEntry) => {
    setSelectedEntryId(entry.id);
    setIsEditing(false);
    setEditFreeRecall(entry.recallFreeText || '');
    setEditSurpriseNote(entry.surpriseNote || '');
  };

  const handleSaveEdit = () => {
    if (!selectedEntry) return;
    const updated: JournalEntry = {
      ...selectedEntry,
      recallFreeText: editFreeRecall,
      surpriseNote: editSurpriseNote,
    };
    onUpdateEntry(updated);
    setIsEditing(false);
  };

  const handleExportText = () => {
    const text = buildJournalText(entries, story.chapters);
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    a.href = url;
    a.download = `look-again-field-journal-${date}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyMarkdown = (entry: JournalEntry) => {
    const md = `# ${entry.pack.title}
*Date: ${new Date(entry.createdAt).toLocaleDateString()} | Duration: ${entry.durationMinutes} min | ${entry.environment} • ${entry.focus}*

**Mission:** "${entry.pack.lookPrompt}"

## Field Observations
${entry.recallFreeText ? `> ${entry.recallFreeText}\n` : ''}
${entry.aiSummary?.journalText ? `**Synthesis:**\n${entry.aiSummary.journalText}\n` : ''}
${entry.aiSummary?.tendencyNote ? `**Tendencies Note:**\n${entry.aiSummary.tendencyNote}\n` : ''}

## Memory vs. Reality Checks
${entry.checkResults.map((r, i) => `${i + 1}. **${r.question}**
   - Recalled: "${r.answer || 'None'}"
   - Verdict: ${r.verdict.toUpperCase()}
   - Actual: "${r.actualSeen || 'Noted'}"`).join('\n\n')}

${entry.surpriseNote ? `\n**Surprise:** "${entry.surpriseNote}"` : ''}
`;

    navigator.clipboard.writeText(md);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-4 sm:py-8 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportText}
            disabled={entries.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-white/80 text-xs hover:bg-white/15 transition-all cursor-pointer disabled:opacity-40 backdrop-blur-md"
            title="Export a readable .txt copy of this journal"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {entries.length > 0 && (
            <button
              onClick={() => setShowDeleteAllModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 text-white/80 text-xs hover:bg-white/15 transition-all cursor-pointer backdrop-blur-md"
              title="Delete all data"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear All</span>
            </button>
          )}
        </div>
      </div>

      {/* Copied notification toast */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-white text-black font-semibold text-xs shadow-2xl flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-black" />
          <span>Copied Markdown to clipboard</span>
        </div>
      )}

      {/* Title & Stats */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-4xl font-normal text-white">
          Private Field Journal
        </h1>
        <p className="text-xs sm:text-sm text-white/60 mt-1 font-light">
          {entries.length === 1
            ? '1 recorded observation walk stored on this device'
            : `${entries.length} recorded observation walks stored on this device`}
        </p>
      </div>

      {/* Story so far — only appears once at least one chapter exists */}
      {!selectedEntry && orderedChapters.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-white/60">
            <Feather className="w-3.5 h-3.5 text-white/70" />
            Story so far
          </div>
          <p className="text-[11px] text-white/45 mt-1 mb-2 font-light">Fiction inspired by your walk</p>

          <div className="divide-y divide-white/10">
            {orderedChapters.map((ch, i) => (
              <details key={ch.id} className="group py-3.5">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-3">
                  <span className="text-sm text-white/90 font-medium">
                    <span className="font-mono text-white/40 mr-2">{i + 1}.</span>
                    {ch.title}
                  </span>
                  <span className="text-[10px] font-mono text-white/40 shrink-0">
                    {new Date(ch.createdAt).toLocaleDateString()}
                  </span>
                </summary>
                <p className="mt-3 text-sm text-white/80 leading-relaxed whitespace-pre-line font-light">
                  {ch.chapter}
                </p>
                <p className="mt-2 text-sm text-white/65 italic border-l-2 border-white/20 pl-3">
                  {ch.cliffhanger}
                </p>
              </details>
            ))}

            {pendingStoryItems.map((item) => (
              <div
                key={item.entryId}
                className="py-3.5 flex items-start gap-3"
              >
                {item.offline || item.status === 'error' ? (
                  <WifiOff className="w-4 h-4 mt-0.5 shrink-0 text-white/60" />
                ) : (
                  <Loader2 className="w-4 h-4 mt-0.5 shrink-0 text-white/60 motion-safe:animate-spin" />
                )}
                <div>
                  <p className="text-sm text-white/80 font-light">
                    {item.offline
                      ? 'A chapter is waiting for the local AI.'
                      : item.status === 'error'
                      ? item.error || 'A chapter could not be written.'
                      : 'Writing your next chapter…'}
                  </p>
                  {(item.offline || item.status === 'error') && (
                    <button
                      type="button"
                      onClick={() => onRetryChapter(item.entryId)}
                      className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black text-[11px] font-semibold hover:bg-white/90 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Retry
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detail View of Selected Entry */}
      {selectedEntry ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="liquid-glass rounded-3xl p-6 sm:p-10 border border-white/15 backdrop-blur-2xl shadow-2xl space-y-6"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <button
              onClick={() => setSelectedEntryId(null)}
              className="inline-flex items-center gap-2 text-xs text-white/60 hover:text-white cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to all entries</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyMarkdown(selectedEntry)}
                className="p-2 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/15 text-xs transition-all cursor-pointer backdrop-blur-md"
                title="Copy as Markdown"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/15 text-xs transition-all cursor-pointer backdrop-blur-md"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit notes</span>
                </button>
              ) : (
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-black font-semibold text-xs hover:bg-white/90 transition-all cursor-pointer shadow-lg"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save changes</span>
                </button>
              )}

              <button
                onClick={() => setDeleteTargetId(selectedEntry.id)}
                className="p-2 rounded-xl border border-white/15 bg-white/5 text-white/80 hover:bg-white/15 text-xs transition-all cursor-pointer backdrop-blur-md"
                title="Delete this entry"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Entry Title & Meta */}
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-white/50 mb-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date(selectedEntry.createdAt).toLocaleDateString(undefined, {
                  weekday: 'short',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              <span>•</span>
              <Clock className="w-3.5 h-3.5" />
              <span>{selectedEntry.durationMinutes} min</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-normal text-white">
              {selectedEntry.pack.title}
            </h2>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="px-3 py-0.5 rounded-full bg-white/10 text-white text-xs capitalize font-medium backdrop-blur-md">
                {selectedEntry.environment} • {selectedEntry.focus}
              </span>
              {selectedEntry.pack.isPreset ? (
                <span className="text-[11px] text-white/50">Preset mission</span>
              ) : (
                <span className="text-[11px] font-mono text-white/60">
                  AI: {selectedEntry.pack.modelUsed || 'qwen3:4b'}
                </span>
              )}
            </div>
          </div>

          {/* Observation Mission Prompt */}
          <div className="pt-1">
            <div className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1.5">
              Observation Prompt
            </div>
            <p className="text-sm sm:text-base italic text-white/90 font-light border-l-2 border-white/15 pl-3">
              "{selectedEntry.pack.lookPrompt}"
            </p>
          </div>

          {/* AI Field Journal Narrative */}
          {selectedEntry.aiSummary && (
            <div className="space-y-5 border-t border-white/10 pt-5">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-2 flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-white/70" />
                  Field Journal Synthesis
                </div>
                <p className="text-sm text-white/90 leading-relaxed font-light">
                  {selectedEntry.aiSummary.journalText}
                </p>
              </div>

              {/* Tendencies Note */}
              <div className="border-t border-white/10 pt-4">
                <div className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-1.5 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-white/70" />
                  Tendencies Observation (Qualitative, no scores)
                </div>
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed font-light">
                  {selectedEntry.aiSummary.tendencyNote}
                </p>
                {selectedEntry.aiSummary.suggestedNextFocus && (
                  <div className="text-xs text-white/70 font-medium mt-3">
                    Recommended next focus: <strong className="capitalize text-white">{selectedEntry.aiSummary.suggestedNextFocus}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Free Recall Note */}
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-2">
              Immediate Free Recall
            </div>
            {isEditing ? (
              <textarea
                value={editFreeRecall}
                onChange={(e) => setEditFreeRecall(e.target.value)}
                rows={2}
                className="w-full text-xs sm:text-sm p-3.5 rounded-2xl bg-white/5 border border-white/15 focus:border-white focus:outline-hidden text-white backdrop-blur-md"
              />
            ) : (
              <p className="text-xs sm:text-sm text-white/80 italic font-light whitespace-pre-line">
                {selectedEntry.recallFreeText || 'No initial free recall recorded.'}
              </p>
            )}
          </div>

          {/* Memory Checks & Verdicts */}
          <div className="border-t border-white/10 pt-1">
            <div className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-1.5">
              Memory Checks & Reality
            </div>
            <div className="divide-y divide-white/10">
              {selectedEntry.checkResults.map((r, idx) => (
                <div
                  key={idx}
                  className="text-xs py-3.5 flex flex-col gap-1.5"
                >
                  <div className="font-medium text-white">
                    <span className="font-mono text-white/40 mr-2">{idx + 1}.</span>
                    {r.question}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-white/70 mt-0.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-lg font-semibold text-[10px] ${
                        r.verdict === 'right'
                          ? 'bg-white text-black border border-white'
                          : r.verdict === 'wrong'
                          ? 'bg-transparent text-white border border-white/60'
                          : 'bg-transparent text-white border border-dashed border-white/50'
                      }`}
                    >
                      {r.verdict === 'right' ? 'Right' : r.verdict === 'wrong' ? 'Wrong' : 'Never noticed'}
                    </span>
                    <span>Recalled: "{r.answer || 'Blank'}"</span>
                    {r.actualSeen && (
                      <span className="text-white font-medium">• Reality: "{r.actualSeen}"</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Surprise Note */}
          <div className="border-t border-white/10 pt-5">
            <div className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-2">
              One Thing That Surprised Me
            </div>
            {isEditing ? (
              <input
                type="text"
                value={editSurpriseNote}
                onChange={(e) => setEditSurpriseNote(e.target.value)}
                className="w-full text-xs sm:text-sm p-3.5 rounded-2xl bg-white/5 border border-white/15 focus:border-white focus:outline-hidden text-white backdrop-blur-md"
              />
            ) : (
              <p className="text-xs sm:text-sm text-white/80 font-light whitespace-pre-line">
                {selectedEntry.surpriseNote || 'None recorded'}
              </p>
            )}
          </div>

          {/* Echo: next-day memory test, saved on this walk */}
          {selectedEntry.echo && (
            <div className="border-t border-white/10 pt-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-white/60 mb-3 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-white/70" />
                Echo • next-day memory
              </div>

              {selectedEntry.echo.skipped ? (
                <p className="text-xs sm:text-sm text-white/70 font-light">
                  This Echo was skipped.
                </p>
              ) : (
                <div className="space-y-4">
                  <p className="text-[11px] font-mono text-white/45">
                    Recorded {new Date(selectedEntry.echo.completedAt).toLocaleString()}
                  </p>
                  {selectedEntry.echo.answer && (
                    <div className="border-t border-white/10 pt-3">
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-1">
                        What came back
                      </div>
                      <p className="text-xs sm:text-sm text-white/85 whitespace-pre-line font-light">
                        {selectedEntry.echo.answer}
                      </p>
                    </div>
                  )}

                  {selectedEntry.echo.result && (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/10 pt-3">
                        <div className="py-1">
                          <div className="text-[10px] font-semibold uppercase tracking-widest text-white/80 mb-2">
                            Still with you
                          </div>
                          {selectedEntry.echo.result.stillWithYou.length === 0 ? (
                            <p className="text-xs text-white/40 font-light">Nothing here.</p>
                          ) : (
                            <ul className="space-y-1.5">
                              {selectedEntry.echo.result.stillWithYou.map((it, i) => (
                                <li key={i} className="text-xs text-white/85 font-light">— {it}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="py-1">
                          <div className="text-[10px] font-semibold uppercase tracking-widest text-white/50 mb-2">
                            Faded
                          </div>
                          {selectedEntry.echo.result.faded.length === 0 ? (
                            <p className="text-xs text-white/40 font-light">Nothing here.</p>
                          ) : (
                            <ul className="space-y-1.5">
                              {selectedEntry.echo.result.faded.map((it, i) => (
                                <li key={i} className="text-xs text-white/85 font-light">— {it}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="py-1">
                          <div className="text-[10px] font-semibold uppercase tracking-widest text-white/70 mb-2">
                            Only came back now
                          </div>
                          {selectedEntry.echo.result.onlyCameBackNow.length === 0 ? (
                            <p className="text-xs text-white/40 font-light">Nothing here.</p>
                          ) : (
                            <ul className="space-y-1.5">
                              {selectedEntry.echo.result.onlyCameBackNow.map((it, i) => (
                                <li key={i} className="text-xs text-white/85 font-light">— {it}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                      {selectedEntry.echo.result.note && (
                        <p className="text-xs sm:text-sm text-white/80 leading-relaxed font-light">
                          {selectedEntry.echo.result.note}
                        </p>
                      )}
                      {selectedEntry.echo.result.manual && (
                        <p className="text-[11px] text-white/45 font-light">
                          Sorted by hand — the local model was unavailable.
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      ) : (
        /* List of Entries */
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search journal entries..."
                className="w-full text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-2xl bg-white/5 border border-white/15 focus:border-white focus:outline-hidden text-white placeholder:text-white/30 backdrop-blur-md"
              />
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <FocusFilterDropdown
                value={filterFocus}
                options={FOCUS_OPTIONS}
                onChange={setFilterFocus}
                ariaLabel="Filter journal entries by focus"
              />
            </div>
          </div>

          {/* Empty State */}
          {entries.length === 0 ? (
            <div className="liquid-glass rounded-3xl p-10 text-center flex flex-col items-center gap-4 border border-white/15 backdrop-blur-2xl">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center backdrop-blur-md">
                <BookOpen className="w-6 h-6 text-white/80" />
              </div>
              <h3 className="text-xl font-normal text-white">
                Your field journal is empty
              </h3>
              <p className="text-xs text-white/60 max-w-sm leading-relaxed font-light">
                Take a 5, 10, or 15-minute observation walk. Put your phone away, test what you remember, and your private field notes will appear here.
              </p>
              <button
                onClick={onStartNewWalk}
                className="mt-2 px-6 py-3 rounded-2xl bg-white text-black text-xs font-semibold hover:bg-white/90 active:scale-95 transition-all shadow-xl cursor-pointer"
              >
                Begin your first walk
              </button>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="liquid-glass rounded-2xl p-8 text-center text-xs text-white/60 border border-white/10 backdrop-blur-md font-light">
              No entries matched your search criteria.
            </div>
          ) : (
            <div className="divide-y divide-white/10 border-b border-white/10">
              {filteredEntries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => handleSelectEntry(entry)}
                  className="py-5 cursor-pointer group transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-[11px] font-mono text-white/50 mb-1">
                        <span>
                          {new Date(entry.createdAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                        <span>•</span>
                        <span>{entry.durationMinutes} min</span>
                        <span>•</span>
                        <span className="capitalize">{entry.environment}</span>
                      </div>

                      <h3 className="text-lg font-medium text-white/90 group-hover:text-white transition-colors">
                        {entry.pack.title}
                      </h3>

                      <p className="text-xs text-white/60 mt-1 line-clamp-1 italic font-light">
                        "{entry.pack.lookPrompt}"
                      </p>

                      {entry.aiSummary?.journalText && (
                        <p className="text-xs text-white/80 mt-2 line-clamp-2 font-light">
                          {entry.aiSummary.journalText}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <span className="px-3 py-1 rounded-full bg-white/10 text-white/90 text-[11px] font-medium capitalize backdrop-blur-md">
                        {entry.focus}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTargetId(entry.id);
                        }}
                        className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Delete Single Entry Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deleteTargetId)}
        title="Delete Field Journal Entry?"
        message="This will permanently remove this observation record from your local device storage. This action cannot be undone."
        confirmLabel="Delete Entry"
        onConfirm={() => {
          if (deleteTargetId) {
            onDeleteEntry(deleteTargetId);
            if (selectedEntryId === deleteTargetId) {
              setSelectedEntryId(null);
            }
            setDeleteTargetId(null);
          }
        }}
        onCancel={() => setDeleteTargetId(null)}
      />

      {/* Delete All Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={showDeleteAllModal}
        title="Delete All Field Journal Data?"
        message="Are you sure you want to erase all observation walk records and tendencies history? All data is stored purely in this browser and will be irreversibly erased."
        confirmLabel="Erase All Data"
        onConfirm={() => {
          onDeleteAllEntries();
          setShowDeleteAllModal(false);
          setSelectedEntryId(null);
        }}
        onCancel={() => setShowDeleteAllModal(false)}
      />
    </div>
  );
};
