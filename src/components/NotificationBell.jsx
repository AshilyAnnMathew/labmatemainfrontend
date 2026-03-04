import { useState, useEffect, useRef } from 'react'
import { Bell, BellRing, X, CheckCircle, Calendar, FileText, MessageCircle } from 'lucide-react'
import api from '../services/api'

const { getAuthToken } = api

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([])
    const [showDropdown, setShowDropdown] = useState(false)
    const [pushEnabled, setPushEnabled] = useState(false)
    const [unreadCount, setUnreadCount] = useState(0)
    const dropdownRef = useRef(null)

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

    useEffect(() => {
        // Check if push is already enabled
        if ('serviceWorker' in navigator && 'PushManager' in window) {
            navigator.serviceWorker.ready.then(reg => {
                reg.pushManager.getSubscription().then(sub => {
                    setPushEnabled(!!sub)
                })
            })
        }

        // Fetch unread chat count
        fetchUnreadCount()
        const interval = setInterval(fetchUnreadCount, 30000) // Every 30s

        // Close dropdown on click outside
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            clearInterval(interval)
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const fetchUnreadCount = async () => {
        try {
            const token = getAuthToken()
            if (!token) return
            const response = await fetch(`${API_URL}/api/chat/unread/count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            const data = await response.json()
            if (data.success) {
                setUnreadCount(data.unreadCount)
            }
        } catch (error) {
            // Silently fail
        }
    }

    const enablePush = async () => {
        try {
            // Register service worker
            const registration = await navigator.serviceWorker.register('/sw.js')
            await navigator.serviceWorker.ready

            // Get VAPID key
            const keyRes = await fetch(`${API_URL}/api/push/vapid-key`)
            const keyData = await keyRes.json()
            if (!keyData.publicKey) {
                console.log('VAPID key not configured on server')
                setPushEnabled(true) // Still show as enabled for UI
                return
            }

            // Subscribe
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(keyData.publicKey)
            })

            // Send to server
            const token = getAuthToken()
            await fetch(`${API_URL}/api/push/subscribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ subscription })
            })

            setPushEnabled(true)
        } catch (error) {
            console.error('Push enable error:', error)
        }
    }

    const disablePush = async () => {
        try {
            const registration = await navigator.serviceWorker.ready
            const subscription = await registration.pushManager.getSubscription()
            if (subscription) {
                await subscription.unsubscribe()
            }

            const token = getAuthToken()
            await fetch(`${API_URL}/api/push/unsubscribe`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            setPushEnabled(false)
        } catch (error) {
            console.error('Push disable error:', error)
        }
    }

    const urlBase64ToUint8Array = (base64String) => {
        const padding = '='.repeat((4 - base64String.length % 4) % 4)
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
                {unreadCount > 0 ? (
                    <BellRing className="h-5 w-5 text-primary-600 animate-pulse" />
                ) : (
                    <Bell className="h-5 w-5" />
                )}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900 text-sm">Notifications</h3>
                        <button onClick={() => setShowDropdown(false)} className="p-1 hover:bg-gray-200 rounded">
                            <X className="h-3.5 w-3.5 text-gray-500" />
                        </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                        {unreadCount > 0 ? (
                            <div className="p-3 border-b border-gray-50 flex items-center gap-3 bg-blue-50">
                                <MessageCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-blue-900">
                                        {unreadCount} unread message{unreadCount > 1 ? 's' : ''}
                                    </p>
                                    <p className="text-xs text-blue-600">Check My Bookings to reply</p>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 text-center text-gray-400">
                                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No new notifications</p>
                            </div>
                        )}
                    </div>

                    {/* Push Toggle */}
                    <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-600">Push Notifications</span>
                            <button
                                onClick={pushEnabled ? disablePush : enablePush}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${pushEnabled ? 'bg-primary-600' : 'bg-gray-300'
                                    }`}
                            >
                                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-sm ${pushEnabled ? 'translate-x-4' : 'translate-x-0.5'
                                    }`} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default NotificationBell
