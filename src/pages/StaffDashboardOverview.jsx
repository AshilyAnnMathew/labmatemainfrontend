import React, { useState, useEffect } from 'react';
import {
    Users,
    TestTube,
    FileText,
    AlertTriangle,
    Activity,
    Clock,
    CheckCircle,
    Calendar
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const StatCard = ({ title, value, icon: Icon, color, subtext }) => (
    <div className="bg-white rounded-xl p-6 shadow-soft border border-gray-100 flex items-start justify-between">
        <div>
            <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
            {subtext && <p className={`text-xs mt-2 ${color.text}`}>{subtext}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color.bg}`}>
            <Icon className={`h-6 w-6 ${color.icon}`} />
        </div>
    </div>
);

const StaffDashboardOverview = ({ assignedLab }) => {
    const [stats, setStats] = useState({
        totalPatientsToday: 0,
        pendingCollections: 0,
        testsInProgress: 0,
        reportsPending: 0,
        criticalResults: 0,
        recentActivity: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            if (!assignedLab?._id) return;

            try {
                setLoading(true);
                const response = await api.localAdminAPI.getDashboardStats(assignedLab._id);
                if (response.success) {
                    setStats(response.data);
                }
            } catch (err) {
                console.error('Error fetching dashboard stats:', err);
                setError('Failed to load dashboard statistics');
            } finally {
                setLoading(false);
            }
        };

        if (assignedLab) {
            fetchStats();
            // Refresh every minute
            const interval = setInterval(fetchStats, 60000);
            return () => clearInterval(interval);
        }
    }, [assignedLab]);

    if (!assignedLab) {
        return <div className="p-8 text-center text-gray-500">Loading lab information...</div>;
    }

    if (loading && !stats.totalPatientsToday) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                <p className="text-gray-500">Welcome back! Here's what's happening in the lab today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Patients Today"
                    value={stats.totalPatientsToday}
                    icon={Users}
                    color={{ bg: 'bg-blue-50', icon: 'text-blue-600', text: 'text-blue-600' }}
                    subtext="Scheduled appointments"
                />
                <StatCard
                    title="Pending Collections"
                    value={stats.pendingCollections}
                    icon={TestTube}
                    color={{ bg: 'bg-yellow-50', icon: 'text-yellow-600', text: 'text-yellow-600' }}
                    subtext="Waiting for sample collection"
                />
                <StatCard
                    title="Tests In Progress"
                    value={stats.testsInProgress}
                    icon={Activity}
                    color={{ bg: 'bg-purple-50', icon: 'text-purple-600', text: 'text-purple-600' }}
                    subtext="Samples being analyzed"
                />
                <StatCard
                    title="Reports Pending"
                    value={stats.reportsPending}
                    icon={FileText}
                    color={{ bg: 'bg-orange-50', icon: 'text-orange-600', text: 'text-orange-600' }}
                    subtext="Results waiting for upload"
                />
                <StatCard
                    title="Critical Alerts"
                    value={stats.criticalResults || 0}
                    icon={AlertTriangle}
                    color={{ bg: 'bg-red-50', icon: 'text-red-600', text: 'text-red-600' }}
                    subtext="Abnormal vitals (24h)"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-soft border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">Recent Activity</h3>
                            <Link to="/staff/dashboard?tab=all" className="text-sm text-primary-600 hover:text-primary-700 font-medium">View All</Link>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {stats.recentActivity.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No recent activity</div>
                            ) : (
                                stats.recentActivity.map((booking) => (
                                    <div key={booking._id} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${booking.status === 'confirmed' ? 'bg-green-100 text-green-600' :
                                                booking.status === 'sample_collected' ? 'bg-blue-100 text-blue-600' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {booking.userId?.firstName} {booking.userId?.lastName}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(booking.updatedAt || booking.appointmentDate).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                            booking.status === 'sample_collected' ? 'bg-blue-100 text-blue-800' :
                                                booking.status === 'report_uploaded' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {booking.status.replace('_', ' ')}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-soft border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <Link to="/staff/communication" className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-primary-200 hover:bg-primary-50 transition-all group">
                                <div className="bg-blue-100 p-2 rounded-lg mr-3 group-hover:bg-blue-200 transition-colors">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">Patient Lookup</p>
                                    <p className="text-xs text-gray-500">Search records & history</p>
                                </div>
                            </Link>

                            <Link to="/staff/dashboard?filter=confirmed" className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-primary-200 hover:bg-primary-50 transition-all group">
                                <div className="bg-yellow-100 p-2 rounded-lg mr-3 group-hover:bg-yellow-200 transition-colors">
                                    <TestTube className="h-5 w-5 text-yellow-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">Record Sample</p>
                                    <p className="text-xs text-gray-500">Mark samples as collected</p>
                                </div>
                            </Link>

                            <Link to="/staff/upload-reports" className="flex items-center p-3 rounded-lg border border-gray-200 hover:border-primary-200 hover:bg-primary-50 transition-all group">
                                <div className="bg-purple-100 p-2 rounded-lg mr-3 group-hover:bg-purple-200 transition-colors">
                                    <FileText className="h-5 w-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">Upload Result</p>
                                    <p className="text-xs text-gray-500">Add report files to bookings</p>
                                </div>
                            </Link>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl shadow-lg p-6 text-white">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-bold text-lg mb-1">New Feature</h3>
                                <p className="text-primary-100 text-sm mb-4">AI-based result validation (Beta) is now active for this lab.</p>
                                <button className="bg-white/20 hover:bg-white/30 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors backdrop-blur-sm">
                                    Learn More
                                </button>
                            </div>
                            <Activity className="h-8 w-8 text-primary-200 opacity-50" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffDashboardOverview;
