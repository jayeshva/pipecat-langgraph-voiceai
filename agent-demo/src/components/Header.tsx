import React from 'react';
import { Cpu, ShieldCheck } from 'lucide-react';
import type { SystemHealthStatus } from '../types';

interface HeaderProps {
  health: SystemHealthStatus | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ health, activeTab, setActiveTab }) => {
  const isHealthy = health?.status === 'ok';

  return (
    <header className="cmd-card sticky top-0 z-50 rounded-none border-x-0 border-t-0 border-b border-slate-800/80 backdrop-blur-xl">
      <div className="w-full max-w-[1850px] mx-auto px-4 sm:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shadow-md">
            <Cpu className="w-5 h-5 text-sky-400" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight font-heading">
                IntelliForm <span className="text-sky-400">AI</span>
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-800/90 text-slate-300 border border-slate-700">
                v2.5
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center p-1 rounded-xl bg-slate-950/70 border border-slate-800/80 space-x-1">
          {[
            { id: 'playground', label: '🎙️ Voice Playground' },
            { id: 'chat', label: '💬 Chat Studio' },
            { id: 'agents', label: 'Agents' },
            { id: 'mcp', label: 'MCP Tools' },
            { id: 'memory', label: 'Caller Memory' },
            { id: 'admin', label: 'Telephony' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-slate-800 text-sky-300 font-semibold border border-slate-700 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Real-time System Indicators */}
        <div className="flex items-center space-x-3 text-xs">
          {health?.providers && (
            <div className="hidden xl:flex items-center space-x-1 text-[10px] font-mono px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
              <span className="text-slate-500">Providers:</span>
              <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30">LLM: {health.providers.llm.toUpperCase()}</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">STT: {health.providers.stt.toUpperCase()}</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">TTS: {health.providers.tts.toUpperCase()}</span>
            </div>
          )}

          <div className="flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-950 border border-slate-800">
            <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-mono text-[11px]">
              {isHealthy ? 'Backend Active' : 'Connecting...'}
            </span>
          </div>

          {health && (
            <div className="hidden lg:flex items-center space-x-1.5 text-slate-400 text-[11px] font-mono px-3 py-1 rounded-full bg-slate-950 border border-slate-800">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Twilio: <strong className="text-slate-200">{health.twilio_configured ? 'Connected' : 'Mock'}</strong></span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
