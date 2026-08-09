import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Sparkles, 
  ShieldCheck, 
  Key, 
  Volume2, 
  Database, 
  Save, 
  CheckCircle2 
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [selectedModel, setSelectedModel] = useState('gemini-3.6-flash');
  const [ocrEngine, setOcrEngine] = useState('Gemini Multimodal OCR');
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div id="settings-view" className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">System Settings & AI Configuration</h2>
        <p className="text-xs text-slate-500 mt-0.5">Configure backend AI models, speech recognition sensitivity, and department branding</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-6">
        {/* AI Model Selection */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-indigo-600 border-b border-slate-100 pb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> AI Intelligence Model Engine
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              onClick={() => setSelectedModel('gemini-3.6-flash')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                selectedModel === 'gemini-3.6-flash'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Gemini 3.6 Flash (Recommended)</span>
                {selectedModel === 'gemini-3.6-flash' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Ultra low-latency, real-time multilingual speech comprehension & form extraction.</p>
            </div>

            <div 
              onClick={() => setSelectedModel('gemini-3.1-pro-preview')}
              className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                selectedModel === 'gemini-3.1-pro-preview'
                  ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">Gemini 3.1 Pro</span>
                {selectedModel === 'gemini-3.1-pro-preview' && <CheckCircle2 className="w-4 h-4 text-indigo-600" />}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Deep reasoning model for highly complex, multi-page legal & passport forms.</p>
            </div>
          </div>
        </div>

        {/* Confidence Threshold Slider */}
        <div className="space-y-3">
          <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-indigo-600 border-b border-slate-100 pb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> Verification & Confidence Threshold
          </h3>

          <div>
            <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
              <span>Automatic Verification Threshold</span>
              <span className="text-indigo-600 font-bold">{confidenceThreshold}%</span>
            </div>
            <input 
              type="range" 
              min={70} 
              max={99} 
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(parseInt(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400 mt-1">Fields extracted with confidence below {confidenceThreshold}% will automatically trigger citizen spelling / clarification confirmation.</p>
          </div>
        </div>

        {/* Secrets & Security Info */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Key className="w-4 h-4 text-indigo-600" /> API Keys & Server Managed Secrets
          </div>
          <p className="text-slate-600 text-[11px]">
            Server-side Gemini API credentials are securely loaded via <code className="font-mono bg-white px-1.5 py-0.5 rounded border">process.env.GEMINI_API_KEY</code> from AI Studio Secrets panel. No keys are exposed to the browser.
          </p>
        </div>

        <div className="flex items-center justify-between pt-2">
          {savedSuccess && (
            <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Settings Saved Successfully!
            </span>
          )}
          <div className="ml-auto">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" /> Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
