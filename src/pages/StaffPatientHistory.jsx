import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, User, Phone, Mail, Calendar, Clock, Activity,
    FileText, AlertTriangle, CheckCircle, Shield, ChevronDown,
    ChevronRight, Heart, Droplets, TestTube, Package, Loader2,
    AlertCircle, Eye, Download, Beaker, ShieldCheck, Zap,
    Microscope, Layers, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { bookingAPI } from '../services/api';
import moment from 'moment';

const StaffPatientHistory = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [vitals, setVitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedBookings, setExpandedBookings] = useState({});
    const [expandedTests, setExpandedTests] = useState({});

    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const res = await bookingAPI.getPatientHistory(patientId);
            const data = res?.data || res;
            setPatient(data.patient);
            setBookings(data.bookings || []);
            setVitals(data.vitals || []);
        } catch (e) {
            setError(e.message || 'Failed to load patient history');
        } finally {
            setLoading(false);
        }
    }, [patientId]);

    useEffect(() => { fetchHistory() }, [fetchHistory]);

    const isAbnormal = (val, rangeStr) => {
        if (!val || !rangeStr || isNaN(val)) return false;
        const parts = rangeStr.replace(/\s/g, '').split('-');
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            const numVal = parseFloat(val);
            return numVal < parseFloat(parts[0]) || numVal > parseFloat(parts[1]);
        }
        return false;
    };

    const getStatusConfig = (status) => {
        const configs = {
            result_published: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', label: 'Released', icon: Shield },
            completed: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', label: 'Verified', icon: CheckCircle },
            sample_collected: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', label: 'Collected', icon: Activity },
            pending: { bg: 'bg-slate-50', text: 'text-slate-400', border: 'border-slate-100', label: 'Pending', icon: Clock }
        };
        return configs[status] || configs.pending;
    };

    const toggleBooking = (id) => setExpandedBookings(p => ({ ...p, [id]: !p[id] }));
    const toggleTest = (id) => setExpandedTests(p => ({ ...p, [id]: !p[id] }));

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-20 bg-slate-50">
                <Loader2 className="h-12 w-12 text-slate-900 animate-spin mb-6" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] animate-pulse">Synchronizing Case Data...</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10 pb-24"
        >
            {/* Cinematic Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
                <div>
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 hover:text-slate-900 transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Terminal
                    </button>
                    <div className="flex items-center space-x-2 mb-4">
                        <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl shadow-slate-200">
                            Diagnostic Case Archive
                        </span>
                        <div className="h-0.5 w-16 bg-slate-200"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Historical Biometric Ledger
                        </span>
                    </div>
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-3">
                        Scientific Profile
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="h-20 w-20 rounded-[2.5rem] bg-white shadow-xl shadow-slate-100 flex items-center justify-center border border-slate-50">
                        <Users className="h-8 w-8 text-slate-900" />
                    </div>
                </div>
            </div>

            {/* Subject Identity Card */}
            {patient && (
                <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-slate-900 to-indigo-900 rounded-[3.5rem] blur opacity-5 group-hover:opacity-10 transition-opacity" />
                    <div className="relative bg-white rounded-[3.5rem] p-10 border border-slate-50 shadow-2xl shadow-slate-100 grid grid-cols-1 lg:grid-cols-12 gap-10">

                        <div className="lg:col-span-3 flex flex-col items-center justify-center border-r border-slate-50 pb-10 lg:pb-0">
                            <div className="h-24 w-24 rounded-[2rem] bg-slate-900 flex items-center justify-center text-white mb-6 shadow-2xl shadow-slate-200">
                                <User className="h-10 w-10" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter text-center">
                                {patient.firstName} {patient.lastName}
                            </h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Subject ID: {patient._id.slice(-8).toUpperCase()}</p>
                        </div>

                        <div className="lg:col-span-6 grid grid-cols-2 gap-8 py-5">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Age / Gender</p>
                                    <p className="text-sm font-black text-slate-700 uppercase">{patient.age || '—'} Y  /  {patient.gender || '—'}</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Communication</p>
                                    <p className="text-sm font-black text-slate-700 lowercase truncate">{patient.email || '—'}</p>
                                    <p className="text-xs font-bold text-slate-400 mt-1">{patient.phone || '—'}</p>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-1">Observation Since</p>
                                    <p className="text-sm font-black text-slate-700 uppercase">{moment(patient.createdAt).format('DD MMM YYYY')}</p>
                                </div>
                                {patient.emergencyContact && (
                                    <div>
                                        <p className="text-[9px] font-black text-rose-300 uppercase tracking-widest mb-1">Emergency Node</p>
                                        <p className="text-sm font-black text-rose-600 uppercase italic">{patient.emergencyContact.name}</p>
                                        <p className="text-[10px] font-bold text-rose-400 mt-0.5">{patient.emergencyContact.phone}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="lg:col-span-3 bg-slate-50 rounded-[2.5rem] p-8 flex flex-col justify-center items-center text-center">
                            <ShieldCheck className="h-8 w-8 text-slate-300 mb-4" />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Verification Matrix</p>
                            <div className="flex gap-2">
                                <div className="h-2 w-8 bg-emerald-400 rounded-full" />
                                <div className="h-2 w-8 bg-emerald-400 rounded-full" />
                                <div className="h-2 w-8 bg-slate-200 rounded-full" />
                            </div>
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-4">Profile Authenticated</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Neural Insights Ledger */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Stats */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-xl shadow-slate-100">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-6">Archive Statistics</p>
                        <div className="space-y-6">
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Total Visits</span>
                                <span className="text-3xl font-black text-slate-900 tracking-tighter">{bookings.length}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Released</span>
                                <span className="text-3xl font-black text-emerald-600 tracking-tighter">{bookings.filter(b => b.status === 'result_published').length}</span>
                            </div>
                            <div className="flex justify-between items-end">
                                <span className="text-[10px] font-black text-slate-400 uppercase">Abnormalities</span>
                                <span className="text-3xl font-black text-rose-600 tracking-tighter">
                                    {bookings.reduce((sum, b) => sum + (b.testResults || []).reduce((s2, tr) => s2 + (tr.values || []).filter(v => isAbnormal(v.value, v.referenceRange)).length, 0), 0)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-slate-200">
                        <div className="flex items-center gap-3 mb-6">
                            <Zap className="h-5 w-5 text-amber-400" />
                            <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Recommendation</h4>
                        </div>
                        <p className="text-[10px] text-white/50 font-bold leading-relaxed uppercase tracking-widest">
                            Based on historical abnormality clusters, consider scheduling a comprehensive 'Metabolic Intelligence' screening in Q3.
                        </p>
                    </div>
                </div>

                {/* Vitals Feed */}
                <div className="lg:col-span-3 bg-white rounded-[3rem] p-10 border border-slate-50 shadow-xl shadow-slate-100">
                    <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                            <TrendingUp className="h-5 w-5 text-indigo-600" /> Biometric Timeline
                        </h3>
                        {vitals.length > 0 && <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Update: {moment(vitals[0].createdAt).fromNow()}</span>}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {vitals.slice(0, 3).map((v, i) => (
                            <motion.div
                                key={i}
                                whileHover={{ scale: 1.02 }}
                                className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col justify-between"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${i === 0 ? 'bg-indigo-600 text-white' : 'bg-white text-slate-400'}`}>
                                        <Activity className="h-5 w-5" />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{moment(v.createdAt).format('DD MMM')}</span>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">Heart Rate</span>
                                        <span className="text-xl font-black text-slate-900">{v.heartRate} <span className="text-[9px] text-slate-400">BPM</span></span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-slate-400 uppercase">SpO2</span>
                                        <span className="text-xl font-black text-slate-900">{v.spo2}%</span>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                        {vitals.length === 0 && (
                            <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-100 rounded-[2rem]">
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">No Biometric Waves Recorded</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Case Ledger */}
            <div>
                <div className="flex items-center gap-4 mb-8">
                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">Diagnostic History</h3>
                    <div className="h-px flex-1 bg-slate-100" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">{bookings.length} Operations</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {bookings.map((b, bIdx) => {
                        const isExp = expandedBookings[b._id];
                        const cfg = getStatusConfig(b.status);
                        const bAbnormals = (b.testResults || []).reduce((s, tr) => s + (tr.values || []).filter(v => isAbnormal(v.value, v.referenceRange)).length, 0);

                        return (
                            <motion.div
                                key={b._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: bIdx * 0.05 }}
                                className={`bg-white rounded-[3rem] p-8 border shadow-xl shadow-slate-100 flex flex-col group transition-all ${bAbnormals > 0 ? 'border-rose-100' : 'border-slate-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-8">
                                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${bAbnormals > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-900 text-white'
                                        }`}>
                                        <Layers className="h-6 w-6" />
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full border ${cfg.border} ${cfg.bg} ${cfg.text} text-[9px] font-black uppercase tracking-widest`}>
                                        {cfg.label}
                                    </div>
                                </div>

                                <div className="mb-8 flex-1">
                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">Batch Code: {b._id.slice(-8).toUpperCase()}</p>
                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-tight mb-4">
                                        {[...(b.selectedPackages || []), ...(b.selectedTests || [])].map(x => x.packageId?.name || x.testId?.name || x.packageName || x.testName).join(', ')}
                                    </h4>
                                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3" /> {moment(b.appointmentDate).format('DD MMM')}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-3 w-3" /> {b.appointmentTime}
                                        </div>
                                    </div>
                                </div>

                                {bAbnormals > 0 && (
                                    <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
                                        <AlertTriangle className="h-4 w-4 text-rose-600 animate-pulse" />
                                        <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest">{bAbnormals} Critical Clusters Detected</span>
                                    </div>
                                )}

                                <button
                                    onClick={() => toggleBooking(b._id)}
                                    className="w-full py-4 bg-slate-50 hover:bg-slate-900 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-slate-100 hover:border-slate-900 flex items-center justify-center gap-2"
                                >
                                    {isExp ? <ChevronDown className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    {isExp ? 'Conceal Matrix' : 'Reveal Diagnostics'}
                                </button>

                                <AnimatePresence>
                                    {isExp && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="pt-8 space-y-4">
                                                {(b.testResults || []).map((tr, trIdx) => (
                                                    <div key={trIdx} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-50">
                                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                                            {tr.testId?.name || "Test Unit"}
                                                        </p>
                                                        <div className="space-y-2">
                                                            {(tr.values || []).map((v, vIdx) => {
                                                                const abnormal = isAbnormal(v.value, v.referenceRange);
                                                                return (
                                                                    <div key={vIdx} className="flex justify-between items-center text-xs">
                                                                        <span className="font-bold text-slate-500 uppercase text-[9px] ">{v.label}</span>
                                                                        <span className={`font-black ${abnormal ? 'text-rose-600' : 'text-slate-900'}`}>
                                                                            {v.value} <span className="text-[9px] text-slate-400 ml-1">{v.unit}</span>
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </motion.div>
    );
};

export default StaffPatientHistory;
