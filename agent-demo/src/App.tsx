import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { VoicePlayground } from './components/VoicePlayground';
import { ChatStudio } from './components/ChatStudio';
import { AgentsExplorer } from './components/AgentsExplorer';
import { MCPExplorer } from './components/MCPExplorer';
import { MemoryInspector } from './components/MemoryInspector';
import { TwilioAdmin } from './components/TwilioAdmin';
import type { SystemHealthStatus } from './types';
import { getHealthStatus } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('playground');
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const h = await getHealthStatus();
      setHealth(h);
    } catch (e) {
      console.warn('Backend connection polling:', e);
      setHealth(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-sky-500 selection:text-slate-950">
      {/* App Header */}
      <Header health={health} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Tab Content Container */}
      <main className="flex-1 w-full mx-auto">
        {activeTab === 'playground' && <VoicePlayground health={health} />}
        {activeTab === 'chat' && <ChatStudio />}
        {activeTab === 'agents' && <AgentsExplorer setActiveTab={setActiveTab} />}
        {activeTab === 'mcp' && <MCPExplorer />}
        {activeTab === 'memory' && <MemoryInspector />}
        {activeTab === 'admin' && <TwilioAdmin />}
      </main>

      {/* Futuristic Footer */}
      <footer className="cmd-card border-x-0 border-b-0 border-t border-slate-800 py-3.5 px-8 text-center text-xs text-slate-400 font-mono flex flex-col sm:flex-row items-center justify-between gap-2">
        <div>IntelliForm AI Universal Agent Framework • LiveKit + Twilio + LangGraph + MCP</div>
        <div className="flex items-center space-x-2 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Sarvam AI Speech Engine v2.5</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
