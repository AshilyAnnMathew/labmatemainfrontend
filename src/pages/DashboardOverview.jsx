import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    Activity,
    Calendar,
    FileText,
    Clock,
    Plus,
    Upload,
    ChevronRight,
    TrendingUp,
    AlertCircle,
    Wind
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { bookingAPI, respiratoryAPI } from '../services/api'

const DashboardOverview = () => {
    const { user } = useAuth()
    const [stats, setStats] = useState({
        totalBookings: 0,
        pendingReports: 0,
        completedReports: 0,
        latestRespiratoryScore: null
    })
    const [recentBookings, setRecentBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            // Fetch all bookings to calculate stats
            const response = await bookingAPI.getBookings('all', 1, 50) // Fetching decent amount for stats

            if (response.success && response.data) {
                const bookings = response.data

                // Calculate stats
                const total = response.pagination ? response.pagination.total : bookings.length
                const pending = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length
                const completed = bookings.filter(b => b.status === 'completed').length

                // Fetch Respiratory Data
                let latestRespiratoryScore = null;
                try {
                    const respResponse = await respiratoryAPI.getHistory();
                    if (respResponse.success && respResponse.data && respResponse.data.length > 0) {
                        latestRespiratoryScore = respResponse.data[0].riskScore;
                    }
                } catch (e) {
                    console.error("Failed to fetch respiratory stats", e);
                }

                setStats({
                    totalBookings: total,
                    pendingReports: pending,
                    completedReports: completed,
                    latestRespiratoryScore
                })

                // Get recent 3 bookings
                setRecentBookings(bookings.slice(0, 3))
            }
        } catch (err) {
            console.error('Error fetching dashboard data:', err)
            setError('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good Morning'
        if (hour < 18) return 'Good Afternoon'
        return 'Good Evening'
    }

    return (
        <div className="w-full h-full">
            {/* Welcome Section */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">
                    {getGreeting()}, {user?.firstName || 'User'}!
                </h1>
                <p className="text-gray-500 mt-1">Here's what's happening with your health reports today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
                    <div className="p-3 bg-blue-50 rounded-xl mr-4">
                        <Calendar className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Bookings</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
                    <div className="p-3 bg-amber-50 rounded-xl mr-4">
                        <Clock className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Pending Reports</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.pendingReports}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center">
                    <div className="p-3 bg-green-50 rounded-xl mr-4">
                        <FileText className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Completed Reports</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.completedReports}</p>
                    </div>
                </div>

                <Link to="/user/dashboard/respiratory" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:border-blue-200 transition-colors">
                    <div className="p-3 bg-indigo-50 rounded-xl mr-4">
                        <Wind className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Respiratory Score</p>
                        <p className={`text-2xl font-bold ${stats.latestRespiratoryScore >= 75 ? 'text-green-600' :
                                stats.latestRespiratoryScore >= 40 ? 'text-yellow-600' : 'text-gray-900'
                            }`}>
                            {stats.latestRespiratoryScore !== null ? stats.latestRespiratoryScore : 'N/A'}
                        </p>
                    </div>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-5 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Activity className="h-5 w-5 mr-2 text-primary-600" />
                                Recent Activity
                            </h2>
                            <Link to="/user/dashboard/bookings" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                                View All
                            </Link>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {recentBookings.length > 0 ? (
                                recentBookings.map((booking) => (
                                    <div key={booking._id} className="p-6 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-start space-x-4">
                                                <div className={`p-2 rounded-lg ${booking.status === 'completed' ? 'bg-green-50 text-green-600' :
                                                    booking.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                                                        'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    <Calendar className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {booking.testIds?.length > 0
                                                            ? `${booking.testIds.length} Tests`
                                                            : booking.packageId
                                                                ? 'Health Package'
                                                                : 'Laboratory Test'}
                                                    </p>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {booking.labId?.name || 'Unknown Lab'}
                                                    </p>
                                                    <p className="text-xs text-gray-400 mt-1">
                                                        {new Date(booking.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                {booking.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <p>No recent activity found.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                        <div className="space-y-3">
                            <Link
                                to="/user/dashboard/book-tests"
                                className="flex items-center p-4 rounded-xl border border-gray-100 hover:border-primary-100 hover:bg-primary-50 transition-all group"
                            >
                                <div className="p-2 bg-primary-100 rounded-lg text-primary-600 group-hover:bg-white group-hover:shadow-sm">
                                    <Plus className="h-5 w-5" />
                                </div>
                                <div className="ml-4">
                                    <p className="font-medium text-gray-900">Book New Test</p>
                                    <p className="text-xs text-gray-500">Find nearby labs</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-300 ml-auto group-hover:text-primary-500" />
                            </Link>

                            <Link
                                to="/user/dashboard/upload-prescription"
                                className="flex items-center p-4 rounded-xl border border-gray-100 hover:border-blue-100 hover:bg-blue-50 transition-all group"
                            >
                                <div className="p-2 bg-blue-100 rounded-lg text-blue-600 group-hover:bg-white group-hover:shadow-sm">
                                    <Upload className="h-5 w-5" />
                                </div>
                                <div className="ml-4">
                                    <p className="font-medium text-gray-900">Upload Prescription</p>
                                    <p className="text-xs text-gray-500">Book via prescription</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-300 ml-auto group-hover:text-blue-500" />
                            </Link>
                        </div>

                        {/* Health Tip */}
                        <div className="mt-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
                            <div className="flex items-start">
                                <TrendingUp className="h-5 w-5 text-green-600 mt-0.5 mr-2" />
                                <div>
                                    <h3 className="font-medium text-green-900 text-sm">Health Tip of the Day</h3>
                                    <p className="text-xs text-green-700 mt-1 leading-relaxed">
                                        Regular health checkups can identify potential health issues before they become a problem.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default DashboardOverview
