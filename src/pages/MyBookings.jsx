import { useState, useEffect } from 'react'
import {
  Calendar, MapPin, Phone, Clock, CreditCard, AlertCircle, CheckCircle, XCircle,
  Loader, Search, Eye, Trash2, Building2, FlaskConical, Package, TestTube,
  Beaker, FileText, Shield, ChevronDown, ChevronRight, Bell, BellRing,
  MessageCircle, Activity, ShieldCheck, ArrowRight, Info, Filter, MoreHorizontal
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Swal from 'sweetalert2'
import api from '../services/api'
import ChatWidget from '../components/ChatWidget'
import { useAuth } from '../contexts/AuthContext'

const { bookingAPI } = api

const STATUS_STEPS = [
  { key: 'pending', label: 'Registered', icon: Calendar },
  { key: 'confirmed', label: 'Validated', icon: ShieldCheck },
  { key: 'sample_collected', label: 'Phase I: Bio-Acquisition', icon: TestTube },
  { key: 'partially_completed', label: 'Phase II: Analysis', icon: Beaker },
  { key: 'result_published', label: 'Phase III: Data Release', icon: FileText },
  { key: 'completed', label: 'Finalized', icon: CheckCircle }
]

const STATUS_ORDER = STATUS_STEPS.map(s => s.key)

const MyBookings = () => {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [expandedCards, setExpandedCards] = useState({})
  const [activeChat, setActiveChat] = useState(null)

  useEffect(() => {
    fetchBookings()
  }, [currentPage, filterStatus])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const response = await bookingAPI.getBookings(filterStatus, currentPage, 12)
      setBookings(response.data)
      setTotalPages(response.pagination.pages)
    } catch (err) {
      setError('Neural Link Failure: Unable to fetch clinical appointments')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelBooking = async (booking) => {
    const result = await Swal.fire({
      title: 'De-Schedule Appointment?',
      text: `Confirm cancellation for ${booking.labId?.name}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Confirm De-scheduling',
      customClass: { popup: 'rounded-[3rem]' }
    })

    if (result.isConfirmed) {
      try {
        await bookingAPI.cancelBooking(booking._id)
        await fetchBookings()
        Swal.fire({ icon: 'success', title: 'Removed', text: 'Sequence terminated successfully', confirmButtonColor: '#2563eb' })
      } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error', text: err.message, confirmButtonColor: '#ef4444' })
      }
    }
  }

  const handlePayNow = async (booking) => {
    try {
      const orderResponse = await api.bookingAPI.createOrder(booking._id)
      const orderData = orderResponse.data
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => {
        const rzp = new window.Razorpay({
          key: 'rzp_test_R79jO6N4F99QLG',
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'LabMate360 Secure',
          order_id: orderData.orderId,
          handler: async (response) => {
            try {
              await api.bookingAPI.processPayment(booking._id, {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
              await fetchBookings()
              Swal.fire({ icon: 'success', title: 'Payment Secured', confirmButtonColor: '#2563eb' })
            } catch {
              Swal.fire({ icon: 'error', title: 'Verification Error', confirmButtonColor: '#ef4444' })
            }
          },
          prefill: { name: `${user?.firstName} ${user?.lastName}`, email: user?.email },
          theme: { color: '#2563eb' }
        })
        rzp.open()
      }
      document.body.appendChild(script)
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gateway Access Failure', text: err.message, confirmButtonColor: '#ef4444' })
    }
  }

  const canPayOnline = (booking) => booking.paymentStatus !== 'completed' && booking.status !== 'cancelled' && !['result_published', 'completed'].includes(booking.status)
  const getStatusIndex = (status) => STATUS_ORDER.indexOf(status)
  const getStatusLabel = (status) => {
    const labels = { pending: 'Booked', confirmed: 'Validated', sample_collected: 'Acquisition', partially_completed: 'Analysis', result_published: 'Published', completed: 'Finalized', cancelled: 'Terminated' }
    return labels[status] || status
  }
  const getStatusColor = (status) => {
    const colors = { pending: 'bg-blue-50 text-blue-600 border-blue-100', confirmed: 'bg-indigo-50 text-indigo-600 border-indigo-100', sample_collected: 'bg-purple-50 text-purple-600 border-purple-100', partially_completed: 'bg-amber-50 text-amber-600 border-amber-100', result_published: 'bg-green-50 text-green-600 border-green-100', completed: 'bg-green-50 text-green-700 border-green-100', cancelled: 'bg-red-50 text-red-600 border-red-100' }
    return colors[status] || 'bg-gray-50 text-gray-600 border-gray-100'
  }

  const getPaymentStatusColor = (status) => {
    const colors = {
      completed: 'bg-green-50 text-green-600 border-green-100',
      pending: 'bg-amber-50 text-amber-600 border-amber-100',
      failed: 'bg-red-50 text-red-600 border-red-100',
      refunded: 'bg-purple-50 text-purple-600 border-purple-100'
    }
    return colors[status?.toLowerCase()] || 'bg-gray-50 text-gray-400 border-gray-100'
  }

  const formatTime = (t) => t
  const getTestProgress = (booking) => {
    const total = (booking.testResults || []).length
    const completed = (booking.testResults || []).filter(r => r.status === 'completed' || r.status === 'verified').length
    let expected = (booking.selectedTests?.length || 0)
    if (booking.selectedPackages) booking.selectedPackages.forEach(p => { expected += (p.packageId?.selectedTests?.length || 0) })
    if (expected === 0) expected = total || 1
    return { total: expected, completed, percent: Math.round((completed / expected) * 100) }
  }

  const filteredBookings = bookings.filter(b => {
    const s = searchTerm.toLowerCase()
    return (b.labId?.name || '').toLowerCase().includes(s) || b._id.toLowerCase().includes(s)
  })

  // ── REFACTORED COMPONENTS ──

  const StatusTracker = ({ status }) => {
    if (status === 'cancelled') return (
      <div className="flex items-center space-x-3 py-4 px-6 bg-red-50 rounded-2xl border border-red-100">
        <XCircle className="h-5 w-5 text-red-500" />
        <span className="text-[10px] font-black text-red-700 uppercase tracking-widest">Diagnostic Sequence Terminated</span>
      </div>
    )
    const currentIdx = getStatusIndex(status)
    return (
      <div className="flex items-center justify-between w-full py-6 relative">
        <div className="absolute top-[50%] left-0 w-full h-[2px] bg-gray-100 -translate-y-1/2"></div>
        <div className="absolute top-[50%] left-0 h-[2px] bg-blue-600 -translate-y-1/2 transition-all duration-700" style={{ width: `${(currentIdx / (STATUS_STEPS.length - 1)) * 100}%` }}></div>

        {STATUS_STEPS.map((step, idx) => {
          const reached = idx <= currentIdx
          const active = idx === currentIdx
          const Icon = step.icon
          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center group">
              <div className={`h-11 w-11 rounded-[15px] flex items-center justify-center border-4 transition-all duration-500 ${active ? 'bg-blue-600 border-white shadow-xl shadow-blue-200 rotate-12 scale-110' : reached ? 'bg-green-500 border-white text-white' : 'bg-white border-gray-100 text-gray-300'}`}>
                {reached && !active ? <CheckCircle className="h-5 w-5" /> : <Icon className={`h-4 w-4 ${active ? 'text-white' : ''}`} />}
              </div>
              <div className="absolute -bottom-10 whitespace-nowrap hidden group-hover:block bg-gray-900 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg">{step.label}</div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderBookingCard = (booking) => {
    const lab = booking.labId
    const progress = getTestProgress(booking)
    const isExpanded = expandedCards[booking._id]
    const showProgress = ['sample_collected', 'partially_completed', 'result_published', 'completed'].includes(booking.status)

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={booking._id}
        className="bg-white rounded-[3.5rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden flex flex-col"
      >
        <div className="p-10 flex-1">
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center space-x-4">
              <div className="h-14 w-14 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight line-clamp-1">{lab?.name}</h3>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`h-2 w-2 rounded-full ${booking.status === 'cancelled' ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{getStatusLabel(booking.status)}</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <button onClick={() => { setSelectedBooking(booking); setShowBookingModal(true) }} className="p-3 bg-gray-50 text-gray-400 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm"><Eye className="h-4 w-4" /></button>
              <button onClick={() => setActiveChat({ id: booking._id, labName: lab?.name })} className="p-3 bg-gray-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-2xl transition-all shadow-sm"><MessageCircle className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="p-5 bg-gray-50 rounded-[2.5rem] border border-gray-100">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Clinical Date</p>
              <div className="flex items-center space-x-2">
                <Calendar className="h-3 w-3 text-blue-600" />
                <span className="text-[11px] font-black text-gray-900 tracking-tight">{new Date(booking.appointmentDate).toDateString()}</span>
              </div>
            </div>
            <div className="p-5 bg-gray-50 rounded-[2.5rem] border border-gray-100">
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Time Slot</p>
              <div className="flex items-center space-x-2">
                <Clock className="h-3 w-3 text-blue-600" />
                <span className="text-[11px] font-black text-gray-900 tracking-tight">{booking.appointmentTime}</span>
              </div>
            </div>
          </div>

          {showProgress && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Diagnostic Progress</span>
                <span className="text-[10px] font-black text-gray-900">{progress.percent}% Synchronized</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress.percent}%` }} className="h-full bg-blue-600 rounded-full shadow-lg shadow-blue-100"></motion.div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {booking.selectedTests?.slice(0, 2).map((t, i) => (
              <div key={i} className="flex items-center space-x-3 p-4 bg-white rounded-2xl border border-gray-50 shadow-sm">
                <TestTube className="h-4 w-4 text-purple-400" />
                <span className="text-[11px] font-black text-gray-600 uppercase tracking-tight truncate">{t.testName}</span>
              </div>
            ))}
            {booking.selectedTests?.length > 2 && <p className="text-[9px] font-black text-blue-400 uppercase text-center">+ {booking.selectedTests.length - 2} Additional Diagnostic Segments</p>}
          </div>
        </div>

        <div className="bg-gray-50 p-6 flex items-center justify-between border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">Booking Reference</span>
            <span className="text-[10px] font-black text-gray-900 uppercase">#{booking._id.slice(-8)}</span>
          </div>
          {canPayOnline(booking) ? (
            <button
              onClick={() => handlePayNow(booking)}
              className="bg-green-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-xl shadow-green-100 flex items-center space-x-2"
            >
              <CreditCard className="h-4 w-4" /> <span>Settle ₹{booking.totalAmount}</span>
            </button>
          ) : (
            <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getPaymentStatusColor(booking.paymentStatus)}`}>
              {booking.paymentStatus}
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  const upcomingAppointments = bookings.filter(b => ['pending', 'confirmed'].includes(b.status) && new Date(b.appointmentDate) >= new Date()).slice(0, 1)

  return (
    <div className="w-full pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
        <div>
          <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-xl mb-4 border border-blue-100">
            <Activity className="h-4 w-4 text-blue-600" />
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Real-time Diagnostic Monitoring</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter uppercase underline decoration-blue-100 decoration-8 underline-offset-8">My Clinical Path</h1>
          <p className="text-gray-400 font-bold mt-4 uppercase tracking-[0.2em] text-[11px]">Lifecycle tracking for your medical bookings</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative group">
            <Search className="h-4 w-4 absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
            <input
              type="text"
              placeholder="REF ID OR LAB..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-14 pr-6 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest placeholder:text-gray-200 focus:ring-4 focus:ring-blue-50 transition-all lg:w-64"
            />
          </div>
          <div className="relative">
            <Filter className="h-4 w-4 absolute left-6 top-1/2 -translate-y-1/2 text-blue-600" />
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1) }}
              className="pl-14 pr-10 py-4 bg-white border border-gray-100 rounded-2xl shadow-sm text-[10px] font-black uppercase tracking-widest focus:ring-4 focus:ring-blue-50 transition-all appearance-none cursor-pointer"
            >
              <option value="all">ALL STAGES</option>
              <option value="pending">BOOKED</option>
              <option value="confirmed">VALIDATED</option>
              <option value="sample_collected">ACQUISITION</option>
              <option value="completed">FINALIZED</option>
              <option value="cancelled">TERMINATED</option>
            </select>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {upcomingAppointments.length > 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-12">
            <div className="bg-gray-950 rounded-[4rem] p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[150px] opacity-20 -mr-48 -mt-48"></div>
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="flex items-center space-x-8">
                  <div className="h-20 w-20 bg-blue-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-blue-500/20"><BellRing className="h-10 w-10 animate-shake" /></div>
                  <div>
                    <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.3em] mb-2">Priority Update</p>
                    <h2 className="text-3xl font-black uppercase tracking-tight">Upcoming Diagnostic Window</h2>
                    <p className="text-gray-400 text-[11px] font-bold uppercase tracking-widest mt-2">Active at <span className="text-white">{upcomingAppointments[0].labId?.name}</span> on <span className="text-white">{new Date(upcomingAppointments[0].appointmentDate).toDateString()}</span></p>
                  </div>
                </div>
                <button onClick={() => { setSelectedBooking(upcomingAppointments[0]); setShowBookingModal(true) }} className="bg-white text-gray-900 px-10 py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-widest hover:bg-blue-50 transition-all flex items-center space-x-3">
                  <span>Operational Details</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10">
        {loading ? (
          <div className="col-span-full py-32 flex flex-col items-center">
            <Loader className="h-16 w-16 animate-spin text-blue-600" />
            <p className="mt-8 text-[11px] font-black text-gray-400 uppercase tracking-[0.3em]">Establishing Secure Connection...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="col-span-full py-40 bg-white rounded-[4rem] border border-dashed border-gray-200 flex flex-col items-center">
            <Calendar className="h-20 w-20 text-gray-100 mb-8" />
            <h3 className="text-xl font-black text-gray-900 uppercase">Archive Is Empty</h3>
            <p className="text-[11px] font-bold text-gray-300 uppercase tracking-widest mt-2">No active sequences found in this segment</p>
          </div>
        ) : (
          filteredBookings.map(renderBookingCard)
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-16 flex justify-center space-x-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setCurrentPage(p)}
              className={`h-12 w-12 rounded-2xl font-black text-[11px] transition-all ${currentPage === p ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Booking Details Modal - Overhauled */}
      <AnimatePresence>
        {showBookingModal && selectedBooking && (
          <div className="fixed inset-0 bg-gray-950/80 backdrop-blur-xl flex items-center justify-center z-[200] p-4 lg:p-10">
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="bg-white rounded-[4rem] w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl relative"
            >
              <button onClick={() => setShowBookingModal(false)} className="absolute top-8 right-8 h-12 w-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-all z-10"><XCircle className="h-6 w-6" /></button>

              <div className="p-12 overflow-y-auto space-y-12 custom-scrollbar">
                <div>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="h-2 w-10 bg-blue-600 rounded-full"></div>
                    <span className="text-[11px] font-black text-blue-600 uppercase tracking-[0.3em]">Operational Node: #{selectedBooking._id.slice(-12)}</span>
                  </div>
                  <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight">{selectedBooking.labId?.name}</h2>
                </div>

                <StatusTracker status={selectedBooking.status} />

                <div className="grid md:grid-cols-2 gap-10">
                  <div className="space-y-6">
                    <h4 className="text-[12px] font-black text-gray-900 uppercase tracking-widest flex items-center"><Calendar className="h-4 w-4 mr-3 text-blue-600" /> Dispatch Registry</h4>
                    <div className="p-8 bg-gray-50 rounded-[3rem] border border-gray-100 space-y-4">
                      <div className="flex justify-between">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Arrival Date</span>
                        <span className="text-[11px] font-black text-gray-900 uppercase">{new Date(selectedBooking.appointmentDate).toDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Time Window</span>
                        <span className="text-[11px] font-black text-gray-900 uppercase">{selectedBooking.appointmentTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-black text-gray-400 uppercase">Payment Strategy</span>
                        <span className="text-[11px] font-black text-blue-600 uppercase">{selectedBooking.paymentMethod === 'pay_now' ? 'Instant/Online' : 'On-Site Retrieval'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[12px] font-black text-gray-900 uppercase tracking-widest flex items-center"><Activity className="h-4 w-4 mr-3 text-blue-600" /> Diagnostic Profile</h4>
                    <div className="space-y-3">
                      {selectedBooking.selectedTests?.map((t, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-white rounded-3xl border border-gray-100 shadow-sm">
                          <div className="flex items-center space-x-3">
                            <TestTube className="h-4 w-4 text-gray-300" />
                            <span className="text-[11px] font-black text-gray-700 uppercase tracking-tight">{t.testName}</span>
                          </div>
                          <span className="text-[11px] font-black text-blue-600">₹{t.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-blue-600 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-[100px] opacity-10 -mr-32 -mt-32"></div>
                  <div className="flex items-center space-x-6">
                    <div className="h-16 w-16 bg-white/20 rounded-[2rem] flex items-center justify-center"><CreditCard className="h-8 w-8" /></div>
                    <div>
                      <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest mb-1">Total Sequence Cost</p>
                      <h3 className="text-3xl font-black">₹{selectedBooking.totalAmount}</h3>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className={`px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-widest border border-white/20 bg-white/10`}>{selectedBooking.paymentStatus}</div>
                    {canPayOnline(selectedBooking) && (
                      <button onClick={() => handlePayNow(selectedBooking)} className="bg-white text-blue-600 px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-50 transition-all">Settle Now</button>
                    )}
                  </div>
                </div>
              </div>

              {selectedBooking.status === 'pending' && (
                <div className="p-10 bg-gray-50 border-t border-gray-100 flex justify-center">
                  <button onClick={() => { setShowBookingModal(false); handleCancelBooking(selectedBooking) }} className="text-[10px] font-black text-red-400 uppercase tracking-widest hover:text-red-600 transition-colors flex items-center space-x-2">
                    <Trash2 className="h-4 w-4" /> <span>Abort Transaction</span>
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {activeChat && <ChatWidget bookingId={activeChat.id} labName={activeChat.labName} onClose={() => setActiveChat(null)} />}
    </div>
  )
}

export default MyBookings
