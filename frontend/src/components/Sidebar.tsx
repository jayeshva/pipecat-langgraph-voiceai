import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  Upload, 
  CheckCircle2, 
  TestTube2, 
  BarChart3, 
  Settings as SettingsIcon, 
  Sparkles, 
  Bot, 
  Layers,
  ChevronRight,
  ShieldCheck,
  Building2
} from 'lucide-react';

export type ActiveTab = 
  | 'dashboard' 
  | 'ai_form_studio'
  | 'upload' 
  | 'analyzer' 
  | 'flow_builder' 
  | 'published' 
  | 'testing_studio' 
  | 'analytics' 
  | 'settings'
  | 'citizen_mode';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedOrg: string;
  setSelectedOrg: (org: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab,
  selectedOrg,
  setSelectedOrg
}) => {
  const [formsExpanded, setFormsExpanded] = React.useState(true);

  const isFormRelatedTab = ['upload', 'analyzer', 'flow_builder', 'published', 'testing_studio'].includes(activeTab);

  return (
    <aside id="main-sidebar" className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen border-r border-slate-800 flex-shrink-0 select-none">
      {/* App Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
            <Sparkles className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-base tracking-tight text-white">IntelliForm</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Enterprise Form Digitizer</p>
          </div>
        </div>
      </div>

      {/* Organization Switcher */}
      <div className="p-3 mx-3 my-2 bg-slate-800/60 rounded-xl border border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1 font-medium">
          <span className="flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            Organization
          </span>
          <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">Gov Verified</span>
        </div>
        <select 
          value={selectedOrg}
          onChange={(e) => setSelectedOrg(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg p-1.5 focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
        >
          <option value="Department of Revenue">Dept. of Revenue & Land</option>
          <option value="Ministry of External Affairs">Ministry of External Affairs</option>
          <option value="HDFC Enterprise Banking">HDFC Enterprise Banking</option>
          <option value="AIIMS Hospital Network">AIIMS Hospital Network</option>
          <option value="Anna University Portal">Anna University Portal</option>
        </select>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {/* Dashboard */}
        <button
          id="nav-btn-dashboard"
          onClick={() => setActiveTab('dashboard')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'dashboard'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4 text-slate-300" />
          <span>Dashboard</span>
        </button>

        {/* Forms Accordion */}
        <div className="space-y-0.5">
          <button
            onClick={() => setFormsExpanded(!formsExpanded)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
              isFormRelatedTab
                ? 'text-indigo-300 font-semibold'
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4" />
              <span>Forms Management</span>
            </div>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-200 ${formsExpanded ? 'rotate-90' : ''}`} />
          </button>

          {formsExpanded && (
            <div className="pl-7 pr-1 space-y-1 py-1 border-l border-slate-800 ml-5">
              <button
                id="nav-btn-ai-form-studio"
                onClick={() => setActiveTab('ai_form_studio')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                  activeTab === 'ai_form_studio'
                    ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold border border-indigo-400/40 shadow-sm'
                    : 'text-indigo-300 hover:text-white hover:bg-indigo-950/40 font-semibold'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span className="flex-1 text-left">AI Form Creator</span>
                <span className="text-[9px] px-1 rounded bg-indigo-500/30 text-indigo-200 font-bold uppercase">NL</span>
              </button>

              <button
                id="nav-btn-upload"
                onClick={() => setActiveTab('upload')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                  activeTab === 'upload'
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload PDF Form</span>
              </button>

              <button
                id="nav-btn-analyzer"
                onClick={() => setActiveTab('analyzer')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                  activeTab === 'analyzer'
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Schema Analyzer</span>
              </button>

              <button
                id="nav-btn-flow-builder"
                onClick={() => setActiveTab('flow_builder')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                  activeTab === 'flow_builder'
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Flow Builder</span>
              </button>

              <button
                id="nav-btn-published"
                onClick={() => setActiveTab('published')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                  activeTab === 'published'
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Published Forms</span>
              </button>

              <button
                id="nav-btn-testing-studio"
                onClick={() => setActiveTab('testing_studio')}
                className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                  activeTab === 'testing_studio'
                    ? 'bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <TestTube2 className="w-3.5 h-3.5 text-indigo-400" />
                <span>Testing Studio</span>
              </button>
            </div>
          )}
        </div>

        {/* Analytics */}
        <button
          id="nav-btn-analytics"
          onClick={() => setActiveTab('analytics')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>

        {/* Settings */}
        <button
          id="nav-btn-settings"
          onClick={() => setActiveTab('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'settings'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
              : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </nav>

      {/* Citizen View Mode Switcher Button */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/40">
        <button
          id="launch-citizen-experience-btn"
          onClick={() => setActiveTab('citizen_mode')}
          className="w-full relative group overflow-hidden p-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <Bot className="w-4 h-4 text-white animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold leading-none">Citizen Mode</p>
              <p className="text-[10px] text-emerald-100 opacity-90 mt-0.5">Test AI Conversation</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-100 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Security Footer Badge */}
      <div className="px-4 py-2 text-[10px] text-slate-500 flex items-center justify-between border-t border-slate-800/50 bg-slate-950/20">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          ISO 27001 & SOC-2
        </span>
        <span>v3.2.0</span>
      </div>
    </aside>
  );
};
