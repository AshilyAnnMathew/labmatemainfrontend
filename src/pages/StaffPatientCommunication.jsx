import { useState, useEffect } from 'react'
import {
    MessageCircle,
    Search,
    Filter,
    Clock,
    CheckCircle,
    Mail,
    User,
    MoreVertical,
    Reply
} from 'lucide-react'
import api from '../services/api'
import Swal from 'sweetalert2'

const StaffPatientCommunication = () => {
    const [messages, setMessages] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all') // all, new, read, replied
    const [selectedMessage, setSelectedMessage] = useState(null)
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)

    useEffect(() => {
        fetchMessages()
    }, [filter, page])

    const fetchMessages = async () => {
        try {
            setLoading(true)
            const response = await api.messageAPI.getMessages(filter, page)
            if (response.success) {
                setMessages(response.data)
                setTotalPages(response.pagination.pages)
            }
        } catch (error) {
            console.error('Error fetching messages:', error)
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to fetch messages'
            })
        } finally {
            setLoading(false)
        }
    }

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.messageAPI.updateMessageStatus(id, status)
            // Update local state
            setMessages(messages.map(msg =>
                msg._id === id ? { ...msg, status } : msg
            ))
            if (selectedMessage && selectedMessage._id === id) {
                setSelectedMessage({ ...selectedMessage, status })
            }
            if (status !== filter && filter !== 'all') {
                fetchMessages() // Refresh if filtered out
            }
        } catch (error) {
            console.error('Failed to update status:', error)
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-800'
            case 'read': return 'bg-gray-100 text-gray-800'
            case 'replied': return 'bg-green-100 text-green-800'
            default: return 'bg-gray-100 text-gray-800'
        }
    }

    const handleReply = () => {
        // Placeholder for future email integration or internal reply system
        Swal.fire({
            title: 'Reply Feature',
            text: 'Email functionality is currently being integrated. Please use your email client to reply to: ' + selectedMessage.email,
            icon: 'info',
            confirmButtonText: 'Mark as Replied',
            showCancelButton: true,
            cancelButtonText: 'Close'
        }).then((result) => {
            if (result.isConfirmed) {
                handleStatusUpdate(selectedMessage._id, 'replied')
            }
        })
    }

    return (
        <div className="flex flex-col h-[calc(100vh-120px)] bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
            <div className="flex flex-1 overflow-hidden">
                {/* Message List Sidebar */}
                <div className={`${selectedMessage ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-1/3 border-r border-gray-200 bg-white`}>
                    <div className="p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                            <MessageCircle className="w-6 h-6 mr-2 text-primary-600" />
                            Inbox
                        </h2>
                        <div className="flex space-x-2 overflow-x-auto pb-2">
                            {['all', 'new', 'read', 'replied'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize whitespace-nowrap transition-colors ${filter === f
                                            ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-600'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">Loading...</div>
                        ) : messages.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">No messages found</div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {messages.map(msg => (
                                    <div
                                        key={msg._id}
                                        onClick={() => {
                                            setSelectedMessage(msg)
                                            if (msg.status === 'new') handleStatusUpdate(msg._id, 'read')
                                        }}
                                        className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${selectedMessage?._id === msg._id ? 'bg-blue-50' : ''
                                            } ${msg.status === 'new' ? 'border-l-4 border-primary-500' : 'pl-5'}`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className={`text-sm truncate pr-2 ${msg.status === 'new' ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                {msg.name}
                                            </h4>
                                            <span className="text-xs text-gray-400 whitespace-nowrap">
                                                {new Date(msg.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className={`text-xs text-primary-600 mb-1 truncate font-medium`}>{msg.subject}</p>
                                        <p className="text-xs text-gray-500 line-clamp-2">
                                            {msg.message}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Message Detail View */}
                <div className={`${!selectedMessage ? 'hidden md:flex' : 'flex'} flex-col flex-1 bg-white overflow-hidden`}>
                    {!selectedMessage ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <Mail className="w-8 h-8 text-gray-300" />
                            </div>
                            <p className="text-lg">Select a message to view details</p>
                        </div>
                    ) : (
                        <>
                            {/* Toolbar */}
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white sticky top-0 z-10">
                                <button
                                    onClick={() => setSelectedMessage(null)}
                                    className="md:hidden text-gray-500 hover:text-gray-700 mr-2"
                                >
                                    Back
                                </button>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => handleStatusUpdate(selectedMessage._id, 'new')}
                                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                                        title="Mark as unread"
                                    >
                                        <Mail className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleStatusUpdate(selectedMessage._id, 'read')}
                                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                                        title="Mark as read"
                                    >
                                        <CheckCircle className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex-1 overflow-y-auto p-6 md:p-8">
                                <div className="max-w-3xl mx-auto">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h1 className="text-2xl font-bold text-gray-900 mb-2">{selectedMessage.subject}</h1>
                                            <div className="flex items-center space-x-3 text-sm text-gray-500">
                                                <div className="flex items-center bg-gray-100 px-3 py-1 rounded-full">
                                                    <User className="w-4 h-4 mr-2" />
                                                    <span className="font-medium text-gray-900 mr-1">{selectedMessage.name}</span>
                                                    <span>&lt;{selectedMessage.email}&gt;</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <Clock className="w-4 h-4 mr-1" />
                                                    {new Date(selectedMessage.createdAt).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(selectedMessage.status)}`}>
                                            {selectedMessage.status}
                                        </span>
                                    </div>

                                    <div className="prose max-w-none text-gray-700 leading-relaxed bg-gray-50 p-6 rounded-lg border border-gray-100">
                                        {selectedMessage.message.split('\n').map((line, i) => (
                                            <p key={i} className="mb-2">{line}</p>
                                        ))}
                                    </div>

                                    <div className="mt-8 pt-6 border-t border-gray-100">
                                        <button
                                            onClick={handleReply}
                                            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
                                        >
                                            <Reply className="w-4 h-4 mr-2" />
                                            Reply via Email
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default StaffPatientCommunication
