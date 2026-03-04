import { useState, useEffect, useRef } from 'react'
import { MessageCircle, Send, X, Loader, ChevronDown } from 'lucide-react'
import io from 'socket.io-client'
import api from '../services/api'

const { getAuthToken } = api

const ChatWidget = ({ bookingId, labName, onClose }) => {
    const [messages, setMessages] = useState([])
    const [newMessage, setNewMessage] = useState('')
    const [loading, setLoading] = useState(true)
    const [sending, setSending] = useState(false)
    const [isTyping, setIsTyping] = useState(false)
    const messagesEndRef = useRef(null)
    const socketRef = useRef(null)
    const typingTimeoutRef = useRef(null)

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

    useEffect(() => {
        // Connect to Socket.IO
        const token = getAuthToken()
        socketRef.current = io(API_URL, {
            auth: { token },
            transports: ['websocket', 'polling']
        })

        socketRef.current.on('connect', () => {
            console.log('Chat connected')
            socketRef.current.emit('join-chat', bookingId)
        })

        socketRef.current.on('new-message', (message) => {
            setMessages(prev => [...prev, message])
        })

        socketRef.current.on('user-typing', ({ isTyping: typing }) => {
            setIsTyping(typing)
        })

        // Fetch existing messages
        fetchMessages()

        return () => {
            if (socketRef.current) {
                socketRef.current.emit('leave-chat', bookingId)
                socketRef.current.disconnect()
            }
        }
    }, [bookingId])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const fetchMessages = async () => {
        try {
            setLoading(true)
            const token = getAuthToken()
            const response = await fetch(`${API_URL}/api/chat/${bookingId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()
            if (data.success) {
                setMessages(data.data.messages || [])
                // Mark as read
                fetch(`${API_URL}/api/chat/${bookingId}/read`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            }
        } catch (error) {
            console.error('Error fetching messages:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSend = async () => {
        if (!newMessage.trim() || sending) return

        setSending(true)
        try {
            const token = getAuthToken()
            const response = await fetch(`${API_URL}/api/chat/${bookingId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ text: newMessage.trim() })
            })
            const data = await response.json()
            if (data.success) {
                setNewMessage('')
            }
        } catch (error) {
            console.error('Error sending message:', error)
        } finally {
            setSending(false)
        }
    }

    const handleTyping = () => {
        if (socketRef.current) {
            socketRef.current.emit('typing', { bookingId, isTyping: true })
            clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = setTimeout(() => {
                socketRef.current.emit('typing', { bookingId, isTyping: false })
            }, 2000)
        }
    }

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const currentUserId = (() => {
        try {
            const token = getAuthToken()
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]))
                return payload.userId
            }
        } catch { }
        return null
    })()

    return (
        <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col z-50 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-4 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    <div>
                        <h3 className="font-semibold text-sm">Chat with Staff</h3>
                        <p className="text-xs text-primary-200">{labName}</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader className="h-6 w-6 animate-spin text-primary-500" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <MessageCircle className="h-10 w-10 mb-2 opacity-50" />
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs">Start a conversation with the lab staff</p>
                    </div>
                ) : (
                    messages.map((msg, i) => {
                        const isMine = msg.sender?._id === currentUserId || msg.sender === currentUserId
                        return (
                            <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm ${isMine
                                    ? 'bg-primary-600 text-white rounded-br-md'
                                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-md'
                                    }`}>
                                    {!isMine && msg.sender?.firstName && (
                                        <p className="text-[10px] font-semibold text-primary-600 mb-0.5">
                                            {msg.sender.firstName} {msg.sender.lastName} • {msg.sender.role === 'user' ? 'Patient' : 'Staff'}
                                        </p>
                                    )}
                                    <p className="text-sm leading-relaxed">{msg.text}</p>
                                    <p className={`text-[10px] mt-1 ${isMine ? 'text-primary-200' : 'text-gray-400'}`}>
                                        {formatTime(msg.timestamp)}
                                    </p>
                                </div>
                            </div>
                        )
                    })
                )}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-4 py-2 shadow-sm">
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-100 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => { setNewMessage(e.target.value); handleTyping() }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                    />
                    <button
                        onClick={handleSend}
                        disabled={!newMessage.trim() || sending}
                        className="p-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {sending ? <Loader className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default ChatWidget
