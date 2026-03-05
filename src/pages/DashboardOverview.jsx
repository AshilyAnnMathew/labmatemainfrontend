import React, { useState, useEffect, useMemo } from 'react'
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
    X,
    Download,
    Shield,
    Beaker,
    Loader2,
    Bell,
    TestTube,
    AlertTriangle,
    CheckCircle,
    MapPin
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { bookingAPI, respiratoryAPI, mentalWellnessAPI, vitalsAPI } from '../services/api'
import PPGMonitor from '../components/PPG/PPGMonitor'
import jsPDF from 'jspdf'
import Swal from 'sweetalert2'

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
    const [allBookings, setAllBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [showPPGModal, setShowPPGModal] = useState(false)
    const [generatingReport, setGeneratingReport] = useState(false)
    const [dismissedAlerts, setDismissedAlerts] = useState(new Set())

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const generateConsolidatedReport = async () => {
        try {
            setGeneratingReport(true)

            // 1. Fetch all bookings with published results
            const bookingsRes = await bookingAPI.getBookings('all', 1, 100)
            const publishedBookings = (bookingsRes?.data || bookingsRes || [])
                .filter(b => b.status === 'result_published' || b.status === 'completed')
                .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))

            // 2. Fetch all vitals history
            const vitalsRes = await vitalsAPI.getHistory()
            const vitalsHistory = (vitalsRes?.data || vitalsRes || [])
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

            // 3. Generate PDF
            const doc = new jsPDF()
            const pw = doc.internal.pageSize.getWidth()
            const ph = doc.internal.pageSize.getHeight()
            const ml = 15
            const mr = pw - 15
            const cw = mr - ml
            let y = 0

            // Colors
            const navy = [21, 55, 96]
            const darkBlue = [30, 64, 175]
            const teal = [13, 148, 136]
            const lightGray = [248, 250, 252]
            const medGray = [229, 231, 235]
            const darkText = [31, 41, 55]
            const red = [220, 38, 38]
            const white = [255, 255, 255]

            const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
            const formatDateTime = (d) => new Date(d).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

            const isAbnormal = (val, rangeStr) => {
                if (!val || !rangeStr || isNaN(val)) return false
                const parts = rangeStr.replace(/\s/g, '').split('-')
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                    const numVal = parseFloat(val), lo = parseFloat(parts[0]), hi = parseFloat(parts[1])
                    return numVal < lo || numVal > hi
                }
                return false
            }

            const checkPageBreak = (needed = 30) => {
                if (y > ph - needed - 20) {
                    doc.addPage()
                    y = 20
                    return true
                }
                return false
            }

            const addFooter = (curr, total) => {
                doc.setDrawColor(...medGray)
                doc.setLineWidth(0.3)
                doc.line(ml, ph - 20, mr, ph - 20)
                doc.setFontSize(7)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(156, 163, 175)
                doc.text('Consolidated Health Report - LabMate360', ml, ph - 15)
                doc.text(`Generated on ${new Date().toLocaleDateString()}`, ml, ph - 11)
                doc.text(`Page ${curr} of ${total}`, mr, ph - 15, { align: 'right' })
            }

            // --- PAGE 1: COVER & PROFILE ---
            doc.setFillColor(...navy)
            doc.rect(0, 0, pw, 50, 'F')
            doc.setTextColor(...white)
            doc.setFontSize(24)
            doc.setFont('helvetica', 'bold')
            doc.text('CONSOLIDATED HEALTH REPORT', pw / 2, 28, { align: 'center' })
            doc.setFontSize(10)
            doc.setFont('helvetica', 'normal')
            doc.text('Comprehensive Wellness Summary & Medical History', pw / 2, 38, { align: 'center' })

            doc.setFillColor(...teal)
            doc.rect(0, 50, pw, 3, 'F')

            y = 70
            doc.setTextColor(...darkText)
            doc.setFontSize(14)
            doc.setFont('helvetica', 'bold')
            doc.text('PATIENT PROFILE', ml, y)
            y += 8
            doc.setDrawColor(...medGray)
            doc.line(ml, y, mr, y)
            y += 10

            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.text('Name:', ml, y)
            doc.setFont('helvetica', 'normal')
            doc.text(`${user?.firstName} ${user?.lastName}`, ml + 25, y)

            doc.setFont('helvetica', 'bold')
            doc.text('Age / Gender:', ml, y + 8)
            doc.setFont('helvetica', 'normal')
            doc.text(`${user?.age || '—'} / ${user?.gender || '—'}`, ml + 25, y + 8)

            doc.setFont('helvetica', 'bold')
            doc.text('Contact:', ml, y + 16)
            doc.setFont('helvetica', 'normal')
            doc.text(`${user?.email || '—'} | ${user?.phone || '—'}`, ml + 25, y + 16)

            doc.setFont('helvetica', 'bold')
            doc.text('Address:', ml, y + 24)
            doc.setFont('helvetica', 'normal')
            const addr = user?.address || '—'
            const splitAddr = doc.splitTextToSize(addr, cw - 25)
            doc.text(splitAddr, ml + 25, y + 24)

            y += 40

            // Latest Vitals Subsection
            if (stats.vitals) {
                doc.setFillColor(...lightGray)
                doc.roundedRect(ml, y, cw, 35, 2, 2, 'F')
                doc.setFontSize(11)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(...darkBlue)
                doc.text('LATEST VITALS SUMMARY', ml + 5, y + 8)

                doc.setFontSize(9)
                doc.setTextColor(...darkText)
                doc.setFont('helvetica', 'normal')

                let vx = ml + 5
                if (stats.vitals.ppg) {
                    doc.text('Heart Rate:', vx, y + 18)
                    doc.setFont('helvetica', 'bold')
                    doc.text(`${stats.vitals.ppg.heartRate} BPM`, vx, y + 24)
                    doc.setFont('helvetica', 'normal')
                    vx += 40
                    doc.text('SpO2:', vx, y + 18)
                    doc.setFont('helvetica', 'bold')
                    doc.text(`${stats.vitals.ppg.spo2}%`, vx, y + 24)
                    doc.setFont('helvetica', 'normal')
                    vx += 35
                }
                if (stats.vitals.bloodPressure) {
                    doc.text('Blood Pressure:', vx, y + 18)
                    doc.setFont('helvetica', 'bold')
                    doc.text(`${stats.vitals.bloodPressure.value}`, vx, y + 24)
                    doc.setFont('helvetica', 'normal')
                    vx += 45
                }
                if (stats.vitals.bloodSugar) {
                    doc.text('Blood Sugar:', vx, y + 18)
                    doc.setFont('helvetica', 'bold')
                    doc.text(`${stats.vitals.bloodSugar.value}`, vx, y + 24)
                    doc.setFont('helvetica', 'normal')
                }
            }

            y += 50

            // --- VITALS HISTORY TABLE ---
            if (vitalsHistory.length > 0) {
                checkPageBreak(60)
                doc.setFontSize(12)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(...navy)
                doc.text('VITALS HISTORY', ml, y)
                y += 6

                // Header
                doc.setFillColor(...medGray)
                doc.rect(ml, y, cw, 7, 'F')
                doc.setFontSize(8)
                doc.setTextColor(75, 85, 99)
                doc.text('DATE & TIME', ml + 2, y + 5)
                doc.text('HEART RATE', ml + 45, y + 5)
                doc.text('SPO2', ml + 75, y + 5)
                doc.text('BLOOD PRESSURE', ml + 100, y + 5)
                doc.text('BLOOD SUGAR', ml + 140, y + 5)
                y += 10

                doc.setFont('helvetica', 'normal')
                vitalsHistory.slice(0, 10).forEach((v, i) => {
                    checkPageBreak(10)
                    if (i % 2 === 0) {
                        doc.setFillColor(249, 250, 251)
                        doc.rect(ml, y - 4, cw, 7, 'F')
                    }
                    doc.setTextColor(...darkText)
                    doc.text(formatDateTime(v.createdAt), ml + 2, y)
                    doc.text(v.heartRate ? `${v.heartRate} BPM` : '—', ml + 45, y)
                    doc.text(v.spo2 ? `${v.spo2}%` : '—', ml + 75, y)
                    doc.text(v.bloodPressure?.value || '—', ml + 100, y)
                    doc.text(v.bloodSugar?.value || '—', ml + 140, y)
                    y += 7
                })
                y += 10
            }

            // --- TEST RESULTS ---
            if (publishedBookings.length > 0) {
                publishedBookings.forEach(b => {
                    checkPageBreak(40)
                    y += 5
                    doc.setFillColor(...navy)
                    doc.rect(ml, y, cw, 8, 'F')
                    doc.setTextColor(...white)
                    doc.setFontSize(10)
                    doc.setFont('helvetica', 'bold')
                    doc.text(`${formatDate(b.appointmentDate)} - ${b.labId?.name || 'Lab'}`, ml + 4, y + 5.5);
                    y += 12;

                    (b.testResults || []).forEach(tr => {
                        const testName = tr.testId?.name || 'Diagnostic Test';
                        checkPageBreak(30)
                        doc.setFontSize(9)
                        doc.setFont('helvetica', 'bold')
                        doc.setTextColor(...darkBlue)
                        doc.text(testName, ml + 2, y)
                        y += 5

                        if (tr.values && tr.values.length > 0) {
                            // Sub-table header
                            doc.setFillColor(243, 244, 246)
                            doc.rect(ml + 2, y, cw - 4, 6, 'F')
                            doc.setFontSize(7.5)
                            doc.setTextColor(107, 114, 128)
                            doc.text('PARAMETER', ml + 5, y + 4)
                            doc.text('RESULT', ml + 60, y + 4)
                            doc.text('UNIT', ml + 90, y + 4)
                            doc.text('REFERENCE RANGE', ml + 120, y + 4)
                            y += 9

                            doc.setFont('helvetica', 'normal')
                            tr.values.forEach(v => {
                                checkPageBreak(8)
                                const flagged = isAbnormal(v.value, v.referenceRange)
                                if (flagged) {
                                    doc.setTextColor(...red)
                                    doc.setFont('helvetica', 'bold')
                                } else {
                                    doc.setTextColor(...darkText)
                                    doc.setFont('helvetica', 'normal')
                                }
                                doc.text(String(v.label || '—'), ml + 5, y)
                                doc.text(String(v.value || '—'), ml + 60, y)
                                doc.setTextColor(107, 114, 128)
                                doc.setFont('helvetica', 'normal')
                                doc.text(String(v.unit || '—'), ml + 90, y)
                                doc.text(String(v.referenceRange || '—'), ml + 120, y)
                                y += 6
                            })
                            y += 4
                        }

                        if (tr.findings) {
                            checkPageBreak(20)
                            doc.setFontSize(8)
                            doc.setFont('helvetica', 'bold')
                            doc.setTextColor(...teal)
                            doc.text('Findings:', ml + 5, y)
                            y += 4
                            doc.setFont('helvetica', 'normal')
                            doc.setTextColor(...darkText)
                            const findingsLines = doc.splitTextToSize(tr.findings, cw - 20)
                            doc.text(findingsLines, ml + 5, y)
                            y += (findingsLines.length * 4) + 4
                        }
                    })
                    y += 5
                })
            } else {
                y += 10
                doc.setFontSize(10)
                doc.setFont('helvetica', 'italic')
                doc.setTextColor(156, 163, 175)
                doc.text('No published lab results found to include in the report.', ml, y)
            }

            // Footer numbering
            const total = doc.internal.getNumberOfPages()
            for (let i = 1; i <= total; i++) {
                doc.setPage(i)
                addFooter(i, total)
            }

            doc.save(`Consolidated_Health_Report_${user?.firstName || 'Patient'}.pdf`)

        } catch (err) {
            console.error('Report Generation Error:', err)
            Swal.fire({ icon: 'error', title: 'Report Generation Failed', text: 'Failed to generate the report. Please try again.', confirmButtonColor: '#ef4444' });
        } finally {
            setGeneratingReport(false)
        }
    }
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
                const completed = bookings.filter(b => b.status === 'completed' || b.status === 'result_published').length

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
                setAllBookings(bookings)
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

    // ─── All hooks must be declared before any early returns ───

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good Morning'
        if (hour < 18) return 'Good Afternoon'
        return 'Good Evening'
    }

    // ─── Date helpers ───
    const normalize = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
    const todayMs = normalize(new Date()).getTime()
    const daysFromNow = (d) => Math.round((normalize(d).getTime() - todayMs) / 86400000)

    // ─── Computed upcoming/reminder data ───
    const upcomingBookings = useMemo(() => {
        return allBookings
            .filter(b => {
                const days = daysFromNow(b.appointmentDate)
                return days >= 0 && ['pending', 'confirmed', 'sample_collected'].includes(b.status)
            })
            .sort((a, b) => new Date(a.appointmentDate) - new Date(b.appointmentDate))
    }, [allBookings])

    const reminderAlerts = useMemo(() => {
        const alerts = []
        allBookings.forEach(b => {
            const days = daysFromNow(b.appointmentDate)
            if (['pending', 'confirmed'].includes(b.status)) {
                if (days === 0) {
                    alerts.push({ id: b._id + '_today', type: 'today', booking: b, message: `You have an appointment today at ${b.appointmentTime} — ${b.labId?.name || 'Lab'}` })
                } else if (days === 1) {
                    alerts.push({ id: b._id + '_tomorrow', type: 'tomorrow', booking: b, message: `Reminder: Appointment tomorrow at ${b.appointmentTime} — ${b.labId?.name || 'Lab'}` })
                } else if (days === 2) {
                    alerts.push({ id: b._id + '_2days', type: 'upcoming', booking: b, message: `Upcoming appointment in 2 days at ${b.labId?.name || 'Lab'}` })
                }
            }
            if (days < 0 && b.status === 'confirmed') {
                alerts.push({ id: b._id + '_missed', type: 'missed', booking: b, message: `You missed your appointment on ${new Date(b.appointmentDate).toLocaleDateString()} at ${b.labId?.name || 'Lab'}. Please reschedule.` })
            }
            if (['result_published', 'completed'].includes(b.status)) {
                const publishedDaysAgo = Math.abs(daysFromNow(b.updatedAt || b.appointmentDate))
                if (publishedDaysAgo <= 3) {
                    alerts.push({ id: b._id + '_results', type: 'results', booking: b, message: `🧪 Your lab results from ${b.labId?.name || 'Lab'} are ready to view!` })
                }
            }
        })
        return alerts.filter(a => !dismissedAlerts.has(a.id)).slice(0, 4)
    }, [allBookings, dismissedAlerts])

    const dismissAlert = (id) => setDismissedAlerts(prev => new Set([...prev, id]))

    const alertStyle = (type) => {
        switch (type) {
            case 'today': return 'bg-gradient-to-r from-blue-600 to-blue-700 text-white border-blue-700'
            case 'tomorrow': return 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600'
            case 'upcoming': return 'bg-gradient-to-r from-violet-500 to-purple-600 text-white border-purple-600'
            case 'missed': return 'bg-gradient-to-r from-red-500 to-rose-600 text-white border-red-600'
            case 'results': return 'bg-gradient-to-r from-emerald-500 to-green-600 text-white border-green-600'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const alertIcon = (type) => {
        switch (type) {
            case 'today': return <Bell className="h-4 w-4 flex-shrink-0 animate-bounce" />
            case 'tomorrow': return <Clock className="h-4 w-4 flex-shrink-0" />
            case 'upcoming': return <Calendar className="h-4 w-4 flex-shrink-0" />
            case 'missed': return <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            case 'results': return <CheckCircle className="h-4 w-4 flex-shrink-0" />
        }
    }

    // ─── Early return for loading (after all hooks) ───
    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        )
    }

    return (
        <div className="w-full h-full relative">
            {/* Welcome Section */}
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    {getGreeting()}, {user?.firstName || 'User'}!
                </h1>
                <p className="text-gray-500 mt-1">Here's what's happening with your health reports today.</p>
            </div>

            {/* ─── Reminder / Notification Banners ─── */}
            {reminderAlerts.length > 0 && (
                <div className="space-y-2 mb-6">
                    {reminderAlerts.map(alert => (
                        <div
                            key={alert.id}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-sm ${alertStyle(alert.type)}`}
                        >
                            {alertIcon(alert.type)}
                            <span className="text-sm font-medium flex-1">{alert.message}</span>
                            <div className="flex items-center gap-2 ml-2">
                                {(alert.type === 'results') && (
                                    <Link
                                        to="/user/dashboard/download-reports"
                                        className="text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg font-semibold transition-colors"
                                    >
                                        View Results
                                    </Link>
                                )}
                                {(alert.type === 'missed') && (
                                    <Link
                                        to="/user/dashboard/book-tests"
                                        className="text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg font-semibold transition-colors"
                                    >
                                        Book Again
                                    </Link>
                                )}
                                {(alert.type === 'today') && (
                                    <Link
                                        to="/user/dashboard/bookings"
                                        className="text-xs bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg font-semibold transition-colors"
                                    >
                                        View Booking
                                    </Link>
                                )}
                                <button
                                    onClick={() => dismissAlert(alert.id)}
                                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

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
                {/* Recent Activity + Upcoming */}
                <div className="lg:col-span-2 space-y-5">

                    {/* ─── Upcoming Appointments ─── */}
                    {upcomingBookings.length > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
                                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Calendar className="h-4 w-4 text-blue-600" />
                                    </div>
                                    Upcoming Appointments
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                        {upcomingBookings.length}
                                    </span>
                                </h2>
                                <Link to="/user/dashboard/bookings" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                    View All <ChevronRight className="h-3.5 w-3.5" />
                                </Link>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {upcomingBookings.slice(0, 4).map(b => {
                                    const days = daysFromNow(b.appointmentDate)
                                    const testCount = (b.selectedTests || []).length + (b.selectedPackages || []).length
                                    return (
                                        <div key={b._id} className={`px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50/80 transition-colors ${days === 0 ? 'bg-blue-50/40 border-l-4 border-l-blue-500' : days === 1 ? 'border-l-4 border-l-amber-400' : ''}`}>
                                            {/* Date Column */}
                                            <div className={`w-14 flex-shrink-0 text-center rounded-xl py-2 ${days === 0 ? 'bg-blue-600 text-white' : days === 1 ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}`}>
                                                <div className="text-xs font-semibold uppercase">{new Date(b.appointmentDate).toLocaleDateString('en-US', { month: 'short' })}</div>
                                                <div className="text-xl font-bold leading-tight">{new Date(b.appointmentDate).toLocaleDateString('en-US', { day: '2-digit' })}</div>
                                            </div>
                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-semibold text-gray-900 truncate">{b.labId?.name || 'Laboratory'}</p>
                                                    {days === 0 && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold animate-pulse">TODAY</span>}
                                                    {days === 1 && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">TOMORROW</span>}
                                                    {days > 1 && <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">In {days} days</span>}
                                                </div>
                                                <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{b.appointmentTime}</span>
                                                    <span className="flex items-center gap-1"><TestTube className="h-3 w-3" />{testCount} test{testCount !== 1 ? 's' : ''}</span>
                                                    {b.labId?.address && <span className="flex items-center gap-1 truncate"><MapPin className="h-3 w-3 flex-shrink-0" />{b.labId.address}</span>}
                                                </div>
                                            </div>
                                            {/* Status */}
                                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0 ${b.status === 'confirmed' ? 'bg-green-100 text-green-700'
                                                : b.status === 'pending' ? 'bg-yellow-100 text-yellow-700'
                                                    : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {b.status}
                                            </span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* ─── Recent Activity ─── */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                    <Activity className="h-4 w-4 text-gray-600" />
                                </div>
                                Recent Activity
                            </h2>
                            <Link to="/user/dashboard/bookings" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
                                View All <ChevronRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {recentBookings.length > 0 ? (
                                recentBookings.map((booking) => (
                                    <div key={booking._id} className="p-5 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-start space-x-3">
                                                <div className={`p-2 rounded-lg ${booking.status === 'completed' || booking.status === 'result_published' ? 'bg-green-50 text-green-600' :
                                                    booking.status === 'cancelled' ? 'bg-red-50 text-red-600' :
                                                        'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    <Calendar className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">
                                                        {booking.testIds?.length > 0
                                                            ? `${booking.testIds.length} Tests`
                                                            : booking.packageId
                                                                ? 'Health Package'
                                                                : 'Laboratory Test'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{booking.labId?.name || 'Unknown Lab'}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{new Date(booking.appointmentDate || booking.createdAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${booking.status === 'completed' || booking.status === 'result_published' ? 'bg-green-100 text-green-800' :
                                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                {booking.status === 'result_published' ? 'Results Ready' : booking.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center text-gray-500">
                                    <div className="h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <Calendar className="h-6 w-6 text-gray-300" />
                                    </div>
                                    <p className="text-sm font-medium">No bookings yet</p>
                                    <p className="text-xs text-gray-400 mt-1">Book your first lab test to get started</p>
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

                            <button
                                onClick={generateConsolidatedReport}
                                disabled={generatingReport}
                                className="w-full flex items-center p-4 rounded-xl border border-gray-100 hover:border-emerald-100 hover:bg-emerald-50 transition-all group"
                            >
                                <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 group-hover:bg-white group-hover:shadow-sm">
                                    {generatingReport ? <Loader2 className="h-5 h-5 animate-spin" /> : <Download className="h-5 w-5" />}
                                </div>
                                <div className="ml-4 text-left">
                                    <p className="font-medium text-gray-900">Health Report</p>
                                    <p className="text-xs text-gray-500">Consolidated history PDF</p>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-300 ml-auto group-hover:text-emerald-500" />
                            </button>
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
            {
                showPPGModal && (
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
                )
            }
        </div>
    )
}

export default DashboardOverview
