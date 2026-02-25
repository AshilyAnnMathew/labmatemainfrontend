import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Eye,
  Calendar,
  User,
  TestTube,
  Clock,
  Printer,
  FileImage,
  X,
  Activity,
  AlertCircle,
  CheckCircle,
  Package,
  ChevronDown,
  ChevronRight,
  Shield,
  AlertTriangle,
  BarChart3,
  Send
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import api from '../services/api';
import DashboardTable from '../components/common/DashboardTable';
import StatusBadge from '../components/common/StatusBadge';

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
    let total = 0;
    (booking.testResults || []).forEach(result => {
      (result.values || []).forEach(v => {
        total++;
        if (isAbnormal(v.value, v.referenceRange)) abnormals++;
      });
    });
    return { abnormals, total };
  };

  const getAllTestsForBooking = (booking) => {
    const tests = [];
    (booking.selectedTests || []).forEach(t => {
      tests.push({
        id: t.testId?._id || t.testId,
        name: t.testId?.name || t.testName,
        source: 'direct',
        sourceName: 'Individual Tests'
      });
    });
    (booking.selectedPackages || []).forEach(pkg => {
      (pkg.packageId?.selectedTests || []).forEach(test => {
        tests.push({
          id: test._id,
          name: test.name,
          source: 'package',
          sourceName: pkg.packageId?.name || pkg.packageName
        });
      });
    });
    return tests;
  };

  const getTestResult = (booking, testId) => {
    return (booking.testResults || []).find(r =>
      (r.testId?._id || r.testId)?.toString() === testId?.toString()
    ) || null;
  };

  const getPackageProgress = (booking) => {
    const allTests = getAllTestsForBooking(booking);
    const total = allTests.length;
    const verified = allTests.filter(t => {
      const r = getTestResult(booking, t.id);
      return r?.status === 'verified';
    }).length;
    const completed = allTests.filter(t => {
      const r = getTestResult(booking, t.id);
      return r?.status === 'completed' || r?.status === 'verified';
    }).length;
    return { total, verified, completed, percent: total > 0 ? Math.round((verified / total) * 100) : 0 };
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

  // ── data ──

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        if (!user?.assignedLab) return;
        const response = await api.bookingAPI.getLabReports(user.assignedLab, 'all', 1, 1000);
        if (response?.success && response.data) {
          setReports(response.data);
          setFilteredReports(response.data);
        } else {
          setReports([]);
          setFilteredReports([]);
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
        report.userId?.firstName?.toLowerCase().includes(lowerSearch) ||
        report.userId?.lastName?.toLowerCase().includes(lowerSearch) ||
        report.userId?.email?.toLowerCase().includes(lowerSearch) ||
        report._id?.toLowerCase().includes(lowerSearch) ||
        report.samples?.[0]?.sampleId?.toLowerCase().includes(lowerSearch) ||
        getDisplayName(report).toLowerCase().includes(lowerSearch)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(report => report.status === statusFilter);
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate = new Date();
      switch (dateFilter) {
        case 'today': startDate.setHours(0, 0, 0, 0); break;
        case 'week': startDate.setDate(now.getDate() - 7); break;
        case 'month': startDate.setDate(now.getDate() - 30); break;
      }
      filtered = filtered.filter(report =>
        new Date(report.reportUploadDate || report.updatedAt) >= startDate
      );
    }

    if (abnormalFilter) {
      filtered = filtered.filter(report => countAbnormals(report).abnormals > 0);
    }

    setFilteredReports(filtered);
  }, [reports, searchTerm, statusFilter, dateFilter, abnormalFilter]);

  const viewReportDetails = (report) => {
    setSelectedReport(report);
    setExpandedTests({});
    setShowDetailsModal(true);
  };

  const downloadReport = async (report) => {
    try {
      if (report.reportFile) {
        const blob = await api.bookingAPI.downloadReport(report._id);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report-${report._id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        alert('No PDF report file available');
      }
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Failed to download report.');
    }
  };

  const printReport = async (report) => {
    try {
      if (report.reportFile) {
        const blob = await api.bookingAPI.downloadReport(report._id);
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else {
        alert('No PDF report file available to print');
      }
    } catch (error) {
      console.error('Error printing report:', error);
      alert('Failed to print report.');
    }
  };

  const toggleTestExpand = (testId) => {
    setExpandedTests(prev => ({ ...prev, [testId]: !prev[testId] }));
  };

  const handlePublish = async (report) => {
    if (!confirm(`Publish results for ${report.userId?.firstName} ${report.userId?.lastName} to the patient? They will be able to view and download their results.`)) return;
    try {
      setPublishing(true);
      const res = await api.bookingAPI.publishResults(report._id);
      if (res.success) {
        alert('Results published to patient successfully!');
        // Refresh reports
        const response = await api.bookingAPI.getLabReports(user.assignedLab, 'all', 1, 1000);
        if (response?.success && response.data) {
          setReports(response.data);
        }
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setPublishing(false);
    }
  };

  // ── progress bar ──
  const ProgressBar = ({ progress, size = 'sm' }) => {
    const h = size === 'sm' ? 'h-1.5' : 'h-2.5';
    const color = progress.percent === 100 ? 'bg-emerald-500' : progress.percent > 0 ? 'bg-amber-500' : 'bg-gray-300';
    return (
      <div className="w-full">
        <div className={`w-full bg-gray-200 rounded-full ${h} overflow-hidden`}>
          <div className={`${h} rounded-full transition-all duration-500 ${color}`} style={{ width: `${progress.percent}%` }} />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[10px] text-gray-500">{progress.verified}/{progress.total} verified</span>
          <span className="text-[10px] font-medium text-gray-700">{progress.percent}%</span>
        </div>
      </div>
    );
  };

  // ── table columns ──
  const columns = [
    {
      header: 'Patient',
      accessor: 'userId',
      render: (row) => (
        <div>
          <Link
            to={`/staff/patient-history/${row.userId?._id}`}
            className="font-medium text-primary-700 hover:text-primary-900 hover:underline"
          >
            {row.userId?.firstName} {row.userId?.lastName}
          </Link>
          <div className="text-xs text-gray-500">{row.userId?.email}</div>
        </div>
      )
    },
    {
      header: 'Package / Tests',
      accessor: 'displayName',
      render: (row) => {
        const displayName = getDisplayName(row);
        const progress = getPackageProgress(row);
        return (
          <div>
            <div className="flex items-center text-sm font-medium text-gray-900">
              <Package className="h-3.5 w-3.5 mr-1.5 text-primary-600 flex-shrink-0" />
              <span className="truncate max-w-[180px]">{displayName}</span>
            </div>
            <div className="mt-1 w-24">
              <ProgressBar progress={progress} />
            </div>
          </div>
        );
      }
    },
    {
      header: 'Sample ID',
      accessor: 'sampleId',
      render: (row) => {
        const sampleId = row.samples?.[0]?.sampleId;
        return sampleId
          ? <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">{sampleId}</span>
          : <span className="text-xs text-gray-400">—</span>;
      }
    },
    {
      header: 'Date',
      accessor: 'appointmentDate',
      render: (row) => (
        <div className="text-sm text-gray-600">
          <div className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {new Date(row.appointmentDate).toLocaleDateString()}</div>
          <div className="flex items-center mt-0.5"><Clock className="h-3 w-3 mr-1" /> {row.appointmentTime}</div>
        </div>
      )
    },
    {
      header: 'Flags',
      accessor: 'flags',
      render: (row) => {
        const { abnormals, total } = countAbnormals(row);
        if (abnormals > 0) {
          return (
            <span className="flex items-center text-xs font-semibold text-red-700 bg-red-50 border border-red-200 px-2 py-1 rounded-full">
              <AlertTriangle className="h-3 w-3 mr-1" /> {abnormals}
            </span>
          );
        }
        return <span className="text-xs text-emerald-600 font-medium">Normal</span>;
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => viewReportDetails(row)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md" title="View Details">
            <Eye className="h-4 w-4" />
          </button>
          {row.status === 'completed' && (
            <button
              onClick={() => handlePublish(row)}
              disabled={publishing}
              className="px-2.5 py-1 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-md flex items-center gap-1 shadow-sm disabled:opacity-50 transition-colors"
              title="Publish to Patient"
            >
              <Send className="h-3.5 w-3.5" />
              Publish
            </button>
          )}
          {row.status === 'result_published' && (
            <span className="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded-md border border-emerald-200 flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5" />
              Published
            </span>
          )}
          {row.reportFile && (
            <>
              <button onClick={() => downloadReport(row)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md" title="Download">
                <Download className="h-4 w-4" />
              </button>
              <button onClick={() => printReport(row)} className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-md" title="Print">
                <Printer className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  // ── filters ──
  const Filters = () => (
    <div className="flex gap-2 flex-wrap">
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="border-gray-200 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="all">All Status</option>
        <option value="partially_completed">Partially Completed</option>
        <option value="result_published">Results Published</option>
        <option value="completed">Completed</option>
      </select>
      <select
        value={dateFilter}
        onChange={(e) => setDateFilter(e.target.value)}
        className="border-gray-200 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="all">All Dates</option>
        <option value="today">Today</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
      </select>
      <button
        onClick={() => setAbnormalFilter(!abnormalFilter)}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium border flex items-center gap-1.5 transition-colors ${abnormalFilter
          ? 'bg-red-50 text-red-700 border-red-300'
          : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
          }`}
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        Abnormal Only
      </button>
    </div>
  );

  // ── vitals for modal ──
  const [patientVitals, setPatientVitals] = useState([]);
  useEffect(() => {
    const fetchVitals = async () => {
      if (selectedReport && selectedReport.userId) {
        try {
          const userId = selectedReport.userId._id || selectedReport.userId;
          const response = await api.vitalsAPI.getPatientVitals(userId);
          if (response.success) setPatientVitals(response.data);
        } catch (error) {
          setPatientVitals([]);
        }
      } else {
        setPatientVitals([]);
      }
    };
    if (showDetailsModal && selectedReport) fetchVitals();
  }, [showDetailsModal, selectedReport]);

  // ── render ──
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">View Reports</h1>
        <p className="text-sm text-gray-500">Access and manage patient test reports with package-level details.</p>
      </div>

      <DashboardTable
        data={filteredReports}
        columns={columns}
        loading={loading}
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        searchPlaceholder="Search by patient, package, or sample ID..."
        filters={<Filters />}
        emptyMessage="No reports found"
      />

      {/* ── Report Details Modal ── */}
      {showDetailsModal && selectedReport && (() => {
        const allTests = getAllTestsForBooking(selectedReport);
        const progress = getPackageProgress(selectedReport);
        const { abnormals, total: totalParams } = countAbnormals(selectedReport);
        const displayName = getDisplayName(selectedReport);

        // Group tests by source
        const grouped = {};
        allTests.forEach(test => {
          if (!grouped[test.sourceName]) grouped[test.sourceName] = [];
          grouped[test.sourceName].push(test);
        });

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

              {/* Header */}
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{displayName}</h3>
                  <p className="text-sm text-gray-500">
                    {selectedReport.userId?.firstName} {selectedReport.userId?.lastName}
                    {' • '}Sample: <span className="font-mono">{selectedReport.samples?.[0]?.sampleId || '—'}</span>
                  </p>
                </div>
                <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-gray-200 rounded-full">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 flex-1">

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-gray-900">{progress.total}</div>
                    <div className="text-xs text-gray-500 mt-0.5">Total Tests</div>
                  </div>
                  <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-center">
                    <div className="text-2xl font-bold text-emerald-700">{progress.verified}</div>
                    <div className="text-xs text-emerald-600 mt-0.5">Verified</div>
                  </div>
                  <div className={`p-3 rounded-lg border text-center ${abnormals > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className={`text-2xl font-bold ${abnormals > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{abnormals}</div>
                    <div className={`text-xs mt-0.5 ${abnormals > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Abnormal Flags</div>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 text-center">
                    <div className="text-2xl font-bold text-indigo-700">{formatCurrency(selectedReport.totalAmount)}</div>
                    <div className="text-xs text-indigo-600 mt-0.5">Amount</div>
                  </div>
                </div>

                {/* Verification Progress Bar */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Verification Progress</span>
                    <StatusBadge status={selectedReport.status} />
                  </div>
                  <ProgressBar progress={progress} size="md" />
                </div>

                {/* Patient Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Patient</h4>
                    <div className="font-medium">{selectedReport.userId?.firstName} {selectedReport.userId?.lastName}</div>
                    <div className="text-sm text-gray-600">{selectedReport.userId?.email}</div>
                    <div className="text-sm text-gray-600">{selectedReport.userId?.phone}</div>
                    <div className="text-xs text-gray-500 mt-1">{selectedReport.userId?.age} yrs, {selectedReport.userId?.gender}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Booking</h4>
                    <div className="text-sm"><span className="text-gray-500">Date:</span> {new Date(selectedReport.appointmentDate).toLocaleDateString()}</div>
                    <div className="text-sm"><span className="text-gray-500">Time:</span> {selectedReport.appointmentTime}</div>
                    <div className="mt-2 flex gap-2">
                      <StatusBadge status={selectedReport.status} />
                      <StatusBadge status={selectedReport.paymentStatus} />
                    </div>
                  </div>
                </div>

                {/* Recent Vitals */}
                {patientVitals.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center text-rose-700">
                      <Activity className="w-4 h-4 mr-2" /> Recent Vitals
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {patientVitals.slice(0, 3).map((vital, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border ${vital.status === 'abnormal' ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                          <div className="text-xs text-gray-500 mb-1">{new Date(vital.createdAt).toLocaleString()}</div>
                          <div className="flex justify-between items-end">
                            <div>
                              <div className="text-lg font-bold text-gray-900">{vital.heartRate} <span className="text-xs font-normal text-gray-500">BPM</span></div>
                              <div className="text-xs text-gray-500">Heart Rate</div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">{vital.spo2}%</div>
                              <div className="text-xs text-gray-500">SpO2</div>
                            </div>
                          </div>
                          {vital.status === 'abnormal' && (
                            <div className="mt-2 text-xs text-amber-700 font-medium flex items-center">
                              <AlertCircle className="w-3 h-3 mr-1" /> Abnormal
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Package-Grouped Test Results (Accordion) */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center text-indigo-900">
                    <BarChart3 className="w-4 h-4 mr-2" /> Test Results by Package
                  </h4>
                  <div className="space-y-3">
                    {Object.entries(grouped).map(([groupName, tests]) => (
                      <div key={groupName} className="border border-indigo-100 rounded-lg overflow-hidden">
                        <div className="bg-indigo-50/70 px-4 py-2.5 text-sm font-semibold text-indigo-800 flex items-center">
                          <Package className="h-4 w-4 mr-2" />
                          {groupName}
                          <span className="ml-auto text-xs font-normal text-indigo-600">{tests.length} tests</span>
                        </div>
                        <div className="divide-y divide-gray-100">
                          {tests.map((test, tIdx) => {
                            const result = getTestResult(selectedReport, test.id);
                            const testStatus = result?.status || 'pending';
                            const isExpanded = expandedTests[test.id];

                            const statusColors = {
                              pending: 'bg-gray-100 text-gray-600',
                              completed: 'bg-indigo-100 text-indigo-700',
                              verified: 'bg-emerald-100 text-emerald-700'
                            };

                            return (
                              <div key={test.id || tIdx}>
                                <button
                                  onClick={() => toggleTestExpand(test.id)}
                                  className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                                >
                                  <div className="flex items-center gap-2">
                                    {isExpanded
                                      ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                                      : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
                                    <span className="text-sm text-gray-900">{test.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {result && result.values?.some(v => isAbnormal(v.value, v.referenceRange)) && (
                                      <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium flex items-center">
                                        <AlertTriangle className="h-3 w-3 mr-0.5" /> Abnormal
                                      </span>
                                    )}
                                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[testStatus]}`}>
                                      {testStatus === 'pending' ? 'Pending' : testStatus === 'completed' ? 'Completed' : 'Verified'}
                                    </span>
                                    {testStatus === 'verified' && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                                  </div>
                                </button>

                                {/* Expanded: show result values */}
                                {isExpanded && result && result.values && result.values.length > 0 && (
                                  <div className="px-4 pb-3">
                                    <table className="min-w-full">
                                      <thead>
                                        <tr className="border-b border-gray-100">
                                          <th className="text-left text-xs font-medium text-gray-500 py-1.5 w-1/3">Parameter</th>
                                          <th className="text-left text-xs font-medium text-gray-500 py-1.5 w-1/3">Result</th>
                                          <th className="text-left text-xs font-medium text-gray-500 py-1.5 w-1/3">Reference Range</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {result.values.map((val, vIdx) => {
                                          const flagged = isAbnormal(val.value, val.referenceRange);
                                          return (
                                            <tr key={vIdx} className={`border-b border-gray-50 ${flagged ? 'bg-red-50' : ''}`}>
                                              <td className="py-1.5 text-sm text-gray-700">{val.label}</td>
                                              <td className={`py-1.5 text-sm font-medium ${flagged ? 'text-red-700' : 'text-gray-900'}`}>
                                                {val.value} <span className="text-xs font-normal text-gray-500">{val.unit}</span>
                                                {flagged && <AlertTriangle className="h-3 w-3 inline ml-1 text-red-500" />}
                                              </td>
                                              <td className="py-1.5 text-xs text-gray-500">{val.referenceRange || '—'}</td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                    {/* Verification info */}
                                    {result.verifiedAt && (
                                      <div className="mt-2 text-xs text-emerald-600 flex items-center bg-emerald-50 px-3 py-1.5 rounded-md">
                                        <Shield className="h-3 w-3 mr-1.5" />
                                        Verified on {new Date(result.verifiedAt).toLocaleString()}
                                      </div>
                                    )}
                                    {result.submittedAt && (
                                      <div className="mt-1 text-xs text-gray-500 flex items-center px-3 py-1">
                                        <Clock className="h-3 w-3 mr-1.5" />
                                        Submitted on {new Date(result.submittedAt).toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {isExpanded && (!result || !result.values || result.values.length === 0) && (
                                  <div className="px-4 pb-3">
                                    <div className="text-xs text-gray-400 italic py-2">No results recorded for this test.</div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Report File */}
                {selectedReport.reportFile && (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <FileImage className="h-8 w-8 text-green-600 mr-3" />
                      <div>
                        <div className="font-medium text-green-900">Final Report Available</div>
                        <div className="text-xs text-green-700">Uploaded {new Date(selectedReport.reportUploadDate || selectedReport.updatedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => downloadReport(selectedReport)} className="bg-white text-green-700 hover:bg-green-50 border border-green-200 px-3 py-1.5 rounded text-sm font-medium transition-colors">
                        Download
                      </button>
                      <button onClick={() => printReport(selectedReport)} className="bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-3 py-1.5 rounded text-sm font-medium transition-colors">
                        Print
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default StaffReports;
