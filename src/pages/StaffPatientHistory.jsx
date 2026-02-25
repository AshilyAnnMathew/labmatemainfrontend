import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
    ArrowLeft, User, Phone, Mail, Calendar, Clock, Activity,
    FileText, AlertTriangle, CheckCircle, Shield, ChevronDown,
    ChevronRight, Heart, Droplets, TestTube, Package, Loader2,
    AlertCircle, Eye, Download, Beaker
} from 'lucide-react'
import { bookingAPI } from '../services/api'

const StaffPatientHistory = () => {
    const { patientId } = useParams()
    const navigate = useNavigate()
    const [patient, setPatient] = useState(null)
    const [bookings, setBookings] = useState([])
    const [vitals, setVitals] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [expandedBookings, setExpandedBookings] = useState({})
    const [expandedTests, setExpandedTests] = useState({})

    const fetchHistory = useCallback(async () => {
        try {
            setLoading(true)
            setError('')
            const res = await bookingAPI.getPatientHistory(patientId)
            const data = res?.data || res
            setPatient(data.patient)
            setBookings(data.bookings || [])
            setVitals(data.vitals || [])
        } catch (e) {
            setError(e.message || 'Failed to load patient history')
        } finally {
            setLoading(false)
        }
    }, [patientId])

    useEffect(() => { fetchHistory() }, [fetchHistory])

    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }) : '—'
    const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

    const isAbnormal = (val, rangeStr) => {
        if (!val || !rangeStr || isNaN(val)) return false
        const parts = rangeStr.replace(/\s/g, '').split('-')
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            return parseFloat(val) < parseFloat(parts[0]) || parseFloat(val) > parseFloat(parts[1])
        }
        return false
    }

    const getStatusStyle = (status) => {
        const styles = {
            result_published: 'bg-emerald-100 text-emerald-800 border-emerald-200',
            completed: 'bg-green-100 text-green-800 border-green-200',
            partially_completed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
            sample_collected: 'bg-purple-100 text-purple-800 border-purple-200',
            confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
            pending: 'bg-amber-100 text-amber-800 border-amber-200',
            cancelled: 'bg-red-100 text-red-800 border-red-200'
        }
        return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'
    }

    const getStatusLabel = (s) => {
        const labels = {
            pending: 'Pending', confirmed: 'Confirmed', sample_collected: 'Sample Collected',
            partially_completed: 'In Progress', result_published: 'Published',
            completed: 'Completed', cancelled: 'Cancelled'
        }
        return labels[s] || s
    }

    const getStatusBorderColor = (status) => {
        const colors = {
            result_published: 'border-l-emerald-500',
            completed: 'border-l-green-500',
            partially_completed: 'border-l-indigo-500',
            sample_collected: 'border-l-purple-500',
            confirmed: 'border-l-blue-500',
            pending: 'border-l-amber-500',
            cancelled: 'border-l-red-500'
        }
        return colors[status] || 'border-l-gray-400'
    }

    const getTestName = (booking, testResult) => {
        const testId = (testResult.testId?._id || testResult.testId)?.toString()
        const found = (booking.selectedTests || []).find(t => (t.testId?._id || t.testId)?.toString() === testId)
        return found?.testId?.name || found?.testName || testResult.testId?.name || 'Test'
    }

    const toggleBooking = (id) => setExpandedBookings(p => ({ ...p, [id]: !p[id] }))
    const toggleTest = (id) => setExpandedTests(p => ({ ...p, [id]: !p[id] }))

    // Stats
    const totalVisits = bookings.length
    const publishedCount = bookings.filter(b => b.status === 'result_published').length
    const totalTests = bookings.reduce((sum, b) => sum + (b.testResults?.length || 0), 0)
    const abnormalCount = bookings.reduce((sum, b) => {
        return sum + (b.testResults || []).reduce((s2, tr) => {
            return s2 + (tr.values || []).filter(v => isAbnormal(v.value, v.referenceRange)).length
        }, 0)
    }, 0)

    const latestVital = vitals.length > 0 ? vitals[0] : null

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-20">
                <Loader2 className="h-8 w-8 text-primary-600 animate-spin mb-4" />
                <p className="text-gray-500">Loading patient history...</p>
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
                    <ArrowLeft className="h-4 w-4" /> Back
                </button>
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2" /> {error}
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Patient Health History</h1>
                    <p className="text-sm text-gray-500">Complete medical records and test history</p>
                </div>
            </div>

            {/* Patient Profile Card */}
            {patient && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary-600 to-primary-800 p-5">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center">
                                <User className="h-8 w-8 text-white" />
                            </div>
                            <div className="text-white">
                                <h2 className="text-xl font-bold">{patient.firstName} {patient.lastName}</h2>
                                <div className="flex items-center gap-4 mt-1 text-primary-200 text-sm">
                                    {patient.age && <span>{patient.age} years</span>}
                                    {patient.gender && <span>• {patient.gender}</span>}
                                    {patient.dateOfBirth && <span>• DOB: {formatDate(patient.dateOfBirth)}</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{patient.phone || 'No phone'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{patient.email || 'No email'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <span>Joined: {formatDate(patient.createdAt)}</span>
                        </div>
                    </div>
                    {patient.emergencyContact && (
                        <div className="px-4 pb-4">
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                                <strong className="text-amber-800">Emergency Contact:</strong>{' '}
                                <span className="text-amber-700">
                                    {patient.emergencyContact.name} — {patient.emergencyContact.phone}
                                    {patient.emergencyContact.relation && ` (${patient.emergencyContact.relation})`}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
                    <div className="text-3xl font-bold text-primary-700">{totalVisits}</div>
                    <div className="text-xs text-gray-500 mt-1">Total Visits</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
                    <div className="text-3xl font-bold text-emerald-700">{publishedCount}</div>
                    <div className="text-xs text-gray-500 mt-1">Reports Published</div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
                    <div className="text-3xl font-bold text-indigo-700">{totalTests}</div>
                    <div className="text-xs text-gray-500 mt-1">Tests Completed</div>
                </div>
                <div className={`bg-white rounded-xl shadow-sm border p-4 text-center ${abnormalCount > 0 ? 'border-red-200' : 'border-gray-200'}`}>
                    <div className={`text-3xl font-bold ${abnormalCount > 0 ? 'text-red-700' : 'text-green-700'}`}>{abnormalCount}</div>
                    <div className="text-xs text-gray-500 mt-1">Abnormal Values</div>
                </div>
            </div>

            {/* Vitals Summary */}
            {latestVital && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Heart className="h-5 w-5 text-red-500" /> Latest Vitals
                        <span className="text-xs text-gray-400 font-normal ml-auto">{formatDateTime(latestVital.createdAt)}</span>
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {latestVital.heartRate && (
                            <div className="bg-red-50 rounded-lg p-3 border border-red-100">
                                <div className="text-xs text-red-600 font-medium">Heart Rate</div>
                                <div className="text-xl font-bold text-red-800">{latestVital.heartRate} <span className="text-xs font-normal">BPM</span></div>
                            </div>
                        )}
                        {latestVital.spo2 && (
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                                <div className="text-xs text-blue-600 font-medium">SpO2</div>
                                <div className="text-xl font-bold text-blue-800">{latestVital.spo2}<span className="text-xs font-normal">%</span></div>
                            </div>
                        )}
                        {latestVital.bloodPressure?.value && (
                            <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                                <div className="text-xs text-purple-600 font-medium">Blood Pressure</div>
                                <div className="text-xl font-bold text-purple-800">{latestVital.bloodPressure.value} <span className="text-xs font-normal">{latestVital.bloodPressure.unit}</span></div>
                            </div>
                        )}
                        {latestVital.bloodSugar?.value && (
                            <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                                <div className="text-xs text-amber-600 font-medium">Blood Sugar</div>
                                <div className="text-xl font-bold text-amber-800">{latestVital.bloodSugar.value} <span className="text-xs font-normal">{latestVital.bloodSugar.unit}</span></div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Booking History — Grid Layout */}
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                        <Activity className="h-5 w-5 text-indigo-600" /> Booking History
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{bookings.length}</span>
                    </h3>
                </div>

                {bookings.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-400">
                        <FileText className="h-10 w-10 mx-auto mb-3" />
                        <p>No bookings found for this patient at your lab.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {bookings.map((b) => {
                            const isExpanded = expandedBookings[b._id]
                            const testResults = b.testResults || []
                            const bAbnormals = testResults.reduce((s, tr) =>
                                s + (tr.values || []).filter(v => isAbnormal(v.value, v.referenceRange)).length, 0)
                            const testNames = [
                                ...(b.selectedPackages || []).map(p => p.packageId?.name || p.packageName).filter(Boolean),
                                ...(b.selectedTests || []).map(t => t.testId?.name || t.testName).filter(Boolean)
                            ]

                            return (
                                <div key={b._id} className={`bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 ${getStatusBorderColor(b.status)} overflow-hidden flex flex-col`}>
                                    {/* Card Body */}
                                    <div className="p-4 flex-1">
                                        <div className="flex items-start justify-between gap-2 mb-2">
                                            <h4 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2">
                                                {testNames.join(', ') || 'Tests'}
                                            </h4>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border whitespace-nowrap flex-shrink-0 ${getStatusStyle(b.status)}`}>
                                                {getStatusLabel(b.status)}
                                            </span>
                                        </div>

                                        {/* Badges row */}
                                        <div className="flex items-center gap-1.5 flex-wrap mb-3">
                                            {bAbnormals > 0 && (
                                                <span className="text-[10px] text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                    <AlertTriangle className="h-2.5 w-2.5" /> {bAbnormals} abnormal
                                                </span>
                                            )}
                                            {testResults.some(tr => tr.resultFile) && (
                                                <span className="text-[10px] text-teal-700 bg-teal-50 border border-teal-200 px-1.5 py-0.5 rounded-full">
                                                    📎 Imaging
                                                </span>
                                            )}
                                            {testResults.length > 0 && testResults.every(tr => tr.status === 'verified') && (
                                                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                                    <Shield className="h-2.5 w-2.5" /> All Verified
                                                </span>
                                            )}
                                        </div>

                                        {/* Info Grid */}
                                        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-gray-500">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3 text-gray-400" />
                                                <span>{formatDate(b.appointmentDate)}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3 text-gray-400" />
                                                <span>{b.appointmentTime || '—'}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Beaker className="h-3 w-3 text-gray-400" />
                                                <span>{testResults.length} result{testResults.length !== 1 ? 's' : ''}</span>
                                            </div>
                                            {b.totalAmount != null && (
                                                <div className="flex items-center gap-1 font-medium text-gray-700">
                                                    <span>₹{b.totalAmount}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Sample ID */}
                                        {b.samples?.[0]?.sampleId && (
                                            <div className="mt-2.5 text-[10px] font-mono bg-gray-50 border border-gray-100 rounded px-2 py-1 text-gray-500 inline-block">
                                                {b.samples[0].sampleId}
                                            </div>
                                        )}
                                    </div>

                                    {/* Expand / Collapse Button */}
                                    {testResults.length > 0 && (
                                        <button
                                            onClick={() => toggleBooking(b._id)}
                                            className="w-full px-4 py-2.5 border-t border-gray-100 text-xs font-medium text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1"
                                        >
                                            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                            {isExpanded ? 'Hide Results' : `View ${testResults.length} Result${testResults.length !== 1 ? 's' : ''}`}
                                        </button>
                                    )}

                                    {/* Expanded: Test Results */}
                                    {isExpanded && testResults.length > 0 && (
                                        <div className="border-t border-gray-100 bg-gray-50/60 p-3 space-y-2">
                                            {testResults.map((tr, trIdx) => {
                                                const testName = getTestName(b, tr)
                                                const trKey = `${b._id}-${tr.testId?._id || tr.testId || trIdx}`
                                                const isTestExp = expandedTests[trKey]
                                                const hasAbnormal = (tr.values || []).some(v => isAbnormal(v.value, v.referenceRange))

                                                return (
                                                    <div key={trIdx} className={`bg-white border rounded-lg overflow-hidden ${hasAbnormal ? 'border-red-200' : 'border-gray-200'}`}>
                                                        <button
                                                            onClick={() => toggleTest(trKey)}
                                                            className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-gray-50"
                                                        >
                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                {isTestExp ? <ChevronDown className="h-3 w-3 text-gray-400 flex-shrink-0" /> : <ChevronRight className="h-3 w-3 text-gray-400 flex-shrink-0" />}
                                                                <span className="text-xs font-medium text-gray-900 truncate">{testName}</span>
                                                                {tr.resultFile && <span className="text-[9px] bg-teal-100 text-teal-700 px-1 py-0.5 rounded flex-shrink-0">Imaging</span>}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                {hasAbnormal && (
                                                                    <span className="text-[9px] bg-red-100 text-red-700 px-1 py-0.5 rounded flex items-center">
                                                                        <AlertTriangle className="h-2.5 w-2.5 mr-0.5" /> !
                                                                    </span>
                                                                )}
                                                                {tr.status === 'verified' && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
                                                            </div>
                                                        </button>

                                                        {isTestExp && (
                                                            <div className="px-3 pb-2.5 border-t border-gray-100">
                                                                {tr.values && tr.values.length > 0 && (
                                                                    <table className="min-w-full mt-1.5">
                                                                        <thead>
                                                                            <tr className="border-b border-gray-100">
                                                                                <th className="text-left text-[10px] font-medium text-gray-500 py-1">Parameter</th>
                                                                                <th className="text-left text-[10px] font-medium text-gray-500 py-1">Result</th>
                                                                                <th className="text-left text-[10px] font-medium text-gray-500 py-1">Ref.</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {tr.values.map((v, vIdx) => {
                                                                                const flagged = isAbnormal(v.value, v.referenceRange)
                                                                                return (
                                                                                    <tr key={vIdx} className={`border-b border-gray-50 ${flagged ? 'bg-red-50' : ''}`}>
                                                                                        <td className="py-1 text-xs text-gray-700">{v.label}</td>
                                                                                        <td className={`py-1 text-xs font-medium ${flagged ? 'text-red-700' : 'text-gray-900'}`}>
                                                                                            {v.value} {v.unit || ''}
                                                                                            {flagged && <AlertTriangle className="h-2.5 w-2.5 inline ml-0.5 text-red-500" />}
                                                                                        </td>
                                                                                        <td className="py-1 text-[10px] text-gray-500">{v.referenceRange || '—'}</td>
                                                                                    </tr>
                                                                                )
                                                                            })}
                                                                        </tbody>
                                                                    </table>
                                                                )}

                                                                {tr.resultFile && (
                                                                    <div className="mt-1.5 bg-teal-50 border border-teal-200 rounded p-2 text-xs text-teal-800">
                                                                        <span className="font-medium">📎 {tr.resultFile.split('/').pop()}</span>
                                                                        {tr.findings && (
                                                                            <p className="mt-1 text-[11px] text-gray-600">
                                                                                <strong>Findings:</strong> {tr.findings.length > 120 ? tr.findings.substring(0, 120) + '...' : tr.findings}
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                {tr.verifiedAt && (
                                                                    <div className="mt-1.5 text-[10px] text-emerald-600 flex items-center bg-emerald-50 px-2 py-1 rounded">
                                                                        <Shield className="h-2.5 w-2.5 mr-1" /> Verified {formatDateTime(tr.verifiedAt)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default StaffPatientHistory
