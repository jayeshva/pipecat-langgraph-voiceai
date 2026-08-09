import React, { useState, useEffect } from 'react';
import {
  Layers,
  Bot,
  RefreshCw,
  PhoneCall,
  MessageSquare,
  Wrench,
  ChevronDown,
  ChevronRight,
  Zap,
  Cpu,
  CheckCircle2,
} from 'lucide-react';
import type { AgentMetadata, MCPToolsSummary } from '../types';
import { getAgentsList, getMCPTools } from '../services/api';

interface AgentsExplorerProps {
  setActiveTab?: (tab: string) => void;
}

export const AgentsExplorer: React.FC<AgentsExplorerProps> = ({ setActiveTab }) => {
  const [agents, setAgents] = useState<AgentMetadata[]>([]);
  const [mcpSummary, setMcpSummary] = useState<MCPToolsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [expandedPrompts, setExpandedPrompts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [agList, toolsSum] = await Promise.all([
        getAgentsList(),
        getMCPTools().catch(() => null),
      ]);
      setAgents(agList);
      setMcpSummary(toolsSum);
    } finally {
      setLoading(false);
    }
  };

  const togglePrompt = (agentId: string) => {
    setExpandedPrompts((prev) => ({ ...prev, [agentId]: !prev[agentId] }));
  };

  const langgraphCount = agents.filter((a) => a.is_langgraph).length;
  const pipecatCount = agents.length - langgraphCount;

  return (
    <div className="w-full max-w-[1850px] mx-auto px-4 sm:px-8 py-6 font-sans space-y-6">
      {/* Top Banner Header */}
      <div className="cmd-card p-6 border-sky-500/20 shadow-[0_0_30px_rgba(56,189,248,0.05)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <h1 className="text-lg font-bold text-slate-100 font-mono">
              Universal Agent Registry
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Inspect, manage, and dispatch real-time LangGraph StateGraph runnables and Pipecat multi-agent voice pipelines.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-2 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{agents.length} Agents Registered</span>
          </div>

          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-400 hover:text-sky-300 font-bold flex items-center space-x-1.5 transition-all active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Registry</span>
          </button>
        </div>
      </div>

      {/* Framework Summary Statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="cmd-subcard p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400">Total Registered Agents</span>
            <div className="text-xl font-bold text-slate-100 font-mono">{agents.length}</div>
          </div>
          <Bot className="w-8 h-8 text-sky-400/50" />
        </div>

        <div className="cmd-subcard p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400">LangGraph StateGraph Agents</span>
            <div className="text-xl font-bold text-purple-300 font-mono">{langgraphCount}</div>
          </div>
          <Cpu className="w-8 h-8 text-purple-400/50" />
        </div>

        <div className="cmd-subcard p-4 flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-slate-400">Pipecat Multi-Agent Pipelines</span>
            <div className="text-xl font-bold text-emerald-300 font-mono">{pipecatCount}</div>
          </div>
          <Zap className="w-8 h-8 text-emerald-400/50" />
        </div>
      </div>

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {agents.map((agent) => {
          const isPromptExpanded = !!expandedPrompts[agent.agent_id];
          const specificTools = mcpSummary?.agent_specific?.[agent.agent_id] || [];
          const commonTools = mcpSummary?.common || [];

          return (
            <div
              key={agent.agent_id}
              className="cmd-card p-6 flex flex-col justify-between space-y-5 border-slate-800 hover:border-slate-700 transition-all shadow-md"
            >
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <Bot className="w-5 h-5 text-sky-400" />
                      <h2 className="text-sm font-bold text-slate-100 font-mono">{agent.name}</h2>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">ID: '{agent.agent_id}'</span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold border ${
                      agent.is_langgraph
                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                        : 'bg-sky-500/10 text-sky-300 border-sky-500/30'
                    }`}
                  >
                    {agent.is_langgraph ? 'LANGGRAPH REACT' : 'PIPECAT VOICE'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-300 leading-relaxed font-medium">
                  {agent.description}
                </p>

                {/* Bound MCP Tools */}
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Bound MCP Tools ({specificTools.length + commonTools.length}):</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                    {specificTools.map((t) => (
                      <span
                        key={t.name}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" /> {t.name}
                      </span>
                    ))}
                    {commonTools.map((t) => (
                      <span
                        key={t.name}
                        className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800"
                      >
                        {t.name} (common)
                      </span>
                    ))}
                  </div>
                </div>

                {/* Collapsible System Prompt Inspector */}
                <div className="pt-2 border-t border-slate-800">
                  <button
                    onClick={() => togglePrompt(agent.agent_id)}
                    className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-sky-300 transition-colors"
                  >
                    {isPromptExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    <span>{isPromptExpanded ? 'Hide System Prompt' : 'Inspect System Prompt & Directives'}</span>
                  </button>

                  {isPromptExpanded && (
                    <div className="mt-2.5 p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-purple-200 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
                      {agent.agent_id === 'weather_agent'
                        ? "You are a warm, friendly, natural human voice AI assistant.\nSpeak naturally like a real person talking on a phone call. Check conversation history first before executing tools."
                        : agent.agent_id === 'customer_support'
                        ? "You are an AI Customer Support Specialist for IntelliForm AI. Lookup account ACC-9901 and create support tickets as requested."
                        : agent.agent_id === 'form_collector'
                        ? "You are a structured Form Collector Agent. Collect user information step by step and save to form storage."
                        : "You are the default IntelliForm Welcome Agent. Welcome callers and guide them through available voice agents and MCP tools."}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setActiveTab && setActiveTab('playground')}
                  className="py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md active:scale-95"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Voice Playground</span>
                </button>

                <button
                  onClick={() => setActiveTab && setActiveTab('chat')}
                  className="py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition-all shadow-md active:scale-95"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat Studio</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
