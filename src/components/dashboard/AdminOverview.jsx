import React, { useState, useEffect } from 'react';
import {
    Users, Building2, TestTube, Calendar, DollarSign,
    TrendingUp, Activity, AlertCircle, Zap, ShieldCheck,
    Microscope, Layers, Globe, Fingerprint, Radio,
    ArrowUpRight, ArrowDownRight, RefreshCw
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion } from 'framer-motion';
import api from '../../services/api';

const { adminAPI } = api;

const AdminOverview = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => { fetchAnalytics(); }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getAnalytics({ period: '30' });
            if (response.success) setAnalytics(response.data);
        } catch (err) { setError('Failed to load neural data.'); } finally { setLoading(false); }
    };

    if (loading) return (
        <div className="h-96 flex flex-col items-center justify-center opacity-20">
            <RefreshCw className="h-10 w-10 animate-spin" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-[0.4em]">Synchronizing Stream...</p>
        </div>
    );

    if (!analytics) return null;

    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10"
        >
            {/* Header Area */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                <div>
                    <div className="flex items-center space-x-2 mb-4">
                        <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl shadow-slate-200">
                            Ecosystem Metrics Node
                        </span>
                        <div className="h-0.5 w-16 bg-slate-200"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Real-time Neural Telemetry
                        </span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">
                        Command <span className="text-indigo-600">Intelligence</span> Overview
                    </h1>
                </div>
                <button
                    onClick={fetchAnalytics}
                    className="px-8 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-xl shadow-slate-100 flex items-center gap-3"
                >
                    <Activity size={16} /> Matrix Sync
                </button>
            </div>

            {/* Tactical Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                    { label: 'Total Vectors', val: analytics.overview.totalBookings, growth: analytics.overview.bookingGrowth, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Network Yield', val: `₹${analytics.overview.totalRevenue.toLocaleString()}`, growth: 0, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Active Assets', val: analytics.overview.totalUsers, growth: 12, icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
                    { label: 'Global Nodes', val: analytics.overview.activeLabs, growth: 0, icon: Building2, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-[3rem] p-10 border border-slate-50 shadow-2xl shadow-slate-100 group relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center`}>
                                <stat.icon size={20} />
                            </div>
                            {stat.growth !== 0 && (
                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">+{stat.growth}%</span>
                            )}
                        </div>
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</h4>
                        <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.val}</p>
                        <div className="absolute -bottom-4 -right-4 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform">
                            <stat.icon size={100} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Neural Visualizations */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="bg-white rounded-[3.5rem] p-12 border border-slate-50 shadow-2xl shadow-slate-200">
                    <div className="flex items-center justify-between mb-10">
                        <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Throughput <span className="text-indigo-600">Trajectory</span></h4>
                        <TrendingUp size={20} className="text-slate-300" />
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.bookings.daily.map(d => ({ name: d._id, val: d.count }))}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" hide />
                                <YAxis hide />
                                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="val" fill="#1e293b" radius={[10, 10, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white shadow-2xl shadow-slate-400 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-10 relative z-10">
                        <h4 className="text-xl font-black uppercase tracking-tighter">Vector <span className="text-indigo-400">Distribution</span></h4>
                        <Radio size={20} className="text-white/20 animate-pulse" />
                    </div>
                    <div className="h-64 relative z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={analytics.bookings.byStatus.map(s => ({ name: s._id, value: s.count }))}
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {analytics.bookings.byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />)}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '15px' }} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="absolute -bottom-20 -right-20 opacity-[0.05] pointer-events-none">
                        <Fingerprint size={300} />
                    </div>
                </div>
            </div>

            {/* Performance Matrix */}
            <div className="bg-white rounded-[4rem] border border-slate-50 shadow-2xl shadow-slate-100 overflow-hidden">
                <div className="px-12 py-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">High-Yield <span className="text-indigo-600">Diagnostic</span> Units</h3>
                    <Layers size={20} className="text-slate-300" />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <th className="px-12 py-6">Diagnostic Unit</th>
                                <th className="px-12 py-6">Fulfillment Count</th>
                                <th className="px-12 py-6">Economic Yield</th>
                                <th className="px-12 py-6 text-right">Spectral Health</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {analytics.tests.popular.map((test, i) => (
                                <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-12 py-6 font-black text-slate-900 uppercase tracking-tight">{test.testName}</td>
                                    <td className="px-12 py-6 text-xs font-bold text-slate-500">{test.count} Nodes</td>
                                    <td className="px-12 py-6 font-black text-emerald-600">₹{test.revenue.toLocaleString()}</td>
                                    <td className="px-12 py-6">
                                        <div className="flex justify-end items-center gap-2">
                                            <div className="h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-slate-900 rounded-full" style={{ width: '85%' }} />
                                            </div>
                                            <span className="text-[10px] font-black">8.5 / 10</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

export default AdminOverview;
