import React, { useState } from 'react';
import { X, RefreshCw, CheckCircle2, AlertTriangle, Terminal, Shield, Cpu } from 'lucide-react';
import { OllamaHealthStatus } from '../types';
import { checkOllamaHealth } from '../services/api';

interface OllamaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: OllamaHealthStatus | null;
  onStatusUpdate: (newStatus: OllamaHealthStatus) => void;
}

export const OllamaGuideModal: React.FC<OllamaGuideModalProps> = ({
  isOpen,
  onClose,
  status,
  onStatusUpdate,
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

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

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const isConnected = status?.status === 'ok';
  const hasModel = isConnected && status?.modelAvailable;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="liquid-glass rounded-3xl border border-white/20 max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl p-6 sm:p-8 relative text-white backdrop-blur-3xl"
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
            <h2 className="text-xl font-medium text-white">
              Open-Weight AI Engine & Guide
            </h2>
            <p className="text-xs text-white/50 font-light">
              Ollama backend running locally on your machine
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
                  {hasModel
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

          {isConnected && status?.installedModels && status.installedModels.length > 0 && (
            <div className="mt-3.5 pt-3.5 border-t border-white/10 text-xs font-light">
              <span className="text-white/60">Installed models: </span>
              <span className="font-mono font-medium text-white">
                {status.installedModels.join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* How to run Ollama */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
            <Terminal className="w-4 h-4 text-white/70" />
            Quick Setup in Terminal
          </h3>
          <p className="text-xs text-white/60 mb-2.5 leading-relaxed font-light">
            Run this command in PowerShell or Terminal. Ollama will download the Apache 2.0 open-weight model (<code className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-white text-[11px]">qwen3:4b</code>) and host it locally:
          </p>

          <div className="relative bg-black/60 text-white rounded-2xl p-4 font-mono text-xs flex items-center justify-between border border-white/10 shadow-inner">
            <code className="text-white">ollama run qwen3:4b</code>
            <button
              onClick={() => copyCommand('ollama run qwen3:4b')}
              className="text-[11px] bg-white/20 hover:bg-white/30 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              {copiedCmd ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <p className="text-[11px] text-white/50 mt-2 font-light">
            Tip: Runs completely on CPU (no GPU needed). Memory footprint is ~2.5 GB.
          </p>
        </div>

        {/* Why Open-Weight AI Matters */}
        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 backdrop-blur-md mb-6">
          <h4 className="text-xs uppercase tracking-wider text-white/80 font-semibold mb-2 flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-white/70" />
            Why Open Models Matter Here
          </h4>
          <p className="text-xs text-white/60 leading-relaxed font-light">
            Observation journals contain raw, unedited personal memories. Running an open-weight model locally guarantees that your private thoughts never transit cloud APIs. Zero API costs, total offline sovereignty, and swappable models.
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
