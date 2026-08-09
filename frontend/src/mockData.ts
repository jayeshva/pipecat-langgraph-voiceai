import { FormDefinition, RecentActivity, AnalyticsSummary, WorkflowNode, WorkflowEdge } from './types';

export const INITIAL_FORMS: FormDefinition[] = [
  {
    id: 'form-income-01',
    title: 'Income Certificate',
    department: 'Department of Revenue & Land Records',
    category: 'Revenue & Taxes',
    description: 'Annual family income certificate required for scholarship, subsidy, and government quota admissions.',
    version: '3.2',
    status: 'published',
    supportedLanguages: ['Tamil', 'English', 'Hindi', 'Telugu', 'Kannada'],
    defaultLanguage: 'Tamil',
    tags: ['Revenue', 'Scholarship', 'Certificate'],
    specialInstructions: 'Collect Aadhaar carefully. DOB mandatory. Ask income proof only if income exceeds ₹2,000,000. Don\'t ask nominee unless married.',
    totalConversations: 12480,
    completionRate: 95.8,
    updatedAt: '2 hours ago',
    updatedBy: 'Officer S. Ramanathan',
    pdfUrl: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&w=800&q=80',
    fields: [
      {
        id: 'f-1',
        name: 'fullName',
        originalLabel: 'Full Name of Applicant (Block Letters)',
        type: 'text',
        required: true,
        confidenceScore: 99,
        conversationPrompt: 'May I know your full official name as registered on your Aadhaar card?',
        aliases: ['Name', 'Applicant Name', 'Citizen Name'],
        regex: '^[a-zA-Z\\s]{2,50}$',
        helpText: 'As printed on government identity proof.',
        bbox: { x: 8, y: 14, width: 42, height: 6, page: 1 },
        value: 'Rajesh Kumar',
        extractedRawSpeech: 'My name is Rajesh Kumar',
        extractedReasoning: 'Exact entity matching via name lexicon & capitalized string recognition.',
        alternativeValues: ['Rajesh Kumar S', 'Rajesh K']
      },
      {
        id: 'f-2',
        name: 'dateOfBirth',
        originalLabel: 'Date of Birth (DD/MM/YYYY)',
        type: 'date',
        required: true,
        confidenceScore: 98,
        conversationPrompt: 'What is your date of birth?',
        aliases: ['DOB', 'Birth Date', 'Born on'],
        regex: '^\\d{2}/\\d{2}/\\d{4}$',
        helpText: 'Must match Birth Certificate or SSLC record.',
        bbox: { x: 52, y: 14, width: 40, height: 6, page: 1 },
        value: '14/07/1999',
        extractedRawSpeech: 'I was born on 14th July 1999',
        extractedReasoning: 'Parsed spoken date format "14th July 1999" into standard ISO DD/MM/YYYY.'
      },
      {
        id: 'f-3',
        name: 'aadhaarNumber',
        originalLabel: 'Aadhaar / UID Number',
        type: 'text',
        required: true,
        confidenceScore: 96,
        conversationPrompt: 'Please state your 12-digit Aadhaar number.',
        aliases: ['Aadhaar', 'UID', 'Aadhar Card'],
        regex: '^\\d{4}\\s?\\d{4}\\s?\\d{4}$',
        helpText: '12 numeric digits without hyphens.',
        bbox: { x: 8, y: 23, width: 84, height: 6, page: 1 },
        value: '9842 1102 7731',
        extractedRawSpeech: 'Nine eight four two, double one zero two, double seven three one',
        extractedReasoning: 'Spoken numeric string normalized to 12 digit Aadhaar grouping.'
      },
      {
        id: 'f-4',
        name: 'residentialAddress',
        originalLabel: 'Permanent Residential Address',
        type: 'address',
        required: true,
        confidenceScore: 94,
        conversationPrompt: 'Where do you reside? Please share your street address, district, and pincode.',
        aliases: ['Address', 'Permanent Address', 'Residence'],
        helpText: 'Complete postal address with Door No.',
        bbox: { x: 8, y: 32, width: 84, height: 10, page: 1 },
        value: 'Door No. 24, Gandhi Street, RS Puram, Coimbatore - 641002',
        extractedRawSpeech: 'I live at door number 24 Gandhi Street RS Puram Coimbatore 641002'
      },
      {
        id: 'f-5',
        name: 'annualIncome',
        originalLabel: 'Total Annual Family Income (in INR)',
        type: 'currency',
        required: true,
        confidenceScore: 95,
        conversationPrompt: 'What is your total estimated annual family income from all sources?',
        aliases: ['Annual Income', 'Family Income', 'Yearly Earnings'],
        helpText: 'Combined income of all earning members.',
        bbox: { x: 8, y: 45, width: 42, height: 6, page: 1 },
        value: '₹1,80,000',
        extractedRawSpeech: 'Our total yearly family income is around 1 lakh 80 thousand rupees',
        extractedReasoning: 'Extracted Indian numbering convention "1 lakh 80 thousand" -> ₹180,000.'
      },
      {
        id: 'f-6',
        name: 'occupation',
        originalLabel: 'Primary Occupation / Source of Livelihood',
        type: 'text',
        required: true,
        confidenceScore: 97,
        conversationPrompt: 'What is your primary occupation or livelihood?',
        aliases: ['Job', 'Profession', 'Work', 'Employer'],
        bbox: { x: 52, y: 45, width: 40, height: 6, page: 1 },
        value: 'Software Associate at Infosys',
        extractedRawSpeech: 'I work as a software associate at Infosys'
      },
      {
        id: 'f-7',
        name: 'purposeOfCertificate',
        originalLabel: 'Purpose for Requesting Income Certificate',
        type: 'select',
        required: true,
        confidenceScore: 99,
        conversationPrompt: 'What is the purpose of applying for this Income Certificate?',
        aliases: ['Purpose', 'Reason', 'Certificate Need'],
        bbox: { x: 8, y: 54, width: 84, height: 6, page: 1 },
        value: 'Higher Education Scholarship Scheme',
        extractedRawSpeech: 'Applying for college engineering scholarship scheme'
      },
      {
        id: 'f-8',
        name: 'incomeTaxPayer',
        originalLabel: 'Is any family member an Income Tax Assessee?',
        type: 'select',
        required: true,
        confidenceScore: 98,
        conversationPrompt: 'Does anyone in your family file annual Income Tax returns?',
        aliases: ['IT Taxpayer', 'Tax Payer'],
        bbox: { x: 8, y: 63, width: 42, height: 6, page: 1 },
        value: 'No',
        extractedRawSpeech: 'No, nobody in our house pays income tax'
      }
    ]
  },
  {
    id: 'form-passport-02',
    title: 'Fresh Passport Application (Form No. 1)',
    department: 'Ministry of External Affairs',
    category: 'Immigration & Passports',
    description: 'Standard passport application workflow with automatic police station mapping and document verification.',
    version: '4.1',
    status: 'published',
    supportedLanguages: ['English', 'Hindi', 'Bengali', 'Marathi', 'Gujarati'],
    defaultLanguage: 'English',
    tags: ['Passport', 'Travel', 'MEA'],
    specialInstructions: 'Verify Place of Birth carefully. Ask spouse details if marital status is married.',
    totalConversations: 8940,
    completionRate: 92.4,
    updatedAt: '1 day ago',
    updatedBy: 'RPO Admin M. Sen',
    pdfUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=800&q=80',
    fields: [
      {
        id: 'fp-1',
        name: 'givenName',
        originalLabel: 'Given Name (First Name + Middle Name)',
        type: 'text',
        required: true,
        confidenceScore: 99,
        conversationPrompt: 'What is your given name as per your identity proof?',
        aliases: ['First Name', 'Given Name'],
        value: 'Aarav',
        bbox: { x: 8, y: 15, width: 40, height: 6, page: 1 }
      },
      {
        id: 'fp-2',
        name: 'surname',
        originalLabel: 'Surname / Last Name',
        type: 'text',
        required: true,
        confidenceScore: 98,
        conversationPrompt: 'What is your surname or last name?',
        aliases: ['Surname', 'Last Name'],
        value: 'Sharma',
        bbox: { x: 52, y: 15, width: 40, height: 6, page: 1 }
      },
      {
        id: 'fp-3',
        name: 'placeOfBirth',
        originalLabel: 'Place of Birth (Village/Town/City)',
        type: 'text',
        required: true,
        confidenceScore: 95,
        conversationPrompt: 'Where were you born?',
        aliases: ['Birth Place', 'Native Town'],
        value: 'Jaipur, Rajasthan',
        bbox: { x: 8, y: 25, width: 84, height: 6, page: 1 }
      }
    ]
  },
  {
    id: 'form-scholarship-03',
    title: 'Merit-Cum-Means Higher Education Grant',
    department: 'Higher Education Commission',
    category: 'Education & Scholarships',
    description: 'Grant application for undergraduate and university students with automatic grade sheet processing.',
    version: '2.0',
    status: 'draft',
    supportedLanguages: ['English', 'Hindi', 'Telugu', 'Tamil'],
    defaultLanguage: 'Hindi',
    tags: ['Education', 'University', 'Scholarship'],
    totalConversations: 1420,
    completionRate: 88.5,
    updatedAt: '3 days ago',
    updatedBy: 'Dr. V. Prabha',
    pdfUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
    fields: []
  }
];

