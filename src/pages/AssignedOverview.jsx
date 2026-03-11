import React, { useState, useEffect, useMemo } from 'react';
import {
    TestTube, Calendar, Clock, User, Phone, Mail, CreditCard,
    CheckCircle, AlertCircle, FileText, AlertTriangle, ChevronRight,
    Activity, Users, Flame, Eye, ArrowUpRight, TrendingUp, Search,
    Filter, MoreHorizontal, Download, Printer
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import api from '../services/api';
import StatusBadge from '../components/common/StatusBadge';
import moment from 'moment';

const AssignedOverview = ({ assignedLab }) => {
    const [activeTab, setActiveTab] = useState('active');
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState(null);
    const [patientDetails, setPatientDetails] = useState(null);
    const [patientHistory, setPatientHistory] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        fetchBookings();
    }, [assignedLab, activeTab]);

    const fetchBookings = async () => {
        if (!assignedLab?._id) return;
        setLoading(true);
        try {
            let statusParams = [];
            switch (activeTab) {
                case 'active':
                    statusParams = ['pending', 'confirmed', 'arrived'];
                    break;
                case 'diagnostics':
                    statusParams = ['sample_collected', 'partially_completed', 'testing'];
                    break;
                case 'verification':
                    statusParams = ['processing'];
                    break;
                case 'archive':
                    statusParams = ['completed', 'result_published'];
                    break;
                default:
                    statusParams = ['pending'];
            }

            const promises = statusParams.map(s =>
                api.localAdminAPI.getLabBookings(assignedLab._id, s, 1, 100)
            );
            const responses = await Promise.all(promises);
            const all = responses.flatMap(r => r.success ? r.data : (r.data || []));

            all.sort((a, b) => {
                const da = new Date(a.appointmentDate);
                const db = new Date(b.appointmentDate);
                return activeTab === 'completed' ? db - da : da - db;
            });
            setBookings(all);
        } catch (err) {
            console.error('Error fetching bookings:', err);
        } finally {
            setLoading(false);
        }
    };

    // ─── Date helpers ───
    const normalize = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
    const todayDate = normalize(new Date());
    const isToday = (d) => normalize(d).getTime() === todayDate.getTime();
    const isPast = (d) => normalize(d).getTime() < todayDate.getTime();
    const isFuture = (d) => normalize(d).getTime() > todayDate.getTime();

    const daysFromNow = (d) => {
        const diff = normalize(d).getTime() - todayDate.getTime();
        return Math.round(diff / (1000 * 60 * 60 * 24));
    };

    const relativeDay = (d) => {
        const days = daysFromNow(d);
        if (days === 0) return 'Today';
        if (days === 1) return 'Tomorrow';
        if (days === -1) return 'Yesterday';
        if (days > 0) return `In ${days} days`;
        return `${Math.abs(days)} days ago`;
    };

    // ─── Stats ───
    const stats = useMemo(() => {
        const todayBookings = bookings.filter(b => isToday(b.appointmentDate));
        const upcomingBookings = bookings.filter(b => isFuture(b.appointmentDate));
        const arrived = bookings.filter(b => b.status === 'arrived');
        const samplesCollected = bookings.filter(b => b.status === 'sample_collected');
        const inTesting = bookings.filter(b => b.status === 'testing' || b.status === 'partially_completed');
        const completed = bookings.filter(b => b.status === 'completed' || b.status === 'result_published');

        return {
            todayBookings,
            upcomingBookings,
            arrived: arrived.length,
            samplesCollected: samplesCollected.length,
            inTesting: inTesting.length,
            completedToday: completed.filter(b => isToday(b.updatedAt)).length
        };
    }, [bookings]);

    // ─── Upcoming Activities (next 7 days) ───
    const upcomingActivities = useMemo(() => {
        return bookings
            .filter(b => {
                const days = daysFromNow(b.appointmentDate);
                return days >= 0 && days <= 7;
            })
            .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
            .slice(0, 6);
    }, [bookings]);

    // ─── Filtered bookings ───
    const filteredBookings = bookings.filter(b => {
        const s = searchTerm.toLowerCase();
        return (
            b.userId?.firstName?.toLowerCase().includes(s) ||
            b.userId?.lastName?.toLowerCase().includes(s) ||
            b.userId?.email?.toLowerCase().includes(s) ||
            b.userId?.phone?.toLowerCase().includes(s) ||
            b.sampleId?.toLowerCase().includes(s) ||
            b._id?.toLowerCase().includes(s)
        );
    });

    // ─── Action handlers ───
    const handleStatusUpdate = async (bookingId, newStatus) => {
        const title = newStatus === 'confirmed' ? 'Authorize Sync?' : newStatus === 'arrived' ? 'Confirm Arrival?' : 'Confirm Operation';
        const text = newStatus === 'confirmed' ? 'Authorize this clinical record?' : newStatus === 'arrived' ? 'Patient has arrived at node?' : 'Synchronize status?';

        const result = await Swal.fire({
            title,
            text,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0f172a',
            cancelButtonColor: '#cbd5e1',
            confirmButtonText: 'Proceed',
        });
        if (!result.isConfirmed) return;
        try {
            await api.bookingAPI.updateBookingStatus(bookingId, { status: newStatus });
            Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
                .fire({ icon: 'success', title: 'Status Synchronized' });
            fetchBookings();
        } catch {
            Swal.fire('Error', 'Link Failure: Failed to update status.', 'error');
        }
    };

    const handleConfirmPayment = async (bookingId) => {
        const result = await Swal.fire({
            title: 'Confirm Payment?',
            text: 'Acknowledge receipt of funds for this record?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#cbd5e1',
            confirmButtonText: 'Confirm Received'
        });
        if (!result.isConfirmed) return;
        try {
            await api.bookingAPI.confirmOfflinePayment(bookingId);
            Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
                .fire({ icon: 'success', title: 'Payment Settled' });
            fetchBookings();
        } catch {
            Swal.fire('Error', 'Link Failure: Failed to update payment status.', 'error');
        }
    };

    const handleViewHistory = async (userId) => {
        try {
            setLoadingHistory(true);
            setSelectedPatient(userId);
            const res = await api.bookingAPI.getPatientHistory(userId);
            if (res.success) {
                const data = res.data;
                // Backend now returns { patient, bookings, vitals }
                setPatientDetails(data?.patient || null);
                setPatientHistory(data?.bookings || (Array.isArray(data) ? data : []));
            }
            setLoadingHistory(false);
        } catch (err) {
            console.error('Error fetching history:', err);
            setLoadingHistory(false);
        }
    };

    const handleCollectSample = async (booking) => {
        if (isFuture(booking.appointmentDate)) {
            Swal.fire({ icon: 'warning', title: 'Phase Conflict', text: `Sample window opens on ${new Date(booking.appointmentDate).toLocaleDateString()}.` });
            return;
        }
        if (isPast(booking.appointmentDate)) {
            Swal.fire({ icon: 'error', title: 'Time Lapse Detected', text: `Appointment expired on ${new Date(booking.appointmentDate).toLocaleDateString()}.` });
            try { await api.localAdminAPI.collectSample(booking._id); } catch { }
            fetchBookings();
            return;
        }
        const { value: formValues } = await Swal.fire({
            title: 'Initiate Collection?',
            html: `
                <div class="text-left py-4">
                    <p class="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-3">Diagnostic Context</p>
                    <div class="space-y-4">
                        <div>
                            <label class="text-[9px] font-bold uppercase text-slate-500 mb-1 block">Primary Asset Type</label>
                            <select id="swal-sample-type" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none appearance-none">
                                <option value="Blood">Blood (Venous)</option>
                                <option value="Urine">Urine (Clean Catch)</option>
                                <option value="Swab">Swab (Nasal/Throat)</option>
                                <option value="Serum">Serum</option>
                                <option value="Plasma">Plasma</option>
                                <option value="Other">Other / Clinical Specimen</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[9px] font-bold uppercase text-slate-500 mb-1 block">Clinical Operator</label>
                            <input id="swal-staff" type="text" value="${assignedLab.adminId?.firstName || 'Assigned Staff'}" class="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold focus:ring-2 focus:ring-slate-900 focus:outline-none" readonly />
                        </div>
                    </div>
                </div>
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Finalize Collection',
            confirmButtonColor: '#0f172a',
            preConfirm: () => {
                return {
                    sampleType: document.getElementById('swal-sample-type').value,
                    collectedBy: document.getElementById('swal-staff').value
                }
            }
        });

        if (!formValues) return;

        try {
            const res = await api.localAdminAPI.collectSample(booking._id, formValues);
            if (res.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Collection Secured',
                    html: `<div class="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                        <p class="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-3 text-left">Asset IDs Assigned</p>
                        <div class="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar text-left">
                            ${res.data.samples.map(s => `
                                <div class="flex justify-between items-center py-2 border-b border-emerald-100 last:border-0">
                                    <span class="text-[8px] font-black text-emerald-800 uppercase tracking-tighter">Diagnostic Unit</span>
                                    <span class="text-xs font-black text-slate-900 tracking-widest">${s.sampleId}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>`,
                    confirmButtonColor: '#0f172a'
                });
                fetchBookings();
            }
        } catch (err) {
            Swal.fire('Error', err.message || 'Asset creation failed.', 'error');
            fetchBookings();
        }
    };

    // ─── Tab config ───
    const tabs = [
        { key: 'active', label: 'Reception', count: stats.todayBookings?.length, color: 'blue' },
        { key: 'diagnostics', label: 'Laboratory', count: null, color: 'purple' },
        { key: 'verification', label: 'QC Review', count: null, color: 'amber' },
        { key: 'archive', label: 'Archive', count: null, color: 'green' }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 pb-12"
        >
            {/* ═══ Header ═══ */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
                <div>
                    <div className="flex items-center space-x-2 mb-3">
                        <div className="h-0.5 w-8 bg-slate-900"></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Queue Management System</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">Subject Records</h1>
                    <p className="text-slate-500 font-medium mt-1">Operational oversight of patient status and diagnostic phases</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 w-full xl:w-auto">
                    <div className="relative w-full sm:w-80 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-hover:text-slate-900 transition-colors" />
                        <input
                            type="text"
                            placeholder="Universal Reference Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900/5 transition-all text-sm font-bold uppercase tracking-wider placeholder:text-slate-300"
                        />
                    </div>
                    <div className="flex p-1.5 bg-white rounded-2xl border border-gray-100 shadow-sm w-full sm:w-auto overflow-x-auto no-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`whitespace-nowrap px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab.key
                                    ? 'bg-slate-900 text-white shadow-lg'
                                    : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
                                    }`}
                            >
                                {tab.label}
                                {tab.count !== null && tab.count > 0 && (
                                    <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[8px] font-black ${activeTab === tab.key ? 'bg-white/20' : 'bg-slate-100 text-slate-500'}`}>
                                        {tab.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ═══ Stats Cards ═══ */}
            <AnimatePresence mode="wait">
                {activeTab === 'active' && !loading && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
                    >
                        {[
                            { label: 'Today Total', val: stats.todayBookings.length, sub: 'Units Expected', icon: Users, color: 'from-slate-900 to-slate-800' },
                            { label: 'Samples', val: stats.samplesCollected, sub: 'Collected Today', icon: TestTube, color: 'from-indigo-900 to-indigo-800' },
                            { label: 'In Progress', val: stats.inTesting, sub: 'Active Diagnostics', icon: Activity, color: 'from-amber-900 to-amber-800' },
                            { label: 'Completed', val: stats.completedToday, sub: 'Reports Ready', icon: CheckCircle, color: 'from-emerald-900 to-emerald-800' }
                        ].map((s, i) => (
                            <div key={i} className={`relative overflow-hidden bg-gradient-to-br ${s.color} rounded-[2rem] p-6 text-white shadow-xl shadow-slate-200`}>
                                <div className="absolute -top-4 -right-4 opacity-10 group-hover:scale-110 transition-transform">
                                    <s.icon className="h-32 w-32" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-white/50 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{s.label}</p>
                                    <h3 className="text-4xl font-black tracking-tighter mb-1">{s.val}</h3>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{s.sub}</p>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ═══ Upcoming Activities Timeline ═══ */}
            {activeTab === 'active' && !loading && upcomingActivities.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-[2.5rem] border border-gray-100 shadow-2xl shadow-slate-50 overflow-hidden"
                >
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-slate-50/50">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center">
                                <Activity className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Diagnostic Forecast</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Rolling 7-Day Protocol</p>
                            </div>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50 p-2">
                        {upcomingActivities.map((b, i) => {
                            const today = isToday(b.appointmentDate);
                            const testCount = (b.selectedTests || []).length + (b.selectedPackages || []).length;
                            return (
                                <div key={b._id}
                                    className={`px-6 py-5 flex items-center gap-6 hover:bg-slate-50/50 transition-all rounded-[1.5rem] ${today ? 'bg-slate-50/80 ring-1 ring-inset ring-slate-100' : ''}`}
                                >
                                    <div className="flex flex-col items-center justify-center w-14 flex-shrink-0">
                                        <span className={`text-xl font-black tracking-tighter ${today ? 'text-slate-900' : 'text-slate-400'}`}>
                                            {new Date(b.appointmentDate).toLocaleDateString('en-US', { day: '2-digit' })}
                                        </span>
                                        <span className={`text-[8px] uppercase font-black tracking-[0.25em] ${today ? 'text-slate-900' : 'text-slate-300'}`}>
                                            {new Date(b.appointmentDate).toLocaleDateString('en-US', { month: 'short' })}
                                        </span>
                                        {today && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-900 animate-pulse mt-1" />
                                        )}
                                    </div>

                                    <div className={`w-1 h-12 rounded-full flex-shrink-0 ${today ? 'bg-slate-900' : 'bg-slate-100'}`} />

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-black text-slate-900 uppercase tracking-tighter truncate">
                                                {b.userId?.firstName} {b.userId?.lastName}
                                            </span>
                                            {today && (
                                                <span className="text-[8px] bg-slate-900 text-white px-2 py-1 rounded-full font-black tracking-[0.2em] animate-pulse">
                                                    LIVE
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                            <span className="flex items-center gap-1.5"><Clock className="h-3 w-3" />{b.appointmentTime}</span>
                                            <span className="flex items-center gap-1.5"><TestTube className="h-3 w-3" />{testCount} Units</span>
                                            <span>{relativeDay(b.appointmentDate)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <StatusBadge status={b.status} />
                                        <div className="h-8 w-[1px] bg-slate-100"></div>
                                        {b.status === 'confirmed' && (
                                            <button
                                                onClick={() => handleStatusUpdate(b._id, 'arrived')}
                                                className="px-5 py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-100 flex items-center gap-2"
                                            >
                                                <Users className="h-3 w-3" /> Mark Arrived
                                            </button>
                                        )}
                                        {b.status === 'arrived' && (
                                            <button
                                                onClick={() => handleCollectSample(b)}
                                                className="px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
                                            >
                                                <TestTube className="h-3 w-3" /> Collect Asset
                                            </button>
                                        )}
                                        {b.status === 'pending' && (
                                            <button
                                                onClick={() => handleStatusUpdate(b._id, 'confirmed')}
                                                className="px-5 py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-slate-200 flex items-center gap-2"
                                            >
                                                <CheckCircle className="h-3 w-3" /> Authorize
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>
            )}

            {/* ═══ Records Table ═══ */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-2xl shadow-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                            {activeTab === 'active' ? 'Master Queue' : activeTab === 'diagnostics' ? 'Laboratory Stream' : activeTab === 'verification' ? 'Quality Control' : 'Archive Node'}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{filteredBookings.length} Unique Records Identified</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <button className="p-3 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl border border-gray-100 shadow-sm transition-all">
                            <Filter className="h-4 w-4" />
                        </button>
                        <button className="p-3 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl border border-gray-100 shadow-sm transition-all">
                            <Download className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-slate-50">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Subject</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Schedule</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Medical Batch</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Phase Status</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {[...Array(5)].map((_, j) => (
                                            <td key={j} className="px-8 py-6"><div className="h-4 bg-slate-50 rounded-lg w-full" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-24 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="h-20 w-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                                                <Activity className="h-10 w-10 text-slate-200" />
                                            </div>
                                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No Active Transmission</p>
                                            <p className="text-[10px] text-slate-300 font-bold uppercase tracking-widest mt-2">Adjust search parameters or refresh node</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredBookings.map(row => {
                                const today = isToday(row.appointmentDate);
                                const past = isPast(row.appointmentDate);
                                const future = isFuture(row.appointmentDate);
                                const testCount = (row.selectedTests || []).length + (row.selectedPackages || []).length;

                                return (
                                    <motion.tr
                                        key={row._id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={`group hover:bg-slate-50/50 transition-all ${today ? 'bg-slate-50/30' : ''}`}
                                    >
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-5">
                                                <div className="h-14 w-14 rounded-2xl bg-slate-900 border-4 border-slate-50 flex items-center justify-center text-white text-lg font-black flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
                                                    {(row.userId?.firstName?.[0] || '?').toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-none mb-1">
                                                        {row.userId?.firstName} {row.userId?.lastName}
                                                    </p>
                                                    <div className="flex items-center gap-3">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                            <Mail className="h-3 w-3" /> {row.userId?.email}
                                                        </p>
                                                        <span className="w-1 h-1 rounded-full bg-slate-200"></span>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                                            <Phone className="h-3 w-3" /> {row.userId?.phone}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-8 py-6">
                                            <div className="flex flex-col">
                                                <span className={`text-sm font-black uppercase tracking-wider ${today ? 'text-slate-900' : past ? 'text-rose-600' : 'text-slate-600'}`}>
                                                    {new Date(row.appointmentDate).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-slate-400 group-hover:text-slate-900 transition-colors uppercase flex items-center gap-1">
                                                        <Clock className="h-3 w-3" /> {row.appointmentTime}
                                                    </span>
                                                    {today && <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>}
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-slate-100 rounded-lg">
                                                    <TestTube className="h-4 w-4 text-slate-600" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-slate-900 uppercase tracking-widest">{testCount} Tests</p>
                                                    <p className={`text-[9px] font-black uppercase tracking-widest mt-1 p-1 inline-block rounded ${row.paymentStatus === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                        {row.paymentStatus === 'completed' ? 'Pre-Settled' : 'Payment Pending'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-8 py-6">
                                            <StatusBadge status={row.status} />
                                        </td>

                                        <td className="px-8 py-6 text-right">
                                            <div className="flex justify-end items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {row.paymentStatus === 'pending' && (
                                                    <button
                                                        onClick={() => handleConfirmPayment(row._id)}
                                                        className="p-3 bg-white hover:bg-emerald-500 text-slate-400 hover:text-white rounded-2xl border border-gray-100 shadow-sm transition-all"
                                                        title="Confirm Payment"
                                                    >
                                                        <CreditCard className="h-5 w-5" />
                                                    </button>
                                                )}
                                                {row.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(row._id, 'confirmed')}
                                                        className="p-3 bg-white hover:bg-slate-900 text-slate-400 hover:text-white rounded-2xl border border-gray-100 shadow-sm transition-all"
                                                        title="Authorize Record"
                                                    >
                                                        <CheckCircle className="h-5 w-5" />
                                                    </button>
                                                )}
                                                {row.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(row._id, 'arrived')}
                                                        className="p-3 bg-white hover:bg-indigo-600 text-slate-400 hover:text-white rounded-2xl border border-gray-100 shadow-sm transition-all"
                                                        title="Mark Arrived"
                                                    >
                                                        <Users className="h-5 w-5" />
                                                    </button>
                                                )}
                                                {row.status === 'arrived' && (
                                                    <button
                                                        onClick={() => handleCollectSample(row)}
                                                        className="p-3 bg-white hover:bg-slate-900 text-slate-400 hover:text-white rounded-2xl border border-gray-100 shadow-sm transition-all"
                                                        title="Initiate Collection"
                                                    >
                                                        <TestTube className="h-5 w-5" />
                                                    </button>
                                                )}
                                                {['sample_collected', 'processing'].includes(row.status) && (
                                                    <Link
                                                        to="/staff/upload-reports"
                                                        className="p-3 bg-white hover:bg-slate-900 text-slate-400 hover:text-white rounded-2xl border border-gray-100 shadow-sm transition-all"
                                                        title="Input Diagnostics"
                                                    >
                                                        <FileText className="h-5 w-5" />
                                                    </Link>
                                                )}
                                                <button
                                                    onClick={() => handleViewHistory(row.userId?._id)}
                                                    className="p-3 bg-white hover:bg-slate-900 text-slate-400 hover:text-white rounded-2xl border border-gray-100 shadow-sm transition-all"
                                                    title="Reveal History"
                                                >
                                                    <Activity className="h-5 w-5" />
                                                </button>
                                                <button className="p-3 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl border border-gray-100 shadow-sm transition-all">
                                                    <MoreHorizontal className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ═══ Patient History Modal ═══ */}
            <AnimatePresence>
                {selectedPatient && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedPatient(null)}
                            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                        ></motion.div>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-4xl bg-white rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-10 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 rounded-[1.8rem] bg-slate-900 flex items-center justify-center text-white text-xl font-black">
                                        {patientDetails?.firstName?.[0] || 'P'}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-1">Clinical Archive</p>
                                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">
                                            {patientDetails ? `${patientDetails.firstName} ${patientDetails.lastName}` : 'Patient History'}
                                        </h2>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedPatient(null)}
                                    className="p-4 hover:bg-white rounded-2xl transition-all group"
                                >
                                    <Eye className="h-6 w-6 text-slate-300 group-hover:text-slate-900 rotate-180" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-10 space-y-6">
                                {loadingHistory ? (
                                    <div className="flex flex-col items-center py-20">
                                        <div className="h-12 w-12 border-4 border-slate-100 border-t-slate-900 rounded-full animate-spin"></div>
                                        <p className="mt-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">Hydrating Archive Node...</p>
                                    </div>
                                ) : !Array.isArray(patientHistory) ? (
                                    <div className="text-center py-20">
                                        <AlertTriangle className="h-12 w-12 text-rose-100 mx-auto mb-4" />
                                        <p className="text-xs font-black text-rose-300 uppercase tracking-widest">Protocol Error: Invalid Diagnostic Data</p>
                                    </div>
                                ) : patientHistory.length === 0 ? (
                                    <div className="text-center py-20">
                                        <Activity className="h-12 w-12 text-slate-100 mx-auto mb-4" />
                                        <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No prior diagnostic records found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {patientHistory.map((h, i) => (
                                            <div key={h._id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:bg-white hover:border-slate-200 transition-all">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex flex-col items-center justify-center w-12">
                                                        <span className="text-lg font-black text-slate-900 tracking-tighter">{moment(h.appointmentDate).format('DD')}</span>
                                                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{moment(h.appointmentDate).format('MMM')}</span>
                                                    </div>
                                                    <div className="h-8 w-[1px] bg-slate-200"></div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 uppercase tracking-tight mb-0.5">
                                                            {(h.selectedTests || []).map(t => t.testName).join(', ')}
                                                            {(h.selectedPackages || []).map(p => p.packageName).join(', ')}
                                                        </p>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                                                <FileText className="h-3 w-3" /> {h._id.slice(-8)}
                                                            </span>
                                                            <StatusBadge status={h.status} className="scale-75 origin-left" />
                                                        </div>
                                                    </div>
                                                </div>
                                                <Link
                                                    to={`/staff/upload-reports?bookingId=${h._id}`}
                                                    className="p-3 bg-white group-hover:bg-slate-900 text-slate-400 group-hover:text-white rounded-xl border border-slate-100 transition-all"
                                                >
                                                    <ArrowUpRight className="h-4 w-4" />
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AssignedOverview;
