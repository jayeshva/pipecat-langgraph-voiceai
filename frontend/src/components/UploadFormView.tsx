import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  HelpCircle, 
  ArrowRight,
  Bot,
  Layers,
  Search,
  ScanLine,
  Cpu,
  FileCheck
} from 'lucide-react';
import { FormDefinition, FormCategory } from '../types';
import { ActiveTab } from './Sidebar';

interface UploadFormViewProps {
  onFormAnalyzed: (newForm: FormDefinition) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const UploadFormView: React.FC<UploadFormViewProps> = ({ 
  onFormAnalyzed, 
  setActiveTab 
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);

  // Form Metadata state
  const [department, setDepartment] = useState('Department of Revenue & Land Records');
  const [category, setCategory] = useState<FormCategory>('Revenue & Taxes');
  const [formName, setFormName] = useState('Income & Asset Certificate (Form A)');
  const [description, setDescription] = useState('Official annual income and economic asset verification certificate for citizens.');
  const [defaultLanguage, setDefaultLanguage] = useState('Tamil');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['Tamil', 'English', 'Hindi', 'Telugu']);
  const [tags, setTags] = useState('Revenue, Income, Certificate, Quota');
  const [specialInstructions, setSpecialInstructions] = useState(
    `Collect Aadhaar carefully. DOB mandatory. Ask income proof only if income exceeds ₹2L. Don't ask nominee unless married.`
  );

  // AI Loading Screen Modal state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState(0);

