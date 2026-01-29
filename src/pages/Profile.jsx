import { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import {
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Camera,
    Save,
    Loader,
    AlertCircle,
    CheckCircle
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'


const Profile = () => {
    const { user, updateUser } = useAuth()
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [message, setMessage] = useState(null) // { type: 'success' | 'error', text: '' }
    const fileInputRef = useRef(null)

    // Form state
    // Assuming user data is available in 'user' context
    // If not, we might need to fetch it or use what's available

    const handleImageClick = () => {
        fileInputRef.current?.click()
    }

    const handleImageChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Simple validation
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please select an image file.' })
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'Image size must be less than 5MB.' })
            return
        }

        setUploading(true)
        setMessage(null)

        const formData = new FormData()
        formData.append('profileImage', file)
        try {
            const response = await authAPI.uploadProfileImage(formData)

            if (response.success) {
                setMessage({ type: 'success', text: 'Profile image updated successfully!' })
                if (updateUser) {
                    updateUser({ ...user, profileImage: response.data.profileImage })
                }
            } else {
                setMessage({ type: 'error', text: response.message || 'Failed to upload image' })
            }
        } catch (error) {
            console.error('Upload error:', error)
            setMessage({ type: 'error', text: error.message || 'Failed to upload image' })
        } finally {
            setUploading(false)
        }
    }

    const getProfileImageUrl = (path) => {
        if (!path) return null
        // If absolute URL
        if (path.startsWith('http')) return path
        // If relative path from backend (adjust base URL as needed)
        // using hardcoded localhost:5000 is risky if backend changes
        // Better to check if path starts with 'uploads/'
        if (path.startsWith('uploads/')) return `http://localhost:5000/${path}`
        // Fallback
        return `http://localhost:5000/${path}`
    }

    return (
        <div className="w-full mx-auto py-4 px-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

            {/* Message Alert */}
            {message && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-lg mb-6 flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                >
                    {message.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> : <AlertCircle className="h-5 w-5 mr-2" />}
                    {message.text}
                </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Left Column: Profile Card */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-6 flex flex-col items-center text-center">

                        <div className="relative group cursor-pointer" onClick={handleImageClick}>
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 relative">
                                {user?.profileImage ? (
                                    <img
                                        src={getProfileImageUrl(user.profileImage)}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=User' }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600">
                                        <span className="text-4xl font-bold">{user?.firstName?.[0] || 'U'}</span>
                                    </div>
                                )}

                                {/* Overlay */}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="h-8 w-8 text-white" />
                                </div>
                            </div>
                            <div className="absolute bottom-1 right-1 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors">
                                <Camera className="h-4 w-4 text-gray-600" />
                            </div>
                        </div>

                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                        />

                        {uploading && <p className="text-xs text-primary-600 mt-2 font-medium">Uploading...</p>}

                        <h2 className="mt-4 text-xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h2>
                        <p className="text-gray-500 text-sm capitalize">{user?.role || 'Patient'}</p>

                        <div className="mt-6 w-full pt-6 border-t border-gray-100">
                            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                                <span>Joined</span>
                                <span className="font-medium">{new Date(user?.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>Status</span>
                                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">Active</span>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Right Column: User Details */}
                <div className="md:col-span-2">
                    <div className="bg-white rounded-2xl shadow-soft border border-gray-100 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-800">Personal Information</h3>
                            <button className="text-primary-600 font-medium text-sm hover:text-primary-700 hover:underline">Edit Details</button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Full Name</label>
                                <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                                    <User className="h-5 w-5 text-gray-400 mr-3" />
                                    <span className="text-gray-900 font-medium">{user?.firstName} {user?.lastName}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Email Address</label>
                                <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                                    <Mail className="h-5 w-5 text-gray-400 mr-3" />
                                    <span className="text-gray-900 font-medium">{user?.email}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Phone Number</label>
                                <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                                    <Phone className="h-5 w-5 text-gray-400 mr-3" />
                                    <span className="text-gray-900 font-medium">{user?.phone}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Date of Birth</label>
                                <div className="flex items-center p-3 bg-gray-50 rounded-xl border border-gray-200">
                                    <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                                    <span className="text-gray-900 font-medium">{user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not set'}</span>
                                </div>
                            </div>

                            <div className="sm:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">Address</label>
                                <div className="flex items-start p-3 bg-gray-50 rounded-xl border border-gray-200">
                                    <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                                    <span className="text-gray-900 font-medium">{user?.address || 'No address provided'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 bg-white rounded-2xl shadow-soft border border-gray-100 p-8">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-gray-800">Account Settings</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-semibold text-gray-900">Email Notifications</p>
                                    <p className="text-sm text-gray-500">Receive updates about your appointments and test results</p>
                                </div>
                                <div className="bg-primary-600 w-12 h-6 rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-semibold text-gray-900">Two-Factor Authentication</p>
                                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                                </div>
                                <button className="text-sm font-medium text-primary-600 hover:text-primary-700">Enable</button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Profile
