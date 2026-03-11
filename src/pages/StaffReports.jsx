import React, { useState, useEffect } from 'react';
import {
  FileText, Download, Eye, Calendar, User, TestTube,
  Clock, Printer, FileImage, X, Activity, AlertCircle,
  CheckCircle, Package, ChevronDown, ChevronRight,
  Shield, AlertTriangle, BarChart3, Send, Search,
  Filter, Layers, Microscope, Zap, TrendingUp, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Swal from 'sweetalert2';
import api from '../services/api';
import moment from 'moment';

const StaffReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [abnormalFilter, setAbnormalFilter] = useState(false);
  const [expandedTests, setExpandedTests] = useState({});
  const [publishing, setPublishing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 9;

  // ── helpers ──
  const isAbnormal = (val, rangeStr) => {
    if (!val || !rangeStr) return false;
    const parts = rangeStr.split('-');
    if (parts.length === 2 && !isNaN(val) && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parseFloat(val) < parseFloat(parts[0]) || parseFloat(val) > parseFloat(parts[1]);
    }
    return false;
  };

  const countAbnormals = (booking) => {
    let abnormals = 0;
    (booking.testResults || []).forEach(result => {
      if (result.isAbnormal) abnormals++;
    });
    return abnormals;
  };

  const getDisplayName = (booking) => {
    const packageNames = (booking.selectedPackages || []).map(p => p.packageId?.name || p.packageName).filter(Boolean);
    const directTestCount = (booking.selectedTests || []).length;
    if (packageNames.length > 0 && directTestCount > 0) {
      return packageNames.join(', ') + ` + ${directTestCount} test${directTestCount > 1 ? 's' : ''}`;
    } else if (packageNames.length > 0) {
      return packageNames.join(', ');
    }
    return `${directTestCount} Individual Test${directTestCount > 1 ? 's' : ''}`;
  };

  const getTestsList = (booking) => {
    const tests = [];
    (booking.selectedTests || []).forEach(t => tests.push(t.testName || t.testId?.name));
    (booking.selectedPackages || []).forEach(p => {
      if (p.packageId?.selectedTests) {
        p.packageId.selectedTests.forEach(st => tests.push(st.name));
      }
    });
    return [...new Set(tests)].filter(Boolean);
  };

  const isFullyVerified = (booking) => {
    if (!booking.testResults || booking.testResults.length === 0) return false;
    // Get all tests that should have results
    const expectedTestsCount = getTestsList(booking).length;
    if (booking.testResults.length < expectedTestsCount) return false;

    return booking.testResults.every(res => res.status === 'verified');
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        if (!user?.assignedLab) return;
        const response = await api.bookingAPI.getLabReports(user.assignedLab, 'all', 1, 1000);
        if (response?.success && response.data) {
          setReports(response.data);
        }
      } catch (err) {
        console.error('Error fetching reports:', err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchReports();
  }, [user]);

  useEffect(() => {
    let filtered = [...reports];
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(report =>
        `${report.userId?.firstName} ${report.userId?.lastName}`.toLowerCase().includes(lowerSearch) ||
        report.userId?.email?.toLowerCase().includes(lowerSearch) ||
        report.sampleId?.toLowerCase().includes(lowerSearch) ||
        getDisplayName(report).toLowerCase().includes(lowerSearch)
      );
    }
    if (statusFilter !== 'all') {
      if (statusFilter === 'completed') {
        // "Ready for Publish" means completed AND fully verified
        filtered = filtered.filter(r => r.status === 'completed' && isFullyVerified(r));
      } else {
        filtered = filtered.filter(r => r.status === statusFilter);
      }
    }
    if (abnormalFilter) filtered = filtered.filter(r => countAbnormals(r) > 0);

    filtered.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    setFilteredReports(filtered);
  }, [reports, searchTerm, statusFilter, abnormalFilter]);

  const handleVerifyTest = async (testId) => {
    if (!selectedReport) return;
    try {
      const result = await Swal.fire({
        title: 'Authorize Data Node?',
        text: 'Confirm that these diagnostic metrics are clinically accurate and ready for patient release.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Verify & Authorize',
        customClass: { popup: 'rounded-[3rem]' }
      });

      if (!result.isConfirmed) return;

      const res = await api.resultsAPI.verifyResult(selectedReport._id, testId);
      if (res.success) {
        Swal.fire({
          icon: 'success',
          title: 'Asset Validated',
          text: 'The diagnostic data has been authorized in the medical ledger.',
          timer: 2000,
          showConfirmButton: false,
          customClass: { popup: 'rounded-[3rem]' }
        });

        // Refresh local state
        const response = await api.bookingAPI.getLabReports(user.assignedLab, 'all', 1, 1000);
        if (response?.success) {
          const updatedReports = response.data;
          setReports(updatedReports);
          // Also update selected report to reflect change in modal
          const updatedSelected = updatedReports.find(r => r._id === selectedReport._id);
          if (updatedSelected) setSelectedReport(updatedSelected);
        }
      }
    } catch (error) {
      Swal.fire('Error', 'Verification sequence failed.', 'error');
    }
  };

  const handlePublish = async (report) => {
    const result = await Swal.fire({
      title: 'Authorize Publication?',
      text: `Commit results for ${report.userId?.firstName} to the patient portal?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#0f172a',
      confirmButtonText: 'Authorize Transmission'
    });
    if (!result.isConfirmed) return;
    try {
      setPublishing(true);
      const res = await api.bookingAPI.publishResults(report._id);
      if (res.success) {
        Swal.fire('Success', 'Diagnostic data published to patient node.', 'success');
        // refresh...
        const response = await api.bookingAPI.getLabReports(user.assignedLab, 'all', 1, 1000);
        if (response?.success) setReports(response.data);
      }
    } catch (error) {
      Swal.fire('Error', 'Publication sequence failed.', 'error');
    } finally {
      setPublishing(false);
    }
  };

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
            <span className="px-4 py-1.5 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full">
              Archive Terminal
            </span>
            <div className="h-0.5 w-16 bg-slate-200"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Diagnostic Records Database
            </span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-3">
            Report Intelligence
          </h1>
          <p className="text-xl text-slate-500 font-medium max-w-2xl">
            Comprehensive ledger of clinical findings, abnormality clusters, and verified medical assets.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 w-full lg:w-auto">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-hover:text-slate-900 transition-colors" />
            <input
              type="text"
              placeholder="Identify Subject / Batch..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-5 bg-white border border-gray-100 rounded-[2rem] shadow-sm focus:outline-none focus:ring-8 focus:ring-slate-900/5 transition-all text-xs font-black uppercase tracking-widest placeholder:text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Tactical Control Bar */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex p-1.5 bg-white rounded-[2rem] border border-gray-100 shadow-sm w-fit">
          {[
            { id: 'all', label: 'Global Ledger', icon: Layers },
            { id: 'completed', label: 'Ready for Publish', icon: CheckCircle },
            { id: 'result_published', label: 'Released', icon: Shield }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-3 px-8 py-3.5 rounded-[1.5rem] transition-all ${statusFilter === tab.id
                ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                : 'text-slate-400 hover:text-slate-900'
                }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="text-[11px] font-black uppercase tracking-[0.15em]">{tab.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={() => setAbnormalFilter(!abnormalFilter)}
          className={`flex items-center gap-3 px-8 py-5 rounded-[2rem] border transition-all ${abnormalFilter
            ? 'bg-rose-50 border-rose-100 text-rose-600 shadow-lg shadow-rose-100'
            : 'bg-white border-gray-100 text-slate-400 hover:bg-slate-50'
            }`}
        >
          <AlertTriangle className={`h-4 w-4 ${abnormalFilter ? 'animate-pulse' : ''}`} />
          <span className="text-[11px] font-black uppercase tracking-[0.15em]">Abnormality Filter</span>
        </button>
      </div>

      {/* Diagnostic Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-[3rem] p-10 h-80 animate-pulse border border-gray-100" />
          ))
        ) : filteredReports.length === 0 ? (
          <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white rounded-[4rem] border border-gray-100 shadow-sm">
            <Microscope className="h-16 w-16 text-slate-100 mb-6" />
            <p className="text-xs font-black text-slate-300 uppercase tracking-[0.4em]">No matching records in current archive</p>
          </div>
        ) : filteredReports.map((report, idx) => {
          const abnormals = countAbnormals(report);
          const isPublished = report.status === 'result_published';

          return (
            <motion.div
              key={report._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileHover={{ y: -8 }}
              className={`group relative bg-white rounded-[3.5rem] p-10 shadow-2xl shadow-slate-100 border transition-all overflow-hidden ${abnormals > 0 ? 'border-rose-100' : 'border-slate-50'
                }`}
            >
              {/* Status Overlay */}
              <div className="absolute top-0 right-0 p-8">
                {isPublished ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100">
                    <Shield className="h-3 w-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Released</span>
                  </div>
                ) : abnormals > 0 ? (
                  <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 rounded-full border border-rose-100 animate-pulse">
                    <AlertTriangle className="h-3 w-3" />
                    <span className="text-[9px] font-black uppercase tracking-widest">{abnormals} Flags</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 text-slate-400 rounded-full border border-slate-100">
                    <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Locked</span>
                  </div>
                )}
              </div>

              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-8">
                  <div className={`h-16 w-16 rounded-[1.5rem] flex items-center justify-center mb-8 shadow-inner transition-transform group-hover:scale-110 ${abnormals > 0 ? 'bg-rose-50 text-rose-600' : 'bg-slate-900 text-white'
                    }`}>
                    <FileText className="h-7 w-7" />
                  </div>
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Subject Ledger</p>
                  <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-tight mb-4">
                    {report.userId?.firstName} {report.userId?.lastName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{moment(report.updatedAt).format('DD MMM YYYY')}</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-lg">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{report.appointmentTime}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 mb-10 flex-1">
                  {/* Sample ID Identification Block */}
                  {report.sampleId && (
                    <div className="p-5 bg-slate-900 text-white rounded-[1.8rem] shadow-xl shadow-slate-200 flex justify-between items-center group/sample transition-all hover:bg-slate-800">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.3em] mb-1">Physical Node ID</span>
                        <span className="text-xs font-black tracking-[0.2em]">{report.sampleId}</span>
                      </div>
                      <Layers className="h-4 w-4 text-slate-500 group-hover/sample:text-white transition-colors" />
                    </div>
                  )}

                  <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Diagnostic Bundle</p>
                        <p className="text-xs font-black text-slate-700 uppercase tracking-tight">
                          {getDisplayName(report)}
                        </p>
                      </div>
                      <div className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${isFullyVerified(report) ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                        {isFullyVerified(report) ? 'Verified' : 'In Progress'}
                      </div>
                    </div>

                    {/* Test List Visualization */}
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/50">
                      {getTestsList(report).slice(0, 3).map((test, tidx) => (
                        <span key={tidx} className="px-3 py-1 bg-white border border-slate-100 text-[8px] font-bold text-slate-500 uppercase tracking-widest rounded-full">
                          {test}
                        </span>
                      ))}
                      {getTestsList(report).length > 3 && (
                        <span className="px-3 py-1 bg-slate-100 text-[8px] font-bold text-slate-400 uppercase tracking-widest rounded-full">
                          +{getTestsList(report).length - 3} More
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedReport(report);
                      setShowDetailsModal(true);
                    }}
                    className="flex-1 py-4 bg-slate-50 hover:bg-slate-900 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-slate-100 hover:border-slate-900 flex items-center justify-center gap-2"
                  >
                    <Eye className="h-4 w-4" /> Reveal details
                  </button>
                  {!isPublished && report.status === 'completed' && (
                    <button
                      onClick={() => handlePublish(report)}
                      disabled={publishing}
                      className="px-6 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-100 hover:scale-105 active:scale-95 transition-all"
                    >
                      Publish
                    </button>
                  )}
                  {isPublished && report.reportFile && (
                    <button
                      className="px-6 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-50 hover:scale-105 active:scale-95 transition-all"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
      {/* Clinical Review Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 lg:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailsModal(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xl"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="relative w-full max-w-4xl bg-white rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-6">
                  <div className="h-20 w-20 rounded-[2rem] bg-slate-900 text-white flex items-center justify-center shadow-2xl shadow-slate-200">
                    <User className="h-8 w-8" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">Clinical Subject Intelligence</p>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase">
                      {selectedReport.userId?.firstName} {selectedReport.userId?.lastName}
                    </h2>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="h-14 w-14 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-10">
                  <div className="lg:col-span-2 space-y-6">
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.3em] flex items-center gap-3">
                      <TestTube className="h-4 w-4" /> Diagnostic Asset Ledger
                    </h3>

                    <div className="space-y-4">
                      {selectedReport.testResults && selectedReport.testResults.length > 0 ? (
                        selectedReport.testResults.map((result, ridx) => (
                          <div key={ridx} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 group transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-100">
                            <div className="flex justify-between items-start mb-6">
                              <div>
                                <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-1">
                                  {result.testId?.name || "Test Result"}
                                </h4>
                                <div className="flex items-center gap-3">
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{moment(result.submittedAt).format('DD MMM, HH:mm')}</span>
                                  <div className={`h-1.5 w-1.5 rounded-full ${result.status === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{result.status}</span>
                                </div>
                              </div>
                              {result.isAbnormal && (
                                <div className="px-4 py-2 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-100 animate-pulse">
                                  Abnormality Detected
                                </div>
                              )}
                              {result.status !== 'verified' && (
                                <button
                                  onClick={() => handleVerifyTest(result.testId?._id || result.testId)}
                                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
                                >
                                  <Shield className="h-3 w-3" /> Authorize Results
                                </button>
                              )}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {result.values?.map((v, vidx) => (
                                <div key={vidx} className="p-4 bg-white rounded-2xl border border-slate-50 group-hover:border-slate-100 transition-colors">
                                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{v.label}</p>
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-sm font-black text-slate-900">{v.value}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{v.unit}</span>
                                  </div>
                                  <p className="text-[8px] font-medium text-slate-300 mt-1 uppercase">Range: {v.referenceRange}</p>
                                </div>
                              ))}
                            </div>

                            {result.findings && (
                              <div className="mt-6 pt-6 border-t border-slate-200/50">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Findings / Interpretation</p>
                                <p className="text-sm font-medium text-slate-600 italic">"{result.findings}"</p>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-20 flex flex-col items-center justify-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                          <AlertCircle className="h-10 w-10 text-slate-200 mb-4" />
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest text-center">Diagnostic results have not been <br />committed to this ledger yet.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="p-8 bg-slate-900 text-white rounded-[3rem] shadow-2xl shadow-slate-200">
                      <div className="flex items-center gap-3 mb-6">
                        <Activity className="h-5 w-5 text-emerald-400" />
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Core Synchronization</h4>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Node Assignment</p>
                          <p className="text-sm font-black uppercase tracking-widest truncate">{selectedReport.labId?.name}</p>
                        </div>
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Physical Sample Node</p>
                          <div className="flex items-center gap-3 text-emerald-400">
                            <span className="text-lg font-black tracking-[0.2em]">{selectedReport.sampleId || 'N/A'}</span>
                            <RefreshCw className="h-4 w-4 animate-spin-slow" />
                          </div>
                        </div>
                        <div className="pt-6 border-t border-slate-800">
                          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Verification Integrity</p>
                          <div className="flex items-center gap-4">
                            <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 transition-all duration-1000"
                                style={{ width: `${(selectedReport.testResults?.filter(r => r.status === 'verified').length / getTestsList(selectedReport).length) * 100}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-black text-emerald-400">
                              {Math.round((selectedReport.testResults?.filter(r => r.status === 'verified').length / getTestsList(selectedReport).length) * 100) || 0}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-8 bg-emerald-50 border border-emerald-100 rounded-[3rem]">
                      <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-4">Patient Portal Status</h4>
                      <p className="text-xs font-semibold text-emerald-600 leading-relaxed">
                        {selectedReport.status === 'result_published'
                          ? "This report has been fully synchronized and released to the patient portal. Secure downlink available."
                          : "Verification sequence in progress. Once 100% integrity is achieved, the record can be released to the patient node."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-10 border-t border-slate-50 bg-slate-50/30 flex justify-end gap-5">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
                >
                  Close Terminal
                </button>
                {selectedReport.status !== 'result_published' && selectedReport.status === 'completed' && isFullyVerified(selectedReport) && (
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      handlePublish(selectedReport);
                    }}
                    className="px-12 py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-xl shadow-slate-200 hover:scale-105 active:scale-95 transition-all"
                  >
                    Authorize Publication
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default StaffReports;
