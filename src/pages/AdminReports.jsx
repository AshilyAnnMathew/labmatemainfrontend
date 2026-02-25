import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  DollarSign,
  TestTube,
  Building2,
  Download,
  RefreshCw,
  Brain,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  FileText,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import api from '../services/api'
import Swal from 'sweetalert2'

const AdminReports = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [aiInsights, setAiInsights] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState('30')
  const [exporting, setExporting] = useState('')
  const reportRef = useRef(null)

  // API key for AI insights
  const API_KEY = 'AIzaSyAywhccPmyHxbbK_D5hhM6n7tC8PnX_El0'
  const genAI = useMemo(() => new GoogleGenerativeAI(API_KEY), [])

  // Fetch analytics data
  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const response = await api.adminAPI.getAnalytics({
        period: selectedPeriod,
        metric: 'all'
      })
      if (response.success) {
        setAnalytics(response.data)
      } else {
        setError(response.message || 'Failed to fetch analytics')
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch analytics')
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedPeriod])

  // Generate AI insights
  const generateAIInsights = useCallback(async () => {
    if (!analytics) return
    try {
      setAnalyzing(true)
      const prompt = `
As a business intelligence AI assistant, analyze the following laboratory management system data and provide comprehensive insights:

LABORATORY ANALYTICS DATA:
${JSON.stringify(analytics, null, 2)}

Please provide:
1. KEY PERFORMANCE INDICATORS: Highlight the most important metrics
2. BUSINESS INSIGHTS: What do these numbers tell us about performance?
3. GROWTH OPPORTUNITIES: Areas for improvement
4. RECOMMENDATIONS: Specific actionable steps

Format your response as plain text without any markdown formatting, asterisks (*), bold text (**), or other special characters. Use simple bullet points with dashes (-) if needed.
      `
      let insights = ''
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
        const result = await model.generateContent(prompt)
        const response = await result.response
        insights = response.text()
      } catch (libraryError) {
        console.warn('GoogleGenerativeAI library failed, trying direct API call:', libraryError.message)
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-goog-api-key': API_KEY },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
        })
        if (!response.ok) throw new Error(`API request failed: ${response.status}`)
        const data = await response.json()
        insights = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No insights generated'
      }
      setAiInsights(insights)
    } catch (error) {
      console.error('AI Analysis error:', error)
      setAiInsights('Sorry, I encountered an error while analyzing the data. Please try again later.')
    } finally {
      setAnalyzing(false)
    }
  }, [analytics, genAI])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  // ─── Export Functions ────────────────────────────────────

  const handleCSVExport = async () => {
    try {
      setExporting('csv')
      await api.adminAPI.exportReports('csv', selectedPeriod)
      Swal.fire({ icon: 'success', title: 'CSV Exported!', text: 'Bookings data has been downloaded as CSV.', timer: 2000, showConfirmButton: false })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Export Failed', text: err.message || 'Failed to export CSV' })
    } finally {
      setExporting('')
    }
  }

  const handlePDFExport = () => {
    setExporting('pdf')
    // Build a printable HTML document from current analytics
    const d = displayAnalytics
    const now = new Date().toLocaleString('en-IN')
    const periodLabel = selectedPeriod === '7' ? 'Last 7 Days' : selectedPeriod === '30' ? 'Last 30 Days' : selectedPeriod === '90' ? 'Last 90 Days' : 'Last Year'

    const statusRows = (d.bookings?.byStatus || []).map(s =>
      `<tr><td style="padding:8px;border-bottom:1px solid #eee;text-transform:capitalize">${s._id || s.status}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${s.count}</td></tr>`
    ).join('')

    const labRows = (d.bookings?.byLab || []).map(l =>
      `<tr><td style="padding:8px;border-bottom:1px solid #eee">${l.labName}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${l.count}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${(l.revenue || 0).toLocaleString('en-IN')}</td></tr>`
    ).join('')

    const testRows = (d.tests?.popular || []).map(t =>
      `<tr><td style="padding:8px;border-bottom:1px solid #eee">${t.testName}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${t.count}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${(t.revenue || 0).toLocaleString('en-IN')}</td></tr>`
    ).join('')

    const printContent = `
      <!DOCTYPE html>
      <html><head><title>LabMate360 Analytics Report</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; }
        h1 { color: #1e40af; margin-bottom: 4px; }
        .subtitle { color: #6b7280; font-size: 14px; margin-bottom: 30px; }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 30px; }
        .stat-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; }
        .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-value { font-size: 24px; font-weight: 700; margin: 4px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
        th { text-align: left; padding: 10px 8px; background: #f3f4f6; font-size: 12px; text-transform: uppercase; color: #6b7280; }
        h2 { font-size: 18px; color: #1f2937; margin: 24px 0 12px; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center; }
        .ai-section { background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 10px; padding: 20px; white-space: pre-wrap; font-size: 13px; line-height: 1.6; }
        @media print { body { padding: 20px; } }
      </style></head><body>
        <h1>📊 LabMate360 — Analytics Report</h1>
        <p class="subtitle">Period: ${periodLabel} &nbsp;|&nbsp; Generated: ${now}</p>

        <div class="stats-grid">
          <div class="stat-card"><div class="stat-label">Total Bookings</div><div class="stat-value">${d.overview?.totalBookings || 0}</div></div>
          <div class="stat-card"><div class="stat-label">Total Revenue</div><div class="stat-value">₹${(d.overview?.totalRevenue || 0).toLocaleString('en-IN')}</div></div>
          <div class="stat-card"><div class="stat-label">Active Labs</div><div class="stat-value">${d.overview?.activeLabs || 0}</div></div>
          <div class="stat-card"><div class="stat-label">Total Users</div><div class="stat-value">${d.overview?.totalUsers || 0}</div></div>
        </div>

        <h2>Booking Status Distribution</h2>
        <table>
          <thead><tr><th>Status</th><th style="text-align:right">Count</th></tr></thead>
          <tbody>${statusRows || '<tr><td colspan="2" style="padding:8px;color:#999">No data</td></tr>'}</tbody>
        </table>

        <h2>Revenue by Lab</h2>
        <table>
          <thead><tr><th>Lab Name</th><th style="text-align:right">Bookings</th><th style="text-align:right">Revenue</th></tr></thead>
          <tbody>${labRows || '<tr><td colspan="3" style="padding:8px;color:#999">No data</td></tr>'}</tbody>
        </table>

        <h2>Popular Tests</h2>
        <table>
          <thead><tr><th>Test Name</th><th style="text-align:right">Count</th><th style="text-align:right">Revenue</th></tr></thead>
          <tbody>${testRows || '<tr><td colspan="3" style="padding:8px;color:#999">No data</td></tr>'}</tbody>
        </table>

        ${aiInsights ? `<h2>🤖 AI-Powered Insights</h2><div class="ai-section">${aiInsights}</div>` : ''}

        <div class="footer">LabMate360 Analytics Report — Confidential — Generated automatically</div>
      </body></html>
    `

    const printWindow = window.open('', '_blank')
    printWindow.document.write(printContent)
    printWindow.document.close()
    printWindow.onload = () => {
      printWindow.print()
      setExporting('')
    }
    // Fallback if onload doesn't fire
    setTimeout(() => setExporting(''), 3000)
  }

  const handleJSONExport = async () => {
    try {
      setExporting('json')
      const response = await api.adminAPI.exportReports('json', selectedPeriod)
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `analytics-${selectedPeriod}-days.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      Swal.fire({ icon: 'success', title: 'JSON Exported!', text: 'Data exported as JSON file.', timer: 2000, showConfirmButton: false })
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Export Failed', text: err.message || 'Failed to export JSON' })
    } finally {
      setExporting('')
    }
  }

  // ─── Display Helpers ─────────────────────────────────────

  const displayAnalytics = analytics || {
    overview: { totalBookings: 0, totalRevenue: 0, activeLabs: 0, totalUsers: 0, bookingGrowth: 0, revenueGrowth: 0, userGrowth: 0 },
    bookings: { daily: [], byStatus: [], byLab: [] },
    revenue: { monthly: [], byPaymentMethod: [] },
    tests: { popular: [], categories: [] },
    users: { newRegistrations: [], activeUsers: 0, retentionRate: 0 },
    performance: { averageBookingTime: 0, labUtilization: 0, customerSatisfaction: 0, reportDeliveryTime: 0 }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0)
  }

  const formatNumber = (num) => new Intl.NumberFormat('en-IN').format(num || 0)

  const statusColors = {
    confirmed: { bg: 'bg-emerald-500', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    completed: { bg: 'bg-blue-500', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    pending: { bg: 'bg-amber-500', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
    cancelled: { bg: 'bg-red-500', light: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
    processing: { bg: 'bg-purple-500', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    sample_collected: { bg: 'bg-indigo-500', light: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  }

  const getStatusStyle = (status) => statusColors[status] || statusColors.pending

  // Calculate totals for percentages
  const totalStatusCount = (displayAnalytics.bookings?.byStatus || []).reduce((s, b) => s + b.count, 0)
  const maxLabRevenue = Math.max(...(displayAnalytics.bookings?.byLab || []).map(l => l.revenue || 0), 1)
  const maxTestCount = Math.max(...(displayAnalytics.tests?.popular || []).map(t => t.count || 0), 1)

  // Booking trend bar chart data
  const dailyBookings = displayAnalytics.bookings?.daily || []
  const maxDailyCount = Math.max(...dailyBookings.map(d => d.count || 0), 1)

  // ─── Render ──────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6" ref={reportRef}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Comprehensive insights into laboratory operations and performance</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm cursor-pointer"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last 1 year</option>
            </select>
            <ChevronDown className="h-4 w-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button
            onClick={fetchAnalytics}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-sm disabled:opacity-50 text-sm font-medium"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500 mr-3" />
          <span className="text-gray-500 font-medium">Loading analytics...</span>
        </div>
      ) : (
        <>
          {/* ─── Key Metrics ──────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { title: 'Total Bookings', value: formatNumber(displayAnalytics.overview?.totalBookings), change: displayAnalytics.overview?.bookingGrowth, icon: Calendar, gradient: 'from-blue-500 to-blue-600', lightBg: 'bg-blue-50' },
              { title: 'Total Revenue', value: formatCurrency(displayAnalytics.overview?.totalRevenue), change: displayAnalytics.overview?.revenueGrowth, icon: DollarSign, gradient: 'from-emerald-500 to-emerald-600', lightBg: 'bg-emerald-50' },
              { title: 'Active Labs', value: displayAnalytics.overview?.activeLabs || 0, icon: Building2, gradient: 'from-purple-500 to-purple-600', lightBg: 'bg-purple-50' },
              { title: 'Total Users', value: formatNumber(displayAnalytics.overview?.totalUsers), change: displayAnalytics.overview?.userGrowth, icon: Users, gradient: 'from-orange-500 to-orange-600', lightBg: 'bg-orange-50' },
            ].map((stat, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    {stat.change !== undefined && stat.change !== 0 && (
                      <div className={`flex items-center gap-1 mt-2 text-sm font-medium ${stat.change > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {stat.change > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        {Math.abs(stat.change).toFixed(1)}%
                      </div>
                    )}
                    {(stat.change === undefined || stat.change === 0) && (
                      <p className="text-xs text-gray-400 mt-2">{stat.change === 0 ? 'No change' : ''}</p>
                    )}
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-sm`}>
                    <stat.icon className="h-5 w-5 text-white" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ─── Charts Row ──────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Booking Trends Bar Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Booking Trends</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{dailyBookings.length} days of data</p>
                </div>
                <BarChart3 className="h-5 w-5 text-gray-400" />
              </div>
              {dailyBookings.length > 0 ? (
                <div className="flex items-end gap-[3px] h-48 pt-2">
                  {dailyBookings.slice(-30).map((day, i) => {
                    const height = Math.max((day.count / maxDailyCount) * 100, 4)
                    const date = day._id || day.date || ''
                    const shortDate = date.slice(-2)
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group relative">
                        <div
                          className="w-full rounded-t-sm bg-gradient-to-t from-primary-500 to-primary-400 transition-all duration-300 hover:from-primary-600 hover:to-primary-500 cursor-pointer"
                          style={{ height: `${height}%`, minHeight: '3px' }}
                        />
                        {/* Tooltip */}
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {date}: {day.count}
                        </div>
                        {i % Math.ceil(dailyBookings.slice(-30).length / 6) === 0 && (
                          <span className="text-[9px] text-gray-400 mt-1 leading-none">{shortDate}</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                  <BarChart3 className="h-8 w-8 mr-2" />
                  No booking trend data available
                </div>
              )}
            </div>

            {/* Revenue by Lab - Horizontal Bar Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Revenue by Lab</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Performance across all labs</p>
                </div>
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {(displayAnalytics.bookings?.byLab || []).length > 0 ? (
                  (displayAnalytics.bookings?.byLab || []).map((lab, i) => {
                    const barWidth = Math.max(((lab.revenue || 0) / maxLabRevenue) * 100, 4)
                    const colors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500']
                    return (
                      <div key={lab._id || i}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-gray-700 truncate mr-3">{lab.labName}</span>
                          <div className="text-right flex-shrink-0">
                            <span className="text-sm font-semibold text-gray-900">{formatCurrency(lab.revenue)}</span>
                            <span className="text-xs text-gray-400 ml-2">{lab.count} bookings</span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-700 ease-out`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="h-40 flex items-center justify-center text-gray-400 text-sm">No lab data available</div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Detailed Analytics ──────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Popular Tests */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900">Popular Tests</h3>
                <TestTube className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-4">
                {(displayAnalytics.tests?.popular || []).length > 0 ? (
                  (displayAnalytics.tests?.popular || []).slice(0, 6).map((test, i) => {
                    const barWidth = Math.max(((test.count || 0) / maxTestCount) * 100, 6)
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 truncate mr-2">{test.testName}</span>
                          <span className="text-sm font-bold text-primary-600 flex-shrink-0">{formatCurrency(test.revenue)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full rounded-full bg-primary-400 transition-all duration-700" style={{ width: `${barWidth}%` }} />
                          </div>
                          <span className="text-xs text-gray-400 w-12 text-right">{test.count} tests</span>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="py-8 text-center text-gray-400 text-sm">No test data available</div>
                )}
              </div>
            </div>

            {/* Booking Status - Donut-style */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900">Booking Status</h3>
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
              {(displayAnalytics.bookings?.byStatus || []).length > 0 ? (
                <>
                  {/* Visual donut ring using conic gradient */}
                  <div className="flex justify-center mb-5">
                    {(() => {
                      const statuses = displayAnalytics.bookings?.byStatus || []
                      const total = statuses.reduce((s, b) => s + b.count, 0)
                      const colorMap = { confirmed: '#10b981', completed: '#3b82f6', pending: '#f59e0b', cancelled: '#ef4444', processing: '#8b5cf6', sample_collected: '#6366f1' }
                      let accumulated = 0
                      const stops = statuses.map(s => {
                        const pct = total > 0 ? (s.count / total) * 100 : 0
                        const start = accumulated
                        accumulated += pct
                        const color = colorMap[s._id || s.status] || '#9ca3af'
                        return `${color} ${start}% ${accumulated}%`
                      }).join(', ')
                      return (
                        <div
                          className="w-32 h-32 rounded-full relative"
                          style={{ background: `conic-gradient(${stops || '#e5e7eb 0% 100%'})` }}
                        >
                          <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center">
                            <div className="text-center">
                              <p className="text-xl font-bold text-gray-900">{total}</p>
                              <p className="text-[10px] text-gray-400 uppercase tracking-wider">Total</p>
                            </div>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                  {/* Legend */}
                  <div className="space-y-2.5">
                    {(displayAnalytics.bookings?.byStatus || []).map((status, i) => {
                      const key = status._id || status.status || 'unknown'
                      const style = getStatusStyle(key)
                      const pct = totalStatusCount > 0 ? ((status.count / totalStatusCount) * 100).toFixed(1) : 0
                      return (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${style.bg}`} />
                            <span className="text-sm font-medium text-gray-700 capitalize">{key.replace('_', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-900">{status.count}</span>
                            <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center text-gray-400 text-sm">No status data available</div>
              )}
            </div>

            {/* Performance Metrics */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-gray-900">Performance</h3>
                <TrendingUp className="h-5 w-5 text-gray-400" />
              </div>
              <div className="space-y-5">
                {[
                  { label: 'Lab Utilization', value: `${displayAnalytics.performance?.labUtilization || 0}%`, progress: displayAnalytics.performance?.labUtilization || 0, color: 'bg-blue-500', icon: Building2 },
                  { label: 'Avg. Booking Time', value: `${displayAnalytics.performance?.averageBookingTime || 0}h`, progress: Math.min((displayAnalytics.performance?.averageBookingTime || 0) / 48 * 100, 100), color: 'bg-amber-500', icon: Clock },
                  { label: 'Report Delivery', value: `${displayAnalytics.performance?.reportDeliveryTime || 0}h`, progress: Math.min((displayAnalytics.performance?.reportDeliveryTime || 0) / 48 * 100, 100), color: 'bg-emerald-500', icon: FileText },
                  { label: 'Satisfaction', value: `${displayAnalytics.performance?.customerSatisfaction || 0}/5`, progress: ((displayAnalytics.performance?.customerSatisfaction || 0) / 5) * 100, color: 'bg-purple-500', icon: CheckCircle },
                ].map((metric, i) => (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <metric.icon className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{metric.label}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{metric.value}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${metric.color} transition-all duration-700`}
                        style={{ width: `${Math.max(metric.progress, 2)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── AI Insights ─────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 via-white to-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Brain className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">AI-Powered Business Insights</h3>
                    <p className="text-sm text-gray-500">Automated analysis powered by Gemini AI</p>
                  </div>
                </div>
                <button
                  onClick={generateAIInsights}
                  disabled={analyzing || !analytics}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all text-sm font-medium disabled:opacity-50 shadow-sm"
                >
                  {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                  {analyzing ? 'Analyzing...' : 'Generate Insights'}
                </button>
              </div>
            </div>
            <div className="p-6">
              {analyzing ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-purple-500 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Analyzing your data with AI...</p>
                    <p className="text-gray-400 text-sm mt-1">This may take a few seconds</p>
                  </div>
                </div>
              ) : aiInsights ? (
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-xl p-5">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{aiInsights}</div>
                </div>
              ) : (
                <div className="text-center py-10 text-gray-400">
                  <Brain className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No insights generated yet</p>
                  <p className="text-sm mt-1">Click "Generate Insights" to get AI analysis of your data</p>
                </div>
              )}
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  <strong>Disclaimer:</strong> AI insights are generated based on available data and should be used as guidance. Always verify important decisions with additional analysis.
                </p>
              </div>
            </div>
          </div>

          {/* ─── Export Reports ───────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Export Reports</h3>
                <p className="text-sm text-gray-500 mt-0.5">Download analytics data in various formats</p>
              </div>
              <Download className="h-5 w-5 text-gray-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* PDF Report */}
              <button
                onClick={handlePDFExport}
                disabled={!!exporting}
                className="flex items-center gap-3 px-5 py-4 border-2 border-gray-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all group disabled:opacity-50"
              >
                <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                  {exporting === 'pdf' ? <Loader2 className="h-5 w-5 text-red-600 animate-spin" /> : <Printer className="h-5 w-5 text-red-600" />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{exporting === 'pdf' ? 'Generating...' : 'PDF Report'}</p>
                  <p className="text-xs text-gray-500">Print-ready analytics report</p>
                </div>
              </button>

              {/* CSV Export */}
              <button
                onClick={handleCSVExport}
                disabled={!!exporting}
                className="flex items-center gap-3 px-5 py-4 border-2 border-gray-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50 transition-all group disabled:opacity-50"
              >
                <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                  {exporting === 'csv' ? <Loader2 className="h-5 w-5 text-emerald-600 animate-spin" /> : <FileSpreadsheet className="h-5 w-5 text-emerald-600" />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{exporting === 'csv' ? 'Exporting...' : 'CSV Export'}</p>
                  <p className="text-xs text-gray-500">Spreadsheet-compatible data</p>
                </div>
              </button>

              {/* JSON Export */}
              <button
                onClick={handleJSONExport}
                disabled={!!exporting}
                className="flex items-center gap-3 px-5 py-4 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all group disabled:opacity-50"
              >
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  {exporting === 'json' ? <Loader2 className="h-5 w-5 text-blue-600 animate-spin" /> : <FileText className="h-5 w-5 text-blue-600" />}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-900">{exporting === 'json' ? 'Exporting...' : 'JSON Data'}</p>
                  <p className="text-xs text-gray-500">Raw JSON data export</p>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AdminReports
