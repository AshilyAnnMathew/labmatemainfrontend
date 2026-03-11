import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Calendar,
  TestTube,
  CheckCircle,
  X,
  FileImage,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Package,
  BarChart3,
  Printer,
  ImagePlus,
  Zap,
  Activity,
  Microscope,
  Search,
  ArrowUpRight,
  ShieldCheck,
  Layers,
  Clock,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import moment from 'moment';
import DashboardTable from '../components/common/DashboardTable';
import StatusBadge from '../components/common/StatusBadge';
import Swal from 'sweetalert2';

const UploadReports = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignedLab, setAssignedLab] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [resultEntries, setResultEntries] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTests, setExpandedTests] = useState({});
  const [savingTestId, setSavingTestId] = useState(null);
  const [imagingFiles, setImagingFiles] = useState({});
  const [imagingFindings, setImagingFindings] = useState({});
  const [uploadingImaging, setUploadingImaging] = useState(null);

  // ── helpers ──

  const isAbnormal = (val, rangeStr) => {
    if (!val || !rangeStr) return false;
    const parts = rangeStr.split('-');
    if (parts.length === 2 && !isNaN(val) && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parseFloat(val) < parseFloat(parts[0]) || parseFloat(val) > parseFloat(parts[1]);
    }
    return false;
  };

  const getTestStatus = (booking, testId) => {
    const tr = (booking.testResults || []).find(r => (r.testId?._id || r.testId)?.toString() === testId?.toString());
    return tr?.status || 'pending';
  };

  const getTestResult = (booking, testId) => {
    return (booking.testResults || []).find(r => (r.testId?._id || r.testId)?.toString() === testId?.toString()) || null;
  };

  const getAllTestsForBooking = (booking) => {
    const tests = [];
    (booking.selectedTests || []).forEach(t => {
      tests.push({
        id: t.testId?._id || t.testId,
        name: t.testId?.name || t.testName,
        category: t.testId?.category || '',
        resultFields: t.testId?.resultFields || [],
        source: 'direct',
        sourceName: 'Individual Tests'
      });
    });
    (booking.selectedPackages || []).forEach(pkg => {
      const pkgTests = pkg.packageId?.selectedTests || [];
      pkgTests.forEach(test => {
        tests.push({
          id: test._id,
          name: test.name,
          category: test.category || '',
          resultFields: test.resultFields || [],
          source: 'package',
          sourceName: pkg.packageId?.name || pkg.packageName
        });
      });
    });
    return tests;
  };

  const transformToPackageRows = (bookingsData) => {
    const rows = [];
    bookingsData.forEach(booking => {
      const allTests = getAllTestsForBooking(booking);
      const totalTests = allTests.length;
      const completedCount = allTests.filter(t => {
        const status = getTestStatus(booking, t.id);
        return status === 'completed' || status === 'verified';
      }).length;
      const verifiedCount = allTests.filter(t => getTestStatus(booking, t.id) === 'verified').length;

      let packageStatus = 'Processing';
      if (verifiedCount === totalTests && totalTests > 0) {
        packageStatus = 'Verified';
      } else if (completedCount === totalTests && totalTests > 0) {
        packageStatus = 'Pending Verify';
      } else if (completedCount > 0) {
        packageStatus = 'Partially Completed';
      }

      const packageNames = (booking.selectedPackages || []).map(p => p.packageId?.name || p.packageName).filter(Boolean);
      const directTestCount = (booking.selectedTests || []).length;
      let displayName = '';
      if (packageNames.length > 0 && directTestCount > 0) {
        displayName = packageNames.join(', ') + ` + ${directTestCount} test${directTestCount > 1 ? 's' : ''}`;
      } else if (packageNames.length > 0) {
        displayName = packageNames.join(', ');
      } else {
        displayName = `${directTestCount} Individual Test${directTestCount > 1 ? 's' : ''}`;
      }

      if (verifiedCount < totalTests) {
        rows.push({
          ...booking,
          _rowKey: booking._id,
          displayName,
          allTests,
          packageStatus,
          progress: {
            completed: completedCount,
            verified: verifiedCount,
            total: totalTests,
            percent: totalTests > 0 ? Math.round((completedCount / totalTests) * 100) : 0
          },
          allVerified: verifiedCount === totalTests && totalTests > 0,
          sampleId: booking.samples?.[0]?.sampleId || '—'
        });
      }
    });
    return rows;
  };

  // ── data fetching ──

  useEffect(() => {
    if (user?.assignedLab) {
      api.labAPI.getLab(user.assignedLab).then(res => setAssignedLab(res.data)).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        if (assignedLab && assignedLab._id) {
          const statuses = ['sample_collected', 'partially_completed', 'result_published'];
          const promises = statuses.map(s => api.localAdminAPI.getLabBookings(assignedLab._id, s, 1, 100));
          const responses = await Promise.all(promises);
          const allBookings = responses.flatMap(res => res.success ? res.data : []);
          const uniqueMap = new Map();
          allBookings.forEach(b => uniqueMap.set(b._id, b));
          setBookings(transformToPackageRows(Array.from(uniqueMap.values())));
        }
      } catch (error) {
        console.error('Error fetching bookings:', error);
      } finally {
        setLoading(false);
      }
    };
    if (assignedLab) fetchBookings();
    else setLoading(false);
  }, [assignedLab]);

  const refreshBookings = async () => {
    if (assignedLab && assignedLab._id) {
      const statuses = ['sample_collected', 'partially_completed', 'result_published'];
      const promises = statuses.map(s => api.localAdminAPI.getLabBookings(assignedLab._id, s, 1, 100));
      const responses = await Promise.all(promises);
      const allBookings = responses.flatMap(res => res.success ? res.data : []);
      const uniqueMap = new Map();
      allBookings.forEach(b => uniqueMap.set(b._id, b));
      const updatedRows = transformToPackageRows(Array.from(uniqueMap.values()));
      setBookings(updatedRows);
      return updatedRows;
    }
    return [];
  };

  const refreshAndReopenModal = async (bookingId) => {
    const updatedRows = await refreshBookings();
    const updatedRow = updatedRows.find(r => r._id === bookingId);
    if (updatedRow) {
      setSelectedBooking(updatedRow);
      const initial = {};
      updatedRow.allTests.forEach(test => {
        const existingResult = getTestResult(updatedRow, test.id);
        initial[test.id] = (test.resultFields || []).map(f => {
          let savedValue = f.type === 'boolean' ? false : '';
          if (existingResult && existingResult.values) {
            const match = existingResult.values.find(v => v.label === f.label);
            if (match) savedValue = match.value;
          }
          return {
            label: f.label || '',
            unit: f.unit || '',
            referenceRange: f.referenceRange || '',
            type: f.type || 'text',
            required: !!f.required,
            value: savedValue
          };
        });
      });
      setResultEntries(initial);
    } else {
      resetModal();
    }
  };

  // ── actions ──

  const handleOpenModal = (row) => {
    setSelectedBooking(row);
    const initial = {};
    row.allTests.forEach(test => {
      const existingResult = getTestResult(row, test.id);
      initial[test.id] = (test.resultFields || []).map(f => {
        let savedValue = f.type === 'boolean' ? false : '';
        if (existingResult && existingResult.values) {
          const match = existingResult.values.find(v => v.label === f.label);
          if (match) savedValue = match.value;
        }
        return {
          label: f.label || '',
          unit: f.unit || '',
          referenceRange: f.referenceRange || '',
          type: f.type || 'text',
          required: !!f.required,
          value: savedValue
        };
      });
    });
    setResultEntries(initial);
    setExpandedTests({});
    setShowModal(true);
  };

  const resetModal = () => {
    setShowModal(false);
    setSelectedFile(null);
    setSelectedBooking(null);
    setResultEntries({});
    setExpandedTests({});
    setSavingTestId(null);
  };

  const toggleTest = (testId) => {
    setExpandedTests(prev => ({ ...prev, [testId]: !prev[testId] }));
  };

  const isImagingTest = (test) => {
    const imagingCategories = ['imaging', 'cardiology'];
    if (imagingCategories.includes(test.category)) return true;
    const imagingNames = ['x-ray', 'xray', 'ecg', 'ekg', 'ct scan', 'mri', 'ultrasound', 'scan', 'mammography', 'fluoroscopy', 'pet scan', 'echo'];
    return imagingNames.some(n => (test.name || '').toLowerCase().includes(n));
  };

  const handleSaveTestResult = async (testId) => {
    if (!selectedBooking || !resultEntries[testId]) return;
    const testResults = [{
      testId,
      values: resultEntries[testId].map(f => ({
        label: f.label,
        value: f.value,
        unit: f.unit,
        referenceRange: f.referenceRange,
        type: f.type,
        required: f.required
      }))
    }];
    try {
      setSavingTestId(testId);
      const res = await api.resultsAPI.submitResults(selectedBooking._id, testResults);
      if (res.success) {
        await refreshAndReopenModal(selectedBooking._id);
      }
    } catch (err) {
      console.error('Error submitting result:', err);
      alert('Error: ' + err.message);
    } finally {
      setSavingTestId(null);
    }
  };

  const handleUploadImagingResult = async (testId) => {
    const file = imagingFiles[testId];
    if (!file || !selectedBooking) {
      alert('Please select an image or PDF file to upload.');
      return;
    }
    try {
      setUploadingImaging(testId);
      const res = await api.resultsAPI.uploadTestResultFile(
        selectedBooking._id, testId, file, imagingFindings[testId] || ''
      );
      if (res.success) {
        setImagingFiles(prev => ({ ...prev, [testId]: null }));
        setImagingFindings(prev => ({ ...prev, [testId]: '' }));
        await refreshAndReopenModal(selectedBooking._id);
      }
    } catch (err) {
      console.error('Error uploading imaging result:', err);
      alert('Error: ' + err.message);
    } finally {
      setUploadingImaging(null);
    }
  };

  const handleVerifyTest = async (testId) => {
    if (!selectedBooking) return;
    try {
      setVerifying(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/bookings/${selectedBooking._id}/verify-test/${testId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      if (data.success) {
        if (data.data.status === 'completed') {
          Swal.fire({
            icon: 'success',
            title: 'Diagnostic Integrity 100%',
            text: 'All results verified. This record has moved to "View Reports" for final authorization.',
            confirmButtonColor: '#0f172a',
            customClass: { popup: 'rounded-[3rem]' }
          });
          resetModal();
          refreshBookings();
        } else {
          await refreshAndReopenModal(selectedBooking._id);
        }
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Error verifying:', error);
      alert('Error: ' + error.message);
    } finally {
      setVerifying(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a PDF, JPEG, or PNG file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadReport = async () => {
    if (!selectedFile || !selectedBooking) return;
    if (!selectedBooking.allVerified) {
      alert('Cannot upload final report until all tests are verified.');
      return;
    }
    try {
      setUploading(true);
      const response = await api.bookingAPI.uploadReport(selectedBooking._id, selectedFile);
      if (response.success) {
        alert('Report uploaded!');
        resetModal();
        refreshBookings();
      }
    } catch (error) {
      alert('Error: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const filteredBookings = bookings.filter(b =>
    b.userId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.userId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.sampleId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const ProgressBar = ({ progress, size = 'md' }) => {
    const h = size === 'sm' ? 'h-1.5' : 'h-2.5';
    const color = progress.percent === 100 ? 'bg-emerald-500' : progress.percent > 0 ? 'bg-indigo-500' : 'bg-slate-200';
    return (
      <div className="w-full">
        <div className={`w-full bg-slate-100 rounded-full ${h} overflow-hidden shadow-inner`}>
          <div className={`${h} rounded-full transition-all duration-700 ease-out ${color} shadow-lg shadow-indigo-100/20`} style={{ width: `${progress.percent}%` }} />
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{progress.completed}/{progress.total} Assets</span>
          <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{progress.percent}%</span>
        </div>
      </div>
    );
  };

  const printSampleLabel = (row) => {
    const patientName = `${row.userId?.firstName || ''} ${row.userId?.lastName || ''}`;
    const sampleId = row.sampleId || '—';
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const tests = row.displayName || 'Tests';
    const age = row.userId?.age ? `${row.userId.age}Y` : '';
    const gender = row.userId?.gender ? row.userId.gender.charAt(0).toUpperCase() : '';
    const ageGender = [age, gender].filter(Boolean).join('/');

    const labelHTML = `
      <!DOCTYPE html>
      <html><head><title>Sample Label - ${sampleId}</title>
      <style>
        @page { size: 3in 1.5in; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; width: 3in; padding: 6px 8px; }
        .label-border { border: 1.5px solid #333; border-radius: 4px; padding: 5px 8px; height: 1.35in; display: flex; flex-direction: column; justify-content: space-between; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #999; padding-bottom: 3px; margin-bottom: 3px; }
        .lab-name { font-size: 8px; font-weight: bold; color: #333; letter-spacing: 0.5px; }
        .date-time { font-size: 7px; color: #666; text-align: right; }
        .sample-id { font-family: 'Courier New', monospace; font-size: 14px; font-weight: bold; letter-spacing: 1px; text-align: center; padding: 3px 0; }
        .barcode { display: flex; justify-content: center; gap: 1px; padding: 2px 0; }
        .barcode span { display: inline-block; height: 18px; background: #000; }
        .patient-info { display: flex; justify-content: space-between; font-size: 9px; border-top: 1px dashed #999; padding-top: 3px; margin-top: 2px; }
        .patient-name { font-weight: bold; color: #111; }
        .tests { font-size: 7px; color: #555; text-align: center; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head>
      <body>
        <div class="label-border">
          <div class="header">
            <span class="lab-name">LABMATE360</span>
            <span class="date-time">${dateStr}<br/>${timeStr}</span>
          </div>
          <div class="sample-id">${sampleId}</div>
          <div class="barcode" id="barcode"></div>
          <div class="tests">${tests}</div>
          <div class="patient-info">
            <span class="patient-name">${patientName}</span>
            <span>${ageGender}</span>
          </div>
        </div>
        <script>
          const code = '${sampleId}';
          const container = document.getElementById('barcode');
          for (let i = 0; i < code.length; i++) {
            const c = code.charCodeAt(i);
            const w = (c % 3) + 1;
            const bar = document.createElement('span');
            bar.style.width = w + 'px';
            container.appendChild(bar);
            const gap = document.createElement('span');
            gap.style.width = '1px';
            gap.style.background = 'transparent';
            container.appendChild(gap);
          }
          window.onload = () => window.print();
        <\/script>
      </body></html>
    `;

    const printWindow = window.open('', '_blank', 'width=320,height=200');
    if (printWindow) {
      printWindow.document.write(labelHTML);
      printWindow.document.close();
    }
  };

  const columns = [
    {
      header: 'Subject / Clinical Node',
      accessor: 'userId',
      render: (row) => (
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-[1rem] bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
            <User className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[13px] font-black text-slate-900 uppercase tracking-tight leading-none mb-1">
              {row.userId?.firstName} {row.userId?.lastName}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {row.userId?.email}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Diagnostic Logic',
      accessor: 'displayName',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50/50 rounded-lg text-indigo-500 border border-indigo-100/50">
            <Package size={14} />
          </div>
          <div>
            <div className="text-[11px] font-black text-slate-900 uppercase tracking-wider mb-0.5">
              {row.displayName}
            </div>
            <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Layers size={10} className="text-slate-300" />
              {row.progress.total} Assets Queued
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Sample ID',
      accessor: 'sampleId',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-[10px] font-black tracking-widest shadow-md shadow-slate-200">
            {row.sampleId || '—'}
          </div>
          {row.sampleId && row.sampleId !== '—' && (
            <button
              onClick={(e) => { e.stopPropagation(); printSampleLabel(row); }}
              className="p-2.5 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl border border-slate-100 transition-all font-black"
              title="Generate Physical Label"
            >
              <Printer className="h-4 w-4" />
            </button>
          )}
        </div>
      )
    },
    {
      header: 'Progress',
      accessor: 'progress',
      render: (row) => (
        <div className="w-40">
          <ProgressBar progress={row.progress} size="sm" />
        </div>
      )
    },
    {
      header: 'System State',
      accessor: 'packageStatus',
      render: (row) => {
        const colors = {
          'Processing': 'bg-blue-50 text-blue-600 border-blue-100',
          'Partially Completed': 'bg-amber-50 text-amber-600 border-amber-100',
          'Pending Verify': 'bg-indigo-50 text-indigo-600 border-indigo-100',
          'Verified': 'bg-emerald-50 text-emerald-600 border-emerald-100'
        };
        return (
          <span className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-full border ${colors[row.packageStatus] || 'bg-slate-50 text-slate-400 border-slate-100'}`}>
            {row.packageStatus === 'Processing' ? 'In Analysis' : row.packageStatus === 'Partially Completed' ? 'Sync Pending' : row.packageStatus === 'Pending Verify' ? 'Review Required' : 'Synchronized'}
          </span>
        );
      }
    },
    {
      header: 'Command',
      accessor: '_id',
      render: (row) => (
        <button
          onClick={() => handleOpenModal(row)}
          className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl transition-all hover:scale-[1.05] active:scale-[0.95] ${row.packageStatus === 'Pending Verify'
            ? 'text-white bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700'
            : 'text-white bg-slate-900 shadow-slate-200 hover:bg-slate-800'
            }`}
        >
          {row.packageStatus === 'Pending Verify' ? (
            <><ShieldCheck className="h-4 w-4" /> Authorize</>
          ) : (
            <><ArrowUpRight className="h-4 w-4" /> Input Data</>
          )}
        </button>
      )
    }
  ];

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
              Analytical Node: {user?.assignedLab?.slice(-6).toUpperCase() || 'CORE'}
            </span>
            <div className="h-0.5 w-12 bg-slate-200"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {moment().format('MMMM DD, YYYY')}
            </span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase mb-2">
            Clinical Results
          </h1>
          <p className="text-lg text-slate-500 font-medium">
            Diagnostic input interface for <span className="text-slate-900 font-bold">{assignedLab?.name || 'Authorized Lab'}</span>
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-white p-2 rounded-3xl border border-gray-100 shadow-sm">
          <div className="p-3 bg-slate-50 rounded-2xl">
            <Microscope className="h-5 w-5 text-slate-900" />
          </div>
          <div className="pr-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Data Stream</p>
            <p className="text-sm font-bold text-slate-900 uppercase">Secure Ingestion</p>
          </div>
        </div>
      </div>

      {/* Operational Ledger Table */}
      <div className="bg-white rounded-[3.5rem] border border-slate-50 shadow-2xl shadow-slate-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-slate-50/30">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Operational Ledger</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Clinical Entries</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 bg-white rounded-2xl border border-gray-100 shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-400">
                {filteredBookings.length} Nodes Pending
              </div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <DashboardTable
            data={filteredBookings}
            columns={columns}
            loading={loading}
            onSearch={setSearchTerm}
            searchValue={searchTerm}
            searchPlaceholder="Identify Subject or Sample ID..."
            emptyMessage="No pending clinical entries detected"
          />
        </div>
      </div>

      {/* ── Package Accordion Modal ── */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100"
          >
            {/* Modal Header */}
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-white">
              <div className="flex items-center gap-6">
                <div className="h-16 w-16 rounded-[1.5rem] bg-slate-900 text-white flex items-center justify-center shadow-xl shadow-slate-200">
                  <Activity className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-2">
                    {selectedBooking.displayName}
                  </h3>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">
                      Subject: {selectedBooking.userId?.firstName} {selectedBooking.userId?.lastName}
                    </span>
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                      ID: <span className="font-mono text-slate-400">{selectedBooking.sampleId}</span>
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={resetModal} className="p-4 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all">
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Package Analytics */}
            <div className="px-10 py-6 bg-slate-50/50 border-b border-slate-50">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Diagnostic Progress Matrix</p>
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{selectedBooking.progress.percent}% Synchronized</span>
              </div>
              <ProgressBar progress={selectedBooking.progress} />
              <div className="mt-4 flex flex-wrap gap-4">
                <div className="flex items-center bg-white px-3 py-1.5 rounded-full border border-slate-100">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Verified: {selectedBooking.progress.verified}</span>
                </div>
                <div className="flex items-center bg-white px-3 py-1.5 rounded-full border border-slate-100">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2" />
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Processing: {selectedBooking.progress.completed - selectedBooking.progress.verified}</span>
                </div>
                <div className="flex items-center bg-white px-3 py-1.5 rounded-full border border-slate-100">
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-200 mr-2" />
                  <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Queued: {selectedBooking.progress.total - selectedBooking.progress.completed}</span>
                </div>
              </div>
            </div>

            {/* Test Accordion List */}
            <div className="px-10 py-8 overflow-y-auto flex-1 space-y-4 custom-scrollbar bg-white">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Clinical Asset Inventory</h4>
                <div className="h-px flex-1 bg-slate-50 mx-6" />
              </div>
              {selectedBooking.allTests.map((test, idx) => {
                const testStatus = getTestStatus(selectedBooking, test.id);
                const isExpanded = expandedTests[test.id];
                const testResult = getTestResult(selectedBooking, test.id);
                const isDisabled = testStatus === 'verified';
                return (
                  <div key={test.id || idx} className={`rounded-[2rem] overflow-hidden transition-all duration-300 border ${testStatus === 'verified' ? 'bg-emerald-50/10 border-emerald-100' : 'bg-white border-slate-100'}`}>
                    <button onClick={() => toggleTest(test.id)} className={`w-full px-8 py-5 flex items-center justify-between transition-all ${isExpanded ? 'bg-slate-50/50' : 'hover:bg-slate-50/30'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 rounded-xl transition-colors ${testStatus === 'verified' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 font-black'}`}>
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-slate-900 uppercase tracking-wider">{test.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{test.sourceName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border ${testStatus === 'verified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : testStatus === 'completed' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                          {testStatus === 'pending' ? 'Queued' : testStatus === 'completed' ? 'Processed' : 'Validated'}
                        </span>
                        {testStatus === 'verified' && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                      </div>
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                        {isImagingTest(test) ? (
                          <div className="p-8 space-y-8 bg-slate-50/30">
                            {testResult?.resultFile && (
                              <div className="bg-emerald-50/50 border border-emerald-100 rounded-[2rem] p-6 shadow-sm">
                                <div className="flex items-center gap-3 text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-4">
                                  <ShieldCheck className="h-4 w-4" /> Asset Verified in Clinical Node
                                </div>
                                <div className="bg-white p-4 rounded-3xl border border-emerald-100/50">
                                  <img src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${testResult.resultFile}`} alt={test.name} className="max-h-64 mx-auto rounded-2xl object-contain shadow-md" onError={(e) => { e.target.style.display = 'none'; }} />
                                </div>
                                {testResult?.findings && (
                                  <div className="mt-4 p-5 bg-white rounded-2xl border border-emerald-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Clinical Findings</p>
                                    <p className="text-sm text-slate-700 leading-relaxed font-medium">{testResult.findings}</p>
                                  </div>
                                )}
                              </div>
                            )}
                            {!isDisabled && (
                              <>
                                <div className={`group relative border-2 border-dashed rounded-[2.5rem] p-10 text-center transition-all cursor-pointer ${imagingFiles[test.id] ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 bg-white hover:border-slate-400 hover:bg-slate-50'}`} onClick={() => document.getElementById(`imaging-file-${test.id}`)?.click()}>
                                  <input id={`imaging-file-${test.id}`} type="file" accept="image/jpeg,image/png,image/jpg,application/pdf" className="hidden" onChange={(e) => { const file = e.target.files[0]; if (file) { if (file.size > 15 * 1024 * 1024) { Swal.fire('Limit Exceeded', 'File must be under 15MB', 'error'); return; } setImagingFiles(prev => ({ ...prev, [test.id]: file })); } }} />
                                  {imagingFiles[test.id] ? (
                                    <div className="space-y-3">
                                      <div className="h-16 w-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-100"><FileImage className="h-8 w-8" /></div>
                                      <p className="text-sm font-black text-slate-900 uppercase tracking-tight">{imagingFiles[test.id].name}</p>
                                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{(imagingFiles[test.id].size / (1024 * 1024)).toFixed(2)} MB — Click to Rotate Asset</p>
                                    </div>
                                  ) : (
                                    <div className="space-y-4">
                                      <div className="h-20 w-20 bg-slate-50 text-slate-300 rounded-[2rem] flex items-center justify-center mx-auto group-hover:scale-110 transition-transform"><ImagePlus className="h-10 w-10" /></div>
                                      <div><p className="text-sm font-black text-slate-900 uppercase tracking-widest">Capture Optical Data</p><p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">JPG, PNG, or PDF • Physical Node Limit 15MB</p></div>
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-3">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-2 block">Analytical Interpretation</label>
                                  <textarea rows={3} value={imagingFindings[test.id] || ''} onChange={(e) => setImagingFindings(prev => ({ ...prev, [test.id]: e.target.value }))} placeholder="Enter clinical observations or interpretation matrix..." className="w-full bg-white border border-slate-100 rounded-[1.5rem] text-sm px-6 py-4 focus:ring-4 focus:ring-slate-900/5 focus:border-slate-200 transition-all font-medium placeholder:text-slate-300" />
                                </div>
                                <div className="flex justify-end pt-2">
                                  <button onClick={() => handleUploadImagingResult(test.id)} disabled={!imagingFiles[test.id] || uploadingImaging === test.id} className="px-10 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 disabled:opacity-50">
                                    <Upload className="h-4 w-4" /> {uploadingImaging === test.id ? 'Ingesting...' : 'Ingest Asset'}
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ) : Array.isArray(resultEntries[test.id]) && resultEntries[test.id].length > 0 ? (
                          <div className="p-8 space-y-6 bg-slate-50/30">
                            {resultEntries[test.id].map((field, fIdx) => (
                              <div key={fIdx} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                <div className="flex justify-between items-center mb-3">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{field.label || 'Metric Value'}</label>
                                  {field.unit && <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 uppercase tracking-widest">{field.unit}</span>}
                                </div>
                                {field.type === 'boolean' ? (
                                  <select disabled={isDisabled} value={field.value ? 'true' : 'false'} onChange={(e) => { const updated = [...resultEntries[test.id]]; updated[fIdx] = { ...updated[fIdx], value: e.target.value === 'true' }; setResultEntries(prev => ({ ...prev, [test.id]: updated })); }} className="w-full bg-slate-50 border-transparent rounded-2xl py-4 px-6 text-sm font-bold uppercase tracking-widest focus:bg-white focus:ring-4 focus:ring-slate-900/5 transition-all text-slate-900 disabled:opacity-50">
                                    <option value="false">Negative / Void</option><option value="true">Positive / Detected</option>
                                  </select>
                                ) : (
                                  <input type={field.type === 'number' ? 'number' : 'text'} disabled={isDisabled} value={field.value} onChange={(e) => { const updated = [...resultEntries[test.id]]; updated[fIdx] = { ...updated[fIdx], value: field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value }; setResultEntries(prev => ({ ...prev, [test.id]: updated })); }} placeholder={field.referenceRange ? `Reference: ${field.referenceRange}` : 'Enter scientific value'} className={`w-full py-4 px-6 rounded-2xl text-sm font-bold transition-all disabled:cursor-not-allowed ${isAbnormal(field.value, field.referenceRange) ? 'bg-rose-50 border border-rose-100 text-rose-900 focus:ring-rose-200' : 'bg-slate-50 border-transparent text-slate-900 focus:bg-white focus:ring-4 focus:ring-slate-900/5'}`} />
                                )}
                                {field.referenceRange && (
                                  <div className="mt-3 flex items-center justify-between">
                                    <div className="flex items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest"><Zap className="h-3 w-3 mr-1.5" /> Ref Matrix: {field.referenceRange}</div>
                                    {isAbnormal(field.value, field.referenceRange) && <span className="flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-700 text-[8px] font-black uppercase tracking-widest rounded-md animate-pulse"><AlertCircle className="h-3 w-3" /> Deviation Detected</span>}
                                  </div>
                                )}
                              </div>
                            ))}
                            <div className="flex justify-end gap-4 pt-2">
                              {testStatus === 'pending' && <button onClick={() => handleSaveTestResult(test.id)} disabled={savingTestId === test.id} className="px-8 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">{savingTestId === test.id ? 'Synchronizing...' : 'Commit Results'}</button>}
                              {testStatus === 'completed' && <button onClick={() => handleVerifyTest(test.id)} disabled={verifying} className="px-8 py-4 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"><ShieldCheck className="w-4 h-4" /> {verifying ? 'Validating...' : 'Authorize Data'}</button>}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-sm">No predefined fields for this test. Upload a file report instead.</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="px-10 py-8 border-t border-slate-50 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex-1 pr-6">
                  {!selectedBooking.allVerified && (
                    <div className="flex items-center gap-2 text-amber-600 bg-amber-50/50 px-4 py-3 rounded-2xl border border-amber-100/50">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Node Synchronicity Error: All diagnostic metrics must be verified before final report generation.</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 items-center">
                  <button onClick={resetModal} className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors">Close Node</button>
                  {selectedBooking.allVerified && (
                    <div className="flex items-center gap-4">
                      <label className="px-8 py-4 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-emerald-100 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex items-center gap-2">
                        <Upload className="h-4 w-4" /> {selectedFile ? selectedFile.name : 'Select Clinical Record'}
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileSelect} className="hidden" />
                      </label>
                      {selectedFile && (
                        <button onClick={handleUploadReport} disabled={uploading} className="px-10 py-4 bg-slate-900 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-2xl shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 disabled:opacity-50">
                          <ShieldCheck className="h-4 w-4" /> {uploading ? 'Transmitting...' : 'Transmit Report'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default UploadReports;