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

const BACKEND_URL = 'http://localhost:5000'

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

  // Build full URL for an uploaded imaging result file
  const getFileUrl = (filePath) => {
    if (!filePath) return null
    if (filePath.startsWith('http')) return filePath
    // filePath is like "uploads/test-results/result-xxx.pdf"
    return `${BACKEND_URL}/${filePath.replace(/\\/g, '/')}`
  }

  // Download an imaging result file
  const handleDownloadFile = (filePath, testName) => {
    const url = getFileUrl(filePath)
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = `${(testName || 'imaging-result').replace(/\s+/g, '_')}.${filePath.split('.').pop()}`
    a.target = '_blank'
    document.body.appendChild(a)
    a.click()
    a.remove()
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
      const pw = doc.internal.pageSize.getWidth()
      const ph = doc.internal.pageSize.getHeight()
      const ml = 15 // margin left
      const mr = pw - 15 // margin right
      const cw = mr - ml // content width
      let y = 0

      // ─── Color Palette ───
      const navy = [21, 55, 96]
      const darkBlue = [30, 64, 175]
      const teal = [13, 148, 136]
      const lightGray = [248, 250, 252]
      const medGray = [229, 231, 235]
      const darkText = [31, 41, 55]
      const red = [220, 38, 38]
      const white = [255, 255, 255]

      // ─── Helper: Format Lab Address ───
      const formatLabAddress = (addr) => {
        if (!addr) return ''
        if (typeof addr === 'string') return addr
        return [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean).join(', ')
      }

      // ─── Helper: Check if value is abnormal ───
      const checkAbnormal = (val, rangeStr) => {
        if (!val || !rangeStr || isNaN(val)) return { abnormal: false, flag: '' }
        const parts = rangeStr.replace(/\s/g, '').split('-')
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const numVal = parseFloat(val), lo = parseFloat(parts[0]), hi = parseFloat(parts[1])
          if (numVal < lo) return { abnormal: true, flag: 'L' }
          if (numVal > hi) return { abnormal: true, flag: 'H' }
        }
        return { abnormal: false, flag: '' }
      }

      // ─── Helper: Add page footer ───
      const addPageFooter = (pageNum, totalPages) => {
        // Bottom line
        doc.setDrawColor(...medGray)
        doc.setLineWidth(0.3)
        doc.line(ml, ph - 20, mr, ph - 20)

        doc.setFontSize(7)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(156, 163, 175) // gray-400
        doc.text('This report is electronically generated and does not require a signature.', ml, ph - 15)
        doc.text('Please consult a healthcare professional for interpretation of results.', ml, ph - 11)
        doc.text(`Page ${pageNum} of ${totalPages}`, mr, ph - 15, { align: 'right' })
        doc.text(`Report ID: ${booking._id}`, mr, ph - 11, { align: 'right' })
        doc.setTextColor(...darkText)
      }

      // ─── Helper: Check page break ───
      const checkPageBreak = (neededSpace = 30) => {
        if (y > ph - neededSpace - 25) {
          doc.addPage()
          y = 20
          return true
        }
        return false
      }

      // ═════════════════════════════════════════════
      //  PAGE 1: HEADER + PATIENT INFO + RESULTS
      // ═════════════════════════════════════════════

      // ── Lab Header Banner ──
      doc.setFillColor(...navy)
      doc.rect(0, 0, pw, 42, 'F')

      // Lab Name
      doc.setTextColor(...white)
      doc.setFontSize(22)
      doc.setFont('helvetica', 'bold')
      doc.text(String(booking.labId?.name || 'LABORATORY').toUpperCase(), pw / 2, 18, { align: 'center' })

      // Lab tagline
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('Diagnostic Excellence  •  Trusted Results  •  Quality Healthcare', pw / 2, 27, { align: 'center' })

      // Lab contact line
      const labPhone = booking.labId?.contact?.phone || ''
      const labEmail = booking.labId?.contact?.email || ''
      const labAddr = formatLabAddress(booking.labId?.address)
      const contactParts = [labPhone, labEmail].filter(Boolean).join('  |  ')
      if (contactParts) {
        doc.setFontSize(7.5)
        doc.text(contactParts, pw / 2, 35, { align: 'center' })
      }
      if (labAddr) {
        doc.setFontSize(7)
        doc.setTextColor(180, 199, 231)
        const addrShort = labAddr.length > 80 ? labAddr.substring(0, 80) + '...' : labAddr
        doc.text(addrShort, pw / 2, 40, { align: 'center' })
      }

      // ── Accent Bar ──
      doc.setFillColor(...teal)
      doc.rect(0, 42, pw, 2.5, 'F')

      doc.setTextColor(...darkText)
      y = 52

      // ── Report Title ──
      doc.setFillColor(...lightGray)
      doc.roundedRect(ml, y, cw, 10, 1, 1, 'F')
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...darkBlue)
      doc.text('LABORATORY TEST REPORT', pw / 2, y + 7, { align: 'center' })
      doc.setTextColor(...darkText)
      y += 16

      // ── Patient Information Box ──
      doc.setDrawColor(...medGray)
      doc.setLineWidth(0.4)
      doc.roundedRect(ml, y, cw, 34, 1.5, 1.5)

      // Section title bar
      doc.setFillColor(240, 243, 255)
      doc.roundedRect(ml, y, cw, 8.5, 1.5, 1.5, 'F')
      doc.rect(ml, y + 4, cw, 4.5, 'F') // square bottom corners
      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...navy)
      doc.text('PATIENT INFORMATION', ml + 4, y + 6)
      doc.setTextColor(...darkText)

      const infoY = y + 14
      const col2x = pw / 2 + 5 // second column start

      doc.setFontSize(8.5)
      doc.setFont('helvetica', 'bold')
      doc.text('Patient Name:', ml + 4, infoY)
      doc.text('Age / Gender:', ml + 4, infoY + 6)
      doc.text('Phone:', ml + 4, infoY + 12)
      doc.text('Report Date:', col2x, infoY)
      doc.text('Report ID:', col2x, infoY + 6)
      doc.text('Ref. Doctor:', col2x, infoY + 12)

      doc.setFont('helvetica', 'normal')
      const patientName = `${booking.userId?.firstName || ''} ${booking.userId?.lastName || ''}`.trim()
      doc.text(patientName || 'N/A', ml + 30, infoY)
      doc.text(`${booking.userId?.age || 'N/A'} / ${booking.userId?.gender || 'N/A'}`, ml + 30, infoY + 6)
      doc.text(booking.userId?.phone || 'N/A', ml + 30, infoY + 12)
      doc.text(formatDate(booking.appointmentDate), col2x + 24, infoY)
      const shortId = String(booking._id).slice(-12).toUpperCase()
      doc.text(shortId, col2x + 24, infoY + 6)
      doc.text('Self / Clinical', col2x + 24, infoY + 12)

      y += 40

      // ── Sample Information ──
      doc.setFillColor(...lightGray)
      doc.roundedRect(ml, y, cw, 10, 1, 1, 'F')
      doc.setDrawColor(...medGray)
      doc.roundedRect(ml, y, cw, 10, 1, 1)

      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(107, 114, 128)
      doc.text('COLLECTED:', ml + 4, y + 6.5)
      doc.text('REPORTED:', pw / 2 - 20, y + 6.5)
      doc.text('STATUS:', pw / 2 + 30, y + 6.5)

      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...darkText)
      const appointDate = formatDate(booking.appointmentDate)
      const reportDate = booking.updatedAt ? formatDate(booking.updatedAt) : appointDate
      doc.text(appointDate, ml + 24, y + 6.5)
      doc.text(reportDate, pw / 2 - 2, y + 6.5)

      // Status badge
      const statusText = (booking.status || 'completed').replace(/_/g, ' ').toUpperCase()
      doc.setFontSize(7)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(13, 148, 136)
      doc.text(statusText, pw / 2 + 46, y + 6.5)

      doc.setTextColor(...darkText)
      y += 16

      // ── Tests Ordered Summary ──
      const allTestNames = (booking.selectedTests || []).map(t => t.testName || t.testId?.name).filter(Boolean)
      const allPkgNames = (booking.selectedPackages || []).map(p => p.packageName || p.packageId?.name).filter(Boolean)
      if (allTestNames.length > 0 || allPkgNames.length > 0) {
        doc.setFontSize(8)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...navy)
        doc.text('TESTS ORDERED:', ml, y)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...darkText)
        const orderedStr = [...allPkgNames.map(p => `[Pkg] ${p}`), ...allTestNames].join('  |  ')
        const splitOrdered = doc.splitTextToSize(orderedStr, cw - 30)
        doc.setFontSize(7.5)
        doc.text(splitOrdered, ml + 28, y)
        y += splitOrdered.length * 4 + 4
      }

      // ── Separator ──
      doc.setDrawColor(...navy)
      doc.setLineWidth(0.6)
      doc.line(ml, y, mr, y)
      y += 4

      // ═════════════════════════════════════════════
      //  TEST RESULTS TABLES
      // ═════════════════════════════════════════════

      if (booking.testResults?.length > 0) {
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(...navy)
        doc.text('LABORATORY RESULTS', ml, y + 4)
        doc.setTextColor(...darkText)
        y += 10

        const testNameById = new Map((booking.selectedTests || []).map(t => [(t.testId?._id || t.testId), t.testName]))
        let totalParams = 0, totalAbnormal = 0

        booking.testResults.forEach((tr, idx) => {
          const testName = testNameById.get(tr.testId?._id || tr.testId) || `Test ${idx + 1}`
          const values = tr.values || []
          const hasValues = values.length > 0
          const hasImagingFile = !!tr.resultFile
          const testAbnormals = values.filter(v => checkAbnormal(v.value, v.referenceRange).abnormal).length

          totalParams += values.length
          totalAbnormal += testAbnormals

          // Check space for at least header + 2 rows
          checkPageBreak(40)

          // ── Test name header ──
          doc.setFillColor(240, 243, 255)
          doc.roundedRect(ml, y, cw, 8, 1, 1, 'F')
          doc.setFontSize(9.5)
          doc.setFont('helvetica', 'bold')
          doc.setTextColor(...darkBlue)
          doc.text(`${idx + 1}. ${String(testName)}`, ml + 3, y + 5.5)

          // Abnormal badge or imaging badge on right
          if (hasImagingFile && !hasValues) {
            doc.setFontSize(7)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(13, 148, 136) // teal
            doc.text('IMAGING TEST', mr - 3, y + 5.5, { align: 'right' })
          } else if (testAbnormals > 0) {
            doc.setFontSize(7)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(...red)
            doc.text(`${testAbnormals} ABNORMAL`, mr - 3, y + 5.5, { align: 'right' })
          } else if (hasValues) {
            doc.setFontSize(7)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(34, 197, 94)
            doc.text('ALL NORMAL', mr - 3, y + 5.5, { align: 'right' })
          }

          doc.setTextColor(...darkText)
          y += 10

          // ── Tabular results (if present) ──
          if (hasValues) {
            // ── Table header ──
            const colX = { param: ml + 2, value: ml + 60, flag: ml + 95, unit: ml + 108, range: ml + 140 }

            doc.setFillColor(...medGray)
            doc.rect(ml, y, cw, 6, 'F')
            doc.setFontSize(7)
            doc.setFont('helvetica', 'bold')
            doc.setTextColor(75, 85, 99)
            doc.text('PARAMETER', colX.param, y + 4)
            doc.text('RESULT', colX.value, y + 4)
            doc.text('FLAG', colX.flag, y + 4)
            doc.text('UNIT', colX.unit, y + 4)
            doc.text('REFERENCE RANGE', colX.range, y + 4)
            doc.setTextColor(...darkText)
            y += 8

            // ── Table rows ──
            values.forEach((v, vi) => {
              checkPageBreak(12)

              // Alternating row background
              if (vi % 2 === 0) {
                doc.setFillColor(249, 250, 251)
                doc.rect(ml, y - 3, cw, 6, 'F')
              }

              const { abnormal, flag } = checkAbnormal(v.value, v.referenceRange)

              doc.setFontSize(8)
              doc.setFont('helvetica', 'normal')
              doc.setTextColor(...darkText)
              doc.text(String(v.label || '-'), colX.param, y)

              // Value - bold+red if abnormal
              if (abnormal) {
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(...red)
              }
              doc.text(String(v.value ?? '-'), colX.value, y)

              // Flag column
              if (flag) {
                doc.setFontSize(7)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(...red)
                doc.text(flag === 'H' ? 'HIGH' : 'LOW', colX.flag, y)
              }

              // Reset color for unit and range
              doc.setFont('helvetica', 'normal')
              doc.setTextColor(107, 114, 128)
              doc.setFontSize(7.5)
              doc.text(String(v.unit || '-'), colX.unit, y)
              doc.text(String(v.referenceRange || '-'), colX.range, y)

              doc.setTextColor(...darkText)
              y += 6
            })
          }

          // ── Imaging Result Section (resultFile / findings) ──
          if (hasImagingFile || tr.findings) {
            checkPageBreak(30)

            // Imaging info box background
            const boxStartY = y
            doc.setFillColor(240, 253, 250) // teal-50
            doc.setDrawColor(153, 246, 228) // teal-200
            doc.setLineWidth(0.4)

            // Build imaging content lines
            const imagingLines = []

            if (hasImagingFile) {
              const fileName = tr.resultFile.split('/').pop() || 'imaging-result'
              const fileExt = tr.resultFile.split('.').pop().toUpperCase()
              imagingLines.push({ type: 'file', text: `Imaging Result File: ${fileName} (${fileExt})` })
              imagingLines.push({ type: 'note', text: 'Note: The imaging file can be downloaded separately from the report details page.' })
            }

            if (tr.findings) {
              imagingLines.push({ type: 'heading', text: 'Findings / Interpretation:' })
              const findingsWrapped = doc.splitTextToSize(String(tr.findings), cw - 12)
              findingsWrapped.forEach(line => imagingLines.push({ type: 'finding', text: line }))
            }

            // Calculate box height
            let boxH = 6 // padding top/bottom
            imagingLines.forEach(l => {
              if (l.type === 'heading') boxH += 6
              else boxH += 5
            })
            boxH = Math.max(boxH, 12)

            // Check page break with full box height
            checkPageBreak(boxH + 5)

            // Draw box
            doc.setFillColor(240, 253, 250)
            doc.setDrawColor(153, 246, 228)
            doc.roundedRect(ml, y, cw, boxH, 1.5, 1.5, 'FD')

            let iy = y + 5

            imagingLines.forEach(l => {
              if (l.type === 'file') {
                doc.setFontSize(8)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(13, 148, 136) // teal-600
                doc.text(l.text, ml + 5, iy)
                iy += 5
              } else if (l.type === 'note') {
                doc.setFontSize(7)
                doc.setFont('helvetica', 'italic')
                doc.setTextColor(107, 114, 128)
                doc.text(l.text, ml + 5, iy)
                iy += 5
              } else if (l.type === 'heading') {
                doc.setFontSize(8)
                doc.setFont('helvetica', 'bold')
                doc.setTextColor(15, 118, 110) // teal-700
                doc.text(l.text, ml + 5, iy)
                iy += 6
              } else if (l.type === 'finding') {
                doc.setFontSize(8)
                doc.setFont('helvetica', 'normal')
                doc.setTextColor(...darkText)
                doc.text(l.text, ml + 5, iy)
                iy += 5
              }
            })

            y += boxH + 3
            doc.setTextColor(...darkText)
          }

          // Bottom border for test table
          doc.setDrawColor(...medGray)
          doc.setLineWidth(0.2)
          doc.line(ml, y, mr, y)
          y += 8
        })

      }

      // ═════════════════════════════════════════════
      //  AUTHORIZATION
      // ═════════════════════════════════════════════

      checkPageBreak(30)

      y += 6
      doc.setDrawColor(...medGray)
      doc.setLineWidth(0.2)

      // Signature lines
      doc.line(ml, y + 12, ml + 55, y + 12)
      doc.line(mr - 55, y + 12, mr, y + 12)

      doc.setFontSize(7.5)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(107, 114, 128)
      doc.text('Pathologist / Lab Technician', ml, y + 17)
      doc.text('Authorized Signatory', mr - 55, y + 17)

      doc.setFontSize(6.5)
      doc.setFont('helvetica', 'normal')
      doc.text('Digitally Verified', ml, y + 21)
      doc.text(String(booking.labId?.name || ''), mr - 55, y + 21)

      // ═════════════════════════════════════════════
      //  FOOTER ON ALL PAGES
      // ═════════════════════════════════════════════

      const totalPages = doc.internal.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        addPageFooter(i, totalPages)
      }

      // ── Save ──
      const safeName = patientName.replace(/\s/g, '_') || 'Patient'
      doc.save(`LabReport_${safeName}_${shortId}.pdf`)
    } catch (err) {
      alert('PDF generation failed. Please try again.')
      console.error('PDF generation error:', err)
    }
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
                              {/* Imaging file download */}
                              {tr.resultFile && (
                                <div className="mt-3 bg-teal-50 border border-teal-200 rounded-lg p-3 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <FileText className="h-4 w-4 text-teal-600" />
                                      <span className="text-sm font-medium text-teal-800">Imaging Result File</span>
                                      <span className="text-xs text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">
                                        {tr.resultFile.split('.').pop().toUpperCase()}
                                      </span>
                                    </div>
                                    <button
                                      onClick={() => handleDownloadFile(tr.resultFile, testName)}
                                      className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium rounded-lg transition-colors"
                                    >
                                      <Download className="h-3.5 w-3.5" /> Download File
                                    </button>
                                  </div>
                                  {tr.findings && (
                                    <div className="mt-2 pt-2 border-t border-teal-200">
                                      <p className="text-xs font-semibold text-teal-700 mb-1">Lab Findings / Interpretation:</p>
                                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{tr.findings}</p>
                                    </div>
                                  )}
                                </div>
                              )}
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
                <div className="flex gap-2 flex-wrap">
                  {selected.paymentStatus === 'completed' && selected.testResults?.length > 0 && (() => {
                    const hasValueResults = selected.testResults.some(tr => tr.values?.length > 0)
                    const imagingResults = selected.testResults.filter(tr => tr.resultFile)
                    const testNameById = new Map((selected.selectedTests || []).map(t => [
                      (t.testId?._id || t.testId)?.toString(), t.testName
                    ]))
                    return (
                      <>
                        <button onClick={() => { setSelected(null); analyzeResultsWithAI(selected) }} disabled={analyzing[selected._id]}
                          className="px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-1.5 disabled:opacity-50">
                          {analyzing[selected._id] ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />} AI Analysis
                        </button>
                        {hasValueResults && (
                          <button onClick={() => downloadResultsPdf(selected)}
                            className="px-3 py-2 text-sm bg-primary-600 text-white rounded-lg hover:bg-primary-700 flex items-center gap-1.5">
                            <Download className="h-3.5 w-3.5" /> Download PDF
                          </button>
                        )}
                        {imagingResults.map((tr, i) => {
                          const tName = testNameById.get((tr.testId?._id || tr.testId)?.toString()) || `Imaging File ${i + 1}`
                          return (
                            <button key={i} onClick={() => handleDownloadFile(tr.resultFile, tName)}
                              className="px-3 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-1.5">
                              <Download className="h-3.5 w-3.5" /> {tName} File
                            </button>
                          )
                        })}
                      </>
                    )
                  })()}
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
