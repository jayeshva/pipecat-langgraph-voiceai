import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Send, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Volume2, 
  FileText, 
  Check, 
  Eye, 
  X, 
  Bot, 
  User, 
  ShieldCheck, 
  Zap, 
  Globe, 
  Upload, 
  Camera, 
  Image as ImageIcon, 
  AlertCircle,
  FileCheck2,
  RefreshCw,
  Download,
  HelpCircle,
  ChevronRight
} from 'lucide-react';
import { FormDefinition, FormField, ChatMessage, AIReasoningStep } from '../types';

interface TestingStudioViewProps {
  form: FormDefinition;
  onUpdateForm: (updatedForm: FormDefinition) => void;
}

const OCR_STAGES = [
  'Uploading Document...',
  'Enhancing Image Quality...',
  'Detecting Document Type...',
  'Running OCR Processing...',
  'Extracting Key Entities...',
  'Matching Form Fields...',
  'Validating Data Against Schema...',
  'Auto Filling Application...',
  'Extraction Complete!'
];

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  uploadTime: string;
  confidence: number;
  extractedFieldsCount: number;
}

export const TestingStudioView: React.FC<TestingStudioViewProps> = ({ 
  form, 
  onUpdateForm 
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<string>(form.defaultLanguage || 'Tamil');
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore (Warm Female)');
  const [isListening, setIsListening] = useState<boolean>(false);
  const [userInputText, setUserInputText] = useState<string>('');

  // Form Fields live state
  const [liveFields, setLiveFields] = useState<FormField[]>(form.fields || []);
  const [selectedFieldForDetail, setSelectedFieldForDetail] = useState<FormField | null>(null);

  // Uploaded documents state
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([
    {
      id: 'doc-1',
      name: 'Aadhaar_Card_Front_Back.pdf',
      type: 'Aadhaar Card',
      uploadTime: '10:04 AM',
      confidence: 99,
      extractedFieldsCount: 4
    }
  ]);

  // Document OCR Uploading state
  const [isProcessingDoc, setIsProcessingDoc] = useState<boolean>(false);
  const [currentOcrStage, setCurrentOcrStage] = useState<number>(0);
  const [docModalOpen, setDocModalOpen] = useState<boolean>(false);

  // Conflict Resolution Modal State
  const [conflictData, setConflictData] = useState<{
    fieldName: string;
    fieldLabel: string;
    existingVal: string;
    existingSource: string;
    newVal: string;
    newSource: string;
  } | null>(null);

  // Messages Chat History
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: `Vanakkam! I am your AI Assistant for ${form.title}. I will help you fill this form in ${selectedLanguage} in under 2 minutes. You can speak naturally, upload documents (Aadhaar, Passport, Pay Slips), or take photos!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // AI Reasoning Steps Timeline
  const [reasoningSteps, setReasoningSteps] = useState<AIReasoningStep[]>([
    {
      id: 'r1',
      timestamp: '10:04:12',
      type: 'speech_received',
      label: 'Session Initialized',
      detail: `Loaded schema for ${form.title} (${form.department})`,
      status: 'success'
    },
    {
      id: 'r2',
      timestamp: '10:04:13',
      type: 'language_detected',
      label: 'Language Picked',
      detail: `Target language set to ${selectedLanguage} (99% confidence)`,
      status: 'success',
      confidence: 99
    }
  ]);

  // Spelling Check Modal State
  const [showSpellingModal, setShowSpellingModal] = useState<boolean>(false);
  const [spellingLetters, setSpellingLetters] = useState<string[]>([]);
  const targetSpellingWord = 'RAMASAMY';
  const [spellingProgress, setSpellingProgress] = useState<number>(0);

  // Final Review Modal State
  const [showFinalReviewModal, setShowFinalReviewModal] = useState<boolean>(false);
  const [recentlyUpdatedFieldId, setRecentlyUpdatedFieldId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate Document Upload with OCR Pipeline
  const handleUploadDocumentSimulated = async (docType: string) => {
    setDocModalOpen(false);
    setIsProcessingDoc(true);
    setCurrentOcrStage(0);

    for (let i = 0; i < OCR_STAGES.length; i++) {
      await new Promise(res => setTimeout(res, 220));
      setCurrentOcrStage(i);
    }

    setIsProcessingDoc(false);

    const newDoc: UploadedDocument = {
      id: `doc-${Date.now()}`,
      name: `${docType.replace(/\s+/g, '_')}_Verified.pdf`,
      type: docType,
      uploadTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      confidence: 98,
      extractedFieldsCount: 3
    };

    setUploadedDocs(prev => [...prev, newDoc]);

    // Update live fields based on document type
    let updated = [...liveFields];

    if (docType.includes('Aadhaar')) {
      updated = updated.map(f => {
        if (f.name.toLowerCase().includes('name')) return { ...f, value: 'Rajesh Kumar', confidenceScore: 99, extractedSourceDoc: 'Aadhaar Card', extractedValidationStatus: 'valid' };
        if (f.name.toLowerCase().includes('aadhaar')) return { ...f, value: '9842 1102 7731', confidenceScore: 99, extractedSourceDoc: 'Aadhaar Card', extractedValidationStatus: 'valid' };
        if (f.type === 'date' || f.name.toLowerCase().includes('birth')) return { ...f, value: '14/07/1999', confidenceScore: 98, extractedSourceDoc: 'Aadhaar Card', extractedValidationStatus: 'valid' };
        return f;
      });
    } else if (docType.includes('Salary') || docType.includes('Income')) {
      // Check for conflict
      const incomeField = updated.find(f => f.type === 'currency' || f.name.toLowerCase().includes('income'));
      if (incomeField && incomeField.value && incomeField.value !== '₹2,40,000') {
        setConflictData({
          fieldName: incomeField.name,
          fieldLabel: incomeField.originalLabel,
          existingVal: incomeField.value,
          existingSource: incomeField.extractedSourceDoc || 'Citizen Voice Statement',
          newVal: '₹2,40,000',
          newSource: 'Salary Slip (Form 16)'
        });
      }

      updated = updated.map(f => {
        if (f.type === 'currency' || f.name.toLowerCase().includes('income')) {
          return { ...f, value: '₹2,40,000', confidenceScore: 99, extractedSourceDoc: 'Salary Slip / Form 16', extractedValidationStatus: 'valid' };
        }
        if (f.type === 'document') {
          return { ...f, value: 'Salary_Slip_Form16.pdf (Verified)', confidenceScore: 100, extractedSourceDoc: 'Salary Slip Upload', extractedValidationStatus: 'valid' };
        }
        return f;
      });
    }

    setLiveFields(updated);

    // Timeline event
    setReasoningSteps(prev => [
      ...prev,
      {
        id: `ocr-${Date.now()}`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'entity_extracted',
        label: `${docType} OCR Success`,
        detail: `Extracted and mapped fields with 98% confidence score`,
        status: 'success',
        confidence: 98
      }
    ]);

    // Chat message confirmation
    setMessages(prev => [
      ...prev,
      {
        id: `msg-doc-${Date.now()}`,
        sender: 'ai',
        text: `Successfully processed your ${docType}! Extracted and verified values for your application automatically.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Process user speech / text response
  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'citizen',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setUserInputText('');

    // Trigger AI Pipeline Steps in Timeline
    const newSteps: AIReasoningStep[] = [
      {
        id: `step-${Date.now()}-1`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'speech_received',
        label: 'Speech Received',
        detail: `Captured transcript: "${textToSend}"`,
        status: 'active'
      },
      {
        id: `step-${Date.now()}-2`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'language_detected',
        label: 'Detecting Language',
        detail: `Identified language: ${selectedLanguage} (99% accuracy)`,
        status: 'success',
        confidence: 99
      }
    ];

    setReasoningSteps(prev => [...prev, ...newSteps]);

    // Perform Entity Matching
    let targetField: FormField | undefined;
    const lowerText = textToSend.toLowerCase();

    if (lowerText.includes('name') || lowerText.includes('rajesh') || lowerText.includes('kumar')) {
      targetField = liveFields.find(f => f.name.toLowerCase().includes('name'));
    } else if (lowerText.includes('199') || lowerText.includes('born') || lowerText.includes('july') || lowerText.includes('date')) {
      targetField = liveFields.find(f => f.type === 'date' || f.name.toLowerCase().includes('birth'));
    } else if (lowerText.includes('aadhaar') || lowerText.includes('9842')) {
      targetField = liveFields.find(f => f.name.toLowerCase().includes('aadhaar'));
    } else if (lowerText.includes('street') || lowerText.includes('coimbatore') || lowerText.includes('address')) {
      targetField = liveFields.find(f => f.type === 'address' || f.name.toLowerCase().includes('address'));
    } else if (lowerText.includes('income') || lowerText.includes('lakh') || lowerText.includes('180000')) {
      targetField = liveFields.find(f => f.type === 'currency' || f.name.toLowerCase().includes('income'));
    }

    if (targetField) {
      let extractedVal = textToSend;
      if (targetField.name.toLowerCase().includes('name')) extractedVal = 'Rajesh Kumar';
      if (targetField.type === 'date' || targetField.name.toLowerCase().includes('birth')) extractedVal = '14/07/1999';
      if (targetField.name.toLowerCase().includes('aadhaar')) extractedVal = '9842 1102 7731';
      if (targetField.type === 'address' || targetField.name.toLowerCase().includes('address')) extractedVal = 'Door No. 24, Gandhi Street, Coimbatore - 641002';
      if (targetField.type === 'currency' || targetField.name.toLowerCase().includes('income')) extractedVal = '₹1,80,000';

      const updatedFields = liveFields.map(f => f.id === targetField!.id ? {
        ...f,
        value: extractedVal,
        confidenceScore: 99,
        extractedRawSpeech: textToSend,
        extractedSourceDoc: 'Citizen Voice Statement',
        extractedValidationStatus: 'valid' as const
      } : f);

      setLiveFields(updatedFields);
      setRecentlyUpdatedFieldId(targetField.id);
      setTimeout(() => setRecentlyUpdatedFieldId(null), 2500);

      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `Recorded your ${targetField!.originalLabel} as "${extractedVal}". Let us proceed to the remaining details.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } else {
      setMessages(prev => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: `Thank you! I caught "${textToSend}". I have updated your application details in real time.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  };

  // Toggle Mic
  const toggleListening = () => {
    if (!isListening) {
      setIsListening(true);
      setTimeout(() => {
        setIsListening(false);
        const samplePhrases = [
          "My name is Rajesh Kumar. I was born on July 14th 1999.",
          "I live at 24 Gandhi Street in Coimbatore city.",
          "My annual family income is 1 lakh 80 thousand rupees."
        ];
        const randomPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
        handleSendMessage(randomPhrase);
      }, 3000);
    } else {
      setIsListening(false);
    }
  };

  // Trigger Critical Spelling Check
  const startSpellingVerification = () => {
    setShowSpellingModal(true);
    setSpellingLetters([]);
    setSpellingProgress(0);

    const chars = targetSpellingWord.split('');
    chars.forEach((char, index) => {
      setTimeout(() => {
        setSpellingLetters(prev => [...prev, char]);
        setSpellingProgress(Math.round(((index + 1) / chars.length) * 100));
      }, (index + 1) * 350);
    });
  };

  const filledCount = liveFields.filter(f => f.value && f.value.trim().length > 0).length;
  const totalCount = liveFields.length || 7;
  const completionPercentage = Math.round((filledCount / totalCount) * 100);

  return (
    <div id="testing-studio-view" className="flex flex-col h-[calc(100vh-4rem)] bg-slate-100 overflow-hidden">
      {/* TOP TESTING STUDIO BAR */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-sm">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-slate-900 tracking-tight">Citizen AI Testing Studio</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                v{form.version} Multimodal Live
              </span>
            </div>
            <p className="text-[11px] text-slate-500">{form.title} • {form.department}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Globe className="w-3.5 h-3.5 text-indigo-600" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              {form.supportedLanguages.map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-xs">
            <Volume2 className="w-3.5 h-3.5 text-indigo-600" />
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="Kore (Warm Female)">Kore (Female)</option>
              <option value="Zephyr (Clear Male)">Zephyr (Male)</option>
            </select>
          </div>

          <button
            onClick={() => setShowFinalReviewModal(true)}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" /> Preview PDF & Review
          </button>
        </div>
      </div>

      {/* PROACTIVE DOCUMENT SUGGESTION BAR */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white px-6 py-2 text-xs flex items-center justify-between border-b border-indigo-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="font-semibold text-indigo-100">Proactive Suggestion:</span>
          <span className="text-slate-300">Upload your Aadhaar Card or Salary Slip to auto-fill missing details instantly.</span>
        </div>
        <button
          onClick={() => setDocModalOpen(true)}
          className="text-[11px] font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded-lg transition-colors cursor-pointer"
        >
          + Upload Document
        </button>
      </div>

      {/* MAIN TWO-EQUAL PANELS LAYOUT */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 overflow-hidden p-5 gap-5">
        
        {/* LEFT PANEL: Conversational AI Assistant & Multimodal Input */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="font-bold text-xs text-slate-800">Multimodal Citizen AI Assistant</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Voice + Document OCR Active</span>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/20">
            {messages.map((m) => (
              <div 
                key={m.id} 
                className={`flex gap-3 text-xs ${m.sender === 'citizen' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[80%] rounded-2xl p-3.5 space-y-1 ${
                  m.sender === 'citizen'
                    ? 'bg-slate-900 text-white rounded-tr-none shadow-xs'
                    : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none shadow-xs'
                }`}>
                  <p className="leading-relaxed text-xs">{m.text}</p>
                  <p className={`text-[9px] ${m.sender === 'citizen' ? 'text-slate-400 text-right' : 'text-slate-400'}`}>
                    {m.timestamp}
                  </p>
                </div>

                {m.sender === 'citizen' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Listening Waveform */}
          {isListening && (
            <div className="bg-indigo-900 text-white p-3 border-t border-indigo-800">
              <div className="flex items-center justify-between mb-1 text-xs font-bold">
                <span className="flex items-center gap-2">
                  <Mic className="w-4 h-4 text-emerald-400 animate-bounce" /> Listening Transcribing...
                </span>
                <span className="text-[10px] text-indigo-300">Live Voice AI</span>
              </div>
              <div className="flex items-center justify-center gap-1.5 h-6 my-1">
                {[40, 80, 50, 90, 60, 100, 70, 40, 85, 55, 95].map((h, i) => (
                  <div key={i} className="w-1.5 bg-emerald-400 rounded-full animate-pulse" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
          )}

          {/* Multimodal Input Controls Bar */}
          <div className="p-3 border-t border-slate-200 bg-white space-y-2">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleListening}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-md cursor-pointer ${
                  isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                <Mic className="w-5 h-5" />
              </button>

              <button
                onClick={() => setDocModalOpen(true)}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                title="Upload Document"
              >
                <Upload className="w-4 h-4" />
              </button>

              <button
                onClick={() => handleUploadDocumentSimulated('Aadhaar Card')}
                className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center cursor-pointer"
                title="Capture Photo"
              >
                <Camera className="w-4 h-4" />
              </button>

              <input
                type="text"
                placeholder={`Type or speak in ${selectedLanguage}...`}
                value={userInputText}
                onChange={(e) => setUserInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(userInputText)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-indigo-500"
              />

              <button
                onClick={() => handleSendMessage(userInputText)}
                className="w-9 h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[10px] text-slate-400 text-center italic">
              Speak naturally, upload a document, or take a photo. I'll automatically extract and fill your application.
            </p>
          </div>
        </div>

        {/* RIGHT PANEL: Live Form Filling & Multimodal Source Badges */}
        <div className="flex flex-col gap-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-md p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div>
                <h3 className="font-bold text-slate-900 text-xs flex items-center gap-2">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  Live Application Fields & Extracted Document Sources
                </h3>
                <p className="text-[10px] text-slate-500">Shows source document, confidence score & validation status</p>
              </div>

              <button
                onClick={startSpellingVerification}
                className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-[10px] border border-amber-200 flex items-center gap-1 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" /> Verify Spelling
              </button>
            </div>

            {/* List of Form Fields with Source Badges */}
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {liveFields.map((field) => {
                const hasValue = field.value && field.value.trim().length > 0;

                return (
                  <div
                    key={field.id}
                    onClick={() => setSelectedFieldForDetail(field)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 bg-white transition-all cursor-pointer space-y-1"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 flex items-center gap-1">
                        {hasValue ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <span className="w-3.5 h-3.5 rounded-full border border-slate-300 inline-block"></span>}
                        {field.originalLabel}
                      </span>

                      {hasValue && (
                        <div className="flex items-center gap-1 text-[9px] font-mono">
                          {field.extractedSourceDoc && (
                            <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold">
                              📄 {field.extractedSourceDoc}
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                            {field.confidenceScore}%
                          </span>
                        </div>
                      )}
                    </div>

                    <p className={`text-xs font-mono font-bold pl-4 ${hasValue ? 'text-indigo-950' : 'text-slate-400 italic'}`}>
                      {hasValue ? field.value : 'Awaiting input or document upload...'}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI REASONING PIPELINE TIMELINE */}
          <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 shadow-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-400 animate-pulse" />
                Live AI Reasoning Pipeline Timeline
              </span>
              <span className="text-[10px] text-emerald-400 font-mono font-bold">Transparent Trace</span>
            </div>

            <div className="space-y-1.5 max-h-36 overflow-y-auto text-xs font-mono">
              {reasoningSteps.map((step) => (
                <div key={step.id} className="flex items-start gap-2">
                  <span className="text-[9px] text-slate-500">{step.timestamp}</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5"></div>
                  <div>
                    <span className="font-bold text-indigo-300">{step.label}: </span>
                    <span className="text-slate-300">{step.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DOCUMENT SELECTION & OCR PROCESSING MODAL */}
      {docModalOpen && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" /> Select Document to Upload
              </h3>
              <button onClick={() => setDocModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { title: 'Aadhaar Card', desc: 'Auto-fill Name, DOB, Aadhaar' },
                { title: 'PAN Card', desc: 'Auto-fill Tax ID & Name' },
                { title: 'Passport', desc: 'Auto-fill Citizenship & Address' },
                { title: 'Driving License', desc: 'Auto-fill License ID & Address' },
                { title: 'Utility Bill', desc: 'Verify Residential Address' },
                { title: 'Salary Slip / Form 16', desc: 'Verify Income Proof' }
              ].map((doc) => (
                <button
                  key={doc.title}
                  onClick={() => handleUploadDocumentSimulated(doc.title)}
                  className="p-3 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-left transition-colors cursor-pointer space-y-1"
                >
                  <span className="font-bold text-indigo-950 block">{doc.title}</span>
                  <span className="text-[10px] text-slate-500 block">{doc.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ANIMATED OCR PROCESSING OVERLAY */}
      {isProcessingDoc && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mx-auto flex items-center justify-center font-bold animate-bounce">
              <FileCheck2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-sm">Multimodal OCR Document Pipeline</h3>
              <p className="text-xs text-indigo-600 font-mono mt-0.5">{OCR_STAGES[currentOcrStage]}</p>
            </div>

            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-indigo-600 h-full transition-all duration-200" 
                style={{ width: `${((currentOcrStage + 1) / OCR_STAGES.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* CONFLICT RESOLUTION MODAL */}
      {conflictData && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
              <AlertCircle className="w-5 h-5" /> Document Conflict Resolution
            </div>

            <p className="text-xs text-slate-600">
              We detected different values for <span className="font-bold text-slate-900">{conflictData.fieldLabel}</span>. Please select which value to retain:
            </p>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => setConflictData(null)}
                className="w-full p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-left transition-colors cursor-pointer"
              >
                <div className="flex justify-between font-bold text-slate-900">
                  <span>{conflictData.existingVal}</span>
                  <span className="text-[10px] text-slate-500">{conflictData.existingSource}</span>
                </div>
              </button>

              <button
                onClick={() => setConflictData(null)}
                className="w-full p-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-left transition-colors cursor-pointer"
              >
                <div className="flex justify-between font-bold text-indigo-950">
                  <span>{conflictData.newVal}</span>
                  <span className="text-[10px] text-indigo-600">{conflictData.newSource}</span>
                </div>
              </button>
            </div>

            <button
              onClick={() => setConflictData(null)}
              className="w-full py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
            >
              Confirm Selection
            </button>
          </div>
        </div>
      )}

      {/* SPELLING VERIFICATION MODAL */}
      {showSpellingModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl text-center space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Critical Field Verification</h3>
            <p className="text-xs text-slate-500">Letter-by-letter spelling check for "{targetSpellingWord}"</p>

            <div className="flex justify-center gap-1.5 py-2">
              {spellingLetters.map((c, i) => (
                <span key={i} className="w-9 h-11 rounded-lg bg-indigo-600 text-white font-mono font-bold text-base flex items-center justify-center shadow-md">
                  {c}
                </span>
              ))}
            </div>

            <button onClick={() => setShowSpellingModal(false)} className="w-full py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer">
              Confirm & Continue
            </button>
          </div>
        </div>
      )}

      {/* FINAL REVIEW MODAL */}
      {showFinalReviewModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Final Application Review</h3>
              <button onClick={() => setShowFinalReviewModal(false)} className="p-1 cursor-pointer">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono max-h-80 overflow-y-auto">
              {liveFields.map(f => (
                <div key={f.id} className="p-2 border-b flex justify-between">
                  <span className="text-slate-500 font-sans">{f.originalLabel}:</span>
                  <span className="font-bold text-slate-900">{f.value || '[Not Provided]'}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowFinalReviewModal(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer">
                Close
              </button>
              <button onClick={() => alert('Application submitted successfully!')} className="px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl text-xs cursor-pointer">
                Submit Form
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
