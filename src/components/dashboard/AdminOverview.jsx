import React, { useState, useEffect } from 'react';
import {
    Users,
    Building2,
    TestTube,
    Calendar,
    DollarSign,
    TrendingUp,
    Activity,
    AlertCircle
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import api from '../../services/api';

const { adminAPI } = api;

const AdminOverview = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);
            setError(null);
            // Fetch comprehensive analytics for last 30 days
            const response = await adminAPI.getAnalytics({ period: '30' });
            if (response.success) {
                setAnalytics(response.data);
            } else {
                setError(response.message || 'Failed to fetch analytics');
            }
        } catch (err) {
            console.error('Error fetching analytics:', err);
            setError('Failed to load dashboard data.');
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#F59E0B', '#3B82F6', '#10B981', '#EF4444']; // Amber, Blue, Green, Red

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!analytics) return null;

    // Prepare Pie Chart Data (Status)
    const statusData = analytics.bookings.byStatus.map(status => ({
        name: status._id.charAt(0).toUpperCase() + status._id.slice(1),
        value: status.count
    }));

    // Prepare Trend Chart Data (Daily Bookings)
    const trendData = analytics.bookings.daily.map(day => ({
        name: new Date(day._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        bookings: day.count
    }));

    // Prepare Revenue vs Payment Method
    const revenueData = analytics.revenue.byPaymentMethod.map(method => ({
        name: method._id || 'Unspecified',
        value: method.amount
    }));

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
                    <p className="text-gray-500">Real-time insights and performance metrics</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={fetchAnalytics}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 shadow-sm transition-all"
                    >
                        <Activity className="w-4 h-4" /> Refresh
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md mb-6 animate-pulse">
                    <div className="flex">
                        <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            )}

            {/* Key Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                    title="Total Bookings"
                    value={analytics.overview.totalBookings}
                    icon={Calendar}
                    color="bg-blue-500"
                    trend={`${analytics.overview.bookingGrowth > 0 ? '+' : ''}${analytics.overview.bookingGrowth}% growth`}
                    trendColor={analytics.overview.bookingGrowth >= 0 ? 'text-green-600' : 'text-red-600'}
                />
                <StatsCard
                    title="Total Revenue"
                    value={`₹${analytics.overview.totalRevenue.toLocaleString()}`}
                    icon={DollarSign}
                    color="bg-green-500"
                    trend="Lifetime Revenue"
                    trendColor="text-gray-500"
                />
                <StatsCard
                    title="Active Users"
                    value={analytics.overview.totalUsers}
                    icon={Users}
                    color="bg-purple-500"
                    trend="Registered Patients"
                    trendColor="text-gray-500"
                />
                <StatsCard
                    title="Partner Labs"
                    value={analytics.overview.activeLabs}
                    icon={Building2}
                    color="bg-orange-500"
                    trend="Active Partners"
                    trendColor="text-gray-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Daily Booking Trend */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-gray-500" />
                        Booking Trends (Last 30 Days)
                    </h3>
                    <div className="h-72">
                        {trendData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                        cursor={{ fill: '#F3F4F6' }}
                                    />
                                    <Bar dataKey="bookings" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={30} name="Bookings" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                <Activity className="w-12 h-12 mb-2 opacity-20" />
                                <p>No booking activity in this period</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Distribution & Revenue */}
                <div className="space-y-6">
                    {/* Status Pie Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">Booking Status Distribution</h3>
                        <div className="h-64">
                            {statusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    No status data available
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Popular Tests Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="text-lg font-bold text-gray-800">Top Performing Tests</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">Test Name</th>
                                <th className="px-6 py-3">Total Bookings</th>
                                <th className="px-6 py-3">Revenue Generated</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {analytics.tests && analytics.tests.popular.length > 0 ? (
                                analytics.tests.popular.map(test => (
                                    <tr key={test._id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 font-medium text-gray-900">{test.testName}</td>
                                        <td className="px-6 py-4">{test.count}</td>
                                        <td className="px-6 py-4 font-semibold text-green-600">₹{test.revenue.toLocaleString()}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" className="px-6 py-8 text-center text-gray-400">No test data available</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const StatsCard = ({ title, value, icon: Icon, color, trend, trendColor }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            </div>
            <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
                <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
            </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
            <TrendingUp className={`h-4 w-4 mr-1 ${trendColor || 'text-green-500'}`} />
            <span className={`font-medium ${trendColor || 'text-green-500'}`}>{trend}</span>
        </div>
    </div>
);

export default AdminOverview;
