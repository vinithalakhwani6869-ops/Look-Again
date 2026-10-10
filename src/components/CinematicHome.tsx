import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Lock, X } from 'lucide-react';
import { AppScreen, OllamaHealthStatus } from '../types';

interface CinematicHomeProps {
  ollamaStatus: OllamaHealthStatus | null;
  onNavigate: (screen: AppScreen) => void;
}

const NAV_LINK_CLASS =
  'text-[10px] sm:text-[11px] font-medium tracking-[0.12em] text-white/90 hover:text-white px-2.5 sm:px-4 py-1.5 rounded-full transition-colors duration-200';

export const CinematicHome: React.FC<CinematicHomeProps> = ({ ollamaStatus, onNavigate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Respect prefers-reduced-motion: no fade, no parallax.
  const [reduceMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [mounted, setMounted] = useState(reduceMotion);

  useEffect(() => {
    if (reduceMotion) return;
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, [reduceMotion]);

  // GSAP-driven mouse parallax on the video background (desktop/pointer only).
  useEffect(() => {
    if (reduceMotion) return;
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return;

    const video = videoRef.current;
    if (!video) return;

    const current = { x: 0, y: 0 };
    const target = { x: 0, y: 0 };

    const handleMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      target.x = ((e.clientX - cx) / cx) * 20;
      target.y = ((e.clientY - cy) / cy) * 20;
    };

    let frame = 0;
    const tick = () => {
      current.x += (target.x - current.x) * 0.06;
      current.y += (target.y - current.y) * 0.06;
      gsap.set(video, { x: current.x, y: current.y });
      frame = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', handleMouseMove);
    frame = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(frame);
    };
  }, [reduceMotion]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      videoRef.current.playbackRate = 1.25;
    }
  };

  const statusText =
    ollamaStatus === null
      ? 'CHECKING...'
      : ollamaStatus.status === 'ok' && ollamaStatus.modelAvailable
      ? 'LOCAL AI READY'
      : 'PRESETS ONLY';

  const transitionClass = reduceMotion ? '' : 'transition-all duration-1000';
  const revealClass = mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6';

  return (
    <div
      className="relative min-h-screen bg-black text-white overflow-x-hidden"
      style={{ fontFamily: "'Barlow', sans-serif" }}
    >
      {/* Fixed full-screen video background with parallax + fallback colour */}
      <div className="fixed inset-0 z-0 scale-[1.08] origin-center bg-[#0B0E0D]">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          src="/media/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onLoadedMetadata={handleLoadedMetadata}
        />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 px-4 py-6 sm:px-10 sm:py-8 flex justify-between items-center">
        <div className="text-[15px] sm:text-[17px] font-semibold tracking-tight shrink-0">
          LOOK AGAIN
        </div>

        <nav className="liquid-glass rounded-full px-2 py-2 flex items-center gap-1">
          <button type="button" onClick={() => onNavigate('pack_setup')} className={NAV_LINK_CLASS}>
            NEW WALK
          </button>
          <button type="button" onClick={() => onNavigate('journal')} className={NAV_LINK_CLASS}>
            JOURNAL
          </button>
          <button type="button" onClick={() => setShowHowItWorks(true)} className={NAV_LINK_CLASS}>
            HOW IT WORKS
          </button>
        </nav>

        <div
          className="liquid-glass rounded-full px-5 py-2.5 text-[11px] font-medium tracking-[0.12em] text-white/90 hidden sm:inline-flex items-center"
          title="Local AI status"
        >
          {statusText}
        </div>
      </header>

      {/* Hero headline */}
      <div
        className={`fixed left-0 right-0 z-20 flex flex-col items-center text-center ${transitionClass} ${revealClass}`}
        style={{ top: '120px' }}
      >
        <h1
          className="font-normal"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: 'clamp(40px, 5.4vw, 72px)',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}
        >
          <span className="block text-white">There&apos;s more around you</span>
          <span className="block" style={{ color: 'rgba(255,255,255,0.55)' }}>
            than you notice.
          </span>
        </h1>
      </div>

      {/* Bottom block */}
      <div
        className={`fixed bottom-14 left-0 right-0 z-20 flex flex-col items-center gap-6 ${transitionClass} ${
          reduceMotion ? '' : 'delay-300'
        } ${revealClass}`}
      >
        <p className="max-w-[620px] text-[15px] leading-relaxed text-center px-6">
          <span className="text-white">
            Short outdoor walks that train you to notice what you usually miss, then check your memory
            against what was really there.
          </span>
          <span className="text-white/55"> Your journal never leaves your device.</span>
        </p>

        <button
          type="button"
          onClick={() => onNavigate('pack_setup')}
          className="bg-white text-black text-[15px] font-medium rounded-full px-8 py-3.5 transition-transform duration-200 hover:scale-[1.03] hover:shadow-[0_0_32px_4px_rgba(255,255,255,0.2)] active:scale-[0.97]"
        >
          Begin noticing
        </button>

        <div className="flex items-center gap-2 text-[11px] font-medium tracking-[0.14em] text-white/70">
          <Lock size={13} strokeWidth={1.5} />
          <span>YOUR JOURNAL STAYS ON YOUR DEVICE.</span>
        </div>
      </div>

      {/* How it works modal */}
      {showHowItWorks && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowHowItWorks(false)}
        >
          <div
            className="liquid-glass rounded-3xl max-w-lg w-full p-8 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                className="text-xl font-semibold text-white"
                style={{ fontFamily: "'Inter', sans-serif" }}
              >
                How LOOK AGAIN works
              </h2>
              <button
                type="button"
                onClick={() => setShowHowItWorks(false)}
                aria-label="Close"
                className="text-white/60 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <ol className="space-y-3 text-[14px] leading-relaxed text-white/80">
              <li>
                <strong className="text-white">Look.</strong> Choose a short walk and one clear focus,
                then pocket your phone and step outside.
              </li>
              <li>
                <strong className="text-white">Recall.</strong> When the timer ends, answer a few hidden
                questions from memory — with your back turned.
              </li>
              <li>
                <strong className="text-white">Look again.</strong> Turn around and check what was
                really there. You decide what you missed.
              </li>
              <li>
                <strong className="text-white">Journal.</strong> A private field note is saved on your
                device, with a gentle note on what you tend to notice.
              </li>
            </ol>

            <p className="mt-5 text-[13px] leading-relaxed text-white/55">
              Everything stays on your device. No cameras, no accounts, and no cloud AI — your journal
              never leaves your browser.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
