import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Edit3, 
  Plus, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  FileText, 
  Layers, 
  Check, 
  ArrowRight,
  Split,
  Combine,
  Eye,
  Sliders,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { FormDefinition, FormField, FieldType } from '../types';
import { ActiveTab } from './Sidebar';

interface FormAnalyzerViewProps {
  form: FormDefinition;
  onUpdateForm: (updatedForm: FormDefinition) => void;
  setActiveTab: (tab: ActiveTab) => void;
}

export const FormAnalyzerView: React.FC<FormAnalyzerViewProps> = ({ 
  form, 
  onUpdateForm, 
  setActiveTab 
}) => {
  const [fields, setFields] = useState<FormField[]>(form.fields || []);
  const [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null);
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(fields[0]?.id || null);
  const [filterType, setFilterType] = useState<'all' | 'needs_review'>('all');

  const needsReviewCount = fields.filter(f => f.confidenceScore < 90 || f.needsReview).length;
  const overallConfidence = 97;

  const handleFieldChange = (id: string, key: keyof FormField, value: any) => {
    const updated = fields.map(f => f.id === id ? { ...f, [key]: value } : f);
    setFields(updated);
    onUpdateForm({ ...form, fields: updated });
  };

  const handleDeleteField = (id: string) => {
    const updated = fields.filter(f => f.id !== id);
    setFields(updated);
    onUpdateForm({ ...form, fields: updated });
  };

  const handleAddField = () => {
    const newF: FormField = {
      id: `f-${Date.now()}`,
      name: `customField_${fields.length + 1}`,
      originalLabel: 'New Form Input Field',
      type: 'text',
      required: true,
      confidenceScore: 99,
      conversationPrompt: 'Please provide this required information.',
      aliases: ['Field']
    };
    const updated = [...fields, newF];
    setFields(updated);
    onUpdateForm({ ...form, fields: updated });
    setExpandedFieldId(newF.id);
  };

  return (
    <div id="form-analyzer-view" className="flex flex-col h-[calc(100vh-4rem)] bg-slate-50">
      {/* TOP CONFIDENCE BANNER */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>{overallConfidence}% AI Confidence Score</span>
          </div>

          <span className="text-xs font-semibold text-slate-700">
            Detected <span className="text-indigo-600 font-bold">{fields.length} Fields</span>
          </span>

          {needsReviewCount > 0 ? (
            <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5" />
              {needsReviewCount} Fields Need Review
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All Fields Verified
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterType(filterType === 'all' ? 'needs_review' : 'all')}
            className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition-colors cursor-pointer ${
              filterType === 'needs_review' 
                ? 'bg-amber-100 text-amber-900 border-amber-300' 
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {filterType === 'needs_review' ? 'Showing Needs Review' : 'Filter Needs Review'}
          </button>

          <button
            onClick={handleAddField}
            className="px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold text-xs flex items-center gap-1.5 hover:bg-indigo-100 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Field
          </button>
        </div>
      </div>

      {/* SPLIT SCREEN LAYOUT */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden">
        {/* LEFT PANEL: Interactive PDF Preview */}
        <div className="p-6 bg-slate-900 flex flex-col border-r border-slate-800 overflow-y-auto relative">
          <div className="flex items-center justify-between text-white text-xs mb-3">
            <span className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-400" />
              Original PDF Document Preview ({form.title})
            </span>
            <span className="text-[10px] text-slate-400">Hover fields to view schema</span>
          </div>

          {/* Simulated PDF Canvas */}
          <div className="relative bg-white rounded-xl shadow-2xl p-8 min-h-[600px] border border-slate-700 text-slate-800 text-xs font-serif select-none">
            {/* PDF Header */}
            <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
              <p className="text-[10px] font-mono tracking-widest text-slate-500 uppercase">Government of India / Department of Revenue</p>
              <h1 className="text-base font-bold text-slate-900 uppercase mt-1 tracking-tight">{form.title}</h1>
              <p className="text-[10px] italic text-slate-600 mt-0.5">Application Form for Official Digitization & Issuance</p>
            </div>

            {/* Simulated Bounding Boxes Over Laid Fields */}
            <div className="space-y-6 relative">
              {fields.map((f, idx) => {
                const isHovered = hoveredFieldId === f.id;
                const isExpanded = expandedFieldId === f.id;

                return (
                  <div 
                    key={f.id}
                    onMouseEnter={() => setHoveredFieldId(f.id)}
                    onMouseLeave={() => setHoveredFieldId(null)}
                    onClick={() => setExpandedFieldId(f.id)}
                    className={`p-3 rounded-lg border-2 transition-all cursor-pointer relative ${
                      isHovered || isExpanded
                        ? 'border-indigo-600 bg-indigo-50/70 shadow-md ring-2 ring-indigo-400/30'
                        : 'border-slate-300 bg-slate-50 hover:border-indigo-300'
                    }`}
                  >
                    {/* Bounding Box Tag Badge */}
                    <div className="absolute -top-2.5 left-3 px-2 py-0.5 rounded bg-indigo-600 text-white text-[9px] font-mono font-bold uppercase shadow-xs flex items-center gap-1">
                      <span>Field #{idx + 1}</span>
                      <span className="opacity-80">({f.confidenceScore}%)</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-900 font-sans text-xs">{f.originalLabel}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                        {f.type}
                      </span>
                    </div>

                    <div className="mt-2 h-7 bg-white border border-slate-300 rounded px-2 flex items-center text-slate-400 text-[11px] font-mono italic">
                      [{f.value || `Citizen Speech Input placeholder for ${f.name}`}]
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: AI Generated Form Schema Cards */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">AI Generated Form Schema & Prompts</h3>
              <p className="text-xs text-slate-500">Edit extracted labels, datatypes, and conversational prompts</p>
            </div>
            <span className="text-xs font-medium text-slate-400">
              {fields.length} schema items
            </span>
          </div>

          <div className="space-y-3">
            {fields
              .filter(f => filterType === 'all' || (f.confidenceScore < 90 || f.needsReview))
              .map((field) => {
                const isExpanded = expandedFieldId === field.id;
                const isHovered = hoveredFieldId === field.id;

                return (
                  <div
                    key={field.id}
                    onMouseEnter={() => setHoveredFieldId(field.id)}
                    onMouseLeave={() => setHoveredFieldId(null)}
                    className={`bg-white rounded-2xl border transition-all shadow-xs ${
                      isExpanded
                        ? 'border-indigo-500 ring-2 ring-indigo-500/10'
                        : isHovered
                          ? 'border-indigo-300'
                          : 'border-slate-200/80 hover:border-slate-300'
                    }`}
                  >
                    {/* Header bar */}
                    <div
                      onClick={() => setExpandedFieldId(isExpanded ? null : field.id)}
                      className="p-4 flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center ${
                          field.confidenceScore >= 95 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {field.confidenceScore}%
                        </span>

                        <div>
                          <p className="font-bold text-slate-900 text-xs">{field.originalLabel}</p>
                          <p className="text-[10px] text-slate-400 font-mono">key: {field.name}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 uppercase">
                          {field.type}
                        </span>
                        {field.required && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                            Required
                          </span>
                        )}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {/* Expanded Fields Details Form */}
                    {isExpanded && (
                      <div className="p-4 border-t border-slate-100 space-y-4 bg-slate-50/50 rounded-b-2xl">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Key Name (CamelCase)</label>
                            <input
                              type="text"
                              value={field.name}
                              onChange={(e) => handleFieldChange(field.id, 'name', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Data Type</label>
                            <select
                              value={field.type}
                              onChange={(e) => handleFieldChange(field.id, 'type', e.target.value as FieldType)}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
                            >
                              <option value="text">Text (String)</option>
                              <option value="number">Numeric</option>
                              <option value="date">Date (DD/MM/YYYY)</option>
                              <option value="currency">Currency (Rupees / USD)</option>
                              <option value="select">Dropdown Choice</option>
                              <option value="address">Postal Address</option>
                            </select>
                          </div>
                        </div>

                        {/* Conversational AI Prompt */}
                        <div>
                          <label className="block text-[11px] font-semibold text-indigo-900 mb-1 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            AI Conversation Prompt
                          </label>
                          <input
                            type="text"
                            value={field.conversationPrompt}
                            onChange={(e) => handleFieldChange(field.id, 'conversationPrompt', e.target.value)}
                            className="w-full bg-white border border-indigo-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-medium"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Aliases (Comma separated)</label>
                            <input
                              type="text"
                              value={field.aliases.join(', ')}
                              onChange={(e) => handleFieldChange(field.id, 'aliases', e.target.value.split(',').map(s => s.trim()))}
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">Validation Regex</label>
                            <input
                              type="text"
                              value={field.regex || ''}
                              onChange={(e) => handleFieldChange(field.id, 'regex', e.target.value)}
                              placeholder="e.g. ^[0-9]{12}$"
                              className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-mono text-slate-800 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        {/* Officer Actions Bar */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => handleFieldChange(field.id, 'required', e.target.checked)}
                              className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                            />
                            Required Field
                          </label>

                          <button
                            onClick={() => handleDeleteField(field.id)}
                            className="text-xs text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete Field
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="bg-white border-t border-slate-200 px-6 py-3 flex items-center justify-between shadow-lg">
        <button
          onClick={() => setActiveTab('upload')}
          className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
        >
          Back to Upload
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('dashboard')}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs transition-colors cursor-pointer"
          >
            Save Draft
          </button>

          <button
            id="publish-flow-builder-btn"
            onClick={() => setActiveTab('flow_builder')}
            className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
          >
            Continue to Flow Builder
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
