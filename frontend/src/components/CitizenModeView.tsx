import React from 'react';
import { Bot, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { TestingStudioView } from './TestingStudioView';
import { FormDefinition } from '../types';
import { ActiveTab } from './Sidebar';

interface CitizenModeViewProps {
  form: FormDefinition;
  onUpdateForm: (updatedForm: FormDefinition) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const CitizenModeView: React.FC<CitizenModeViewProps> = ({
  form,
  onUpdateForm,
  setActiveTab
}) => {
  return (
    <div id="citizen-mode-view" className="flex flex-col min-h-screen bg-slate-900 text-slate-100">
      {/* Top Banner for Citizen Mode */}
      <header className="bg-slate-950 border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-30 shadow-lg">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Exit Citizen Mode
          </button>

          <div className="h-5 w-px bg-slate-800 hidden sm:block"></div>

          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-sm text-white tracking-tight">Citizen Voice Portal</span>
              <p className="text-[10px] text-emerald-400 font-medium">No Traditional Forms • 100% Conversational</p>
            </div>
          </div>
        </div>

        <span className="hidden md:flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          Official Government SSL Secured
        </span>
      </header>

      {/* Main Citizen Studio Experience */}
      <div className="flex-1 bg-slate-100 text-slate-900">
        <TestingStudioView form={form} onUpdateForm={onUpdateForm} />
      </div>
    </div>
  );
};
