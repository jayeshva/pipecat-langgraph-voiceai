import React, { useState } from 'react';
import { Database, Trash2, User, MessageSquare, Clock } from 'lucide-react';
import { clearCallerMemory } from '../services/api';

export const MemoryInspector: React.FC = () => {
  const [callerId, setCallerId] = useState<string>('browser-user-01');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const mockMemories = [
    {
      caller_id: 'browser-user-01',
      last_active: '2 minutes ago',
      messages_count: 4,
      ttl: '23 hours remaining',
      history: [
        { role: 'user', content: 'Hi, I need help with my application form.' },
        { role: 'agent', content: 'Hello! I can guide you through the process step by step.' },
        { role: 'user', content: 'What are your operating hours?' },
        { role: 'agent', content: 'Our online voice AI assistance operates 24/7 online. Department offices open Monday to Friday 9 AM to 5 PM.' },
      ],
    },
    {
      caller_id: '+12025550143',
      last_active: '15 minutes ago',
      messages_count: 2,
      ttl: '23 hours remaining',
      history: [
        { role: 'user', content: 'Is my support ticket created?' },
        { role: 'agent', content: 'Yes, your support ticket #TK-8942 has been logged successfully.' },
      ],
    },
  ];

  const handleClearMemory = async (cid: string) => {
    try {
      await clearCallerMemory(cid);
      setStatusMsg(`Successfully cleared caller memory for '${cid}'!`);
    } catch (e: any) {
      setStatusMsg(`Memory clear failed: ${e.message}`);
    }
  };

  const selectedMemoryObj = mockMemories.find((m) => m.caller_id === callerId) || mockMemories[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-sky-500/20 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Database className="w-6 h-6 text-purple-400" /> Persistent Session Memory Inspector
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Persisted caller history (`data/caller_memory.json`) automatically remembered across phone calls & browser sessions.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-xs font-mono text-emerald-300 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg(null)} className="text-emerald-400 font-bold">×</button>
        </div>
      )}

      {/* Main Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Callers */}
        <div className="lg:col-span-4 glass-panel rounded-2xl p-5 border border-sky-500/20 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <User className="w-4 h-4 text-sky-400" /> Stored Caller Sessions
          </h3>

          <div className="space-y-3">
            {mockMemories.map((mem) => (
              <div
                key={mem.caller_id}
                onClick={() => setCallerId(mem.caller_id)}
                className={`p-4 rounded-xl cursor-pointer transition-all border ${
                  callerId === mem.caller_id
                    ? 'bg-purple-500/20 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-purple-300">{mem.caller_id}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400">
                    {mem.messages_count} turns
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-slate-500" /> {mem.last_active}</span>
                  <span className="text-emerald-400">{mem.ttl}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Message History Viewer & Forget Action */}
        <div className="lg:col-span-8 glass-panel rounded-2xl p-5 border border-sky-500/20 space-y-4 flex flex-col h-[520px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" /> Conversation History for '{selectedMemoryObj.caller_id}'
              </h3>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                Automatically recalled when this caller connects again.
              </p>
            </div>
            <button
              onClick={() => handleClearMemory(selectedMemoryObj.caller_id)}
              className="px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-medium flex items-center space-x-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Forget Caller Memory</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-2">
            {selectedMemoryObj.history.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border text-xs space-y-1 ${
                  msg.role === 'user'
                    ? 'bg-slate-900/80 border-sky-500/30 text-slate-200'
                    : 'bg-purple-950/40 border-purple-500/30 text-purple-100'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  <span>{msg.role === 'user' ? '👤 Caller' : '🤖 Assistant'}</span>
                  <span>Turn #{idx + 1}</span>
                </div>
                <p className="leading-relaxed text-slate-200">{msg.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
