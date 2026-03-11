import React, { useState, useEffect } from 'react';
import {
  Calendar, Clock, User, Phone, MapPin, Filter,
  Search, Eye, TestTube, Package, ChevronLeft,
  ChevronRight, ArrowRight, ShieldCheck, Zap,
  Activity, Search as SearchIcon, CalendarDays,
  Layers, CreditCard, CheckCircle2, History
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import moment from 'moment';

const LocalAdminBookings = ({ assignedLab }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const limit = 8;

  useEffect(() => {
    if (assignedLab && assignedLab._id) {
      fetchBookings();
    }
  }, [assignedLab, filterStatus, currentPage, dateFilter, startDate, endDate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.localAdminAPI.getLabBookings(assignedLab._id, 'all', 1, 1000);
      if (response.success) {
        let allBookings = response.data || [];
        if (filterStatus !== 'all') allBookings = allBookings.filter(b => b.status === filterStatus);
        allBookings = applyDateFilter(allBookings);
        allBookings.sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

        const startIndex = (currentPage - 1) * limit;
        setBookings(allBookings.slice(startIndex, startIndex + limit));
        setTotalPages(Math.ceil(allBookings.length / limit));
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyDateFilter = (bookings) => {
    const today = moment().startOf('day');
    return bookings.filter(b => {
      const appDate = moment(b.appointmentDate);
      switch (dateFilter) {
        case 'today': return appDate.isSame(today, 'day');
        case 'week': return appDate.isAfter(moment().subtract(7, 'days'));
        case 'month': return appDate.isAfter(moment().subtract(30, 'days'));
        case 'custom':
          if (startDate && endDate) return appDate.isBetween(moment(startDate), moment(endDate), 'day', '[]');
          return true;
        default: return true;
      }
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      confirmed: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Validated' },
      sample_collected: { bg: 'bg-indigo-50', text: 'text-indigo-600', label: 'Sample Processed' },
      result_published: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Published' },
      cancelled: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Terminated' }
    };
    return configs[status] || { bg: 'bg-slate-50', text: 'text-slate-400', label: status };
  };

  const filteredBookings = bookings.filter(b =>
    (b.userId?.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.userId?.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (b.userId?.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && currentPage === 1) {
    return (
      <div className="p-20 flex flex-col items-center justify-center animate-pulse">
        <History className="h-12 w-12 text-slate-100 mb-6" />
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Retrieving Operation Ledger...</p>
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
          <div className="flex items-center space-x-2 mb-4">
            <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-xl shadow-slate-200">
              Operation Ledger Terminal
            </span>
            <div className="h-0.5 w-16 bg-slate-200"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Unit: Logistics Node Alpha
            </span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-3 text-balance">
            Clinical <span className="text-indigo-600">Logistics</span> Flow
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl">
            Real-time monitoring and historical analysis of diagnostic appointment vectors.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-50 shadow-xl shadow-slate-100 flex items-center gap-4">
            <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <CalendarDays size={20} />
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Temporal Window</p>
              <p className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{moment().format('DD MMM YYYY')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced Filtration Node */}
      <div className="bg-white rounded-[3.5rem] p-8 border border-slate-50 shadow-2xl shadow-slate-100">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-4 relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-hover:text-slate-900 transition-colors" />
            <input
              type="text"
              placeholder="Identify Subject Vector..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-16 pr-8 py-5 bg-slate-50 border border-transparent rounded-[1.8rem] focus:bg-white focus:ring-8 focus:ring-slate-900/5 transition-all text-[11px] font-black uppercase tracking-widest placeholder:text-slate-200 shadow-inner"
            />
          </div>

          <div className="lg:col-span-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-8 py-5 bg-slate-50 border border-transparent rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest focus:bg-white appearance-none cursor-pointer"
            >
              <option value="all">Global Status</option>
              <option value="confirmed">Validated</option>
              <option value="sample_collected">Processed</option>
              <option value="result_published">Published</option>
              <option value="cancelled">Terminated</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-8 py-5 bg-slate-50 border border-transparent rounded-[1.8rem] text-[10px] font-black uppercase tracking-widest focus:bg-white appearance-none cursor-pointer"
            >
              <option value="all">Temporal Spectrum</option>
              <option value="today">Today</option>
              <option value="week">7D Window</option>
              <option value="month">30D Window</option>
              <option value="custom">Manual Override</option>
            </select>
          </div>

          {dateFilter === 'custom' && (
            <div className="lg:col-span-4 flex gap-4">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="flex-1 px-6 py-5 bg-slate-50 border border-transparent rounded-2xl text-[10px] font-black uppercase tracking-widest focus:bg-white appearance-none cursor-pointer"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="flex-1 px-6 py-5 bg-slate-50 border border-transparent rounded-2xl text-[10px] font-black uppercase tracking-widest focus:bg-white appearance-none cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* Logistics Ledger */}
      <div className="bg-white rounded-[3.5rem] border border-slate-50 shadow-2xl shadow-slate-100 overflow-hidden">
        <div className="p-8 lg:p-12">
          {filteredBookings.length === 0 ? (
            <div className="py-32 flex flex-col items-center opacity-30">
              <Layers size={64} className="mb-6" />
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">Archive Sequence Null</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredBookings.map((booking, idx) => {
                  const status = getStatusConfig(booking.status);
                  return (
                    <motion.div
                      key={booking._id}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group bg-white p-8 rounded-[3rem] border border-slate-50 hover:border-slate-100 hover:shadow-2xl hover:shadow-slate-100 transition-all flex flex-col lg:flex-row items-center gap-8 relative overflow-hidden"
                    >
                      {/* Patient ID Node */}
                      <div className="flex items-center gap-6 flex-1 min-w-0">
                        <div className="h-20 w-20 bg-slate-900 rounded-[2rem] flex items-center justify-center text-white italic font-black text-2xl shadow-xl shadow-slate-100 group-hover:scale-110 transition-transform">
                          {booking.userId?.firstName?.[0]}
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter truncate leading-none mb-2">
                            {booking.userId?.firstName} {booking.userId?.lastName}
                          </h4>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{booking.userId?.email}</span>
                          </div>
                        </div>
                      </div>

                      {/* Appointment Vector */}
                      <div className="flex items-center gap-10 px-10 border-x border-slate-50 h-full">
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3 text-slate-400">
                            <Calendar size={14} className="text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{moment(booking.appointmentDate).format('DD MMM YYYY')}</span>
                          </div>
                          <div className="flex items-center gap-3 text-slate-400">
                            <Clock size={14} className="text-indigo-400" />
                            <span className="text-[10px] font-black uppercase tracking-widest">{booking.appointmentTime}</span>
                          </div>
                        </div>
                        <div className="h-10 w-px bg-slate-50" />
                        <div className="flex flex-col gap-1">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Operation Assets</p>
                          <div className="flex gap-2">
                            {booking.selectedTests?.length > 0 && (
                              <div className="px-3 py-1 bg-slate-50 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500">
                                {booking.selectedTests.length} Units
                              </div>
                            )}
                            {booking.selectedPackages?.length > 0 && (
                              <div className="px-3 py-1 bg-indigo-50 rounded-lg text-[9px] font-black uppercase tracking-widest text-indigo-600">
                                {booking.selectedPackages.length} Bundles
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Status Matrix */}
                      <div className="flex items-center justify-between lg:justify-end gap-10 min-w-[280px]">
                        <div className="flex flex-col items-end">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Transmission Value</p>
                          <h5 className="text-2xl font-black text-slate-900 tracking-tighter leading-none">₹{booking.totalAmount.toLocaleString()}</h5>
                        </div>
                        <div className={`px-6 py-3 rounded-2xl ${status.bg} ${status.text} text-[10px] font-black uppercase tracking-widest border border-slate-100 shadow-sm`}>
                          {status.label}
                        </div>
                      </div>

                      {/* Tactical Action */}
                      <div className="absolute top-8 right-8 lg:static">
                        <button className="h-14 w-14 bg-slate-50 hover:bg-slate-900 text-slate-300 hover:text-white rounded-[1.2rem] shadow-sm flex items-center justify-center transition-all hover:scale-110 active:scale-95 group/btn">
                          <Eye size={24} className="group-hover/btn:scale-110 transition-all" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Tactical Pagination */}
        {totalPages > 1 && (
          <div className="px-12 py-10 bg-slate-50/30 border-t border-slate-50 flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
              Node Group {currentPage} / {totalPages}
            </span>
            <div className="flex gap-4">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-8 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all disabled:opacity-30 flex items-center gap-2"
              >
                <ChevronLeft size={16} /> Prev Node
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-8 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all disabled:opacity-30 flex items-center gap-2"
              >
                Next Node <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default LocalAdminBookings;