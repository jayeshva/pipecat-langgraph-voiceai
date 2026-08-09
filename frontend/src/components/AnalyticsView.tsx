import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Mic, 
  Clock, 
  Globe, 
  CheckCircle2, 
  AlertOctagon, 
  Sparkles,
  Zap
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { INITIAL_ANALYTICS } from '../mockData';

export const AnalyticsView: React.FC = () => {
  const stats = INITIAL_ANALYTICS;

  const confidenceData = [
    { range: '95-100%', count: 14200 },
    { range: '90-94%', count: 3100 },
    { range: '80-89%', count: 890 },
    { range: '<80%', count: 230 },
  ];

  const topFormsData = [
    { name: 'Income Certificate', count: 12480 },
    { name: 'Passport Form 1', count: 8940 },
    { name: 'Higher Edu Scholarship', count: 4200 },
    { name: 'Driving License Renewal', count: 3100 },
    { name: 'Senior Pension Scheme', count: 2150 },
  ];

  const retriesData = [
    { retries: '0 Retries (1st Try)', pct: 88 },
    { retries: '1 Retry', pct: 9 },
    { retries: '2 Retries', pct: 2 },
    { retries: '3+ Retries', pct: 1 },
  ];

  return (
    <div id="analytics-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Voice Intelligence & Conversion Analytics</h2>
        <p className="text-xs text-slate-500 mt-0.5">Real-time performance metrics across citizen voice conversations and AI field extractions</p>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500">Forms Filled</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.formsFilled.toLocaleString()}</p>
          <span className="text-[10px] text-emerald-600 font-semibold">+22.4% vs last month</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500">Completion Rate</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.completionRate}%</p>
          <span className="text-[10px] text-emerald-600 font-semibold">94 out of 100 finished</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500">Voice Usage</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.voiceUsagePct}%</p>
          <span className="text-[10px] text-indigo-600 font-semibold">Spoken input preferred</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500">Average Time</span>
          <p className="text-xl font-bold text-slate-900 mt-1">2m 14s</p>
          <span className="text-[10px] text-emerald-600 font-semibold">4x faster than paper</span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
          <span className="text-[11px] font-medium text-slate-500">Speech Accuracy</span>
          <p className="text-xl font-bold text-slate-900 mt-1">{stats.speechAccuracyRate}%</p>
          <span className="text-[10px] text-emerald-600 font-semibold">Tamil & Hindi leading</span>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Top Forms Usage */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="font-bold text-slate-800 text-xs mb-1">Top Digitized Forms Volume</h3>
          <p className="text-[11px] text-slate-400 mb-4">Total citizen conversations per form type</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topFormsData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" stroke="#94A3B8" fontSize={10} />
                <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={10} width={110} />
                <Tooltip />
                <Bar dataKey="count" fill="#4F46E5" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence Score Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="font-bold text-slate-800 text-xs mb-1">AI Confidence Score Distribution</h3>
          <p className="text-[11px] text-slate-400 mb-4">Extracted field accuracy bands</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confidenceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="range" stroke="#94A3B8" fontSize={10} />
                <YAxis stroke="#94A3B8" fontSize={10} />
                <Tooltip />
                <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Retry Rate Distribution */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="font-bold text-slate-800 text-xs mb-1">Speech Recognition Retry Rate</h3>
          <p className="text-[11px] text-slate-400 mb-4">Number of conversational prompts per field</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={retriesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="retries" stroke="#94A3B8" fontSize={9} />
                <YAxis stroke="#94A3B8" fontSize={10} />
                <Tooltip />
                <Bar dataKey="pct" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
