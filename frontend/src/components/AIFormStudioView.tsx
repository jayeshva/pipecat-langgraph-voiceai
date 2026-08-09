import React, { useState } from 'react';
import { 
  Sparkles, 
  Send, 
  FileText, 
  Layers, 
  CheckCircle2, 
  Settings2, 
  Palette, 
  QrCode, 
  Barcode, 
  ShieldCheck, 
  Download, 
  Share2, 
  Eye, 
  Plus, 
  Trash2, 
  Edit3, 
  Bot, 
  Building2, 
  ArrowRight,
  Code,
  Check,
  RefreshCw,
  Image as ImageIcon,
  Lock,
  Sliders,
  ChevronDown,
  ChevronUp,
  Globe,
  FileType,
  Upload,
  X,
  Camera,
  FileCheck2
} from 'lucide-react';
import { FormDefinition, FormField, FormBranding, ConditionalLogic } from '../types';
import { ActiveTab } from './Sidebar';

interface AIFormStudioViewProps {
  onFormCreated: (form: FormDefinition) => void;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectFormForTesting: (form: FormDefinition) => void;
}

const GENERATION_STAGES = [
  'Understanding Requirements',
  'Analyzing Uploaded Image & OCR Vision',
  'Designing Form Layout',
  'Applying Branding & Custom Logo',
  'Generating Professional HTML Template',
  'Creating Responsive Layout',
  'Identifying Form Sections',
  'Creating Input Fields',
  'Building Validation Rules',
  'Generating Conditional Logic',
  'Creating Multilingual Labels',
  'Building Conversational Flow',
  'Generating JSON Schema',
  'Preparing Printable PDF',
  'Optimizing Voice Workflow',
  'Ready for Review'
];

