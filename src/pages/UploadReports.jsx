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
  ImagePlus
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import Swal from 'sweetalert2';
import DashboardTable from '../components/common/DashboardTable';
import StatusBadge from '../components/common/StatusBadge';

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

  // Collect all individual tests for a booking (direct + from packages)
  const getAllTestsForBooking = (booking) => {
    const tests = [];

    // Direct tests
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

    // Package tests
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

  // Group bookings into package-level rows for the table
  const transformToPackageRows = (bookingsData) => {
    const rows = [];

    bookingsData.forEach(booking => {
      const allTests = getAllTestsForBooking(booking);
      const existingResults = booking.testResults || [];

      // Compute progress
      const totalTests = allTests.length;
      const completedCount = allTests.filter(t => {
        const status = getTestStatus(booking, t.id);
        return status === 'completed' || status === 'verified';
      }).length;
      const verifiedCount = allTests.filter(t => getTestStatus(booking, t.id) === 'verified').length;

      // Determine package status
      let packageStatus = 'Processing';
      if (verifiedCount === totalTests && totalTests > 0) {
        packageStatus = 'Verified';
      } else if (completedCount === totalTests && totalTests > 0) {
        packageStatus = 'Pending Verify';
      } else if (completedCount > 0) {
        packageStatus = 'Partially Completed';
      }

      // Group names for display
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

      // Only include if there are still non-verified tests
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
          // Fetch bookings that need results or verification
          const statuses = ['sample_collected', 'partially_completed', 'result_published'];
          const promises = statuses.map(s => api.localAdminAPI.getLabBookings(assignedLab._id, s, 1, 100));
          const responses = await Promise.all(promises);
          const allBookings = responses.flatMap(res => res.success ? res.data : []);

          // Deddup by _id
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

  // Refresh data and re-open modal with updated booking (keeps modal open)
  const refreshAndReopenModal = async (bookingId) => {
    const updatedRows = await refreshBookings();
    const updatedRow = updatedRows.find(r => r._id === bookingId);
    if (updatedRow) {
      // Re-populate modal with fresh data
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
      // Keep expanded state as-is
    } else {
      // Booking no longer in pending list (all verified) — close modal
      resetModal();
    }
  };

  // ── actions ──

  const handleOpenModal = (row) => {
    setSelectedBooking(row);

    // Pre-populate result entries for all tests
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

  // Helper: detect imaging test
  const isImagingTest = (test) => {
    const imagingCategories = ['imaging', 'cardiology'];
    if (imagingCategories.includes(test.category)) return true;
    // Also detect by name patterns if category not set
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
      Swal.fire({ icon: 'error', title: 'Submit Failed', text: err.message, confirmButtonColor: '#ef4444' });
    } finally {
      setSavingTestId(null);
    }
  };

  // Handle imaging file upload
  const handleUploadImagingResult = async (testId) => {
    const file = imagingFiles[testId];
    if (!file || !selectedBooking) {
      Swal.fire({ icon: 'warning', title: 'No File Selected', text: 'Please select an image or PDF file to upload.', confirmButtonColor: '#f59e0b' });
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
      Swal.fire({ icon: 'error', title: 'Upload Failed', text: err.message, confirmButtonColor: '#ef4444' });
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
        // Keep modal open — refresh data in-place
        await refreshAndReopenModal(selectedBooking._id);
      } else {
        throw new Error(data.message || 'Verification failed');
      }
    } catch (error) {
      console.error('Error verifying:', error);
      Swal.fire({ icon: 'error', title: 'Verification Failed', text: error.message, confirmButtonColor: '#ef4444' });
    } finally {
      setVerifying(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        Swal.fire({ icon: 'warning', title: 'Invalid File Type', text: 'Please select a PDF, JPEG, or PNG file.', confirmButtonColor: '#f59e0b' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({ icon: 'warning', title: 'File Too Large', text: 'File size must be less than 10MB.', confirmButtonColor: '#f59e0b' });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadReport = async () => {
    if (!selectedFile || !selectedBooking) return;
    if (!selectedBooking.allVerified) {
      Swal.fire({ icon: 'warning', title: 'Tests Not Verified', text: 'Cannot upload final report until all tests are verified.', confirmButtonColor: '#f59e0b' });
      return;
    }
    try {
      setUploading(true);
      const response = await api.bookingAPI.uploadReport(selectedBooking._id, selectedFile);
      if (response.success) {
        Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
          .fire({ icon: 'success', title: 'Report uploaded successfully!' });
        resetModal();
        refreshBookings();
      }
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Upload Failed', text: error.message, confirmButtonColor: '#ef4444' });
    } finally {
      setUploading(false);
    }
  };

  // ── filter ──
  const filteredBookings = bookings.filter(b =>
    b.userId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.userId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.sampleId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── progress bar component ──
  const ProgressBar = ({ progress, size = 'md' }) => {
    const h = size === 'sm' ? 'h-1.5' : 'h-2.5';
    const color = progress.percent === 100 ? 'bg-emerald-500' : progress.percent > 0 ? 'bg-amber-500' : 'bg-gray-300';
    return (
      <div className="w-full">
        <div className={`w-full bg-gray-200 rounded-full ${h} overflow-hidden`}>
          <div className={`${h} rounded-full transition-all duration-500 ${color}`} style={{ width: `${progress.percent}%` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-500">{progress.completed}/{progress.total} tests</span>
          <span className="text-xs font-medium text-gray-700">{progress.percent}%</span>
        </div>
      </div>
    );
  };

  // ── sample label print (one label per test) ──
  const printSampleLabel = (row) => {
    const patientName = `${row.userId?.firstName || ''} ${row.userId?.lastName || ''}`;
    const sampleId = row.sampleId || '—';
    const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const age = row.userId?.age ? `${row.userId.age}Y` : '';
    const gender = row.userId?.gender ? row.userId.gender.charAt(0).toUpperCase() : '';
    const ageGender = [age, gender].filter(Boolean).join('/');

    // Build one label per test
    const allTests = row.allTests || [];
    const totalLabels = allTests.length || 1;

    const labelsHTML = allTests.length > 0
      ? allTests.map((test, idx) => `
        <div class="label-border">
          <div class="header">
            <span class="lab-name">LABMATE360</span>
            <span class="label-num">${idx + 1} of ${totalLabels}</span>
            <span class="date-time">${dateStr}<br/>${timeStr}</span>
          </div>
          <div class="sample-id">${sampleId}</div>
          <div class="barcode" data-code="${sampleId}"></div>
          <div class="test-name">${test.name || 'Test'}</div>
          <div class="patient-info">
            <span class="patient-name">${patientName}</span>
            <span>${ageGender}</span>
          </div>
        </div>
      `).join('')
      : `
        <div class="label-border">
          <div class="header">
            <span class="lab-name">LABMATE360</span>
            <span class="date-time">${dateStr}<br/>${timeStr}</span>
          </div>
          <div class="sample-id">${sampleId}</div>
          <div class="barcode" data-code="${sampleId}"></div>
          <div class="test-name">${row.displayName || 'Tests'}</div>
          <div class="patient-info">
            <span class="patient-name">${patientName}</span>
            <span>${ageGender}</span>
          </div>
        </div>
      `;

    const labelHTML = `
      <!DOCTYPE html>
      <html><head><title>Sample Labels - ${sampleId}</title>
      <style>
        @page { size: 3in 1.8in; margin: 0; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; width: 3in; padding: 0; }
        .label-border { border: 1.5px solid #333; border-radius: 4px; padding: 5px 8px; height: 1.65in; display: flex; flex-direction: column; justify-content: space-between; page-break-after: always; margin: 4px 6px; }
        .label-border:last-child { page-break-after: auto; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px dashed #999; padding-bottom: 3px; margin-bottom: 3px; }
        .lab-name { font-size: 8px; font-weight: bold; color: #333; letter-spacing: 0.5px; }
        .label-num { font-size: 7px; font-weight: bold; color: #fff; background: #333; padding: 1px 5px; border-radius: 3px; }
        .date-time { font-size: 7px; color: #666; text-align: right; }
        .sample-id { font-family: 'Courier New', monospace; font-size: 13px; font-weight: bold; letter-spacing: 1px; text-align: center; padding: 2px 0; }
        .barcode { display: flex; justify-content: center; gap: 1px; padding: 2px 0; }
        .barcode span { display: inline-block; height: 18px; background: #000; }
        .test-name { font-size: 9px; font-weight: 600; color: #222; text-align: center; padding: 2px 4px; background: #f0f0f0; border-radius: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .patient-info { display: flex; justify-content: space-between; font-size: 9px; border-top: 1px dashed #999; padding-top: 3px; margin-top: 2px; }
        .patient-name { font-weight: bold; color: #111; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style></head>
      <body>
        ${labelsHTML}
        <script>
          // Generate barcode for each label
          document.querySelectorAll('.barcode').forEach(container => {
            const code = container.getAttribute('data-code') || '';
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
          });
          window.onload = () => window.print();
        <\/script>
      </body></html>
    `;

    const printWindow = window.open('', '_blank', 'width=340,height=260');
    if (printWindow) {
      printWindow.document.write(labelHTML);
      printWindow.document.close();
    }
  };

  // ── table columns ──
  const columns = [
    {
      header: 'Patient',
      accessor: 'userId',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.userId?.firstName} {row.userId?.lastName}</div>
          <div className="text-xs text-gray-500">{row.userId?.email}</div>
        </div>
      )
    },
    {
      header: 'Package / Tests',
      accessor: 'displayName',
      render: (row) => (
        <div>
          <div className="flex items-center text-sm font-medium text-gray-900">
            <Package className="h-4 w-4 mr-1.5 text-primary-600 flex-shrink-0" />
            <span className="truncate max-w-[200px]">{row.displayName}</span>
          </div>
          <div className="text-xs text-gray-500 ml-5.5 mt-0.5">{row.progress.total} tests</div>
        </div>
      )
    },
    {
      header: 'Sample ID',
      accessor: 'sampleId',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">{row.sampleId || '—'}</span>
          {row.sampleId && row.sampleId !== '—' && (
            <button
              onClick={(e) => { e.stopPropagation(); printSampleLabel(row); }}
              className="p-1 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
              title="Print Sample Label"
            >
              <Printer className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )
    },
    {
      header: 'Progress',
      accessor: 'progress',
      render: (row) => (
        <div className="w-32">
          <ProgressBar progress={row.progress} size="sm" />
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'packageStatus',
      render: (row) => {
        const colors = {
          'Processing': 'bg-blue-50 text-blue-700 border-blue-200',
          'Partially Completed': 'bg-amber-50 text-amber-700 border-amber-200',
          'Pending Verify': 'bg-indigo-50 text-indigo-700 border-indigo-200',
          'Verified': 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
        return (
          <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${colors[row.packageStatus] || 'bg-gray-50 text-gray-700 border-gray-200'}`}>
            {row.packageStatus}
          </span>
        );
      }
    },
    {
      header: 'Action',
      accessor: '_id',
      render: (row) => (
        <button
          onClick={() => handleOpenModal(row)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center transition-colors shadow-sm ${row.packageStatus === 'Pending Verify'
            ? 'text-white bg-indigo-600 hover:bg-indigo-700'
            : 'text-white bg-primary-600 hover:bg-primary-700'
            }`}
        >
          {row.packageStatus === 'Pending Verify' ? (
            <><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Verify Results</>
          ) : (
            <><Upload className="h-3.5 w-3.5 mr-1.5" /> Add Results</>
          )}
        </button>
      )
    }
  ];

  // ── render ──
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Results</h1>
        <p className="text-sm text-gray-500">Enter test results grouped by package. All tests must be verified before generating a final report.</p>
      </div>

      <DashboardTable
        data={filteredBookings}
        columns={columns}
        loading={loading}
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        searchPlaceholder="Search by patient, package, or sample ID..."
        emptyMessage="No pending samples found"
      />

      {/* ── Package Accordion Modal ── */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-lg text-gray-900">
                  {selectedBooking.displayName}
                </h3>
                <p className="text-sm text-gray-500">
                  Patient: {selectedBooking.userId?.firstName} {selectedBooking.userId?.lastName}
                  {' • '}Sample: <span className="font-mono">{selectedBooking.sampleId}</span>
                </p>
              </div>
              <button onClick={resetModal} className="p-1 hover:bg-gray-200 rounded-full">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Package Progress */}
            <div className="px-6 pt-4 pb-2">
              <ProgressBar progress={selectedBooking.progress} />
              <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-emerald-500 mr-1" /> Verified: {selectedBooking.progress.verified}</span>
                <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-amber-500 mr-1" /> Completed: {selectedBooking.progress.completed - selectedBooking.progress.verified}</span>
                <span className="flex items-center"><span className="h-2 w-2 rounded-full bg-gray-300 mr-1" /> Pending: {selectedBooking.progress.total - selectedBooking.progress.completed}</span>
              </div>
            </div>

            {/* Test Accordion List */}
            <div className="px-6 py-4 overflow-y-auto flex-1 space-y-2">
              {selectedBooking.allTests.map((test, idx) => {
                const testStatus = getTestStatus(selectedBooking, test.id);
                const isExpanded = expandedTests[test.id];
                const testResult = getTestResult(selectedBooking, test.id);
                const isDisabled = testStatus === 'verified';

                const statusColors = {
                  pending: 'bg-gray-100 text-gray-600',
                  completed: 'bg-indigo-100 text-indigo-700',
                  verified: 'bg-emerald-100 text-emerald-700'
                };

                return (
                  <div key={test.id || idx} className={`border rounded-lg overflow-hidden ${testStatus === 'verified' ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200'}`}>
                    {/* Accordion Header */}
                    <button
                      onClick={() => toggleTest(test.id)}
                      className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                        <div>
                          <span className="text-sm font-medium text-gray-900">{test.name}</span>
                          <span className="text-xs text-gray-400 ml-2">({test.sourceName})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${statusColors[testStatus]}`}>
                          {testStatus === 'pending' ? 'Pending' : testStatus === 'completed' ? 'Completed' : 'Verified'}
                        </span>
                        {testStatus === 'verified' && <CheckCircle className="h-4 w-4 text-emerald-500" />}
                      </div>
                    </button>

                    {/* Accordion Body */}
                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                        {isImagingTest(test) ? (
                          /* ── Imaging Test: File Upload UI ── */
                          <div className="space-y-3">
                            {/* Show existing uploaded file */}
                            {testResult?.resultFile && (
                              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                                <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium mb-2">
                                  <FileImage className="h-4 w-4" />
                                  File uploaded
                                </div>
                                <img
                                  src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000'}/${testResult.resultFile}`}
                                  alt={test.name}
                                  className="max-h-48 rounded-lg border border-emerald-200 object-contain"
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                {testResult?.findings && (
                                  <p className="mt-2 text-sm text-gray-700 bg-white rounded p-2 border border-emerald-100">
                                    <strong>Findings:</strong> {testResult.findings}
                                  </p>
                                )}
                              </div>
                            )}

                            {!isDisabled && (
                              <>
                                {/* File Upload Zone */}
                                <div
                                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
                                    ${imagingFiles[test.id] ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'}`}
                                  onClick={() => document.getElementById(`imaging-file-${test.id}`)?.click()}
                                >
                                  <input
                                    id={`imaging-file-${test.id}`}
                                    type="file"
                                    accept="image/jpeg,image/png,image/jpg,application/pdf"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (file) {
                                        if (file.size > 15 * 1024 * 1024) {
                                          Swal.fire({ icon: 'warning', title: 'File Too Large', text: 'File must be under 15MB.', confirmButtonColor: '#f59e0b' });
                                          return;
                                        }
                                        setImagingFiles(prev => ({ ...prev, [test.id]: file }));
                                      }
                                    }}
                                  />
                                  {imagingFiles[test.id] ? (
                                    <div>
                                      <FileImage className="h-8 w-8 text-primary-500 mx-auto mb-2" />
                                      <p className="text-sm font-medium text-primary-700">{imagingFiles[test.id].name}</p>
                                      <p className="text-xs text-gray-500 mt-1">{(imagingFiles[test.id].size / (1024 * 1024)).toFixed(2)} MB — Click to change</p>
                                    </div>
                                  ) : (
                                    <div>
                                      <ImagePlus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                      <p className="text-sm text-gray-600 font-medium">Upload {test.name} Image/Report</p>
                                      <p className="text-xs text-gray-400 mt-1">JPG, PNG, or PDF • Max 15MB</p>
                                    </div>
                                  )}
                                </div>

                                {/* Findings Textarea */}
                                <div>
                                  <label className="text-sm font-medium text-gray-700 block mb-1">Findings / Interpretation</label>
                                  <textarea
                                    rows={3}
                                    value={imagingFindings[test.id] || ''}
                                    onChange={(e) => setImagingFindings(prev => ({ ...prev, [test.id]: e.target.value }))}
                                    placeholder="Enter medical findings, observations, or interpretation..."
                                    className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
                                  />
                                </div>

                                {/* Upload Button */}
                                <div className="flex justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => handleUploadImagingResult(test.id)}
                                    disabled={!imagingFiles[test.id] || uploadingImaging === test.id}
                                    className="px-4 py-2 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 flex items-center gap-1.5 transition-colors shadow-sm"
                                  >
                                    <Upload className="h-3.5 w-3.5" />
                                    {uploadingImaging === test.id ? 'Uploading...' : 'Upload Result'}
                                  </button>
                                </div>
                              </>
                            )}

                            {/* Verify button for imaging results */}
                            {testStatus === 'completed' && (
                              <div className="flex justify-end">
                                <button
                                  onClick={() => handleVerifyTest(test.id)}
                                  disabled={verifying}
                                  className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center transition-colors shadow-sm"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                  {verifying ? 'Verifying...' : 'Verify'}
                                </button>
                              </div>
                            )}
                          </div>
                        ) : Array.isArray(resultEntries[test.id]) && resultEntries[test.id].length > 0 ? (
                          /* ── Normal Test: Value Input Fields ── */
                          <div className="space-y-3">
                            {resultEntries[test.id].map((field, fIdx) => (
                              <div key={fIdx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div className="flex justify-between mb-1">
                                  <label className="text-sm font-medium text-gray-700">{field.label || 'Value'}</label>
                                  {field.unit && <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded border">{field.unit}</span>}
                                </div>
                                {field.type === 'boolean' ? (
                                  <select
                                    disabled={isDisabled}
                                    value={field.value ? 'true' : 'false'}
                                    onChange={(e) => {
                                      const updated = [...resultEntries[test.id]];
                                      updated[fIdx] = { ...updated[fIdx], value: e.target.value === 'true' };
                                      setResultEntries(prev => ({ ...prev, [test.id]: updated }));
                                    }}
                                    className="w-full mt-1 border-gray-300 rounded-md text-sm disabled:bg-gray-100 disabled:text-gray-500"
                                  >
                                    <option value="false">Negative / No</option>
                                    <option value="true">Positive / Yes</option>
                                  </select>
                                ) : (
                                  <input
                                    type={field.type === 'number' ? 'number' : 'text'}
                                    disabled={isDisabled}
                                    value={field.value}
                                    onChange={(e) => {
                                      const updated = [...resultEntries[test.id]];
                                      updated[fIdx] = {
                                        ...updated[fIdx],
                                        value: field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value
                                      };
                                      setResultEntries(prev => ({ ...prev, [test.id]: updated }));
                                    }}
                                    placeholder={field.referenceRange ? `Range: ${field.referenceRange}` : 'Enter value'}
                                    className={`w-full mt-1 border border-gray-300 rounded-md text-sm disabled:cursor-not-allowed px-3 py-2 ${isAbnormal(field.value, field.referenceRange)
                                      ? 'bg-red-50 border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500'
                                      : 'focus:ring-primary-500 focus:border-primary-500 disabled:bg-gray-100'
                                      }`}
                                  />
                                )}
                                {field.referenceRange && (
                                  <div className={`mt-1 flex items-center text-xs ${isAbnormal(field.value, field.referenceRange) ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Ref Range: {field.referenceRange}
                                    {isAbnormal(field.value, field.referenceRange) && (
                                      <span className="ml-2 bg-red-100 px-2 py-0.5 rounded text-red-800">Abnormal</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* Per-test action buttons */}
                            <div className="flex justify-end gap-2 pt-2">
                              {testStatus === 'pending' && (
                                <button
                                  onClick={() => handleSaveTestResult(test.id)}
                                  disabled={savingTestId === test.id}
                                  className="px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 flex items-center transition-colors shadow-sm"
                                >
                                  {savingTestId === test.id ? 'Saving...' : 'Save Result'}
                                </button>
                              )}
                              {testStatus === 'completed' && (
                                <button
                                  onClick={() => handleVerifyTest(test.id)}
                                  disabled={verifying}
                                  className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 flex items-center transition-colors shadow-sm"
                                >
                                  <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                  {verifying ? 'Verifying...' : 'Verify'}
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-sm">
                            No predefined fields for this test. Upload a file report instead.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  {!selectedBooking.allVerified && (
                    <span className="flex items-center text-amber-600">
                      <AlertCircle className="h-3.5 w-3.5 mr-1" />
                      All tests must be verified before generating a report
                    </span>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={resetModal} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
                    Close
                  </button>
                  {/* Upload Report section - only for fully verified packages */}
                  {selectedBooking.allVerified && (
                    <div className="flex items-center gap-2">
                      <label className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg cursor-pointer flex items-center transition-colors shadow-sm">
                        <Upload className="h-4 w-4 mr-1.5" />
                        {selectedFile ? selectedFile.name : 'Upload Report'}
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileSelect} className="hidden" />
                      </label>
                      {selectedFile && (
                        <button
                          onClick={handleUploadReport}
                          disabled={uploading}
                          className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 flex items-center transition-colors shadow-sm"
                        >
                          {uploading ? 'Uploading...' : 'Submit Report'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadReports;
