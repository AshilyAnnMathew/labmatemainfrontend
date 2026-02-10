import React, { useState, useEffect } from 'react';
import { TestTube, Calendar, Clock, User, Phone, Mail, CreditCard, CheckCircle, AlertCircle, PlayCircle, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import DashboardTable from '../components/common/DashboardTable';
import StatusBadge from '../components/common/StatusBadge';

const AssignedOverview = ({ assignedLab }) => {
    const [activeTab, setActiveTab] = useState('active'); // active, processing, completed
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchBookings();
    }, [assignedLab, activeTab]);

    const fetchBookings = async () => {
        if (!assignedLab?._id) return;

        setLoading(true);
        try {
            let statusParams = [];
            switch (activeTab) {
                case 'active':
                    statusParams = ['pending', 'confirmed'];
                    break;
                case 'processing':
                    statusParams = ['sample_collected', 'processing', 'in_progress'];
                    break;
                case 'completed':
                    statusParams = ['result_published', 'completed'];
                    break;
                default:
                    statusParams = ['pending'];
            }

            const promises = statusParams.map(status =>
                api.localAdminAPI.getLabBookings(assignedLab._id, status, 1, 100)
            );

            const responses = await Promise.all(promises);
            const allBookings = responses.flatMap(res =>
                res.success ? res.data : (res.data || [])
            );

            // Sort by date (descending for completed, ascending for active)
            allBookings.sort((a, b) => {
                const dateA = new Date(a.appointmentDate);
                const dateB = new Date(b.appointmentDate);
                return activeTab === 'completed' ? dateB - dateA : dateA - dateB;
            });

            setBookings(allBookings);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (bookingId, newStatus) => {
        try {
            await api.bookingAPI.updateBookingStatus(bookingId, { status: newStatus });
            fetchBookings(); // Refresh
        } catch (error) {
            console.error('Error updating status:', error);
            alert('Failed to update status');
        }
    };

    const handlePaymentProcess = async (bookingId) => {
        try {
            await api.bookingAPI.processPayment(bookingId);
            fetchBookings();
        } catch (error) {
            console.error('Payment error:', error);
            alert('Failed to process payment');
        }
    };

    // Filter based on search
    const filteredBookings = bookings.filter(b => {
        const searchLower = searchTerm.toLowerCase();
        return (
            b.userId?.firstName?.toLowerCase().includes(searchLower) ||
            b.userId?.lastName?.toLowerCase().includes(searchLower) ||
            b.userId?.email?.toLowerCase().includes(searchLower) ||
            b._id?.toLowerCase().includes(searchLower)
        );
    });

    const columns = [
        {
            header: 'Patient Details',
            accessor: 'userId',
            render: (row) => (
                <div>
                    <div className="font-medium text-gray-900">{row.userId?.firstName} {row.userId?.lastName}</div>
                    <div className="text-xs text-gray-500 flex items-center mt-0.5">
                        <Mail className="h-3 w-3 mr-1" /> {row.userId?.email}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center mt-0.5">
                        <Phone className="h-3 w-3 mr-1" /> {row.userId?.phone}
                    </div>
                </div>
            )
        },
        {
            header: 'Appointment',
            accessor: 'appointmentDate',
            render: (row) => (
                <div>
                    <div className="text-sm text-gray-900 flex items-center">
                        <Calendar className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                        {new Date(row.appointmentDate).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center mt-1">
                        <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                        {row.appointmentTime}
                    </div>
                </div>
            )
        },
        {
            header: 'Tests & Payment',
            accessor: 'selectedTests',
            render: (row) => (
                <div>
                    <div className="flex items-center text-sm font-medium text-gray-900">
                        <TestTube className="h-4 w-4 mr-1.5 text-primary-600" />
                        {(row.selectedTests || []).length + (row.selectedPackages || []).length} items
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                        <StatusBadge status={row.paymentStatus} />
                        <span className="text-xs text-gray-500">
                            {row.paymentMethod === 'pay_later' ? 'Pay at Lab' : 'Online'}
                        </span>
                    </div>
                </div>
            )
        },
        {
            header: 'Status',
            accessor: 'status',
            render: (row) => <StatusBadge status={row.status} />
        },
        {
            header: 'Actions',
            accessor: '_id',
            render: (row) => (
                <div className="flex flex-col gap-2">
                    {row.status === 'pending' && (
                        <button
                            onClick={() => handleStatusUpdate(row._id, 'confirmed')}
                            className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 flex items-center justify-center"
                        >
                            <CheckCircle className="h-3 w-3 mr-1" /> Confirm
                        </button>
                    )}
                    {row.status === 'confirmed' && (
                        <button
                            onClick={() => handleStatusUpdate(row._id, 'sample_collected')}
                            className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-200 hover:bg-purple-100 flex items-center justify-center"
                        >
                            <TestTube className="h-3 w-3 mr-1" /> Collect Sample
                        </button>
                    )}
                    {['sample_collected', 'processing'].includes(row.status) && (
                        <Link
                            to="/staff/upload-reports"
                            className="text-xs bg-teal-50 text-teal-700 px-2 py-1 rounded border border-teal-200 hover:bg-teal-100 flex items-center justify-center"
                        >
                            <FileText className="h-3 w-3 mr-1" /> Add Result
                        </Link>
                    )}
                    {row.paymentStatus === 'pending' && row.paymentMethod === 'pay_later' && (
                        <button
                            onClick={() => handlePaymentProcess(row._id)}
                            className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded border border-orange-200 hover:bg-orange-100 flex items-center justify-center"
                        >
                            <CreditCard className="h-3 w-3 mr-1" /> Process Payment
                        </button>
                    )}
                </div>
            )
        }
    ];

    const EmptyState = () => (
        <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">No {activeTab} bookings</h3>
            <p className="text-gray-500">There are no bookings in this category.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
                    <p className="text-sm text-gray-500">Manage appointments, samples, and patient workflows.</p>
                </div>

                {/* Tab Switcher */}
                <div className="bg-white p-1 rounded-lg border border-gray-200 flex">
                    {['active', 'processing', 'completed'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${activeTab === tab
                                    ? 'bg-primary-50 text-primary-700'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <DashboardTable
                data={filteredBookings}
                columns={columns}
                loading={loading}
                onSearch={setSearchTerm}
                searchValue={searchTerm}
                searchPlaceholder="Search patients by name, email or ID..."
                emptyMessage={`No ${activeTab} bookings found`}
            />
        </div>
    );
};

export default AssignedOverview;