export const AIFormStudioView: React.FC<AIFormStudioViewProps> = ({
  onFormCreated,
  setActiveTab,
  onSelectFormForTesting
}) => {
  const [nlPrompt, setNlPrompt] = useState(
    "Create an Income Certificate application for the Revenue Department. Collect Name, Father's Name, Date of Birth, Aadhaar Number, Address, Occupation, Annual Income, and Supporting Documents. Aadhaar is mandatory. If Annual Income is greater than ₹2,00,000, ask for Income Proof. If the applicant is under 18, collect Guardian Details. Generate the form in Tamil and English using Government branding."
  );

  // Form Image Upload state (for AI Vision analysis)
  const [uploadedFormImage, setUploadedFormImage] = useState<string | null>(null);
  const [uploadedFormImageName, setUploadedFormImageName] = useState<string | null>(null);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState<boolean>(false);

  // Branding Customization State
  const [branding, setBranding] = useState<FormBranding>({
    departmentName: 'Department of Revenue & Land Records',
    formTitle: 'Application for Issuance of Income & Assets Certificate',
    primaryColor: '#4f46e5',
    paperSize: 'A4',
    orientation: 'portrait',
    showQrCode: true,
    showBarcode: true,
    watermarkText: 'GOVERNMENT OF INDIA OFFICIAL CERTIFICATE',
    footerText: 'Issued by Department of Revenue. Valid across all Ministries under IT Act 2000.',
    termsAndConditions: '1. All statements made in this application are true to the best of my knowledge.\n2. Any false representation is punishable under Section 199/200 of IPC.',
    departmentLogo: 'https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=120&auto=format&fit=crop&q=80',
    signatureImage: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=160&auto=format&fit=crop&q=80'
  });

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [currentStageIndex, setCurrentStageIndex] = useState<number>(0);

  // Generated Form State (3-Panel Editor)
  const [generatedForm, setGeneratedForm] = useState<FormDefinition | null>(null);
  const [previewMode, setPreviewMode] = useState<'html' | 'pdf' | 'mobile'>('html');

  // AI Assistant Chat modifying instructions
  const [assistantInput, setAssistantInput] = useState('');
  const [chatImageAttachment, setChatImageAttachment] = useState<string | null>(null);
  const [assistantHistory, setAssistantHistory] = useState<Array<{ sender: 'admin' | 'ai'; text: string; image?: string }>>([
    {
      sender: 'ai',
      text: 'Form generated successfully! You can instruct me in natural language, upload custom logos or sample form images, adjust layout, add photo fields, or edit conditional logic.'
    }
  ]);

  const [activeCenterTab, setActiveCenterTab] = useState<'fields' | 'logic' | 'branding' | 'schema'>('fields');
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  // Handle Image File Upload for Form Analysis
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const resultUrl = event.target?.result as string;
        setUploadedFormImage(resultUrl);
        setUploadedFormImageName(file.name);
        triggerVisionAnalysis(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Simulate AI Vision Analysis on uploaded image
  const triggerVisionAnalysis = (fileName: string) => {
    setIsAnalyzingImage(true);
    setTimeout(() => {
      setIsAnalyzingImage(false);
      setNlPrompt(prev => 
        `[Extracted from Uploaded Form Image "${fileName}"]: Application for Government Certificate. Detected Fields: Full Name, Father's Name, DOB, Aadhaar Number, Address, Passport Size Photo, Annual Household Income, Document Proof attachments.\n\n` + prev
      );
    }, 1200);
  };

  // Preset Sample Form Image loader
  const handleSelectSampleImage = (sampleName: string, imgUrl: string) => {
    setUploadedFormImage(imgUrl);
    setUploadedFormImageName(sampleName);
    triggerVisionAnalysis(sampleName);
  };

  // Handle Branding Logo File Upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, targetKey: 'departmentLogo' | 'governmentSeal' | 'signatureImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const resultUrl = event.target?.result as string;
        setBranding(prev => ({
          ...prev,
          [targetKey]: resultUrl
        }));

        if (generatedForm) {
          setGeneratedForm(prev => prev ? {
            ...prev,
            branding: {
              ...prev.branding,
              [targetKey]: resultUrl
            }
          } : null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle Chat Assistant Image Attachment
  const handleChatImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setChatImageAttachment(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger Natural Language Form Generation
  const handleGenerateForm = async () => {
    setIsGenerating(true);
    setCurrentStageIndex(0);

    // Simulate animated generation stages
    for (let i = 0; i < GENERATION_STAGES.length; i++) {
      await new Promise(res => setTimeout(res, 180));
      setCurrentStageIndex(i);
    }

    const newForm: FormDefinition = {
      id: `nl-form-${Date.now()}`,
      title: branding.formTitle || 'Income Certificate Application',
      department: branding.departmentName || 'Department of Revenue',
      category: 'Revenue & Taxes',
      description: 'AI Generated official application form created via natural language description and image vision analysis.',
      version: '1.0',
      status: 'draft',
      supportedLanguages: ['English', 'Tamil', 'Hindi', 'Telugu'],
      defaultLanguage: 'Tamil',
      tags: ['AI Generated', 'Revenue', 'Income Certificate', 'Govt Verified', 'Vision OCR'],
      totalConversations: 0,
      completionRate: 98,
      updatedAt: 'Just now',
      updatedBy: 'Admin Officer',
      branding: branding,
      fields: [
        {
          id: 'f-1',
          name: 'applicantName',
          originalLabel: 'Full Applicant Name',
          type: 'text',
          required: true,
          confidenceScore: 99,
          conversationPrompt: 'Vanakkam! Please state your full legal name as mentioned in your government ID.',
          aliases: ['Name', 'Full Name', 'Applicant']
        },
        {
          id: 'f-2',
          name: 'fatherName',
          originalLabel: "Father's / Guardian's Name",
          type: 'text',
          required: true,
          confidenceScore: 98,
          conversationPrompt: "Thank you. What is your Father's or Guardian's full name?",
          aliases: ['Father Name', 'Parent Name']
        },
        {
          id: 'f-3',
          name: 'dateOfBirth',
          originalLabel: 'Date of Birth (DD/MM/YYYY)',
          type: 'date',
          required: true,
          confidenceScore: 97,
          conversationPrompt: 'Please provide your date of birth in day, month, and year format.',
          aliases: ['DOB', 'Birth Date', 'Born']
        },
        {
          id: 'f-4',
          name: 'applicantPhoto',
          originalLabel: 'Applicant Passport Size Photograph',
          type: 'document',
          required: true,
          confidenceScore: 99,
          conversationPrompt: 'Please upload or capture a clear passport-size photo of the applicant.',
          aliases: ['Passport Photo', 'Photo', 'Applicant Image']
        },
        {
          id: 'f-5',
          name: 'aadhaarNumber',
          originalLabel: 'Aadhaar Identification Number',
          type: 'text',
          required: true,
          confidenceScore: 99,
          regex: '^[0-9]{12}$',
          conversationPrompt: 'Please state or upload your 12-digit Aadhaar Card number for identity verification.',
          aliases: ['Aadhaar', 'UIDAI', 'Aadhaar Card']
        },
        {
          id: 'f-6',
          name: 'residentialAddress',
          originalLabel: 'Permanent Residential Address',
          type: 'address',
          required: true,
          confidenceScore: 96,
          conversationPrompt: 'What is your complete residential street address along with PIN code?',
          aliases: ['Address', 'Residence', 'Door No']
        },
        {
          id: 'f-7',
          name: 'annualIncome',
          originalLabel: 'Total Family Annual Income (₹)',
          type: 'currency',
          required: true,
          confidenceScore: 95,
          conversationPrompt: 'Please declare your total annual household income from all sources in Rupees.',
          aliases: ['Income', 'Annual Income', 'Family Income'],
          conditionalLogic: [
            {
              id: 'cl-1',
              triggerFieldId: 'f-7',
              operator: 'greater_than',
              value: '200000',
              action: 'require_document'
            }
          ]
        },
        {
          id: 'f-8',
          name: 'incomeProofDoc',
          originalLabel: 'Income Proof Document (Pay Slip / Form 16)',
          type: 'document',
          required: false,
          confidenceScore: 99,
          conversationPrompt: 'Since your income exceeds ₹2,00,000, please upload your Salary Slip, Form 16, or Bank Passbook.',
          aliases: ['Pay Slip', 'Salary Slip', 'Form 16']
        }
      ]
    };

    setGeneratedForm(newForm);
    onFormCreated(newForm);
    setIsGenerating(false);
  };

  // Modify form via Natural Language Assistant instructions
  const handleModifyForm = (instruction: string) => {
    if ((!instruction.trim() && !chatImageAttachment) || !generatedForm) return;

    const userText = instruction.trim() || (chatImageAttachment ? 'Applied uploaded image modification.' : '');
    setAssistantHistory(prev => [...prev, { sender: 'admin', text: userText, image: chatImageAttachment || undefined }]);
    setAssistantInput('');
    const currentAttachment = chatImageAttachment;
    setChatImageAttachment(null);

    const lower = userText.toLowerCase();
    let updated = { ...generatedForm };
    let reply = `I have processed your request "${userText}" and updated the form schema and layout!`;

    if (currentAttachment && (lower.includes('logo') || lower.includes('seal') || lower.includes('emblem'))) {
      updated.branding = { ...updated.branding, departmentLogo: currentAttachment };
      reply = 'Updated official Department Logo with the uploaded image!';
    } else if (currentAttachment && lower.includes('signature')) {
      updated.branding = { ...updated.branding, signatureImage: currentAttachment };
      reply = 'Applied uploaded image as the Digital Authority Signature!';
    } else if (lower.includes('photo') || lower.includes('picture') || lower.includes('passport photo')) {
      const photoField: FormField = {
        id: `f-${Date.now()}`,
        name: 'passportPhoto',
        originalLabel: 'Applicant Passport Photograph',
        type: 'document',
        required: true,
        confidenceScore: 99,
        conversationPrompt: 'Please upload or capture a clear passport photo image.',
        aliases: ['Photo', 'Passport Photo', 'Image Upload']
      };
      updated.fields.unshift(photoField);
      reply = 'Added Applicant Passport Photo Upload field at top of form.';
    } else if (lower.includes('address above income') || lower.includes('move address')) {
      const addr = updated.fields.find(f => f.name === 'residentialAddress');
      if (addr) {
        const without = updated.fields.filter(f => f.name !== 'residentialAddress');
        const incomeIdx = without.findIndex(f => f.name === 'annualIncome');
        if (incomeIdx !== -1) {
          without.splice(incomeIdx, 0, addr);
          updated.fields = without;
          reply = 'Moved Address field directly above Annual Income.';
        }
      }
    } else if (lower.includes('mobile') || lower.includes('phone')) {
      const mobileField: FormField = {
        id: `f-${Date.now()}`,
        name: 'mobileNumber',
        originalLabel: 'Mobile Phone Number',
        type: 'phone',
        required: false,
        confidenceScore: 99,
        conversationPrompt: 'Please provide an optional contact mobile number for SMS status updates.',
        aliases: ['Mobile', 'Phone', 'Cell']
      };
      updated.fields.push(mobileField);
      reply = 'Added optional Mobile Phone Number field.';
    } else if (lower.includes('passport')) {
      const passportField: FormField = {
        id: `f-${Date.now()}`,
        name: 'passportNumber',
        originalLabel: 'Passport Document Number',
        type: 'text',
        required: false,
        confidenceScore: 98,
        conversationPrompt: 'Please state your 8-character Passport Number if applicable.',
        aliases: ['Passport', 'Passport ID']
      };
      updated.fields.push(passportField);
      reply = 'Added Passport Number field to schema.';
    } else if (lower.includes('landscape')) {
      updated.branding = { ...updated.branding, orientation: 'landscape' };
      reply = 'Converted printable document layout orientation to Landscape mode.';
    } else if (lower.includes('hindi')) {
      if (!updated.supportedLanguages.includes('Hindi')) {
        updated.supportedLanguages.push('Hindi');
      }
      updated.defaultLanguage = 'Hindi';
      reply = 'Generated Hindi translation pack and updated default language to Hindi.';
    } else if (lower.includes('signature')) {
      updated.branding = { ...updated.branding, signatureImage: 'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=160&auto=format&fit=crop&q=80' };
      reply = 'Added official Digital Authority Signature block to bottom right of PDF.';
    }

    setGeneratedForm(updated);
    setAssistantHistory(prev => [...prev, { sender: 'ai', text: reply }]);
  };

  // Publish Form with Caching
  const handlePublishForm = () => {
    if (!generatedForm) return;

    const published: FormDefinition = {
      ...generatedForm,
      status: 'published',
      cachedArtifacts: {
        html: `<html><body><h1>${generatedForm.title}</h1></body></html>`,
        pdfTemplate: 'cached-pdf-v1.pdf',
        jsonSchema: JSON.stringify(generatedForm.fields, null, 2),
        validationRules: 'Aadhaar: ^[0-9]{12}$',
        conditionalLogic: 'Income > 200000 => Require Document',
        conversationFlow: 'Voice AI Tamil/English Flow Engine',
        voicePrompts: 'Kore Warm Female Voice Pack',
        translationPack: 'Tamil, Hindi, English, Telugu'
      }
    };

    setGeneratedForm(published);
    onFormCreated(published);
    setPublishedSuccess(true);
    setTimeout(() => setPublishedSuccess(false), 3000);
  };

  return (
    <div id="ai-form-studio-view" className="flex flex-col h-[calc(100vh-4rem)] bg-slate-900 text-slate-100 overflow-hidden">
      {/* TOP AI FORM STUDIO NAVBAR */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
            <Sparkles className="w-4 h-4 text-indigo-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-sm text-white tracking-tight">AI Form Creation Studio</h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Multimodal Vision + Prompt Engine
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Generate entire forms & printable PDFs using natural language or uploaded form images</p>
          </div>
        </div>

        {generatedForm && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onSelectFormForTesting(generatedForm);
                setActiveTab('testing_studio');
              }}
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-indigo-400" /> Test Live AI Flow
            </button>

            <button
              id="publish-nl-form-btn"
              onClick={handlePublishForm}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Publish & Cache Artifacts
            </button>
          </div>
        )}
      </div>

      {/* IF NOT YET GENERATED: SHOW PROMPT, IMAGE UPLOADER & BRANDING CUSTOMIZER */}
      {!generatedForm && !isGenerating && (
        <div className="flex-1 overflow-y-auto p-8 max-w-5xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Describe or Upload Image of Your Form Requirements</h1>
            <p className="text-xs text-slate-400 max-w-2xl mx-auto">
              Our AI Form Architect automatically reads plain English prompts AND uploaded images of paper forms, scans, or wireframes to build field structures, validation rules, and printable PDF documents.
            </p>
          </div>

          {/* Prompt + Image Dropzone Box */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-indigo-400 flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Natural Language Prompt & Multimodal Image Inputs
              </label>

              <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 font-mono">
                Supports Text + Image Scans
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Textarea Prompt (Cols 2) */}
              <div className="md:col-span-2 space-y-2">
                <textarea
                  rows={6}
                  value={nlPrompt}
                  onChange={(e) => setNlPrompt(e.target.value)}
                  placeholder="e.g. Create a Scholarship Application form for Higher Education department..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed font-sans"
                />
              </div>

              {/* Form Image Upload Area (Col 1) */}
              <div className="bg-slate-900 border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-3 flex flex-col items-center justify-center text-center relative group transition-colors">
                {uploadedFormImage ? (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-2 relative">
                    <img 
                      src={uploadedFormImage} 
                      alt="Uploaded Form Scan" 
                      className="max-h-28 rounded border border-indigo-500/30 object-cover shadow-md"
                    />
                    <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[150px]">{uploadedFormImageName}</span>
                    </div>
                    <button
                      onClick={() => {
                        setUploadedFormImage(null);
                        setUploadedFormImageName(null);
                      }}
                      className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-600 text-white hover:bg-rose-500 cursor-pointer shadow-md"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : isAnalyzingImage ? (
                  <div className="space-y-2">
                    <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mx-auto"></div>
                    <p className="text-[10px] font-mono text-indigo-300 animate-pulse">Running OCR Vision Analysis...</p>
                  </div>
                ) : (
                  <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer space-y-2 py-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">Upload Form Image</span>
                      <span className="text-[10px] text-slate-500 block mt-0.5">Paper Scan, Photo or Mockup</span>
                    </div>
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded border border-indigo-500/30">
                      + Select Image File
                    </span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageFileUpload} 
                      className="hidden" 
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Quick Sample Image Presets */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/80">
              <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                <ImageIcon className="w-3 h-3 text-indigo-400" /> Try sample form image scans:
              </span>
              {[
                { name: 'Income Certificate Form Scan', url: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&auto=format&fit=crop&q=80' },
                { name: 'Passport Renewal Paper Form', url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80' },
                { name: 'Government Pension Scheme Wireframe', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&auto=format&fit=crop&q=80' }
              ].map((sample) => (
                <button
                  key={sample.name}
                  onClick={() => handleSelectSampleImage(sample.name, sample.url)}
                  className="text-[10px] bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <ImageIcon className="w-3 h-3 text-indigo-400" />
                  + {sample.name}
                </button>
              ))}
            </div>

            {/* Prompt Quick Suggestions Chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[10px] text-slate-500 font-semibold">Try sample text prompts:</span>
              {[
                "Income Certificate with Aadhaar & Income Proof",
                "Passport Renewal Form with Document Attachments",
                "Senior Citizen Pension Scheme Application",
                "Higher Education Scholarship Portal"
              ].map((sample) => (
                <button
                  key={sample}
                  onClick={() => setNlPrompt(`Create a ${sample} collecting applicant details, address, government ID, and upload proof.`)}
                  className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  + {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Branding & Logo Image Customizer */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Palette className="w-4 h-4 text-indigo-400" /> Branding, Logo Images & Document Formatting Settings
            </h3>

            {/* Image Uploads for Department Logo & Digital Signature */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              {/* Department Logo Upload */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-indigo-300 flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5" /> Official Department Logo Image
                </label>
                <div className="flex items-center gap-3">
                  {branding.departmentLogo ? (
                    <img 
                      src={branding.departmentLogo} 
                      alt="Department Logo" 
                      className="w-12 h-12 rounded-xl object-cover bg-white p-1 border border-indigo-500/30"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                  )}

                  <div className="flex-1 space-y-1">
                    <label className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-sm">
                      <Upload className="w-3.5 h-3.5" /> Upload Logo Image
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleLogoUpload(e, 'departmentLogo')} 
                        className="hidden" 
                      />
                    </label>
                    <p className="text-[10px] text-slate-400">Appears at top header of printable PDF & web form</p>
                  </div>
                </div>
              </div>

              {/* Digital Signature Image Upload */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-indigo-300 flex items-center gap-2">
                  <FileCheck2 className="w-3.5 h-3.5" /> Digital Authority Signature Stamp Image
                </label>
                <div className="flex items-center gap-3">
                  {branding.signatureImage ? (
                    <img 
                      src={branding.signatureImage} 
                      alt="Signature Stamp" 
                      className="w-16 h-10 rounded-lg object-contain bg-white p-1 border border-indigo-500/30"
                    />
                  ) : (
                    <div className="w-16 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 text-[10px]">
                      No Image
                    </div>
                  )}

                  <div className="flex-1 space-y-1">
                    <label className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-indigo-400" /> Upload Signature Image
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleLogoUpload(e, 'signatureImage')} 
                        className="hidden" 
                      />
                    </label>
                    <p className="text-[10px] text-slate-400">Embedded in bottom footer of generated document</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-medium">Department / Organization Name</label>
                <input
                  type="text"
                  value={branding.departmentName}
                  onChange={(e) => setBranding({ ...branding, departmentName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Official Form Title</label>
                <input
                  type="text"
                  value={branding.formTitle}
                  onChange={(e) => setBranding({ ...branding, formTitle: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-medium">Paper Size</label>
                <select
                  value={branding.paperSize}
                  onChange={(e) => setBranding({ ...branding, paperSize: e.target.value as any })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="A4">A4 (Standard Govt)</option>
                  <option value="Legal">Legal Size</option>
                  <option value="Letter">US Letter</option>
                </select>
              </div>
            </div>

            {/* Checkboxes for QR, Barcode, Seals */}
            <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-slate-800/80 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={branding.showQrCode}
                  onChange={(e) => setBranding({ ...branding, showQrCode: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                Include Official QR Code
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={branding.showBarcode}
                  onChange={(e) => setBranding({ ...branding, showBarcode: e.target.checked })}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                Include Application Serial Barcode
              </label>
            </div>
          </div>

          {/* GENERATE FORM BUTTON */}
          <div className="text-center pt-2">
            <button
              id="start-generate-form-btn"
              onClick={handleGenerateForm}
              className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2.5 mx-auto transition-all transform hover:scale-105 cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-indigo-100" />
              Generate Form via AI
            </button>
          </div>
        </div>
      )}

      {/* ANIMATED GENERATION STAGES WORKFLOW */}
      {isGenerating && (
        <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-indigo-600/20 border-2 border-indigo-500 flex items-center justify-center text-indigo-400 animate-bounce shadow-2xl">
            <Sparkles className="w-8 h-8" />
          </div>

          <div className="text-center space-y-2">
            <h3 className="font-bold text-lg text-white">AI Form Creation Engine at Work</h3>
            <p className="text-xs text-indigo-300 font-mono">Stage {currentStageIndex + 1} of {GENERATION_STAGES.length}: {GENERATION_STAGES[currentStageIndex]}</p>
          </div>

          {/* Animated Stages Progress Checklist */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-2 shadow-2xl max-h-72 overflow-y-auto">
            {GENERATION_STAGES.map((stage, idx) => {
              const isDone = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;

              return (
                <div key={stage} className={`flex items-center gap-3 text-xs ${
                  isDone ? 'text-emerald-400 font-medium' : isCurrent ? 'text-indigo-300 font-bold' : 'text-slate-600'
                }`}>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  ) : isCurrent ? (
                    <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin shrink-0"></div>
                  ) : (
                    <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0"></div>
                  )}
                  <span>{stage}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AFTER GENERATION: THREE-PANEL EDITOR */}
      {generatedForm && !isGenerating && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* LEFT PANEL (Cols 4): Live HTML Form & Printable PDF Preview */}
          <div className="lg:col-span-4 bg-slate-950 border-r border-slate-800 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Live HTML & PDF Template
              </span>

              <div className="flex bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[10px]">
                <button
                  onClick={() => setPreviewMode('html')}
                  className={`px-2 py-1 rounded ${previewMode === 'html' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
                >
                  HTML
                </button>
                <button
                  onClick={() => setPreviewMode('pdf')}
                  className={`px-2 py-1 rounded ${previewMode === 'pdf' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
                >
                  PDF
                </button>
              </div>
            </div>

            {/* Printable Paper Canvas */}
            <div className="flex-1 p-4 overflow-y-auto bg-slate-900 flex justify-center">
              <div className={`bg-white rounded-xl shadow-2xl p-6 text-slate-900 text-xs font-serif transition-all ${
                generatedForm.branding?.orientation === 'landscape' ? 'w-[500px] min-h-[350px]' : 'w-[380px] min-h-[520px]'
              }`}>
                {/* Government Header Banner with Department Logo Image */}
                <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center space-y-2">
                  <div className="flex items-center justify-between">
                    {generatedForm.branding?.departmentLogo ? (
                      <img 
                        src={generatedForm.branding.departmentLogo} 
                        alt="Logo" 
                        className="w-10 h-10 object-contain rounded"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-indigo-900 text-white flex items-center justify-center font-bold text-[9px]">
                        GOVT
                      </div>
                    )}

                    <span className="text-[8px] font-mono font-bold text-slate-500">FORM CODE: INF-{generatedForm.id.slice(-4)}</span>

                    {generatedForm.branding?.showQrCode && (
                      <div className="w-7 h-7 bg-slate-900 text-white flex items-center justify-center font-mono text-[7px] font-bold rounded">
                        QR
                      </div>
                    )}
                  </div>
                  <h2 className="text-xs font-extrabold uppercase text-slate-900 tracking-tight">{generatedForm.department}</h2>
                  <h3 className="text-[11px] font-bold text-indigo-900 uppercase mt-0.5">{generatedForm.title}</h3>
                </div>

                {/* Form Fields List in HTML Preview */}
                <div className="space-y-3 font-sans text-[11px]">
                  {generatedForm.fields.map((f, i) => (
                    <div key={f.id} className="border-b border-slate-200 pb-2">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{i + 1}. {f.originalLabel}</span>
                        {f.required && <span className="text-rose-600 text-[9px]">*Required</span>}
                      </div>
                      <div className="mt-1 h-6 bg-slate-50 border border-slate-300 rounded px-2 flex items-center text-slate-400 font-mono text-[10px]">
                        [{f.value || `Enter ${f.name}...`}]
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer Notes & Digital Signature Image */}
                <div className="mt-6 pt-3 border-t border-slate-300 text-[9px] font-sans text-slate-500 flex justify-between items-end">
                  <div className="space-y-1">
                    <p>{generatedForm.branding?.footerText}</p>
                    {generatedForm.branding?.showBarcode && (
                      <div className="font-mono bg-slate-200 px-2 py-0.5 text-slate-800 tracking-widest text-[8px]">
                        ||||||| | ||||| |||| |||||
                      </div>
                    )}
                  </div>

                  {generatedForm.branding?.signatureImage && (
                    <div className="text-center font-serif text-[8px] text-indigo-900 border-t border-indigo-900 pt-1">
                      <img 
                        src={generatedForm.branding.signatureImage} 
                        alt="Signature" 
                        className="h-6 object-contain mx-auto mb-0.5"
                      />
                      <span>[Digital Authority Signature]</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CENTER PANEL (Cols 5): AI Form Schema, Fields & Logic */}
          <div className="lg:col-span-5 bg-slate-900 border-r border-slate-800 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Form Schema & Rules Architecture
              </span>

              <div className="flex gap-1 text-[10px]">
                <button
                  onClick={() => setActiveCenterTab('fields')}
                  className={`px-2 py-1 rounded-lg ${activeCenterTab === 'fields' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
                >
                  Fields ({generatedForm.fields.length})
                </button>
                <button
                  onClick={() => setActiveCenterTab('logic')}
                  className={`px-2 py-1 rounded-lg ${activeCenterTab === 'logic' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400'}`}
                >
                  Logic
                </button>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {activeCenterTab === 'fields' && generatedForm.fields.map((field, idx) => (
                <div key={field.id} className="bg-slate-950 rounded-xl p-3 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">#{idx + 1} {field.originalLabel}</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {field.type}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 italic bg-slate-900 p-2 rounded border border-slate-800/80">
                    "{field.conversationPrompt}"
                  </p>

                  {field.conditionalLogic && field.conditionalLogic.length > 0 && (
                    <div className="text-[10px] bg-amber-500/10 text-amber-300 border border-amber-500/20 p-2 rounded flex items-center gap-1 font-mono">
                      <span>⚡ Conditional rule: Require proof if {field.name} &gt; 200,000</span>
                    </div>
                  )}
                </div>
              ))}

              {activeCenterTab === 'logic' && (
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-indigo-300">Rule 1: Income Proof Dependency</span>
                    <p className="text-slate-400 text-[11px]">IF Annual Income &gt; ₹2,00,000 THEN Require Document Upload (Pay Slip / Form 16)</p>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-indigo-300">Rule 2: Guardian Details Trigger</span>
                    <p className="text-slate-400 text-[11px]">IF Applicant Age &lt; 18 THEN Prompt for Guardian Full Name & Aadhaar Number</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT PANEL (Cols 3): AI Assistant Chat (Canva/Notion Style Modifiers + Image Upload) */}
          <div className="lg:col-span-3 bg-slate-950 flex flex-col overflow-hidden">
            <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white">AI Form Assistant</span>
            </div>

            {/* Chat Log */}
            <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
              {assistantHistory.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl space-y-1.5 ${
                    msg.sender === 'admin'
                      ? 'bg-indigo-600 text-white ml-4 font-medium'
                      : 'bg-slate-900 border border-slate-800 text-slate-300 mr-4'
                  }`}
                >
                  {msg.image && (
                    <img 
                      src={msg.image} 
                      alt="Attachment" 
                      className="max-h-24 rounded border border-indigo-400/30 object-cover"
                    />
                  )}
                  <p>{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Natural Language Instruction + Image Attachment Input */}
            <div className="p-3 border-t border-slate-800 space-y-2">
              {chatImageAttachment && (
                <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-indigo-500/30 text-xs">
                  <div className="flex items-center gap-2">
                    <img src={chatImageAttachment} alt="Attached" className="w-8 h-8 rounded object-cover" />
                    <span className="text-[10px] text-indigo-300">Image attached</span>
                  </div>
                  <button onClick={() => setChatImageAttachment(null)} className="p-1 hover:text-rose-400 cursor-pointer">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex gap-1.5">
                <label className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 rounded-xl cursor-pointer flex items-center justify-center shrink-0">
                  <ImageIcon className="w-4 h-4" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleChatImageUpload} 
                    className="hidden" 
                  />
                </label>

                <input
                  type="text"
                  placeholder='e.g. "Use attached logo" or "Add photo field"...'
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleModifyForm(assistantInput)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
                />

                <button
                  onClick={() => handleModifyForm(assistantInput)}
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors cursor-pointer shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Modifier Chips */}
              <div className="flex flex-wrap gap-1">
                {[
                  "Add Passport Photo field",
                  "Move Address above Income",
                  "Add Passport Number",
                  "Convert to Landscape",
                  "Add Digital Signature"
                ].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleModifyForm(chip)}
                    className="text-[9px] bg-slate-900 hover:bg-slate-800 text-indigo-300 border border-slate-800 px-2 py-0.5 rounded cursor-pointer"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

