import React, { useState, useEffect, useRef } from 'react';
import { X, RefreshCw, CheckCircle2, AlertTriangle, Shield, Cpu } from 'lucide-react';
import { OllamaHealthStatus } from '../types';
import { checkOllamaHealth } from '../services/api';

interface OllamaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: OllamaHealthStatus | null;
  onStatusUpdate: (newStatus: OllamaHealthStatus) => void;
}

// Fallback license map used only when the backend does not supply one.
function getKnownModelLicense(model?: string): string | null {
  if (!model) return null;
  const base = model.trim().toLowerCase().split(':')[0].replace(/-cloud$/, '');
  if (base.startsWith('qwen')) return 'Apache 2.0';
  if (base.startsWith('llama')) return 'Llama 3 Community License';
  if (base.startsWith('mistral') || base.startsWith('mixtral')) return 'Apache 2.0';
  if (base.startsWith('gemma')) return 'Gemma Terms of Use';
  if (base.startsWith('phi')) return 'MIT';
  if (base.startsWith('deepseek')) return 'MIT';
  return null;
}

export const OllamaGuideModal: React.FC<OllamaGuideModalProps> = ({
  isOpen,
  onClose,
  status,
  onStatusUpdate,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Esc to close + move focus into the dialog when it opens.
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    const focusTimer = window.setTimeout(() => dialogRef.current?.focus(), 0);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleRecheck = async () => {
    setIsChecking(true);
    try {
      const res = await checkOllamaHealth();
      onStatusUpdate(res);
    } finally {
      setIsChecking(false);
    }
  };

  const isConnected = status?.status === 'ok';
  const hasModel = isConnected && status?.modelAvailable;
  const isCloud = Boolean(status?.cloud);
  const license = status?.modelLicense || getKnownModelLicense(status?.targetModel) || 'see README';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Open-Weight AI Engine"
        tabIndex={-1}
        className="liquid-glass rounded-3xl border border-white/20 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative text-white backdrop-blur-3xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-11 h-11 rounded-2xl bg-white/10 text-white flex items-center justify-center backdrop-blur-md border border-white/10">
            <Cpu className="w-5 h-5 text-white/70" />
          </div>
          <div>
            <h2 className="text-xl font-medium text-white">Open-Weight AI Engine</h2>
            <p className="text-xs text-white/50 font-light">
              {isCloud ? 'A cloud model is configured — not private' : 'Ollama backend running locally on your machine'}
            </p>
          </div>
        </div>

        {/* Connection Diagnostics Card */}
        <div className={`p-5 rounded-2xl border mb-6 transition-all backdrop-blur-md ${
          hasModel 
            ? 'bg-white/10 border-white/25 text-white' 
            : isConnected 
            ? 'bg-white/5 border-white/15 text-white/90'
            : 'bg-white/5 border-white/10 text-white/80'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              {hasModel ? (
                <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
              ) : isConnected ? (
                <AlertTriangle className="w-5 h-5 text-white/80 shrink-0 mt-0.5" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-white/30 shrink-0 mt-1" />
              )}
              <div>
                <div className="font-semibold text-sm text-white">
                  {isCloud
                    ? 'Ollama Connected (Cloud model configured)'
                    : hasModel
                    ? `Ollama Connected & ${status?.targetModel} Ready`
                    : isConnected
                    ? `Ollama Connected (Model ${status?.targetModel} missing)`
                    : 'Ollama is Offline (Presets Active)'}
                </div>
                <div className="text-xs opacity-80 mt-0.5 font-light">
                  {status?.message || 'Checking local host service at http://localhost:11434...'}
                </div>
                {status?.responseTimeMs !== undefined && (
                  <div className="text-[11px] font-mono text-white/50 mt-1.5">
                    Latency: {status.responseTimeMs}ms • Endpoint: {status.ollamaUrl}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleRecheck}
              disabled={isChecking}
              className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-white text-black hover:bg-white/90 shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Checking...' : 'Check'}</span>
            </button>
          </div>

          {isCloud && (
            <div className="mt-3.5 pt-3.5 border-t border-white/10 text-xs font-light text-white/80 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                Cloud model: not private. Journal summaries, Echo, and Field Stories are disabled and
                never sent to it.
              </span>
            </div>
          )}

          {isConnected && (
            <div className="mt-3.5 pt-3.5 border-t border-white/10 text-xs font-light">
              <span className="text-white/60">Active model: </span>
              <span className="font-mono font-medium text-white">{status?.targetModel}</span>
              <span className="text-white/50"> · License: {license}</span>
            </div>
          )}
        </div>

        {/* Setup pointer */}
        <div className="mb-6">
          <p className="text-xs text-white/60 font-light">Setup steps are in the README.</p>
        </div>

        {/* Why Open-Weight AI Matters */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-md mb-6">
          <h4 className="text-xs uppercase tracking-wider text-white/80 font-semibold mb-2 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-white/70" />
            Why Open Models Matter Here
          </h4>
          <p className="text-xs text-white/60 leading-relaxed font-light">
            Your journal, Echo, and Field Stories are processed by a model running on your own machine,
            so your notes are not sent to an AI service. Because the model is open-weight, you can
            swap it for another one.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-white text-black font-semibold rounded-xl text-xs hover:bg-white/90 transition-all cursor-pointer shadow-lg"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
