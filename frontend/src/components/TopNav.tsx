import React, { useState } from 'react';
import { Search, Bell, Globe, User, Sparkles, CheckCircle, Shield, ChevronDown, PhoneCall } from 'lucide-react';
import { ActiveTab } from './Sidebar';

interface TopNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedOrg: string;
  onOpenCallAI?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({ activeTab, setActiveTab, selectedOrg, onOpenCallAI }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const notifications = [
    { id: '1', title: 'AI Parsed Income Certificate', time: '10m ago', unread: true },
    { id: '2', title: 'Citizen #88412 Submitted Form in Tamil', time: '25m ago', unread: true },
    { id: '3', title: 'Passport Form v4.1 Approved by Admin', time: '1h ago', unread: false },
  ];

  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Government & Enterprise Dashboard';
      case 'upload': return 'Upload Existing PDF Form';
      case 'analyzer': return 'AI Schema Analyzer & Field Extractor';
      case 'flow_builder': return 'Conversational Flow Builder';
      case 'published': return 'Published Citizen Forms';
      case 'testing_studio': return 'Citizen AI Testing Studio';
      case 'analytics': return 'Voice & Form Conversion Analytics';
      case 'settings': return 'System Settings & AI Configuration';
      case 'citizen_mode': return 'Citizen Voice AI Assistant';
      default: return 'IntelliForm AI Studio';
    }
  };

  return (
    <header id="top-navigation-header" className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs">
      {/* Title & Context */}
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
          {getPageTitle()}
        </h1>
        <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-medium">
          <Shield className="w-3 h-3 text-indigo-600" />
          {selectedOrg}
        </span>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Call AI Button */}
        {onOpenCallAI && (
          <button
            id="call-ai-topnav-btn"
            onClick={onOpenCallAI}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white font-semibold text-xs shadow-md shadow-indigo-900/20 border border-indigo-700/50 hover:from-indigo-800 hover:to-indigo-950 transition-all cursor-pointer group"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <PhoneCall className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Call AI</span>
          </button>
        )}

        {/* Search Bar */}
        <div className="relative hidden md:block w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="top-search-input"
            type="text"
            placeholder="Search forms, fields, schemas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        {/* AI Engine Status Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-700">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-spin" style={{ animationDuration: '4s' }} />
          <span>Gemini 3.6 Flash Active</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button
            id="notifications-bell-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center relative transition-all cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-indigo-600 absolute top-2 right-2 ring-2 ring-white"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-semibold text-xs text-slate-900">Notifications</span>
                <span className="text-[10px] text-indigo-600 font-medium cursor-pointer hover:underline">Mark all read</span>
              </div>
              <div className="divide-y divide-slate-50 my-1">
                {notifications.map((n) => (
                  <div key={n.id} className="py-2.5 px-1 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                    <p className="text-xs font-medium text-slate-800">{n.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Officer Profile Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs shadow-xs">
            SR
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <p className="text-xs font-bold text-slate-800">Officer S. Ramanathan</p>
            <p className="text-[10px] text-slate-500">Senior Revenue Nodal</p>
          </div>
        </div>
      </div>
    </header>
  );
};
