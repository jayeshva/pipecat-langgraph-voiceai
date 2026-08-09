export type FormCategory = 
  | 'Revenue & Taxes'
  | 'Immigration & Passports'
  | 'Education & Scholarships'
  | 'Transport & Licensing'
  | 'Social Welfare & Pensions'
  | 'Banking & Credit'
  | 'Healthcare';

export type FieldType = 
  | 'text'
  | 'number'
  | 'date'
  | 'currency'
  | 'select'
  | 'document'
  | 'phone'
  | 'email'
  | 'address';

export interface ConditionalLogic {
  id: string;
  triggerFieldId: string;
  operator: 'equals' | 'greater_than' | 'contains' | 'not_empty';
  value: string;
  action: 'show_field' | 'require_document' | 'skip_node';
  targetFieldId?: string;
}

export interface FormBranding {
  departmentLogo?: string;
  governmentSeal?: string;
  headerBanner?: string;
  footerText?: string;
  watermarkText?: string;
  signatureImage?: string;
  primaryColor?: string;
  paperSize?: 'A4' | 'Legal' | 'Letter';
  showQrCode?: boolean;
  showBarcode?: boolean;
  termsAndConditions?: string;
  departmentName?: string;
  formTitle?: string;
  orientation?: 'portrait' | 'landscape';
}

export interface FormField {
  id: string;
  name: string;
  originalLabel: string;
  type: FieldType;
  required: boolean;
  confidenceScore: number; // 0 - 100
  conversationPrompt: string;
  aliases: string[];
  regex?: string;
  helpText?: string;
  value?: string;
  extractedRawSpeech?: string;
  extractedReasoning?: string;
  alternativeValues?: string[];
  extractedSourceDoc?: string;
  extractedValidationStatus?: 'valid' | 'needs_confirmation' | 'unverified';
  bbox?: { x: number; y: number; width: number; height: number; page: number };
  conditionalLogic?: ConditionalLogic[];
  needsReview?: boolean;
}

export interface FormDefinition {
  id: string;
  title: string;
  department: string;
  category: FormCategory;
  description: string;
  version: string;
  status: 'published' | 'draft' | 'archived';
  supportedLanguages: string[];
  defaultLanguage: string;
  tags: string[];
  specialInstructions?: string;
  fields: FormField[];
  totalConversations: number;
  completionRate: number;
  updatedAt: string;
  updatedBy: string;
  pdfUrl?: string;
  branding?: FormBranding;
  htmlTemplate?: string;
  cachedArtifacts?: {
    html: string;
    pdfTemplate: string;
    jsonSchema: string;
    validationRules: string;
    conditionalLogic: string;
    conversationFlow: string;
    voicePrompts: string;
    translationPack: string;
  };
}

export type WorkflowNodeType = 
  | 'greeting'
  | 'collect_info'
  | 'conditional'
  | 'upload_doc'
  | 'spelling_confirm'
  | 'confirmation'
  | 'generate_pdf';

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  title: string;
  fieldIds?: string[];
  position: { x: number; y: number };
  properties: {
    prompt: string;
    voice: string;
    language: string;
    retryLimit: number;
    fallbackPrompt: string;
    interruptionsAllowed: boolean;
    validationRegex?: string;
  };
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'ai' | 'citizen' | 'system';
  text: string;
  language?: string;
  timestamp: string;
  audioUrl?: string;
  extractedFields?: Array<{ fieldId: string; fieldName: string; value: string }>;
  isSpellingMode?: boolean;
  spellingWord?: string;
}

export interface AIReasoningStep {
  id: string;
  timestamp: string;
  type: 'speech_received' | 'language_detected' | 'entity_extracted' | 'format_validated' | 'form_updated';
  label: string;
  detail: string;
  status: 'pending' | 'active' | 'success' | 'warning';
  confidence?: number;
}

export interface RecentActivity {
  id: string;
  type: 'parsed' | 'published' | 'submitted' | 'updated';
  title: string;
  timeAgo: string;
  user: string;
  formName: string;
}

export interface AnalyticsSummary {
  formsFilled: number;
  completionRate: number;
  voiceUsagePct: number;
  avgCompletionTimeSeconds: number;
  languagesUsedCount: number;
  mostAbandonedField: string;
  speechAccuracyRate: number;
}
