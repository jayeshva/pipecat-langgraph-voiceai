import React, { useState, useEffect } from 'react';
import { PhoneCall, Activity, RefreshCw, CheckCircle2, Phone, Radio, Server, Copy, Check } from 'lucide-react';
import type { SystemHealthStatus, OutboundCall } from '../types';
import { getHealthStatus, placeOutboundCall, getOutboundCalls, getAsteriskConfig, triggerAsteriskCall } from '../services/api';

export const TwilioAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'twilio' | 'asterisk'>('twilio');
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [outboundCalls, setOutboundCalls] = useState<Record<string, OutboundCall>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Twilio Outbound Call Form State
  const [toNumber, setToNumber] = useState<string>('+12025550143');
  const [purpose, setPurpose] = useState<string>('Calling regarding your driving license application form update.');
  const [agentId, setAgentId] = useState<string>('welcome');
  const [dialing, setDialing] = useState<boolean>(false);
  const [callResult, setCallResult] = useState<any | null>(null);

  // Asterisk SIP Control State
  const [asteriskConfig, setAsteriskConfig] = useState<any | null>(null);
  const [astExtension, setAstExtension] = useState<string>('1001');
  const [astAgentId, setAstAgentId] = useState<string>('welcome');
  const [astDialing, setAstDialing] = useState<boolean>(false);
  const [astResult, setAstResult] = useState<any | null>(null);
  const [copiedPjsip, setCopiedPjsip] = useState<boolean>(false);
  const [copiedExt, setCopiedExt] = useState<boolean>(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const h = await getHealthStatus();
      setHealth(h);
      const calls = await getOutboundCalls().catch(() => ({}));
      setOutboundCalls(calls);
      const astConf = await getAsteriskConfig().catch(() => null);
      setAsteriskConfig(astConf);
    } catch (e) {
      console.error('Could not fetch admin data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleDialCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setDialing(true);
    setCallResult(null);
    try {
      const res = await placeOutboundCall(toNumber, purpose, agentId);
      setCallResult(res);
      fetchData();
    } catch (err: any) {
      setCallResult({ error: err.message });
    } finally {
      setDialing(false);
    }
  };

  const handleAsteriskCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setAstDialing(true);
    setAstResult(null);
    try {
      const res = await triggerAsteriskCall(astExtension, astAgentId);
      setAstResult(res);
    } catch (err: any) {
      setAstResult({ error: err.message });
    } finally {
      setAstDialing(false);
    }
  };

  const copyToClipboard = (text: string, type: 'pjsip' | 'ext') => {
    navigator.clipboard.writeText(text);
    if (type === 'pjsip') {
      setCopiedPjsip(true);
      setTimeout(() => setCopiedPjsip(false), 2000);
    } else {
      setCopiedExt(true);
      setTimeout(() => setCopiedExt(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-sky-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Radio className="w-6 h-6 text-sky-400" /> Enterprise Telephony & SIP PBX Center
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage Twilio Telephony Webhooks & Asterisk PJSIP / AudioSocket Media Streams in real time.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Sub-Tab Navigation */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 space-x-1">
            <button
              onClick={() => setActiveTab('twilio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'twilio'
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              📞 Twilio Telephony
            </button>
            <button
              onClick={() => setActiveTab('asterisk')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'asterisk'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⭐ Asterisk PJSIP & AudioSocket
            </button>
          </div>

          <button
            onClick={fetchData}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold flex items-center space-x-2 border border-slate-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {activeTab === 'twilio' ? (
        <>
          {/* Backend Health Diagnostics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-xl p-4 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>SARVAM AI ENGINE</span>
                <CheckCircle2 className={`w-4 h-4 ${health?.sarvam_configured ? 'text-emerald-400' : 'text-amber-400'}`} />
              </div>
              <p className="text-base font-bold text-slate-100">
                {health?.sarvam_configured ? 'Configured & Ready' : 'API Key Missing'}
              </p>
              <p className="text-[11px] font-mono text-slate-500">STT saarika:v2.5 / TTS bulbul:v3</p>
            </div>

            <div className="glass-card rounded-xl p-4 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>LIVEKIT WEBRTC</span>
                <CheckCircle2 className={`w-4 h-4 ${health?.livekit_configured ? 'text-emerald-400' : 'text-amber-400'}`} />
              </div>
              <p className="text-base font-bold text-slate-100">
                {health?.livekit_configured ? 'Configured & Ready' : 'Mock Mode'}
              </p>
              <p className="text-[11px] font-mono text-slate-500">FastAPI JWT Token Minter</p>
            </div>

            <div className="glass-card rounded-xl p-4 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>TWILIO TELEPHONY</span>
                <CheckCircle2 className={`w-4 h-4 ${health?.twilio_configured ? 'text-emerald-400' : 'text-amber-400'}`} />
              </div>
              <p className="text-base font-bold text-slate-100">
                {health?.twilio_configured ? 'Public Host Ready' : 'Hostname Missing'}
              </p>
              <p className="text-[11px] font-mono text-slate-500">Media Streams WebSockets</p>
            </div>

            <div className="glass-card rounded-xl p-4 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>PUBLIC HOSTNAME</span>
                <Radio className="w-4 h-4 text-sky-400 animate-pulse" />
              </div>
              <p className="text-sm font-mono font-bold text-sky-300 truncate">
                {health?.config.public_hostname || 'localhost:8080'}
              </p>
              <p className="text-[11px] font-mono text-slate-500">Twilio Media Stream URL</p>
            </div>
          </div>

          {/* Outbound Dialer & Call Monitor Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 glass-panel rounded-2xl p-5 border border-sky-500/20 space-y-4">
              <h3 className="text-sm font-semibold text-sky-400 flex items-center gap-2">
                <PhoneCall className="w-4 h-4" /> Place Outbound Twilio Phone Call
              </h3>

              <form onSubmit={handleDialCall} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">To Phone Number (E.164 format):</label>
                  <input
                    type="text"
                    value={toNumber}
                    onChange={(e) => setToNumber(e.target.value)}
                    placeholder="+12025550143"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Deploy Agent ID:</label>
                  <select
                    value={agentId}
                    onChange={(e) => setAgentId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 font-medium"
                  >
                    <option value="welcome">welcome (IntelliForm Welcome Agent)</option>
                    <option value="weather_agent">weather_agent (LangChain Weather Agent)</option>
                    <option value="customer_support">customer_support (Customer Support)</option>
                    <option value="form_collector">form_collector (LangGraph Form Collector)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Call Purpose Instruction:</label>
                  <textarea
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    rows={3}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={dialing}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs transition-all flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(56,189,248,0.3)]"
                >
                  <Phone className="w-4 h-4" />
                  <span>{dialing ? 'Initiating Dialing...' : 'Dial Citizen Number'}</span>
                </button>
              </form>

              {callResult && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                  <p className="text-sky-300 font-bold mb-1">Dial Response:</p>
                  <pre className="text-slate-300 overflow-x-auto">{JSON.stringify(callResult, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="lg:col-span-7 glass-panel rounded-2xl p-5 border border-sky-500/20 space-y-4">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-sky-400" /> Recent Outbound Call Sessions
              </h3>

              {Object.keys(outboundCalls).length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs space-y-1">
                  <p>No active outbound call records in memory.</p>
                  <p className="text-slate-600">Dial a number using the left form to see real-time call states.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto">
                  {Object.entries(outboundCalls).map(([id, call]) => (
                    <div key={id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-sky-300">{call.to}</span>
                        <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          {call.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-400">{call.purpose}</p>
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-850">
                        <span>Agent: {call.agent_id}</span>
                        <span>Age: {call.age_seconds}s ago</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        /* Asterisk SIP & AudioSocket Control Panel */
        <div className="space-y-6">
          {/* Asterisk Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="glass-card rounded-xl p-4 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>ASTERISK SIP SERVER</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-base font-bold text-slate-100">{asteriskConfig?.asterisk_host || '127.0.0.1'}</p>
              <p className="text-[11px] font-mono text-slate-500">PJSIP UDP Port: {asteriskConfig?.sip_port || 5060}</p>
            </div>

            <div className="glass-card rounded-xl p-4 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>ASTERISK AMI PORT</span>
                <Server className="w-4 h-4 text-indigo-400" />
              </div>
              <p className="text-base font-bold text-slate-100">Port {asteriskConfig?.ami_port || 5038}</p>
              <p className="text-[11px] font-mono text-slate-500">Manager Interface Originate</p>
            </div>

            <div className="glass-card rounded-xl p-4 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>AUDIOSOCKET MEDIA</span>
                <Radio className="w-4 h-4 text-indigo-400 animate-pulse" />
              </div>
              <p className="text-base font-bold text-slate-100">Active (PCM 16kHz)</p>
              <p className="text-[11px] font-mono text-slate-500">Low-Latency Audio Streaming</p>
            </div>

            <div className="glass-card rounded-xl p-4 border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                <span>WEBSOCKET PATH</span>
                <Activity className="w-4 h-4 text-sky-400" />
              </div>
              <p className="text-xs font-mono font-bold text-sky-300 truncate">
                {asteriskConfig?.websocket_url || 'ws://localhost:8080/api/v1/asterisk/ws'}
              </p>
              <p className="text-[11px] font-mono text-slate-500">Asterisk Call Endpoint</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Outbound Asterisk AMI Call Form */}
            <div className="lg:col-span-4 glass-panel rounded-2xl p-5 border border-indigo-500/20 space-y-4">
              <h3 className="text-sm font-semibold text-indigo-300 flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-indigo-400" /> Originate Asterisk Call (AMI)
              </h3>

              <form onSubmit={handleAsteriskCall} className="space-y-3 text-xs">
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Target Extension / Phone:</label>
                  <input
                    type="text"
                    value={astExtension}
                    onChange={(e) => setAstExtension(e.target.value)}
                    placeholder="1001 or +919876543210"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-mono mb-1">Target Agent ID:</label>
                  <select
                    value={astAgentId}
                    onChange={(e) => setAstAgentId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 font-medium"
                  >
                    <option value="welcome">welcome (IntelliForm Welcome Agent)</option>
                    <option value="form_collector">form_collector (LangGraph Form Collector)</option>
                    <option value="weather_agent">weather_agent (LangChain Weather Agent)</option>
                    <option value="customer_support">customer_support (Customer Support)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={astDialing}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs transition-all flex items-center justify-center space-x-2 shadow-[0_0_20px_rgba(99,102,241,0.3)]"
                >
                  <Phone className="w-4 h-4" />
                  <span>{astDialing ? 'Initiating Call...' : 'Originate Asterisk Call'}</span>
                </button>
              </form>

              {astResult && (
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
                  <p className="text-indigo-300 font-bold mb-1">AMI Call Dispatched:</p>
                  <pre className="text-slate-300 overflow-x-auto">{JSON.stringify(astResult, null, 2)}</pre>
                </div>
              )}
            </div>

            {/* Generated Asterisk Configuration Snippets */}
            <div className="lg:col-span-8 space-y-4">
              {/* pjsip.conf Card */}
              <div className="glass-panel rounded-2xl p-5 border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-mono text-indigo-300 flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-400" /> Asterisk pjsip.conf Template
                  </h4>
                  <button
                    onClick={() => copyToClipboard(asteriskConfig?.pjsip_conf || '', 'pjsip')}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 text-xs font-mono flex items-center space-x-1.5 border border-slate-700"
                  >
                    {copiedPjsip ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPjsip ? 'Copied!' : 'Copy pjsip.conf'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-850 text-slate-300 text-[11px] font-mono overflow-x-auto max-h-48">
                  {asteriskConfig?.pjsip_conf || 'Loading pjsip.conf...'}
                </pre>
              </div>

              {/* extensions.conf Card */}
              <div className="glass-panel rounded-2xl p-5 border border-indigo-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold font-mono text-sky-300 flex items-center gap-2">
                    <Radio className="w-4 h-4 text-sky-400" /> Asterisk extensions.conf Dialplan
                  </h4>
                  <button
                    onClick={() => copyToClipboard(asteriskConfig?.extensions_conf || '', 'ext')}
                    className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-mono flex items-center space-x-1.5 border border-slate-700"
                  >
                    {copiedExt ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedExt ? 'Copied!' : 'Copy extensions.conf'}</span>
                  </button>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-850 text-slate-300 text-[11px] font-mono overflow-x-auto max-h-48">
                  {asteriskConfig?.extensions_conf || 'Loading extensions.conf...'}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
