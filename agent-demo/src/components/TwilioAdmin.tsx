import React, { useState, useEffect } from 'react';
import { PhoneCall, Activity, RefreshCw, CheckCircle2, Phone, Radio } from 'lucide-react';
import type { SystemHealthStatus, OutboundCall } from '../types';
import { getHealthStatus, placeOutboundCall, getOutboundCalls } from '../services/api';

export const TwilioAdmin: React.FC = () => {
  const [health, setHealth] = useState<SystemHealthStatus | null>(null);
  const [outboundCalls, setOutboundCalls] = useState<Record<string, OutboundCall>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Outbound Call Form State
  const [toNumber, setToNumber] = useState<string>('+12025550143');
  const [purpose, setPurpose] = useState<string>('Calling regarding your driving license application form update.');
  const [agentId, setAgentId] = useState<string>('welcome');
  const [dialing, setDialing] = useState<boolean>(false);
  const [callResult, setCallResult] = useState<any | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const h = await getHealthStatus();
      setHealth(h);
      const calls = await getOutboundCalls();
      setOutboundCalls(calls);
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-sky-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Radio className="w-6 h-6 text-sky-400" /> Twilio Telephony & System Admin Control Panel
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Diagnostics, Live Webhook Status, Answering Machine Detection (AMD), and Outbound Dialer.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold flex items-center space-x-2 border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Diagnostics</span>
        </button>
      </div>

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
        {/* Outbound Dialer Tool Form */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-5 border border-sky-500/20 space-y-4">
          <h3 className="text-sm font-semibold text-sky-400 flex items-center gap-2">
            <PhoneCall className="w-4 h-4" /> Place Outbound Phone Call
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
                <option value="weather_agent">weather_agent (LangChain Weather Agent + OpenWeatherMap MCP)</option>
                <option value="customer_support">customer_support (Customer Support + MCP)</option>
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

        {/* Live Outbound Calls Table */}
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
    </div>
  );
};
