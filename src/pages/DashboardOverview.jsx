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
    Wind,
    Brain,
    Heart,
    X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { bookingAPI, respiratoryAPI, mentalWellnessAPI, vitalsAPI } from '../services/api'
import PPGMonitor from '../components/PPG/PPGMonitor'

const DashboardOverview = () => {
    const { user } = useAuth()
    const [stats, setStats] = useState({
        totalBookings: 0,
        pendingReports: 0,
        completedReports: 0,
        latestRespiratoryScore: null,
        latestMentalScore: null,
        vitals: {
            bloodPressure: null,
            bloodSugar: null
        }
    })
    const [recentBookings, setRecentBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showPPGModal, setShowPPGModal] = useState(false)

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

                // Fetch Mental Wellness Data
                let latestMentalScore = null;
                try {
                    const mentalResponse = await mentalWellnessAPI.getHistory();
                    if (mentalResponse.success && mentalResponse.data && mentalResponse.data.length > 0) {
                        latestMentalScore = mentalResponse.data[0].wellnessScore;
                    }
                } catch (e) {
                    console.error("Failed to fetch mental stats", e);
                }

                // Fetch Vitals (BP, Sugar, PPG)
                let vitalsData = { bloodPressure: null, bloodSugar: null, ppg: null };
                try {
                    const vitalsResponse = await bookingAPI.getLatestVitals();
                    if (vitalsResponse.success && vitalsResponse.data) {
                        vitalsData = { ...vitalsData, ...vitalsResponse.data };
                    }
                    // Fetch latest PPG vital
                    try {
                        const ppgResponse = await vitalsAPI.getLatest();
                        if (ppgResponse.success && ppgResponse.data) {
                            vitalsData.ppg = ppgResponse.data;
                        }
                    } catch (e) { console.error("PPG Fetch Error", e); }

                } catch (e) {
                    console.error("Failed to fetch vitals", e);
                }

                setStats({
                    totalBookings: total,
                    pendingReports: pending,
                    completedReports: completed,
                    latestRespiratoryScore: latestRespiratoryScore,
                    latestMentalScore: latestMentalScore,
                    vitals: vitalsData
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

    const handlePPGComplete = (result) => {
        // Refresh dashboard data to show new vitals
        fetchDashboardData();
        // Optional: Close modal after delay or let user close it
        // setShowPPGModal(false); 
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
        <div className="w-full h-full relative">
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

                {/* Vitals Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:col-span-3">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Recent Vitals</h2>
                        <button
                            onClick={() => setShowPPGModal(true)}
                            className="text-sm bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition flex items-center"
                        >
                            <Activity className="w-4 h-4 mr-1.5" />
                            Measure Now
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Heart Rate / SpO2 Card (PPG) */}
                        <div className="bg-rose-50 rounded-lg p-4 border border-rose-100">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-rose-700 font-medium">
                                    <Heart className="h-5 w-5" />
                                    <span>Heart Rate & SpO2</span>
                                </div>
                                {stats.vitals?.ppg?.createdAt && (
                                    <span className="text-xs text-rose-600 bg-rose-100 px-2 py-1 rounded">
                                        {new Date(stats.vitals.ppg.createdAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            <div className="mt-2">
                                {stats.vitals?.ppg ? (
                                    <div className="flex gap-4">
                                        <div>
                                            <span className="text-2xl font-bold text-gray-900">{stats.vitals.ppg.heartRate}</span>
                                            <span className="text-sm text-gray-500 ml-1">BPM</span>
                                        </div>
                                        <div className="border-l border-rose-200 pl-4">
                                            <span className="text-2xl font-bold text-gray-900">{stats.vitals.ppg.spo2}</span>
                                            <span className="text-sm text-gray-500 ml-1">%</span>
                                        </div>
                                    </div>
                                ) : (
                                    <span className="text-gray-500 text-sm">No recent measurement</span>
                                )}
                            </div>
                        </div>

                        {/* Blood Pressure Card */}
                        <div className="bg-red-50 rounded-lg p-4 border border-red-100">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-red-700 font-medium">
                                    <Activity className="h-5 w-5" />
                                    <span>Blood Pressure</span>
                                </div>
                                {stats.vitals?.bloodPressure?.date && (
                                    <span className="text-xs text-red-600 bg-red-100 px-2 py-1 rounded">
                                        {new Date(stats.vitals.bloodPressure.date).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            <div className="mt-2">
                                {stats.vitals?.bloodPressure ? (
                                    <div>
                                        <span className="text-2xl font-bold text-gray-900">{stats.vitals.bloodPressure.value}</span>
                                        <span className="text-sm text-gray-500 ml-1">{stats.vitals.bloodPressure.unit}</span>
                                    </div>
                                ) : (
                                    <span className="text-gray-500 text-sm">No recent data available</span>
                                )}
                            </div>
                        </div>

                        {/* Blood Sugar Card */}
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2 text-blue-700 font-medium">
                                    <Activity className="h-5 w-5" />
                                    <span>Blood Sugar</span>
                                </div>
                                {stats.vitals?.bloodSugar?.date && (
                                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">
                                        {new Date(stats.vitals.bloodSugar.date).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                            <div className="mt-2">
                                {stats.vitals?.bloodSugar ? (
                                    <div>
                                        <span className="text-2xl font-bold text-gray-900">{stats.vitals.bloodSugar.value}</span>
                                        <span className="text-sm text-gray-500 ml-1">{stats.vitals.bloodSugar.unit}</span>
                                        {stats.vitals.bloodSugar.type && (
                                            <div className="text-xs text-blue-600 mt-1">
                                                {stats.vitals.bloodSugar.type}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <span className="text-gray-500 text-sm">No recent data available</span>
                                )}
                            </div>
                        </div>
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

                <Link to="/user/dashboard/mental-wellness" className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:border-purple-200 transition-colors">
                    <div className="p-3 bg-purple-50 rounded-xl mr-4">
                        <Brain className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Mental Wellness</p>
                        <p className={`text-2xl font-bold ${stats.latestMentalScore >= 75 ? 'text-green-600' :
                            stats.latestMentalScore >= 50 ? 'text-yellow-600' : 'text-gray-900'
                            }`}>
                            {stats.latestMentalScore !== null ? stats.latestMentalScore : 'N/A'}
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

            {/* PPG Modal */}
            {showPPGModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden relative">
                        <button
                            onClick={() => setShowPPGModal(false)}
                            className="absolute top-3 right-3 p-1 rounded-full bg-white/80 hover:bg-gray-100 text-gray-500 z-10"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <PPGMonitor onComplete={handlePPGComplete} />
                    </div>
                </div>
            )}
        </div>
    )
}

export default DashboardOverview
