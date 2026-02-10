import React, { useState, useEffect } from 'react';
import {
    MessageCircle,
    Search,
    Clock,
    CheckCircle,
    Mail,
    User,
    Reply,
    Trash2,
    AlertCircle,
    Inbox,
    ArrowLeft
} from 'lucide-react';
import api from '../services/api';
import Swal from 'sweetalert2';
import StatusBadge from '../components/common/StatusBadge';

const StaffPatientCommunication = () => {
    const [messages, setMessages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, new, read, replied
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMessages();
    }, [filter, page]);

    const fetchMessages = async () => {
        try {
            setLoading(true);
            const response = await api.messageAPI.getMessages(filter, page);
            if (response.success) {
                setMessages(response.data);
                setTotalPages(response.pagination.pages);
            }
        } catch (error) {
            console.error('Error fetching messages:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch messages',
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3000
            });
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.messageAPI.updateMessageStatus(id, status);
            // Update local state
            setMessages(messages.map(msg =>
                msg._id === id ? { ...msg, status } : msg
            ));
            if (selectedMessage && selectedMessage._id === id) {
                setSelectedMessage({ ...selectedMessage, status });
            }
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const handleReply = () => {
        Swal.fire({
            title: 'Reply to Patient',
            text: `Please reply using your organization's email client to: ${selectedMessage.email}`,
            icon: 'info',
            confirmButtonText: 'Mark as Replied',
            confirmButtonColor: '#059669', // emerald-600
            showCancelButton: true,
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                handleStatusUpdate(selectedMessage._id, 'replied');
            }
        });
    };

    const filteredMessages = messages.filter(msg =>
        msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        msg.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-[calc(100vh-6rem)] flex flex-col">
            <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Patient Communication</h1>
                    <p className="text-sm text-gray-500">Manage support inquiries and patient messages.</p>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex">
                {/* Sidebar List */}
                <div className={`${selectedMessage ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 min-w-[320px] border-r border-gray-200 bg-white`}>
                    {/* Toolbar */}
                    <div className="p-4 border-b border-gray-200 bg-gray-50/50 space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search messages..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            />
                        </div>
                        <div className="flex bg-gray-200/50 p-1 rounded-lg">
                            {['all', 'new', 'replied'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${filter === f
                                            ? 'bg-white text-gray-900 shadow-sm'
                                            : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500 text-sm">Loading messages...</div>
                        ) : filteredMessages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-8">
                                <Inbox className="h-10 w-10 mb-2 text-gray-300" />
                                <p className="text-sm">No messages found</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredMessages.map(msg => (
                                    <div
                                        key={msg._id}
                                        onClick={() => {
                                            setSelectedMessage(msg);
                                            if (msg.status === 'new') handleStatusUpdate(msg._id, 'read');
                                        }}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors relative ${selectedMessage?._id === msg._id ? 'bg-blue-50/50' : ''
                                            }`}
                                    >
                                        {msg.status === 'new' && (
                                            <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500"></span>
                                        )}
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm truncate pr-2 ${msg.status === 'new' ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                {msg.name}
                                            </h4>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {new Date(msg.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-xs font-medium text-gray-900 mb-1 truncate">{msg.subject}</p>
                                        <p className="text-xs text-gray-500 line-clamp-2">{msg.message}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Message Detail */}
                <div className={`${!selectedMessage ? 'hidden md:flex' : 'flex'} flex-col flex-1 bg-white h-full relative`}>
                    {selectedMessage ? (
                        <>
                            {/* Header */}
                            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-start bg-white sticky top-0 z-10">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedMessage(null)}
                                        className="md:hidden p-1 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 line-clamp-1">{selectedMessage.subject}</h2>
                                        <div className="flex items-center gap-2 mt-1">
                                            <StatusBadge status={selectedMessage.status} />
                                            <span className="text-xs text-gray-400 flex items-center">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {new Date(selectedMessage.createdAt).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleStatusUpdate(selectedMessage._id, selectedMessage.status === 'read' ? 'new' : 'read')}
                                        className="p-2 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded-full transition-colors"
                                        title={selectedMessage.status === 'read' ? "Mark as Unread" : "Mark as Read"}
                                    >
                                        {selectedMessage.status === 'read' ? <Mail className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {/* Sender Info Card */}
                                <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                                        {selectedMessage.name[0]}
                                    </div>
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-900">{selectedMessage.name}</div>
                                        <div className="text-sm text-gray-500">{selectedMessage.email}</div>
                                    </div>
                                    <a
                                        href={`mailto:${selectedMessage.email}`}
                                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-full transition-colors"
                                        title="Compose Email"
                                    >
                                        <Reply className="h-5 w-5" />
                                    </a>
                                </div>

                                {/* Message Body */}
                                <div className="bg-white">
                                    <div className="prose max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
                                        {selectedMessage.message}
                                    </div>
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                                <button
                                    onClick={handleReply}
                                    className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 flex items-center shadow-sm"
                                >
                                    <Reply className="h-4 w-4 mr-2" />
                                    Reply
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                            <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Mail className="h-10 w-10 text-gray-300" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No message selected</h3>
                            <p className="text-sm text-gray-500 mt-1 max-w-xs text-center">Select a conversation from the list to view details and respond.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StaffPatientCommunication;