export const INITIAL_ACTIVITIES: RecentActivity[] = [
  {
    id: 'act-1',
    type: 'submitted',
    title: 'Citizen Submitted Form',
    timeAgo: '3 minutes ago',
    user: 'Citizen #88412 (via Tamil Voice)',
    formName: 'Income Certificate (v3.2)'
  },
  {
    id: 'act-2',
    type: 'parsed',
    title: 'AI Parsed New Form',
    timeAgo: '24 minutes ago',
    user: 'AI Engine (Gemini 3.6 Flash)',
    formName: 'Driving License Renewal PDF'
  },
  {
    id: 'act-3',
    type: 'published',
    title: 'Officer Published Form',
    timeAgo: '2 hours ago',
    user: 'Officer S. Ramanathan',
    formName: 'Income Certificate (v3.2)'
  },
  {
    id: 'act-4',
    type: 'updated',
    title: 'Version Updated',
    timeAgo: '5 hours ago',
    user: 'Admin RPO M. Sen',
    formName: 'Fresh Passport Application (v4.1)'
  }
];

export const INITIAL_ANALYTICS: AnalyticsSummary = {
  formsFilled: 18420,
  completionRate: 94.2,
  voiceUsagePct: 78.4,
  avgCompletionTimeSeconds: 134,
  languagesUsedCount: 12,
  mostAbandonedField: 'Income Tax Return Document Upload',
  speechAccuracyRate: 98.7
};

