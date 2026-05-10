import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {
  MapPin, Clock, Phone, Mail, Calendar, Search, Loader, AlertCircle, CheckCircle,
  Building2, Navigation, Filter, ChevronRight, X, FlaskConical, Package, ArrowLeft,
  ShieldCheck, CreditCard, Wallet, MessageSquare, Info, Star, ChevronDown, MoveRight,
  Activity
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Swal from 'sweetalert2'
import api from '../services/api'

const { labAPI, testAPI, packageAPI, bookingAPI } = api

const BookTests = () => {
  const navigate = useNavigate()
  // Location and labs state
  const [userLocation, setUserLocation] = useState(null)
  const [locationError, setLocationError] = useState('')
  const [labs, setLabs] = useState([])
  const [nearbyLabs, setNearbyLabs] = useState([])
  const [allLabs, setAllLabs] = useState([])

  // Selection states
  const [selectedLab, setSelectedLab] = useState(null)
  const [selectedTests, setSelectedTests] = useState([])
  const [selectedPackages, setSelectedPackages] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [notes, setNotes] = useState('')

  // UI states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAllLabs, setShowAllLabs] = useState(false)
  const [bookingStep, setBookingStep] = useState(1) // 1 to 5
  const [recommendedTestName, setRecommendedTestName] = useState('')

  const [searchParams] = useSearchParams()
  useEffect(() => {
    const testParam = searchParams.get('test')
    if (testParam) {
      setRecommendedTestName(testParam)
      setShowAllLabs(true)
    }
  }, [searchParams])

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ]

  const getAvailableTimeSlots = () => {
    if (!selectedDate) return timeSlots
    const today = new Date()
    const selectedDateObj = new Date(selectedDate)
    const currentTime = new Date()

    if (selectedDateObj.toDateString() === today.toDateString()) {
      const currentHour = currentTime.getHours()
      const currentMinute = currentTime.getMinutes()
      return timeSlots.filter(timeSlot => {
        const [hour, minute] = timeSlot.split(':').map(Number)
        const slotTime = hour * 60 + minute
        const bufferTime = currentHour * 60 + currentMinute + 30
        return slotTime >= bufferTime
      })
    }
    return timeSlots
  }

  useEffect(() => {
    getCurrentLocation()
    fetchLabs()
  }, [])

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation Protocol Not Supported')
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ latitude, longitude })
        setLocationError('')
        setLoading(false)
      },
      (error) => {
        setLocationError('GPS Access Restricted. Showing universal results.')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 600000 }
    )
  }

  const fetchLabs = async () => {
    try {
      setLoading(true)
      const response = await labAPI.getLabs()
      const allLabsData = response.data || []
      setAllLabs(allLabsData)

      if (userLocation) {
        const labsWithDistance = allLabsData.map(lab => ({
          ...lab,
          distance: calculateDistance(userLocation, lab)
        }))
        const sortedLabs = labsWithDistance.sort((a, b) => a.distance - b.distance)
        setLabs(sortedLabs)
        setNearbyLabs(sortedLabs.slice(0, 5))
      } else {
        setLabs(allLabsData)
        setNearbyLabs(allLabsData.slice(0, 5))
      }
    } catch (err) {
      setError('System Integrity Error: Failed to retrieve lab directory')
    } finally {
      setLoading(false)
    }
  }

  const fetchLabDetails = async (lab) => {
    try {
      setLoading(true)
      const response = await labAPI.getLab(lab._id)
      const fullLabData = response.data

      let availableTests = (fullLabData.availableTests || []).filter(t => typeof t === 'object' && t._id)
      let availablePackages = (fullLabData.availablePackages || []).filter(p => typeof p === 'object' && p._id)

      const updatedLab = {
        ...fullLabData,
        availableTestsDetails: availableTests,
        availablePackagesDetails: availablePackages
      }
      setSelectedLab(updatedLab)

      if (recommendedTestName && availableTests.length > 0) {
        const matchingTest = availableTests.find(t =>
          t.name.toLowerCase().includes(recommendedTestName.toLowerCase())
        )
        if (matchingTest) setSelectedTests([matchingTest._id])
      }
    } catch (err) {
      setError('Detailed Node Access Failed')
    } finally {
      setLoading(false)
    }
  }

  const calculateDistance = (userLoc, lab) => {
    if (!userLoc || !lab.location || lab.location.lat === 0) return Infinity
    const R = 6371
    const dLat = (lab.location.lat - userLoc.latitude) * Math.PI / 180
    const dLon = (lab.location.lng - userLoc.longitude) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLoc.latitude * Math.PI / 180) * Math.cos(lab.location.lat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return Math.round(R * c * 10) / 10
  }

  const handleDateChange = (date) => {
    setSelectedDate(date)
    setSelectedTime('') // Reset time slot when date changes
  }

  const handleLabSelection = async (lab) => {
    setSelectedTests([])
    setSelectedPackages([])
    setBookingStep(2)
    await fetchLabDetails(lab)
  }

  const toggleTestSelection = (testId) => {
    setSelectedTests(prev => prev.includes(testId) ? prev.filter(id => id !== testId) : [...prev, testId])
  }

  const togglePackageSelection = (packageId) => {
    setSelectedPackages(prev => prev.includes(packageId) ? prev.filter(id => id !== packageId) : [...prev, packageId])
  }

  const handleBooking = async () => {
    if (!selectedLab || (!selectedTests.length && !selectedPackages.length)) return
    try {
      setLoading(true)
      const bookingData = {
        labId: selectedLab._id,
        selectedTests: selectedLab.availableTestsDetails?.filter(t => selectedTests.includes(t._id)).map(t => ({ testId: t._id, testName: t.name, price: t.price })) || [],
        selectedPackages: selectedLab.availablePackagesDetails?.filter(p => selectedPackages.includes(p._id)).map(p => ({ packageId: p._id, packageName: p.name, price: p.price })) || [],
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        paymentMethod,
        notes: notes.trim(),
        userLocation
      }
      const response = await bookingAPI.createBooking(bookingData)
      if (paymentMethod === 'pay_now') {
        await showBillPopup(response.data)
      } else {
        await Swal.fire({
          icon: 'success',
          title: 'Booking Confirmed!',
          text: `Scheduled for ${selectedDate} at ${selectedTime}.`,
          confirmButtonColor: '#2563eb'
        })
        navigate('/user/dashboard/bookings')
      }
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Critical Error', text: err.message, confirmButtonColor: '#2563eb' })
    } finally {
      setLoading(false)
    }
  }

  const showBillPopup = async (booking) => {
    const totalAmount = booking.totalAmount || 0
    const testItems = selectedLab.availableTestsDetails?.filter(t => selectedTests.includes(t._id)) || []
    const packageItems = selectedLab.availablePackagesDetails?.filter(p => selectedPackages.includes(p._id)) || []

    const result = await Swal.fire({
      title: 'Clinical Invoice Summary',
      html: `
        <div class="text-left font-sans p-2">
          <div class="mb-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
             <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Clinic Center</p>
             <h4 class="font-black text-gray-900 uppercase">${selectedLab.name}</h4>
             <p class="text-[11px] font-bold text-blue-600 mt-1 uppercase">${formatDate(selectedDate)} @ ${selectedTime}</p>
          </div>
          <div class="space-y-3 mb-6">
             ${testItems.map(t => `
               <div class="flex justify-between items-center text-[12px] font-bold">
                  <span class="text-gray-500 uppercase tracking-tight">${t.name}</span>
                  <span class="text-gray-900 font-black">₹${t.price}</span>
               </div>
             `).join('')}
             ${packageItems.map(p => `
               <div class="flex justify-between items-center text-[12px] font-bold">
                  <span class="text-gray-500 uppercase tracking-tight">${p.name} (Pkg)</span>
                  <span class="text-gray-900 font-black">₹${p.price}</span>
               </div>
             `).join('')}
          </div>
          <div class="border-t-2 border-dashed border-gray-200 pt-4 mt-4 flex justify-between items-center">
             <span class="text-[14px] font-black text-gray-900 uppercase">Total Clinical Fees</span>
             <span class="text-xl font-black text-blue-600">₹${totalAmount}</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Authorize Payment',
      cancelButtonText: 'Review Selection',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#94a3b8',
      width: '450px',
      customClass: { popup: 'rounded-[3rem]' }
    })

    if (result.isConfirmed) await handleRazorpayPayment(booking)
    else resetBookingForm()
  }

  const handleRazorpayPayment = async (booking) => {
    try {
      const orderResponse = await bookingAPI.createOrder(booking._id)
      const orderData = orderResponse.data
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => {
        const options = {
          key: 'rzp_test_R79jO6N4F99QLG',
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'LabMate360 Clinical',
          order_id: orderData.orderId,
          handler: async function (response) {
            try {
              await bookingAPI.processPayment(booking._id, {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })
              await Swal.fire({ icon: 'success', title: 'Payment Secured', text: 'Diagnostic sequence confirmed.', confirmButtonColor: '#2563eb' })
              navigate('/user/dashboard/bookings')
            } catch (err) {
              Swal.fire({ icon: 'error', title: 'Transaction Failed', text: err.message, confirmButtonColor: '#2563eb' })
            }
          },
          theme: { color: '#2563eb' }
        }
        const rzp = new window.Razorpay(options)
        rzp.open()
      }
      document.body.appendChild(script)
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Gateway Access Denied', text: err.message, confirmButtonColor: '#2563eb' })
    }
  }

  const resetBookingForm = () => {
    setSelectedLab(null); setSelectedTests([]); setSelectedPackages([])
    setSelectedDate(''); setSelectedTime(''); setPaymentMethod(''); setNotes('')
    setBookingStep(1)
  }

  const filteredLabs = (showAllLabs ? labs : nearbyLabs).filter(lab => {
    const searchLower = searchTerm.toLowerCase()
    const name = lab.name.toLowerCase()
    const addr = (typeof lab.address === 'string' ? lab.address : `${lab.address.street} ${lab.address.city}`).toLowerCase()
    return name.includes(searchLower) || addr.includes(searchLower)
  })

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath
    return `${import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000'}/${imagePath.replace(/\\/g, '/').replace(/^\//, '')}`
  }

  const renderLabCard = (lab) => {
    const addr = typeof lab.address === 'string' ? JSON.parse(lab.address) : lab.address
    const contact = typeof lab.contact === 'string' ? JSON.parse(lab.contact) : lab.contact

    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={lab._id}
        className="bg-white rounded-[3rem] shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 overflow-hidden group flex flex-col"
      >
        <div className="p-8 flex-1">
          <div className="flex items-start justify-between mb-8">
            <div className="h-16 w-16 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
              <Building2 className="h-8 w-8" />
            </div>
            {lab.distance && (
              <div className="flex items-center text-[10px] font-black text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full uppercase tracking-widest border border-blue-100">
                <Navigation className="h-3 w-3 mr-1.5" />
                {lab.distance} KM Proximal
              </div>
            )}
          </div>

          <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors mb-2">{lab.name}</h3>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest flex items-center line-clamp-2 min-h-[2.5rem]">
            <MapPin className="h-3 w-3 mr-2 flex-shrink-0 text-gray-300" />
            {addr.street}, {addr.city}
          </p>

          <div className="mt-8 pt-8 border-t border-gray-50 grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Tests</span>
              <span className="text-[12px] font-black text-gray-900 uppercase tracking-tight">{lab.availableTests?.length || 0} Lines</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Packages</span>
              <span className="text-[12px] font-black text-gray-900 uppercase tracking-tight">{lab.availablePackages?.length || 0} Active</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => handleLabSelection(lab)}
          className="w-full bg-gray-50 group-hover:bg-blue-600 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 group-hover:text-white transition-all flex items-center justify-center space-x-3"
        >
          <span>Book Now</span>
          <MoveRight className="h-4 w-4 group-hover:translate-x-2 transition-transform" />
        </button>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Dynamic Header */}
      <div className="mb-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div>
            <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-xl mb-4 border border-blue-100">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Medical Facilities</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter uppercase underline decoration-blue-100 decoration-8 underline-offset-8">Diagnostic Hub</h1>
            <p className="text-gray-400 font-bold mt-6 uppercase tracking-[0.2em] text-[11px]">Book tests across our network of accredited laboratories</p>
          </div>

          {/* Enhanced Step Indicator */}
          <div className="flex items-center bg-white p-2 rounded-[2rem] border border-gray-100 shadow-sm">
            {[1, 2, 3, 4, 5].map((s) => (
              <div key={s} className="flex items-center">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center text-[12px] font-black transition-all ${bookingStep === s ? 'bg-blue-600 text-white shadow-xl shadow-blue-200' : bookingStep > s ? 'bg-green-100 text-green-600' : 'text-gray-300'}`}>
                  {bookingStep > s ? <CheckCircle className="h-5 w-5" /> : s}
                </div>
                {s < 5 && <div className="w-4 h-[2px] bg-gray-100 mx-1"></div>}
              </div>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: LAB DIRECTORY */}
          {bookingStep === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="bg-white rounded-[3.5rem] p-10 border border-gray-100 shadow-sm mb-12 flex flex-col md:flex-row gap-6">
                <div className="relative flex-1 group">
                  <Search className="h-5 w-5 absolute left-8 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="text"
                    placeholder="IDENTIFY FACILITY BY NAME OR POSTAL CODE..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-16 pr-8 py-6 bg-gray-50 border-none rounded-[2rem] text-[11px] font-black tracking-widest placeholder:text-gray-300 focus:ring-4 focus:ring-blue-50 focus:bg-white transition-all uppercase"
                  />
                </div>
                <button
                  onClick={() => setShowAllLabs(!showAllLabs)}
                  className={`px-10 py-6 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center ${showAllLabs ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-white border border-gray-100 text-gray-400 hover:bg-gray-50'}`}
                >
                  <Filter className="h-4 w-4 mr-3" />
                  {showAllLabs ? 'Global Index' : 'Proximity Filter'}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
                {filteredLabs.map(renderLabCard)}
              </div>
            </motion.div>
          )}

          {/* STEP 2: TEST MATRIX */}
          {bookingStep === 2 && selectedLab && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="flex flex-col lg:flex-row gap-10">
                <div className="lg:w-1/3">
                  <div className="bg-white rounded-[3.5rem] p-10 border border-gray-100 shadow-sm sticky top-10">
                    <div className="h-16 w-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white mb-8 shadow-xl shadow-blue-100"><FlaskConical className="h-8 w-8" /></div>
                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight mb-2">{selectedLab.name}</h2>
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-10 leading-relaxed">{selectedLab.description || 'Verified diagnostic facility specializing in clinical pathology.'}</p>

                    <div className="space-y-4 mb-10">
                      <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 flex items-center space-x-4">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight">Accredited Base Unit</span>
                      </div>
                      <div className="p-5 bg-gray-50 rounded-3xl border border-gray-100 flex items-center space-x-4">
                        <Star className="h-5 w-5 text-orange-500" />
                        <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight">4.9 Clinical Rating</span>
                      </div>
                    </div>

                    <button
                      onClick={() => setBookingStep(1)}
                      className="w-full py-5 border border-gray-100 rounded-[2rem] text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] hover:bg-gray-50 transition-all flex items-center justify-center space-x-2"
                    >
                      <ArrowLeft className="h-4 w-4" /> <span>Switch Facility</span>
                    </button>
                  </div>
                </div>

                <div className="lg:w-2/3 space-y-12">
                  {/* Search inside tests? Maybe later. Let's just list nicely */}
                  <div className="space-y-6">
                    <h3 className="text-[14px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center px-6">
                      <Info className="h-4 w-4 mr-3 text-blue-600" /> Diagnostic Inventory
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {selectedLab.availableTestsDetails?.map(test => (
                        <div
                          key={test._id}
                          onClick={() => toggleTestSelection(test._id)}
                          className={`p-8 rounded-[3rem] border transition-all cursor-pointer flex flex-col justify-between min-h-[280px] group ${selectedTests.includes(test._id) ? 'bg-blue-600 border-blue-600 shadow-2xl shadow-blue-200' : 'bg-white border-gray-100 hover:border-blue-200 shadow-sm'}`}
                        >
                          <div>
                            <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-6 transition-colors ${selectedTests.includes(test._id) ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'}`}>
                              <Activity className="h-6 w-6" />
                            </div>
                            <h4 className={`text-lg font-black uppercase tracking-tight mb-2 transition-colors ${selectedTests.includes(test._id) ? 'text-white' : 'text-gray-900'}`}>{test.name}</h4>
                            <p className={`text-[10px] font-bold uppercase tracking-widest leading-relaxed line-clamp-2 ${selectedTests.includes(test._id) ? 'text-blue-100' : 'text-gray-400'}`}>{test.description || 'Advanced clinical screening protocol.'}</p>
                          </div>
                          <div className="mt-8 flex items-center justify-between">
                            <span className={`text-xl font-black ${selectedTests.includes(test._id) ? 'text-white' : 'text-blue-600'}`}>₹{test.price}</span>
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all ${selectedTests.includes(test._id) ? 'bg-white text-blue-600 rotate-0' : 'bg-gray-50 text-gray-300'}`}>
                              {selectedTests.includes(test._id) ? <CheckCircle className="h-5 w-5" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedLab.availablePackagesDetails?.length > 0 && (
                    <div className="space-y-6 pt-10">
                      <h3 className="text-[14px] font-black text-gray-900 uppercase tracking-[0.3em] flex items-center px-6">
                        <Package className="h-4 w-4 mr-3 text-orange-600" /> Comprehensive Packages
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {selectedLab.availablePackagesDetails.map(pkg => (
                          <div
                            key={pkg._id}
                            onClick={() => togglePackageSelection(pkg._id)}
                            className={`p-10 rounded-[4rem] border transition-all cursor-pointer relative overflow-hidden group ${selectedPackages.includes(pkg._id) ? 'bg-gray-950 border-gray-950 shadow-2xl' : 'bg-white border-gray-100 hover:border-orange-200'}`}
                          >
                            <div className="relative z-10">
                              <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-3 py-1.5 rounded-full uppercase tracking-widest mb-6 inline-block">Pro Health Packages</span>
                              <h4 className={`text-xl font-black uppercase tracking-tight mb-4 ${selectedPackages.includes(pkg._id) ? 'text-white' : 'text-gray-900'}`}>{pkg.name}</h4>
                              <div className="space-y-2 mb-10">
                                {pkg.selectedTests?.slice(0, 3).map((t, idx) => (
                                  <div key={idx} className="flex items-center space-x-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-400"></div>
                                    <span className={`text-[10px] font-black uppercase tracking-tight ${selectedPackages.includes(pkg._id) ? 'text-gray-400' : 'text-gray-500'}`}>{t.name}</span>
                                  </div>
                                ))}
                                {pkg.selectedTests?.length > 3 && <p className="text-[9px] font-black text-blue-400 uppercase ml-4">+ {pkg.selectedTests.length - 3} More Components</p>}
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <span className={`text-2xl font-black ${selectedPackages.includes(pkg._id) ? 'text-white' : 'text-gray-900'}`}>₹{pkg.price}</span>
                                  {pkg.discount > 0 && <span className="text-[9px] font-black text-green-500 uppercase tracking-[0.2em]">{pkg.discount}% Savings Locked</span>}
                                </div>
                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center transition-all ${selectedPackages.includes(pkg._id) ? 'bg-orange-600 text-white' : 'bg-gray-50 text-gray-300'}`}>
                                  <CheckCircle className="h-6 w-6" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Sticky Status Bar */}
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 w-[90%] max-w-5xl bg-white/90 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-[3rem] p-6 z-[100] flex flex-col md:flex-row items-center justify-between gap-6 px-12">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1"> Load</span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-16 bg-blue-100 rounded-full overflow-hidden"><div className="h-full w-2/3 bg-blue-600 rounded-full"></div></div>
                      <span className="text-[10px] font-black text-gray-900 uppercase">Moderate</span>
                    </div>
                  </div>
                  <div className="h-10 w-[1px] bg-gray-100 hidden md:block"></div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total</span>
                    <span className="text-xl font-black text-blue-600 uppercase tracking-tight">₹{(selectedLab.availableTestsDetails?.filter(t => selectedTests.includes(t._id)).reduce((s, t) => s + t.price, 0) || 0) + (selectedLab.availablePackagesDetails?.filter(p => selectedPackages.includes(p._id)).reduce((s, p) => s + p.price, 0) || 0)}</span>
                  </div>
                </div>
                <button
                  onClick={() => setBookingStep(3)}
                  disabled={!selectedTests.length && !selectedPackages.length}
                  className="bg-blue-600 text-white px-12 py-5 rounded-[2rem] font-black text-[12px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 disabled:opacity-40 disabled:shadow-none flex items-center space-x-3"
                >
                  <span>Secure Appointment</span>
                  <MoveRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: TEMPORAL SYNC (Scheduling) */}
          {bookingStep === 3 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
              <div className="bg-white rounded-[4rem] p-12 border border-gray-100 shadow-xl">
                <div className="flex items-center space-x-6 mb-12">
                  <div className="h-16 w-16 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600"><Calendar className="h-8 w-8" /></div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Select your Time slot</h2>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Select your arrival time</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-12">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 block px-2"> Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => handleDateChange(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-8 bg-gray-50 border-none rounded-[2.5rem] font-black text-gray-900 tracking-widest text-[14px] focus:ring-4 focus:ring-blue-50 focus:bg-white transition-all uppercase"
                    />
                    <div className="mt-6 p-6 bg-blue-50/50 rounded-3xl border border-blue-50 flex items-start space-x-4">
                      <Info className="h-5 w-5 text-blue-400 mt-0.5" />
                      <p className="text-[10px] font-bold text-blue-600/60 uppercase leading-relaxed tracking-wider">Note: Selected faculty operates on a dynamic queue system. Priority confirmed for scheduled windows.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-2">Availability Slots</label>
                    <div className="grid grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {getAvailableTimeSlots().map(time => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-4 rounded-2xl text-[11px] font-black transition-all border ${selectedTime === time ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200'}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                    {selectedDate && getAvailableTimeSlots().length === 0 && (
                      <p className="p-4 bg-red-50 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-2xl text-center">Schedule Capacity Exceeded For Selected Date</p>
                    )}
                  </div>
                </div>

                <div className="mt-16 pt-12 border-t border-gray-50 flex justify-between items-center">
                  <button onClick={() => setBookingStep(2)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors uppercase">Return to tests</button>
                  <button
                    onClick={() => setBookingStep(4)}
                    disabled={!selectedDate || !selectedTime}
                    className="bg-gray-950 text-white px-12 py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all disabled:opacity-30 disabled:shadow-none flex items-center space-x-3"
                  >
                    <span>Confirm Slot</span>
                    <MoveRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: PROTOCOL SELECTION (Payment) */}
          {bookingStep === 4 && (
            <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto space-y-10">
              <div className="bg-white rounded-[4rem] p-12 border border-gray-100 shadow-xl">
                <div className="flex items-center space-x-6 mb-12">
                  <div className="h-16 w-16 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600"><CreditCard className="h-8 w-8" /></div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tight">Payment Method</h2>
                    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1">Select payment method</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-12">
                  <div
                    onClick={() => setPaymentMethod('pay_now')}
                    className={`p-10 rounded-[3rem] border transition-all cursor-pointer group relative overflow-hidden ${paymentMethod === 'pay_now' ? 'bg-blue-600 border-blue-600 shadow-2xl shadow-blue-200 text-white' : 'bg-white border-gray-100 hover:border-blue-200 shadow-sm'}`}
                  >
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-10 ${paymentMethod === 'pay_now' ? 'bg-white/20' : 'bg-gray-50 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors'}`}>
                      <Wallet className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Pay Now</h3>
                    <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${paymentMethod === 'pay_now' ? 'text-blue-100' : 'text-gray-400'}`}>Highly Secured Razorpay Integration</p>
                    {paymentMethod === 'pay_now' && <div className="absolute top-6 right-6"><CheckCircle className="h-6 w-6 text-white" /></div>}
                  </div>

                  <div
                    onClick={() => setPaymentMethod('pay_later')}
                    className={`p-10 rounded-[3rem] border transition-all cursor-pointer group relative overflow-hidden ${paymentMethod === 'pay_later' ? 'bg-gray-950 border-gray-950 shadow-2xl shadow-gray-200 text-white' : 'bg-white border-gray-100 hover:border-gray-200 shadow-sm'}`}
                  >
                    <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mb-10 ${paymentMethod === 'pay_later' ? 'bg-white/20' : 'bg-gray-50 group-hover:bg-gray-100 transition-colors'}`}>
                      <MapPin className="h-7 w-7" />
                    </div>
                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Pay  Later</h3>
                    <p className={`text-[10px] font-black uppercase tracking-[0.15em] ${paymentMethod === 'pay_later' ? 'text-gray-400' : 'text-gray-400'}`}>Finalize at Diagnostic Center</p>
                    {paymentMethod === 'pay_later' && <div className="absolute top-6 right-6"><CheckCircle className="h-6 w-6 text-blue-400" /></div>}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block px-2">Clinical Directives (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="SPECIFY ANY FASTING STATUS OR SYMPTOMS FOR RECORD..."
                    className="w-full p-8 bg-gray-50 border-none rounded-[2.5rem] font-black text-gray-900 tracking-widest text-[12px] focus:ring-4 focus:ring-blue-50 focus:bg-white transition-all uppercase placeholder:text-gray-200"
                  />
                </div>

                <div className="mt-16 pt-12 border-t border-gray-50 flex justify-between items-center">
                  <button onClick={() => setBookingStep(3)} className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors uppercase text-md">Return to Scheduling</button>
                  <button
                    onClick={() => setBookingStep(5)}
                    disabled={!paymentMethod}
                    className="bg-blue-600 text-white px-12 py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-30 disabled:shadow-none flex items-center space-x-3"
                  >
                    <span>Finalize</span>
                    <MoveRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: FINAL CONFIRMATION */}
          {bookingStep === 5 && selectedLab && (
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
              <div className="bg-gray-950 rounded-[5rem] p-16 text-white text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[120px] opacity-20 -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-green-600 rounded-full blur-[120px] opacity-10 -ml-32 -mb-32"></div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className="h-24 w-24 bg-blue-600 rounded-[3rem] flex items-center justify-center mb-10 shadow-2xl shadow-blue-500/40"><ShieldCheck className="h-12 w-12" /></div>
                  <h2 className="text-4xl font-black uppercase tracking-tight mb-4">Verification</h2>
                  <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[11px] mb-16">Review your diagnostic session details</p>

                  <div className="w-full grid md:grid-cols-2 gap-8 text-left mb-16">
                    <div className="p-10 bg-white/5 rounded-[4rem] border border-white/10 backdrop-blur-md">
                      <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-4 block">Medical Target</span>
                      <h4 className="text-xl font-black uppercase tracking-tight text-white mb-2">{selectedLab.name}</h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] leading-relaxed">{formatDate(selectedDate)} at {selectedTime}</p>
                    </div>
                    <div className="p-10 bg-white/5 rounded-[4rem] border border-white/10 backdrop-blur-md flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-black text-green-400 uppercase tracking-widest mb-4 block">Clinical Fees</span>
                        <h4 className="text-3xl font-black text-white">₹{(selectedLab.availableTestsDetails?.filter(t => selectedTests.includes(t._id)).reduce((s, t) => s + t.price, 0) || 0) + (selectedLab.availablePackagesDetails?.filter(p => selectedPackages.includes(p._id)).reduce((s, p) => s + p.price, 0) || 0)}</h4>
                      </div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-4">Method: {paymentMethod === 'pay_now' ? 'Instant/Razorpay' : 'On-Site/Pending'}</p>
                    </div>
                  </div>

                  <div className="w-full flex flex-col md:flex-row gap-4">
                    <button onClick={() => setBookingStep(4)} className="flex-1 py-7 border border-white/20 rounded-[2.5rem] font-black text-[11px] uppercase tracking-widest hover:bg-white/5 transition-all">Choose another method</button>
                    <button
                      onClick={handleBooking}
                      disabled={loading}
                      className="flex-[2] py-7 bg-blue-600 rounded-[2.5rem] font-black text-[12px] uppercase tracking-[0.3em] text-white hover:bg-blue-700 transition-all shadow-2xl flex items-center justify-center space-x-4"
                    >
                      {loading ? <Loader className="h-6 w-6 animate-spin" /> : <><CheckCircle className="h-6 w-6" /> <span>Confirm Booking</span></>}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default BookTests
