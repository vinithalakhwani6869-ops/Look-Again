// Gentle audio chime and haptics for when the observation walk finishes

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (e) {
    return null;
  }
}

export function playGentleBell(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Harmonic bell frequencies (528Hz and warm overtones)
    const fundamental = 528;
    const harmonics = [1, 1.5, 2.02, 2.76];
    const gains = [0.35, 0.18, 0.1, 0.05];

    harmonics.forEach((mult, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamental * mult, now);

      gainNode.gain.setValueAtTime(gains[i], now);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 3.6);
    });
  } catch (e) {
    console.warn('Audio chime could not be played:', e);
  }
}

export function triggerGentleVibrate(): void {
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      // Gentle two-beat pulse
      navigator.vibrate([200, 150, 250]);
    }
  } catch (e) {
    // Ignore unsupported devices
  }
}

export function notifyWalkComplete(): void {
  playGentleBell();
  triggerGentleVibrate();
}
