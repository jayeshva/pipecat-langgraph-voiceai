import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PhoneOff, Mic, MicOff, Volume2, VolumeX, Sparkles, 
  Globe, User, Loader2, AlertCircle, RefreshCw
} from 'lucide-react';

interface AICallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export const AICallModal: React.FC<AICallModalProps> = ({ isOpen, onClose }) => {
  const [sessionId, setSessionId] = useState<string>('');
  const [callDuration, setCallDuration] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error' | 'disconnected'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [selectedLang, setSelectedLang] = useState('English');
  const [aiState, setAiState] = useState<'listening' | 'thinking' | 'speaking'>('listening');
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcriptInput, setTranscriptInput] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Realtime Call Session
  useEffect(() => {
    let timerInterval: any = null;

    if (isOpen) {
      setConnectionStatus('connecting');
      setCallDuration(0);
      setMessages([]);

      timerInterval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      connectWebSocket();
    } else {
      closeCallSession();
    }

    return () => {
      clearInterval(timerInterval);
      closeCallSession();
    };
  }, [isOpen]);

  // Connect WebSocket & Start Continuous Media Stream + Speech Recognition
  const connectWebSocket = () => {
    setConnectionStatus('connecting');
    const wsUrl = "ws://localhost:8000/api/v1/welcome-agent/ws";

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[Sarvam Realtime WS] WebSocket Connection Established.");
        setConnectionStatus('connected');
        
        // 1. Start continuous microphone audio chunk streaming (client.media.audio_chunk)
        startMicrophoneStream(ws);

        // 2. Start browser speech recognition for hands-free transcript
        initSpeechRecognition();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleServerFrame(data);
        } catch (err) {
          console.error("Error parsing WS frame:", err);
        }
      };

      ws.onclose = () => {
        console.log("[Sarvam Realtime WS] Connection closed.");
        setConnectionStatus('disconnected');
      };

      ws.onerror = (err) => {
        console.error("[Sarvam Realtime WS] Connection Error:", err);
        setConnectionStatus('error');
      };
    } catch (err) {
      console.error("Failed to construct WebSocket:", err);
      setConnectionStatus('error');
    }
  };

  // Close Call Session
  const closeCallSession = () => {
    stopSpeechRecognition();
    stopMicrophoneStream();

    if (wsRef.current) {
      try {
        wsRef.current.send(JSON.stringify({ type: "client.end_call", origin: "client" }));
        wsRef.current.close();
      } catch (_) {}
      wsRef.current = null;
    }
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
  };

  // Continuous Microphone Audio Chunking (client.media.audio_chunk)
  const startMicrophoneStream = async (ws: WebSocket) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (e) => {
        if (e.data.size > 0 && ws.readyState === WebSocket.OPEN && !isMuted) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64Audio = (reader.result as string).split(',')[1];
            if (base64Audio) {
              // Exact Sarvam Realtime Audio Chunk Protocol frame
              const frame = {
                type: "client.media.audio_chunk",
                origin: "client",
                timestamp: Date.now() / 1000,
                audio_base64: base64Audio,
                format: "audio/wav",
                sample_rate: 16000
              };
              ws.send(JSON.stringify(frame));
            }
          };
          reader.readAsDataURL(e.data);
        }
      };

      // Slice audio stream every 100ms into realtime audio chunks
      mediaRecorder.start(100);
    } catch (err) {
      console.warn("Microphone access error:", err);
    }
  };

  const stopMicrophoneStream = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      } catch (_) {}
      mediaRecorderRef.current = null;
    }
  };

  // Web Speech Recognition for Hands-Free Voice Transcript
  const initSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      const langMap: Record<string, string> = {
        'Tamil': 'ta-IN',
        'Hindi': 'hi-IN',
        'Telugu': 'te-IN',
        'Kannada': 'kn-IN',
        'Malayalam': 'ml-IN',
        'Marathi': 'mr-IN',
        'Gujarati': 'gu-IN',
        'Bengali': 'bn-IN',
        'Punjabi': 'pa-IN',
        'English': 'en-US',
      };
      recognition.lang = langMap[selectedLang] || 'en-US';

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            currentInterim += transcript;
          }
        }

        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }

        if (finalTranscript.trim()) {
          setInterimTranscript('');
          handleSendUserMessage(finalTranscript.trim());
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn("Speech recognition error:", event.error);
        }
      };

      recognition.onend = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && !isMuted) {
          try { recognition.start(); } catch (_) {}
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Speech recognition init error:", err);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      recognitionRef.current = null;
    }
  };

  // Handle incoming Server WebSocket frames
  const handleServerFrame = (data: any) => {
    const frameType = data.type;

    if (frameType === "server.welcome") {
      setSessionId(data.session_id || "");
      if (data.text) {
        addMessage('ai', data.text);
      }
    } 
    else if (frameType === "server.state_change") {
      setAiState(data.state || "listening");
    }
    else if (frameType === "server.transcript_delta") {
      if (data.text) {
        addMessage('ai', data.text);
      }
    }
    else if (frameType === "server.media.audio_chunk") {
      const audioB64 = data.audio_base64;
      if (audioB64 && !isSpeakerMuted) {
        playRealtimeAudioChunk(audioB64);
      }
    }
  };

  const addMessage = (sender: 'ai' | 'user', text: string) => {
    const newMsg: Message = {
      id: `${sender}-${Date.now()}`,
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, newMsg]);
  };

  // Play incoming Base64 Sarvam Audio Chunk & trigger turn handoff
  const playRealtimeAudioChunk = (audioBase64: string) => {
    try {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      const audio = new Audio(`data:audio/wav;base64,${audioBase64}`);
      currentAudioRef.current = audio;
      setAiState('speaking');

      audio.onended = () => {
        setAiState('listening');
      };
      audio.onerror = () => {
        setAiState('listening');
      };
      audio.play().catch(() => setAiState('listening'));
    } catch (err) {
      console.error("Error playing audio chunk:", err);
      setAiState('listening');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendUserMessage = (userText: string) => {
    if (!userText.trim() || connectionStatus !== 'connected') return;

    addMessage('user', userText);
    setTranscriptInput('');
    setInterimTranscript('');
    setAiState('thinking');

    // Send Realtime Frame over WebSocket to Python Agent
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "client.user_message",
        origin: "client",
        text: userText,
        language: selectedLang,
        timestamp: Date.now() / 1000
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div id="ai-call-overlay" className="fixed inset-0 bg-slate-950/85 backdrop-blur-lg z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[650px] text-white"
        >
          {/* Header Bar */}
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 shadow-lg shadow-indigo-500/20">
                <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-100">Sarvam AI Welcome Agent</h3>
                  {connectionStatus === 'connected' && (
                    <span className="flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      Voice Live Active
                    </span>
                  )}
                  {connectionStatus === 'connecting' && (
                    <span className="flex items-center gap-1 text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-medium">
                      <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                      Connecting...
                    </span>
                  )}
                  {(connectionStatus === 'error' || connectionStatus === 'disconnected') && (
                    <span className="flex items-center gap-1 text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-medium">
                      <AlertCircle className="w-3 h-3 text-rose-400" />
                      Disconnected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">Continuous Audio Chunking • Sarvam Protocol</p>
              </div>
            </div>

            {/* Language & Timer */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-slate-800/80 border border-slate-700/60 rounded-xl px-3 py-1.5 text-xs text-slate-300">
                <Globe className="w-3.5 h-3.5 text-indigo-400" />
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="English" className="bg-slate-900">English</option>
                  <option value="Tamil" className="bg-slate-900">தமிழ் (Tamil)</option>
                  <option value="Hindi" className="bg-slate-900">हिन्दी (Hindi)</option>
                  <option value="Telugu" className="bg-slate-900">తెలుగు (Telugu)</option>
                  <option value="Kannada" className="bg-slate-900">ಕನ್ನಡ (Kannada)</option>
                </select>
              </div>

              <div className="font-mono text-xs font-bold px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 rounded-xl">
                {formatDuration(callDuration)}
              </div>
            </div>
          </div>

          {/* MAIN CALL CONTAINER */}
          {connectionStatus === 'connecting' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/90">
              <div className="relative flex items-center justify-center mb-6">
                <div className="w-28 h-28 rounded-full bg-indigo-500/10 animate-ping absolute"></div>
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-600 to-emerald-500 p-1 shadow-2xl shadow-indigo-500/40 relative z-10 flex items-center justify-center">
                  <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  </div>
                </div>
              </div>
              <h4 className="text-base font-bold text-slate-100 mb-1">Connecting to Sarvam AI Welcome Agent...</h4>
              <p className="text-xs text-slate-400 max-w-sm">Opening WebSocket audio channel on <code className="text-indigo-300 font-mono">ws://localhost:8000/api/v1/welcome-agent/ws</code></p>
            </div>
          ) : connectionStatus === 'error' || connectionStatus === 'disconnected' ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950/90">
              <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-100 mb-1">Realtime Call Connection Failed</h4>
              <p className="text-xs text-slate-400 max-w-sm mb-6">Ensure your Python backend is running on port 8000 via <code className="text-slate-300 font-mono">npm run dev:backend-py</code></p>
              <button
                onClick={connectWebSocket}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Reconnect Call
              </button>
            </div>
          ) : (
            <>
              {/* Visualizer Area */}
              <div className="py-6 px-6 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 border-b border-slate-800 flex flex-col items-center justify-center relative">
                <div className="relative flex items-center justify-center">
                  {aiState === 'speaking' && (
                    <>
                      <div className="absolute w-36 h-36 rounded-full bg-indigo-500/20 animate-ping" style={{ animationDuration: '2s' }}></div>
                      <div className="absolute w-44 h-44 rounded-full bg-indigo-500/10 animate-ping" style={{ animationDuration: '3s' }}></div>
                    </>
                  )}

                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 via-indigo-600 to-emerald-500 p-1 shadow-xl shadow-indigo-500/30 relative z-10 flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center relative overflow-hidden">
                      <Sparkles className="w-10 h-10 text-indigo-400" />
                    </div>
                  </div>
                </div>

                {/* Audio Wave Visualizer */}
                <div className="flex items-center justify-center gap-1.5 mt-5 h-8">
                  {[40, 75, 55, 90, 60, 80, 45, 95, 50, 70, 40].map((h, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: aiState === 'speaking' ? [`${h}%`, `${Math.max(15, (h * 0.4))}%`, `${h}%`] : '20%',
                      }}
                      transition={{
                        duration: 0.4 + (i * 0.05),
                        repeat: Infinity,
                        repeatType: 'reverse'
                      }}
                      className={`w-1.5 rounded-full ${
                        aiState === 'speaking' ? 'bg-gradient-to-t from-indigo-500 to-emerald-400' :
                        aiState === 'thinking' ? 'bg-amber-400 animate-pulse' : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>

                <p className="mt-2 text-xs font-semibold text-slate-400 tracking-wide uppercase">
                  {aiState === 'speaking' && '🗣️ Agent Speaking...'}
                  {aiState === 'thinking' && '🧠 Agent Processing Turn...'}
                  {aiState === 'listening' && '🎙️ Listening (Speak now into mic)...'}
                </p>

                {interimTranscript && (
                  <div className="mt-2 px-3 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-200 text-xs animate-pulse">
                    " {interimTranscript} ... "
                  </div>
                )}
              </div>

              {/* Realtime Transcript Feed */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/60">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[85%] ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      msg.sender === 'user' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                    }`}>
                      {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    </div>

                    <div className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      msg.sender === 'user' 
                        ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30 rounded-tr-none' 
                        : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none'
                    }`}>
                      <p>{msg.text}</p>
                      <span className="text-[9px] text-slate-500 block mt-1 text-right">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Controls & Input */}
              <div className="p-4 bg-slate-900 border-t border-slate-800 space-y-3">
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
                  <span className="text-[10px] text-slate-500 shrink-0 font-medium">Ask Assistant:</span>
                  {[
                    "What is IntelliForm AI?",
                    "How does Sarvam AI work?",
                    "How to upload a PDF form?",
                    "What is Citizen Mode?"
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendUserMessage(q)}
                      className="bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-slate-700/60 px-3 py-1 rounded-full text-xs shrink-0 transition-all cursor-pointer"
                    >
                      {q}
                    </button>
                  ))}
                </div>

                <form 
                  onSubmit={(e) => { e.preventDefault(); handleSendUserMessage(transcriptInput); }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={transcriptInput}
                    onChange={(e) => setTranscriptInput(e.target.value)}
                    placeholder="Speak directly or type your question..."
                    className="flex-1 bg-slate-950 border border-slate-700/80 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                  <button
                    type="submit"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    Send
                  </button>
                </form>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const newMuted = !isMuted;
                        setIsMuted(newMuted);
                        if (newMuted) {
                          stopSpeechRecognition();
                        } else {
                          initSpeechRecognition();
                        }
                      }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border text-xs transition-all cursor-pointer ${
                        isMuted 
                          ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                      title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                    >
                      {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsSpeakerMuted(!isSpeakerMuted);
                        if (currentAudioRef.current) currentAudioRef.current.pause();
                      }}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border text-xs transition-all cursor-pointer ${
                        isSpeakerMuted 
                          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                      title={isSpeakerMuted ? "Unmute AI Speaker" : "Mute AI Speaker"}
                    >
                      {isSpeakerMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    className="bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                  >
                    <PhoneOff className="w-4 h-4" />
                    End Call
                  </button>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