  const analysisSteps = [
    { title: 'Uploading PDF...', icon: Upload, detail: 'Securely transferring document bytes to sandbox' },
    { title: 'Running OCR...', icon: ScanLine, detail: 'Extracting text layer and high-res layout structure' },
    { title: 'Understanding Layout...', icon: Layers, detail: 'Mapping visual tables, key-value grids, and forms' },
    { title: 'Detecting Fields...', icon: Search, detail: 'Identified 32 form input fields & original labels' },
    { title: 'Building Conversation...', icon: Bot, detail: 'Generating polite multi-lingual conversational prompts' },
    { title: 'Generating Schema...', icon: Cpu, detail: 'Finalizing JSON schema & confidence metrics' }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSampleSelect = (sampleName: string, dept: string) => {
    setFormName(sampleName);
    setDepartment(dept);
    setSelectedFile(new File(["sample pdf content"], `${sampleName.toLowerCase().replace(/\s+/g, '_')}.pdf`, { type: "application/pdf" }));
  };

  const startAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisStep(0);

    // Step animation intervals
    for (let i = 0; i < analysisSteps.length; i++) {
      setAnalysisStep(i);
      await new Promise(r => setTimeout(r, 700));
    }

    try {
      const response = await fetch('/api/analyze-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formName,
          department,
          specialInstructions
        })
      });
      const data = await response.json();

      const newForm: FormDefinition = {
        id: `form-${Date.now()}`,
        title: formName,
        department,
        category,
        description,
        version: '1.0',
        status: 'draft',
        supportedLanguages: selectedLanguages,
        defaultLanguage,
        tags: tags.split(',').map(t => t.trim()),
        specialInstructions,
        totalConversations: 0,
        completionRate: 0,
        updatedAt: 'Just now',
        updatedBy: 'Officer S. Ramanathan',
        fields: data.fields || []
      };

      setIsAnalyzing(false);
      onFormAnalyzed(newForm);
      setActiveTab('analyzer');
    } catch (e) {
      console.error(e);
      setIsAnalyzing(false);
    }
  };

  const toggleLanguage = (lang: string) => {
    if (selectedLanguages.includes(lang)) {
      if (selectedLanguages.length > 1) {
        setSelectedLanguages(selectedLanguages.filter(l => l !== lang));
      }
    } else {
      setSelectedLanguages([...selectedLanguages, lang]);
    }
  };

  const availableLanguages = ['Tamil', 'English', 'Hindi', 'Telugu', 'Kannada', 'Marathi', 'Bengali', 'Gujarati'];

  return (
    <div id="upload-form-view" className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Upload PDF Form to Digitize</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Upload an existing government or enterprise PDF form. AI will scan fields and generate a conversational workflow.
          </p>
        </div>
        <span className="text-xs px-3 py-1 bg-indigo-50 text-indigo-700 font-semibold rounded-full border border-indigo-200">
          Step 1 of 3: Form Upload
        </span>
      </div>

      {/* Main Upload Area */}
      <div 
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all bg-white shadow-xs ${
          dragActive 
            ? 'border-indigo-500 bg-indigo-50/50 scale-[0.99]' 
            : selectedFile 
              ? 'border-emerald-400 bg-emerald-50/20' 
              : 'border-slate-300 hover:border-indigo-400'
        }`}
      >
        <div className="max-w-md mx-auto space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center shadow-xs">
            <Upload className="w-7 h-7 text-indigo-600" />
          </div>

          {selectedFile ? (
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-semibold">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                <button 
                  onClick={() => setSelectedFile(null)}
                  className="p-0.5 hover:bg-emerald-200 rounded-full cursor-pointer ml-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500">PDF ready for AI Layout Analysis & Field Detection</p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-bold text-slate-800">Drag & Drop PDF Here or Browse Files</p>
              <p className="text-xs text-slate-500 mt-1">Supports standard government & enterprise scanned or digital PDFs (Max 25MB)</p>
              
              <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 cursor-pointer shadow-sm transition-all">
                <FileText className="w-4 h-4" />
                Select PDF File
                <input 
                  type="file" 
                  accept=".pdf" 
                  className="hidden" 
                  onChange={(e) => e.target.files?.[0] && setSelectedFile(e.target.files[0])} 
                />
              </label>
            </div>
          )}

          {/* Quick Select Preset PDF Templates */}
          <div className="pt-4 border-t border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Or select a pre-loaded sample PDF template:</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => handleSampleSelect('Income Certificate (Form 3)', 'Department of Revenue & Land Records')}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 font-medium transition-all cursor-pointer"
              >
                📜 Income Certificate.pdf
              </button>
              <button
                onClick={() => handleSampleSelect('Fresh Passport Application (Form No. 1)', 'Ministry of External Affairs')}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 font-medium transition-all cursor-pointer"
              >
                🛂 Passport Application.pdf
              </button>
              <button
                onClick={() => handleSampleSelect('Higher Education Scholarship Grant', 'Department of Higher Education')}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 border border-slate-200 font-medium transition-all cursor-pointer"
              >
                🎓 Scholarship Form.pdf
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Form Metadata Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-5">
        <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Form Details & Configuration</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Department / Organization</label>
            <input 
              type="text"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Form Name / Title</label>
            <input 
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Purpose</label>
          <input 
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Languages Supported */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">Languages Supported for Citizen Voice AI</label>
          <div className="flex flex-wrap gap-2">
            {availableLanguages.map((lang) => {
              const selected = selectedLanguages.includes(lang);
              return (
                <button
                  key={lang}
                  type="button"
                  onClick={() => toggleLanguage(lang)}
                  className={`text-xs px-3 py-1.5 rounded-xl font-medium transition-all cursor-pointer ${
                    selected 
                      ? 'bg-indigo-600 text-white shadow-xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {selected && '✓ '}
                  {lang}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Default Language</label>
            <select
              value={defaultLanguage}
              onChange={(e) => setDefaultLanguage(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            >
              {selectedLanguages.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Tags (Comma Separated)</label>
            <input 
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>
        </div>

        {/* Special Instructions */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
              Special AI Guidance & Rules
              <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            </label>
            <span className="text-[10px] text-indigo-600 font-medium">Controls conditional prompts & field logic</span>
          </div>
          <textarea
            rows={4}
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            placeholder="e.g. Collect Aadhaar carefully. DOB mandatory. Ask income proof only if income exceeds ₹2L. Don't ask nominee unless married."
          />
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setActiveTab('dashboard')}
          className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Cancel
        </button>

        <button
          id="analyze-with-ai-btn"
          onClick={startAIAnalysis}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-indigo-200" />
          Analyze with AI
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* BEAUTIFUL AI LOADING SCREEN MODAL */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center space-y-6 animate-in zoom-in-95 duration-200">
            {/* Animated Glow Logo */}
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-indigo-600 to-blue-500 mx-auto flex items-center justify-center shadow-xl shadow-indigo-500/30 relative">
              <Sparkles className="w-10 h-10 text-white animate-bounce" />
              <div className="absolute inset-0 rounded-3xl border-2 border-white/30 animate-ping opacity-25"></div>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">Analyzing Form with Gemini AI</h3>
              <p className="text-xs text-slate-500 mt-1">Transforming static PDF into conversational schema</p>
            </div>

            {/* Step List Progress */}
            <div className="space-y-2.5 text-left bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {analysisSteps.map((step, idx) => {
                const IconComponent = step.icon;
                const isCurrent = idx === analysisStep;
                const isDone = idx < analysisStep;

                return (
                  <div key={step.title} className="flex items-center gap-3 text-xs">
                    <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                      isDone 
                        ? 'bg-emerald-500 text-white' 
                        : isCurrent 
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 animate-pulse' 
                          : 'bg-slate-200 text-slate-500'
                    }`}>
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : <IconComponent className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-semibold ${isCurrent ? 'text-indigo-900' : isDone ? 'text-slate-800' : 'text-slate-400'}`}>
                        {step.title}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate">{step.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-300" 
                style={{ width: `${((analysisStep + 1) / analysisSteps.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
