import React, { useState, useEffect } from 'react'
import Barcode from 'react-barcode'
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
  DollarSign
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const AssignedBookings = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showBarcodeModal, setShowBarcodeModal] = useState(false)
  const [generatedSample, setGeneratedSample] = useState(null)
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [assignedLab, setAssignedLab] = useState(null)

  const limit = 10

  // Fetch assigned lab information
  useEffect(() => {
    const fetchAssignedLab = async () => {
      try {
        if (user?.assignedLab) {
          const response = await api.labAPI.getLab(user.assignedLab)
          setAssignedLab(response.data)
        }
      } catch (error) {
        console.error('Error fetching assigned lab:', error)
      }
    }

    if (user) {
      fetchAssignedLab()
    }
  }, [user])

  // Fetch bookings for the assigned lab
  useEffect(() => {
    console.log('AssignedBookings useEffect triggered:', { assignedLab, assignedLabId: assignedLab?._id, filterStatus, currentPage })
    if (assignedLab && assignedLab._id) {
      console.log('Calling fetchBookings for lab:', assignedLab._id)
      fetchBookings()
    } else {
      console.log('Not calling fetchBookings - missing assignedLab or assignedLab._id')
    }
  }, [assignedLab, filterStatus, currentPage])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      console.log('Fetching bookings for lab:', assignedLab._id, 'with filter:', filterStatus, 'page:', currentPage, 'limit:', limit)

      const response = await api.localAdminAPI.getLabBookings(
        assignedLab._id,
        filterStatus,
        currentPage,
        limit
      )

      console.log('API response received:', response)

      if (response.success) {
        console.log('Fetched bookings successfully:', response.data)
        setBookings(response.data)
        setTotalPages(response.totalPages)
      } else {
        console.error('API returned success: false:', response)
      }
    } catch (error) {
      console.error('Error fetching bookings - full error:', error)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    } finally {
      setLoading(false)
    }
  }

  // Handle collection of a new sample
  const handleCollectSample = async (bookingId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/samples/collect/${bookingId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();

      if (data.success) {
        setGeneratedSample({
          sampleId: data.data.sampleId,
          booking: data.data.booking
        });
        setShowBarcodeModal(true);
        setShowBookingModal(false);
        fetchBookings();
      } else {
        throw new Error(data.message || 'Failed to collect sample');
      }
    } catch (error) {
      console.error('Error collecting sample:', error);
      alert('Error collecting sample: ' + error.message);
    }
  }

  // Handle status update
  const handleStatusUpdate = async (bookingId, newStatus) => {
    try {
      const response = await api.bookingAPI.updateBookingStatus(bookingId, newStatus)
      if (response.success) {
        fetchBookings()
        setShowBookingModal(false)
        alert(`Booking status updated to ${newStatus}`)
      }
    } catch (error) {
      console.error('Error updating booking status:', error)
      alert('Error updating booking status: ' + error.message)
    }
  }

  // Handle payment processing
  const handlePaymentProcess = async (bookingId) => {
    try {
      console.log('Processing payment for booking ID:', bookingId)
      const response = await api.bookingAPI.processPayment(bookingId, {})
      if (response.success) {
        fetchBookings()
        setShowPaymentModal(false)
        alert('Payment processed successfully')
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      alert('Error processing payment: ' + error.message)
    }
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-purple-100 text-purple-800'
      case 'sample_collected': return 'bg-indigo-100 text-indigo-800'
      case 'report_uploaded': return 'bg-green-100 text-green-800'
      case 'result_published': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-emerald-100 text-emerald-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Get payment status color
  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'completed': return 'bg-green-100 text-green-800'
      case 'failed': return 'bg-red-100 text-red-800'
      case 'refunded': return 'bg-blue-100 text-blue-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Format time
  const formatTime = (timeString) => {
    return timeString
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Debug: Show current state
  console.log('AssignedBookings render state:', {
    assignedLab,
    bookings,
    loading,
    filterStatus,
    currentPage
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Assigned Bookings</h2>
          <p className="text-gray-600">Manage bookings for {assignedLab?.name}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by status:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Bookings</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="sample_collected">Sample Collected</option>
            <option value="report_uploaded">Report Uploaded</option>
            <option value="result_published">Result Published</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {bookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">
              {filterStatus === 'all'
                ? 'No bookings available for this lab.'
                : `No ${filterStatus} bookings found.`
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tests/Packages
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
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
                {bookings.map((booking) => (
                  <tr key={booking._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.userId?.firstName} {booking.userId?.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{booking.userId?.email}</div>
                        <div className="text-sm text-gray-500">{booking.userId?.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{formatDate(booking.appointmentDate)}</div>
                      <div className="text-sm text-gray-500">{formatTime(booking.appointmentTime)}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {booking.selectedTests?.length > 0 && (
                          <div className="flex items-center mb-1">
                            <TestTube className="h-4 w-4 mr-1" />
                            {booking.selectedTests.length} tests
                          </div>
                        )}
                        {booking.selectedPackages?.length > 0 && (
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-1" />
                            {booking.selectedPackages.length} packages
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{booking.totalAmount}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                          {booking.paymentStatus}
                        </span>
                      </div>
                      {booking.paymentMethod === 'pay_later' && (
                        <div className="text-xs text-gray-500 mt-1">Pay on Lab</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            setSelectedBooking(booking)
                            setShowBookingModal(true)
                          }}
                          className="text-primary-600 hover:text-primary-900 flex items-center"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Change Status to Sample Collected */}
                        {booking.status === 'confirmed' && (
                          <button
                            onClick={() => handleStatusUpdate(booking._id, 'in_progress')}
                            className="text-purple-600 hover:text-purple-900 flex items-center"
                            title="Start Processing"
                          >
                            <TestTube className="h-4 w-4" />
                          </button>
                        )}
                        {booking.status === 'in_progress' && (
                          <button
                            onClick={() => handleCollectSample(booking._id)}
                            className="text-blue-600 hover:text-blue-900 flex items-center"
                            title="Collect Sample & Generate Barcode"
                          >
                            <TestTube className="h-4 w-4" />
                          </button>
                        )}

                        {/* Payment Processing */}
                        {booking.paymentMethod === 'pay_later' && booking.paymentStatus === 'pending' && (
                          <button
                            onClick={() => {
                              setSelectedBooking(booking)
                              setShowPaymentModal(true)
                            }}
                            className="text-green-600 hover:text-green-900 flex items-center"
                            title="Process Payment"
                          >
                            <DollarSign className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Booking Details Modal */}
      {showBookingModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Booking Details</h3>

            {/* Patient Information */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Patient Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <p className="text-sm text-gray-900">{selectedBooking.userId?.firstName} {selectedBooking.userId?.lastName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="text-sm text-gray-900">{selectedBooking.userId?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-sm text-gray-900">{selectedBooking.userId?.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Appointment Date</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedBooking.appointmentDate)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Appointment Time</label>
                  <p className="text-sm text-gray-900">{formatTime(selectedBooking.appointmentTime)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                  <p className="text-sm font-medium text-gray-900">₹{selectedBooking.totalAmount}</p>
                </div>
              </div>
            </div>

            {/* Tests and Packages */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Tests & Packages</h4>
              {selectedBooking.selectedTests?.length > 0 && (
                <div className="mb-4">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Tests</h5>
                  {selectedBooking.selectedTests.map((test, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md mb-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">{test.testName}</span>
                        <span className="text-sm text-gray-600">₹{test.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {selectedBooking.selectedPackages?.length > 0 && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Packages</h5>
                  {selectedBooking.selectedPackages.map((pkg, index) => (
                    <div key={index} className="bg-gray-50 p-3 rounded-md mb-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-900">{pkg.packageName}</span>
                        <span className="text-sm text-gray-600">₹{pkg.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Status Update */}
            <div className="mb-6">
              <h4 className="text-md font-medium text-gray-900 mb-3">Update Status</h4>
              <div className="flex flex-wrap gap-2">
                {selectedBooking.status === 'confirmed' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedBooking._id, 'in_progress')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center"
                  >
                    <TestTube className="h-4 w-4 mr-2" />
                    Start Processing
                  </button>
                )}
                {selectedBooking.status === 'in_progress' && (
                  <button
                    onClick={() => handleCollectSample(selectedBooking._id)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center shadow-md shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    <TestTube className="h-4 w-4 mr-2 text-blue-200" />
                    Collect Sample & Generate Barcode
                  </button>
                )}
                {selectedBooking.status === 'sample_collected' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedBooking._id, 'result_published')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Result Published
                  </button>
                )}
                {selectedBooking.status === 'result_published' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedBooking._id, 'completed')}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 flex items-center"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowBookingModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Processing Modal */}
      {showPaymentModal && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Process Payment</h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Patient: {selectedBooking.userId?.firstName} {selectedBooking.userId?.lastName}</p>
              <p className="text-sm text-gray-600 mb-2">Amount: ₹{selectedBooking.totalAmount}</p>
              <p className="text-sm text-gray-600">Payment Method: Pay on Lab</p>
            </div>
            <div className="mb-6">
              <p className="text-sm text-gray-500">
                Confirm that the patient has made the payment at the lab counter.
              </p>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePaymentProcess(selectedBooking._id)}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark as Paid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Generation Modal */}
      {showBarcodeModal && generatedSample && (
        <div className="fixed inset-0 bg-gray-600/75 backdrop-blur-sm flex items-center justify-center z-[60]">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl transform transition-all text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mb-6 border-4 border-green-50">
              <CheckCircle className="h-8 w-8 text-green-600" aria-hidden="true" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Sample Collected!</h3>
            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
              Please attach this barcode to the physical sample tube for <strong>{generatedSample.booking.userId?.firstName} {generatedSample.booking.userId?.lastName}</strong>.
            </p>

            <div className="bg-gray-50 py-6 px-4 rounded-xl border border-gray-100 mb-8 flex justify-center items-center shadow-inner">
              <Barcode
                value={generatedSample.sampleId}
                height={80}
                width={2}
                displayValue={true}
                fontSize={18}
                background="#f9fafb"
              />
            </div>

            <button
              onClick={() => {
                setShowBarcodeModal(false)
                setGeneratedSample(null)
              }}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all shadow-primary-500/30"
            >
              Done & Print Label
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default AssignedBookings
