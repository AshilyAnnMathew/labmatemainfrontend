import { useState, useEffect, Fragment } from 'react'
import {
  Calendar,
  Clock,
  User,
  CreditCard,
  CheckCircle,
  AlertCircle,
  Eye,
  MapPin,
  Phone,
  Mail,
  TestTube,
  Package,
  DollarSign,
  Search,
  Filter,
  Download,
  Loader,
  Building2,
  ChevronDown,
  ChevronUp,
  X,
  Edit,
  Trash2
} from 'lucide-react'
import Swal from 'sweetalert2'
import api from '../services/api'

const AdminBookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterLab, setFilterLab] = useState('all')
  const [filterDate, setFilterDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [expandedBookings, setExpandedBookings] = useState(new Set())
  const [labs, setLabs] = useState([])

  const limit = 10

  useEffect(() => {
    fetchBookings()
  }, [currentPage, filterStatus, filterLab, filterDate])

  useEffect(() => {
    fetchLabs()
  }, [])

  const fetchLabs = async () => {
    try {
      const response = await api.labAPI.getLabs()
      setLabs(response.data || [])
    } catch (err) {
      console.error('Error fetching labs:', err)
    }
  }

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError('')

      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString()
      })

      if (filterStatus !== 'all') {
        params.append('status', filterStatus)
      }

      if (filterLab !== 'all') {
        params.append('labId', filterLab)
      }

      if (filterDate) {
        params.append('date', filterDate)
      }

      if (searchTerm) {
        params.append('search', searchTerm)
      }

      const response = await api.bookingAPI.getAdminBookings(params.toString())

      if (response.success) {
        setBookings(response.data || [])
        setTotalPages(response.pagination?.pages || 1)
      } else {
        setError(response.message || 'Failed to fetch bookings')
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch bookings')
      console.error('Error fetching bookings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (currentPage === 1) {
      fetchBookings()
    } else {
      setCurrentPage(1)
    }
  }

  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const result = await Swal.fire({
        title: 'Update Booking Status?',
        text: `Are you sure you want to change the status to "${newStatus}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#2563eb',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, update it!',
        cancelButtonText: 'Cancel'
      })

      if (result.isConfirmed) {
        await api.bookingAPI.updateBookingStatus(bookingId, { status: newStatus })
        await fetchBookings()

        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Booking status updated successfully',
          confirmButtonColor: '#2563eb'
        })
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: err.message || 'Failed to update booking status',
        confirmButtonColor: '#dc2626'
      })
    }
  }

  const handleDeleteBooking = async (booking) => {
    try {
      const result = await Swal.fire({
        title: 'Delete Booking?',
        text: `Are you sure you want to delete this booking for ${booking.userId?.firstName} ${booking.userId?.lastName}?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc2626',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
      })

      if (result.isConfirmed) {
        await api.bookingAPI.deleteBooking(booking._id)
        await fetchBookings()

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Booking deleted successfully',
          confirmButtonColor: '#2563eb'
        })
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: err.message || 'Failed to delete booking',
        confirmButtonColor: '#dc2626'
      })
    }
  }

  const toggleBookingExpansion = (bookingId) => {
    const newExpanded = new Set(expandedBookings)
    if (newExpanded.has(bookingId)) {
      newExpanded.delete(bookingId)
    } else {
      newExpanded.add(bookingId)
    }
    setExpandedBookings(newExpanded)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    if (!timeString) return 'N/A'
    return timeString
  }

  const formatAddress = (address) => {
    if (!address) return 'N/A'
    if (typeof address === 'string') return address
    return `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}, ${address.country || ''}`
      .replace(/^[,\s]+|[,\s]+$/g, '') // Remove leading/trailing commas/spaces
      .replace(/,,\s*/g, ', ') // Remove double commas
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'sample_collected': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = !searchTerm ||
      `${booking.userId?.firstName} ${booking.userId?.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.labId?.name?.toLowerCase().includes(searchTerm.toLowerCase())

    return matchesSearch
  })

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Bookings Management</h1>
        <p className="text-gray-600">Monitor and manage all laboratory bookings across all labs</p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="sample_collected">Sample Collected</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Lab</label>
            <select
              value={filterLab}
              onChange={(e) => setFilterLab(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Labs</option>
              {labs.map(lab => (
                <option key={lab._id} value={lab._id}>{lab.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Patient & Lab
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Appointment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tests & Packages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex items-center justify-center">
                      <Loader className="h-6 w-6 animate-spin mr-3" />
                      Loading bookings...
                    </div>
                  </td>
                </tr>
              ) : filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <Fragment key={booking._id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {booking.userId?.firstName?.[0]}{booking.userId?.lastName?.[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {booking.userId?.firstName} {booking.userId?.lastName}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center">
                              <Building2 className="h-3 w-3 mr-1" />
                              {booking.labId?.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          {formatDate(booking.appointmentDate)}
                        </div>
                        <div className="text-sm text-gray-500 flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-gray-400" />
                          {formatTime(booking.appointmentTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="flex items-center mb-1">
                            <TestTube className="h-4 w-4 mr-1 text-blue-500" />
                            Tests: {booking.selectedTests?.length || 0}
                          </div>
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-1 text-green-500" />
                            Packages: {booking.selectedPackages?.length || 0}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <DollarSign className="h-4 w-4 mr-1 text-green-500" />
                          ₹{booking.totalAmount || 0}
                        </div>
                        <div className="text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(booking.paymentStatus)}`}>
                            {booking.paymentStatus || 'pending'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedBooking(booking)
                              setShowBookingModal(true)
                            }}
                            className="text-primary-600 hover:text-primary-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => toggleBookingExpansion(booking._id)}
                            className="text-gray-600 hover:text-gray-900"
                            title="Expand/Collapse"
                          >
                            {expandedBookings.has(booking._id) ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row */}
                    {expandedBookings.has(booking._id) && (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 bg-gray-50">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Patient Details */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Patient Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center">
                                  <User className="h-4 w-4 mr-2 text-gray-400" />
                                  <span>{booking.userId?.firstName} {booking.userId?.lastName}</span>
                                </div>
                                <div className="flex items-center">
                                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                                  <span>{booking.userId?.email}</span>
                                </div>
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                  <span>{booking.userId?.phone}</span>
                                </div>
                              </div>
                            </div>

                            {/* Lab Details */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Lab Details</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center">
                                  <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                                  <span>{booking.labId?.name}</span>
                                </div>
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                                  <span>{formatAddress(booking.labId?.address)}</span>
                                </div>
                                <div className="flex items-center">
                                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                                  <span>{booking.labId?.contact}</span>
                                </div>
                              </div>
                            </div>

                            {/* Booking Actions */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Quick Actions</h4>
                              <div className="space-y-2">
                                <select
                                  value={booking.status}
                                  onChange={(e) => handleStatusUpdate(booking._id, e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="confirmed">Confirmed</option>
                                  <option value="sample_collected">Sample Collected</option>
                                  <option value="completed">Completed</option>
                                  <option value="cancelled">Cancelled</option>
                                </select>
                                <button
                                  onClick={() => handleDeleteBooking(booking)}
                                  className="w-full px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm flex items-center justify-center"
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page <span className="font-medium">{currentPage}</span> of{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Booking Details</h3>
              <button
                onClick={() => setShowBookingModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Patient Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {selectedBooking.userId?.firstName} {selectedBooking.userId?.lastName}</div>
                  <div><strong>Email:</strong> {selectedBooking.userId?.email}</div>
                  <div><strong>Phone:</strong> {selectedBooking.userId?.phone}</div>
                  <div><strong>Age:</strong> {selectedBooking.userId?.age || 'N/A'}</div>
                  <div><strong>Gender:</strong> {selectedBooking.userId?.gender || 'N/A'}</div>
                </div>
              </div>

              {/* Lab Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Lab Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Lab:</strong> {selectedBooking.labId?.name}</div>
                  <div><strong>Address:</strong> {formatAddress(selectedBooking.labId?.address)}</div>
                  <div><strong>Contact:</strong> {selectedBooking.labId?.contact}</div>
                  <div><strong>Email:</strong> {selectedBooking.labId?.email || 'N/A'}</div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Appointment Details</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Date:</strong> {formatDate(selectedBooking.appointmentDate)}</div>
                  <div><strong>Time:</strong> {formatTime(selectedBooking.appointmentTime)}</div>
                  <div><strong>Payment Method:</strong> {selectedBooking.paymentMethod}</div>
                  <div><strong>Total Amount:</strong> ₹{selectedBooking.totalAmount}</div>
                  <div><strong>Status:</strong>
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tests & Packages */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Tests & Packages</h4>
                <div className="space-y-3 text-sm">
                  {selectedBooking.selectedTests?.length > 0 && (
                    <div>
                      <strong>Tests:</strong>
                      <ul className="ml-4 mt-1">
                        {selectedBooking.selectedTests.map((test, index) => (
                          <li key={index}>• {test.testName} - ₹{test.price}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedBooking.selectedPackages?.length > 0 && (
                    <div>
                      <strong>Packages:</strong>
                      <ul className="ml-4 mt-1">
                        {selectedBooking.selectedPackages.map((pkg, index) => (
                          <li key={index}>• {pkg.packageName} - ₹{pkg.price}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notes */}
            {selectedBooking.notes && (
              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                <p className="text-sm text-gray-700">{selectedBooking.notes}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminBookings
