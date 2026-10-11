import React, { useEffect, useState } from 'react';
import { Info, X } from 'lucide-react';

// True when the app is being served from a public hostname (e.g. a Cloudflare
// Tunnel), not localhost or a private LAN address.
export function isPublicHostname(hostname?: string): boolean {
  const h = (hostname || window.location.hostname || '').trim().toLowerCase();
  if (!h || h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '0.0.0.0') return false;
  if (h.endsWith('.local') || h.endsWith('.localhost') || h.endsWith('.internal')) return false;
  if (/^10\./.test(h)) return false;
  if (/^192\.168\./.test(h)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return false;
  if (/^169\.254\./.test(h)) return false;
  return true;
}

const DISMISS_KEY = 'lookagain_demo_notice_dismissed_v1';

// Shown when the live app is reachable over a public tunnel. Alerts the user
// that AI features actually run on the developer's machine. Never shown on
// localhost/private LAN.
export const PublicDemoNotice: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isPublicHostname()) return;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === 'true';
    } catch {
      dismissed = false;
    }
    if (!dismissed) setVisible(true);
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, 'true');
    } catch {
      // non-fatal; the notice just reappears next load
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1.5rem)] max-w-lg animate-in fade-in duration-300">
      <div className="flex items-start gap-3 rounded-2xl border border-white/15 bg-black/85 backdrop-blur-xl p-3.5 text-white shadow-2xl">
        <Info className="w-4 h-4 shrink-0 text-white/70 mt-0.5" />
        <p className="text-[11px] sm:text-xs font-light leading-relaxed flex-1 text-white/85">
          Live demo: AI features (summaries, Field Stories, Echo) run on the developer's
          machine, so avoid entering sensitive personal details. Your journal itself stays
          in your browser.
        </p>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss notice"
          className="text-white/50 hover:text-white transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};