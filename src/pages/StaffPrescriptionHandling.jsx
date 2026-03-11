import React, { useState, useEffect } from 'react';
import {
    FileText, CheckCircle, XCircle, Calendar, User, Clock,
    Search, ChevronRight, Maximize2, X, Filter, ShieldCheck,
    Zap, Activity, Microscope, Layers, AlertTriangle, RefreshCw,
    ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import moment from 'moment';

const StaffPrescriptionHandling = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFullImage, setShowFullImage] = useState(false);

    useEffect(() => {
        if (user?.assignedLab) {
            fetchPrescriptionBookings();
        }
    }, [user]);

    const fetchPrescriptionBookings = async () => {
        try {
            setLoading(true);
            const response = await api.localAdminAPI.getLabBookings(
                user.assignedLab,
                'pending',
                1,
                100,
                { hasPrescription: 'true' }
            );
            if (response.success || response.data) {
                setBookings(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching prescription bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (bookingId, action) => {
        if (action === 'confirm') {
            try {
                const res = await api.bookingAPI.updateBookingStatus(bookingId, 'confirmed');
                if (res.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Prescription Validated',
                        text: 'Analytical assets confirmed in the clinical node.',
                        confirmButtonColor: '#0f172a'
                    });
                    fetchPrescriptionBookings();
                    setSelectedBooking(null);
                }
            } catch (error) {
                Swal.fire('Error', 'Validation sequence failed.', 'error');
            }
        } else if (action === 'reject') {
            const result = await Swal.fire({
                title: 'Authorize Rejection?',
                text: "Invalidate this clinical directive?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#0f172a',
                confirmButtonText: 'Confirm Rejection'
            });
            if (result.isConfirmed) {
                try {
                    await api.bookingAPI.updateBookingStatus(bookingId, 'cancelled');
                    Swal.fire('Rejected', 'Prescription invalidated.', 'success');
                    fetchPrescriptionBookings();
                    setSelectedBooking(null);
                } catch (error) {
                    Swal.fire('Error', 'Communication failure.', 'error');
                }
            }
        }
    };

    const getImageUrl = (path) => {
        if (!path) return null;
        const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
        return `${baseUrl}/${path.replace(/\\/g, '/')}`;
    };

    const filteredBookings = bookings.filter(b =>
        (b.userId?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.userId?.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.userId?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-[calc(100vh-8rem)] flex flex-col space-y-8"
        >
            {/* Cinematic Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
                <div>
                    <div className="flex items-center space-x-2 mb-3">
                        <span className="px-3 py-1 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
                            Prescription Analysis Node
                        </span>
                        <div className="h-0.5 w-12 bg-slate-200"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Directive Verification Terminal
                        </span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">
                        Clinical Authorization
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="px-4 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-xl border border-indigo-100">
                        {bookings.length} Units Pending Verify
                    </div>
                </div>
            </div>

            {/* Terminal Layout */}
            <div className="flex-1 bg-white rounded-[3.5rem] border border-slate-50 shadow-2xl shadow-slate-100 overflow-hidden flex">

                {/* Tactical Sidebar */}
                <div className={`${selectedBooking ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[400px] border-r border-slate-50 bg-white`}>
                    <div className="p-8 space-y-6">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
                            <input
                                type="text"
                                placeholder="Identify Prescription Request..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-slate-100 focus:ring-4 focus:ring-slate-900/5 transition-all text-[10px] font-black uppercase tracking-widest placeholder:text-slate-300"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 custom-scrollbar">
                        {loading ? (
                            <div className="p-10 text-center animate-pulse">
                                <div className="h-4 w-32 bg-slate-100 rounded-full mx-auto mb-4" />
                                <div className="h-4 w-24 bg-slate-50 rounded-full mx-auto" />
                            </div>
                        ) : filteredBookings.length === 0 ? (
                            <div className="flex flex-col items-center justify-center p-12 text-center">
                                <FileText className="h-12 w-12 text-slate-100 mb-4" />
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Archive Void Detected</p>
                            </div>
                        ) : (
                            <div className="space-y-3 pb-8">
                                {filteredBookings.map(booking => (
                                    <motion.div
                                        key={booking._id}
                                        whileHover={{ x: 5 }}
                                        onClick={() => setSelectedBooking(booking)}
                                        className={`p-6 rounded-[2rem] cursor-pointer transition-all border relative group ${selectedBooking?._id === booking._id
                                            ? 'bg-slate-900 text-white border-slate-900 shadow-xl shadow-slate-200'
                                            : 'bg-white border-slate-50 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className={`text-[11px] font-black uppercase tracking-widest truncate flex-1 pr-4 ${selectedBooking?._id === booking._id ? 'text-white' : 'text-slate-900'
                                                }`}>
                                                {booking.userId?.firstName} {booking.userId?.lastName}
                                            </h4>
                                            <span className={`text-[9px] font-bold uppercase tracking-widest whitespace-nowrap ${selectedBooking?._id === booking._id ? 'text-white/40' : 'text-slate-300'
                                                }`}>
                                                {moment(booking.createdAt).format('DD MMM')}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className={`px-3 py-1 text-[9px] font-bold uppercase tracking-widest rounded-lg ${selectedBooking?._id === booking._id ? 'bg-white/10 text-white' : 'bg-slate-50 text-slate-400'
                                                }`}>
                                                {booking.appointmentTime}
                                            </div>
                                            <ChevronRight className={`h-4 w-4 transition-transform ${selectedBooking?._id === booking._id ? 'translate-x-1 text-white' : 'text-slate-200'}`} />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Directive Analysis Node */}
                <div className={`${!selectedBooking ? 'hidden lg:flex' : 'flex'} flex-col flex-1 bg-slate-50/20 h-full relative`}>
                    <AnimatePresence mode="wait">
                        {selectedBooking ? (
                            <motion.div
                                key={selectedBooking._id}
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="flex flex-col h-full"
                            >
                                {/* Vault Header */}
                                <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-white">
                                    <div className="flex items-center gap-6">
                                        <button
                                            onClick={() => setSelectedBooking(null)}
                                            className="lg:hidden p-4 bg-slate-50 rounded-2xl text-slate-400"
                                        >
                                            <ArrowLeft className="h-5 w-5" />
                                        </button>
                                        <div>
                                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
                                                Directive Analysis
                                            </h2>
                                            <div className="flex items-center gap-4">
                                                <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-emerald-100">
                                                    Biometric Verified
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                                                    Batch: {selectedBooking._id.slice(-12).toUpperCase()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowFullImage(true)}
                                        className="p-4 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200 hover:scale-110 transition-all"
                                    >
                                        <Maximize2 className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Analytical Content */}
                                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                                    <div className="max-w-5xl mx-auto space-y-10">

                                        {/* Optical Viewer */}
                                        <div className="relative group bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl min-h-[500px] flex items-center justify-center border-8 border-white p-4">
                                            {selectedBooking.prescriptionUrl ? (
                                                <img
                                                    src={getImageUrl(selectedBooking.prescriptionUrl)}
                                                    alt="Prescription Directive"
                                                    className="max-h-[600px] object-contain transition-transform group-hover:scale-[1.02]"
                                                />
                                            ) : (
                                                <div className="text-white/20 flex flex-col items-center">
                                                    <Microscope className="h-20 w-20 mb-4 animate-pulse" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Asset Void</p>
                                                </div>
                                            )}
                                            <div className="absolute top-8 left-8 flex items-center gap-3">
                                                <div className="h-2 w-2 bg-rose-500 rounded-full animate-ping" />
                                                <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.4em]">Scanning Optical Node...</span>
                                            </div>
                                        </div>

                                        {/* Subject Metadata */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center gap-6">
                                                <div className="h-16 w-16 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center">
                                                    <User className="h-7 w-7" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">Authenticated Subject</p>
                                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter truncate leading-none">
                                                        {selectedBooking.userId?.firstName} {selectedBooking.userId?.lastName}
                                                    </h4>
                                                </div>
                                            </div>
                                            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-50 shadow-sm flex items-center gap-6">
                                                <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                                    <Calendar className="h-7 w-7" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mb-1">Temporal Window</p>
                                                    <h4 className="text-xl font-black text-slate-900 uppercase tracking-tighter truncate leading-none">
                                                        {moment(selectedBooking.appointmentDate).format('DD MMM YYYY')}
                                                    </h4>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Authorization Panel */}
                                <div className="p-8 border-t border-slate-50 bg-white flex justify-end gap-5">
                                    <button
                                        onClick={() => handleAction(selectedBooking._id, 'reject')}
                                        className="px-8 py-5 border border-slate-100 text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 transition-all"
                                    >
                                        Invalidate Directive
                                    </button>
                                    <button
                                        onClick={() => handleAction(selectedBooking._id, 'confirm')}
                                        className="px-10 py-5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-2xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3"
                                    >
                                        <ShieldCheck className="h-4 w-4" />
                                        Authorize Clinical Data
                                    </button>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-20">
                                <div className="h-32 w-32 bg-slate-50 rounded-[4rem] flex items-center justify-center mb-10">
                                    <Layers size={48} className="text-slate-100" />
                                </div>
                                <h3 className="text-lg font-black text-slate-300 uppercase tracking-[0.4em]">Select Analytical Node</h3>
                                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mt-4">
                                    System pending scientific directive authorization.
                                </p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Optical Expansion Modal */}
            <AnimatePresence>
                {showFullImage && selectedBooking && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-3xl flex items-center justify-center p-8 lg:p-20"
                    >
                        <button
                            onClick={() => setShowFullImage(false)}
                            className="absolute top-10 right-10 p-6 bg-white/5 hover:bg-white/10 text-white rounded-full transition-all"
                        >
                            <X className="h-8 w-8" />
                        </button>
                        <motion.img
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            src={getImageUrl(selectedBooking.prescriptionUrl)}
                            alt="High Precision Scan"
                            className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_100px_rgba(0,0,0,0.5)] border-4 border-white/5"
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default StaffPrescriptionHandling;
