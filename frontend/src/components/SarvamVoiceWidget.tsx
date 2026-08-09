import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  PhoneOff, Mic, MicOff, Volume2, VolumeX, Sparkles,
  ChevronUp, ChevronDown, User, Disc, AlertTriangle
} from 'lucide-react';
import { VoiceClient, getStoredCallerId, type TurnState } from '../lib/voiceClient';

interface SarvamVoiceWidgetProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

const API_BASE_URL = import.meta.env.VITE_VOICE_API_URL ?? 'http://localhost:8080';

const STATE_LABEL: Record<TurnState, string> = {
  idle: 'Call ended',
  connecting: '⏳ Connecting...',
  listening: '🎙️ Listening (speak now)',
  user_speaking: '🔴 You are speaking...',
  processing: '🧠 Thinking...',
  agent_speaking: '🗣️ Agent speaking (interrupt anytime)',
  error: '⚠️ Connection problem',
};

const LANGUAGES: Array<{ code: string; label: string }> = [
  { code: 'en-IN', label: 'English' },
  { code: 'hi-IN', label: 'हिन्दी (Hindi)' },
  { code: 'ta-IN', label: 'தமிழ் (Tamil)' },
  { code: 'te-IN', label: 'తెలుగు (Telugu)' },
  { code: 'kn-IN', label: 'ಕನ್ನಡ (Kannada)' },
  { code: 'ml-IN', label: 'മലയാളം (Malayalam)' },
  { code: 'mr-IN', label: 'मराठी (Marathi)' },
  { code: 'bn-IN', label: 'বাংলা (Bengali)' },
];

