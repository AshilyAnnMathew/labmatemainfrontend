import React, { useState, useEffect } from 'react';
import {
    FileText,
    CheckCircle,
    XCircle,
    Calendar,
    User,
    Clock,
    Search,
    ChevronRight,
    Maximize2,
    X,
    Filter
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import StatusBadge from '../components/common/StatusBadge';

const StaffPrescriptionHandling = () => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFullImage, setShowFullImage] = useState(false);

    useEffect(() => {
        if (user?.assignedLab) {
            fetchPrescriptionBookings();
        }
    }, [user]);

    const fetchPrescriptionBookings = async () => {
        try {
            setLoading(true);
            const response = await api.localAdminAPI.getLabBookings(
                user.assignedLab,
                'pending',
                1,
                100,
                { hasPrescription: 'true' }
            );

            if (response.success || response.data) {
                setBookings(response.data || []);
            }
        } catch (error) {
            console.error('Error fetching prescription bookings:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch prescription bookings',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (bookingId, action) => {
        if (action === 'confirm') {
            try {
                await api.bookingAPI.updateBookingStatus(bookingId, 'confirmed');
                Swal.fire({
                    icon: 'success',
                    title: 'Confirmed',
                    text: 'Booking confirmed successfully',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000
                });
                fetchPrescriptionBookings();
                setSelectedBooking(null);
            } catch (error) {
                Swal.fire('Error', 'Failed to confirm booking', 'error');
            }
        } else if (action === 'reject') {
            const result = await Swal.fire({
                title: 'Reject Booking?',
                text: "Are you sure you want to reject this prescription?",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#3085d6',
                confirmButtonText: 'Yes, reject it!'
            });

            if (result.isConfirmed) {
                try {
                    await api.bookingAPI.updateBookingStatus(bookingId, 'cancelled');
                    Swal.fire({
                        icon: 'success',
                        title: 'Rejected',
                        text: 'Booking has been rejected.',
                        toast: true,
                        position: 'top-end',
                        showConfirmButton: false,
                        timer: 2000
                    });
                    fetchPrescriptionBookings();
                    setSelectedBooking(null);
                } catch (error) {
                    Swal.fire('Error', 'Failed to reject booking', 'error');
                }
            }
        }
    };

    const getImageUrl = (path) => {
        if (!path) return null;
        const baseUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
        return `${baseUrl}/${path.replace(/\\/g, '/')}`;
    };

    const filteredBookings = bookings.filter(b =>
        b.userId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.userId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.userId?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            <div className="mb-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Prescription Handling</h1>
                    <p className="text-sm text-gray-500">Review and process pending prescriptions.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200">
                        {bookings.length} Pending
                    </span>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex">
                {/* Left Panel: List */}
                <div className="w-1/3 border-r border-gray-200 flex flex-col bg-gray-50/50">
                    <div className="p-4 border-b border-gray-200 bg-white">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search patients..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>
                        ) : filteredBookings.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                                <p className="text-sm">No pending prescriptions</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredBookings.map(booking => (
                                    <div
                                        key={booking._id}
                                        onClick={() => setSelectedBooking(booking)}
                                        className={`p-4 cursor-pointer hover:bg-white transition-colors border-l-4 ${selectedBooking?._id === booking._id
                                                ? 'bg-white border-primary-500 shadow-sm z-10'
                                                : 'bg-transparent border-transparent hover:border-gray-300'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h3 className={`text-sm font-semibold ${selectedBooking?._id === booking._id ? 'text-primary-700' : 'text-gray-900'}`}>
                                                {booking.userId?.firstName} {booking.userId?.lastName}
                                            </h3>
                                            <span className="text-xs text-gray-400">{new Date(booking.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mb-2 truncate">{booking.userId?.email}</div>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {booking.appointmentTime}
                                            </div>
                                            <ChevronRight className={`h-4 w-4 ${selectedBooking?._id === booking._id ? 'text-primary-500' : 'text-gray-300'}`} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Detail */}
                <div className="flex-1 overflow-hidden bg-white flex flex-col h-full relative">
                    {selectedBooking ? (
                        <>
                            <div className="flex-1 overflow-y-auto p-6">
                                <div className="max-w-4xl mx-auto space-y-6">
                                    {/* Prescription Viewer */}
                                    <div className="bg-gray-900 rounded-lg overflow-hidden shadow-inner flex items-center justify-center min-h-[400px] relative group">
                                        {selectedBooking.prescriptionUrl ? (
                                            <>
                                                <img
                                                    src={getImageUrl(selectedBooking.prescriptionUrl)}
                                                    alt="Prescription"
                                                    className="max-h-[500px] object-contain"
                                                />
                                                <button
                                                    onClick={() => setShowFullImage(true)}
                                                    className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                                                >
                                                    <Maximize2 className="h-5 w-5" />
                                                </button>
                                            </>
                                        ) : (
                                            <div className="text-gray-500 flex flex-col items-center">
                                                <FileText className="h-12 w-12 mb-2" />
                                                No image available
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                                <User className="h-4 w-4 mr-2 text-gray-500" /> Patient
                                            </h4>
                                            <div className="text-sm space-y-1">
                                                <p className="font-medium text-lg">{selectedBooking.userId?.firstName} {selectedBooking.userId?.lastName}</p>
                                                <p className="text-gray-600">{selectedBooking.userId?.email}</p>
                                                <p className="text-gray-600">{selectedBooking.userId?.phone}</p>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
                                                <Calendar className="h-4 w-4 mr-2 text-gray-500" /> Appointment
                                            </h4>
                                            <div className="text-sm space-y-1">
                                                <p className="font-medium text-lg">{new Date(selectedBooking.appointmentDate).toLocaleDateString()}</p>
                                                <p className="text-gray-600">{selectedBooking.appointmentTime}</p>
                                                <StatusBadge status={selectedBooking.status} className="mt-1" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Bar */}
                                    <div className="sticky bottom-0 bg-white border-t border-gray-100 pt-4 flex justify-end gap-3 pb-20">
                                        <button
                                            onClick={() => handleAction(selectedBooking._id, 'reject')}
                                            className="px-6 py-2.5 border border-red-300 text-red-700 font-medium rounded-lg hover:bg-red-50 flex items-center shadow-sm"
                                        >
                                            <XCircle className="h-5 w-5 mr-2" />
                                            Reject Request
                                        </button>
                                        <button
                                            onClick={() => handleAction(selectedBooking._id, 'confirm')}
                                            className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 flex items-center shadow-sm"
                                        >
                                            <CheckCircle className="h-5 w-5 mr-2" />
                                            Confirm Booking
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
                            <FileText className="h-16 w-16 mb-4 text-gray-200" />
                            <p className="text-lg font-medium text-gray-500">Select a prescription to review</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Full Screen Image Modal */}
            {showFullImage && selectedBooking && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                    <button
                        onClick={() => setShowFullImage(false)}
                        className="absolute top-4 right-4 text-white/70 hover:text-white"
                    >
                        <X className="h-8 w-8" />
                    </button>
                    <img
                        src={getImageUrl(selectedBooking.prescriptionUrl)}
                        alt="Prescription Full"
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            )}
        </div>
    );
};

export default StaffPrescriptionHandling;
