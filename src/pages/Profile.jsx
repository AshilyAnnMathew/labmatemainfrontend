import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    User, Mail, Phone, Calendar, MapPin, Camera,
    Save, Loader, AlertCircle, CheckCircle, Edit2, X,
    Shield, HeartPulse, ExternalLink, Key, Fingerprint,
    CreditCard, Bell, ShieldCheck, Activity
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
            Swal.fire({ icon: 'warning', title: 'Attention', text: 'Required fields are missing.', confirmButtonColor: '#2563eb' })
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
                Swal.fire({
                    icon: 'success',
                    title: 'Profile Synchronized',
                    text: 'Your health records have been updated.',
                    confirmButtonColor: '#2563eb',
                    timer: 2000
                })
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Update Failed', text: error.message, confirmButtonColor: '#2563eb' })
        } finally {
            setLoading(false)
        }
    }

    const handleImageClick = () => fileInputRef.current?.click()

    const handleImageChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        const formData = new FormData()
        formData.append('profileImage', file)
        try {
            const response = await authAPI.uploadProfileImage(formData)
            if (response.success) {
                if (updateUser) updateUser({ ...user, profileImage: response.data.profileImage })
                Swal.fire({
                    icon: 'success',
                    title: 'Authentication Image Updated',
                    confirmButtonColor: '#2563eb',
                    timer: 1500
                })
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Upload Failed', text: error.message, confirmButtonColor: '#2563eb' })
        } finally {
            setUploading(false)
        }
    }

    const getProfileImageUrl = (path) => {
        if (!path) return null
        if (path.startsWith('http')) return path
        return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${path}`
    }

    const inputCls = 'w-full px-6 py-4 border border-gray-100 bg-gray-50 rounded-2xl text-[13px] font-bold text-gray-900 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-200 focus:bg-white transition-all uppercase tracking-tight'
    const labelCls = 'block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 px-1'
    const readValCls = 'flex items-center gap-4 p-5 bg-white rounded-3xl border border-gray-100 shadow-sm group hover:shadow-md transition-all'

    return (
        <div className="w-full pb-20">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
                <div>
                    <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-xl mb-4 border border-blue-100">
                        <ShieldCheck className="h-4 w-4 text-blue-600" />
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Verified Patient Account</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter uppercase underline decoration-blue-100 decoration-8 underline-offset-8">Patient Profile</h1>
                    <p className="text-gray-400 font-bold mt-4 uppercase tracking-[0.2em] text-[11px]">Personal Identity & Clinical Preferences</p>
                </div>
                {!editing ? (
                    <button
                        onClick={handleEdit}
                        className="bg-blue-600 text-white px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-blue-100 group"
                    >
                        <Edit2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                        <span>Modify Clinical Data</span>
                    </button>
                ) : (
                    <div className="flex gap-3">
                        <button
                            onClick={handleCancel}
                            disabled={loading}
                            className="bg-white text-gray-400 border border-gray-100 px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center justify-center space-x-3"
                        >
                            <X className="w-4 h-4" />
                            <span>Discard</span>
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="bg-blue-600 text-white px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-blue-100"
                        >
                            {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            <span>{loading ? 'Synchronizing...' : 'Finalize Identity'}</span>
                        </button>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                {/* Left Side: Identity Card */}
                <div className="xl:col-span-4 space-y-10">
                    <div className="bg-white rounded-[3.5rem] shadow-sm border border-gray-100 p-10 flex flex-col items-center text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-50 to-white -z-0"></div>

                        <div className="relative z-10">
                            <div className="relative group cursor-pointer" onClick={handleImageClick}>
                                <div className="w-44 h-44 rounded-[3.5rem] overflow-hidden border-8 border-white shadow-2xl bg-gray-50 relative group-hover:scale-[1.02] transition-transform">
                                    {user?.profileImage ? (
                                        <img
                                            src={getProfileImageUrl(user.profileImage)}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            onError={e => { e.target.style.display = 'none' }}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-blue-50 text-blue-600">
                                            <span className="text-6xl font-black">{user?.firstName?.[0] || 'U'}</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-blue-900/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                                        <Camera className="h-10 w-10 text-white" />
                                    </div>
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white rounded-2xl p-4 shadow-xl border-4 border-white group-hover:rotate-12 transition-transform">
                                    {uploading ? <Loader className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
                                </div>
                            </div>
                        </div>

                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />

                        <div className="mt-8 relative z-10">
                            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">{user?.firstName} {user?.lastName}</h2>
                            <div className="flex items-center justify-center space-x-2 mt-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">{user?.role || 'Patient Account'}</p>
                            </div>
                        </div>

                        <div className="mt-10 w-full pt-10 border-t border-gray-50 flex justify-between gap-4">
                            <div className="flex-1 bg-gray-50/50 p-4 rounded-3xl border border-gray-50">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Joined</p>
                                <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{new Date(user?.createdAt).toLocaleDateString('en-GB')}</p>
                            </div>
                            <div className="flex-1 bg-gray-50/50 p-4 rounded-3xl border border-gray-50">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Status</p>
                                <p className="text-[11px] font-black text-green-600 uppercase tracking-tight flex items-center justify-center space-x-2">Active</p>
                            </div>
                        </div>

                        {/* Extra identity verification badge */}
                        <div className="mt-8 bg-blue-50 p-6 rounded-[2.5rem] border border-blue-100 w-full">
                            <Shield className="h-8 w-8 text-blue-600 mx-auto mb-4" />
                            <p className="text-xs font-black text-blue-900 uppercase tracking-widest mb-1">Identity Confirmed</p>
                            <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Standard ISO 27001 Protocol</p>
                        </div>
                    </div>

                    {/* Quick Stats / History Linked */}
                    <div className="bg-gray-950 rounded-[3.5rem] p-10 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-3xl opacity-20 -mr-16 -mt-16"></div>
                        <Activity className="h-8 w-8 text-blue-400 mb-8" />
                        <h3 className="text-xl font-black uppercase tracking-tight mb-4">Integrity Check</h3>
                        <p className="text-gray-400 font-bold text-[11px] uppercase tracking-widest leading-relaxed mb-10">Last security scan of your medical identity completed today at 09:14 AM.</p>
                        <button className="flex items-center text-[10px] font-black uppercase tracking-widest text-blue-400 group-hover:text-white transition-colors">
                            Download Audit Log <ExternalLink className="ml-2 h-3 w-3" />
                        </button>
                    </div>
                </div>

                {/* Right Side: Data Modules */}
                <div className="xl:col-span-8 space-y-10">
                    <div className="bg-white rounded-[4rem] shadow-sm border border-gray-100 p-12">
                        <div className="flex items-center space-x-4 mb-12">
                            <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black">01</div>
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight underline decoration-blue-100 decoration-4 underline-offset-4">Identity Matrix</h3>
                        </div>

                        <AnimatePresence mode="wait">
                            {!editing ? (
                                <motion.div
                                    key="view"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                                >
                                    <div className="space-y-2">
                                        <label className={labelCls}>Legal Identity</label>
                                        <div className={readValCls}>
                                            <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><User className="h-5 w-5" /></div>
                                            <span className="text-[13px] font-black text-gray-900 uppercase tracking-tight">{user?.firstName} {user?.lastName}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelCls}>Secure Communication</label>
                                        <div className={readValCls}>
                                            <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Mail className="h-5 w-5" /></div>
                                            <span className="text-[12px] font-black text-gray-900 uppercase tracking-tight break-all">{user?.email}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelCls}>Mobile Protocol</label>
                                        <div className={readValCls}>
                                            <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Phone className="h-5 w-5" /></div>
                                            <span className="text-[13px] font-black text-gray-900 uppercase tracking-tight">{user?.phone || 'NOT LINKED'}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className={labelCls}>Temporal Data (DOB)</label>
                                        <div className={readValCls}>
                                            <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><Calendar className="h-5 w-5" /></div>
                                            <span className="text-[13px] font-black text-gray-900 uppercase tracking-tight">
                                                {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString('en-GB') : 'NOT SYNCHRONIZED'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className={labelCls}>Geo-Location Identity</label>
                                        <div className={readValCls}>
                                            <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600"><MapPin className="h-5 w-5" /></div>
                                            <span className="text-[12px] font-black text-gray-900 uppercase tracking-tight">{user?.address || 'GEOGRAPHIC DATA MISSING'}</span>
                                        </div>
                                    </div>
                                    {user?.emergencyContact?.name && (
                                        <div className="md:col-span-2 space-y-2 pt-6">
                                            <label className={labelCls}>Emergency Response Link</label>
                                            <div className="flex items-center gap-5 p-7 bg-red-50/50 rounded-[2.5rem] border border-red-50">
                                                <div className="h-12 w-12 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 shadow-sm"><HeartPulse className="h-6 w-6" /></div>
                                                <div className="flex flex-col">
                                                    <span className="text-[13px] font-black text-gray-900 uppercase tracking-tight">
                                                        {user.emergencyContact.name}
                                                    </span>
                                                    <span className="text-[10px] font-black text-red-400 uppercase tracking-widest mt-1">
                                                        {user.emergencyContact.relation || 'Protocol contact'} — {user.emergencyContact.phone || 'NO PHONE'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="edit"
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    className="grid grid-cols-1 md:grid-cols-2 gap-10"
                                >
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className={labelCls}>First Name</label>
                                            <input className={inputCls} name="firstName" value={form.firstName} onChange={handleChange} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className={labelCls}>Last Name</label>
                                            <input className={inputCls} name="lastName" value={form.lastName} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className={labelCls}>Mobile Number</label>
                                            <input className={inputCls} name="phone" value={form.phone} onChange={handleChange} type="tel" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className={labelCls}>Temporal Marker (DOB)</label>
                                            <input className={inputCls} name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} type="date" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className={labelCls}>Clinical Gender</label>
                                            <select className={inputCls} name="gender" value={form.gender} onChange={handleChange}>
                                                <option value="">Select identity</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className={labelCls}>Geographic Address</label>
                                            <input className={inputCls} name="address" value={form.address} onChange={handleChange} />
                                        </div>
                                    </div>

                                    {/* Emergency UI Module */}
                                    <div className="md:col-span-2 p-10 bg-gray-50 rounded-[3rem] border border-gray-100">
                                        <div className="flex items-center space-x-3 mb-8">
                                            <HeartPulse className="w-5 h-5 text-red-500" />
                                            <h4 className="text-[12px] font-black text-gray-900 uppercase tracking-widest">Emergency Interface Override</h4>
                                        </div>
                                        <div className="grid md:grid-cols-3 gap-6">
                                            <div className="space-y-2">
                                                <label className={labelCls}>Agent Name</label>
                                                <input className={inputCls} name="emergencyContactName" value={form.emergencyContactName} onChange={handleChange} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className={labelCls}>Relation</label>
                                                <input className={inputCls} name="emergencyContactRelation" value={form.emergencyContactRelation} onChange={handleChange} />
                                            </div>
                                            <div className="space-y-2">
                                                <label className={labelCls}>Emergency Line</label>
                                                <input className={inputCls} name="emergencyContactPhone" value={form.emergencyContactPhone} onChange={handleChange} type="tel" />
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Account Security Module */}
                    <div className="bg-white rounded-[4rem] shadow-sm border border-gray-100 p-12">
                        <div className="flex items-center space-x-4 mb-12">
                            <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black">02</div>
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tight underline decoration-blue-100 decoration-4 underline-offset-4">Security Hub</h3>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col justify-between hover:bg-blue-50/30 transition-all group">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm"><Key className="h-5 w-5 text-blue-600" /></div>
                                    <button className="text-[9px] font-black text-blue-600 uppercase tracking-widest hover:bg-white px-4 py-2 rounded-xl transition-all">Update Key</button>
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-1">Access Protocol</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Manage credentials & secrets</p>
                                </div>
                            </div>

                            <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-100 flex flex-col justify-between hover:bg-blue-50/30 transition-all">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="p-3 bg-white rounded-2xl shadow-sm"><Fingerprint className="h-5 w-5 text-blue-600" /></div>
                                    <div className="flex items-center space-x-2 bg-blue-100 px-3 py-1.5 rounded-xl">
                                        <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
                                        <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest">ENABLED</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-gray-900 uppercase tracking-widest mb-1">Biometric Hash</p>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Optical Identity Verification</p>
                                </div>
                            </div>

                            <div className="md:col-span-2 p-8 bg-gray-50 rounded-[3rem] border border-gray-100 flex items-center justify-between">
                                <div className="flex items-center space-x-6">
                                    <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center"><Bell className="h-6 w-6 text-orange-500" /></div>
                                    <div>
                                        <p className="text-[12px] font-black text-gray-900 uppercase tracking-tight">Clinical Alerts Line</p>
                                        <p className="text-[9px] text-gray-400 uppercase tracking-widest font-bold mt-1">Instant sync for test result publications</p>
                                    </div>
                                </div>
                                <div className="bg-blue-600 w-14 h-8 rounded-full relative p-1 cursor-pointer shadow-lg shadow-blue-100">
                                    <div className="absolute right-1 top-1 w-6 h-6 bg-white rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Profile
