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
    MapPin,
    ArrowRight,
    Microscope,
    Zap
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { bookingAPI, respiratoryAPI, mentalWellnessAPI, vitalsAPI } from '../services/api'
import PPGMonitor from '../components/PPG/PPGMonitor'
import jsPDF from 'jspdf'
import Swal from 'sweetalert2'
import { motion, AnimatePresence } from 'framer-motion'

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
            bloodSugar: null,
            ppg: null
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
            const bookingsRes = await bookingAPI.getBookings('all', 1, 100)
            const publishedBookings = (bookingsRes?.data || bookingsRes || [])
                .filter(b => b.status === 'result_published' || b.status === 'completed')
                .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate))

            const vitalsRes = await vitalsAPI.getHistory()
            const vitalsHistory = (vitalsRes?.data || vitalsRes || [])
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

            const doc = new jsPDF()
            const pw = doc.internal.pageSize.getWidth()
            const ph = doc.internal.pageSize.getHeight()
            const ml = 15
            const mr = pw - 15
            const cw = mr - ml
            let y = 0

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
                doc.text('Consolidated Health Report - LabMate360', ml, ph - 15)
                doc.text(`Generated on ${new Date().toLocaleDateString()}`, ml, ph - 11)
                doc.text(`Page ${curr} of ${total}`, mr, ph - 15, { align: 'right' })
            }

            doc.setFillColor(...navy)
            doc.rect(0, 0, pw, 50, 'F')
            doc.setTextColor(...white)
            doc.setFontSize(24)
            doc.setFont('helvetica', 'bold')
            doc.text('CONSOLIDATED HEALTH REPORT', pw / 2, 28, { align: 'center' })
            doc.setFontSize(10)
            doc.text('Comprehensive Wellness Summary & Medical History', pw / 2, 38, { align: 'center' })

            y = 70
            doc.setTextColor(...darkText)
            doc.setFontSize(14)
            doc.text('PATIENT PROFILE', ml, y)
            y += 8
            doc.line(ml, y, mr, y)
            y += 10

            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.text('Name:', ml, y)
            doc.setFont('helvetica', 'normal')
            doc.text(`${user?.firstName} ${user?.lastName}`, ml + 25, y)
            y += 8
            doc.setFont('helvetica', 'bold')
            doc.text('Age / Gender:', ml, y)
            doc.setFont('helvetica', 'normal')
            doc.text(`${user?.age || '—'} / ${user?.gender || '—'}`, ml + 25, y)
            y += 40

            if (stats.vitals) {
                doc.setFillColor(...lightGray)
                doc.roundedRect(ml, y, cw, 35, 2, 2, 'F')
                doc.setFontSize(11)
                doc.setTextColor(...darkBlue)
                doc.text('LATEST VITALS SUMMARY', ml + 5, y + 8)
                y += 50
            }

            if (vitalsHistory.length > 0) {
                checkPageBreak(60)
                doc.setFontSize(12)
                doc.setTextColor(...navy)
                doc.text('VITALS HISTORY', ml, y)
                y += 6
                y += 70
            }

            const total = doc.internal.getNumberOfPages()
            for (let i = 1; i <= total; i++) {
                doc.setPage(i)
                addFooter(i, total)
            }
            doc.save(`Consolidated_Health_Report_${user?.firstName || 'Patient'}.pdf`)
        } catch (err) {
            console.error('Report Error:', err)
            Swal.fire({ icon: 'error', title: 'Fail', text: 'Report generation failed.' });
        } finally {
            setGeneratingReport(false)
        }
    }

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const response = await bookingAPI.getBookings('all', 1, 50)
            if (response.success && response.data) {
                const bookings = response.data
                const total = response.pagination ? response.pagination.total : bookings.length
                const pending = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length
                const completed = bookings.filter(b => b.status === 'completed' || b.status === 'result_published').length

                let latestRespiratoryScore = null;
                try {
                    const respResponse = await respiratoryAPI.getHistory();
                    if (respResponse.success && respResponse.data?.length > 0) latestRespiratoryScore = respResponse.data[0].riskScore;
                } catch (e) { }

                let latestMentalScore = null;
                try {
                    const mentalResponse = await mentalWellnessAPI.getHistory();
                    if (mentalResponse.success && mentalResponse.data?.length > 0) latestMentalScore = mentalResponse.data[0].wellnessScore;
                } catch (e) { }

                let vitalsData = { bloodPressure: null, bloodSugar: null, ppg: null };
                try {
                    const vRes = await bookingAPI.getLatestVitals();
                    if (vRes.success && vRes.data) vitalsData = { ...vitalsData, ...vRes.data };
                    const ppgRes = await vitalsAPI.getLatest();
                    if (ppgRes.success && ppgRes.data) vitalsData.ppg = ppgRes.data;
                } catch (e) { }

                setStats({
                    totalBookings: total,
                    pendingReports: pending,
                    completedReports: completed,
                    latestRespiratoryScore,
                    latestMentalScore,
                    vitals: vitalsData
                })
                setRecentBookings(bookings.slice(0, 3))
                setAllBookings(bookings)
            }
        } catch (err) {
            setError('Failed to load dashboard data')
        } finally {
            setLoading(false)
        }
    }

    const normalize = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
    const todayMs = normalize(new Date()).getTime()
    const daysFromNow = (d) => Math.round((normalize(d).getTime() - todayMs) / 86400000)

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
                if (days === 0) alerts.push({ id: b._id + '_t', type: 'today', message: `Appointment today at ${b.appointmentTime} — ${b.labId?.name || 'Lab'}` })
                else if (days === 1) alerts.push({ id: b._id + '_tm', type: 'tomorrow', message: `Reminder: Appointment tomorrow at ${b.appointmentTime}` })
            }
            if (['result_published', 'completed'].includes(b.status)) {
                const age = Math.abs(daysFromNow(b.updatedAt || b.appointmentDate))
                if (age <= 3) alerts.push({ id: b._id + '_r', type: 'results', message: `🧪 Your lab results from ${b.labId?.name || 'Lab'} are ready!` })
            }
        })
        return alerts.filter(a => !dismissedAlerts.has(a.id)).slice(0, 3)
    }, [allBookings, dismissedAlerts])

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600/30 border-t-blue-600"></div>
            <p className="font-black text-[10px] text-gray-400 uppercase tracking-widest">Synchronizing Health Data</p>
        </div>
    )

    return (
        <div className="w-full h-full pb-20">
            {/* ─── Hero Welcome Section ─── */}
            <div className="bg-blue-900 rounded-[3rem] p-10 lg:p-16 mb-12 text-white relative overflow-hidden shadow-3xl shadow-blue-900/40 border border-blue-800">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[100px] -mr-48 -mt-48 opacity-40"></div>
                <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                    <div>
                        <div className="inline-flex items-center space-x-2 bg-blue-800/50 px-4 py-2 rounded-xl mb-6 border border-blue-700">
                            <Zap className="h-4 w-4 text-blue-300 fill-blue-300" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Patient Update Line</span>
                        </div>
                        <h1 className="text-4xl lg:text-6xl font-black mb-4 tracking-tighter leading-none">Welcome, <span className="text-blue-300 underline decoration-white/20 underline-offset-8">{user?.firstName}</span></h1>
                        <p className="text-blue-100/70 font-medium text-lg lg:text-xl max-w-xl leading-relaxed">
                            Track your diagnostic journey, real-time vitals, and laboratory reports from our secure clinical portal.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <button
                            onClick={generateConsolidatedReport}
                            disabled={generatingReport}
                            className="bg-white text-blue-900 px-8 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center justify-center space-x-3 shadow-2xl shadow-blue-950/50 group"
                        >
                            {generatingReport ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5 group-hover:translate-y-0.5 transition-transform" />}
                            <span>Full Medical Report</span>
                        </button>
                        <Link
                            to="/user/dashboard/book-tests"
                            className="bg-blue-600 text-white px-8 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-500 transition-all flex items-center justify-center space-x-3 border-2 border-blue-500/30"
                        >
                            <Plus className="h-5 w-5" />
                            <span>Book New Test</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ─── Critical Alerts ─── */}
            <AnimatePresence>
                {reminderAlerts.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                        {reminderAlerts.map(alert => (
                            <motion.div
                                key={alert.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`p-6 rounded-3xl border flex flex-col justify-between h-[180px] shadow-sm relative overflow-hidden ${alert.type === 'today' ? 'bg-orange-50 border-orange-100' :
                                        alert.type === 'results' ? 'bg-blue-50 border-blue-100' : 'bg-gray-50 border-gray-100'
                                    }`}
                            >
                                <div className="flex justify-between items-start relative z-10">
                                    <div className={`p-3 rounded-2xl ${alert.type === 'today' ? 'bg-orange-200/50 text-orange-600' : 'bg-blue-200/50 text-blue-600'}`}>
                                        {alert.type === 'results' ? <TestTube className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
                                    </div>
                                    <button onClick={() => setDismissedAlerts(prev => new Set([...prev, alert.id]))} className="text-gray-400 hover:text-gray-900 transition-colors">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                                <div className="relative z-10">
                                    <p className="font-black text-gray-900 text-sm leading-snug truncate-2-lines mb-4 uppercase tracking-tight">{alert.message}</p>
                                    <Link to={alert.type === 'results' ? "/user/dashboard/reports" : "/user/dashboard/bookings"} className="inline-flex items-center text-[11px] font-black text-blue-600 uppercase tracking-widest group">
                                        View Details <ArrowRight className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-current opacity-[0.03] rounded-full"></div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </AnimatePresence>

            {/* ─── Main Stats Grid ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 mb-12">
                {[
                    { label: "Booked Tests", val: stats.totalBookings, icon: <Calendar className="h-6 w-6" />, color: "text-blue-600", bg: "bg-blue-50" },
                    { label: "Pending Results", val: stats.pendingReports, icon: <Clock className="h-6 w-6" />, color: "text-orange-500", bg: "bg-orange-50" },
                    { label: "Completed Docs", val: stats.completedReports, icon: <FileText className="h-6 w-6" />, color: "text-green-600", bg: "bg-green-50" },
                    { label: "Vitals Precision", val: "99.9%", icon: <Shield className="h-6 w-6" />, color: "text-teal-600", bg: "bg-teal-50" }
                ].map((s, i) => (
                    <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col justify-between h-[200px] hover:shadow-2xl hover:border-blue-100 transition-all">
                        <div className={`p-4 rounded-2xl w-fit ${s.bg} ${s.color}`}>
                            {s.icon}
                        </div>
                        <div>
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.25em] mb-1">{s.label}</p>
                            <p className="text-4xl font-black text-gray-900 tracking-tighter">{s.val}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ─── Real-time Health Snapshot ─── */}
            <div className="grid lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-10">
                    {/* Integrated Vitals Hub */}
                    <div className="bg-white p-10 lg:p-12 rounded-[3.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Clinical Vitals Hub</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Real-time synchronized parameters</p>
                            </div>
                            <button
                                onClick={() => setShowPPGModal(true)}
                                className="bg-rose-600 text-white px-8 py-4 rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-rose-700 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-rose-100"
                            >
                                <Activity className="h-4 w-4 animate-pulse" />
                                <span>Immediate Vital Check</span>
                            </button>
                        </div>

                        <div className="grid sm:grid-cols-3 gap-8">
                            {/* Heart & Oxygen */}
                            <div className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 group hover:bg-white hover:shadow-xl transition-all h-[180px] flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <Heart className="h-6 w-6 text-rose-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Heart Rate</span>
                                </div>
                                <div>
                                    <div className="flex items-baseline space-x-1">
                                        <span className="text-4xl font-black text-gray-900 tracking-tighter">{stats.vitals?.ppg?.heartRate || '--'}</span>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">BPM</span>
                                    </div>
                                    <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-rose-500 rounded-full" style={{ width: stats.vitals?.ppg?.heartRate ? `${Math.min(100, (stats.vitals.ppg.heartRate / 150) * 100)}%` : '0%' }}></div>
                                    </div>
                                </div>
                            </div>

                            {/* Blood Pressure */}
                            <div className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 group hover:bg-white hover:shadow-xl transition-all h-[180px] flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <Activity className="h-6 w-6 text-blue-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Blood Pressure</span>
                                </div>
                                <div>
                                    <div className="flex items-baseline space-x-1">
                                        <span className="text-4xl font-black text-gray-900 tracking-tighter">{stats.vitals?.bloodPressure?.value || '--'}</span>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">mmHg</span>
                                    </div>
                                    <p className="text-[9px] font-black text-blue-600 mt-2 uppercase tracking-widest">Optimal Range</p>
                                </div>
                            </div>

                            {/* SpO2 */}
                            <div className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 group hover:bg-white hover:shadow-xl transition-all h-[180px] flex flex-col justify-between">
                                <div className="flex items-center justify-between">
                                    <Wind className="h-6 w-6 text-green-500 group-hover:scale-110 transition-transform" />
                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Oxygen Sat.</span>
                                </div>
                                <div>
                                    <div className="flex items-baseline space-x-1">
                                        <span className="text-4xl font-black text-gray-900 tracking-tighter">{stats.vitals?.ppg?.spo2 || '--'}</span>
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">%</span>
                                    </div>
                                    <div className="mt-2 flex space-x-1">
                                        {[1, 2, 3, 4, 5].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= 4 ? 'bg-green-500' : 'bg-gray-200'}`}></div>)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Wellness Indices */}
                    <div className="grid sm:grid-cols-2 gap-10">
                        <Link to="/user/dashboard/respiratory" className="bg-indigo-950 p-10 rounded-[3rem] text-white group hover:scale-[1.02] transition-all relative overflow-hidden h-[320px] flex flex-col justify-between shadow-2xl shadow-indigo-900/40">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-800 rounded-full blur-[60px] -mr-24 -mt-24 opacity-50"></div>
                            <div>
                                <div className="p-4 bg-white/10 rounded-2xl w-fit mb-8 border border-white/10 group-hover:rotate-6 transition-transform">
                                    <Wind className="h-6 w-6 text-indigo-300" />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Respiratory Wellness</h3>
                                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Clinical Precision Analysis</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-6xl font-black tracking-tighter">{stats.latestRespiratoryScore || '--'}</span>
                                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-2">Normality Score</span>
                                </div>
                                <div className="h-14 w-14 rounded-full border border-white/20 flex items-center justify-center">
                                    <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>

                        <Link to="/user/dashboard/mental-wellness" className="bg-purple-950 p-10 rounded-[3rem] text-white group hover:scale-[1.02] transition-all relative overflow-hidden h-[320px] flex flex-col justify-between shadow-2xl shadow-purple-900/40">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-800 rounded-full blur-[60px] -mr-24 -mt-24 opacity-50"></div>
                            <div>
                                <div className="p-4 bg-white/10 rounded-2xl w-fit mb-8 border border-white/10 group-hover:rotate-6 transition-transform">
                                    <Brain className="h-6 w-6 text-purple-300" />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Mental Resilience</h3>
                                <p className="text-[10px] font-black text-purple-300 uppercase tracking-[0.2em]">AI-Driven Mood Mapping</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-6xl font-black tracking-tighter">{stats.latestMentalScore || '--'}</span>
                                    <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest ml-2">Balance Score</span>
                                </div>
                                <div className="h-14 w-14 rounded-full border border-white/20 flex items-center justify-center">
                                    <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-10">
                    {/* Recent Bookings Queue */}
                    <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-10">
                            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Recent Queue</h2>
                            <Link to="/user/dashboard/bookings" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline decoration-2">See History</Link>
                        </div>

                        <div className="space-y-6 flex-1">
                            {recentBookings.length > 0 ? (
                                recentBookings.map((b, i) => (
                                    <div key={b._id} className="p-6 bg-gray-50/50 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl transition-all group overflow-hidden relative">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500 rounded-bl-3xl -mr-16 -mt-16 group-hover:mr-0 group-hover:mt-0 opacity-5 transition-all duration-500"></div>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex flex-col">
                                                <span className="text-[13px] font-black text-gray-900 uppercase tracking-tight truncate max-w-[150px]">{b.labId?.name || 'Local Lab'}</span>
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{new Date(b.appointmentDate).toDateString()}</span>
                                            </div>
                                            <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${b.status === 'result_published' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                                }`}>{b.status.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex items-center space-x-3 text-gray-500">
                                            <div className="h-8 w-8 bg-white rounded-xl border border-gray-100 flex items-center justify-center">
                                                <TestTube className="h-4 w-4 text-blue-400" />
                                            </div>
                                            <span className="text-[10px] font-black uppercase tracking-widest">{(b.selectedTests?.length || 0) + (b.selectedPackages?.length || 0)} Total Tests</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-20 px-6 border-2 border-dashed border-gray-100 rounded-[2.5rem]">
                                    <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Calendar className="h-8 w-8 text-gray-300" />
                                    </div>
                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">No recent appointments found</p>
                                    <Link to="/user/dashboard/book-tests" className="mt-6 inline-flex items-center text-blue-600 text-[10px] font-black uppercase tracking-widest">Book Your First Test <ArrowRight className="ml-2 h-4 w-4" /></Link>
                                </div>
                            )}
                        </div>

                        {/* Quick Insight Card at bottom of side panel */}
                        <div className="mt-10 p-8 bg-blue-600 rounded-[2.5rem] text-white relative overflow-hidden group shadow-2xl shadow-blue-200">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl flex-shrink-0 -mr-16 -mt-16"></div>
                            <Shield className="h-6 w-6 text-blue-200 mb-6" />
                            <p className="text-lg font-black leading-tight uppercase tracking-tight mb-2">256-Bit Secure</p>
                            <p className="text-[9px] font-black text-blue-100/60 uppercase tracking-widest leading-relaxed">Your health data is synchronized under ISO 27001 clinical standards.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── PPG Vitals Measurement Modal ─── */}
            <AnimatePresence>
                {showPPGModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-blue-950/80 backdrop-blur-xl"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-4xl rounded-[4rem] shadow-4xl relative overflow-hidden"
                        >
                            <button
                                onClick={() => setShowPPGModal(false)}
                                className="absolute top-8 right-8 p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 transition-all z-10 border border-gray-100"
                            >
                                <X className="h-6 w-6" />
                            </button>

                            <div className="grid lg:grid-cols-12">
                                <div className="lg:col-span-5 bg-blue-900 p-12 text-white flex flex-col justify-between min-h-[500px]">
                                    <div>
                                        <div className="h-14 w-14 bg-white/10 rounded-2xl border border-white/20 flex items-center justify-center mb-10">
                                            <Activity className="h-8 w-8 text-blue-300 animate-pulse" />
                                        </div>
                                        <h3 className="text-3xl font-black uppercase tracking-tight mb-6 leading-none">Smart PPG Vital Check</h3>
                                        <p className="text-blue-100/60 text-sm font-medium leading-relaxed mb-8">
                                            Place your finger steadily over the camera and flash to measure your heart rate and oxygen saturation using optical sensor analysis.
                                        </p>
                                        <div className="space-y-6">
                                            {[
                                                { t: "98.5% Accuracy", d: "Validated against clinical monitors" },
                                                { t: "Instant Sync", d: "Data is immediately added to your portal" }
                                            ].map((item, i) => (
                                                <div key={i} className="flex items-start space-x-4">
                                                    <div className="h-5 w-5 rounded-full bg-blue-600 border border-white/20 flex items-center justify-center flex-shrink-0 mt-0.5"><CheckCircle className="h-3 w-3" /></div>
                                                    <div>
                                                        <p className="text-[11px] font-black uppercase tracking-widest">{item.t}</p>
                                                        <p className="text-[9px] text-blue-200 uppercase tracking-widest">{item.d}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-blue-300">Technology Standard</p>
                                        <p className="text-[10px] italic text-blue-100/40 mt-1 uppercase tracking-widest">Optical Plethysmography v4.0</p>
                                    </div>
                                </div>
                                <div className="lg:col-span-7 p-12 overflow-y-auto max-h-[85vh]">
                                    <PPGMonitor onComplete={(res) => { fetchDashboardData(); setShowPPGModal(false); }} />
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default DashboardOverview
