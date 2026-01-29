import { useState, useEffect } from 'react'
import {
    FileText,
    CheckCircle,
    XCircle,
    Eye,
    ExternalLink,
    Calendar,
    User,
    Clock,
    AlertCircle
} from 'lucide-react'
import Swal from 'sweetalert2'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const StaffPrescriptionHandling = () => {
    const { user } = useAuth()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedBooking, setSelectedBooking] = useState(null)
    const [showModal, setShowModal] = useState(false)

    useEffect(() => {
        if (user?.assignedLab) {
            fetchPrescriptionBookings()
        }
    }, [user])

    const fetchPrescriptionBookings = async () => {
        try {
            setLoading(true)
            const response = await api.localAdminAPI.getLabBookings(
                user.assignedLab,
                'pending', // Only fetch pending bookings initially
                1,
                100,
                { hasPrescription: 'true' }
            )

            if (response.success || response.data) {
                setBookings(response.data || [])
            }
        } catch (error) {
            console.error('Error fetching prescription bookings:', error)
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch prescription bookings'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleAction = async (bookingId, action) => {
        if (action === 'confirm') {
            try {
                await api.bookingAPI.updateBookingStatus(bookingId, 'confirmed')
                Swal.fire('Confirmed!', 'Booking has been confirmed.', 'success')
                fetchPrescriptionBookings()
                setShowModal(false)
            } catch (error) {
                Swal.fire('Error', 'Failed to confirm booking', 'error')
            }
        } else if (action === 'reject') {
            // Implement rejection if needed (e.g., set status to cancelled)
            const result = await Swal.fire({
                title: 'Reject Booking?',
                text: "You are about to cancel this booking.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, reject it!'
            })

            if (result.isConfirmed) {
                try {
                    // Assuming we can set status to cancelled or delete
                    // api.bookingAPI.cancelBooking(bookingId) // If delete
                    // OR update status
                    await api.bookingAPI.updateBookingStatus(bookingId, 'cancelled')

                    Swal.fire('Rejected!', 'Booking has been rejected.', 'success')
                    fetchPrescriptionBookings()
                    setShowModal(false)
                } catch (error) {
                    Swal.fire('Error', 'Failed to reject booking', 'error')
                }
            }
        }
    }

    const openBookingDetails = (booking) => {
        setSelectedBooking(booking)
        setShowModal(true)
    }

    const getImageUrl = (path) => {
        if (!path) return null
        // Assuming backend serves uploads at /uploads base or similar. 
        // If path is relative like 'uploads/prescriptions/file.jpg', prepend API_URL/.. or just / if served from root.
        // Adjust based on your server static file serving.
        // Assuming VITE_API_URL points to /api, and uploads are at root /uploads
        const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000'
        return `${baseUrl}/${path.replace(/\\/g, '/')}`
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Prescription Handling</h1>
                <button
                    onClick={fetchPrescriptionBookings}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                    Refresh
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading prescription requests...</div>
            ) : bookings.length === 0 ? (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900">No Pending Prescriptions</h3>
                    <p className="text-gray-500 mt-2">All prescription bookings have been processed.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookings.map(booking => (
                        <div key={booking._id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                            {/* Card Header */}
                            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-start">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-semibold">
                                        {booking.userId?.firstName?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{booking.userId?.firstName} {booking.userId?.lastName}</h3>
                                        <div className="flex items-center text-xs text-gray-500 mt-0.5">
                                            <Clock className="w-3 h-3 mr-1" />
                                            {new Date(booking.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                                    {booking.status}
                                </span>
                            </div>

                            {/* Card Body */}
                            <div className="p-4 space-y-3">
                                {booking.prescriptionUrl ? (
                                    <div className="relative aspect-video bg-gray-100 rounded-md overflow-hidden border border-gray-200">
                                        <img
                                            src={getImageUrl(booking.prescriptionUrl)}
                                            alt="Prescription"
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
                                            {/* Overlay if needed */}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-32 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 text-sm">
                                        No Image Available
                                    </div>
                                )}

                                <div className="flex justify-between items-center text-sm text-gray-600">
                                    <span className="flex items-center"><Calendar className="w-4 h-4 mr-1" /> {new Date(booking.appointmentDate).toLocaleDateString()}</span>
                                    <span className="flex items-center"><Clock className="w-4 h-4 mr-1" /> {booking.appointmentTime}</span>
                                </div>
                            </div>

                            {/* Card Footer */}
                            <div className="p-4 border-t border-gray-100 flex space-x-3">
                                <button
                                    onClick={() => openBookingDetails(booking)}
                                    className="flex-1 bg-primary-600 hover:bg-primary-700 text-white py-2 rounded-md text-sm font-medium transition-colors"
                                >
                                    Review & Action
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Details Modal */}
            {showModal && selectedBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">Review Booking</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6">
                            {/* Left: Image */}
                            <div className="w-full md:w-1/2 bg-gray-100 rounded-lg p-2 flex items-center justify-center">
                                {selectedBooking.prescriptionUrl ? (
                                    <img
                                        src={getImageUrl(selectedBooking.prescriptionUrl)}
                                        alt="Prescription Full"
                                        className="max-w-full max-h-[60vh] object-contain"
                                    />
                                ) : (
                                    <span className="text-gray-400">No Image</span>
                                )}
                            </div>

                            {/* Right: Details & Actions */}
                            <div className="w-full md:w-1/2 space-y-6">
                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Patient Details</h4>
                                    <div className="bg-gray-50 p-3 rounded-md space-y-1 text-sm">
                                        <p><span className="text-gray-500">Name:</span> {selectedBooking.userId?.firstName} {selectedBooking.userId?.lastName}</p>
                                        <p><span className="text-gray-500">Email:</span> {selectedBooking.userId?.email}</p>
                                        <p><span className="text-gray-500">Phone:</span> {selectedBooking.userId?.phone}</p>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Requested Tests</h4>
                                    <div className="space-y-2">
                                        {selectedBooking.selectedTests?.map((test, i) => (
                                            <div key={i} className="flex justify-between items-center bg-gray-50 p-2 rounded border border-gray-100">
                                                <span className="text-sm font-medium">{test.testName}</span>
                                                <span className="text-xs text-gray-500">₹{test.price}</span>
                                            </div>
                                        ))}
                                        {(!selectedBooking.selectedTests || selectedBooking.selectedTests.length === 0) && (
                                            <p className="text-sm text-gray-500 italic">No specific tests selected yet.</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="font-medium text-gray-900 mb-2">Notes</h4>
                                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                                        {selectedBooking.notes || 'No notes provided.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex justify-end space-x-3">
                            <button
                                onClick={() => handleAction(selectedBooking._id, 'reject')}
                                className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 font-medium"
                            >
                                Reject
                            </button>
                            <button
                                onClick={() => handleAction(selectedBooking._id, 'confirm')}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                            >
                                Confirm Booking
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default StaffPrescriptionHandling
