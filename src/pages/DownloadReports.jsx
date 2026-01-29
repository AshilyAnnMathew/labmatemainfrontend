import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { FileText, Download, Eye, Calendar, TestTube, Brain, Loader2, Search } from 'lucide-react'
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

  // API key constant - fallback for environment variable
  const API_KEY = 'AIzaSyAywhccPmyHxbbK_D5hhM6n7tC8PnX_El0'

  // Initialize Google Generative AI with useMemo to prevent recreation on every render
  const genAI = useMemo(() => new GoogleGenerativeAI(API_KEY), [])

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      // Fetch user's bookings and filter those with reports or results
      const res = await api.bookingAPI.getBookings('all', 1, 100)
      const data = res?.data || res // support both {data} and array
      const items = (data || []).filter(b => b.reportFile || (Array.isArray(b.testResults) && b.testResults.length > 0))
      setBookings(items)
    } catch (e) {
      setError(e.message || 'Failed to load reports')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (user) {
      fetchBookings()
    }
  }, [user, fetchBookings])

  // Memoize formatDate function to prevent recreation on every render
  const formatDate = useCallback((d) => new Date(d).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  }), [])

  // AI Analysis Functions
  const extractTextFromPDF = useCallback(async (fileUrl) => {
    try {
      // For now, we'll use a simple approach
      // In a real implementation, you might want to use PDF.js or similar
      return 'PDF text extraction would be implemented here'
    } catch (error) {
      console.error('Error extracting text from PDF:', error)
      return ''
    }
  }, [])

  // Function to list available models (for debugging)
  const listAvailableModels = useCallback(async () => {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models', {
        headers: {
          'X-goog-api-key': API_KEY
        }
      })
      const data = await response.json()
      console.log('Available models:', data)
      return data
    } catch (error) {
      console.error('Error listing models:', error)
      return null
    }
  }, [API_KEY])

  const analyzeResultsWithAI = useCallback(async (booking) => {
    try {
      setAnalyzing(prev => ({ ...prev, [booking._id]: true }))

      // Debug: List available models
      await listAvailableModels()

      // Prepare test results data for AI analysis
      let analysisData = ''

      if (booking.testResults && booking.testResults.length > 0) {
        analysisData = 'Test Results:\n'
        booking.testResults.forEach((testResult, index) => {
          const testName = booking.selectedTests?.find(t =>
            (t.testId?._id || t.testId) === (testResult.testId?._id || testResult.testId)
          )?.testName || 'Test'

          analysisData += `\n${index + 1}. ${testName}:\n`
          testResult.values?.forEach(value => {
            analysisData += `   - ${value.label}: ${value.value} ${value.unit || ''}`
            if (value.referenceRange) {
              analysisData += ` (Reference: ${value.referenceRange})`
            }
            analysisData += '\n'
          })
        })
      } else if (booking.reportFile) {
        // If there's a report file, try to extract text
        analysisData = await extractTextFromPDF(booking.reportFile)
      }

      // Patient information for context
      const patientInfo = `
Patient: ${booking.userId?.firstName} ${booking.userId?.lastName}
Age: ${booking.userId?.age} years
Gender: ${booking.userId?.gender}
Date of Birth: ${booking.userId?.dateOfBirth ? formatDate(booking.userId.dateOfBirth) : 'N/A'}
Appointment Date: ${formatDate(booking.appointmentDate)}
      `

      // Create AI prompt
      const prompt = `
As a medical AI assistant, please analyze the following laboratory test results and provide:

1. Summary: Brief overview of the test results
2. Key Findings: Important values that are normal or abnormal
3. Health Insights: What these results might indicate about the patient's health
4. Recommendations: General recommendations for follow-up or lifestyle changes
5. Important Notes: Any critical values or concerns that need immediate attention

Please provide a professional, easy-to-understand analysis while being careful not to provide specific medical diagnosis.

IMPORTANT: Format your response as plain text without any markdown formatting, asterisks (*), bold text (**), or other special characters. Use simple bullet points with dashes (-) if needed, and keep the formatting clean and readable.

Patient Information:
${patientInfo}

${analysisData}

Please format your response in a clear, structured manner suitable for a patient to understand, using only plain text formatting.
      `

      // Try using the GoogleGenerativeAI library first
      let analysis = ''
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
        const result = await model.generateContent(prompt)
        const response = await result.response
        analysis = response.text()
      } catch (libraryError) {
        console.warn('GoogleGenerativeAI library failed, trying direct API call:', libraryError.message)

        // Fallback to direct API call matching your curl example
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': API_KEY
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  }
                ]
              }
            ]
          })
        })

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response generated'
      }

      setAiAnalysis(prev => ({
        ...prev,
        [booking._id]: analysis
      }))

      return analysis
    } catch (error) {
      console.error('AI Analysis error:', error)
      const errorAnalysis = 'Sorry, I encountered an error while analyzing your test results. Please try again later or consult with a healthcare professional.'

      setAiAnalysis(prev => ({
        ...prev,
        [booking._id]: errorAnalysis
      }))

      return errorAnalysis
    } finally {
      setAnalyzing(prev => ({ ...prev, [booking._id]: false }))
    }
  }, [genAI, formatDate, extractTextFromPDF, listAvailableModels])

  const downloadResultsPdf = useCallback((booking) => {
    try {
      console.log('Starting PDF generation for booking:', booking._id)

      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()
      let yPosition = 20

      console.log('PDF document created successfully, page dimensions:', { pageWidth, pageHeight })
      console.log('Booking data for PDF:', {
        bookingId: booking._id,
        patientName: `${booking.userId?.firstName || ''} ${booking.userId?.lastName || ''}`,
        labName: booking.labId?.name,
        hasTestResults: booking.testResults?.length > 0,
        testResultsCount: booking.testResults?.length || 0
      })

      // Helper function to draw a line
      const drawLine = (y) => {
        doc.setLineWidth(0.5)
        doc.line(20, y, pageWidth - 20, y)
      }

      // Helper function to draw a box
      const drawBox = (x, y, width, height, fillColor = null) => {
        if (fillColor) {
          doc.setFillColor(fillColor[0], fillColor[1], fillColor[2])
          doc.rect(x, y, width, height, 'F')
        }
        doc.setDrawColor(0, 0, 0)
        doc.setLineWidth(0.5)
        doc.rect(x, y, width, height)
      }

      // Header Section with Lab Branding
      doc.setFillColor(59, 130, 246) // Blue background
      doc.rect(0, 0, pageWidth, 40, 'F')

      // Lab Logo/Name
      doc.setTextColor(255, 255, 255) // White text
      doc.setFontSize(28)
      doc.setFont('helvetica', 'bold')
      doc.text(String(booking.labId?.name || 'LABORATORY'), pageWidth / 2, 25, { align: 'center' })

      // Lab tagline
      doc.setFontSize(12)
      doc.setFont('helvetica', 'normal')
      doc.text('Diagnostic Excellence • Trusted Results', pageWidth / 2, 35, { align: 'center' })

      // Reset text color
      doc.setTextColor(0, 0, 0)
      yPosition = 50

      // Lab Information Box
      drawBox(15, yPosition, pageWidth - 30, 35, [248, 250, 252])
      yPosition += 8

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('LABORATORY INFORMATION', 20, yPosition)
      yPosition += 10

      const leftColumn = 20
      const rightColumn = pageWidth / 2 + 10

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')

      if (booking.labId?.address) {
        const addr = booking.labId.address
        const addressStr = typeof addr === 'object'
          ? `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}`
          : String(addr)
        doc.text(`Address: ${addressStr}`, leftColumn, yPosition)
      }
      if (booking.labId?.phone) {
        doc.text(`Phone: ${String(booking.labId.phone)}`, rightColumn, yPosition)
      }
      yPosition += 5

      if (booking.labId?.email) {
        doc.text(`Email: ${String(booking.labId.email)}`, leftColumn, yPosition)
      }
      if (booking.labId?.website) {
        doc.text(`Website: ${String(booking.labId.website)}`, rightColumn, yPosition)
      }

      yPosition += 20

      // Report Header Information
      drawBox(15, yPosition, pageWidth - 30, 25, [249, 250, 251])
      yPosition += 8

      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('LABORATORY REPORT', pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 10

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Report ID: ${String(booking._id)}`, leftColumn, yPosition)
      doc.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth - 20, yPosition, { align: 'right' })

      yPosition += 25

      // Patient Information Section - Enhanced with all User.js fields
      drawBox(15, yPosition, pageWidth - 30, 85, [254, 252, 191])
      yPosition += 8

      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('PATIENT INFORMATION', 20, yPosition)
      yPosition += 12

      // Patient Details in organized layout
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text('Personal Details:', leftColumn, yPosition)
      doc.text('Contact Information:', rightColumn, yPosition)
      yPosition += 8

      doc.setFont('helvetica', 'normal')

      // Personal Details Column
      doc.text(`Full Name: ${String(booking.userId?.firstName || '')} ${String(booking.userId?.lastName || '')}`, leftColumn, yPosition)
      doc.text(`Email: ${String(booking.userId?.email || 'N/A')}`, rightColumn, yPosition)
      yPosition += 6

      doc.text(`Age: ${String(booking.userId?.age || 'N/A')} years`, leftColumn, yPosition)
      doc.text(`Phone: ${String(booking.userId?.phone || 'N/A')}`, rightColumn, yPosition)
      yPosition += 6

      doc.text(`Gender: ${String(booking.userId?.gender || 'N/A')}`, leftColumn, yPosition)
      doc.text(`Date of Birth: ${booking.userId?.dateOfBirth ? formatDate(booking.userId.dateOfBirth) : 'N/A'}`, rightColumn, yPosition)
      yPosition += 6

      // Additional User.js fields
      if (booking.userId?.address) {
        doc.text(`Address: ${String(booking.userId.address)}`, leftColumn, yPosition)
        yPosition += 6
      }

      if (booking.userId?.emergencyContact) {
        doc.text(`Emergency Contact: ${String(booking.userId.emergencyContact)}`, leftColumn, yPosition)
        yPosition += 6
      }

      // User account information
      doc.text(`Patient ID: ${String(booking.userId?.id || booking.userId?._id || 'N/A')}`, leftColumn, yPosition)
      doc.text(`Account Created: ${booking.userId?.createdAt ? formatDate(booking.userId.createdAt) : 'N/A'}`, rightColumn, yPosition)
      yPosition += 6

      if (booking.userId?.lastLogin) {
        doc.text(`Last Login: ${formatDate(booking.userId.lastLogin)}`, leftColumn, yPosition)
      }

      yPosition += 20

      // Appointment Information Section
      drawBox(15, yPosition, pageWidth - 30, 50, [240, 248, 255])
      yPosition += 8

      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('APPOINTMENT INFORMATION', 20, yPosition)
      yPosition += 10

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Appointment Date: ${formatDate(booking.appointmentDate)}`, leftColumn, yPosition)
      doc.text(`Appointment Time: ${String(booking.appointmentTime || 'N/A')}`, rightColumn, yPosition)
      yPosition += 6

      doc.text(`Booking ID: ${String(booking._id)}`, leftColumn, yPosition)
      doc.text(`Payment Status: ${String(booking.paymentStatus || 'N/A')}`, rightColumn, yPosition)
      yPosition += 6

      doc.text(`Total Amount: Rs. ${String(booking.totalAmount || 0)}`, leftColumn, yPosition)
      doc.text(`Booking Status: ${String(booking.status || 'N/A')}`, rightColumn, yPosition)
      yPosition += 6

      if (booking.paymentMethod) {
        doc.text(`Payment Method: ${String(booking.paymentMethod)}`, leftColumn, yPosition)
      }
      if (booking.notes) {
        doc.text(`Notes: ${String(booking.notes)}`, rightColumn, yPosition)
      }

      yPosition += 20

      // Tests Requested Section
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('TESTS REQUESTED', 20, yPosition)
      yPosition += 12

      // List all requested tests
      if (booking.selectedTests && booking.selectedTests.length > 0) {
        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        booking.selectedTests.forEach((test, index) => {
          doc.text(`${index + 1}. ${String(test.testName || test.testId?.name || 'Test')}`, leftColumn, yPosition)
          if (test.testId?.description) {
            doc.setFontSize(9)
            doc.text(`   ${String(test.testId.description)}`, leftColumn + 5, yPosition + 4)
            yPosition += 4
          }
          doc.setFontSize(11)
          yPosition += 6
        })
      }

      if (booking.selectedPackages && booking.selectedPackages.length > 0) {
        yPosition += 5
        doc.setFontSize(12)
        doc.setFont('helvetica', 'bold')
        doc.text('PACKAGES:', leftColumn, yPosition)
        yPosition += 8

        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        booking.selectedPackages.forEach((pkg, index) => {
          doc.text(`${index + 1}. ${String(pkg.packageName || pkg.packageId?.name || 'Package')}`, leftColumn, yPosition)
          if (pkg.packageId?.description) {
            doc.setFontSize(9)
            doc.text(`   ${String(pkg.packageId.description)}`, leftColumn + 5, yPosition + 4)
            yPosition += 4
          }
          doc.setFontSize(11)
          yPosition += 6
        })
      }

      yPosition += 15

      // Test Results Section
      if (booking.testResults && booking.testResults.length > 0) {
        console.log('Processing test results for PDF:', booking.testResults.length, 'results found')
        doc.setFontSize(16)
        doc.setFont('helvetica', 'bold')
        doc.text('LABORATORY RESULTS', 20, yPosition)
        yPosition += 12

        const testNameById = new Map((booking.selectedTests || []).map(t => [(t.testId?._id || t.testId), t.testName]))

          ; (booking.testResults || []).forEach((tr, index) => {
            const testName = testNameById.get(tr.testId?._id || tr.testId) || 'Test'

            // Check if we need a new page
            if (yPosition > pageHeight - 80) {
              doc.addPage()
              yPosition = 20
            }

            // Test name with submission info
            doc.setFontSize(12)
            doc.setFont('helvetica', 'bold')
            doc.text(`${index + 1}. ${String(testName)}`, 20, yPosition)
            yPosition += 6

            if (tr.submittedBy) {
              doc.setFontSize(9)
              doc.setFont('helvetica', 'italic')
              doc.text(`Submitted by: ${String(tr.submittedBy)}`, 20, yPosition)
              yPosition += 4
            }

            if (tr.submittedAt) {
              doc.text(`Submitted on: ${formatDate(tr.submittedAt)}`, 20, yPosition)
              yPosition += 4
            }

            yPosition += 8

            // Results table header
            doc.setFontSize(10)
            doc.setFont('helvetica', 'bold')
            doc.text('Parameter', 20, yPosition)
            doc.text('Value', 80, yPosition)
            doc.text('Unit', 120, yPosition)
            doc.text('Reference Range', 150, yPosition)
            yPosition += 5

            // Draw line under header
            doc.line(20, yPosition, pageWidth - 20, yPosition)
            yPosition += 5

            // Results
            doc.setFont('helvetica', 'normal')
              ; (tr.values || []).forEach(v => {
                if (yPosition > pageHeight - 30) {
                  doc.addPage()
                  yPosition = 20
                }

                const value = v.type === 'boolean' ? (v.value ? 'Yes' : 'No') : (v.value ?? '')
                const unit = v.unit || ''
                const refRange = v.referenceRange || ''

                // Check if value is outside reference range (basic validation)
                const isOutsideRange = refRange && value && v.type === 'number' && !isNaN(value) && !isNaN(refRange.split('-')[0])
                const textColor = isOutsideRange ? [255, 0, 0] : [0, 0, 0] // Red for abnormal values

                doc.setTextColor(textColor[0], textColor[1], textColor[2])
                doc.text(String(v.label || ''), 20, yPosition)
                doc.text(String(value), 80, yPosition)
                doc.text(String(unit), 120, yPosition)
                doc.text(String(refRange), 150, yPosition)

                // Reset color
                doc.setTextColor(0, 0, 0)
                yPosition += 5
              })

            yPosition += 15
          })
      } else {
        console.log('No test results found, adding placeholder message')
        // Add a message if no results are available
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('LABORATORY RESULTS', 20, yPosition)
        yPosition += 12

        doc.setFontSize(11)
        doc.setFont('helvetica', 'normal')
        doc.text('No test results are available for this booking.', 20, yPosition)
        yPosition += 15
      }

      // Report Summary
      yPosition += 10
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('REPORT SUMMARY', 20, yPosition)
      yPosition += 12

      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`Total Tests Requested: ${String((booking.selectedTests || []).length + (booking.selectedPackages || []).length)}`, leftColumn, yPosition)
      doc.text(`Results Available: ${String(booking.testResults?.length || 0)}`, rightColumn, yPosition)
      yPosition += 6

      doc.text(`Report Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, leftColumn, yPosition)
      doc.text(`Report Status: ${String(booking.status || 'Unknown')}`, rightColumn, yPosition)
      yPosition += 6

      if (booking.reportFile) {
        doc.text(`Report File: Available`, leftColumn, yPosition)
      }

      // Disclaimer and Footer
      yPosition += 20
      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.text('IMPORTANT DISCLAIMER:', 20, yPosition)
      yPosition += 8

      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      doc.text('This report is generated electronically and does not require a signature.', 20, yPosition)
      yPosition += 5
      doc.text('Results should be interpreted by a qualified healthcare professional.', 20, yPosition)
      yPosition += 5
      doc.text('For any queries regarding this report, please contact the laboratory.', 20, yPosition)
      yPosition += 15

      // Lab Certification/Accreditation
      if (booking.labId?.certifications || booking.labId?.accreditations) {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'bold')
        doc.text('LABORATORY CERTIFICATION:', 20, yPosition)
        yPosition += 8

        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        if (booking.labId.certifications) {
          doc.text(`Certifications: ${String(booking.labId.certifications)}`, 20, yPosition)
          yPosition += 5
        }
        if (booking.labId.accreditations) {
          doc.text(`Accreditations: ${String(booking.labId.accreditations)}`, 20, yPosition)
          yPosition += 5
        }
      }

      // Footer
      const footerY = pageHeight - 15
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(`Report ID: ${String(booking._id)} | Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, footerY)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'bold')
      doc.text('LabMate Laboratory Management System', pageWidth - 20, footerY, { align: 'right' })

      // Download the PDF with comprehensive filename
      const patientName = `${booking.userId?.firstName || ''}_${booking.userId?.lastName || ''}`.replace(/\s/g, '_')
      const appointmentDate = formatDate(booking.appointmentDate).replace(/\s/g, '_')
      const filename = `LabReport_${patientName}_${appointmentDate}_${booking._id}.pdf`

      console.log('Saving PDF with filename:', filename)
      doc.save(filename)
      console.log('PDF download initiated successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF report. Please try again.')
    }
  }, [formatDate])

  // Filter and sort bookings
  const filteredBookings = useMemo(() => {
    let result = [...bookings].sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(b =>
        (b.labId?.name || '').toLowerCase().includes(query) ||
        (b.userId?.firstName || '').toLowerCase().includes(query) ||
        (b.userId?.lastName || '').toLowerCase().includes(query) ||
        (b.selectedTests || []).some(t => (t.testName || '').toLowerCase().includes(query))
      );
    }
    return result;
  }, [bookings, searchQuery]);

  const mostRecentBooking = filteredBookings[0];

  return (
    <div className="p-4 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Download Reports</h1>
          <p className="text-gray-500 mt-1">Access and manage your medical test reports</p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by lab, test, or doctor..."
            className="pl-10 pr-4 py-2 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <div className="mr-3 text-red-500">⚠️</div>
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader2 className="h-8 w-8 text-primary-600 animate-spin mb-4" />
          <p className="text-gray-500">Loading your reports...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No reports available</h3>
          <p className="text-gray-500 mt-2 max-w-sm mx-auto">
            Your medical reports will appear here once your test results are published by the lab.
          </p>
        </div>
      ) : (
        <>
          {/* Recent Report Summary Card */}
          {mostRecentBooking && !searchQuery && (
            <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl shadow-lg text-white p-6 md:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <FileText className="h-64 w-64" />
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2 text-primary-100 uppercase text-xs font-bold tracking-wider">
                  <span className="bg-white/20 px-2 py-1 rounded">Most Recent</span>
                  <span>{formatDate(mostRecentBooking.appointmentDate)}</span>
                </div>

                <h2 className="text-3xl font-bold mb-1">
                  {mostRecentBooking.labId?.name || 'Laboratory Report'}
                </h2>
                <p className="text-primary-100 text-lg mb-6 max-w-2xl">
                  {(mostRecentBooking.selectedTests || []).map(t => t.testName).slice(0, 3).join(', ')}
                  {(mostRecentBooking.selectedTests || []).length > 3 && ` +${(mostRecentBooking.selectedTests || []).length - 3} more`}
                </p>

                <div className="flex flex-wrap gap-3">
                  {Array.isArray(mostRecentBooking.testResults) && mostRecentBooking.testResults.length > 0 && (
                    <>
                      <button
                        onClick={() => downloadResultsPdf(mostRecentBooking)}
                        className="bg-white text-primary-700 hover:bg-gray-50 px-4 py-2 rounded-lg font-medium flex items-center transition-colors shadow-sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download PDF
                      </button>

                      <button
                        onClick={() => analyzeResultsWithAI(mostRecentBooking)}
                        disabled={analyzing[mostRecentBooking._id]}
                        className="bg-primary-500/30 hover:bg-primary-500/40 text-white border border-white/20 px-4 py-2 rounded-lg font-medium flex items-center transition-colors backdrop-blur-sm"
                      >
                        {analyzing[mostRecentBooking._id] ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Brain className="h-4 w-4 mr-2" />
                        )}
                        AI Analysis
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setSelected(mostRecentBooking)}
                    className="text-white/80 hover:text-white px-4 py-2 font-medium flex items-center transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reports List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-semibold text-gray-900">All Reports</h3>
              <span className="text-sm text-gray-500">{filteredBookings.length} found</span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Lab & Details</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredBookings.map(b => (
                    <tr key={b._id} className="hover:bg-gray-50/80 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{formatDate(b.appointmentDate)}</span>
                          <span className="text-xs">{b.appointmentTime || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-900">{b.labId?.name || 'Unknown Lab'}</span>
                          <span className="text-xs text-gray-500 truncate max-w-xs">
                            {(b.selectedTests || []).map(t => t.testName).join(', ')}
                            {!(b.selectedTests || []).length && 'No tests listed'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {b.reportFile ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FileText className="h-3 w-3 mr-1" />
                            Report Ready
                          </span>
                        ) : Array.isArray(b.testResults) && b.testResults.length > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <TestTube className="h-3 w-3 mr-1" />
                            Results Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          {b.reportFile ? (
                            <a
                              href={`http://localhost:5000/${b.reportFile}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-gray-400 hover:text-primary-600 p-2 hover:bg-primary-50 rounded-lg transition-colors border border-transparent hover:border-primary-100"
                              title="Download Original Report"
                            >
                              <Download className="h-4 w-4" />
                            </a>
                          ) : null}

                          {Array.isArray(b.testResults) && b.testResults.length > 0 && (
                            <>
                              <button
                                onClick={() => analyzeResultsWithAI(b)}
                                disabled={analyzing[b._id]}
                                className="text-purple-400 hover:text-purple-600 p-2 hover:bg-purple-50 rounded-lg transition-colors border border-transparent hover:border-purple-100"
                                title="AI Analysis"
                              >
                                {analyzing[b._id] ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Brain className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => downloadResultsPdf(b)}
                                className="text-gray-400 hover:text-primary-600 p-2 hover:bg-primary-50 rounded-lg transition-colors border border-transparent hover:border-primary-100"
                                title="Download PDF"
                              >
                                <FileText className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => setSelected(b)}
                                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors border border-transparent hover:border-gray-200"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredBookings.length === 0 && searchQuery && (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
              <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-gray-900 font-medium">No reports found</h3>
              <p className="text-gray-500 text-sm">Try adjusting your search query</p>
            </div>
          )}
        </>
      )}


      {
        selected && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Results</h3>
                <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              {(selected.testResults || []).map(tr => (
                <div key={tr.testId} className="mb-4 border border-gray-200 rounded p-3">
                  <div className="text-sm font-semibold text-gray-900 mb-2">
                    {(selected.selectedTests || []).find(t => (t.testId?._id || t.testId) === (tr.testId?._id || tr.testId))?.testName || 'Test'}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(tr.values || []).map((v, idx) => (
                      <div key={idx} className="text-sm text-gray-800 border border-gray-100 rounded p-2">
                        <div className="font-medium">{v.label}</div>
                        <div className="text-gray-700">
                          {v.type === 'boolean' ? (v.value ? 'Yes' : 'No') : v.value}
                          {v.unit ? ` ${v.unit}` : ''}
                        </div>
                        {v.referenceRange && (
                          <div className="text-xs text-gray-500">Ref: {v.referenceRange}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => analyzeResultsWithAI(selected)}
                  disabled={analyzing[selected._id]}
                  className="px-4 py-2 bg-purple-100 text-purple-800 rounded-md hover:bg-purple-200 inline-flex items-center disabled:opacity-50"
                >
                  {analyzing[selected._id] ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  AI Analysis
                </button>
                <button
                  onClick={() => downloadResultsPdf(selected)}
                  className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 inline-flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" /> Download PDF
                </button>
                <button onClick={() => setSelected(null)} className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Close</button>
              </div>
            </div>
          </div>
        )
      }

      {/* AI Analysis Modal */}
      {
        aiAnalysis && Object.keys(aiAnalysis).length > 0 && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Brain className="h-6 w-6 text-purple-600" />
                  <h3 className="text-lg font-medium text-gray-900">AI Analysis</h3>
                </div>
                <button
                  onClick={() => setAiAnalysis({})}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {Object.entries(aiAnalysis).map(([bookingId, analysis]) => {
                const booking = bookings.find(b => b._id === bookingId)
                return (
                  <div key={bookingId} className="mb-6">
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <h4 className="text-md font-semibold text-purple-900 mb-2">
                        Analysis for {booking?.userId?.firstName} {booking?.userId?.lastName}
                      </h4>
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {analysis}
                      </div>
                    </div>
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <div className="text-yellow-600">⚠️</div>
                        <div className="text-sm text-yellow-800">
                          <strong>Important:</strong> This AI analysis is for informational purposes only and should not replace professional medical advice. Please consult with a qualified healthcare provider for proper medical interpretation and treatment recommendations.
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              <div className="flex justify-end">
                <button
                  onClick={() => setAiAnalysis({})}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                >
                  Close Analysis
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  )
}

export default DownloadReports


