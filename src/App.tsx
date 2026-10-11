import React, { useState, useEffect, useSyncExternalStore } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { 
  AppScreen, WalkPack, JournalEntry, CheckResult, 
  OllamaHealthStatus, StoryState, EchoRecord 
} from './types';
import {
  getJournalEntries, saveJournalEntry, updateJournalEntry,
  deleteJournalEntry, deleteAllJournalEntries, getStoredActiveWalk,
  saveStoredActiveWalk, StoredActiveWalk, computePastTendenciesSummary,
  getDemoMode, setDemoMode, consumeStorageIssue, SaveJournalResult,
} from './services/storage';
import {
  subscribeStory, getStory, requestChapter, processQueue, retryChapter, clearStory,
} from './services/story';
import { getEchoCandidate } from './services/echo';
import { checkOllamaHealth } from './services/api';
import { Header } from './components/Header';
import { CinematicHome } from './components/CinematicHome';
import { PublicDemoNotice } from './components/PublicDemoNotice';
import { PackSetupView } from './components/PackSetupView';
import { PackReadyView } from './components/PackReadyView';
import { ActiveWalkView } from './components/ActiveWalkView';
import { RecallView } from './components/RecallView';
import { LookAgainView } from './components/LookAgainView';
import { ReflectView } from './components/ReflectView';
import { UnpackView } from './components/UnpackView';
import { PostSaveView } from './components/PostSaveView';
import { EchoView } from './components/EchoView';
import { JournalView } from './components/JournalView';
import { OllamaGuideModal } from './components/OllamaGuideModal';

