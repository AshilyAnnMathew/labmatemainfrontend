import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { localAdminAPI } from '../services/api';
import { RefreshCw, Search, Filter, AlertCircle, FileStack, Calendar } from 'lucide-react';
import moment from 'moment';
import Swal from 'sweetalert2';

const SampleTrackingPanel = ({ assignedLab }) => {
    const { user } = useAuth();
    const [samples, setSamples] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const fetchActiveSamples = async () => {
        try {
            setLoading(true);
            if (!assignedLab?._id) return;

            const res = await localAdminAPI.getActiveSamples(assignedLab._id);
            if (res.success) {
                setSamples(res.data);
            } else {
                throw new Error(res.message);
            }
        } catch (error) {
            console.error('Error fetching active samples:', error);
            Swal.fire({
                icon: 'error',
                title: 'Failed to load samples',
                text: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchActiveSamples();

        // Auto-refresh every 60 seconds
        const interval = setInterval(fetchActiveSamples, 60000);
        return () => clearInterval(interval);
    }, [assignedLab]);

    // Handle derived status color mapping
    const getStatusBadge = (status) => {
        switch (status) {
            case 'processing': return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span> Processing</span>;
            case 'partially_completed': return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 shadow-sm flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Partially Completed</span>;
            case 'completed': return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200 shadow-sm flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Completed</span>;
            default: return <span className="px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200 shadow-sm">Unknown</span>;
        }
    };

    const filteredSamples = samples.filter((sample) => {
        const matchesSearch = sample.sampleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            sample.patientName.toLowerCase().includes(searchTerm.toLowerCase());
        if (!matchesSearch) return false;

        if (filter === 'all') return true;
        return sample.status === filter;
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Header section */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 via-white to-white">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                            <FileStack className="w-7 h-7 text-primary-600" />
                            Active Samples tracking
                        </h2>
                        <p className="text-gray-500 text-sm mt-1 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-emerald-500" />
                            Real-time monitor of samples progressing through tests
                        </p>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        {/* Search Input */}
                        <div className="relative flex-grow md:w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search Sample ID or Patient..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-shadow duration-200 ease-in-out"
                            />
                        </div>

                        {/* Filter Dropdown */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Filter className="h-4 w-4 text-gray-400" />
                            </div>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                                className="pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-primary-500 focus:border-primary-500 bg-white shadow-sm cursor-pointer hover:bg-gray-50 focus:outline-none transition-colors duration-200"
                            >
                                <option value="all">All Statuses</option>
                                <option value="processing">Processing</option>
                                <option value="partially_completed">Partially Completed</option>
                                <option value="completed">Completed (Pending Verification)</option>
                            </select>
                        </div>

                        {/* Refresh Button */}
                        <button
                            onClick={fetchActiveSamples}
                            disabled={loading}
                            className={`p-2.5 rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 shadow-sm ${loading ? 'opacity-50 cursor-not-allowed' : 'active:scale-95'}`}
                            title="Refresh tracking data"
                        >
                            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin text-primary-500' : ''}`} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="overflow-x-auto min-h-[400px]">
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                    </div>
                ) : filteredSamples.length === 0 ? (
                    <div className="text-center py-20 px-6">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 shadow-inner">
                            <FileStack className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No Active Samples Found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">There are currently no samples actively processing in the lab. Scan a new sample to see it here.</p>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-4 text-primary-600 hover:text-primary-800 font-medium text-sm transition-colors"
                            >
                                Clear Search
                            </button>
                        )}
                    </div>
                ) : (
                    <table className="min-w-full divide-y divide-gray-200 table-fixed">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-4 left-0 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">
                                    Sample Details
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                                    Status
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">
                                    Progress
                                </th>
                                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-40">
                                    Time Processing
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {filteredSamples.map((sample) => (
                                <tr key={sample._id} className="hover:bg-blue-50/50 transition-colors duration-150 group">
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                {sample.sampleId}
                                            </span>
                                            <span className="text-sm font-medium text-gray-600 mt-1">{sample.patientName}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        {getStatusBadge(sample.status)}
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="w-full flex items-center gap-3">
                                            <div className="flex-grow bg-gray-200 rounded-full h-2.5 overflow-hidden shadow-inner flex">
                                                <div
                                                    className={`h-2.5 rounded-full transition-all duration-1000 ease-in-out ${sample.completedTests === sample.totalTests ? 'bg-emerald-500' : 'bg-primary-500'
                                                        }`}
                                                    style={{
                                                        width: `${Math.max(5, (sample.completedTests / sample.totalTests) * 100)}%`
                                                    }}
                                                ></div>
                                            </div>
                                            <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                                                {sample.completedTests} / {sample.totalTests} Tests
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            {moment(sample.collectedAt).fromNow(true)}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                <p className="text-xs text-gray-500 italic text-right">
                    Last updated: {moment().format('h:mm:ss a')}
                </p>
            </div>
        </div>
    );
};

export default SampleTrackingPanel;
