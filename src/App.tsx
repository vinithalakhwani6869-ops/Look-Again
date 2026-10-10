import React, { useState, useEffect } from 'react';
import { 
  AppScreen, WalkPack, JournalEntry, CheckResult, 
  OllamaHealthStatus 
} from './types';
import { 
  getJournalEntries, saveJournalEntry, updateJournalEntry, 
  deleteJournalEntry, deleteAllJournalEntries, getStoredActiveWalk, 
  saveStoredActiveWalk, StoredActiveWalk, computePastTendenciesSummary 
} from './services/storage';
import { checkOllamaHealth } from './services/api';
import { Header } from './components/Header';
import { CinematicHome } from './components/CinematicHome';
import { PackSetupView } from './components/PackSetupView';
import { PackReadyView } from './components/PackReadyView';
import { ActiveWalkView } from './components/ActiveWalkView';
import { RecallView } from './components/RecallView';
import { LookAgainView } from './components/LookAgainView';
import { ReflectView } from './components/ReflectView';
import { UnpackView } from './components/UnpackView';
import { JournalView } from './components/JournalView';
import { OllamaGuideModal } from './components/OllamaGuideModal';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [ollamaStatus, setOllamaStatus] = useState<OllamaHealthStatus | null>(null);
  const [isOllamaModalOpen, setIsOllamaModalOpen] = useState<boolean>(false);

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
    });

    checkOllamaHealth().then((status) => {
      setOllamaStatus(status);
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

  const handleSaveToJournal = async (entry: JournalEntry) => {
    await saveJournalEntry(entry);
    saveStoredActiveWalk(null);
    setActivePack(null);
    const updatedEntries = await getJournalEntries();
    setEntries(updatedEntries);
    setCurrentScreen('journal');
  };

  const handleUpdateEntry = async (updated: JournalEntry) => {
    await updateJournalEntry(updated);
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
    setEntries([]);
  };

  const pastTendenciesSummary = computePastTendenciesSummary(entries);

  // Cinematic Home screen: full-viewport, self-contained fixed layers. Rendering it
  // in isolation guarantees its fixed header/headline/bottom never overlap other screens.
  if (currentScreen === 'home') {
    return <CinematicHome ollamaStatus={ollamaStatus} onNavigate={setCurrentScreen} />;
  }

  return (
    <main className="relative w-full min-h-[115vh] overflow-x-hidden flex flex-col items-center font-sans selection:bg-white/20 selection:text-white">
      {/* Calm CSS-only monochrome background (no external media) */}
      <div className="fixed inset-0 z-[0] bg-black" />
      <div className="fixed inset-0 z-[0] bg-[radial-gradient(circle_at_25%_15%,rgba(255,255,255,0.06),transparent_55%),radial-gradient(circle_at_75%_85%,rgba(255,255,255,0.04),transparent_60%)]" />

      {/* Subtle overlay for optimal content readability */}
      <div className="fixed inset-0 bg-black/30 z-[1] pointer-events-none" />

      {/* Content Wrapper on top of background (z-10) */}
      <div className="relative z-10 w-full max-w-7xl flex flex-col items-center min-h-[115vh] justify-between px-4 sm:px-6 py-6">
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

          {currentScreen === 'journal' && (
            <JournalView
              entries={entries}
              onBack={() => setCurrentScreen('home')}
              onUpdateEntry={handleUpdateEntry}
              onDeleteEntry={handleDeleteEntry}
              onDeleteAllEntries={handleDeleteAllEntries}
              onStartNewWalk={() => setCurrentScreen('pack_setup')}
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
    </main>
  );
}
