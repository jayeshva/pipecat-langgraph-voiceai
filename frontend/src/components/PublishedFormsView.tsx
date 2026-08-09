import React from 'react';
import { 
  CheckCircle2, 
  Share2, 
  Play, 
  QrCode, 
  Copy, 
  ExternalLink, 
  Globe, 
  Layers, 
  Sparkles,
  FileText
} from 'lucide-react';
import { FormDefinition } from '../types';
import { ActiveTab } from './Sidebar';

interface PublishedFormsViewProps {
  forms: FormDefinition[];
  setActiveTab: (tab: ActiveTab) => void;
  onSelectFormForTesting: (form: FormDefinition) => void;
}

export const PublishedFormsView: React.FC<PublishedFormsViewProps> = ({
  forms,
  setActiveTab,
  onSelectFormForTesting
}) => {
  const publishedForms = forms.filter(f => f.status === 'published');

  const handleCopyLink = (formId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/citizen/${formId}`);
    alert('Citizen AI Form conversation link copied to clipboard!');
  };

  return (
    <div id="published-forms-view" className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Published Citizen AI Forms</h2>
          <p className="text-xs text-slate-500 mt-0.5">Live conversational endpoints accessible by citizens on Web, Mobile, and Public Kiosks</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {publishedForms.length} Active Endpoints
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {publishedForms.map((form) => (
          <div 
            key={form.id} 
            className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  v{form.version}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Updated {form.updatedAt}</span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm">{form.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{form.description}</p>
              <p className="text-[10px] text-indigo-600 font-medium">{form.department}</p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Total Conversations:</span>
                <span className="font-bold text-slate-900">{form.totalConversations.toLocaleString()}</span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <span>Languages Supported:</span>
                <span className="font-semibold text-indigo-700">{form.supportedLanguages.slice(0, 3).join(', ')}</span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => handleCopyLink(form.id)}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy Link
                </button>

                <button
                  onClick={() => {
                    onSelectFormForTesting(form);
                    setActiveTab('testing_studio');
                  }}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" /> Test AI
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
