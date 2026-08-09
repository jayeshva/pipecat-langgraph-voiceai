import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Bot,
  User,
  Wrench,
  RefreshCw,
  Layers,
  Terminal,
  Activity,
  Trash2,
  Zap,
  Mic,
  Volume2,
  Cpu,
  ChevronDown,
  ChevronRight,
  Filter,
} from 'lucide-react';
import type { AgentMetadata, ChatMessage, ToolLogItem } from '../types';
import { getAgentsList, sendChatMessage } from '../services/api';

export const ChatStudio: React.FC = () => {
  const [agents, setAgents] = useState<AgentMetadata[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>('weather_agent');
  const [callerId, setCallerId] = useState<string>('chat-user-01');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'agent',
      text: "Hello! I am your AI assistant. Send a text message to query live weather, customer support tickets, or form storage tools.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [toolLogs, setToolLogs] = useState<ToolLogItem[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Category Filter State
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedPayloads, setExpandedPayloads] = useState<Record<string, boolean>>({});

  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const toolLogBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchAgents();
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

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

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage;
    if (!query.trim() || loading) return;

    const userText = query.trim();
    if (!textToSend) setInputMessage('');

    const userMsgTime = new Date().toLocaleTimeString();
    const newHistory = [
      ...messages,
      {
        id: Date.now().toString(),
        sender: 'user' as const,
        text: userText,
        timestamp: userMsgTime,
      },
    ];

    setMessages(newHistory);
    setLoading(true);

    // Push initial user query event to activity log
    setToolLogs((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random(),
        toolName: 'User Query Received',
        toolArgs: { query: userText, agentId: selectedAgent, callerId },
        executedAt: userMsgTime,
        agentId: selectedAgent,
        status: 'success',
        category: 'stt',
      },
      {
        id: (Date.now() + 1).toString() + Math.random(),
        toolName: 'Agent Model Inference',
        toolArgs: { agentId: selectedAgent, status: 'Processing prompt graph...' },
        executedAt: userMsgTime,
        agentId: selectedAgent,
        status: 'success',
        category: 'llm',
      },
    ]);

    try {
      const apiMessages = newHistory
        .filter((m) => m.sender === 'user' || m.sender === 'agent')
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

      const res = await sendChatMessage(selectedAgent, callerId, apiMessages);

      const agentMsgTime = new Date().toLocaleTimeString();
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'agent',
          text: res.response,
          timestamp: agentMsgTime,
        },
      ]);

      // Add tool executions to the activity log
      if (res.tool_executions && res.tool_executions.length > 0) {
        const toolEvents: ToolLogItem[] = res.tool_executions.map((tex, idx) => ({
          id: `${Date.now()}-${idx}`,
          toolName: `Tool '${tex.tool_name}' Executed`,
          toolArgs: { args: tex.args, result: tex.result },
          executedAt: agentMsgTime,
          agentId: selectedAgent,
          status: 'success',
          category: 'mcp',
        }));
        setToolLogs((prev) => [...prev, ...toolEvents]);
      }

      // Push final response event to activity log
      setToolLogs((prev) => [
        ...prev,
        {
          id: Date.now().toString() + Math.random(),
          toolName: 'Response Generated',
          toolArgs: { text: res.response },
          executedAt: agentMsgTime,
          agentId: selectedAgent,
          status: 'success',
          category: 'tts',
        },
      ]);

    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          sender: 'system',
          text: `Chat Error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'agent',
        text: `Conversation cleared. Ready for new queries for '${selectedAgent}'.`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    setToolLogs([]);
  };

  const currentAgentObj = agents.find((a) => a.agent_id === selectedAgent);

  const samplePrompts = [
    "What is the current weather in Chennai?",
    "What is the weather in Mumbai?",
    "Lookup customer account ACC-9901",
    "Submit form feedback for registration",
  ];

  const getCategoryMeta = (cat?: string) => {
    switch (cat) {
      case 'stt':
        return {
          label: 'USER QUERY',
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
          label: 'AGENT RESPONSE',
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
      {/* 3-Column Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* COLUMN 1: LEFT — AGENT & THREAD CONTROL (4 cols = 33.3%) */}
        <div className="lg:col-span-4 cmd-card p-6 flex flex-col justify-between h-[730px]">
          <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Chat Agent Dispatcher
                </h2>
              </div>
              <button
                onClick={fetchAgents}
                className="p-1 rounded-lg bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors"
                title="Refresh Agents"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Target Agent Selector */}
            <div className="space-y-2">
              <label className="block text-[11px] font-mono text-slate-400">Target Chat Agent:</label>
              <select
                value={selectedAgent}
                onChange={(e) => setSelectedAgent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-medium focus:outline-none focus:border-sky-500 cursor-pointer"
              >
                {agents.map((ag) => (
                  <option key={ag.agent_id} value={ag.agent_id} className="bg-slate-950 text-slate-200">
                    {ag.name} ({ag.is_langgraph ? 'LangGraph' : 'LLM'})
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
                      {currentAgentObj.is_langgraph ? 'LANGGRAPH REACT' : 'LLM + MCP'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">{currentAgentObj.description}</p>
                </div>
              )}
            </div>

            {/* Thread ID Config */}
            <div className="space-y-1.5 text-xs font-mono">
              <label className="text-slate-400 block text-[10px]">Conversation Thread ID:</label>
              <input
                type="text"
                value={callerId}
                onChange={(e) => setCallerId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-200 text-xs"
              />
            </div>

            {/* Quick Sample Prompts */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-[11px] font-mono text-slate-400 block">Suggested Prompts:</label>
              <div className="space-y-1.5">
                {samplePrompts.map((promptText, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(promptText)}
                    disabled={loading}
                    className="w-full text-left p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/90 text-[11px] text-slate-300 hover:text-sky-300 transition-colors flex items-center justify-between group"
                  >
                    <span className="truncate">{promptText}</span>
                    <Sparkles className="w-3 h-3 text-slate-600 group-hover:text-sky-400 shrink-0 ml-1" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Clear Chat Button */}
          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleClearChat}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-300 text-xs font-semibold flex items-center justify-center space-x-2 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Chat History</span>
            </button>
          </div>
        </div>

        {/* COLUMN 2: CENTER — TEXT CHAT WORKSPACE (4 cols = 33.3%) */}
        <div className="lg:col-span-4 cmd-card p-6 flex flex-col justify-between h-[730px] border-sky-500/30">
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-sky-400" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-100">
                Text Model Access Workspace
              </h2>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-sky-400">
              REST / REST API Stream
            </span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto py-4 space-y-3.5 pr-1">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.sender === 'system' && (
                  <div className="w-full text-center py-1.5 px-3 text-[10px] font-mono text-amber-300 bg-amber-500/10 rounded-lg border border-amber-500/20">
                    ⚠️ {msg.text} <span className="text-slate-500">({msg.timestamp})</span>
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
                      <Bot className="w-3 h-3 text-purple-400" /> {selectedAgent.toUpperCase()} AGENT
                      <span className="text-slate-500 font-normal">({msg.timestamp})</span>
                    </div>
                    <p className="leading-relaxed text-slate-200 font-medium">{msg.text}</p>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center space-x-2 text-xs font-mono text-sky-400 bg-slate-950/80 p-3 rounded-xl border border-sky-500/20 animate-pulse">
                <Activity className="w-4 h-4 animate-spin text-sky-400" />
                <span>Agent processing query & invoking MCP tools...</span>
              </div>
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Text Input Composer Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="pt-3 border-t border-slate-800 flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
              placeholder="Ask weather, support tickets, or form storage queries..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 font-medium"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition-all flex items-center space-x-1.5 shadow-md"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* COLUMN 3: RIGHT — HIGH-TECH AGENT & PIPELINE ACTIVITY CONSOLE (4 cols = 33.3%) */}
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
                { id: 'stt', label: '💬 QUERY' },
                { id: 'llm', label: '🧠 LLM' },
                { id: 'mcp', label: '🛠️ MCP' },
                { id: 'tts', label: '🔊 RESPONSE' },
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
                <p className="text-xs font-bold text-slate-300">No activity events logged yet.</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Send a query like "What is the weather in Chennai?" to stream model reasoning and tool executions live.
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const meta = getCategoryMeta(log.category);
                const isExpanded = !!expandedPayloads[log.id];

                const detailText =
                  typeof log.toolArgs?.query === 'string'
                    ? log.toolArgs.query
                    : typeof log.toolArgs?.text === 'string'
                    ? log.toolArgs.text
                    : typeof log.toolArgs?.detail === 'string'
                    ? log.toolArgs.detail
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
            <span className="flex items-center gap-1 text-purple-300 font-medium">
              <Zap className="w-3 h-3 text-purple-400" /> Chat Tool Execution Engine
            </span>
            <span className="text-slate-500">REST Stream Channel</span>
          </div>
        </div>

      </div>
    </div>
  );
};
