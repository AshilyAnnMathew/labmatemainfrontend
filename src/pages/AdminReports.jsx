import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Users, Calendar,
  DollarSign, TestTube, Building2, Download, RefreshCw,
  Brain, Loader2, AlertCircle, CheckCircle, Clock,
  Activity, FileText, FileSpreadsheet, Printer,
  ChevronDown, ArrowUpRight, ArrowDownRight, Zap,
  ShieldCheck, Microscope, Layers, Boxes, Radio,
  Globe, Fingerprint, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from '@google/generative-ai';
import api from '../services/api';
import Swal from 'sweetalert2';

const AdminReports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [aiInsights, setAiInsights] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [exporting, setExporting] = useState('');
  const reportRef = useRef(null);

  const API_KEY = 'AIzaSyAywhccPmyHxbbK_D5hhM6n7tC8PnX_El0';
  const genAI = useMemo(() => new GoogleGenerativeAI(API_KEY), []);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.adminAPI.getAnalytics({ period: selectedPeriod, metric: 'all' });
      if (response.success) setAnalytics(response.data);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }, [selectedPeriod]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const generateAIInsights = async () => {
    if (!analytics) return;
    try {
      setAnalyzing(true);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const prompt = `Analyze this clinical data and provided tactical insights: ${JSON.stringify(analytics)}`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      setAiInsights(response.text());
    } catch (err) { setAiInsights("Neural processing failed."); } finally { setAnalyzing(false); }
  };

  const displayAnalytics = analytics || {
    overview: { totalBookings: 0, totalRevenue: 0, activeLabs: 0, totalUsers: 0, bookingGrowth: 12.5, revenueGrowth: 8.2, userGrowth: 15 },
    bookings: { daily: [], byStatus: [], byLab: [] },
    tests: { popular: [] },
    performance: { labUtilization: 0, customerSatisfaction: 0 }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10"
    >
      {/* Analytics Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl shadow-slate-200">
              Analytical Flow Node
            </span>
            <div className="h-0.5 w-16 bg-slate-200"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Global Intelligence Telemetry
            </span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-3 text-balance">
            Ecosystem <span className="text-indigo-600">Intelligence</span> Matrix
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl">
            Synthesizing clinical operational data into tactical business intelligence vectors.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white p-2 rounded-[2.5rem] border border-slate-50 shadow-xl shadow-slate-100">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-8 py-4 bg-slate-50 border-none rounded-[2rem] text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-slate-900/5 cursor-pointer"
          >
            <option value="7">7D PULSE</option>
            <option value="30">30D CYCLE</option>
            <option value="90">QUARTERLY</option>
          </select>
          <button
            onClick={fetchAnalytics}
            className="h-14 w-14 bg-slate-900 text-white rounded-full flex items-center justify-center hover:rotate-180 transition-transform duration-700"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Telemetry Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[
          { label: 'Network Throughput', value: displayAnalytics.overview.totalBookings, growth: displayAnalytics.overview.bookingGrowth, icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Transactional Flow', value: `₹${displayAnalytics.overview.totalRevenue.toLocaleString()}`, growth: displayAnalytics.overview.revenueGrowth, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Active Facilities', value: displayAnalytics.overview.activeLabs, growth: 0, icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Authorized Assets', value: displayAnalytics.overview.totalUsers, growth: displayAnalytics.overview.userGrowth, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50' }
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-2xl shadow-slate-200 group relative overflow-hidden"
          >
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div className={`h-14 w-14 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              {stat.growth !== 0 && (
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${stat.growth > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {stat.growth > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  {Math.abs(stat.growth)}%
                </div>
              )}
            </div>
            <div className="relative z-10">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</h4>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
            </div>
            <div className="absolute -bottom-4 -right-4 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
              <stat.icon size={120} />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Neural Insight Hub */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl shadow-slate-400 relative overflow-hidden">
            <div className="flex justify-between items-center mb-10 relative z-10">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400">
                  <Brain size={24} />
                </div>
                <div>
                  <h4 className="text-xl font-black uppercase tracking-tight">Neural Intelligence <span className="text-indigo-400">Insights</span></h4>
                  <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Gemini 1.5 Pro Predictive Analysis</p>
                </div>
              </div>
              <button
                onClick={generateAIInsights}
                disabled={analyzing}
                className="px-8 py-4 bg-white text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-400 hover:text-white transition-all shadow-xl shadow-black/20"
              >
                {analyzing ? 'Processing Matrix...' : 'Regenerate Telemetry'}
              </button>
            </div>

            <div className="min-h-[250px] bg-white/5 rounded-[2.5rem] p-10 border border-white/10 relative z-10">
              {aiInsights ? (
                <p className="text-sm font-medium leading-relaxed text-indigo-100 whitespace-pre-wrap">{aiInsights}</p>
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-30 italic">
                  <Radio size={48} className="mb-4 animate-pulse" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em]">Awaiting Uplink...</p>
                </div>
              )}
            </div>

            <div className="absolute -bottom-20 -left-20 opacity-[0.05] pointer-events-none">
              <Globe size={400} strokeWidth={1} />
            </div>
          </div>

          <div className="bg-white rounded-[3.5rem] p-10 border border-slate-50 shadow-2xl shadow-slate-100">
            <div className="flex items-center justify-between mb-8">
              <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Diagnostic <span className="text-indigo-600">Flow</span> Trending</h4>
              <Layers size={20} className="text-slate-300" />
            </div>
            <div className="h-48 flex items-end gap-2 pr-4">
              {[40, 70, 45, 90, 65, 80, 55, 100, 85, 75, 45, 60, 95].map((val, i) => (
                <div key={i} className="flex-1 group relative">
                  <div
                    className="w-full bg-slate-100 rounded-lg group-hover:bg-indigo-600 transition-all duration-500 cursor-crosshair"
                    style={{ height: `${val}%` }}
                  />
                  <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-slate-900 text-white text-[8px] font-black rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {val}% LOAD
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Distribution & Performance */}
        <div className="space-y-8">
          <div className="bg-white rounded-[3.5rem] p-10 border border-slate-50 shadow-2xl shadow-slate-100">
            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-8">Performance <span className="text-indigo-600">Metrics</span></h4>
            <div className="space-y-10">
              {[
                { label: 'Node Utilization', val: 78, icon: Building2, color: 'text-indigo-600' },
                { label: 'Fulfillment Speed', val: 92, icon: Zap, color: 'text-amber-600' },
                { label: 'Subject Retention', val: 85, icon: Users, color: 'text-emerald-600' }
              ].map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <m.icon size={16} className={m.color} />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{m.label}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">{m.val}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: `${m.val}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className={`h-full bg-slate-900 rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-[3.5rem] p-10 border border-slate-50 shadow-2xl shadow-slate-100">
            <h4 className="text-lg font-black text-slate-900 uppercase tracking-tighter mb-8">Export <span className="text-indigo-600">Vectors</span></h4>
            <div className="space-y-4">
              {[
                { label: 'High-Res PDF Ledger', icon: Printer, action: 'pdf' },
                { label: 'CSV Macro Spreadsheet', icon: FileSpreadsheet, action: 'csv' },
                { label: 'Raw Neural JSON', icon: FileText, action: 'json' }
              ].map((btn, i) => (
                <button
                  key={i}
                  className="w-full flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-transparent hover:border-slate-200 hover:bg-white transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <btn.icon size={20} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-900">{btn.label}</span>
                  </div>
                  <ArrowRight size={16} className="text-slate-200 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminReports;
