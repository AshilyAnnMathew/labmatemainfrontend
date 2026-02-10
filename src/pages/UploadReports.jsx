import React, { useState, useEffect } from 'react';
import {
  Upload,
  FileText,
  Calendar,
  TestTube,
  CheckCircle,
  X,
  FileImage,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import DashboardTable from '../components/common/DashboardTable';
import StatusBadge from '../components/common/StatusBadge';

const UploadReports = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignedLab, setAssignedLab] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [useResultsEntry, setUseResultsEntry] = useState(false);
  const [resultEntries, setResultEntries] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Helper function to transform bookings to show individual tests that still need results
  const transformBookingsToIndividualTests = (bookingsData) => {
    const transformedBookings = [];
    bookingsData.forEach(booking => {
      const existingResults = booking.testResults || [];
      const resultTestIds = new Set(existingResults.map(r => r.testId?._id || r.testId));

      if (booking.selectedTests && booking.selectedTests.length > 0) {
        booking.selectedTests.forEach(test => {
          const testId = test.testId?._id || test.testId;
          if (!resultTestIds.has(testId)) {
            transformedBookings.push({
              ...booking,
              testInfo: {
                id: testId,
                name: test.testId?.name || test.testName,
                type: 'direct',
                resultFields: test.testId?.resultFields || []
              }
            });
          }
        });
      }

      if (booking.selectedPackages && booking.selectedPackages.length > 0) {
        booking.selectedPackages.forEach(pkg => {
          if (pkg.packageId?.selectedTests && pkg.packageId.selectedTests.length > 0) {
            pkg.packageId.selectedTests.forEach(test => {
              const testId = test._id;
              if (!resultTestIds.has(testId)) {
                transformedBookings.push({
                  ...booking,
                  testInfo: {
                    id: testId,
                    name: test.name,
                    type: 'package',
                    packageName: pkg.packageId?.name || pkg.packageName,
                    resultFields: test.resultFields || []
                  }
                });
              }
            });
          }
        });
      }
    });
    return transformedBookings;
  };

  useEffect(() => {
    if (user?.assignedLab) {
      api.labAPI.getLab(user.assignedLab).then(res => setAssignedLab(res.data)).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        if (assignedLab && assignedLab._id) {
          const response = await api.localAdminAPI.getLabBookings(assignedLab._id, 'sample_collected', 1, 100);
          if (response.success) {
            setBookings(transformBookingsToIndividualTests(response.data));
          }
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
    if (!selectedFile || !selectedBooking) {
      alert('Please select a file and booking');
      return;
    }

    try {
      setUploading(true);
      const response = await api.bookingAPI.uploadReport(selectedBooking._id, selectedFile);

      if (response.success) {
        alert('Report uploaded successfully!');
        resetModal();
        refreshBookings();
      }
    } catch (error) {
      console.error('Error uploading report:', error);
      alert('Error uploading report: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmitResults = async () => {
    if (!selectedBooking) return;
    const testId = selectedBooking.testInfo?.id;
    if (!testId || !resultEntries[testId]) {
      alert('No results to submit');
      return;
    }
    const testResults = [{
      testId: testId,
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
      setUploading(true);
      const res = await api.resultsAPI.submitResults(selectedBooking._id, testResults);
      if (res.success) {
        alert('Results submitted successfully!');
        resetModal();
        refreshBookings();
      }
    } catch (err) {
      console.error('Error submitting results:', err);
      alert('Error submitting results: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const refreshBookings = async () => {
    if (assignedLab && assignedLab._id) {
      const updatedResponse = await api.localAdminAPI.getLabBookings(assignedLab._id, 'sample_collected', 1, 100);
      if (updatedResponse.success) {
        setBookings(transformBookingsToIndividualTests(updatedResponse.data));
      }
    }
  };

  const resetModal = () => {
    setShowUploadModal(false);
    setSelectedFile(null);
    setSelectedBooking(null);
    setUseResultsEntry(false);
    setResultEntries({});
  };

  const filteredBookings = bookings.filter(b =>
    b.userId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.userId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.testInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    {
      header: 'Patient Info',
      accessor: 'userId',
      render: (row) => (
        <div>
          <div className="font-medium text-gray-900">{row.userId?.firstName} {row.userId?.lastName}</div>
          <div className="text-xs text-gray-500">{row.userId?.email}</div>
        </div>
      )
    },
    {
      header: 'Test Details',
      accessor: 'testInfo',
      render: (row) => (
        <div>
          <div className="flex items-center text-sm font-medium text-gray-900">
            <TestTube className="h-4 w-4 mr-1.5 text-primary-600" />
            {row.testInfo.name}
          </div>
          {row.testInfo.type === 'package' && (
            <div className="text-xs text-indigo-600 mt-0.5 ml-5">
              From: {row.testInfo.packageName}
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Date',
      accessor: 'appointmentDate',
      render: (row) => (
        <div className="text-sm text-gray-600 flex items-center">
          <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
          {new Date(row.appointmentDate).toLocaleDateString()}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      header: 'Action',
      accessor: '_id',
      render: (row) => (
        <button
          onClick={() => {
            setSelectedBooking(row);
            const initial = {};
            if (row.testInfo && Array.isArray(row.testInfo.resultFields)) {
              initial[row.testInfo.id] = row.testInfo.resultFields.map(f => ({
                label: f.label || '',
                unit: f.unit || '',
                referenceRange: f.referenceRange || '',
                type: f.type || 'text',
                required: !!f.required,
                value: f.type === 'boolean' ? false : ''
              }));
            }
            setResultEntries(initial);
            setUseResultsEntry(false);
            setShowUploadModal(true);
          }}
          className="text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-md text-xs font-medium flex items-center transition-colors shadow-sm"
        >
          <Upload className="h-3.5 w-3.5 mr-1.5" />
          Add Result
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Upload Results</h1>
        <p className="text-sm text-gray-500">Enter test results or upload report files for processing samples.</p>
      </div>

      <DashboardTable
        data={filteredBookings}
        columns={columns}
        loading={loading}
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        searchPlaceholder="Search by patient or test name..."
        emptyMessage="No pending samples found"
      />

      {/* Upload/Enty Modal */}
      {showUploadModal && selectedBooking && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-semibold text-lg text-gray-900">Add Test Results</h3>
              <button onClick={resetModal} className="p-1 hover:bg-gray-200 rounded-full">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto">
              {/* Patient & Test Summary */}
              <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-blue-900">{selectedBooking.testInfo?.name}</h4>
                    {selectedBooking.testInfo?.type === 'package' && (
                      <p className="text-xs text-blue-700">Package: {selectedBooking.testInfo.packageName}</p>
                    )}
                  </div>
                  <StatusBadge status={selectedBooking.status} className="bg-white/50" />
                </div>
                <div className="text-sm text-blue-800">
                  Patient: <span className="font-medium">{selectedBooking.userId?.firstName} {selectedBooking.userId?.lastName}</span>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                <button
                  onClick={() => setUseResultsEntry(false)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!useResultsEntry ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Upload File
                </button>
                <button
                  onClick={() => setUseResultsEntry(true)}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${useResultsEntry ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Enter Data
                </button>
              </div>

              {/* Content Based on Mode */}
              {!useResultsEntry ? (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <FileText className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm font-medium text-gray-900">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500 mt-1">PDF, JPG, PNG up to 10MB</p>
                  </div>

                  {selectedFile && (
                    <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                      <FileImage className="h-5 w-5 text-green-600 mr-3" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-900 truncate">{selectedFile.name}</p>
                        <p className="text-xs text-green-700">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.isArray(resultEntries[selectedBooking.testInfo?.id]) && resultEntries[selectedBooking.testInfo?.id].length > 0 ? (
                    <div className="space-y-3">
                      {resultEntries[selectedBooking.testInfo?.id].map((field, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                          <div className="flex justify-between mb-1">
                            <label className="text-sm font-medium text-gray-700">{field.label || 'Value'}</label>
                            {field.unit && <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded border">{field.unit}</span>}
                          </div>

                          {field.type === 'boolean' ? (
                            <select
                              value={field.value ? 'true' : 'false'}
                              onChange={(e) => {
                                const tid = selectedBooking.testInfo?.id;
                                const updated = [...resultEntries[tid]];
                                updated[idx] = { ...updated[idx], value: e.target.value === 'true' };
                                setResultEntries(prev => ({ ...prev, [tid]: updated }));
                              }}
                              className="w-full mt-1 border-gray-300 rounded-md text-sm"
                            >
                              <option value="false">Negative / No</option>
                              <option value="true">Positive / Yes</option>
                            </select>
                          ) : (
                            <input
                              type={field.type === 'number' ? 'number' : 'text'}
                              value={field.value}
                              onChange={(e) => {
                                const tid = selectedBooking.testInfo?.id;
                                const updated = [...resultEntries[tid]];
                                updated[idx] = {
                                  ...updated[idx],
                                  value: field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value
                                };
                                setResultEntries(prev => ({ ...prev, [tid]: updated }));
                              }}
                              placeholder={field.referenceRange ? `Range: ${field.referenceRange}` : 'Enter value'}
                              className="w-full mt-1 border-gray-300 rounded-md text-sm"
                            />
                          )}

                          {field.referenceRange && (
                            <div className="mt-1 flex items-center text-xs text-gray-500">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Ref Range: {field.referenceRange}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                      No predefined fields found for this test.
                      <br />Please upload a file report instead.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={resetModal} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors">
                Cancel
              </button>
              {!useResultsEntry ? (
                <button
                  onClick={handleUploadReport}
                  disabled={!selectedFile || uploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors shadow-sm"
                >
                  {uploading ? 'Uploading...' : 'Upload Report'}
                </button>
              ) : (
                <button
                  onClick={handleSubmitResults}
                  disabled={uploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors shadow-sm"
                >
                  {uploading ? 'Saving...' : 'Save Results'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadReports;