export const SarvamVoiceWidget: React.FC<SarvamVoiceWidgetProps> = ({ isOpen, onClose }) => {
  const [callDuration, setCallDuration] = useState(0);
  const [turnState, setTurnState] = useState<TurnState>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [language, setLanguage] = useState('en-IN');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [interim, setInterim] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const chatRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<VoiceClient | null>(null);

  const addMessage = useCallback((sender: 'ai' | 'user', text: string) => {
    setMessages(prev => [
      ...prev,
      {
        id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

  // The language is baked into the agent's STT/TTS at dispatch, so changing it
  // starts a fresh call rather than mutating a running pipeline.
  useEffect(() => {
    if (!isOpen) return;

    setCallDuration(0);
    setMessages([]);
    setInterim('');
    setErrorMessage('');
    setTurnState('connecting');

    const timer = setInterval(() => setCallDuration(p => p + 1), 1000);

    const client = new VoiceClient({
      apiBaseUrl: API_BASE_URL,
      callerId: getStoredCallerId(),
      language,
      onStateChange: setTurnState,
      onUserMessage: (text) => { setInterim(''); addMessage('user', text); },
      onAgentMessage: (text) => addMessage('ai', text),
      onInterim: setInterim,
      onError: setErrorMessage,
    });

    clientRef.current = client;
    client.connect();

    return () => {
      clearInterval(timer);
      client.disconnect();
      clientRef.current = null;
    };
  }, [isOpen, language, addMessage]);

  useEffect(() => { clientRef.current?.setMuted(isMuted); }, [isMuted]);
  useEffect(() => { clientRef.current?.setSpeakerMuted(isSpeakerMuted); }, [isSpeakerMuted]);

  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, interim]);

  const sendText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    addMessage('user', trimmed);
    clientRef.current?.sendText(trimmed);
    setTextInput('');
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  const isAgentSpeaking = turnState === 'agent_speaking';
  const isUserSpeaking = turnState === 'user_speaking';
  const isProcessing = turnState === 'processing';

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">

        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="w-96 bg-[#121316]/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[480px] text-white"
          >
            {/* Header */}
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="font-bold text-xs text-slate-200">Sarvam Live Assistant</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  title="Changing language restarts the call"
                  className="bg-slate-800 text-[11px] text-slate-300 rounded-lg px-2 py-1 focus:outline-none border border-slate-700 cursor-pointer"
                >
                  {LANGUAGES.map(l => (
                    <option key={l.code} value={l.code}>{l.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Turn state */}
            <div className="py-4 px-4 bg-slate-950/80 border-b border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    {(isAgentSpeaking || isUserSpeaking) && (
                      <div className={`absolute w-10 h-10 rounded-full animate-ping ${
                        isUserSpeaking ? 'bg-emerald-500/30' : 'bg-indigo-500/30'
                      }`}></div>
                    )}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md ${
                      isUserSpeaking ? 'bg-emerald-600' : 'bg-indigo-600'
                    }`}>
                      <Disc className={`w-5 h-5 ${isAgentSpeaking ? 'animate-spin' : ''}`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{STATE_LABEL[turnState]}</p>
                    <p className="text-[10px] text-slate-400">LiveKit · Pipecat · Sarvam</p>
                  </div>
                </div>

                <div className="flex items-end gap-1 h-5">
                  {[0.5, 1, 0.7, 1, 0.8, 0.6].map((scale, idx) => (
                    <motion.div
                      key={idx}
                      animate={
                        isAgentSpeaking || isUserSpeaking
                          ? { height: [`${20 * scale + 15}%`, `${90 * scale}%`, `${20 * scale + 15}%`] }
                          : { height: '20%' }
                      }
                      transition={
                        isAgentSpeaking || isUserSpeaking
                          ? { duration: 0.35 + idx * 0.05, repeat: Infinity, repeatType: 'reverse' }
                          : { duration: 0.2 }
                      }
                      className={`w-1 rounded-full ${
                        isAgentSpeaking ? 'bg-indigo-400' : isUserSpeaking ? 'bg-emerald-400' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {interim && (
                <div className="px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-200 text-xs animate-pulse">
                  " {interim} ... "
                </div>
              )}

              {errorMessage && (
                <div className="px-3 py-1.5 bg-rose-500/15 border border-rose-500/30 rounded-lg text-rose-300 text-[11px] flex items-start gap-1.5">
                  <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Transcript */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/40">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                    msg.sender === 'user' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                  }`}>
                    {msg.sender === 'user' ? <User className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                  </div>
                  <div className={`rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-200 border border-slate-700/60'
                  }`}>
                    <p>{msg.text}</p>
                  </div>
                </div>
              ))}

              {isProcessing && (
                <div className="flex gap-2 max-w-[85%]">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center bg-indigo-600 text-white shrink-0">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <div className="rounded-2xl px-3 py-2.5 bg-slate-800 border border-slate-700/60 flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                        className="w-1.5 h-1.5 rounded-full bg-slate-400"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {['What is IntelliForm AI?', 'Which languages do you support?', 'How do I upload a form?'].map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendText(q)}
                    className="bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-slate-700 px-2.5 py-0.5 rounded-full text-[10px] shrink-0 transition-all cursor-pointer"
                  >
                    {q}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => { e.preventDefault(); sendText(textInput); }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Speak directly or type a question..."
                  className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3.5 py-2 rounded-xl font-medium cursor-pointer"
                >
                  Send
                </button>
              </form>
            </div>
          </motion.div>
        )}

        {/* Pill bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f1013] border border-slate-800 rounded-full px-4 py-2.5 shadow-2xl flex items-center gap-4 text-white hover:border-slate-700 transition-all"
        >
          <div onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-3 cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
              <Disc className={`w-5 h-5 ${isUserSpeaking ? 'text-emerald-400' : 'text-indigo-400'} ${isAgentSpeaking ? 'animate-spin' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-slate-100">Sarvam Voice Assistant</span>
                {!isExpanded && <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-white" />}
              </div>
              <span className="font-mono text-[11px] text-slate-400 font-semibold block">
                {formatDuration(callDuration)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <button
              onClick={() => setIsMuted(m => !m)}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                isMuted ? 'bg-rose-500/20 text-rose-400' : 'text-slate-400 hover:text-white'
              }`}
              title={isMuted ? 'Unmute mic' : 'Mute mic'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsSpeakerMuted(s => !s)}
              className={`p-1.5 rounded-full transition-all cursor-pointer ${
                isSpeakerMuted ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
              title={isSpeakerMuted ? 'Unmute speaker' : 'Mute speaker'}
            >
              {isSpeakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="bg-black hover:bg-slate-900 border border-slate-800 text-white font-medium text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-md cursor-pointer transition-all hover:scale-105"
            >
              <PhoneOff className="w-3.5 h-3.5 text-rose-500" />
              <span>End Call</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
