import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Sparkles,
  Bot,
  User,
  Wrench,
  Volume2,
  RefreshCw,
  Layers,
  PhoneCall,
  Radio,
  Terminal,
  Activity,
  Zap,
  Cpu,
  ChevronDown,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { Room, RoomEvent } from 'livekit-client';
import type { AgentMetadata, ChatMessage, VoiceState, ToolLogItem, SystemHealthStatus } from '../types';
import { connectVoiceSession, getAgentsList } from '../services/api';
import { AudioVisualizer } from './AudioVisualizer';

interface VoicePlaygroundProps {
  health?: SystemHealthStatus | null;
}

export const VoicePlayground: React.FC<VoicePlaygroundProps> = ({ health }) => {
  const [agents, setAgents] = useState<AgentMetadata[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('welcome');
  const [voiceState, setVoiceState] = useState<VoiceState>('disconnected');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [toolLogs, setToolLogs] = useState<ToolLogItem[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [callerId, setCallerId] = useState<string>('browser-user-01');
  const [language, setLanguage] = useState<string>('en-IN');
  const [roomInfo, setRoomInfo] = useState<{ room: string; agent_id: string } | null>(null);
  
  // Category Filter State
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedPayloads, setExpandedPayloads] = useState<Record<string, boolean>>({});

  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const toolLogBottomRef = useRef<HTMLDivElement | null>(null);
  const roomRef = useRef<Room | null>(null);

  useEffect(() => {
    fetchAgents();
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, voiceState]);

  useEffect(() => {
    toolLogBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [toolLogs]);

  const togglePayload = (id: string) => {
    setExpandedPayloads((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const fetchAgents = async () => {
    try {
      const list = await getAgentsList();
      setAgents(list);
      if (list.length > 0 && !selectedAgent) {
        setSelectedAgent(list[0].agent_id);
      }
    } catch (e) {
      console.error('Could not fetch agents:', e);
    }
  };

  const handleStartCall = async () => {
    setVoiceState('connecting');
    const startTime = new Date().toLocaleTimeString();
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'system',
        text: `Connecting LiveKit session for agent '${selectedAgent}'...`,
        timestamp: startTime,
      },
    ]);

    setToolLogs((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random(),
        toolName: 'Pipeline Session Connecting',
        toolArgs: { agent: selectedAgent, callerId, language },
        executedAt: startTime,
        agentId: selectedAgent,
        status: 'success',
        category: 'pipeline',
      },
    ]);

    try {
      const res = await connectVoiceSession(selectedAgent, callerId, language);
      setRoomInfo({ room: res.room, agent_id: res.agent_id });

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      room.on(RoomEvent.DataReceived, (payload: Uint8Array) => {
        try {
          const str = new TextDecoder().decode(payload);
          const data = JSON.parse(str);
          const timestamp = new Date().toLocaleTimeString();

          if (data.type === 'user.transcript') {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                sender: 'user',
                text: data.text,
                timestamp,
              },
            ]);
          } else if (data.type === 'agent.transcript') {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                sender: 'agent',
                text: data.text,
                timestamp,
              },
            ]);
          } else if (data.type === 'tool.execution') {
            setToolLogs((prev) => [
              ...prev,
              {
                id: Date.now().toString() + Math.random(),
                toolName: `Tool '${data.toolName || 'mcp_tool'}' Executed`,
                toolArgs: data.toolArgs || {},
                executedAt: timestamp,
                agentId: selectedAgent,
                status: 'success',
                category: 'mcp',
              },
            ]);
          } else if (data.type === 'pipeline.event') {
            setToolLogs((prev) => [
              ...prev,
              {
                id: Date.now().toString() + Math.random(),
                toolName: data.title || 'Pipeline Activity',
                toolArgs: { detail: data.detail || '', provider: data.provider || '' },
                executedAt: timestamp,
                agentId: selectedAgent,
                status: 'success',
                category: data.category || 'pipeline',
              },
            ]);
          } else if (data.type === 'state') {
            setVoiceState(data.state as VoiceState);
          } else if (data.type === 'agent.ready') {
            setMessages((prev) => [
              ...prev,
              {
                id: Date.now().toString(),
                sender: 'system',
                text: `Agent ready for caller '${callerId}'.`,
                timestamp,
              },
            ]);
          }
        } catch (e) {
          console.warn('Data packet parse error:', e);
        }
      });

      room.on(RoomEvent.Disconnected, () => {
        setVoiceState('disconnected');
        const endTime = new Date().toLocaleTimeString();
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'system',
            text: `WebRTC stream closed. Memory persisted for '${callerId}'.`,
            timestamp: endTime,
          },
        ]);
        setToolLogs((prev) => [
          ...prev,
          {
            id: Date.now().toString() + Math.random(),
            toolName: 'Pipeline Session Disconnected',
            toolArgs: { callerId },
            executedAt: endTime,
            agentId: selectedAgent,
            status: 'success',
            category: 'pipeline',
          },
        ]);
        setRoomInfo(null);
        roomRef.current = null;
      });

      room.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === 'audio') {
          const element = track.attach();
          document.body.appendChild(element);
        }
      });

      if (res.url && res.token) {
        await room.connect(res.url, res.token);
        try {
          await room.localParticipant.setMicrophoneEnabled(true);
          setIsMuted(false);
        } catch (micErr) {
          console.warn('Microphone permission denied or unavailable:', micErr);
        }
        roomRef.current = room;
        setVoiceState('listening');

        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'system',
            text: `WebRTC active (Room: '${res.room}').`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      } else {
        roomRef.current = room;
        setVoiceState('listening');
        setMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'system',
            text: `Connected to agent '${selectedAgent}'.`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    } catch (err: any) {
      setVoiceState('disconnected');
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'system',
          text: `Connection error: ${err.message}.`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  const handleHangup = () => {
    if (roomRef.current) {
      roomRef.current.disconnect();
      roomRef.current = null;
    }
    setVoiceState('disconnected');
    setRoomInfo(null);
  };

  const handleToggleMute = async () => {
    if (roomRef.current) {
      const nextState = !isMuted;
      await roomRef.current.localParticipant.setMicrophoneEnabled(!nextState);
      setIsMuted(nextState);
    } else {
      setIsMuted(!isMuted);
    }
  };

  const handleTriggerHangupTool = async () => {
    const timestamp = new Date().toLocaleTimeString();
    if (roomRef.current) {
      const payload = new TextEncoder().encode(
        JSON.stringify({ type: 'user.text', text: 'I want to hang up the call now.' })
      );
      await roomRef.current.localParticipant.publishData(payload, { reliable: true });
    }

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'user',
        text: 'I want to hang up the call now.',
        timestamp,
      },
    ]);

    setToolLogs((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        toolName: "Tool 'hangup_call' Executed",
        toolArgs: { reason: 'user_explicit_disconnection' },
        executedAt: timestamp,
        agentId: selectedAgent,
        status: 'success',
        category: 'mcp',
      },
    ]);

    setVoiceState('agent_speaking');
    setTimeout(() => {
      handleHangup();
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || voiceState === 'disconnected') return;

    const userText = inputMessage.trim();
    setInputMessage('');

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'user',
        text: userText,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    if (roomRef.current) {
      try {
        const payload = new TextEncoder().encode(JSON.stringify({ type: 'user.text', text: userText }));
        await roomRef.current.localParticipant.publishData(payload, { reliable: true });
      } catch (err) {
        console.warn('Could not publish data over LiveKit channel:', err);
      }
    }
  };

  const currentAgentObj = agents.find((a) => a.agent_id === selectedAgent);

  const getStateBadge = () => {
    switch (voiceState) {
      case 'agent_speaking':
        return { label: 'SPEAKING', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'user_speaking':
        return { label: 'USER SPEAKING', bg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' };
      case 'processing':
        return { label: 'THINKING', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30' };
      case 'listening':
        return { label: 'LISTENING', bg: 'bg-sky-500/10 text-sky-300 border-sky-500/30' };
      default:
        return { label: 'DISCONNECTED', bg: 'bg-slate-800 text-slate-400 border-slate-700' };
    }
  };

  const stateBadge = getStateBadge();

  const getCategoryMeta = (cat?: string) => {
    switch (cat) {
      case 'stt':
        return {
          label: 'STT RECOGNITION',
          badgeClass: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          borderClass: 'border-l-sky-400',
          icon: <Mic className="w-3.5 h-3.5 text-sky-400" />,
        };
      case 'llm':
        return {
          label: 'LLM REASONING',
          badgeClass: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          borderClass: 'border-l-purple-400',
          icon: <Cpu className="w-3.5 h-3.5 text-purple-400" />,
        };
      case 'mcp':
        return {
          label: 'MCP TOOL CALL',
          badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          borderClass: 'border-l-emerald-400',
          icon: <Wrench className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case 'tts':
        return {
          label: 'TTS SYNTHESIS',
          badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          borderClass: 'border-l-amber-400',
          icon: <Volume2 className="w-3.5 h-3.5 text-amber-400" />,
        };
      default:
        return {
          label: 'PIPELINE EVENT',
          badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
          borderClass: 'border-l-indigo-400',
          icon: <Zap className="w-3.5 h-3.5 text-indigo-400" />,
        };
    }
  };

  const filteredLogs = categoryFilter === 'all'
    ? toolLogs
    : toolLogs.filter((l) => (l.category || 'pipeline') === categoryFilter);

  return (
    <div className="w-full max-w-[1850px] mx-auto px-4 sm:px-8 py-6 font-sans">
      {/* Dashboard 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* COLUMN 1: LEFT — AGENT CONTROL (4 cols = 33.3% width) */}
        <div className="lg:col-span-4 cmd-card p-6 flex flex-col justify-between h-[730px]">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Agent Control
                </h2>
              </div>
              <button
                onClick={fetchAgents}
                className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
                title="Refresh Registry"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Agent Select */}
            <div className="space-y-2.5">
              <label className="block text-[11px] font-mono text-slate-400">Target Voice Agent:</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                disabled={voiceState !== 'disconnected'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                {agents.map((ag) => (
                  <option key={ag.agent_id} value={ag.agent_id} className="bg-slate-950 text-slate-200">
                    {ag.name} ({ag.is_langgraph ? 'LangGraph' : 'Pipecat'})
                  </option>
                ))}
              </select>

              {currentAgentObj && (
                <div className="cmd-subcard p-3.5 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{currentAgentObj.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        currentAgentObj.is_langgraph
                          ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                          : 'bg-sky-500/10 text-sky-300 border border-sky-500/30'
                      }`}
                    >
                      {currentAgentObj.is_langgraph ? 'LANGGRAPH' : 'PIPECAT'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed line-clamp-2">{currentAgentObj.description}</p>
                </div>
              )}
            </div>

            {/* Params */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-1">
              <div>
                <label className="text-slate-400 block mb-1 text-[10px]">Caller ID:</label>
                <input
                  type="text"
                  value={callerId}
                  onChange={(e) => setCallerId(e.target.value)}
                  disabled={voiceState !== 'disconnected'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1 text-[10px]">Language:</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={voiceState !== 'disconnected'}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-slate-200 text-xs"
                >
                  <option value="en-IN">en-IN (English)</option>
                  <option value="hi-IN">hi-IN (Hindi)</option>
                  <option value="ta-IN">ta-IN (Tamil)</option>
                  <option value="te-IN">te-IN (Telugu)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Connection & State Summary */}
          <div className="py-4 border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">Connection State:</span>
              <span className={`px-3 py-1 rounded-md text-[10px] font-mono font-bold border ${stateBadge.bg}`}>
                ● {stateBadge.label}
              </span>
            </div>

            <div className="cmd-subcard p-3.5 text-[11px] font-mono space-y-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>STT Model:</span>
                <span className="text-slate-200">
                  {health?.models?.stt?.model || 'saarika:v2.5'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>TTS Voice:</span>
                <span className="text-slate-200">
                  {health?.models?.tts?.voice
                    ? `${health.models.tts.voice} (${health.models.tts.model})`
                    : 'shruti (bulbul:v3)'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>LLM Engine:</span>
                <span className="text-sky-300 font-semibold">
                  {health?.models?.llm?.model || 'sarvam-105b-conversations'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Memory:</span>
                <span className="text-emerald-400">LangGraph Checkpoint</span>
              </div>
            </div>
          </div>

          {/* Action Trigger Controls */}
          <div>
            {voiceState === 'disconnected' ? (
              <button
                onClick={handleStartCall}
                className="w-full py-3.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center space-x-2 shadow-lg active:scale-95"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Start Voice Session</span>
              </button>
            ) : (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleToggleMute}
                  className={`p-3 rounded-xl border transition-all ${
                    isMuted
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      : 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                  }`}
                  title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                >
                  {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-sky-400" />}
                </button>

                <button
                  onClick={handleTriggerHangupTool}
                  className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md active:scale-95"
                  title="Trigger Universal hangup_call tool"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Hangup Tool</span>
                </button>

                <button
                  onClick={handleHangup}
                  className="p-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white border border-rose-500/40 transition-all active:scale-95"
                  title="End Session"
                >
                  <PhoneOff className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* COLUMN 2: CENTER — LIVE CONVERSATION (4 cols = 33.3% width) */}
        <div className="lg:col-span-4 cmd-card p-6 flex flex-col justify-between h-[730px] border border-sky-500/30 shadow-[0_0_30px_rgba(56,189,248,0.08)]">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Live Conversation Center
              </h2>
            </div>
            {roomInfo ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-sky-400">
                {roomInfo.room}
              </span>
            ) : (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-500">
                Audio Channel Offline
              </span>
            )}
          </div>

          {/* Central Animated Voice Visualizer Orb */}
          <div className="py-2 flex flex-col items-center justify-center">
            <AudioVisualizer state={voiceState} />
          </div>

          {/* Transcript Message Feed */}
          <div className="flex-1 overflow-y-auto py-3.5 space-y-3 pr-1">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                <Volume2 className="w-10 h-10 text-slate-700 animate-pulse" />
                <p className="text-xs font-medium text-slate-400">Click "Start Voice Session" to begin real-time speech conversation.</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.sender === 'system' && (
                    <div className="w-full text-center py-1.5 px-3 text-[10px] font-mono text-sky-300 bg-slate-950/80 rounded-lg border border-slate-800">
                      ⚡ {msg.text} <span className="text-slate-500">({msg.timestamp})</span>
                    </div>
                  )}

                  {msg.sender === 'user' && (
                    <div className="max-w-[85%] bg-sky-600 text-white rounded-2xl rounded-tr-none px-4 py-2.5 text-xs shadow-md space-y-1">
                      <div className="flex items-center gap-1 text-[9px] text-sky-200 font-mono font-bold uppercase">
                        <User className="w-3 h-3" /> USER <span className="text-sky-300/70 font-normal">({msg.timestamp})</span>
                      </div>
                      <p className="leading-relaxed font-medium">{msg.text}</p>
                    </div>
                  )}

                  {msg.sender === 'agent' && (
                    <div className="max-w-[90%] bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl rounded-tl-none px-4 py-3 text-xs shadow-lg space-y-1">
                      <div className="flex items-center gap-1 text-[9px] text-purple-400 font-mono font-bold uppercase">
                        <Bot className="w-3 h-3" /> {selectedAgent.toUpperCase()} AGENT
                        <span className="text-slate-500 font-normal">({msg.timestamp})</span>
                      </div>
                      <p className="leading-relaxed text-slate-200 font-medium">{msg.text}</p>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Quick Text Composer */}
          <form onSubmit={handleSendMessage} className="pt-3 border-t border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={voiceState === 'disconnected'}
              placeholder={
                voiceState === 'disconnected' ? 'Session disconnected...' : 'Type message or speak into mic...'
              }
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
            />
            <button
              type="submit"
              disabled={voiceState === 'disconnected' || !inputMessage.trim()}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition-all flex items-center space-x-1 shadow-md"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* COLUMN 3: RIGHT — HIGH-TECH AGENT & PIPELINE ACTIVITY CONSOLE (4 cols = 33.3% width) */}
        <div className="lg:col-span-4 cmd-card p-6 flex flex-col justify-between h-[730px]">
          {/* Top Bar with Filter Pills */}
          <div className="space-y-3 pb-3 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100 font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Activity Event Stream
                </h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30 font-bold flex items-center gap-1">
                <Activity className="w-3 h-3 text-purple-400 animate-spin" /> {filteredLogs.length} Events
              </span>
            </div>

            {/* Filter Pills Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] font-mono pt-1">
              <Filter className="w-3 h-3 text-slate-500 shrink-0" />
              {[
                { id: 'all', label: 'ALL' },
                { id: 'stt', label: '🎙️ STT' },
                { id: 'llm', label: '🧠 LLM' },
                { id: 'mcp', label: '🛠️ MCP' },
                { id: 'tts', label: '🔊 TTS' },
              ].map((filterItem) => (
                <button
                  key={filterItem.id}
                  onClick={() => setCategoryFilter(filterItem.id)}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    categoryFilter === filterItem.id
                      ? 'bg-slate-800 text-sky-300 font-bold border border-slate-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  {filterItem.label}
                </button>
              ))}
            </div>
          </div>

          {/* Activity Log Feed Timeline Tree */}
          <div className="flex-1 overflow-y-auto py-3.5 space-y-3 pr-1 relative">
            {/* Timeline Connector Vertical Line */}
            {filteredLogs.length > 0 && (
              <div className="absolute left-3.5 top-4 bottom-4 w-0.5 bg-slate-800/80 pointer-events-none" />
            )}

            {filteredLogs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
                <Activity className="w-10 h-10 text-slate-700 animate-pulse" />
                <p className="text-xs font-bold text-slate-300">No events in current filter stream.</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Start voice call or type a message. Speech recognition, LLM reasoning, MCP tools, and TTS synthesis stream live here!
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const meta = getCategoryMeta(log.category);
                const isExpanded = !!expandedPayloads[log.id];

                // Extract detail or text summary
                const detailText =
                  typeof log.toolArgs?.detail === 'string'
                    ? log.toolArgs.detail
                    : typeof log.toolArgs?.query === 'string'
                    ? log.toolArgs.query
                    : typeof log.toolArgs?.text === 'string'
                    ? log.toolArgs.text
                    : '';

                return (
                  <div
                    key={log.id}
                    className={`relative pl-7 transition-all ${meta.borderClass} border-l-2 bg-slate-950/90 border border-slate-800/90 rounded-2xl p-3.5 text-xs space-y-2 shadow-lg hover:border-slate-700`}
                  >
                    {/* Node Dot */}
                    <div className="absolute -left-[9px] top-3.5 w-4 h-4 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center shadow-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
                    </div>

                    {/* Event Header */}
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100 text-xs font-mono flex items-center gap-1.5">
                        {meta.icon} {log.toolName}
                      </span>
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                    </div>

                    {/* Agent & Timestamp */}
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span>Agent: <strong className="text-sky-300">{log.agentId || selectedAgent}</strong></span>
                      <span className="text-slate-500">{log.executedAt}</span>
                    </div>

                    {/* Readable Text Summary */}
                    {detailText && (
                      <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/90 text-[11px] text-slate-200 leading-relaxed font-sans font-medium">
                        {detailText}
                      </div>
                    )}

                    {/* Collapsible Raw Payload Toggle */}
                    {log.toolArgs && Object.keys(log.toolArgs).length > 0 && (
                      <div>
                        <button
                          onClick={() => togglePayload(log.id)}
                          className="flex items-center gap-1 text-[10px] font-mono text-slate-500 hover:text-sky-400 transition-colors mt-1"
                        >
                          {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                          <span>{isExpanded ? 'Hide Raw JSON' : 'Inspect Raw Payload JSON'}</span>
                        </button>

                        {isExpanded && (
                          <pre className="mt-1.5 p-2.5 rounded-xl bg-slate-950 text-[10px] font-mono text-purple-300 overflow-x-auto border border-purple-500/30 leading-relaxed">
                            {JSON.stringify(log.toolArgs, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            <div ref={toolLogBottomRef} />
          </div>

          {/* Footer Info */}
          <div className="pt-3 border-t border-slate-800 text-[10px] font-mono text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1 text-sky-400 font-medium">
              <Zap className="w-3 h-3 text-sky-400" /> End-to-End Pipeline Bus
            </span>
            <span className="text-slate-500">Live Event Streaming</span>
          </div>
        </div>

      </div>
    </div>
  );
};
