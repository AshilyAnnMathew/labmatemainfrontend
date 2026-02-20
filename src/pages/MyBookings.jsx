import { useState, useEffect } from 'react'
import {
  Calendar,
  MapPin,
  Phone,
  Clock,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader,
  Search,
  Eye,
  Trash2,
  Building2,
  FlaskConical,
  Package,
  TestTube,
  Beaker,
  FileText,
  Shield,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import Swal from 'sweetalert2'
import api from '../services/api'

const { bookingAPI } = api

// Status flow steps for the tracker
const STATUS_STEPS = [
  { key: 'pending', label: 'Booked', icon: Calendar },
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle },
  { key: 'sample_collected', label: 'Sample Collected', icon: TestTube },
  { key: 'partially_completed', label: 'Results In Progress', icon: Beaker },
  { key: 'result_published', label: 'Results Published', icon: FileText },
  { key: 'completed', label: 'Completed', icon: Shield }
]

const STATUS_ORDER = STATUS_STEPS.map(s => s.key)

const MyBookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [expandedCards, setExpandedCards] = useState({})

  useEffect(() => {
    fetchBookings()
  }, [currentPage, filterStatus])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await bookingAPI.getBookings(filterStatus, currentPage, 12)
      setBookings(response.data)
      setTotalPages(response.pagination.pages)
    } catch (err) {
      setError(err.message || 'Failed to fetch bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (booking) => {
    const result = await Swal.fire({
      title: 'Cancel Booking?',
      text: `Are you sure you want to cancel your appointment at ${booking.labId?.name}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, cancel it!',
      cancelButtonText: 'No, keep it'
    })

    if (result.isConfirmed) {
      try {
        await bookingAPI.cancelBooking(booking._id)
        await fetchBookings()
        Swal.fire({ icon: 'success', title: 'Cancelled', text: 'Booking cancelled successfully', confirmButtonColor: '#2563eb' })
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Failed', text: err.message || 'Failed to cancel', confirmButtonColor: '#dc2626' })
      }
    }
  }

  // ── helpers ──

  const getStatusIndex = (status) => {
    const idx = STATUS_ORDER.indexOf(status)
    return idx >= 0 ? idx : -1
  }

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Booked',
      confirmed: 'Confirmed',
      sample_collected: 'Sample Collected',
      partially_completed: 'Results In Progress',
      result_published: 'Results Published',
      completed: 'Completed',
      cancelled: 'Cancelled'
    }
    return labels[status] || status
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-amber-100 text-amber-800 border-amber-200',
      confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
      sample_collected: 'bg-purple-100 text-purple-800 border-purple-200',
      partially_completed: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      result_published: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getPaymentStatusColor = (ps) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      refunded: 'bg-gray-100 text-gray-800'
    }
    return colors[ps] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
  const formatTime = (t) => t

  const getTestProgress = (booking) => {
    const total = (booking.testResults || []).length
    const verified = (booking.testResults || []).filter(r => r.status === 'verified').length
    const completed = (booking.testResults || []).filter(r => r.status === 'completed' || r.status === 'verified').length
    // Estimate expected tests
    let expected = (booking.selectedTests?.length || 0)
    if (booking.selectedPackages) {
      booking.selectedPackages.forEach(p => {
        expected += (p.packageId?.selectedTests?.length || 0)
      })
    }
    if (expected === 0) expected = total || 1
    return { total: expected, completed, verified, percent: expected > 0 ? Math.round((completed / expected) * 100) : 0 }
  }

  const filteredBookings = bookings.filter(b => {
    const searchLower = searchTerm.toLowerCase()
    const labName = b.labId?.name?.toLowerCase() || ''
    const bookingId = b._id.toLowerCase()
    return labName.includes(searchLower) || bookingId.includes(searchLower)
  })

  // ── Status Step Tracker ──
  const StatusTracker = ({ status }) => {
    if (status === 'cancelled') {
      return (
        <div className="flex items-center gap-2 py-2">
          <XCircle className="h-5 w-5 text-red-500" />
          <span className="text-sm font-medium text-red-700">This booking has been cancelled</span>
        </div>
      )
    }

    const currentIdx = getStatusIndex(status)

    return (
      <div className="flex items-center w-full py-2">
        {STATUS_STEPS.map((step, idx) => {
          const isReached = idx <= currentIdx
          const isCurrent = idx === currentIdx
          const Icon = step.icon

          return (
            <div key={step.key} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center relative">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center border-2 transition-all ${isCurrent
                    ? 'bg-primary-600 border-primary-600 text-white shadow-md shadow-primary-200 scale-110'
                    : isReached
                      ? 'bg-emerald-500 border-emerald-500 text-white'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}>
                  {isReached && !isCurrent ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-3.5 w-3.5" />}
                </div>
                <span className={`text-[9px] mt-1 text-center leading-tight max-w-[60px] ${isCurrent ? 'font-bold text-primary-700' : isReached ? 'text-emerald-600 font-medium' : 'text-gray-400'
                  }`}>
                  {step.label}
                </span>
              </div>
              {idx < STATUS_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 mt-[-14px] rounded ${idx < currentIdx ? 'bg-emerald-400' : 'bg-gray-200'
                  }`} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // ── Progress Bar ──
  const ProgressBar = ({ progress }) => {
    const color = progress.percent === 100 ? 'bg-emerald-500' : progress.percent > 0 ? 'bg-indigo-500' : 'bg-gray-300'
    return (
      <div className="w-full">
        <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
          <div className={`h-1.5 rounded-full transition-all duration-500 ${color}`} style={{ width: `${progress.percent}%` }} />
        </div>
        <div className="flex justify-between mt-0.5">
          <span className="text-[10px] text-gray-500">{progress.completed}/{progress.total} done</span>
          <span className="text-[10px] font-medium text-gray-700">{progress.percent}%</span>
        </div>
      </div>
    )
  }

  // ── Booking Card ──
  const renderBookingCard = (booking) => {
    const lab = booking.labId
    const address = typeof lab?.address === 'string'
      ? (() => { try { const a = JSON.parse(lab.address); return `${a.street}, ${a.city}, ${a.state}` } catch { return lab.address } })()
      : `${lab?.address?.street || ''}, ${lab?.address?.city || ''}, ${lab?.address?.state || ''}`
    const contact = typeof lab?.contact === 'string'
      ? (() => { try { const c = JSON.parse(lab.contact); return { phone: c.phone } } catch { return { phone: lab.contact } } })()
      : { phone: lab?.contact?.phone || '' }
    const progress = getTestProgress(booking)
    const sampleId = booking.samples?.[0]?.sampleId
    const isExpanded = expandedCards[booking._id]
    const showProgress = ['sample_collected', 'partially_completed', 'result_published', 'completed'].includes(booking.status)

    return (
      <div key={booking._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all">
        {/* Card Header */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-gray-900">{lab?.name || 'Lab'}</h3>
                <div className="flex gap-1.5 mt-1">
                  <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full border ${getStatusColor(booking.status)}`}>
                    {getStatusLabel(booking.status)}
                  </span>
                  <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full ${getPaymentStatusColor(booking.paymentStatus)}`}>
                    {booking.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { setSelectedBooking(booking); setShowBookingModal(true) }}
                className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-md" title="View Details"
              >
                <Eye className="h-4 w-4" />
              </button>
              {booking.status === 'pending' && (
                <button onClick={() => handleCancelBooking(booking)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-md" title="Cancel">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Status Step Tracker */}
          {booking.status !== 'cancelled' && (
            <div className="mb-3 bg-gray-50 rounded-lg px-3 py-2">
              <StatusTracker status={booking.status} />
            </div>
          )}
          {booking.status === 'cancelled' && (
            <div className="mb-3 bg-red-50 rounded-lg px-3 py-2">
              <StatusTracker status={booking.status} />
            </div>
          )}

          {/* Quick Info */}
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{formatDate(booking.appointmentDate)}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
              <span>{formatTime(booking.appointmentTime)}</span>
            </div>
            <div className="flex items-center col-span-2">
              <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
              <span className="truncate">{address}</span>
            </div>
          </div>

          {/* Sample ID */}
          {sampleId && (
            <div className="mt-2 flex items-center gap-2">
              <TestTube className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-xs text-gray-500">Sample:</span>
              <span className="text-xs font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">{sampleId}</span>
            </div>
          )}

          {/* Test Progress (for in-progress bookings) */}
          {showProgress && progress.total > 0 && (
            <div className="mt-3 bg-indigo-50/50 rounded-lg px-3 py-2 border border-indigo-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-indigo-800">Test Results Progress</span>
                <span className="text-xs text-indigo-600">{progress.verified} verified</span>
              </div>
              <ProgressBar progress={progress} />
            </div>
          )}
        </div>

        {/* Card Footer — Expandable Details */}
        <div className="border-t border-gray-100">
          <button
            onClick={() => setExpandedCards(prev => ({ ...prev, [booking._id]: !prev[booking._id] }))}
            className="w-full px-5 py-2.5 flex items-center justify-between text-xs text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <div className="flex gap-4">
              <span>Tests: {booking.selectedTests?.length || 0}</span>
              <span>Packages: {booking.selectedPackages?.length || 0}</span>
              <span>₹{booking.totalAmount}</span>
            </div>
            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          </button>

          {isExpanded && (
            <div className="px-5 pb-4 space-y-2">
              {(booking.selectedTests || []).map((t, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <FlaskConical className="h-3.5 w-3.5 text-primary-500" />
                    <span className="text-gray-700">{t.testName || t.testId?.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">₹{t.price}</span>
                </div>
              ))}
              {(booking.selectedPackages || []).map((p, i) => (
                <div key={i} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-1.5">
                  <div className="flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="text-gray-700">{p.packageName || p.packageId?.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">₹{p.price}</span>
                </div>
              ))}
              <div className="text-xs text-gray-400 mt-1">Booking ID: {booking._id.slice(-8)}</div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <p className="text-sm text-gray-500 mt-1">Track the status of your laboratory tests in real-time</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by lab name or booking ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg w-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1) }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Booked</option>
          <option value="confirmed">Confirmed</option>
          <option value="sample_collected">Sample Collected</option>
          <option value="partially_completed">Results In Progress</option>
          <option value="result_published">Results Published</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center text-sm">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Bookings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16">
            <Loader className="h-8 w-8 animate-spin text-primary-500 mb-3" />
            <span className="text-gray-500 text-sm">Loading your bookings...</span>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No bookings found</p>
          </div>
        ) : (
          filteredBookings.map(renderBookingCard)
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Previous</button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button key={page} onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm border rounded-lg ${currentPage === page ? 'bg-primary-600 text-white border-primary-600' : 'border-gray-300 hover:bg-gray-50'}`}>
                {page}
              </button>
            ))}
            <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {showBookingModal && selectedBooking && (() => {
        const lab = selectedBooking.labId
        const address = typeof lab?.address === 'string'
          ? (() => { try { const a = JSON.parse(lab.address); return `${a.street}, ${a.city}, ${a.state} - ${a.zipCode}` } catch { return lab.address } })()
          : `${lab?.address?.street || ''}, ${lab?.address?.city || ''}, ${lab?.address?.state || ''}`
        const contact = typeof lab?.contact === 'string'
          ? (() => { try { const c = JSON.parse(lab.contact); return c } catch { return { phone: lab.contact } } })()
          : lab?.contact || {}
        const progress = getTestProgress(selectedBooking)
        const sampleId = selectedBooking.samples?.[0]?.sampleId

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

              {/* Modal Header */}
              <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-shrink-0">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{lab?.name || 'Booking Details'}</h3>
                  <p className="text-xs text-gray-500">Booking ID: {selectedBooking._id.slice(-8)}</p>
                </div>
                <button onClick={() => setShowBookingModal(false)} className="p-1 hover:bg-gray-200 rounded-full">
                  <XCircle className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-5 flex-1">

                {/* Status Tracker */}
                <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Booking Progress</h4>
                  <StatusTracker status={selectedBooking.status} />
                </div>

                {/* Test Progress */}
                {['sample_collected', 'partially_completed', 'result_published', 'completed'].includes(selectedBooking.status) && progress.total > 0 && (
                  <div className="bg-indigo-50 rounded-lg px-4 py-3 border border-indigo-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-indigo-800">Test Results Progress</span>
                      <span className="text-xs text-indigo-600">{progress.verified}/{progress.total} verified</span>
                    </div>
                    <ProgressBar progress={progress} />
                    {selectedBooking.status === 'result_published' && (
                      <p className="mt-2 text-xs text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="h-3.5 w-3.5" />
                        Your results are published! Check "Download Reports" to view them.
                      </p>
                    )}
                  </div>
                )}

                {/* Sample ID */}
                {sampleId && (
                  <div className="flex items-center gap-3 bg-purple-50 rounded-lg px-4 py-3 border border-purple-200">
                    <TestTube className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="text-xs text-purple-600 font-medium">Sample ID</div>
                      <div className="font-mono text-sm font-bold text-purple-800">{sampleId}</div>
                    </div>
                  </div>
                )}

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Appointment</h4>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center text-gray-700"><Calendar className="h-3.5 w-3.5 mr-2 text-gray-400" />{formatDate(selectedBooking.appointmentDate)}</div>
                      <div className="flex items-center text-gray-700"><Clock className="h-3.5 w-3.5 mr-2 text-gray-400" />{formatTime(selectedBooking.appointmentTime)}</div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Payment</h4>
                    <div className="space-y-1.5 text-sm">
                      <div className="font-bold text-gray-900">₹{selectedBooking.totalAmount}</div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${getPaymentStatusColor(selectedBooking.paymentStatus)}`}>
                          {selectedBooking.paymentStatus}
                        </span>
                        <span className="text-xs text-gray-500">{selectedBooking.paymentMethod === 'pay_now' ? 'Online' : 'At Lab'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lab Location */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Lab</h4>
                  <div className="space-y-1.5 text-sm text-gray-700">
                    <div className="flex items-center"><Building2 className="h-3.5 w-3.5 mr-2 text-gray-400" /><span className="font-medium">{lab?.name}</span></div>
                    <div className="flex items-center"><MapPin className="h-3.5 w-3.5 mr-2 text-gray-400" />{address}</div>
                    {contact.phone && <div className="flex items-center"><Phone className="h-3.5 w-3.5 mr-2 text-gray-400" />{contact.phone}</div>}
                  </div>
                </div>

                {/* Tests List */}
                {selectedBooking.selectedTests?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <FlaskConical className="h-4 w-4 mr-2 text-primary-600" />
                      Tests ({selectedBooking.selectedTests.length})
                    </h4>
                    <div className="space-y-1.5">
                      {selectedBooking.selectedTests.map((t, i) => {
                        const result = (selectedBooking.testResults || []).find(r => (r.testId?._id || r.testId)?.toString() === (t.testId?._id || t.testId)?.toString())
                        const testStatus = result?.status || 'pending'
                        const statusColors = { pending: 'text-gray-400', completed: 'text-indigo-600', verified: 'text-emerald-600' }
                        return (
                          <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                            <span className="text-sm text-gray-800">{t.testName || t.testId?.name}</span>
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-medium ${statusColors[testStatus]}`}>{testStatus}</span>
                              <span className="text-xs text-gray-500">₹{t.price}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Packages List */}
                {selectedBooking.selectedPackages?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                      <Package className="h-4 w-4 mr-2 text-indigo-600" />
                      Packages ({selectedBooking.selectedPackages.length})
                    </h4>
                    <div className="space-y-1.5">
                      {selectedBooking.selectedPackages.map((p, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                          <span className="text-sm text-gray-800">{p.packageName || p.packageId?.name}</span>
                          <span className="text-xs text-gray-500">₹{p.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {selectedBooking.notes && (
                  <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 text-sm text-amber-800">
                    <strong>Notes:</strong> {selectedBooking.notes}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0 bg-gray-50">
                <button onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Close
                </button>
                {selectedBooking.status === 'pending' && (
                  <button onClick={() => { setShowBookingModal(false); handleCancelBooking(selectedBooking) }}
                    className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default MyBookings
