import React, { useEffect, useState, useMemo, useCallback } from 'react'
import {
  FileText, Download, Eye, Calendar, TestTube, Brain, Loader2, Search,
  Lock, CreditCard, AlertCircle, Package, ChevronDown, ChevronRight,
  Shield, AlertTriangle, Clock, CheckCircle, X, Beaker, ShieldCheck,
  Activity, Share2, Info, ArrowRight, Star, ExternalLink, Zap
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'
import jsPDF from 'jspdf'
import { GoogleGenerativeAI } from '@google/generative-ai'
import Swal from 'sweetalert2'

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000'

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

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      const res = await api.bookingAPI.getBookings('all', 1, 100)
      const data = res?.data || res
      const items = (data || []).filter(b => b.reportFile || (Array.isArray(b.testResults) && b.testResults.length > 0))
      setBookings(items)
    } catch (e) {
      setError('Neural Link Failure: Reports out of reach')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { if (user) fetchBookings() }, [user, fetchBookings])

  const formatDate = useCallback((d) => new Date(d).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }), [])
  const formatDateTime = (d) => d ? new Date(d).toLocaleString('en-GB', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'

  const isAbnormal = (val, rangeStr) => {
    if (!val || !rangeStr) return false
    const parts = rangeStr.split('-')
    if (parts.length === 2 && !isNaN(val) && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parseFloat(val) < parseFloat(parts[0]) || parseFloat(val) > parseFloat(parts[1])
    }
    return false
  }

  const getFileUrl = (filePath) => {
    if (!filePath) return null
    if (filePath.startsWith('http')) return filePath
    return `${BACKEND_URL}/${filePath.replace(/\\/g, '/')}`
  }

  const handleDownloadFile = (filePath, testName) => {
    const url = getFileUrl(filePath)
    if (!url) return
    const a = document.createElement('a')
    a.href = url; a.download = `${(testName || 'imaging-result').replace(/\s+/g, '_')}.${filePath.split('.').pop()}`
    a.target = '_blank'; document.body.appendChild(a); a.click(); a.remove()
  }

  const countAbnormals = (b) => {
    let count = 0; (b.testResults || []).forEach(r => { (r.values || []).forEach(v => { if (isAbnormal(v.value, v.referenceRange)) count++ }) }); return count
  }

  const getDisplayName = (b) => {
    const pkgNames = (b.selectedPackages || []).map(p => p.packageName || p.packageId?.name).filter(Boolean)
    const testNames = (b.selectedTests || []).map(t => t.testName || t.testId?.name).filter(Boolean)
    if (pkgNames.length > 0 && testNames.length > 0) return pkgNames.join(', ') + ` + ${testNames.length} tests`
    return pkgNames.join(', ') || testNames.join(', ') || 'Diagnostic Tests'
  }

  const getStatusLabel = (b) => {
    const labels = {
      pending: 'In Queue',
      confirmed: 'Validated',
      sample_collected: 'Processing',
      testing: 'Testing',
      results_entered: 'Verifying',
      partially_completed: 'Partial Results',
      completed: 'Ready for Release',
      result_published: 'Finalized',
      cancelled: 'Void'
    }
    return labels[b.status] || b.status
  }

  const getStatusStyle = (status) => {
    const styles = { result_published: 'bg-green-50 text-green-600 border-green-100', completed: 'bg-blue-50 text-blue-600 border-blue-100', partially_completed: 'bg-indigo-50 text-indigo-600 border-indigo-100' }
    return styles[status] || 'bg-gray-50 text-gray-500 border-gray-100'
  }

  const analyzeResultsWithAI = useCallback(async (booking) => {
    try {
      setAnalyzing(prev => ({ ...prev, [booking._id]: true }))
      let analysisData = ''
      if (booking.testResults && booking.testResults.length > 0) {
        analysisData = 'Test Results:\n'
        booking.testResults.forEach((tr, index) => {
          const testName = booking.selectedTests?.find(t => (t.testId?._id || t.testId) === (tr.testId?._id || tr.testId))?.testName || 'Test'
          analysisData += `\n${index + 1}. ${testName}:\n`
          tr.values?.forEach(v => { analysisData += `   - ${v.label}: ${v.value} ${v.unit || ''}${v.referenceRange ? ` (Reference: ${v.referenceRange})` : ''}\n` })
        })
      }
      const patientInfo = `Patient: ${booking.userId?.firstName} ${booking.userId?.lastName}\nAge: ${booking.userId?.age}\nGender: ${booking.userId?.gender}`
      const prompt = `As a high-end medical diagnostic AI, analyze these results. Structure into: 1. OVERVIEW, 2. KEY BIOMARKERS, 3. ACTIONABLE INSIGHTS, 4. LIFESTYLE PROTOCOLS. Be professional yet encouraging. Format: Clean text with Uppercase Section Titles. Patient: ${patientInfo}\n${analysisData}`
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
      const result = await model.generateContent(prompt)
      const analysis = (await result.response).text()
      setAiAnalysis(prev => ({ ...prev, [booking._id]: analysis }))
      setCurrentAiBookingId(booking._id); setShowAiModal(true)
    } catch (err) {
      setAiAnalysis(prev => ({ ...prev, [booking._id]: 'Neural processing delay. Please re-initiate analysis sequence.' }))
      setCurrentAiBookingId(booking._id); setShowAiModal(true)
    } finally {
      setAnalyzing(prev => ({ ...prev, [booking._id]: false }))
    }
  }, [genAI])

  const handlePayment = async (booking) => {
    try {
      const orderRes = await api.bookingAPI.createOrder(booking._id)
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => {
        new window.Razorpay({
          key: 'rzp_test_R79jO6N4F99QLG', amount: orderRes.data.amount, currency: orderRes.data.currency,
          name: 'LabMate360 Reports', order_id: orderRes.data.orderId,
          handler: async (res) => {
            await api.bookingAPI.processPayment(booking._id, { razorpayOrderId: res.razorpay_order_id, razorpayPaymentId: res.razorpay_payment_id, razorpaySignature: res.razorpay_signature })
            fetchBookings(); Swal.fire({ icon: 'success', title: 'Vault Unlocked', text: 'Diagnostic data decrypted.', confirmButtonColor: '#2563eb' })
          },
          theme: { color: '#2563eb' }
        }).open()
      }
      document.body.appendChild(script)
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gateway Deflection', text: err.message, confirmButtonColor: '#ef4444' })
    }
  }

  const handleSecureDownload = async (booking) => {
    try {
      const blob = await api.bookingAPI.downloadReport(booking._id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `LabReport_${booking._id}.pdf`
      document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url)
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Retrieval Failed', text: err.message })
    }
  }

  const handleWhatsAppShare = async (booking) => {
    const message = `Diagnostic Summary via LabMate360 🔬\n\nFacility: ${booking.labId?.name}\nDate: ${formatDate(booking.appointmentDate)}\nStatus: Finalized\n\n_Securely shared via LabMate360 Digital Identity_`
    const result = await Swal.fire({
      title: 'Digital Transmission',
      text: 'Initiate secure transfer to WhatsApp?',
      icon: 'info',
      showCancelButton: true,
      confirmButtonText: 'Proceed',
      confirmButtonColor: '#25D366',
      customClass: { popup: 'rounded-[3rem]' }
    })
    if (result.isConfirmed) window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')
  }

  const downloadResultsPdf = useCallback((booking) => {
    if (booking.paymentStatus !== 'completed') {
      Swal.fire({ icon: 'warning', title: 'Vault Locked', text: 'Settlement required to extract PDF.', confirmButtonColor: '#2563eb' }); return
    }
    // Main PDF logic remains stable but we enhance meta-data potentially. 
    // Using the previous stable implementation for generation to ensure clinical accuracy.
    // (Previous logic for jsPDF follows...)

    try {
      const doc = new jsPDF()
      const pw = doc.internal.pageSize.getWidth(); const ph = doc.internal.pageSize.getHeight()
      const ml = 15; const mr = pw - 15; const cw = mr - ml; let y = 0
      const navy = [21, 55, 96]; const darkBlue = [30, 64, 175]; const teal = [13, 148, 136]
      const lightGray = [248, 250, 252]; const medGray = [229, 231, 235]; const darkText = [31, 41, 55]
      const red = [220, 38, 38]; const white = [255, 255, 255]

      const formatLabAddr = (a) => a ? (typeof a === 'string' ? a : [a.street, a.city, a.state, a.zipCode].filter(Boolean).join(', ')) : ''
      const checkAbn = (v, r) => {
        if (!v || !r || isNaN(v)) return { abnormal: false, flag: '' }
        const p = r.replace(/\s/g, '').split('-')
        if (p.length === 2 && !isNaN(p[0]) && !isNaN(p[1])) {
          const nv = parseFloat(v), lo = parseFloat(p[0]), hi = parseFloat(p[1])
          if (nv < lo) return { abnormal: true, flag: 'L' }
          if (nv > hi) return { abnormal: true, flag: 'H' }
        }
        return { abnormal: false, flag: '' }
      }

      const addFooter = (n, t) => {
        doc.setDrawColor(...medGray); doc.setLineWidth(0.3); doc.line(ml, ph - 20, mr, ph - 20)
        doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(156, 163, 175)
        doc.text('ELECTRONICALLY GENERATED CLINICAL DOCUMENT - SIGNATURE EXEMPT', ml, ph - 15)
        doc.text(`Page ${n} of ${t}`, mr, ph - 15, { align: 'right' })
      }

      doc.setFillColor(...navy); doc.rect(0, 0, pw, 42, 'F')
      doc.setTextColor(...white); doc.setFontSize(22); doc.setFont('helvetica', 'bold')
      doc.text(String(booking.labId?.name || 'LABORATORY').toUpperCase(), pw / 2, 18, { align: 'center' })

      doc.setFillColor(...teal); doc.rect(0, 42, pw, 2.5, 'F')
      doc.setTextColor(...darkText); y = 60

      doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('DIAGNOSTIC ARCHIVE', ml, y)
      y += 10; doc.setFontSize(9); doc.setFont('helvetica', 'normal')
      doc.text(`Patient: ${booking.userId?.firstName} ${booking.userId?.lastName}`, ml, y)
      doc.text(`Report Date: ${formatDate(booking.appointmentDate)}`, mr, y, { align: 'right' })

      y += 15
      if (booking.testResults?.length > 0) {
        booking.testResults.forEach((tr, i) => {
          doc.setFillColor(...lightGray); doc.rect(ml, y, cw, 8, 'F')
          doc.setFont('helvetica', 'bold'); doc.text(`Test ${i + 1}: ${String(tr.testId?.name || 'Diagnostic Sequence')}`, ml + 2, y + 6)
          y += 15
          tr.values?.forEach(v => {
            const abn = checkAbn(v.value, v.referenceRange)
            doc.setFont('helvetica', 'normal'); doc.text(String(v.label || '-'), ml + 2, y)
            if (abn.abnormal) doc.setTextColor(...red)
            doc.text(String(v.value || '-'), ml + 60, y)
            doc.setTextColor(...darkText); doc.text(String(v.referenceRange || '-'), mr - 2, y, { align: 'right' })
            y += 7
          })
          y += 5
        })
      }

      const tp = doc.internal.getNumberOfPages()
      for (let i = 1; i <= tp; i++) { doc.setPage(i); addFooter(i, tp) }
      doc.save(`ClinicalReport_${booking._id.slice(-8)}.pdf`)
    } catch (err) { Swal.fire({ icon: 'error', title: 'Generation Aborted', text: 'PDF engine failure.' }) }
  }, [formatDate])

  const filteredBookings = useMemo(() => {
    let r = [...bookings].sort((a, b) => new Date(b.updatedAt || b.appointmentDate) - new Date(a.updatedAt || a.appointmentDate))
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      r = r.filter(b => (b.labId?.name || '').toLowerCase().includes(q) || getDisplayName(b).toLowerCase().includes(q))
    }
    return r
  }, [bookings, searchQuery])

  const mostRecent = filteredBookings[0]

  return (
    <div className="w-full pb-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-xl mb-4 border border-blue-100">
            <ShieldCheck className="h-4 w-4 text-blue-600" />
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Authenticated Health Archives</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter uppercase underline decoration-blue-100 decoration-8 underline-offset-8">Medical Vault</h1>
          <p className="text-gray-400 font-bold mt-4 uppercase tracking-[0.2em] text-[11px]">Secure retrieval of clinical data and AI insights</p>
        </div>

        <div className="relative group lg:w-96">
          <Search className="h-5 w-5 absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
          <input
            type="text"
            placeholder="FILTER BY LAB OR TEST SEQUENCE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-16 pr-8 py-5 bg-white border border-gray-100 rounded-[2rem] text-[11px] font-black tracking-widest placeholder:text-gray-200 focus:ring-4 focus:ring-blue-50 transition-all uppercase"
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {mostRecent && !searchQuery && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-16">
            <div className="bg-gray-950 rounded-[4rem] p-12 text-white relative overflow-hidden group border border-white/5 shadow-2xl shadow-blue-900/10">
              <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600 rounded-full blur-[180px] opacity-10 -mr-64 -mt-64 group-hover:opacity-20 transition-opacity duration-1000"></div>

              <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="flex items-center space-x-4 mb-6">
                    <span className="px-4 py-1.5 bg-blue-600 text-white rounded-full text-[9px] font-black uppercase tracking-[0.3em]">Fresh Data Arrived</span>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest italic">{formatDate(mostRecent.updatedAt || mostRecent.appointmentDate)}</span>
                  </div>
                  <h2 className="text-4xl font-black uppercase tracking-tight mb-4">{mostRecent.labId?.name}</h2>
                  <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[11px] mb-10 leading-relaxed">{getDisplayName(mostRecent)}</p>

                  <div className="flex flex-wrap gap-4">
                    {mostRecent.paymentStatus === 'completed' ? (
                      <>
                        <button onClick={() => downloadResultsPdf(mostRecent)} className="bg-white text-gray-900 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl flex items-center space-x-3">
                          <Download className="h-4 w-4" /> <span>Extract PDF</span>
                        </button>
                        <button onClick={() => analyzeResultsWithAI(mostRecent)} disabled={analyzing[mostRecent._id]} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center space-x-3">
                          {analyzing[mostRecent._id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />} <span>Neural Genesis</span>
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handlePayment(mostRecent)} className="bg-yellow-500 text-white px-10 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-yellow-600 transition-all shadow-2xl shadow-yellow-500/20 flex items-center space-x-3 animate-pulse">
                        <Lock className="h-4 w-4" /> <span>Unlock Encrypted Vault</span>
                      </button>
                    )}
                    <button onClick={() => setSelected(mostRecent)} className="px-6 py-4 rounded-2xl border border-white/10 text-white font-black text-[10px] uppercase tracking-widest hover:bg-white/5 transition-all">Details</button>
                  </div>
                </div>

                <div className="hidden lg:grid grid-cols-2 gap-4">
                  <div className="p-8 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-md">
                    <Activity className="h-8 w-8 text-blue-400 mb-4" />
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Diagnostic Points</p>
                    <h4 className="text-2xl font-black">{(mostRecent.testResults || []).length} Units</h4>
                  </div>
                  <div className="p-8 bg-white/5 rounded-[3rem] border border-white/10 backdrop-blur-md">
                    <Shield className="h-8 w-8 text-green-400 mb-4" />
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Clinic Status</p>
                    <h4 className="text-2xl font-black uppercase tracking-tight">{getStatusLabel(mostRecent)}</h4>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-8">
        <div className="flex items-center justify-between px-6">
          <h3 className="text-[14px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center"><FileText className="h-5 w-5 mr-3 text-blue-600" /> Archive Index</h3>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{filteredBookings.length} Records Verified</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
          {filteredBookings.map(b => (
            <motion.div key={b._id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm hover:shadow-2xl transition-all duration-500 group overflow-hidden flex flex-col">
              <div className="p-10 flex-1">
                <div className="flex items-start justify-between mb-8">
                  <div className="h-14 w-14 bg-gray-50 rounded-3xl flex items-center justify-center text-blue-600 border border-gray-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                    <Beaker className="h-7 w-7" />
                  </div>
                  <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(b.status)}`}>
                    {getStatusLabel(b)}
                  </div>
                </div>
                <h4 className="text-xl font-black text-gray-900 uppercase tracking-tight mb-2 line-clamp-1">{getDisplayName(b)}</h4>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">{b.labId?.name}</p>

                {/* Physical Node ID / Sample ID */}
                {b.sampleId && (
                  <div className="flex items-center space-x-2 mb-6 bg-slate-900 text-white px-4 py-2 rounded-xl border border-slate-800 w-fit">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Node ID</span>
                    <span className="text-[10px] font-black tracking-widest">{b.sampleId}</span>
                  </div>
                )}

                <div className="flex items-center space-x-4 mb-6">
                  <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                    <Calendar className="h-3 w-3 text-gray-400" />
                    <span className="text-[9px] font-black text-gray-900">{formatDate(b.appointmentDate)}</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                    <Activity className="h-3 w-3 text-blue-400" />
                    <span className="text-[9px] font-black text-gray-900 font-bold italic">{(b.testResults || []).length} Analyzed</span>
                  </div>
                </div>

                {/* Test Breakdown Chips */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {(b.selectedTests || []).slice(0, 2).map((t, ti) => (
                    <span key={ti} className="px-3 py-1 bg-white border border-gray-100 rounded-lg text-[8px] font-black text-gray-400 uppercase tracking-widest">
                      {t.testName || t.testId?.name}
                    </span>
                  ))}
                  {(b.selectedPackages || []).slice(0, 1).map((p, pi) => (
                    <span key={pi} className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-lg text-[8px] font-black text-blue-600 uppercase tracking-widest">
                      {p.packageName || p.packageId?.name}
                    </span>
                  ))}
                </div>

                {countAbnormals(b) > 0 && b.status === 'result_published' && (
                  <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center space-x-3 mb-4">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">{countAbnormals(b)} Flux Anomalies Detected</span>
                  </div>
                )}
              </div>

              <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button onClick={() => setSelected(b)} className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] hover:text-blue-700 transition-colors uppercase">Open Vault</button>
                <div className="flex space-x-2">
                  {b.paymentStatus === 'completed' ? (
                    <>
                      <button onClick={() => downloadResultsPdf(b)} className="p-3 bg-white text-gray-400 hover:text-blue-600 border border-gray-100 rounded-xl transition-all"><Download className="h-4 w-4" /></button>
                      <button onClick={() => analyzeResultsWithAI(b)} disabled={analyzing[b._id]} className="p-3 bg-white text-gray-400 hover:text-purple-600 border border-gray-100 rounded-xl transition-all">{analyzing[b._id] ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}</button>
                    </>
                  ) : (
                    <button onClick={() => handlePayment(b)} className="px-4 py-2 bg-yellow-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-yellow-600 transition-all">Settle & View</button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Details Modal Overhaul */}
      <AnimatePresence>
        {selected && (
          <div className="fixed inset-0 bg-gray-950/90 backdrop-blur-2xl flex items-center justify-center z-[200] p-4 lg:p-10">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 50 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 50 }} className="bg-white rounded-[4rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative">
              <button onClick={() => setSelected(null)} className="absolute top-10 right-10 h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all z-10"><X className="h-6 w-6" /></button>

              <div className="p-12 overflow-y-auto space-y-12 custom-scrollbar">
                <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                  <div>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="h-2 w-10 bg-blue-600 rounded-full"></div>
                      <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em]">Secure Record: {selected._id.slice(-8)}</span>
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight">{getDisplayName(selected)}</h2>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2 italic">{selected.labId?.name}</p>
                  </div>
                  <div className="flex space-x-2">
                    {selected.paymentStatus === 'completed' && (
                      <>
                        <button onClick={() => downloadResultsPdf(selected)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center space-x-3 shadow-xl shadow-blue-100"><Download className="h-4 w-4" /> <span>PDF Archive</span></button>
                        <button onClick={() => handleWhatsAppShare(selected)} className="p-4 bg-green-50 text-green-600 rounded-2xl border border-green-100 hover:bg-green-600 hover:text-white transition-all"><Share2 className="h-5 w-5" /></button>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                  {[
                    { label: 'Analytes', val: (selected.testResults || []).length, icon: Beaker, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Anomalies', val: countAbnormals(selected), icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50' },
                    { label: 'Integrity', val: 'Verified', icon: ShieldCheck, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Node ID', val: selected.sampleId || 'N/A', icon: Layers, color: 'text-slate-900', bg: 'bg-slate-100' },
                    { label: 'Sequence', val: formatDate(selected.appointmentDate), icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' }
                  ].map((stat, i) => (
                    <div key={i} className="p-6 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
                      <div className={`h-12 w-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-4`}><stat.icon className="h-6 w-6" /></div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                      <h4 className={`text-xl font-black ${stat.color}`}>{stat.val}</h4>
                    </div>
                  ))}
                </div>

                <div className="space-y-6">
                  <h3 className="text-[14px] font-black text-gray-900 uppercase tracking-[0.3em] px-6">Diagnostic Resolution</h3>
                  <div className="space-y-4">
                    {(selected.testResults || []).map((tr, i) => {
                      const isExp = expandedTests[tr.testId?._id || tr.testId || i]
                      const abn = (tr.values || []).some(v => isAbnormal(v.value, v.referenceRange))
                      return (
                        <div key={i} className={`rounded-[3rem] border transition-all ${abn ? 'bg-red-50/30 border-red-100' : 'bg-gray-50/50 border-gray-100'}`}>
                          <button onClick={() => setExpandedTests(p => ({ ...p, [tr.testId?._id || tr.testId || i]: !isExp }))} className="w-full px-10 py-8 flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${abn ? 'bg-red-100 text-red-600' : 'bg-white text-blue-600 shadow-sm'}`}><Activity className="h-6 w-6" /></div>
                              <div>
                                <h5 className="text-[12px] font-black text-gray-900 uppercase tracking-widest">{(selected.selectedTests || []).find(t => (t.testId?._id || t.testId)?.toString() === (tr.testId?._id || tr.testId)?.toString())?.testName || 'Diagnostic Stream'}</h5>
                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Technician Verified • {formatDateTime(tr.verifiedAt)}</span>
                              </div>
                            </div>
                            {isExp ? <ChevronDown className="h-6 w-6 text-gray-300" /> : <ChevronRight className="h-6 w-6 text-gray-300" />}
                          </button>

                          <AnimatePresence>
                            {isExp && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-10 pb-10 overflow-hidden">
                                <div className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden">
                                  <table className="w-full text-left">
                                    <thead>
                                      <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest">Biomarker</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">Clinical Value</th>
                                        <th className="px-8 py-5 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Reference Scope</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                      {(tr.values || []).map((v, vi) => {
                                        const error = isAbnormal(v.value, v.referenceRange)
                                        return (
                                          <tr key={vi} className={`${error ? 'bg-red-50/50' : ''}`}>
                                            <td className="px-8 py-5 text-[11px] font-black text-gray-700 uppercase">{v.label}</td>
                                            <td className={`px-8 py-5 text-[12px] font-black text-center ${error ? 'text-red-600' : 'text-blue-600'}`}>
                                              {v.value} <span className="text-[9px] font-bold opacity-40 italic">{v.unit}</span>
                                            </td>
                                            <td className="px-8 py-5 text-[10px] font-bold text-gray-400 text-right uppercase italic">{v.referenceRange || 'DYNAMIC'}</td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AI Modal Overhaul */}
      <AnimatePresence>
        {showAiModal && currentAiBookingId && (
          <div className="fixed inset-0 bg-gray-950/95 backdrop-blur-3xl flex items-center justify-center z-[300] p-4 lg:p-10">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="bg-white rounded-[5rem] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col relative shadow-2xl">
              <div className="p-12 border-b border-purple-50 flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="h-20 w-20 bg-purple-600 rounded-[2.5rem] flex items-center justify-center text-white shadow-2xl shadow-purple-200"><Brain className="h-10 w-10 animate-pulse" /></div>
                  <div>
                    <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Neural Intelligence Feed</h3>
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em] mt-1">Advanced Diagnostic Interpretation Engine</p>
                  </div>
                </div>
                <button onClick={() => { setShowAiModal(false); setCurrentAiBookingId(null) }} className="h-14 w-14 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all"><X className="h-6 w-6" /></button>
              </div>

              <div className="p-16 overflow-y-auto flex-1 custom-scrollbar">
                <div className="prose prose-purple max-w-none">
                  <div className="space-y-12">
                    {aiAnalysis[currentAiBookingId]?.split('\n\n').map((section, si) => {
                      const [title, ...content] = section.split('\n')
                      return (
                        <div key={si} className="relative pl-10 border-l-2 border-purple-100">
                          <div className="absolute left-[-9px] top-0 h-4 w-4 rounded-full bg-purple-600 border-4 border-white"></div>
                          <h4 className="text-[14px] font-black text-purple-600 uppercase tracking-[0.2em] mb-4">{title.replace(':', '')}</h4>
                          <div className="text-[12px] font-bold text-gray-600 leading-relaxed uppercase tracking-wide">
                            {content.join('\n').split('\n').map((line, li) => (
                              <p key={li} className="mb-2">{line.trim()}</p>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-20 p-8 bg-amber-50 rounded-[3rem] border border-amber-100 flex items-start space-x-6">
                  <div className="h-12 w-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 flex-shrink-0"><Info className="h-6 w-6" /></div>
                  <div>
                    <p className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-1">Clinical Protocol Notice</p>
                    <p className="text-[11px] font-bold text-amber-900/60 leading-relaxed italic uppercase">This analysis is generated by a neural network. It complements but does not replace human clinical judgment. Always synchronize with your primary care officer.</p>
                  </div>
                </div>
              </div>

              <div className="p-12 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button onClick={() => { setShowAiModal(false); setCurrentAiBookingId(null) }} className="bg-gray-950 text-white px-12 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-black transition-all">Terminate Stream</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DownloadReports
