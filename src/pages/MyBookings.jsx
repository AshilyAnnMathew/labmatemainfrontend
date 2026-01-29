import { useState, useEffect } from 'react'
import {
  Calendar,
  MapPin,
  Phone,
  Mail,
  Clock,
  CreditCard,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader,
  Search,
  Filter,
  Eye,
  Trash2,
  Building2,
  FlaskConical,
  Package
} from 'lucide-react'
import Swal from 'sweetalert2'
import api from '../services/api'

const { bookingAPI } = api

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

  useEffect(() => {
    fetchBookings()
  }, [currentPage, filterStatus])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      setError('')
      const response = await bookingAPI.getBookings(filterStatus, currentPage, 10)
      setBookings(response.data)
      setTotalPages(response.pagination.pages)
    } catch (err) {
      setError(err.message || 'Failed to fetch bookings')
      console.error('Error fetching bookings:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (booking) => {
    const result = await Swal.fire({
      title: 'Cancel Booking?',
      text: `Are you sure you want to cancel your appointment at ${booking.labId.name}?`,
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
        await Swal.fire({
          icon: 'success',
          title: 'Booking Cancelled',
          text: 'Your booking has been cancelled successfully',
          confirmButtonColor: '#2563eb'
        })
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Cancellation Failed',
          text: err.message || 'Failed to cancel booking',
          confirmButtonColor: '#dc2626'
        })
      }
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentStatusColor = (paymentStatus) => {
    switch (paymentStatus) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'refunded':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString) => {
    return timeString
  }

  const filteredBookings = bookings.filter(booking => {
    const searchLower = searchTerm.toLowerCase()
    const labName = booking.labId?.name?.toLowerCase() || ''
    const bookingId = booking._id.toLowerCase()

    return labName.includes(searchLower) || bookingId.includes(searchLower)
  })

  const renderBookingCard = (booking) => {
    const lab = booking.labId
    const address = typeof lab?.address === 'string'
      ? (() => {
        try {
          const addr = JSON.parse(lab.address)
          return `${addr.street}, ${addr.city}, ${addr.state}`
        } catch (e) {
          return lab.address
        }
      })()
      : `${lab?.address?.street || ''}, ${lab?.address?.city || ''}, ${lab?.address?.state || ''}`

    const contact = typeof lab?.contact === 'string'
      ? (() => {
        try {
          const contactData = JSON.parse(lab.contact)
          return { phone: contactData.phone, email: contactData.email }
        } catch (e) {
          return { phone: lab.contact, email: '' }
        }
      })()
      : { phone: lab?.contact?.phone || '', email: lab?.contact?.email || '' }

    return (
      <div key={booking._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{lab?.name || 'Lab Name'}</h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(booking.status)}`}>
                  {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                </span>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(booking.paymentStatus)}`}>
                  {booking.paymentStatus.charAt(0).toUpperCase() + booking.paymentStatus.slice(1)}
                </span>
              </div>
            </div>
          </div>
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
            {booking.status === 'pending' && (
              <button
                onClick={() => handleCancelBooking(booking)}
                className="text-red-600 hover:text-red-900"
                title="Cancel Booking"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>{formatDate(booking.appointmentDate)} at {formatTime(booking.appointmentTime)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{address}</span>
          </div>
          {contact.phone && (
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-4 w-4 mr-2" />
              <span>{contact.phone}</span>
            </div>
          )}
          <div className="flex items-center text-sm text-gray-600">
            <CreditCard className="h-4 w-4 mr-2" />
            <span>
              {booking.paymentMethod === 'pay_now' ? 'Paid Online' : 'Pay at Lab'} -
              ₹{booking.totalAmount}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">
              Tests: {booking.selectedTests?.length || 0}
            </span>
            <span className="text-gray-500">
              Packages: {booking.selectedPackages?.length || 0}
            </span>
            <span className="text-gray-500">
              Booking ID: {booking._id.slice(-8)}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">View and manage your laboratory appointments</p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="w-full mx-auto py-4 px-4 sm:px-6 lg:px-8">
            <div className="relative">
              <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full sm:w-64"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value)
                setCurrentPage(1)
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
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

      {/* Bookings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Loader className="h-8 w-8 animate-spin mr-3" />
            Loading bookings...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No bookings found</p>
          </div>
        ) : (
          filteredBookings.map(renderBookingCard)
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-3 py-2 text-sm border rounded-lg ${currentPage === page
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-300 hover:bg-gray-50'
                  }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Booking Details</h3>
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Lab Information */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Lab Information</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <Building2 className="h-5 w-5 text-primary-600 mr-2" />
                      <span className="font-medium">{selectedBooking.labId?.name}</span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>
                          {typeof selectedBooking.labId?.address === 'string'
                            ? (() => {
                              try {
                                const addr = JSON.parse(selectedBooking.labId.address)
                                return `${addr.street}, ${addr.city}, ${addr.state} - ${addr.zipCode}`
                              } catch (e) {
                                return selectedBooking.labId.address
                              }
                            })()
                            : `${selectedBooking.labId?.address?.street || ''}, ${selectedBooking.labId?.address?.city || ''}, ${selectedBooking.labId?.address?.state || ''}`
                          }
                        </span>
                      </div>
                      {selectedBooking.labId?.contact && (
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2" />
                          <span>
                            {typeof selectedBooking.labId.contact === 'string'
                              ? (() => {
                                try {
                                  const contact = JSON.parse(selectedBooking.labId.contact)
                                  return contact.phone
                                } catch (e) {
                                  return selectedBooking.labId.contact
                                }
                              })()
                              : selectedBooking.labId.contact.phone
                            }
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Appointment Details */}
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-3">Appointment Details</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-gray-600">Date: </span>
                        <span className="ml-1 font-medium">{formatDate(selectedBooking.appointmentDate)}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span className="text-gray-600">Time: </span>
                        <span className="ml-1 font-medium">{formatTime(selectedBooking.appointmentTime)}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-600">Status: </span>
                        <span className={`ml-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedBooking.status)}`}>
                          {selectedBooking.status.charAt(0).toUpperCase() + selectedBooking.status.slice(1)}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-600">Payment: </span>
                        <span className={`ml-1 px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusColor(selectedBooking.paymentStatus)}`}>
                          {selectedBooking.paymentStatus.charAt(0).toUpperCase() + selectedBooking.paymentStatus.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Tests */}
                {selectedBooking.selectedTests && selectedBooking.selectedTests.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                      <FlaskConical className="h-5 w-5 mr-2 text-primary-600" />
                      Selected Tests ({selectedBooking.selectedTests.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedBooking.selectedTests.map((test, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                          <div>
                            <span className="font-medium text-gray-900">{test.testName}</span>
                          </div>
                          <span className="text-primary-600 font-medium">₹{test.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Selected Packages */}
                {selectedBooking.selectedPackages && selectedBooking.selectedPackages.length > 0 && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center">
                      <Package className="h-5 w-5 mr-2 text-primary-600" />
                      Selected Packages ({selectedBooking.selectedPackages.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedBooking.selectedPackages.map((packageItem, index) => (
                        <div key={index} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
                          <div>
                            <span className="font-medium text-gray-900">{packageItem.packageName}</span>
                          </div>
                          <span className="text-primary-600 font-medium">₹{packageItem.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Total Amount */}
                <div className="bg-primary-50 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Total Amount:</span>
                    <span className="text-2xl font-bold text-primary-600">₹{selectedBooking.totalAmount}</span>
                  </div>
                  <div className="mt-2 text-sm text-gray-600">
                    Payment Method: {selectedBooking.paymentMethod === 'pay_now' ? 'Paid Online' : 'Pay at Lab'}
                  </div>
                </div>

                {/* Notes */}
                {selectedBooking.notes && (
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Notes</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700">{selectedBooking.notes}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                {selectedBooking.status === 'pending' && (
                  <button
                    onClick={() => {
                      setShowBookingModal(false)
                      handleCancelBooking(selectedBooking)
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Cancel Booking
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MyBookings