export const INITIAL_WORKFLOW_NODES: WorkflowNode[] = [
  {
    id: 'node-1',
    type: 'greeting',
    title: 'Welcome & Language Pick',
    position: { x: 100, y: 150 },
    properties: {
      prompt: 'Hello! I am your AI Assistant. I will help you complete your Income Certificate in under 2 minutes.',
      voice: 'Kore (Warm Female)',
      language: 'Tamil',
      retryLimit: 3,
      fallbackPrompt: 'I didn\'t catch that. Should we continue in English, Tamil, or Hindi?',
      interruptionsAllowed: true
    }
  },
  {
    id: 'node-2',
    type: 'collect_info',
    title: 'Collect Identity & DOB',
    fieldIds: ['f-1', 'f-2'],
    position: { x: 380, y: 150 },
    properties: {
      prompt: 'Please tell me your full name as registered on Aadhaar, along with your date of birth.',
      voice: 'Kore (Warm Female)',
      language: 'Tamil',
      retryLimit: 2,
      fallbackPrompt: 'Please speak your full name and date of birth clearly.',
      interruptionsAllowed: true
    }
  },
  {
    id: 'node-3',
    type: 'spelling_confirm',
    title: 'Spelling Verification (Critical Name)',
    position: { x: 680, y: 80 },
    properties: {
      prompt: 'I heard "{fullName}". Let us quickly verify the spelling letter by letter.',
      voice: 'Zephyr (Clear Male)',
      language: 'Tamil',
      retryLimit: 2,
      fallbackPrompt: 'Please spell your name letter by letter.',
      interruptionsAllowed: false
    }
  },
  {
    id: 'node-4',
    type: 'conditional',
    title: 'Check Income Threshold (> ₹2L)',
    position: { x: 680, y: 260 },
    properties: {
      prompt: 'If family annual income exceeds ₹200,000, request salary slip proof.',
      voice: 'Zephyr',
      language: 'Tamil',
      retryLimit: 1,
      fallbackPrompt: 'Is your annual family income above 2 Lakhs?',
      interruptionsAllowed: true
    }
  },
  {
    id: 'node-5',
    type: 'confirmation',
    title: 'Final Citizen Review & Voice Approval',
    position: { x: 960, y: 180 },
    properties: {
      prompt: 'All 8 details are filled. Here is your completed official PDF preview. Do you approve submission?',
      voice: 'Kore',
      language: 'Tamil',
      retryLimit: 2,
      fallbackPrompt: 'Say "Approve" or press Submit to finish.',
      interruptionsAllowed: true
    }
  }
];

export const INITIAL_WORKFLOW_EDGES: WorkflowEdge[] = [
  { id: 'e1-2', source: 'node-1', target: 'node-2' },
  { id: 'e2-3', source: 'node-2', target: 'node-3', label: 'High Priority Field' },
  { id: 'e2-4', source: 'node-2', target: 'node-4', label: 'Standard Path' },
  { id: 'e3-5', source: 'node-3', target: 'node-5' },
  { id: 'e4-5', source: 'node-4', target: 'node-5' }
];
