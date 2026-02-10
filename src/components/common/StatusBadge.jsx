import React from 'react';

const getStatusConfig = (status) => {
    const configs = {
        // Booking Statuses
        pending: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', label: 'Pending' },
        confirmed: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Confirmed' },
        sample_collected: { color: 'bg-purple-50 text-purple-700 border-purple-200', label: 'Sample Collected' },
        in_progress: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'In Progress' },
        processing: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Processing' },
        report_uploaded: { color: 'bg-teal-50 text-teal-700 border-teal-200', label: 'Report Uploaded' },
        result_published: { color: 'bg-green-50 text-green-700 border-green-200', label: 'Published' },
        completed: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Completed' },
        cancelled: { color: 'bg-red-50 text-red-700 border-red-200', label: 'Cancelled' },
        rejected: { color: 'bg-red-50 text-red-700 border-red-200', label: 'Rejected' },

        // Payment Statuses
        paid: { color: 'bg-green-50 text-green-700 border-green-200', label: 'Paid' },
        unpaid: { color: 'bg-gray-50 text-gray-700 border-gray-200', label: 'Unpaid' },
        refunded: { color: 'bg-orange-50 text-orange-700 border-orange-200', label: 'Refunded' },
        failed: { color: 'bg-red-50 text-red-700 border-red-200', label: 'Failed' },

        // Message Statuses
        new: { color: 'bg-blue-50 text-blue-700 border-blue-200', label: 'New' },
        read: { color: 'bg-gray-50 text-gray-600 border-gray-200', label: 'Read' },
        replied: { color: 'bg-green-50 text-green-700 border-green-200', label: 'Replied' }
    };

    return configs[status?.toLowerCase()] || { color: 'bg-gray-50 text-gray-600 border-gray-200', label: status };
};

const StatusBadge = ({ status, type = 'default', className = '' }) => {
    const config = getStatusConfig(status);

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color} ${className}`}>
            {config.label}
        </span>
    );
};

export default StatusBadge;
