import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  FileText, Download, Eye, Calendar, TestTube, Brain, Loader2, Search,
  Lock, CreditCard, AlertCircle, Package, ChevronDown, ChevronRight,
  Shield, AlertTriangle, Clock, CheckCircle, X, Beaker
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import jsPDF from 'jspdf'
import { GoogleGenerativeAI } from '@google/generative-ai'

const DownloadReports = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [aiAnalysis, setAiAnalysis] = useState({})
  const [analyzing, setAnalyzing] = useState({})
  const [expandedTests, setExpandedTests] = useState({})
  const [showAiModal, setShowAiModal] = useState(false)
  const [currentAiBookingId, setCurrentAiBookingId] = useState(null)

  const API_KEY = 'AIzaSyAywhccPmyHxbbK_D5hhM6n7tC8PnX_El0'
  const genAI = useMemo(() => new GoogleGenerativeAI(API_KEY), [])

  // ── Data Fetching ──
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const res = await api.bookingAPI.getBookings('all', 1, 100)
      const data = res?.data || res
      const items = (data || []).filter(b => b.reportFile || (Array.isArray(b.testResults) && b.testResults.length > 0))
      setBookings(items)
    } catch (e) {
      setError(e.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (user) fetchBookings() }, [user, fetchBookings])

  // ── Helpers ──
  const formatDate = useCallback((d) => new Date(d).toLocaleDateString('en-IN', {
    year: 'numeric', month: 'short', day: 'numeric'
  }), [])

  const formatDateTime = (d) => {
    if (!d) return '—'
    return new Date(d).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const isAbnormal = (val, rangeStr) => {
    if (!val || !rangeStr) return false
    const parts = rangeStr.split('-')
    if (parts.length === 2 && !isNaN(val) && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parseFloat(val) < parseFloat(parts[0]) || parseFloat(val) > parseFloat(parts[1])
    }
    return false
  }

  const countAbnormals = (b) => {
    let count = 0
      ; (b.testResults || []).forEach(r => {
        (r.values || []).forEach(v => { if (isAbnormal(v.value, v.referenceRange)) count++ })
      })
    return count
  }

  const getDisplayName = (b) => {
    const pkgNames = (b.selectedPackages || []).map(p => p.packageName || p.packageId?.name).filter(Boolean)
    const testNames = (b.selectedTests || []).map(t => t.testName || t.testId?.name).filter(Boolean)
    if (pkgNames.length > 0 && testNames.length > 0) return pkgNames.join(', ') + ` + ${testNames.length} tests`
    if (pkgNames.length > 0) return pkgNames.join(', ')
    if (testNames.length > 0) return testNames.join(', ')
    return 'Tests'
  }

  const getStatusLabel = (b) => {
    const labels = {
      pending: 'Pending', confirmed: 'Confirmed', sample_collected: 'Sample Collected',
      partially_completed: 'In Progress', result_published: 'Results Published',
      completed: 'Completed', cancelled: 'Cancelled'
    }
    return labels[b.status] || b.status
  }

  const getStatusStyle = (status) => {
    const styles = {
      result_published: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      partially_completed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      sample_collected: 'bg-purple-100 text-purple-800 border-purple-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      pending: 'bg-amber-100 text-amber-800 border-amber-200'
    }
    return styles[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  // ── AI Analysis ──
  const analyzeResultsWithAI = useCallback(async (booking) => {
    try {
      setAnalyzing(prev => ({ ...prev, [booking._id]: true }))

      let analysisData = ''
      if (booking.testResults && booking.testResults.length > 0) {
        analysisData = 'Test Results:\n'
        booking.testResults.forEach((tr, index) => {
          const testName = booking.selectedTests?.find(t =>
            (t.testId?._id || t.testId) === (tr.testId?._id || tr.testId)
          )?.testName || 'Test'
          analysisData += `\n${index + 1}. ${testName}:\n`
          tr.values?.forEach(v => {
            analysisData += `   - ${v.label}: ${v.value} ${v.unit || ''}`
            if (v.referenceRange) analysisData += ` (Reference: ${v.referenceRange})`
            analysisData += '\n'
          })
        })
      }

      const patientInfo = `Patient: ${booking.userId?.firstName} ${booking.userId?.lastName}\nAge: ${booking.userId?.age} years\nGender: ${booking.userId?.gender}`
      const prompt = `As a medical AI assistant, analyze these lab results and provide:
1. Summary: Brief overview
2. Key Findings: Important normal or abnormal values
3. Health Insights: What these results indicate
4. Recommendations: Follow-up or lifestyle suggestions
5. Important Notes: Critical concerns needing attention

Format as plain text without markdown. Use dashes for bullet points.

Patient: ${patientInfo}\n${analysisData}\n\nProvide clear, patient-friendly analysis.`

      let analysis = ''
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
        const result = await model.generateContent(prompt)
        analysis = (await result.response).text()
      } catch {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-goog-api-key': API_KEY },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        })
        if (!response.ok) throw new Error(`API failed: ${response.status}`)
        const data = await response.json()
        analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response'
      }

      setAiAnalysis(prev => ({ ...prev, [booking._id]: analysis }))
      setCurrentAiBookingId(booking._id)
      setShowAiModal(true)
    } catch (err) {
      console.error('AI Analysis error:', err)
      setAiAnalysis(prev => ({ ...prev, [booking._id]: 'Sorry, an error occurred. Please try again later.' }))
      setCurrentAiBookingId(booking._id)
      setShowAiModal(true)
    } finally {
      setAnalyzing(prev => ({ ...prev, [booking._id]: false }))
    }
  }, [genAI])

  // ── Payment ──
  const handlePayment = async (booking) => {
    try {
      const orderResponse = await api.bookingAPI.createOrder(booking._id)
      const orderData = orderResponse.data
      const loadScript = (src) => new Promise((resolve) => {
        const script = document.createElement('script')
        script.src = src; script.onload = () => resolve(true); script.onerror = () => resolve(false)
        document.body.appendChild(script)
      })
      await loadScript('https://checkout.razorpay.com/v1/checkout.js')
      const rzp = new window.Razorpay({
        key: 'rzp_test_R79jO6N4F99QLG', amount: orderData.amount, currency: orderData.currency,
        name: 'LabMate360', description: `Payment for Report: ${booking._id}`, order_id: orderData.orderId,
        handler: async (response) => {
          try {
            await api.bookingAPI.processPayment(booking._id, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            })
            fetchBookings()
            alert('Payment Successful! Report unlocked.')
          } catch { alert('Payment verification failed.') }
        },
        prefill: { name: `${user?.firstName} ${user?.lastName}`, email: user?.email, contact: user?.phone },
        theme: { color: '#2563eb' }
      })
      rzp.open()
    } catch (err) { alert('Payment failed: ' + (err.message || 'Unknown error')) }
  }

  // ── Downloads ──
  const handleSecureDownload = async (booking) => {
    try {
      const blob = await api.bookingAPI.downloadReport(booking._id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `LabReport_${booking._id}.pdf`
      document.body.appendChild(a); a.click(); a.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) { alert('Download failed: ' + err.message) }
  }

  const downloadResultsPdf = useCallback((booking) => {
    if (booking.paymentStatus !== 'completed') { alert('Please complete payment first.'); return }
    try {
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      let y = 20

      // Header
      doc.setFillColor(59, 130, 246)
      doc.rect(0, 0, pageWidth, 40, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(28); doc.setFont('helvetica', 'bold')
      doc.text(String(booking.labId?.name || 'LABORATORY'), pageWidth / 2, 25, { align: 'center' })
      doc.setFontSize(12); doc.setFont('helvetica', 'normal')
      doc.text('Diagnostic Excellence • Trusted Results', pageWidth / 2, 35, { align: 'center' })
      doc.setTextColor(0, 0, 0); y = 50

      // Patient Info
      doc.setFillColor(248, 250, 252); doc.rect(15, y, pageWidth - 30, 35, 'F')
      doc.setDrawColor(0); doc.setLineWidth(0.5); doc.rect(15, y, pageWidth - 30, 35)
      y += 8; doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('PATIENT INFORMATION', 20, y); y += 10
      doc.setFontSize(11); doc.setFont('helvetica', 'normal')
      doc.text(`Name: ${booking.userId?.firstName || ''} ${booking.userId?.lastName || ''}`, 20, y)
      doc.text(`Age/Gender: ${booking.userId?.age || 'N/A'} / ${booking.userId?.gender || 'N/A'}`, pageWidth / 2 + 10, y); y += 6
      doc.text(`Date: ${formatDate(booking.appointmentDate)}`, 20, y)
      doc.text(`Report ID: ${booking._id}`, pageWidth / 2 + 10, y); y += 20

      // Results
      if (booking.testResults?.length > 0) {
        doc.setFontSize(16); doc.setFont('helvetica', 'bold'); doc.text('LABORATORY RESULTS', 20, y); y += 12
        const testNameById = new Map((booking.selectedTests || []).map(t => [(t.testId?._id || t.testId), t.testName]))
        booking.testResults.forEach((tr, idx) => {
          const testName = testNameById.get(tr.testId?._id || tr.testId) || 'Test'
          if (y > pageHeight - 80) { doc.addPage(); y = 20 }
          doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.text(`${idx + 1}. ${String(testName)}`, 20, y); y += 8
          doc.setFontSize(10); doc.setFont('helvetica', 'bold')
          doc.text('Parameter', 20, y); doc.text('Value', 80, y); doc.text('Unit', 120, y); doc.text('Ref Range', 150, y); y += 5
          doc.line(20, y, pageWidth - 20, y); y += 5
          doc.setFont('helvetica', 'normal')
            ; (tr.values || []).forEach(v => {
              if (y > pageHeight - 30) { doc.addPage(); y = 20 }
              doc.text(String(v.label || ''), 20, y); doc.text(String(v.value ?? ''), 80, y)
              doc.text(String(v.unit || ''), 120, y); doc.text(String(v.referenceRange || ''), 150, y); y += 5
            })
          y += 10
        })
      }
      // Footer
      y += 10; doc.setFontSize(9); doc.setFont('helvetica', 'normal')
      doc.text('This report is electronically generated. Consult a healthcare professional for interpretation.', 20, y)
      const patientName = `${booking.userId?.firstName || ''}_${booking.userId?.lastName || ''}`.replace(/\s/g, '_')
      doc.save(`LabReport_${patientName}_${booking._id}.pdf`)
    } catch (err) { alert('PDF generation failed.'); console.error(err) }
  }, [formatDate])

  // ── Filtered Data ──
  const filteredBookings = useMemo(() => {
    let result = [...bookings]
      .filter(b => new Date(b.appointmentDate).getFullYear() !== 2028)
      .sort((a, b) => new Date(b.updatedAt || b.appointmentDate) - new Date(a.updatedAt || a.appointmentDate))
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(b =>
        (b.labId?.name || '').toLowerCase().includes(q) ||
        getDisplayName(b).toLowerCase().includes(q) ||
        (b.selectedTests || []).some(t => (t.testName || '').toLowerCase().includes(q))
      )
    }
    return result
  }, [bookings, searchQuery])

  const toggleTest = (id) => setExpandedTests(p => ({ ...p, [id]: !p[id] }))

  const mostRecent = filteredBookings[0]

  // ── Render ──
  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Download Reports</h1>
          <p className="text-sm text-gray-500 mt-1">View your test results, get AI-powered analysis, and download reports</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Search by lab, test, or package..."
            className="pl-9 pr-4 py-2.5 w-full border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm"
            value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center text-sm">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-16">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin mb-4" />
          <p className="text-gray-500">Loading your reports...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-16 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No reports available</h3>
          <p className="text-gray-500 mt-2">Reports will appear here once your test results are published.</p>
        </div>
      ) : (
        <>
          {/* Most Recent Highlight */}
          {mostRecent && !searchQuery && (
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-lg text-white p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <FileText className="h-48 w-48" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 text-primary-200 text-xs font-bold uppercase tracking-wider">
                  <span className="bg-white/20 px-2 py-0.5 rounded">Most Recent</span>
                  <span>{formatDate(mostRecent.updatedAt || mostRecent.appointmentDate)}</span>
                </div>
                <h2 className="text-2xl font-bold mb-1">{mostRecent.labId?.name || 'Lab Report'}</h2>
                <p className="text-primary-200 mb-1">{getDisplayName(mostRecent)}</p>
                {countAbnormals(mostRecent) > 0 && (
                  <p className="text-yellow-300 text-sm flex items-center gap-1 mb-3">
                    <AlertTriangle className="h-4 w-4" /> {countAbnormals(mostRecent)} abnormal value{countAbnormals(mostRecent) > 1 ? 's' : ''} detected
                  </p>
                )}
                <div className="flex flex-wrap gap-3 mt-4">
                  {mostRecent.paymentStatus === 'completed' ? (
                    <>
                      {mostRecent.testResults?.length > 0 && (
                        <>
                          <button onClick={() => downloadResultsPdf(mostRecent)}
                            className="bg-white text-primary-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium flex items-center text-sm shadow-sm">
                            <Download className="h-4 w-4 mr-2" /> Download PDF
                          </button>
                          <button onClick={() => analyzeResultsWithAI(mostRecent)} disabled={analyzing[mostRecent._id]}
                            className="bg-purple-500/80 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-medium flex items-center text-sm backdrop-blur-sm">
                            {analyzing[mostRecent._id] ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
                            AI Analysis
                          </button>
                        </>
                      )}
                      {mostRecent.reportFile && (
                        <button onClick={() => handleSecureDownload(mostRecent)}
                          className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium flex items-center text-sm backdrop-blur-sm">
                          <FileText className="h-4 w-4 mr-2" /> Lab Report
                        </button>
                      )}
                    </>
                  ) : (
                    <button onClick={() => handlePayment(mostRecent)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium flex items-center text-sm animate-pulse">
                      <CreditCard className="h-4 w-4 mr-2" /> Pay to Unlock
                    </button>
                  )}
                  <button onClick={() => setSelected(mostRecent)}
                    className="text-white/80 hover:text-white px-4 py-2 font-medium flex items-center text-sm">
                    <Eye className="h-4 w-4 mr-2" /> View Details
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reports Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">All Reports</h3>
            <span className="text-sm text-gray-500">{filteredBookings.length} found</span>
          </div>

          {/* Reports Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredBookings.map(b => {
              const abnormals = countAbnormals(b)
              const resultsCount = (b.testResults || []).length
              return (
                <div key={b._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all group">
                  {/* Card Header */}
                  <div className="p-4 pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">{getDisplayName(b)}</h4>
                          <p className="text-xs text-gray-500">{b.labId?.name || 'Lab'}</p>
                        </div>
                      </div>
                      {abnormals > 0 && (
                        <span className="flex items-center text-[11px] font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full flex-shrink-0">
                          <AlertTriangle className="h-3 w-3 mr-0.5" /> {abnormals}
                        </span>
                      )}
                    </div>

                    {/* Info Row */}
                    <div className="flex items-center gap-3 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {formatDate(b.updatedAt || b.appointmentDate)}
                      </span>
                      {b.appointmentTime && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {b.appointmentTime}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Beaker className="h-3 w-3" /> {resultsCount} result{resultsCount !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${getStatusStyle(b.status)}`}>
                        {getStatusLabel(b)}
                      </span>
                      {abnormals === 0 && resultsCount > 0 && (
                        <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-0.5">
                          <CheckCircle className="h-3 w-3" /> All Normal
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                    {b.paymentStatus === 'pending' ? (
                      <button onClick={() => handlePayment(b)}
                        className="w-full px-3 py-2 text-xs font-medium text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                        <Lock className="h-3.5 w-3.5" /> Pay to Unlock Report
                      </button>
                    ) : (
                      <div className="flex items-center gap-1 w-full">
                        <button onClick={() => setSelected(b)}
                          className="flex-1 px-2.5 py-2 text-xs font-medium text-gray-700 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                          <Eye className="h-3.5 w-3.5" /> View
                        </button>
                        {resultsCount > 0 && (
                          <>
                            <button onClick={() => analyzeResultsWithAI(b)} disabled={analyzing[b._id]}
                              className="flex-1 px-2.5 py-2 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50">
                              {analyzing[b._id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />} AI
                            </button>
                            <button onClick={() => downloadResultsPdf(b)}
                              className="flex-1 px-2.5 py-2 text-xs font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                              <Download className="h-3.5 w-3.5" /> PDF
                            </button>
                          </>
                        )}
                        {b.reportFile && (
                          <button onClick={() => handleSecureDownload(b)}
                            className="px-2.5 py-2 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors">
                            <FileText className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {filteredBookings.length === 0 && searchQuery && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
              <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No reports match your search</p>
            </div>
          )}
        </>
      )}

      {/* ── Details Modal ── */}
      {selected && (() => {
        const abnormals = countAbnormals(selected)
        const testResults = selected.testResults || []
        const displayName = getDisplayName(selected)

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

              {/* Header */}
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-shrink-0">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{displayName}</h3>
                  <p className="text-sm text-gray-500">{selected.labId?.name} • {formatDate(selected.updatedAt || selected.appointmentDate)}</p>
                </div>
                <button onClick={() => setSelected(null)} className="p-1 hover:bg-gray-200 rounded-full">
                  <X className="h-5 w-5 text-gray-400" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-5 flex-1">

                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-center">
                    <div className="text-2xl font-bold text-gray-900">{testResults.length}</div>
                    <div className="text-xs text-gray-500">Tests Done</div>
                  </div>
                  <div className={`p-3 rounded-lg border text-center ${abnormals > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                    <div className={`text-2xl font-bold ${abnormals > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{abnormals}</div>
                    <div className={`text-xs ${abnormals > 0 ? 'text-red-600' : 'text-emerald-600'}`}>Abnormal</div>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 text-center">
                    <div className="text-2xl font-bold text-indigo-700">₹{selected.totalAmount}</div>
                    <div className="text-xs text-indigo-600">Amount</div>
                  </div>
                </div>

                {/* Status & Timeline */}
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Status</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(selected.status)}`}>
                      {getStatusLabel(selected)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-600">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span>Booked: {formatDate(selected.appointmentDate)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      <span>Time: {selected.appointmentTime}</span>
                    </div>
                    {selected.publishedAt && (
                      <div className="flex items-center gap-1.5 col-span-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Published: {formatDateTime(selected.publishedAt)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Test Results Accordion */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center text-gray-900">
                    <Beaker className="h-4 w-4 mr-2 text-indigo-600" /> Test Results
                  </h4>
                  <div className="space-y-2">
                    {testResults.map((tr, trIdx) => {
                      const testName = selected.selectedTests?.find(t =>
                        (t.testId?._id || t.testId)?.toString() === (tr.testId?._id || tr.testId)?.toString()
                      )?.testName || `Test ${trIdx + 1}`
                      const isExp = expandedTests[tr.testId?._id || tr.testId || trIdx]
                      const hasAbnormal = (tr.values || []).some(v => isAbnormal(v.value, v.referenceRange))

                      return (
                        <div key={trIdx} className={`border rounded-lg overflow-hidden ${hasAbnormal ? 'border-red-200' : 'border-gray-200'}`}>
                          <button
                            onClick={() => toggleTest(tr.testId?._id || tr.testId || trIdx)}
                            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {isExp ? <ChevronDown className="h-3.5 w-3.5 text-gray-400" /> : <ChevronRight className="h-3.5 w-3.5 text-gray-400" />}
                              <span className="text-sm font-medium text-gray-900">{testName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {hasAbnormal && (
                                <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium flex items-center">
                                  <AlertTriangle className="h-3 w-3 mr-0.5" /> Abnormal
                                </span>
                              )}
                              {tr.status === 'verified' && (
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full flex items-center">
                                  <Shield className="h-3 w-3 mr-0.5" /> Verified
                                </span>
                              )}
                            </div>
                          </button>
                          {isExp && (
                            <div className="px-4 pb-3 border-t border-gray-100">
                              <table className="min-w-full mt-2">
                                <thead>
                                  <tr className="border-b border-gray-100">
                                    <th className="text-left text-xs font-medium text-gray-500 py-1.5 w-1/3">Parameter</th>
                                    <th className="text-left text-xs font-medium text-gray-500 py-1.5 w-1/3">Result</th>
                                    <th className="text-left text-xs font-medium text-gray-500 py-1.5 w-1/3">Reference</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(tr.values || []).map((v, vIdx) => {
                                    const flagged = isAbnormal(v.value, v.referenceRange)
                                    return (
                                      <tr key={vIdx} className={`border-b border-gray-50 ${flagged ? 'bg-red-50' : ''}`}>
                                        <td className="py-1.5 text-sm text-gray-700">{v.label}</td>
                                        <td className={`py-1.5 text-sm font-medium ${flagged ? 'text-red-700' : 'text-gray-900'}`}>
                                          {v.type === 'boolean' ? (v.value ? 'Yes' : 'No') : v.value} {v.unit && <span className="text-xs font-normal text-gray-400">{v.unit}</span>}
                                          {flagged && <AlertTriangle className="h-3 w-3 inline ml-1 text-red-500" />}
                                        </td>
                                        <td className="py-1.5 text-xs text-gray-500">{v.referenceRange || '—'}</td>
                                      </tr>
                                    )
                                  })}
                                </tbody>
                              </table>
                              {tr.verifiedAt && (
                                <div className="mt-2 text-xs text-emerald-600 flex items-center bg-emerald-50 px-3 py-1.5 rounded">
                                  <Shield className="h-3 w-3 mr-1.5" /> Verified {formatDateTime(tr.verifiedAt)}
                                </div>
                              )}
                              {tr.submittedAt && (
                                <div className="mt-1 text-xs text-gray-500 flex items-center px-3 py-1">
                                  <Clock className="h-3 w-3 mr-1.5" /> Submitted {formatDateTime(tr.submittedAt)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center flex-shrink-0">
                <div className="flex gap-2">
                  {selected.paymentStatus === 'completed' && selected.testResults?.length > 0 && (
                    <>
                      <button onClick={() => { setSelected(null); analyzeResultsWithAI(selected) }} disabled={analyzing[selected._id]}
                        className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1.5 disabled:opacity-50">
                        {analyzing[selected._id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />} AI Analysis
                      </button>
                      <button onClick={() => downloadResultsPdf(selected)}
                        className="px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-1.5">
                        <Download className="h-3.5 w-3.5" /> Download PDF
                      </button>
                    </>
                  )}
                </div>
                <button onClick={() => setSelected(null)} className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ── AI Analysis Modal ── */}
      {showAiModal && currentAiBookingId && aiAnalysis[currentAiBookingId] && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">

            <div className="p-4 border-b border-purple-100 bg-purple-50 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-lg text-purple-900">AI Health Analysis</h3>
              </div>
              <button onClick={() => { setShowAiModal(false); setCurrentAiBookingId(null) }} className="p-1 hover:bg-purple-100 rounded-full">
                <X className="h-5 w-5 text-purple-400" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="bg-white border border-purple-100 rounded-lg p-5">
                <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {aiAnalysis[currentAiBookingId]}
                </div>
              </div>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-800">
                  <strong>Disclaimer:</strong> This AI analysis is for informational purposes only and does not replace professional medical advice. Please consult a qualified healthcare provider for proper interpretation.
                </p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end flex-shrink-0 bg-gray-50">
              <button onClick={() => { setShowAiModal(false); setCurrentAiBookingId(null) }}
                className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                Close Analysis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DownloadReports
