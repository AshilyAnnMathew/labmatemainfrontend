import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Activity, Search, Filter, Clock, User, FileText, CheckCircle, CreditCard, RefreshCw } from 'lucide-react';
import moment from 'moment';
import Swal from 'sweetalert2';

const ActivityLog = ({ assignedLab }) => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filterAction, setFilterAction] = useState('all');

    const fetchLogs = async (pageNum = 1) => {
        try {
            setLoading(true);
            if (!assignedLab?._id) return;

            const token = localStorage.getItem('token');
            // Adding a direct fetch to the new route we built
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/audit-logs/lab/${assignedLab._id}?page=${pageNum}&limit=50&action=${filterAction}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                setLogs(data.data);
                setTotalPages(data.pagination.pages);
                setPage(data.pagination.current);
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error fetching audit logs:', error);
            Swal.fire({ icon: 'error', title: 'Error', text: 'Failed to fetch activity logs.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs(1);
    }, [assignedLab, filterAction]);

    const getActionIcon = (action) => {
        switch (action) {
            case 'status_update': return <RefreshCw className="w-5 h-5 text-blue-500" />;
            case 'sample_collected': return <Activity className="w-5 h-5 text-primary-500" />;
            case 'result_entered': return <FileText className="w-5 h-5 text-amber-500" />;
            case 'report_uploaded': return <FileText className="w-5 h-5 text-indigo-500" />;
            case 'report_verified': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
            case 'payment_processed': return <CreditCard className="w-5 h-5 text-emerald-600" />;
            default: return <Activity className="w-5 h-5 text-gray-400" />;
        }
    };

    const getActionFormat = (action) => {
        return action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header section */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50 via-white to-white">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                            <Activity className="w-7 h-7 text-primary-600" />
                            Staff Activity Logs
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Audit trail of all staff actions and system modifications</p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* Filter Dropdown */}
                        <div className="relative w-full md:w-56">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Filter className="h-4 w-4 text-gray-400" />
                            </div>
                            <select
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                                className="block w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm cursor-pointer hover:bg-gray-50"
                            >
                                <option value="all">All Actions</option>
                                <option value="status_update">Status Updates</option>
                                <option value="sample_collected">Sample Collections</option>
                                <option value="result_entered">Results Entered</option>
                                <option value="report_uploaded">Reports Uploaded</option>
                                <option value="report_verified">Reports Verified</option>
                                <option value="payment_processed">Payments Processed</option>
                            </select>
                        </div>

                        <button
                            onClick={() => fetchLogs(1)}
                            disabled={loading}
                            className={`p-2.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 transition-all ${loading ? 'opacity-50' : 'active:scale-95'}`}
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-primary-500' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Log List */}
            <div className="p-0">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                            <Clock className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No Activity Found</h3>
                        <p className="text-gray-500 text-sm">No logs match your current filter criteria.</p>
                    </div>
                ) : (
                    <div className="pt-2">
                        <ul className="divide-y divide-gray-100">
                            {logs.map((log) => (
                                <li key={log._id} className="p-4 sm:px-6 hover:bg-gray-50 transition-colors duration-150">
                                    <div className="flex items-start space-x-4">
                                        <div className="flex-shrink-0 mt-1">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center">
                                                {getActionIcon(log.action)}
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-semibold text-gray-900 truncate">
                                                    {getActionFormat(log.action)}
                                                </p>
                                                <div className="flex flex-shrink-0 items-center gap-1.5 text-sm text-gray-500">
                                                    <Clock className="w-3.5 h-3.5" />
                                                    <time dateTime={log.createdAt}>{moment(log.createdAt).format('MMM D, YYYY [at] h:mm A')}</time>
                                                </div>
                                            </div>
                                            <div className="mt-1">
                                                <p className="text-sm text-gray-600 line-clamp-2">
                                                    {log.details}
                                                </p>
                                            </div>
                                            <div className="mt-2 flex items-center gap-4 text-xs font-medium text-gray-500">
                                                <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-md">
                                                    <User className="w-3.5 h-3.5 text-gray-400" />
                                                    <span>{log.performedBy ? `${log.performedBy.firstName} ${log.performedBy.lastName}` : 'System User'}</span>
                                                </div>
                                                {log.bookingId && log.bookingId.userId && (
                                                    <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-100">
                                                        <span>Patient: {log.bookingId.userId.firstName} {log.bookingId.userId.lastName}</span>
                                                    </div>
                                                )}
                                                {log.sampleId && (
                                                    <div className="flex items-center gap-1.5 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-md border border-purple-100 font-mono">
                                                        <span>{log.sampleId}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-600">
                        Page {page} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => fetchLogs(page - 1)}
                            disabled={page === 1}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => fetchLogs(page + 1)}
                            disabled={page === totalPages}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActivityLog;