// Compact dismissible banner for storage warnings (e.g. a save failed or
// corrupt data was backed up). Floating over every screen.
function StorageNotice({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[60] w-[calc(100%-1.5rem)] max-w-lg">
      <div className="flex items-start gap-3 rounded-2xl border border-amber-300/30 bg-black/85 backdrop-blur-xl p-3.5 text-white shadow-2xl">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300 mt-0.5" />
        <p className="text-[11px] sm:text-xs font-light leading-relaxed flex-1 text-white/85">{message}</p>
        <button
          onClick={onDismiss}
          aria-label="Dismiss notice"
          className="text-white/50 hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaHealthStatus | null>(null);
  const [isOllamaModalOpen, setIsOllamaModalOpen] = useState<boolean>(false);
  const [storageNotice, setStorageNotice] = useState<string | null>(null);

  // Field Stories state is stored on-device and shared through a tiny store.
  const story = useSyncExternalStore(subscribeStory, getStory, getStory);
  const [demoMode, setDemoModeState] = useState<boolean>(false);
  const [lastSavedEntryId, setLastSavedEntryId] = useState<string | null>(null);

  // Next-day Echo candidate (independent of Field Stories gating).
  const echoCandidate = getEchoCandidate(entries, demoMode);

  // Active Walk In-Progress State
  const [activePack, setActivePack] = useState<WalkPack | null>(null);
  const [activeEndTime, setActiveEndTime] = useState<number>(0);
  const [recallFreeText, setRecallFreeText] = useState<string>('');
  const [recalledAnswers, setRecalledAnswers] = useState<Record<number, string>>({});
  const [checkResults, setCheckResults] = useState<CheckResult[]>([]);
  const [surpriseNote, setSurpriseNote] = useState<string>('');
  const [reflections, setReflections] = useState<Record<string, string>>({});

  // Initial Load: Entries & Health & Restore Active Walk
  useEffect(() => {
    getJournalEntries().then((saved) => {
      setEntries(saved);
      // Surface any warning produced while reading (e.g. corrupt data that was
      // backed up) instead of silently starting from an empty journal.
      const issue = consumeStorageIssue();
      if (issue) setStorageNotice(issue);
    });

    setDemoModeState(getDemoMode());

    // Resume any chapter that was still pending before a page refresh.
    void processQueue();

    checkOllamaHealth().then((status) => {
      setOllamaStatus(status);
      // If the local model is now reachable, write any queued chapters.
      if (status.status === 'ok' && status.modelAvailable) {
        void processQueue();
      }
    });

    const stored = getStoredActiveWalk();
    if (stored && stored.pack) {
      setActivePack(stored.pack);
      setActiveEndTime(stored.targetEndTime);
      setRecallFreeText(stored.recallFreeText || '');
      setRecalledAnswers(stored.recalledAnswers || {});
      setCheckResults(stored.checkResults || []);
      setSurpriseNote(stored.surpriseNote || '');
      setReflections(stored.reflections || {});
      // Resume an in-progress walk on the correct screen (the Home screen no longer
      // hosts a resume banner, so restore the flow directly).
      setCurrentScreen(stored.step);
    }
  }, []);

  const syncWalkState = (step: StoredActiveWalk['step']) => {
    if (!activePack) return;
    saveStoredActiveWalk({
      pack: activePack,
      startTime: Date.now(),
      targetEndTime: activeEndTime,
      durationMinutes: activePack.durationMinutes,
      step,
      recallFreeText,
      recalledAnswers,
      checkResults,
      surpriseNote,
      reflections,
    });
  };

  const handlePackReady = (pack: WalkPack) => {
    setActivePack(pack);
    setCurrentScreen('pack_ready');
  };

  const handleStartWalk = () => {
    if (!activePack) return;
    const end = Date.now() + activePack.durationMinutes * 60 * 1000;
    setActiveEndTime(end);
    setRecallFreeText('');
    setRecalledAnswers({});
    setCheckResults([]);
    setSurpriseNote('');
    setReflections({});

    saveStoredActiveWalk({
      pack: activePack,
      startTime: Date.now(),
      targetEndTime: end,
      durationMinutes: activePack.durationMinutes,
      step: 'active_walk',
    });

    setCurrentScreen('active_walk');
  };

  const handleFinishWalk = () => {
    syncWalkState('recall');
    setCurrentScreen('recall');
  };

  const handleCancelWalk = () => {
    saveStoredActiveWalk(null);
    setActivePack(null);
    setCurrentScreen('home');
  };

  const handleCompleteRecall = (freeText: string, answers: Record<number, string>) => {
    setRecallFreeText(freeText);
    setRecalledAnswers(answers);
    syncWalkState('look_again');
    setCurrentScreen('look_again');
  };

  const handleCompleteLookAgain = (results: CheckResult[], surprise: string) => {
    setCheckResults(results);
    setSurpriseNote(surprise);
    syncWalkState('reflect');
    setCurrentScreen('reflect');
  };

  const handleCompleteReflect = (userReflections: Record<string, string>) => {
    setReflections(userReflections);
    syncWalkState('unpack');
    setCurrentScreen('unpack');
  };

  const handleSaveToJournal = async (entry: JournalEntry): Promise<SaveJournalResult> => {
    const result = await saveJournalEntry(entry);
    const updatedEntries = await getJournalEntries();
    setEntries(updatedEntries);
    consumeStorageIssue();
    if (!result.ok) {
      // Write failed: keep the entry in memory (UnpackView shows Retry/Download);
      // do NOT advance to post_save or clear the in-progress walk.
      return result;
    }
    saveStoredActiveWalk(null);
    setActivePack(null);
    setLastSavedEntryId(entry.id);
    // A saved walk is the ONLY thing that can unlock a chapter. Generation runs
    // in the background and never blocks the UI.
    requestChapter(entry);
    setCurrentScreen('post_save');
    return result;
  };

  const handleToggleDemo = (enabled: boolean) => {
    setDemoMode(enabled);
    setDemoModeState(enabled);
  };

  const handleCompleteEcho = async (echo: EchoRecord) => {
    const candidate = echoCandidate;
    if (!candidate) {
      setCurrentScreen('home');
      return;
    }
    const updated: JournalEntry = { ...candidate.entry, echo };
    const result = await updateJournalEntry(updated);
    if (!result.ok) setStorageNotice(result.error || null);
    const refreshed = await getJournalEntries();
    setEntries(refreshed);
    setCurrentScreen('journal');
  };

  const handleSkipEcho = async () => {
    const candidate = echoCandidate;
    if (!candidate) {
      setCurrentScreen('home');
      return;
    }
    const updated: JournalEntry = {
      ...candidate.entry,
      echo: { completedAt: new Date().toISOString(), answer: '', skipped: true },
    };
    const result = await updateJournalEntry(updated);
    if (!result.ok) setStorageNotice(result.error || null);
    const refreshed = await getJournalEntries();
    setEntries(refreshed);
    setCurrentScreen('journal');
  };

  const handleUpdateEntry = async (updated: JournalEntry) => {
    const result = await updateJournalEntry(updated);
    if (!result.ok) setStorageNotice(result.error || null);
    const refreshed = await getJournalEntries();
    setEntries(refreshed);
  };

  const handleDeleteEntry = async (id: string) => {
    await deleteJournalEntry(id);
    const refreshed = await getJournalEntries();
    setEntries(refreshed);
  };

  const handleDeleteAllEntries = async () => {
    await deleteAllJournalEntries();
    clearStory();
    setEntries([]);
    setLastSavedEntryId(null);
  };

  const pastTendenciesSummary = computePastTendenciesSummary(entries);

  // Cinematic Home screen: full-viewport, self-contained fixed layers. Rendering it
  // in isolation guarantees its fixed header/headline/bottom never overlap other screens.
  if (currentScreen === 'home') {
    return (
      <>
        {storageNotice && <StorageNotice message={storageNotice} onDismiss={() => setStorageNotice(null)} />}
        <CinematicHome
          ollamaStatus={ollamaStatus}
          onNavigate={setCurrentScreen}
          echoDaysAgo={echoCandidate ? echoCandidate.daysAgo : null}
          onStartEcho={() => setCurrentScreen('echo')}
          demoMode={demoMode}
          onToggleDemo={handleToggleDemo}
        />
        <PublicDemoNotice />
      </>
    );
  }

  return (
    <main className="relative w-full min-h-[115dvh] overflow-x-hidden flex flex-col items-center font-sans selection:bg-white/20 selection:text-white">
      {/* Plain solid black background for every non-Home screen. */}
      <div className="fixed inset-0 z-0 bg-black" />

      {/* Storage warnings (e.g. corrupt data backed up, save failed). */}
      {storageNotice && <StorageNotice message={storageNotice} onDismiss={() => setStorageNotice(null)} />}

      {/* Content Wrapper */}
      <div className="relative z-10 w-full max-w-7xl flex flex-col items-center min-h-[115dvh] justify-between px-4 sm:px-6 py-6">
        {/* Top Header */}
        <Header
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          journalCount={entries.length}
          ollamaStatus={ollamaStatus}
          onOpenOllamaModal={() => setIsOllamaModalOpen(true)}
        />

        {/* Dynamic Screen View */}
        <div className="w-full flex-1 flex flex-col items-center justify-center">
          {currentScreen === 'pack_setup' && (
            <PackSetupView
              onBack={() => setCurrentScreen('home')}
              onPackReady={handlePackReady}
              ollamaStatus={ollamaStatus}
              pastEntries={entries}
              onOpenOllamaModal={() => setIsOllamaModalOpen(true)}
            />
          )}

          {currentScreen === 'pack_ready' && activePack && (
            <PackReadyView
              pack={activePack}
              onStartWalk={handleStartWalk}
              onBackToSetup={() => setCurrentScreen('pack_setup')}
            />
          )}

          {currentScreen === 'active_walk' && activePack && (
            <ActiveWalkView
              pack={activePack}
              targetEndTime={activeEndTime}
              onFinishWalk={handleFinishWalk}
              onCancelWalk={handleCancelWalk}
            />
          )}

          {currentScreen === 'recall' && activePack && (
            <RecallView
              pack={activePack}
              initialFreeRecall={recallFreeText}
              initialAnswers={recalledAnswers}
              onCompleteRecall={handleCompleteRecall}
            />
          )}

          {currentScreen === 'look_again' && activePack && (
            <LookAgainView
              pack={activePack}
              recalledAnswers={recalledAnswers}
              initialCheckResults={checkResults}
              initialSurpriseNote={surpriseNote}
              onCompleteLookAgain={handleCompleteLookAgain}
            />
          )}

          {currentScreen === 'reflect' && activePack && (
            <ReflectView
              pack={activePack}
              initialReflections={reflections}
              onCompleteReflect={handleCompleteReflect}
            />
          )}

          {currentScreen === 'unpack' && activePack && (
            <UnpackView
              pack={activePack}
              durationMinutes={activePack.durationMinutes}
              recallFreeText={recallFreeText}
              checkResults={checkResults}
              surpriseNote={surpriseNote}
              reflections={reflections}
              ollamaStatus={ollamaStatus}
              pastTendenciesSummary={pastTendenciesSummary}
              onSaveToJournal={handleSaveToJournal}
              onOpenOllamaModal={() => setIsOllamaModalOpen(true)}
            />
          )}

          {currentScreen === 'post_save' && (
            (() => {
              const savedEntry = entries.find((e) => e.id === lastSavedEntryId);
              if (!savedEntry) {
                return (
                  <JournalView
                    entries={entries}
                    story={story}
                    onBack={() => setCurrentScreen('home')}
                    onUpdateEntry={handleUpdateEntry}
                    onDeleteEntry={handleDeleteEntry}
                    onDeleteAllEntries={handleDeleteAllEntries}
                    onStartNewWalk={() => setCurrentScreen('pack_setup')}
                    onRetryChapter={retryChapter}
                  />
                );
              }
              return (
                <PostSaveView
                  entry={savedEntry}
                  story={story}
                  isFirstWalk={entries.length === 1}
                  onNavigate={setCurrentScreen}
                  onRetryChapter={retryChapter}
                />
              );
            })()
          )}

          {currentScreen === 'echo' && echoCandidate && (
            <EchoView
              entry={echoCandidate.entry}
              daysAgo={echoCandidate.daysAgo}
              onComplete={handleCompleteEcho}
              onSkip={handleSkipEcho}
              onBack={() => setCurrentScreen('home')}
            />
          )}

          {currentScreen === 'journal' && (
            <JournalView
              entries={entries}
              story={story}
              onBack={() => setCurrentScreen('home')}
              onUpdateEntry={handleUpdateEntry}
              onDeleteEntry={handleDeleteEntry}
              onDeleteAllEntries={handleDeleteAllEntries}
              onStartNewWalk={() => setCurrentScreen('pack_setup')}
              onRetryChapter={retryChapter}
            />
          )}
        </div>
      </div>

      {/* Ollama Guide Modal */}
      <OllamaGuideModal
        isOpen={isOllamaModalOpen}
        onClose={() => setIsOllamaModalOpen(false)}
        status={ollamaStatus}
        onStatusUpdate={(newStatus) => setOllamaStatus(newStatus)}
      />

      {/* Public-demo privacy notice (only on non-local hostnames). */}
      <PublicDemoNotice />
    </main>
  );
}
