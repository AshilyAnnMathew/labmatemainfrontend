import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    User, Mail, Phone, Calendar, MapPin, Camera,
    Save, Loader, AlertCircle, CheckCircle, Edit2, X,
    Shield, HeartPulse
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import Swal from 'sweetalert2'

const Profile = () => {
    const { user, updateUser } = useAuth()
    const [editing, setEditing] = useState(false)
    const [loading, setLoading] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    // Form state — initialised from auth context
    const initForm = () => ({
        firstName: user?.firstName || '',
        lastName: user?.lastName || '',
        phone: user?.phone || '',
        dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
        gender: user?.gender || '',
        address: user?.address || '',
        emergencyContactName: user?.emergencyContact?.name || '',
        emergencyContactPhone: user?.emergencyContact?.phone || '',
        emergencyContactRelation: user?.emergencyContact?.relation || '',
    })
    const [form, setForm] = useState(initForm)

    const handleEdit = () => {
        setForm(initForm())
        setEditing(true)
    }

    const handleCancel = () => {
        setEditing(false)
        setForm(initForm())
    }

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm(prev => ({ ...prev, [name]: value }))
    }

    const handleSave = async () => {
        if (!form.firstName.trim() || !form.lastName.trim()) {
            Swal.fire({ icon: 'warning', title: 'Required Fields', text: 'First name and last name are required.', confirmButtonColor: '#f59e0b' })
            return
        }
        try {
            setLoading(true)
            const payload = {
                firstName: form.firstName.trim(),
                lastName: form.lastName.trim(),
                phone: form.phone.trim(),
                dateOfBirth: form.dateOfBirth || undefined,
                gender: form.gender || undefined,
                address: form.address.trim(),
                emergencyContact: {
                    name: form.emergencyContactName.trim(),
                    phone: form.emergencyContactPhone.trim(),
                    relation: form.emergencyContactRelation.trim(),
                }
            }
            const response = await authAPI.updateProfile(payload)
            if (response.success) {
                if (updateUser) updateUser({ ...user, ...response.data })
                setEditing(false)
                Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
                    .fire({ icon: 'success', title: 'Profile updated successfully!' })
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Update Failed', text: error.message, confirmButtonColor: '#ef4444' })
        } finally {
            setLoading(false)
        }
    }

    const handleImageClick = () => fileInputRef.current?.click()

    const handleImageChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            Swal.fire({ icon: 'warning', title: 'Invalid File', text: 'Please select an image file.', confirmButtonColor: '#f59e0b' })
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            Swal.fire({ icon: 'warning', title: 'File Too Large', text: 'Image must be less than 5MB.', confirmButtonColor: '#f59e0b' })
            return
        }
        setUploading(true)
        const formData = new FormData()
        formData.append('profileImage', file)
        try {
            const response = await authAPI.uploadProfileImage(formData)
            if (response.success) {
                if (updateUser) updateUser({ ...user, profileImage: response.data.profileImage })
                Swal.mixin({ toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true })
                    .fire({ icon: 'success', title: 'Profile photo updated!' })
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Upload Failed', text: error.message, confirmButtonColor: '#ef4444' })
        } finally {
            setUploading(false)
        }
    }

    const getProfileImageUrl = (path) => {
        if (!path) return null
        if (path.startsWith('http')) return path
        return `http://localhost:5000/${path}`
    }

    const inputCls = 'w-full px-3 py-2.5 border border-gray-300 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition'
    const labelCls = 'block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5'
    const readValCls = 'flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100'

    return (
        <div className="w-full mx-auto py-4 px-4">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Left: Avatar Card */}
                <div className="md:col-span-1">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col items-center text-center">

                        <div className="relative group cursor-pointer" onClick={handleImageClick}>
                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 relative">
                                {user?.profileImage ? (
                                    <img
                                        src={getProfileImageUrl(user.profileImage)}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                        onError={e => { e.target.style.display = 'none' }}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-primary-100 text-primary-600">
                                        <span className="text-4xl font-bold">{user?.firstName?.[0] || 'U'}</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                                    <Camera className="h-8 w-8 text-white" />
                                </div>
                            </div>
                            <div className="absolute bottom-1 right-1 bg-white rounded-full p-2 shadow-md hover:bg-gray-50 transition-colors">
                                {uploading ? <Loader className="h-4 w-4 text-primary-500 animate-spin" /> : <Camera className="h-4 w-4 text-gray-600" />}
                            </div>
                        </div>

                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
                        {uploading && <p className="text-xs text-primary-600 mt-2 font-medium">Uploading photo...</p>}

                        <h2 className="mt-4 text-xl font-bold text-gray-900">{user?.firstName} {user?.lastName}</h2>
                        <p className="text-gray-500 text-sm capitalize">{user?.role || 'Patient'}</p>

                        <div className="mt-6 w-full pt-6 border-t border-gray-100 space-y-2">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>Joined</span>
                                <span className="font-medium">{new Date(user?.createdAt).toLocaleDateString('en-IN')}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>Status</span>
                                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">Active</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Personal Info */}
                <div className="md:col-span-2 space-y-6">

                    {/* Personal Information Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-gray-800">Personal Information</h3>
                            {!editing ? (
                                <button
                                    onClick={handleEdit}
                                    className="flex items-center gap-1.5 text-primary-600 font-semibold text-sm hover:text-primary-700 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition"
                                >
                                    <Edit2 className="w-4 h-4" /> Edit Details
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCancel}
                                        disabled={loading}
                                        className="flex items-center gap-1.5 text-gray-600 font-semibold text-sm hover:bg-gray-100 px-3 py-1.5 rounded-lg transition"
                                    >
                                        <X className="w-4 h-4" /> Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={loading}
                                        className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold text-sm px-4 py-1.5 rounded-lg transition disabled:opacity-60"
                                    >
                                        {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        {loading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <AnimatePresence mode="wait">
                            {!editing ? (
                                <motion.div
                                    key="view"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-5"
                                >
                                    <div>
                                        <label className={labelCls}>Full Name</label>
                                        <div className={readValCls}>
                                            <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-900 font-medium">{user?.firstName} {user?.lastName}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Email Address</label>
                                        <div className={readValCls}>
                                            <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-900 font-medium text-sm break-all">{user?.email}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Phone Number</label>
                                        <div className={readValCls}>
                                            <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-900 font-medium">{user?.phone || '—'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Date of Birth</label>
                                        <div className={readValCls}>
                                            <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-900 font-medium">
                                                {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-IN') : 'Not set'}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Gender</label>
                                        <div className={readValCls}>
                                            <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-900 font-medium capitalize">{user?.gender?.replace('_', ' ') || 'Not set'}</span>
                                        </div>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={labelCls}>Address</label>
                                        <div className={readValCls}>
                                            <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-900 font-medium">{user?.address || 'No address provided'}</span>
                                        </div>
                                    </div>
                                    {user?.emergencyContact?.name && (
                                        <div className="sm:col-span-2">
                                            <label className={labelCls}>Emergency Contact</label>
                                            <div className={readValCls}>
                                                <HeartPulse className="h-5 w-5 text-red-400 flex-shrink-0" />
                                                <span className="text-gray-900 font-medium">
                                                    {user.emergencyContact.name}
                                                    {user.emergencyContact.relation && ` (${user.emergencyContact.relation})`}
                                                    {user.emergencyContact.phone && ` — ${user.emergencyContact.phone}`}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="edit"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    className="grid grid-cols-1 sm:grid-cols-2 gap-5"
                                >
                                    <div>
                                        <label className={labelCls}>First Name *</label>
                                        <input className={inputCls} name="firstName" value={form.firstName} onChange={handleChange} placeholder="First name" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Last Name *</label>
                                        <input className={inputCls} name="lastName" value={form.lastName} onChange={handleChange} placeholder="Last name" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Email Address</label>
                                        <div className={`${readValCls} opacity-60 cursor-not-allowed`}>
                                            <Mail className="h-5 w-5 text-gray-400 flex-shrink-0" />
                                            <span className="text-gray-500 text-sm">{user?.email} (cannot change)</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Phone Number</label>
                                        <input className={inputCls} name="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" type="tel" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Date of Birth</label>
                                        <input className={inputCls} name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} type="date" max={new Date().toISOString().split('T')[0]} />
                                    </div>
                                    <div>
                                        <label className={labelCls}>Gender</label>
                                        <select className={inputCls} name="gender" value={form.gender} onChange={handleChange}>
                                            <option value="">Select gender</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                            <option value="prefer_not_to_say">Prefer not to say</option>
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className={labelCls}>Address</label>
                                        <input className={inputCls} name="address" value={form.address} onChange={handleChange} placeholder="Your address" />
                                    </div>

                                    {/* Emergency Contact */}
                                    <div className="sm:col-span-2 pt-2 border-t border-gray-100">
                                        <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                            <HeartPulse className="w-4 h-4 text-red-400" /> Emergency Contact
                                        </p>
                                        <div className="grid sm:grid-cols-3 gap-4">
                                            <div>
                                                <label className={labelCls}>Contact Name</label>
                                                <input className={inputCls} name="emergencyContactName" value={form.emergencyContactName} onChange={handleChange} placeholder="Full name" />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Relation</label>
                                                <input className={inputCls} name="emergencyContactRelation" value={form.emergencyContactRelation} onChange={handleChange} placeholder="e.g. Parent, Spouse" />
                                            </div>
                                            <div>
                                                <label className={labelCls}>Phone</label>
                                                <input className={inputCls} name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={handleChange} type="tel" placeholder="Phone number" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Account Settings */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Account Settings</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-semibold text-gray-900">Email Notifications</p>
                                    <p className="text-sm text-gray-500">Receive updates about appointments and test results</p>
                                </div>
                                <div className="bg-primary-600 w-12 h-6 rounded-full relative cursor-pointer">
                                    <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                <div>
                                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                                        <Shield className="w-4 h-4 text-blue-500" /> Two-Factor Authentication
                                    </p>
                                    <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                                </div>
                                <button className="text-sm font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition">Enable</button>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}

export default Profile
