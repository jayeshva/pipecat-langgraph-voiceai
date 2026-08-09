import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Mic, 
  HelpCircle, 
  Settings2, 
  Plus, 
  Trash2, 
  Play, 
  ArrowRight, 
  CheckCircle2, 
  Maximize2, 
  RefreshCw, 
  Sliders,
  Layers,
  Zap,
  Volume2,
  Lock,
  MessageSquare
} from 'lucide-react';
import { WorkflowNode, WorkflowEdge, FormDefinition } from '../types';
import { INITIAL_WORKFLOW_NODES, INITIAL_WORKFLOW_EDGES } from '../mockData';
import { ActiveTab } from './Sidebar';

interface FlowBuilderViewProps {
  form: FormDefinition;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectFormForTesting: (form: FormDefinition) => void;
}

export const FlowBuilderView: React.FC<FlowBuilderViewProps> = ({ 
  form, 
  setActiveTab,
  onSelectFormForTesting
}) => {
  const [nodes, setNodes] = useState<WorkflowNode[]>(INITIAL_WORKFLOW_NODES);
  const [edges, setEdges] = useState<WorkflowEdge[]>(INITIAL_WORKFLOW_EDGES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>(nodes[0].id);

  const selectedNode = nodes.find(n => n.id === selectedNodeId) || nodes[0];

  const updateNodeProperty = (key: string, value: any) => {
    setNodes(nodes.map(n => {
      if (n.id === selectedNodeId) {
        return {
          ...n,
          properties: {
            ...n.properties,
            [key]: value
          }
        };
      }
      return n;
    }));
  };

  const addNode = (type: WorkflowNode['type']) => {
    const newNode: WorkflowNode = {
      id: `node-${Date.now()}`,
      type,
      title: type === 'upload_doc' ? 'Upload Proof Document' : 'Custom Verification Step',
      position: { x: 400 + nodes.length * 20, y: 300 },
      properties: {
        prompt: 'Please upload or state the details required for this verification step.',
        voice: 'Kore (Warm Female)',
        language: form.defaultLanguage || 'Tamil',
        retryLimit: 2,
        fallbackPrompt: 'Please try providing the document again.',
        interruptionsAllowed: true
      }
    };
    setNodes([...nodes, newNode]);
    setSelectedNodeId(newNode.id);
  };

  return (
    <div id="flow-builder-view" className="flex flex-col h-[calc(100vh-4rem)] bg-slate-900 text-slate-100">
      {/* TOP CANVAS CONTROLS */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600/30 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-white tracking-tight">LangFlow Conversational Workflow Builder</h2>
            <p className="text-[11px] text-slate-400">Drag nodes & configure state machine triggers for {form.title}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => addNode('collect_info')}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" /> Add Conversational Node
          </button>

          <button
            id="test-workflow-studio-btn"
            onClick={() => {
              onSelectFormForTesting(form);
              setActiveTab('testing_studio');
            }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Test Live Flow in Studio
          </button>
        </div>
      </div>

      {/* MAIN CANVAS & PROPERTIES DRAWER */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT NODE CANVAS */}
        <div className="flex-1 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950 p-8 overflow-auto relative flex items-center justify-center">
          {/* Visual Nodes Diagram Container */}
          <div className="relative min-w-[1000px] min-h-[500px]">
            {/* SVG Connector Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <path d="M 260 180 L 380 180" stroke="#6366f1" strokeWidth="3" strokeDasharray="6 6" className="animate-pulse" />
              <path d="M 540 180 L 680 110" stroke="#10b981" strokeWidth="3" />
              <path d="M 540 180 L 680 290" stroke="#f59e0b" strokeWidth="3" />
              <path d="M 840 110 L 960 210" stroke="#6366f1" strokeWidth="3" />
              <path d="M 840 290 L 960 210" stroke="#6366f1" strokeWidth="3" />
            </svg>

            {/* Workflow Nodes Cards */}
            {nodes.map((node) => {
              const isSelected = node.id === selectedNodeId;

              return (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  style={{ left: `${node.position.x}px`, top: `${node.position.y}px` }}
                  className={`absolute w-64 rounded-2xl bg-slate-900 border-2 transition-all cursor-pointer shadow-xl z-10 select-none ${
                    isSelected 
                      ? 'border-indigo-500 ring-4 ring-indigo-500/20 scale-105' 
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Node Title */}
                  <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 rounded-t-2xl">
                    <span className="flex items-center gap-2 text-xs font-bold text-white">
                      <Bot className="w-4 h-4 text-indigo-400" />
                      {node.title}
                    </span>
                    <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {node.type}
                    </span>
                  </div>

                  {/* Node Content */}
                  <div className="p-3 space-y-2">
                    <p className="text-[11px] text-slate-300 line-clamp-2 italic bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                      "{node.properties.prompt}"
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1 text-slate-300">
                        <Volume2 className="w-3 h-3 text-indigo-400" />
                        {node.properties.voice.split(' ')[0]}
                      </span>
                      <span>Retry limit: {node.properties.retryLimit}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL: Node Properties Drawer */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 p-5 overflow-y-auto space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="font-bold text-sm text-white">{selectedNode.title}</h3>
              <p className="text-[10px] text-slate-400 font-mono">ID: {selectedNode.id}</p>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-bold uppercase">
              {selectedNode.type}
            </span>
          </div>

          {/* Properties Controls */}
          <div className="space-y-4 text-xs">
            {/* Prompt */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Conversational AI Prompt</label>
              <textarea
                rows={3}
                value={selectedNode.properties.prompt}
                onChange={(e) => updateNodeProperty('prompt', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
              />
            </div>

            {/* Voice Selection */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Voice Accent & Tone</label>
              <select
                value={selectedNode.properties.voice}
                onChange={(e) => updateNodeProperty('voice', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Kore (Warm Female)">Kore (Warm Female)</option>
                <option value="Zephyr (Clear Male)">Zephyr (Clear Male)</option>
                <option value="Puck (Expressive)">Puck (Expressive)</option>
                <option value="Fenrir (Formal Deep)">Fenrir (Formal Deep)</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Language</label>
              <select
                value={selectedNode.properties.language}
                onChange={(e) => updateNodeProperty('language', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="Tamil">Tamil</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Telugu">Telugu</option>
              </select>
            </div>

            {/* Fallback Prompt */}
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Fallback Prompt (If unrecognized speech)</label>
              <input
                type="text"
                value={selectedNode.properties.fallbackPrompt}
                onChange={(e) => updateNodeProperty('fallbackPrompt', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Retry Limit & Interruptions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Retry Limit</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={selectedNode.properties.retryLimit}
                  onChange={(e) => updateNodeProperty('retryLimit', parseInt(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-300">
                  <input
                    type="checkbox"
                    checked={selectedNode.properties.interruptionsAllowed}
                    onChange={(e) => updateNodeProperty('interruptionsAllowed', e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Allow Interrupts
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              onClick={() => setNodes(nodes.filter(n => n.id !== selectedNodeId))}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> Remove Node
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
