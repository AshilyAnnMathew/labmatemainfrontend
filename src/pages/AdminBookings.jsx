import React, { useState, useEffect, Fragment } from 'react';
import {
  Calendar, Clock, User, CreditCard, CheckCircle,
  AlertCircle, Eye, MapPin, Phone, Mail, TestTube,
  Package, DollarSign, Search, Filter, Download,
  Loader, Building2, ChevronDown, ChevronUp, X,
  Edit, Trash2, ArrowRight, ShieldCheck, Zap,
  Activity, Layers, History, Globe, CheckCircle2,
  Fingerprint, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import api from '../services/api';
import moment from 'moment';

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLab, setFilterLab] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [expandedBookings, setExpandedBookings] = useState(new Set());
  const [labs, setLabs] = useState([]);
  const limit = 10;

  useEffect(() => {
    fetchBookings();
  }, [currentPage, filterStatus, filterLab, filterDate, searchTerm]);

  useEffect(() => {
    fetchLabs();
  }, []);

  const fetchLabs = async () => {
    try {
      const response = await api.labAPI.getLabs();
      setLabs(response.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: currentPage, limit });
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (filterLab !== 'all') params.append('labId', filterLab);
      if (filterDate) params.append('date', filterDate);
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.bookingAPI.getAdminBookings(params.toString());
      if (response.success) {
        setBookings(response.data || []);
        setTotalPages(response.pagination?.pages || 1);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBooking = async (booking) => {
    const result = await Swal.fire({
      title: 'Decommission Node?',
      text: `Permanent removal of booking ${booking._id} from the global ledger.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      confirmButtonText: 'Yes, Decommission',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        await api.bookingAPI.deleteBooking(booking._id);
        fetchBookings();
        Swal.fire('Matrix Synchronized', 'Node decommissioned successfully.', 'success');
      } catch (err) {
        Swal.fire('Termination Failed', err.message, 'error');
      }
    }
  };

  const toggleExpansion = (id) => {
    const next = new Set(expandedBookings);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpandedBookings(next);
  };

  const getStatusConfig = (status) => {
    const configs = {
      confirmed: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Validated' },
      pending: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Awaiting Action' },
      cancelled: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Terminated' },
      completed: { bg: 'bg-indigo-50', text: 'text-indigo-600', label: 'Fulfillment Complete' },
      sample_collected: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Bio-Asset Collected' }
    };
    return configs[status] || { bg: 'bg-slate-50', text: 'text-slate-400', label: status };
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-10"
    >
      {/* Logistics Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl shadow-slate-200">
              Global Logistics Ledger
            </span>
            <div className="h-0.5 w-16 bg-slate-200"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Inter-Facility Clinical Traffic
            </span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-3 text-balance">
            Ecosystem <span className="text-indigo-600">Fulfillment</span> Flow
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl">
            Real-time monitoring and tactical oversight of all clinical vectors across the LabMate360 grid.
          </p>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-xl shadow-slate-100 flex items-center gap-6">
          <div className="flex flex-col items-end">
            <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Network Volume</p>
            <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{bookings.length} Current Load</p>
          </div>
          <div className="h-10 w-px bg-slate-100" />
          <Activity className="text-indigo-500 animate-pulse" size={24} />
        </div>
      </div>

      {/* Advanced Filtration Matrix */}
      <div className="bg-white rounded-[3.5rem] p-8 border border-slate-50 shadow-2xl shadow-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-hover:text-slate-900 transition-colors" />
            <input
              type="text"
              placeholder="Identify Vector..."
              className="w-full pl-14 pr-4 py-5 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all text-[11px] font-black uppercase tracking-widest shadow-inner placeholder:text-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="px-6 py-5 bg-slate-50 border border-transparent rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer outline-none"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Fulfillment Status</option>
            <option value="pending">Awaiting Action</option>
            <option value="confirmed">Validated</option>
            <option value="sample_collected">Processed</option>
            <option value="completed">Fulfilled</option>
          </select>
          <select
            className="px-6 py-5 bg-slate-50 border border-transparent rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer outline-none"
            value={filterLab}
            onChange={(e) => setFilterLab(e.target.value)}
          >
            <option value="all">Facility Filter</option>
            {labs.map(l => <option key={l._id} value={l._id}>{l.name}</option>)}
          </select>
          <input
            type="date"
            className="px-6 py-5 bg-slate-50 border border-transparent rounded-2xl text-[10px] font-black uppercase tracking-widest appearance-none outline-none"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />
          <button
            onClick={() => fetchBookings()}
            className="bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-3"
          >
            <Zap size={14} /> Synchronize Ledger
          </button>
        </div>
      </div>

      {/* Grid Ledger */}
      <div className="bg-white rounded-[4rem] border border-slate-50 shadow-2xl shadow-slate-100 overflow-hidden mb-32">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-300 font-bold">
                <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em]">Clinical Subject</th>
                <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em]">Temporal Node</th>
                <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em]">Assets</th>
                <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em]">Transaction</th>
                <th className="px-10 py-8 text-left text-[10px] font-black uppercase tracking-[0.2em]">Status</th>
                <th className="px-10 py-8 text-right text-[10px] font-black uppercase tracking-[0.2em]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-32 text-center animate-pulse">
                    <History size={48} className="mx-auto mb-6 text-slate-200" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Retrieving Ledger Segments...</p>
                  </td>
                </tr>
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-32 text-center opacity-30">
                    <AlertCircle size={48} className="mx-auto mb-6" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em]">Grid Archive Null</p>
                  </td>
                </tr>
              ) : bookings.map((booking) => {
                const status = getStatusConfig(booking.status);
                return (
                  <Fragment key={booking._id}>
                    <tr className="hover:bg-slate-50/50 group transition-colors">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white italic font-black text-lg group-hover:scale-110 transition-transform">
                            {booking.userId?.firstName?.[0]}
                          </div>
                          <div>
                            <h5 className="text-base font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">{booking.userId?.firstName} {booking.userId?.lastName}</h5>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              <Building2 size={12} className="text-indigo-400" /> {booking.labId?.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-[10px] font-black text-slate-900 uppercase tracking-tight">
                            <Calendar size={12} className="text-indigo-400" /> {moment(booking.appointmentDate).format('DD MMM YYYY')}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            <Clock size={12} className="text-indigo-400" /> {booking.appointmentTime}
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-wrap gap-2">
                          {(booking.selectedTests?.length || 0) > 0 && (
                            <div className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                              {booking.selectedTests.length} Units
                            </div>
                          )}
                          {(booking.selectedPackages?.length || 0) > 0 && (
                            <div className="px-3 py-1 bg-indigo-50 rounded-lg text-[9px] font-black uppercase tracking-widest text-indigo-600 shadow-sm">
                              {booking.selectedPackages.length} Bundles
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        <div className="text-lg font-black text-slate-900 tracking-tighter leading-none mb-1">₹{booking.totalAmount?.toLocaleString()}</div>
                        <span className={`text-[8px] font-black uppercase tracking-widest italic ${booking.paymentStatus === 'completed' ? 'text-emerald-500' : 'text-amber-500'}`}>
                          {booking.paymentStatus || 'Pending Sync'}
                        </span>
                      </td>
                      <td className="px-10 py-8">
                        <div className={`px-5 py-2 rounded-xl border border-slate-100 shadow-sm ${status.bg} ${status.text} text-[9px] font-black uppercase tracking-widest inline-block`}>
                          {status.label}
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => toggleExpansion(booking._id)}
                            className="h-12 w-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center text-slate-300 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                          >
                            {expandedBookings.has(booking._id) ? <ChevronUp size={20} /> : <Eye size={20} />}
                          </button>
                        </div>
                      </td>
                    </tr>

                    <AnimatePresence>
                      {expandedBookings.has(booking._id) && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-slate-50/30"
                        >
                          <td colSpan="6" className="p-10">
                            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl grid grid-cols-1 lg:grid-cols-3 gap-10 relative overflow-hidden">
                              <div className="space-y-8 relative z-10">
                                <div className="flex items-center gap-3">
                                  <Fingerprint size={16} className="text-indigo-400" />
                                  <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Patient Intelligence</h6>
                                </div>
                                <div className="space-y-4 font-bold">
                                  <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Authorized Contact</span>
                                    <span className="text-sm text-slate-600">{booking.userId?.phone || 'No Contact'}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Transmission Vector</span>
                                    <span className="text-sm text-slate-600">{booking.userId?.email || 'No Uplink'}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-8 relative z-10">
                                <div className="flex items-center gap-3">
                                  <Building2 size={16} className="text-indigo-400" />
                                  <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Fulfillment Node</h6>
                                </div>
                                <div className="space-y-4">
                                  <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Regional Branch</span>
                                    <span className="text-sm font-black text-indigo-600 uppercase tracking-tight">{booking.labId?.name}</span>
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Node Status</span>
                                    <span className="text-xs font-bold text-slate-500 line-clamp-2">Clinical logistics node operating at peak spectral efficiency.</span>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-8 relative z-10">
                                <div className="flex items-center gap-3">
                                  <ShieldCheck size={16} className="text-indigo-400" />
                                  <h6 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Tactical Control</h6>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                  <button onClick={() => Swal.fire('Asset Report', 'Telemetry report generation protocol initialized.', 'info')} className="px-6 py-4 bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all">
                                    Report Vector
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBooking(booking)}
                                    className="px-6 py-4 bg-rose-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all"
                                  >
                                    Squelch Node
                                  </button>
                                </div>
                              </div>
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.02] pointer-events-none">
                                <Radio size={200} />
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Tactical Pagination */}
        {totalPages > 1 && (
          <div className="px-12 py-10 bg-slate-50/50 border-t border-slate-50 flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
              Neural Ledger Page {currentPage} / {totalPages}
            </span>
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-8 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all disabled:opacity-30 flex items-center gap-2"
              >
                Prev Matrix
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-8 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all disabled:opacity-30 flex items-center gap-2"
              >
                Next Matrix
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminBookings;
