import React, { useState, useEffect } from 'react';
import { Wrench, Server, Play, RefreshCw, Terminal } from 'lucide-react';
import type { MCPToolsSummary, MCPServerInfo } from '../types';
import { getMCPTools, executeMCPTool } from '../services/api';

export const MCPExplorer: React.FC = () => {
  const [toolsData, setToolsData] = useState<MCPToolsSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTool, setSelectedTool] = useState<{ name: string; description: string; scope: string } | null>(null);
  const [testArgsJson, setTestArgsJson] = useState<string>('{}');
  const [testResult, setTestResult] = useState<any | null>(null);
  const [executing, setExecuting] = useState<boolean>(false);
  const [scopeFilter, setScopeFilter] = useState<string>('all');

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    setLoading(true);
    try {
      const data = await getMCPTools();
      setToolsData(data);
      if (data.common.length > 0) {
        setSelectedTool(data.common[0]);
      }
    } catch (e) {
      console.error('Could not load MCP tools:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTool = (tool: { name: string; description: string; scope: string }) => {
    setSelectedTool(tool);
    setTestResult(null);
    if (tool.name === 'create_support_ticket') {
      setTestArgsJson(JSON.stringify({ subject: 'Need help with driving license form', priority: 'high' }, null, 2));
    } else if (tool.name === 'search_knowledge_base') {
      setTestArgsJson(JSON.stringify({ query: 'operating hours' }, null, 2));
    } else if (tool.name === 'hangup_call') {
      setTestArgsJson(JSON.stringify({ reason: 'user_requested' }, null, 2));
    } else {
      setTestArgsJson('{}');
    }
  };

  const handleTestExecute = async () => {
    if (!selectedTool) return;
    setExecuting(true);
    try {
      const parsedArgs = JSON.parse(testArgsJson);
      const res = await executeMCPTool(selectedTool.name, parsedArgs, selectedTool.scope);
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ status: 'error', error: e.message });
    } finally {
      setExecuting(false);
    }
  };

  const mockServers: MCPServerInfo[] = [
    { name: 'system_clock_server', transport: 'stdio', scopes: ['common'], enabled: true },
    { name: 'crm_database_server', transport: 'sse', scopes: ['customer_support', 'sales_agent'], enabled: true },
    { name: 'form_storage_server', transport: 'stdio', scopes: ['form_collector'], enabled: true },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border border-sky-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-sky-400" /> Model Context Protocol (MCP) Manager
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Scoped multi-tenant tool registry & external MCP server loader (`mcp_servers.json`).
          </p>
        </div>
        <button
          onClick={fetchTools}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 text-xs font-semibold flex items-center space-x-2 border border-slate-700"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Reload Registry</span>
        </button>
      </div>

      {/* External MCP Servers Table */}
      <div className="glass-panel rounded-2xl p-5 border border-sky-500/20 space-y-4">
        <h3 className="text-sm font-semibold text-sky-400 flex items-center gap-2">
          <Server className="w-4 h-4" /> Registered External MCP Servers (`mcp_servers.json`)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {mockServers.map((srv) => (
            <div key={srv.name} className="glass-card rounded-xl p-4 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-200">{srv.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {srv.transport.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center space-x-1 flex-wrap gap-1 text-[10px] font-mono">
                <span className="text-slate-500">Scopes:</span>
                {srv.scopes.map((sc) => (
                  <span key={sc} className="px-1.5 py-0.5 rounded bg-slate-900 text-sky-300 border border-slate-800">
                    {sc}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tools Explorer & Interactive Tester */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Registered Tools List */}
        <div className="lg:col-span-5 glass-panel rounded-2xl p-5 border border-sky-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-sky-400" /> Active MCP Tools
            </h3>
            <select
              value={scopeFilter}
              onChange={(e) => setScopeFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300"
            >
              <option value="all">All Scopes</option>
              <option value="common">common (Shared)</option>
              <option value="customer_support">customer_support</option>
              <option value="form_collector">form_collector</option>
            </select>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-500 text-xs">Loading MCP Tool Registry...</div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {/* Common Shared Tools */}
              {(toolsData?.common || [])
                .filter(() => scopeFilter === 'all' || scopeFilter === 'common')
                .map((toolItem) => (
                  <div
                    key={toolItem.name}
                    onClick={() => handleSelectTool(toolItem)}
                    className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                      selectedTool?.name === toolItem.name
                        ? 'bg-sky-500/20 border-sky-500/60 shadow-[0_0_15px_rgba(56,189,248,0.2)]'
                        : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-mono font-bold text-sky-300">{toolItem.name}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        COMMON (GLOBAL)
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{toolItem.description}</p>
                  </div>
                ))}

              {/* Agent Specific Tools */}
              {Object.entries(toolsData?.agent_specific || {}).flatMap(([agentId, toolsList]) =>
                (toolsList || [])
                  .filter(() => scopeFilter === 'all' || scopeFilter === agentId)
                  .map((toolItem) => (
                      <div
                        key={toolItem.name}
                        onClick={() => handleSelectTool(toolItem)}
                        className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                          selectedTool?.name === toolItem.name
                            ? 'bg-purple-500/20 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                            : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono font-bold text-purple-300">{toolItem.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            AGENT: {agentId}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">{toolItem.description}</p>
                      </div>
                    ))
                )}
            </div>
          )}
        </div>

        {/* Right Column: Interactive Tool Tester */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-5 border border-sky-500/20 flex flex-col space-y-4">
          <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Play className="w-4 h-4 text-emerald-400" /> Interactive Tool Tester
          </h3>

          {selectedTool ? (
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono font-bold text-slate-100">{selectedTool.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-sky-400 border border-slate-700">
                    Scope: {selectedTool.scope}
                  </span>
                </div>
                <p className="text-xs text-slate-400">{selectedTool.description}</p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-mono text-slate-400">Tool JSON Arguments:</label>
                <textarea
                  value={testArgsJson}
                  onChange={(e) => setTestArgsJson(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 focus:outline-none focus:border-sky-500"
                />
              </div>

              <button
                onClick={handleTestExecute}
                disabled={executing}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-semibold text-xs transition-all flex items-center justify-center space-x-2"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{executing ? 'Executing Tool...' : 'Execute Tool Payload'}</span>
              </button>

              {testResult && (
                <div className="space-y-1 flex-1">
                  <label className="block text-xs font-mono text-slate-400">Execution Result:</label>
                  <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-sky-300 overflow-x-auto max-h-56">
                    {JSON.stringify(testResult, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="py-20 text-center text-slate-500 text-xs">
              Select a tool from the left panel to inspect and test run.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
