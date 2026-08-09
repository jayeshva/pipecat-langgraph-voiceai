import React from 'react';
import { 
  FileCheck2, 
  FileEdit, 
  MessageSquare, 
  TrendingUp, 
  ArrowUpRight, 
  Sparkles, 
  Clock, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  Upload,
  Bot
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { FormDefinition, RecentActivity } from '../types';
import { ActiveTab } from './Sidebar';

interface DashboardViewProps {
  forms: FormDefinition[];
  activities: RecentActivity[];
  setActiveTab: (tab: ActiveTab) => void;
  onSelectFormForTesting: (form: FormDefinition) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  forms, 
  activities, 
  setActiveTab,
  onSelectFormForTesting
}) => {
  const publishedCount = forms.filter(f => f.status === 'published').length;
  const draftCount = forms.filter(f => f.status === 'draft').length;
  const totalConversationsToday = 12480;
  const avgCompletionRate = 95.8;

  // Chart data
  const completionData = [
    { day: 'Mon', completed: 2100, abandoned: 120 },
    { day: 'Tue', completed: 2450, abandoned: 110 },
    { day: 'Wed', completed: 2900, abandoned: 90 },
    { day: 'Thu', completed: 3100, abandoned: 85 },
    { day: 'Fri', completed: 3400, abandoned: 70 },
    { day: 'Sat', completed: 2800, abandoned: 65 },
    { day: 'Sun', completed: 2300, abandoned: 50 },
  ];

  const languageDistribution = [
    { name: 'Tamil', value: 42, color: '#4F46E5' },
    { name: 'Hindi', value: 28, color: '#2563EB' },
    { name: 'English', value: 15, color: '#10B981' },
    { name: 'Telugu', value: 10, color: '#F59E0B' },
    { name: 'Others', value: 5, color: '#8B5CF6' },
  ];

  const abandonedFieldsData = [
    { field: 'IT Proof Upload', count: 320 },
    { field: 'Land Survey No', count: 210 },
    { field: 'Spouse Name', count: 140 },
    { field: 'Bank IFSC Code', count: 95 },
  ];

  return (
    <div id="dashboard-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Quick Action */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl border border-indigo-700/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
            AI Form Digitization Engine Active
          </div>
          <h2 className="text-xl font-bold tracking-tight">Transform Any Government or Enterprise PDF into AI Voice Workflow</h2>
          <p className="text-xs text-indigo-200 mt-1 max-w-2xl">
            Upload existing PDF forms. AI extracts all fields, generates conversation schema, and allows citizens to speak in Tamil, Hindi, English, and 10+ regional languages.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            id="dashboard-upload-btn"
            onClick={() => setActiveTab('upload')}
            className="px-4 py-2.5 rounded-xl bg-white text-indigo-950 hover:bg-slate-100 font-semibold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
          >
            <Upload className="w-4 h-4 text-indigo-600" />
            Upload PDF Form
          </button>
          <button
            id="dashboard-test-ai-btn"
            onClick={() => {
              if (forms[0]) onSelectFormForTesting(forms[0]);
              setActiveTab('testing_studio');
            }}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition-all border border-indigo-400/30 cursor-pointer"
          >
            <Bot className="w-4 h-4" />
            Try Citizen AI Assistant
          </button>
        </div>
      </div>

      {/* TOP METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Published Forms</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{publishedCount}</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +2 this week
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Draft Forms</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileEdit className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{draftCount}</span>
            <span className="text-xs text-slate-500 font-medium">In review</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Conversations Today</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{totalConversationsToday.toLocaleString()}</span>
            <span className="text-xs text-indigo-600 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +18.4%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Completion Rate</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900">{avgCompletionRate}%</span>
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" /> +4.2% vs paper
            </span>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION: Recent Forms Table & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Forms Table (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Active & Digitized Forms</h3>
              <p className="text-xs text-slate-500">Managed forms currently published for citizens</p>
            </div>
            <button
              onClick={() => setActiveTab('published')}
              className="text-xs text-indigo-600 font-semibold hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Form Title</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Version</th>
                  <th className="py-2.5 px-3">Conversations</th>
                  <th className="py-2.5 px-3">Updated By</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {forms.map((form) => (
                  <tr key={form.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-3">
                      <div>
                        <p className="font-semibold text-slate-900">{form.title}</p>
                        <p className="text-[10px] text-slate-400">{form.department}</p>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        form.status === 'published' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <CheckCircle2 className="w-3 h-3" />
                        {form.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] font-medium text-slate-600">v{form.version}</td>
                    <td className="py-3 px-3 font-semibold text-slate-800">{form.totalConversations.toLocaleString()}</td>
                    <td className="py-3 px-3 text-slate-500">{form.updatedBy}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => {
                          onSelectFormForTesting(form);
                          setActiveTab('testing_studio');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-semibold text-[11px] inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <Play className="w-3 h-3 fill-current" /> Test AI
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side Activity Timeline (1 col) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Recent Activity Timeline</h3>
            <span className="text-[10px] font-medium text-slate-400">Live Updates</span>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-1">
            {activities.map((act) => (
              <div key={act.id} className="flex gap-3 text-xs border-l-2 border-indigo-100 pl-3 py-0.5 relative">
                <div className="w-2 h-2 rounded-full bg-indigo-600 absolute -left-[5px] top-1.5 ring-2 ring-white"></div>
                <div>
                  <p className="font-semibold text-slate-800">{act.title}</p>
                  <p className="text-[11px] text-slate-600">{act.formName}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <UserCheck className="w-3 h-3 text-indigo-500" />
                      {act.user}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-3 h-3" />
                      {act.timeAgo}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Completion Trend Area Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 mb-1">Conversation Completion Rate</h4>
          <p className="text-[11px] text-slate-400 mb-4">Completed citizen form conversations this week</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={completionData}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="completed" stroke="#4F46E5" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Most Common Language Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 mb-1">Most Common Language Used</h4>
          <p className="text-[11px] text-slate-400 mb-4">Citizen voice prompt language preferences</p>
          <div className="h-48 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={languageDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {languageDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1 text-[11px] text-slate-600 pl-2">
              {languageDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span>{item.name} ({item.value}%)</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Most Abandoned Field Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs md:col-span-2 lg:col-span-1">
          <h4 className="text-xs font-bold text-slate-800 mb-1">Most Abandoned Field Drop-offs</h4>
          <p className="text-[11px] text-slate-400 mb-4">Fields requiring AI conversational guidance</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={abandonedFieldsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" stroke="#94A3B8" fontSize={10} />
                <YAxis dataKey="field" type="category" stroke="#64748B" fontSize={10} width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#F59E0B" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
