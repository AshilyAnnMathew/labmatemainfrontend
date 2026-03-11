import React, { useState, useEffect } from 'react';
import {
    Users,
    TestTube,
    FileText,
    AlertTriangle,
    Activity,
    Clock,
    CheckCircle,
    Calendar,
    ArrowUpRight,
    Search,
    ChevronRight,
    ShieldAlert,
    Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import moment from 'moment';

const StatCard = ({ title, value, icon: Icon, color, subtext, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        whileHover={{ scale: 1.02 }}
        className="relative group overflow-hidden bg-white rounded-[2rem] p-7 shadow-xl shadow-gray-100 border border-gray-100 flex flex-col justify-between h-full"
    >
        <div className="flex items-center justify-between mb-6">
            <div className={`p-4 rounded-2xl ${color.bg} ${color.text} transition-colors duration-300 group-hover:scale-110`}>
                <Icon className="h-6 w-6" />
            </div>
            <div className="flex items-center space-x-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Live Intelligence</span>
            </div>
        </div>

        <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">{title}</p>
            <div className="flex items-baseline space-x-2">
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h3>
                {subtext && <span className="text-[10px] font-bold text-gray-400 mb-1">{subtext}</span>}
            </div>
        </div>

        <div className="absolute right-0 bottom-0 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
            <Icon size={120} strokeWidth={1} />
        </div>
    </motion.div>
);

const StaffDashboardOverview = ({ assignedLab }) => {
    const [stats, setStats] = useState({
        totalSamplesCollectedToday: 0,
        samplesProcessing: 0,
        partiallyCompletedSamples: 0,
        completedSamples: 0,
        reportsReadyForVerification: 0,
        pendingPayments: 0,
        criticalAlerts: 0,
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            if (!assignedLab?._id) return;

            try {
                setLoading(true);
                const response = await api.localAdminAPI.getAdvancedDashboardStats(assignedLab._id);
                if (response.success) {
                    setStats(response.data);
                }
            } catch (err) {
                console.error('Error fetching dashboard stats:', err);
                setError('Failed to load dashboard statistics');
            } finally {
                setLoading(false);
            }
        };

        if (assignedLab) {
            fetchStats();
            const interval = setInterval(fetchStats, 60000);
            return () => clearInterval(interval);
        }
    }, [assignedLab]);

    if (!assignedLab) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-bold text-slate-400 uppercase tracking-widest text-sm">Syncing Lab Node...</p>
            </div>
        );
    }

    if (loading && !stats.totalSamplesCollectedToday) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-bold text-primary-600/50 uppercase tracking-widest text-sm">Accessing Core Intelligence...</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10 pb-12"
        >
            {/* Cinematic Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <div className="flex items-center space-x-2 mb-3">
                        <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                            Operational Node: {assignedLab?._id?.slice(-6).toUpperCase()}
                        </span>
                        <div className="h-0.5 w-12 bg-slate-200"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {moment().format('MMMM DD, YYYY')}
                        </span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-2">
                        Lab Intelligence
                    </h1>
                    <p className="text-lg text-slate-500 font-medium">
                        Real-time oversight for <span className="text-slate-900 font-bold">{assignedLab?.name}</span>
                    </p>
                </div>

                <div className="flex items-center space-x-3 bg-white p-2 rounded-3xl border border-gray-100 shadow-sm">
                    <div className="p-3 bg-slate-50 rounded-2xl">
                        <Zap className="h-5 w-5 text-slate-900" />
                    </div>
                    <div className="pr-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sync Priority</p>
                        <p className="text-sm font-bold text-slate-900 uppercase">High Performance</p>
                    </div>
                </div>
            </div>

            {/* Premium Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Samples Collected"
                    value={stats.totalSamplesCollectedToday || 0}
                    icon={Users}
                    color={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }}
                    subtext="Total Units Today"
                    delay={0.1}
                />
                <StatCard
                    title="Active Processing"
                    value={stats.samplesProcessing || 0}
                    icon={Activity}
                    color={{ bg: 'bg-blue-50', text: 'text-blue-600' }}
                    subtext="Current Diagnostics"
                    delay={0.2}
                />
                <StatCard
                    title="Pending Verification"
                    value={stats.reportsReadyForVerification || 0}
                    icon={ShieldAlert}
                    color={{ bg: 'bg-emerald-50', text: 'text-emerald-600' }}
                    subtext="Required Validation"
                    delay={0.3}
                />
                <StatCard
                    title="Critical Alerts"
                    value={stats.criticalAlerts || 0}
                    icon={AlertTriangle}
                    color={{ bg: 'bg-rose-50', text: 'text-rose-600' }}
                    subtext="Action Required"
                    delay={0.4}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Recent Activity Ledger */}
                <div className="lg:col-span-8 space-y-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-100 border border-gray-100 overflow-hidden"
                    >
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Activity Ledger</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Live Transaction Stream</p>
                            </div>
                            <Link to="/staff/dashboard?tab=all" className="p-3 bg-white hover:bg-slate-900 hover:text-white rounded-2xl border border-gray-100 shadow-sm transition-all duration-300">
                                <ArrowUpRight className="h-5 w-5" />
                            </Link>
                        </div>

                        <div className="divide-y divide-gray-100 p-2">
                            {!stats.recentActivity || stats.recentActivity.length === 0 ? (
                                <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-sm">
                                    No data streaming...
                                </div>
                            ) : (
                                stats.recentActivity.slice(0, 6).map((booking, idx) => (
                                    <motion.div
                                        key={booking._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.6 + (idx * 0.1) }}
                                        className="p-5 hover:bg-slate-50/50 transition-colors flex items-center justify-between rounded-[1.5rem]"
                                    >
                                        <div className="flex items-center space-x-5">
                                            <div className="relative">
                                                <div className={`h-14 w-14 rounded-2xl flex items-center justify-center p-4 ${booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                                                        booking.status === 'sample_collected' ? 'bg-blue-50 text-blue-600' :
                                                            booking.status === 'report_uploaded' ? 'bg-purple-50 text-purple-600' :
                                                                'bg-slate-100 text-slate-400'
                                                    }`}>
                                                    <Calendar className="h-6 w-6" />
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white bg-slate-900 flex items-center justify-center">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-lg font-black text-slate-900 tracking-tighter uppercase leading-none mb-1">
                                                    {booking.userId?.firstName} {booking.userId?.lastName}
                                                </p>
                                                <div className="flex items-center space-x-3">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                                        {moment(booking.updatedAt || booking.appointmentDate).fromNow()}
                                                    </p>
                                                    <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                                                        ID: {booking._id.slice(-8).toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] border ${booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                booking.status === 'sample_collected' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    booking.status === 'report_uploaded' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                                        'bg-slate-50 text-slate-700 border-slate-100'
                                            }`}>
                                            {booking.status.replace('_', ' ')}
                                        </span>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>

                {/* Tactical Actions Sidebar */}
                <div className="lg:col-span-4 space-y-8">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 }}
                        className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-200"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter">Quick Actions</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Operational Shortcuts</p>
                            </div>
                            <div className="p-3 bg-white/10 rounded-2xl">
                                <Zap className="h-5 w-5 text-amber-400" />
                            </div>
                        </div>

                        <div className="space-y-4">
                            {[
                                { to: '/staff/communication', icon: Users, title: 'Patient Search', sub: 'Access Clinical History', color: 'bg-white/10' },
                                { to: '/staff/bookings', icon: TestTube, title: 'Record Sample', sub: 'Collection Interface', color: 'bg-white/10' },
                                { to: '/staff/upload-reports', icon: FileText, title: 'Upload Results', sub: 'Diagnostic Entrance', color: 'bg-white/10' }
                            ].map((action, i) => (
                                <Link
                                    key={i}
                                    to={action.to}
                                    className="flex items-center p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all group"
                                >
                                    <div className={`${action.color} p-3 rounded-xl mr-4 group-hover:scale-110 transition-transform`}>
                                        <action.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-black text-xs uppercase tracking-widest">{action.title}</p>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{action.sub}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-white transition-colors" />
                                </Link>
                            ))}
                        </div>
                    </motion.div>

                    {/* Secondary Metrics / Notifications */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-xl shadow-slate-50"
                    >
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">System Health</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Diagnostics</p>
                            </div>
                            <CheckCircle className="h-6 w-6 text-emerald-500" />
                        </div>

                        <div className="space-y-6">
                            <div className="flex justify-between items-center py-4 border-b border-gray-50">
                                <div className="flex items-center space-x-3">
                                    <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Node Latency</span>
                                </div>
                                <span className="text-xs font-black text-slate-900 uppercase">24ms</span>
                            </div>
                            <div className="flex justify-between items-center py-4 border-b border-gray-50">
                                <div className="flex items-center space-x-3">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">AI Accuracy</span>
                                </div>
                                <span className="text-xs font-black text-slate-900 uppercase">99.2%</span>
                            </div>
                            <div className="flex justify-between items-center py-4">
                                <div className="flex items-center space-x-3">
                                    <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Cloud Sync</span>
                                </div>
                                <span className="text-xs font-black text-slate-900 uppercase">Secure</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default StaffDashboardOverview;
