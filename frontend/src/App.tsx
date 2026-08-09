import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { TopNav } from './components/TopNav';
import { DashboardView } from './components/DashboardView';
import { UploadFormView } from './components/UploadFormView';
import { FormAnalyzerView } from './components/FormAnalyzerView';
import { FlowBuilderView } from './components/FlowBuilderView';
import { PublishedFormsView } from './components/PublishedFormsView';
import { TestingStudioView } from './components/TestingStudioView';
import { AnalyticsView } from './components/AnalyticsView';
import { SettingsView } from './components/SettingsView';
import { CitizenModeView } from './components/CitizenModeView';
import { AIFormStudioView } from './components/AIFormStudioView';
import { AICallModal } from './components/AICallModal';
import { SarvamVoiceWidget } from './components/SarvamVoiceWidget';
import { PhoneCall, Sparkles } from 'lucide-react';

import { FormDefinition } from './types';
import { INITIAL_FORMS, INITIAL_ACTIVITIES } from './mockData';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [selectedOrg, setSelectedOrg] = useState('Department of Revenue & Land Records');
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  
  // Forms state
  const [forms, setForms] = useState<FormDefinition[]>(INITIAL_FORMS);
  const [selectedForm, setSelectedForm] = useState<FormDefinition>(INITIAL_FORMS[0]);
  const [activities, setActivities] = useState(INITIAL_ACTIVITIES);

  // Handle Form Analysis Output from Upload page
  const handleFormAnalyzed = (newForm: FormDefinition) => {
    setForms(prev => [newForm, ...prev]);
    setSelectedForm(newForm);
  };

  // Handle Form Updates from Analyzer/Flow Builder
  const handleUpdateForm = (updatedForm: FormDefinition) => {
    setForms(prev => prev.map(f => f.id === updatedForm.id ? updatedForm : f));
    setSelectedForm(updatedForm);
  };

  // If in Citizen Standalone Mode, render full screen experience
  if (activeTab === 'citizen_mode') {
    return (
      <CitizenModeView 
        form={selectedForm} 
        onUpdateForm={handleUpdateForm} 
        setActiveTab={setActiveTab} 
      />
    );
  }

  return (
    <div id="intelliform-app-container" className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden font-sans antialiased relative">
      {/* Main Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        selectedOrg={selectedOrg}
        setSelectedOrg={setSelectedOrg}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopNav 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          selectedOrg={selectedOrg}
          onOpenCallAI={() => setIsWidgetOpen(true)}
        />

        <main className="flex-1 overflow-y-auto relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="h-full"
            >
              {activeTab === 'dashboard' && (
                <DashboardView 
                  forms={forms} 
                  activities={activities} 
                  setActiveTab={setActiveTab}
                  onSelectFormForTesting={(f) => setSelectedForm(f)}
                />
              )}

              {activeTab === 'ai_form_studio' && (
                <AIFormStudioView 
                  onFormCreated={handleFormAnalyzed}
                  setActiveTab={setActiveTab}
                  onSelectFormForTesting={(f) => setSelectedForm(f)}
                />
              )}

              {activeTab === 'upload' && (
                <UploadFormView 
                  onFormAnalyzed={handleFormAnalyzed}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'analyzer' && (
                <FormAnalyzerView 
                  form={selectedForm}
                  onUpdateForm={handleUpdateForm}
                  setActiveTab={setActiveTab}
                />
              )}

              {activeTab === 'flow_builder' && (
                <FlowBuilderView 
                  form={selectedForm}
                  setActiveTab={setActiveTab}
                  onSelectFormForTesting={(f) => setSelectedForm(f)}
                />
              )}

              {activeTab === 'published' && (
                <PublishedFormsView 
                  forms={forms}
                  setActiveTab={setActiveTab}
                  onSelectFormForTesting={(f) => setSelectedForm(f)}
                />
              )}

              {activeTab === 'testing_studio' && (
                <TestingStudioView 
                  form={selectedForm}
                  onUpdateForm={handleUpdateForm}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsView />
              )}

              {activeTab === 'settings' && (
                <SettingsView />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Floating Call AI Widget (Exact Sarvam Dashboard Style) */}
        {!isWidgetOpen && (
          <div className="fixed bottom-6 right-6 z-40">
            <button
              id="floating-call-ai-fab"
              onClick={() => setIsWidgetOpen(true)}
              className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-slate-900 text-white font-bold text-xs shadow-xl shadow-indigo-600/30 border border-indigo-400/30 hover:scale-105 transition-all cursor-pointer group"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
              </span>
              <PhoneCall className="w-4 h-4 text-emerald-400 group-hover:rotate-12 transition-transform" />
              <span>Sarvam Voice Assistant</span>
            </button>
          </div>
        )}

        {/* Sarvam Dashboard Floating Voice Widget */}
        <SarvamVoiceWidget 
          isOpen={isWidgetOpen} 
          onClose={() => setIsWidgetOpen(false)} 
        />

        {/* Full Modal Variant */}
        <AICallModal 
          isOpen={isCallOpen} 
          onClose={() => setIsCallOpen(false)} 
        />
      </div>
    </div>
  );
}
