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
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
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

  // Fetch reports for the assigned lab
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

  // Filter logic
  useEffect(() => {
    let filtered = [...reports];

    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(report =>
        report.userId?.firstName?.toLowerCase().includes(lowerSearch) ||
        report.userId?.lastName?.toLowerCase().includes(lowerSearch) ||
        report.userId?.email?.toLowerCase().includes(lowerSearch) ||
        report._id?.toLowerCase().includes(lowerSearch)
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

    setFilteredReports(filtered);
  }, [reports, searchTerm, statusFilter, dateFilter]);

  const viewReportDetails = (report) => {
    setSelectedReport(report);
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
      alert('Failed to download report. Please try again.');
    }
  };

  const printReport = async (report) => {
    try {
      if (report.reportFile) {
        const blob = await api.bookingAPI.downloadReport(report._id);
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Revoke URL after a delay to allow the new window to load
        setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      } else {
        alert('No PDF report file available to print');
      }
    } catch (error) {
      console.error('Error printing report:', error);
      alert('Failed to print report. Please try again.');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
  };

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
      header: 'Tests',
      accessor: 'tests',
      render: (row) => (
        <div className="text-sm text-gray-900">
          <div className="flex items-center">
            <TestTube className="h-3.5 w-3.5 mr-1 text-primary-600" />
            {(row.selectedTests || []).length + (row.selectedPackages || []).length} items
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{formatCurrency(row.totalAmount)}</div>
        </div>
      )
    },
    {
      header: 'Files',
      accessor: 'reportFile',
      render: (row) => {
        if (row.reportFile) {
          return (
            <div className="flex items-center text-green-600 text-xs font-medium">
              <FileImage className="h-3.5 w-3.5 mr-1" /> PDF Report
            </div>
          );
        } else if (row.testResults && row.testResults.length > 0) {
          return (
            <div className="flex items-center text-indigo-600 text-xs font-medium">
              <FileText className="h-3.5 w-3.5 mr-1" /> Data Available
            </div>
          );
        } else {
          return <span className="text-xs text-gray-400">Pending</span>;
        }
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
        <div className="flex items-center gap-2">
          <button onClick={() => viewReportDetails(row)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-md" title="View Details">
            <Eye className="h-4 w-4" />
          </button>
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

  // Custom filters for DashboardTable
  const Filters = () => (
    <div className="flex gap-2">
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="border-gray-200 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500"
      >
        <option value="all">All Status</option>
        <option value="report_uploaded">Uploaded</option>
        <option value="result_published">Published</option>
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
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">View Reports</h1>
        <p className="text-sm text-gray-500">Access and manage patient test reports.</p>
      </div>

      <DashboardTable
        data={filteredReports}
        columns={columns}
        loading={loading}
        onSearch={setSearchTerm}
        searchValue={searchTerm}
        searchPlaceholder="Search reports..."
        filters={<Filters />}
        emptyMessage="No reports found"
      />

      {/* Report Details Modal */}
      {showDetailsModal && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-lg">Report Details</h3>
              <button onClick={() => setShowDetailsModal(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Patient</h4>
                  <div className="font-medium">{selectedReport.userId?.firstName} {selectedReport.userId?.lastName}</div>
                  <div className="text-sm text-gray-600">{selectedReport.userId?.email}</div>
                  <div className="text-sm text-gray-600">{selectedReport.userId?.phone}</div>
                  <div className="text-xs text-gray-500 mt-1">{selectedReport.userId?.age} yrs, {selectedReport.userId?.gender}</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Booking</h4>
                  <div className="text-sm"><span className="text-gray-500">ID:</span> {selectedReport._id}</div>
                  <div className="text-sm"><span className="text-gray-500">Date:</span> {new Date(selectedReport.appointmentDate).toLocaleDateString()}</div>
                  <div className="mt-2 flex gap-2">
                    <StatusBadge status={selectedReport.status} />
                    <StatusBadge status={selectedReport.paymentStatus} />
                  </div>
                </div>
              </div>

              {/* Tests List */}
              <div>
                <h4 className="font-medium mb-3">Tests Ordered</h4>
                <div className="border rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Test Name</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Price</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedReport.selectedTests?.map((test, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-sm">{test.testName}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatCurrency(test.price)}</td>
                        </tr>
                      ))}
                      {selectedReport.selectedPackages?.map((pkg, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 text-sm">{pkg.packageName} (Package)</td>
                          <td className="px-4 py-2 text-sm text-right">{formatCurrency(pkg.price)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-medium">
                        <td className="px-4 py-2 text-sm">Total</td>
                        <td className="px-4 py-2 text-sm text-right">{formatCurrency(selectedReport.totalAmount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Structured Test Results */}
              {selectedReport.testResults && selectedReport.testResults.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-3 text-indigo-900">Test Results (Data)</h4>
                  <div className="border border-indigo-100 rounded-lg overflow-hidden">
                    {selectedReport.testResults.map((result, idx) => (
                      <div key={idx} className="border-b border-indigo-50 last:border-0">
                        <div className="bg-indigo-50/50 px-4 py-2 text-sm font-medium text-indigo-800 flex justify-between">
                          <span>{result.testId?.name || result.testName || `Test ${idx + 1}`}</span>
                          <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
                            {result.status || 'Completed'}
                          </span>
                        </div>
                        <div className="p-0">
                          <table className="min-w-full divide-y divide-indigo-50">
                            <thead className="bg-white">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-1/3">Parameter</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-1/3">Result</th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 w-1/3">Reference Range</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                              {result.values?.map((val, vIdx) => (
                                <tr key={vIdx} className="hover:bg-gray-50/50">
                                  <td className="px-4 py-2 text-sm text-gray-700">{val.label}</td>
                                  <td className="px-4 py-2 text-sm font-medium text-gray-900">
                                    {val.value} <span className="text-gray-500 text-xs font-normal">{val.unit}</span>
                                  </td>
                                  <td className="px-4 py-2 text-sm text-gray-500 text-xs">
                                    {val.referenceRange || '-'}
                                  </td>
                                </tr>
                              ))}
                              {(!result.values || result.values.length === 0) && (
                                <tr>
                                  <td colSpan="3" className="px-4 py-2 text-sm text-gray-400 italic text-center">
                                    No detailed values recorded
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                          {result.remarks && (
                            <div className="px-4 py-2 bg-gray-50 text-xs text-gray-600 border-t border-gray-100">
                              <span className="font-medium">Remarks:</span> {result.remarks}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Report Actions */}
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
                    <button onClick={() => downloadReport(selectedReport)} className="bg-white text-green-700 pointer hover:bg-green-50 border border-green-200 px-3 py-1.5 rounded text-sm font-medium transition-colors">
                      Download
                    </button>
                    <button onClick={() => printReport(selectedReport)} className="bg-white text-gray-700 pointer hover:bg-gray-50 border border-gray-200 px-3 py-1.5 rounded text-sm font-medium transition-colors">
                      Print
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffReports;
