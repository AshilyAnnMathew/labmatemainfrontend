import React, { useState, useEffect, useMemo } from 'react';
import {
    TestTube, Calendar, Clock, User, Phone, Mail, CreditCard,
    CheckCircle, AlertCircle, FileText, AlertTriangle, ChevronRight,
    Activity, Users, Flame, Eye, ArrowUpRight, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../services/api';
import StatusBadge from '../components/common/StatusBadge';

const AssignedOverview = ({ assignedLab }) => {
    const [activeTab, setActiveTab] = useState('active');
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

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
                    statusParams = ['pending', 'confirmed'];
                    break;
                case 'processing':
                    statusParams = ['sample_collected', 'processing', 'in_progress'];
                    break;
                case 'completed':
                    statusParams = ['result_published', 'completed'];
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
        const expiredBookings = bookings.filter(b => isPast(b.appointmentDate) && b.status === 'confirmed');
        const pendingPayments = bookings.filter(b => b.paymentStatus === 'pending' && b.paymentMethod === 'pay_later');
        return { todayBookings, upcomingBookings, expiredBookings, pendingPayments };
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
            b._id?.toLowerCase().includes(s)
        );
    });

    // ─── Action handlers ───
    const handleStatusUpdate = async (bookingId, newStatus) => {
        const result = await Swal.fire({
            title: 'Confirm Booking?',
            text: 'This will mark the booking as confirmed and notify the patient.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3b82f6',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'Yes, Confirm',
        });
        if (!result.isConfirmed) return;
        try {
            await api.bookingAPI.updateBookingStatus(bookingId, { status: newStatus });
            Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
                .fire({ icon: 'success', title: 'Booking confirmed!' });
            fetchBookings();
        } catch {
            Swal.fire('Error', 'Failed to update booking status.', 'error');
        }
    };

    const handleCollectSample = async (booking) => {
        if (isFuture(booking.appointmentDate)) {
            Swal.fire({ icon: 'warning', title: 'Too Early', text: `Appointment is on ${new Date(booking.appointmentDate).toLocaleDateString()}. Collect on appointment day.` });
            return;
        }
        if (isPast(booking.appointmentDate)) {
            Swal.fire({ icon: 'error', title: 'Appointment Expired', text: `Appointment was on ${new Date(booking.appointmentDate).toLocaleDateString()}. Marking as "No Show".` });
            try { await api.localAdminAPI.collectSample(booking._id); } catch { }
            fetchBookings();
            return;
        }
        const result = await Swal.fire({
            title: 'Collect Sample?',
            html: `<div class="text-left text-sm text-gray-600">
        <p><strong>Patient:</strong> ${booking.userId?.firstName} ${booking.userId?.lastName}</p>
        <p><strong>Tests:</strong> ${(booking.selectedTests || []).length + (booking.selectedPackages || []).length} item(s)</p>
        <p class="mt-2 text-amber-600">⚠️ Verify patient identity before proceeding.</p></div>`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonColor: '#7c3aed',
            confirmButtonText: '✓ Collect Sample',
        });
        if (!result.isConfirmed) return;
        try {
            const res = await api.localAdminAPI.collectSample(booking._id);
            if (res.success) {
                Swal.fire({ icon: 'success', title: 'Sample Collected!', html: `<p class="text-sm">Sample ID: <strong>${res.data.sampleId}</strong></p>`, confirmButtonColor: '#7c3aed' });
                fetchBookings();
            }
        } catch (err) {
            Swal.fire('Error', err.message || 'Failed to collect sample.', 'error');
            fetchBookings();
        }
    };

    const handlePaymentProcess = async (bookingId) => {
        const result = await Swal.fire({
            title: 'Process Payment?',
            text: 'Mark this booking\'s payment as received.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            confirmButtonText: '💳 Process Payment',
        });
        if (!result.isConfirmed) return;
        try {
            await api.bookingAPI.processPayment(bookingId);
            Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
                .fire({ icon: 'success', title: 'Payment processed!' });
            fetchBookings();
        } catch {
            Swal.fire('Error', 'Failed to process payment.', 'error');
        }
    };

    // ─── Tab config ───
    const tabs = [
        { key: 'active', label: 'Active', count: bookings.length, color: 'blue' },
        { key: 'processing', label: 'Processing', count: null, color: 'purple' },
        { key: 'completed', label: 'Completed', count: null, color: 'green' }
    ];

    return (
        <div className="space-y-6">
            {/* ═══ Header ═══ */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage appointments, samples, and patient workflows.</p>
                </div>
                <div className="bg-white p-1 rounded-xl border border-gray-200 flex shadow-sm">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-5 py-2 text-sm font-medium rounded-lg transition-all capitalize ${activeTab === tab.key
                                    ? 'bg-primary-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══ Stats Cards (active tab only) ═══ */}
            {activeTab === 'active' && !loading && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="relative overflow-hidden bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white shadow-lg shadow-blue-500/20">
                        <div className="absolute -top-2 -right-2 opacity-10"><Calendar className="h-20 w-20" /></div>
                        <div className="relative">
                            <p className="text-blue-100 text-xs font-medium uppercase tracking-wider">Today's Appointments</p>
                            <p className="text-3xl font-bold mt-1">{stats.todayBookings.length}</p>
                            <p className="text-blue-200 text-xs mt-1">
                                {stats.todayBookings.filter(b => b.status === 'confirmed').length} ready to collect
                            </p>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl p-4 text-white shadow-lg shadow-purple-500/20">
                        <div className="absolute -top-2 -right-2 opacity-10"><TrendingUp className="h-20 w-20" /></div>
                        <div className="relative">
                            <p className="text-purple-100 text-xs font-medium uppercase tracking-wider">Upcoming</p>
                            <p className="text-3xl font-bold mt-1">{stats.upcomingBookings.length}</p>
                            <p className="text-purple-200 text-xs mt-1">Next 7+ days scheduled</p>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-red-500 to-rose-600 rounded-xl p-4 text-white shadow-lg shadow-red-500/20">
                        <div className="absolute -top-2 -right-2 opacity-10"><AlertTriangle className="h-20 w-20" /></div>
                        <div className="relative">
                            <p className="text-red-100 text-xs font-medium uppercase tracking-wider">Expired</p>
                            <p className="text-3xl font-bold mt-1">{stats.expiredBookings.length}</p>
                            <p className="text-red-200 text-xs mt-1">Need attention / no show</p>
                        </div>
                    </div>

                    <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-4 text-white shadow-lg shadow-amber-500/20">
                        <div className="absolute -top-2 -right-2 opacity-10"><CreditCard className="h-20 w-20" /></div>
                        <div className="relative">
                            <p className="text-amber-100 text-xs font-medium uppercase tracking-wider">Pending Payments</p>
                            <p className="text-3xl font-bold mt-1">{stats.pendingPayments.length}</p>
                            <p className="text-amber-200 text-xs mt-1">Pay at lab</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Upcoming Activities Timeline (active tab only) ═══ */}
            {activeTab === 'active' && !loading && upcomingActivities.length > 0 && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary-100 flex items-center justify-center">
                                <Activity className="h-4 w-4 text-primary-600" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Upcoming Activities</h3>
                                <p className="text-xs text-gray-500">Next 7 days schedule</p>
                            </div>
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {upcomingActivities.map((b, i) => {
                            const today = isToday(b.appointmentDate);
                            const testCount = (b.selectedTests || []).length + (b.selectedPackages || []).length;
                            return (
                                <div key={b._id}
                                    className={`px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/80 transition-colors ${today ? 'bg-blue-50/40' : ''}`}
                                >
                                    {/* Timeline dot */}
                                    <div className="flex flex-col items-center gap-0.5 w-12 flex-shrink-0">
                                        <span className={`text-xs font-bold ${today ? 'text-blue-600' : 'text-gray-500'}`}>
                                            {new Date(b.appointmentDate).toLocaleDateString('en-US', { day: '2-digit' })}
                                        </span>
                                        <span className={`text-[10px] uppercase font-semibold ${today ? 'text-blue-500' : 'text-gray-400'}`}>
                                            {new Date(b.appointmentDate).toLocaleDateString('en-US', { month: 'short' })}
                                        </span>
                                        {today && (
                                            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse mt-0.5" />
                                        )}
                                    </div>

                                    {/* Connector */}
                                    <div className={`w-0.5 h-10 rounded-full flex-shrink-0 ${today ? 'bg-blue-300' : 'bg-gray-200'}`} />

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-semibold text-gray-900 truncate">
                                                {b.userId?.firstName} {b.userId?.lastName}
                                            </span>
                                            {today && (
                                                <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold animate-pulse">
                                                    TODAY
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{b.appointmentTime}</span>
                                            <span className="flex items-center gap-1"><TestTube className="h-3 w-3" />{testCount} test{testCount !== 1 ? 's' : ''}</span>
                                            <span>{relativeDay(b.appointmentDate)}</span>
                                        </div>
                                    </div>

                                    {/* Status + Action */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <StatusBadge status={b.status} />
                                        {today && b.status === 'confirmed' && (
                                            <button
                                                onClick={() => handleCollectSample(b)}
                                                className="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 flex items-center gap-1 shadow-sm transition-colors"
                                            >
                                                <TestTube className="h-3 w-3" /> Collect
                                            </button>
                                        )}
                                        {b.status === 'pending' && (
                                            <button
                                                onClick={() => handleStatusUpdate(b._id, 'confirmed')}
                                                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 flex items-center gap-1 shadow-sm transition-colors"
                                            >
                                                <CheckCircle className="h-3 w-3" /> Confirm
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ═══ Bookings Table ═══ */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Table Header */}
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                            <Users className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">
                                {activeTab === 'active' ? 'All Active Bookings' : activeTab === 'processing' ? 'Processing' : 'Completed'}
                            </h3>
                            <p className="text-xs text-gray-500">{filteredBookings.length} booking{filteredBookings.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <div className="relative max-w-xs">
                        <input
                            type="text"
                            placeholder="Search patients..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <Eye className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead className="bg-gray-50/80">
                            <tr>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Appointment</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tests & Payment</th>
                                <th className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-5 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                [...Array(4)].map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {[...Array(5)].map((_, j) => (
                                            <td key={j} className="px-5 py-4"><div className="h-4 bg-gray-100 rounded w-3/4" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-5 py-16 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="h-14 w-14 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                                                <User className="h-7 w-7 text-gray-300" />
                                            </div>
                                            <p className="text-sm font-medium text-gray-500">No {activeTab} bookings</p>
                                            <p className="text-xs text-gray-400 mt-1">Check back later or adjust your filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredBookings.map(row => {
                                const today = isToday(row.appointmentDate);
                                const past = isPast(row.appointmentDate);
                                const future = isFuture(row.appointmentDate);
                                const testCount = (row.selectedTests || []).length + (row.selectedPackages || []).length;

                                return (
                                    <tr
                                        key={row._id}
                                        className={`transition-colors hover:bg-gray-50/80 ${today ? 'bg-blue-50/30 border-l-[3px] border-l-blue-500' : past && row.status === 'confirmed' ? 'bg-red-50/20 border-l-[3px] border-l-red-400' : ''}`}
                                    >
                                        {/* Patient */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                    {(row.userId?.firstName?.[0] || '?').toUpperCase()}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{row.userId?.firstName} {row.userId?.lastName}</p>
                                                    <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                                        <Mail className="h-3 w-3 flex-shrink-0" />{row.userId?.email}
                                                    </p>
                                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Phone className="h-3 w-3 flex-shrink-0" />{row.userId?.phone}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Appointment */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
                                                <span className={`font-medium ${today ? 'text-blue-700' : past ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {new Date(row.appointmentDate).toLocaleDateString()}
                                                </span>
                                                {today && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">TODAY</span>}
                                                {past && row.status === 'confirmed' && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">EXPIRED</span>}
                                                {future && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">UPCOMING</span>}
                                            </div>
                                            <div className="text-xs text-gray-500 flex items-center gap-1 mt-1 ml-6">
                                                <Clock className="h-3 w-3" />{row.appointmentTime}
                                            </div>
                                        </td>

                                        {/* Tests & Payment */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                                                <TestTube className="h-4 w-4 text-primary-600" />
                                                {testCount} item{testCount !== 1 ? 's' : ''}
                                            </div>
                                            <div className="mt-1.5 flex items-center gap-2">
                                                <StatusBadge status={row.paymentStatus} />
                                                <span className="text-[11px] text-gray-400">
                                                    {row.paymentMethod === 'pay_later' ? 'Pay at Lab' : 'Online'}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-3.5">
                                            <StatusBadge status={row.status} />
                                        </td>

                                        {/* Actions */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex flex-col items-end gap-1.5">
                                                {row.status === 'pending' && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(row._id, 'confirmed')}
                                                        className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-100 flex items-center gap-1 transition-colors"
                                                    >
                                                        <CheckCircle className="h-3 w-3" /> Confirm
                                                    </button>
                                                )}
                                                {row.status === 'confirmed' && (
                                                    <button
                                                        onClick={() => handleCollectSample(row)}
                                                        disabled={future}
                                                        title={
                                                            future ? `Available on ${new Date(row.appointmentDate).toLocaleDateString()}`
                                                                : past ? 'Expired — will mark as No Show'
                                                                    : 'Collect sample'
                                                        }
                                                        className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1 transition-colors ${future
                                                                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                                                                : past
                                                                    ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
                                                                    : 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                                                            }`}
                                                    >
                                                        {future ? <><Clock className="h-3 w-3" /> Not Yet</>
                                                            : past ? <><AlertTriangle className="h-3 w-3" /> Expired</>
                                                                : <><TestTube className="h-3 w-3" /> Collect Sample</>
                                                        }
                                                    </button>
                                                )}
                                                {['sample_collected', 'processing'].includes(row.status) && (
                                                    <Link
                                                        to="/staff/upload-reports"
                                                        className="text-xs bg-teal-50 text-teal-700 px-3 py-1.5 rounded-lg border border-teal-200 hover:bg-teal-100 flex items-center gap-1 transition-colors"
                                                    >
                                                        <FileText className="h-3 w-3" /> Add Result
                                                    </Link>
                                                )}
                                                {row.paymentStatus === 'pending' && row.paymentMethod === 'pay_later' && (
                                                    <button
                                                        onClick={() => handlePaymentProcess(row._id)}
                                                        className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-200 hover:bg-amber-100 flex items-center gap-1 transition-colors"
                                                    >
                                                        <CreditCard className="h-3 w-3" /> Process Payment
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AssignedOverview;
