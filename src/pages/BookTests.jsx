import { useState, useEffect } from 'react'
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Calendar,
  Search,
  Loader,
  AlertCircle,
  CheckCircle,
  Building2,
  Navigation,
  Filter,
  ChevronRight,
  X,
  FlaskConical,
  Package,
  ArrowLeft
} from 'lucide-react'
import Swal from 'sweetalert2'
import api from '../services/api'

const { labAPI, testAPI, packageAPI, bookingAPI } = api

const BookTests = () => {
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
  const [bookingStep, setBookingStep] = useState(1) // 1: Lab Selection, 2: Test Selection, 3: Schedule, 4: Payment, 5: Confirm

  // Available time slots
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
    '16:00', '16:30', '17:00', '17:30'
  ]

  // Get available time slots based on selected date
  const getAvailableTimeSlots = () => {
    if (!selectedDate) return timeSlots

    const today = new Date()
    const selectedDateObj = new Date(selectedDate)
    const currentTime = new Date()

    // If selected date is today, filter out past times
    if (selectedDateObj.toDateString() === today.toDateString()) {
      const currentHour = currentTime.getHours()
      const currentMinute = currentTime.getMinutes()
      const currentTimeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`

      return timeSlots.filter(timeSlot => {
        // Add 30 minutes buffer to current time to allow for booking
        const [hour, minute] = timeSlot.split(':').map(Number)
        const slotTime = hour * 60 + minute
        const bufferTime = currentHour * 60 + currentMinute + 30

        return slotTime >= bufferTime
      })
    }

    // For future dates, return all time slots
    return timeSlots
  }

  useEffect(() => {
    getCurrentLocation()
    fetchLabs()
  }, [])

  // Get user's current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser')
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
        console.error('Error getting location:', error)
        setLocationError('Unable to get your location. Please enable location access.')
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000
      }
    )
  }

  // Fetch all labs
  const fetchLabs = async () => {
    try {
      setLoading(true)
      const response = await labAPI.getLabs()
      const allLabsData = response.data || []

      // Debug: Log the labs data structure
      console.log('Fetched labs data:', allLabsData)
      if (allLabsData.length > 0) {
        console.log('First lab structure:', allLabsData[0])
        console.log('First lab availableTests:', allLabsData[0].availableTests)
        console.log('First lab availablePackages:', allLabsData[0].availablePackages)
      }

      setAllLabs(allLabsData)

      // Calculate distances and sort by proximity if location is available
      if (userLocation) {
        const labsWithDistance = allLabsData.map(lab => ({
          ...lab,
          distance: calculateDistance(userLocation, lab)
        }))
        const sortedLabs = labsWithDistance.sort((a, b) => a.distance - b.distance)
        setLabs(sortedLabs)
        setNearbyLabs(sortedLabs.slice(0, 5)) // Show top 5 nearby labs
      } else {
        setLabs(allLabsData)
        setNearbyLabs(allLabsData.slice(0, 5))
      }
    } catch (err) {
      setError('Failed to fetch labs')
      console.error('Error fetching labs:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch tests and packages for selected lab
  const fetchLabDetails = async (lab) => {
    try {
      setLoading(true)

      // Debug: Log the lab data structure
      console.log('Selected lab data:', lab)
      console.log('Available tests:', lab.availableTests)
      console.log('Available packages:', lab.availablePackages)

      // The lab data already contains populated test and package objects
      // We just need to extract them properly
      let availableTests = []
      let availablePackages = []

      // Handle availableTests - could be populated objects or just IDs
      if (lab.availableTests && lab.availableTests.length > 0) {
        availableTests = lab.availableTests.map(test => {
          // If test is already a populated object, use it directly
          if (typeof test === 'object' && test._id) {
            return test
          }
          // If test is just an ID, we'd need to fetch the full test data
          // But since the backend should populate it, this shouldn't happen
          return test
        }).filter(test => test && typeof test === 'object')
      }

      // Handle availablePackages - could be populated objects or just IDs
      if (lab.availablePackages && lab.availablePackages.length > 0) {
        availablePackages = lab.availablePackages.map(packageItem => {
          // If package is already a populated object, use it directly
          if (typeof packageItem === 'object' && packageItem._id) {
            return packageItem
          }
          // If package is just an ID, we'd need to fetch the full package data
          // But since the backend should populate it, this shouldn't happen
          return packageItem
        }).filter(packageItem => packageItem && typeof packageItem === 'object')
      }

      // Debug: Log processed data
      console.log('Processed available tests:', availableTests)
      console.log('Processed available packages:', availablePackages)

      // Update the selected lab with detailed test and package information
      const updatedLab = {
        ...lab,
        availableTestsDetails: availableTests,
        availablePackagesDetails: availablePackages
      }

      console.log('Updated lab with details:', updatedLab)
      setSelectedLab(updatedLab)
    } catch (err) {
      setError('Failed to fetch lab details')
      console.error('Error fetching lab details:', err)
    } finally {
      setLoading(false)
    }
  }

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (userLoc, lab) => {
    if (!userLoc || !lab.address) return Infinity

    try {
      // Parse lab address if it's a string
      let labAddress = lab.address
      if (typeof lab.address === 'string') {
        labAddress = JSON.parse(lab.address)
      }

      // For demo purposes, we'll use a simple distance calculation
      // In a real app, you'd use the lab's actual coordinates
      const R = 6371 // Earth's radius in km
      const dLat = (0 - userLoc.latitude) * Math.PI / 180
      const dLon = (0 - userLoc.longitude) * Math.PI / 180
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(userLoc.latitude * Math.PI / 180) * Math.cos(0 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distance = R * c

      return Math.round(distance * 10) / 10 // Round to 1 decimal place
    } catch (error) {
      return Infinity
    }
  }

  // Handle lab selection
  const handleLabSelection = async (lab) => {
    setSelectedTests([])
    setSelectedPackages([])
    setBookingStep(2)
    await fetchLabDetails(lab)
  }

  // Toggle test selection
  const toggleTestSelection = (testId) => {
    setSelectedTests(prev =>
      prev.includes(testId)
        ? prev.filter(id => id !== testId)
        : [...prev, testId]
    )
  }

  // Toggle package selection
  const togglePackageSelection = (packageId) => {
    setSelectedPackages(prev =>
      prev.includes(packageId)
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    )
  }

  // Handle booking submission
  const handleBooking = async () => {
    if (!selectedLab || (!selectedTests.length && !selectedPackages.length)) {
      Swal.fire({
        icon: 'warning',
        title: 'Selection Required',
        text: 'Please select at least one test or package',
        confirmButtonColor: '#2563eb'
      })
      return
    }

    if (!selectedDate || !selectedTime) {
      Swal.fire({
        icon: 'warning',
        title: 'Schedule Required',
        text: 'Please select date and time for your appointment',
        confirmButtonColor: '#2563eb'
      })
      return
    }

    if (!paymentMethod) {
      Swal.fire({
        icon: 'warning',
        title: 'Payment Method Required',
        text: 'Please select a payment method',
        confirmButtonColor: '#2563eb'
      })
      return
    }

    try {
      setLoading(true)

      // Prepare test and package data for API
      const selectedTestsData = selectedLab.availableTestsDetails
        ?.filter(test => selectedTests.includes(test._id))
        .map(test => ({
          testId: test._id,
          testName: test.name,
          price: test.price
        })) || []

      const selectedPackagesData = selectedLab.availablePackagesDetails
        ?.filter(packageItem => selectedPackages.includes(packageItem._id))
        .map(packageItem => ({
          packageId: packageItem._id,
          packageName: packageItem.name,
          price: packageItem.price
        })) || []

      // Create booking data
      const bookingData = {
        labId: selectedLab._id,
        selectedTests: selectedTestsData,
        selectedPackages: selectedPackagesData,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        paymentMethod,
        notes: notes.trim(),
        userLocation: userLocation
      }

      console.log('Creating booking with data:', bookingData)

      // Create booking
      const response = await bookingAPI.createBooking(bookingData)

      console.log('Booking response:', response)

      if (paymentMethod === 'pay_now') {
        // Show bill information popup before Razorpay
        await showBillPopup(response.data)
      } else {
        // Pay later - booking confirmed
        await Swal.fire({
          icon: 'success',
          title: 'Booking Confirmed!',
          text: `Your appointment at ${selectedLab.name} has been scheduled for ${selectedDate} at ${selectedTime}. Payment due at the lab.`,
          confirmButtonColor: '#2563eb',
          confirmButtonText: 'OK'
        })

        // Reset form
        resetBookingForm()
      }

    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Booking Failed',
        text: err.message || 'Failed to create booking',
        confirmButtonColor: '#dc2626'
      })
    } finally {
      setLoading(false)
    }
  }

  // Show bill information popup
  const showBillPopup = async (booking) => {
    const totalAmount = booking.totalAmount || 0

    // Calculate selected items for display
    const selectedTestsData = selectedLab.availableTestsDetails
      ?.filter(test => selectedTests.includes(test._id)) || []
    const selectedPackagesData = selectedLab.availablePackagesDetails
      ?.filter(packageItem => selectedPackages.includes(packageItem._id)) || []

    const result = await Swal.fire({
      title: 'Payment Summary',
      html: `
        <div class="text-left">
          <div class="mb-4">
            <h4 class="font-semibold text-gray-900 mb-2">Lab: ${selectedLab.name}</h4>
            <p class="text-sm text-gray-600">Appointment: ${formatDate(selectedDate)} at ${selectedTime}</p>
          </div>
          
          ${selectedTestsData.length > 0 ? `
            <div class="mb-3">
              <h5 class="font-medium text-gray-800">Tests (${selectedTestsData.length})</h5>
              <div class="ml-2 space-y-1">
                ${selectedTestsData.map(test => `
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">${test.name}</span>
                    <span class="text-gray-900">₹${test.price}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          ${selectedPackagesData.length > 0 ? `
            <div class="mb-3">
              <h5 class="font-medium text-gray-800">Packages (${selectedPackagesData.length})</h5>
              <div class="ml-2 space-y-1">
                ${selectedPackagesData.map(packageItem => `
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">${packageItem.name}</span>
                    <span class="text-gray-900">₹${packageItem.price}</span>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <div class="border-t pt-2 mt-3">
            <div class="flex justify-between text-lg font-semibold">
              <span>Total Amount:</span>
              <span class="text-primary-600">₹${totalAmount}</span>
            </div>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Pay Now',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#2563eb',
      cancelButtonColor: '#6b7280',
      width: '500px'
    })

    if (result.isConfirmed) {
      await handleRazorpayPayment(booking)
    } else {
      // User cancelled payment, reset form
      resetBookingForm()
    }
  }

  // Handle Razorpay payment
  const handleRazorpayPayment = async (booking) => {
    try {
      // First create Razorpay order
      const orderResponse = await bookingAPI.createOrder(booking._id)
      const orderData = orderResponse.data

      // Load Razorpay script dynamically
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => {
        const options = {
          key: 'rzp_test_R79jO6N4F99QLG', // Your Razorpay key
          amount: orderData.amount, // Amount in paise from order
          currency: orderData.currency,
          name: 'LabMate360',
          description: `Booking for ${selectedLab.name}`,
          order_id: orderData.orderId,
          handler: async function (response) {
            try {
              // Process payment
              await bookingAPI.processPayment(booking._id, {
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature
              })

              await Swal.fire({
                icon: 'success',
                title: 'Payment Successful!',
                text: `Your appointment at ${selectedLab.name} has been confirmed for ${selectedDate} at ${selectedTime}`,
                confirmButtonColor: '#2563eb',
                confirmButtonText: 'OK'
              })

              resetBookingForm()
            } catch (err) {
              Swal.fire({
                icon: 'error',
                title: 'Payment Failed',
                text: err.message || 'Payment processing failed',
                confirmButtonColor: '#dc2626'
              })
            }
          },
          prefill: {
            name: 'User Name', // You can get this from user profile
            email: 'user@example.com', // You can get this from user profile
            contact: '9999999999' // You can get this from user profile
          },
          theme: {
            color: '#2563eb'
          },
          modal: {
            ondismiss: function () {
              Swal.fire({
                icon: 'warning',
                title: 'Payment Cancelled',
                text: 'Payment was cancelled. Your booking is still pending.',
                confirmButtonColor: '#2563eb'
              })
            }
          }
        }

        const rzp = new window.Razorpay(options)
        rzp.open()
      }
      document.body.appendChild(script)
    } catch (err) {
      console.error('Razorpay error:', err)
      Swal.fire({
        icon: 'error',
        title: 'Payment Failed',
        text: err.message || 'Failed to initialize payment',
        confirmButtonColor: '#dc2626'
      })
    }
  }

  // Reset booking form
  const resetBookingForm = () => {
    setSelectedLab(null)
    setSelectedTests([])
    setSelectedPackages([])
    setSelectedDate('')
    setSelectedTime('')
    setPaymentMethod('')
    setNotes('')
    setBookingStep(1)
  }

  // Filter labs based on search term
  const filteredLabs = (showAllLabs ? labs : nearbyLabs).filter(lab => {
    const searchLower = searchTerm.toLowerCase()
    const name = lab.name.toLowerCase()
    const address = typeof lab.address === 'string'
      ? lab.address.toLowerCase()
      : `${lab.address.street || ''} ${lab.address.city || ''}`.toLowerCase()

    return name.includes(searchLower) || address.includes(searchLower)
  })

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  // Handle date change and reset time if needed
  const handleDateChange = (newDate) => {
    setSelectedDate(newDate)

    // Reset selected time if it's no longer available
    if (selectedTime && newDate) {
      const availableSlots = getAvailableTimeSlots()
      if (!availableSlots.includes(selectedTime)) {
        setSelectedTime('')
      }
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Render lab card
  const renderLabCard = (lab) => {
    const address = typeof lab.address === 'string'
      ? (() => {
        try {
          const addr = JSON.parse(lab.address)
          return `${addr.street}, ${addr.city}, ${addr.state} - ${addr.zipCode}`
        } catch (e) {
          return lab.address
        }
      })()
      : `${lab.address.street}, ${lab.address.city}, ${lab.address.state} - ${lab.address.zipCode}`

    const contact = typeof lab.contact === 'string'
      ? (() => {
        try {
          const contactData = JSON.parse(lab.contact)
          return { phone: contactData.phone, email: contactData.email }
        } catch (e) {
          return { phone: lab.contact, email: '' }
        }
      })()
      : { phone: lab.contact.phone, email: lab.contact.email }

    const operatingHours = typeof lab.operatingHours === 'string'
      ? (() => {
        try {
          const hours = JSON.parse(lab.operatingHours)
          return `${hours.monday?.open || '09:00'} - ${hours.monday?.close || '18:00'}`
        } catch (e) {
          return lab.operatingHours
        }
      })()
      : `${lab.operatingHours.monday?.open || '09:00'} - ${lab.operatingHours.monday?.close || '18:00'}`

    return (
      <div key={lab._id} className="bg-white rounded-2xl shadow-soft hover:shadow-card transition-all duration-300 border border-gray-100 overflow-hidden group">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 shadow-sm border border-primary-100 group-hover:scale-105 transition-transform">
                <Building2 className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary-700 transition-colors">{lab.name}</h3>
                {lab.distance && (
                  <div className="flex items-center text-sm font-medium text-primary-600 mt-1 bg-primary-50 w-fit px-2 py-0.5 rounded-full">
                    <Navigation className="h-3.5 w-3.5 mr-1" />
                    {lab.distance} km away
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-start text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-3 text-gray-400 mt-0.5" />
              <span className="leading-tight">{address}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="h-4 w-4 mr-3 text-gray-400" />
              <span>{contact.phone}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-3 text-gray-400" />
              <span>{operatingHours}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
            <span className="bg-gray-100 text-gray-600 text-xs px-2.5 py-1 rounded-full font-medium">
              {lab.availableTests?.length || 0} Tests
            </span>
            <span className="bg-amber-50 text-amber-700 text-xs px-2.5 py-1 rounded-full font-medium">
              {lab.availablePackages?.length || 0} Packages
            </span>
          </div>

          <button
            onClick={() => handleLabSelection(lab)}
            className="w-full mt-4 flex items-center justify-center px-4 py-2.5 bg-primary-600 text-white font-medium rounded-xl hover:bg-primary-700 active:transform active:scale-95 transition-all shadow-sm hover:shadow-md"
          >
            Select Lab
            <ChevronRight className="h-4 w-4 ml-1.5" />
          </button>
        </div>
      </div>
    )
  }

  // Helper to construct image URL
  const getImageUrl = (imagePath) => {
    if (!imagePath) return null
    if (imagePath.startsWith('http')) return imagePath

    // Get base URL (remove /api from VITE_API_URL)
    const baseUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : 'http://localhost:5000'

    // Ensure path doesn't start with slash if we're adding one
    const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath

    return `${baseUrl}/${cleanPath}`
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Book Laboratory Tests</h1>
        <p className="text-gray-500 mt-2 text-lg">Find nearby labs and schedule your tests with ease</p>

        {/* Step Indicator */}
        <div className="mt-10 mb-12">
          <div className="flex items-center justify-between relative max-w-4xl mx-auto">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 transform -translate-y-1/2 rounded-full"></div>
            <div className="absolute top-1/2 left-0 h-1 bg-primary-100 -z-10 transform -translate-y-1/2 rounded-full transition-all duration-500" style={{ width: `${((bookingStep - 1) / 4) * 100}%` }}></div>

            {/* Steps */}
            {[
              { num: 1, label: 'Select Lab' },
              { num: 2, label: 'Select Tests' },
              { num: 3, label: 'Schedule' },
              { num: 4, label: 'Payment' },
              { num: 5, label: 'Confirm' }
            ].map((step) => {
              const isActive = bookingStep >= step.num;
              const isCurrent = bookingStep === step.num;
              return (
                <div key={step.num} className="flex flex-col items-center gap-2 bg-gray-50 px-2 relative z-10">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ring-4 ${isActive
                      ? 'bg-primary-600 text-white ring-primary-50 scale-110 shadow-lg shadow-primary-500/20'
                      : 'bg-white text-gray-400 border-2 border-gray-200 ring-transparent'
                      }`}
                  >
                    {isActive ? (isCurrent ? step.num : <CheckCircle className="w-6 h-6" />) : step.num}
                  </div>
                  <span className={`text-xs font-semibold uppercase tracking-wider ${isActive ? 'text-primary-700' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Location Status */}
      {locationError && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {locationError}
          <button
            onClick={getCurrentLocation}
            className="ml-auto text-yellow-800 hover:text-yellow-900 underline"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Step 1: Lab Selection */}
      {bookingStep === 1 && (
        <div>
          {/* Search and Filter Bar */}
          <div className="bg-white rounded-2xl shadow-soft p-6 mb-8 border border-gray-100">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="h-5 w-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search labs by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-gray-50 border-0 text-gray-900 rounded-xl focus:ring-2 focus:ring-primary-500 w-full transition-all"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
                <button
                  onClick={() => setShowAllLabs(!showAllLabs)}
                  className={`flex items-center px-5 py-2.5 rounded-xl border font-medium whitespace-nowrap transition-all ${showAllLabs
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showAllLabs ? 'Showing All' : 'Show Nearby'}
                </button>
                {/* Filter Chips UI Preview */}
                {['Top Rated', 'Open Now'].map(filter => (
                  <button key={filter} className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 font-medium whitespace-nowrap text-sm">
                    {filter}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Labs Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                {showAllLabs ? 'All Available Labs' : 'Recommended Labs Near You'}
              </h2>
              {userLocation && !showAllLabs && (
                <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium">
                  {nearbyLabs.length} closest labs
                </span>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader className="h-10 w-10 animate-spin text-primary-600 mb-4" />
                <p className="text-gray-500 font-medium">Finding the best labs for you...</p>
              </div>
            ) : filteredLabs.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No labs found matching your search</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLabs.map(renderLabCard)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Test Selection */}
      {bookingStep === 2 && selectedLab && (
        <div className="max-w-7xl mx-auto">
          {/* Selected Lab Header */}
          <div className="bg-white rounded-2xl shadow-soft p-6 mb-8 border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Building2 className="h-5 w-5 text-primary-500" />
                <h3 className="text-xl font-bold text-gray-900">{selectedLab.name}</h3>
              </div>
              <p className="text-gray-500 text-sm flex items-center">
                <MapPin className="h-3.5 w-3.5 mr-1" />
                {typeof selectedLab.address === 'string'
                  ? (() => {
                    try {
                      const addr = JSON.parse(selectedLab.address)
                      return `${addr.street}, ${addr.city}`
                    } catch (e) {
                      return selectedLab.address
                    }
                  })()
                  : `${selectedLab.address.street}, ${selectedLab.address.city}`
                }
              </p>
            </div>
            <button
              onClick={() => {
                setBookingStep(1)
                setSelectedLab(null)
              }}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Change Lab
            </button>
          </div>

          {/* Available Tests */}
          <div className="mb-10">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <FlaskConical className="h-6 w-6 mr-3 text-primary-600" />
              Available Tests
            </h3>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-primary-600 mb-3" />
                <p className="text-gray-500">Loading tests...</p>
              </div>
            ) : selectedLab.availableTestsDetails?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedLab.availableTestsDetails.map((test) => {
                  const isSelected = selectedTests.includes(test._id)
                  return (
                    <div
                      key={test._id}
                      className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden group flex flex-col ${isSelected
                        ? 'border-primary-500 shadow-md ring-1 ring-primary-500'
                        : 'border-gray-200 shadow-sm hover:shadow-md hover:border-primary-200'
                        }`}
                    >
                      <div className="h-40 bg-gray-50 relative overflow-hidden">
                        {test.image ? (
                          <img src={getImageUrl(test.image)} alt={test.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary-50 text-primary-200">
                            <FlaskConical className="h-16 w-16 opacity-50" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <span className="bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-gray-900 shadow-sm">
                            {test.category}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-primary-700 transition-colors">{test.name}</h4>
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                            {test.description || 'No description available for this test.'}
                          </p>
                        </div>

                        <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-50">
                          <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Price</p>
                            <p className="text-xl font-bold text-primary-600">₹{test.price}</p>
                          </div>
                          <button
                            onClick={() => toggleTestSelection(test._id)}
                            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${isSelected
                              ? 'bg-primary-600 text-white hover:bg-primary-700'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                              }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                <FlaskConical className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No tests available at this lab</p>
              </div>
            )}
          </div>

          {/* Available Packages */}
          <div className="mb-24">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Package className="h-6 w-6 mr-3 text-primary-600" />
              Available Packages
            </h3>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin text-primary-600 mb-3" />
                <p className="text-gray-500">Loading packages...</p>
              </div>
            ) : selectedLab.availablePackagesDetails?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedLab.availablePackagesDetails.map((packageItem) => {
                  const isSelected = selectedPackages.includes(packageItem._id)
                  return (
                    <div
                      key={packageItem._id}
                      className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden group flex flex-col ${isSelected
                        ? 'border-primary-500 shadow-md ring-1 ring-primary-500'
                        : 'border-gray-200 shadow-sm hover:shadow-md hover:border-primary-200'
                        }`}
                    >
                      <div className="h-40 bg-gray-50 relative overflow-hidden">
                        {packageItem.image ? (
                          <img src={getImageUrl(packageItem.image)} alt={packageItem.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-amber-50 text-amber-200">
                            <Package className="h-16 w-16 opacity-50" />
                          </div>
                        )}
                        <div className="absolute top-3 right-3">
                          <span className="bg-amber-100 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-800 shadow-sm">
                            {packageItem.selectedTests?.length || 0} Tests
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-primary-700 transition-colors">{packageItem.name}</h4>
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                            {packageItem.description || 'Comprehensive health package.'}
                          </p>
                        </div>

                        <div className="flex items-end justify-between mt-4 pt-4 border-t border-gray-50">
                          <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Package Price</p>
                            <div className="flex items-baseline gap-2">
                              <p className="text-xl font-bold text-primary-600">₹{packageItem.price}</p>
                              {packageItem.discount > 0 && (
                                <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded">
                                  {packageItem.discount}% OFF
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => togglePackageSelection(packageItem._id)}
                            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm ${isSelected
                              ? 'bg-primary-600 text-white hover:bg-primary-700'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                              }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500">No packages available at this lab</p>
              </div>
            )}
          </div>

          {/* Floating Continue Footer (Sticky) */}
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg lg:pl-64 z-40 transition-transform duration-300">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
              <div className="flex flex-col">
                <p className="text-xs text-gray-500 font-medium uppercase">Total Selected</p>
                <p className="text-lg font-bold text-gray-900">
                  {selectedTests.length + selectedPackages.length} Items
                  <span className="mx-2 text-gray-300">|</span>
                  <span className="text-primary-600">
                    ₹{
                      (selectedLab.availableTestsDetails
                        ?.filter(test => selectedTests.includes(test._id))
                        .reduce((sum, test) => sum + test.price, 0) || 0) +
                      (selectedLab.availablePackagesDetails
                        ?.filter(packageItem => selectedPackages.includes(packageItem._id))
                        .reduce((sum, packageItem) => sum + packageItem.price, 0) || 0)
                    }
                  </span>
                </p>
              </div>
              <button
                onClick={() => setBookingStep(3)}
                disabled={!selectedTests.length && !selectedPackages.length}
                className="px-8 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex items-center"
              >
                Continue
                <ChevronRight className="h-5 w-5 ml-2" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Schedule Appointment */}
      {bookingStep === 3 && selectedLab && (
        <div>
          {/* Selected Lab Info */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary-900">{selectedLab.name}</h3>
                <p className="text-primary-700">
                  {typeof selectedLab.address === 'string'
                    ? (() => {
                      try {
                        const addr = JSON.parse(selectedLab.address)
                        return `${addr.street}, ${addr.city}`
                      } catch (e) {
                        return selectedLab.address
                      }
                    })()
                    : `${selectedLab.address.street}, ${selectedLab.address.city}`
                  }
                </p>
              </div>
              <button
                onClick={() => {
                  setBookingStep(2)
                }}
                className="text-primary-600 hover:text-primary-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Booking Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>

            <div className="space-y-4">
              {selectedTests.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900">Selected Tests ({selectedTests.length})</h4>
                  <div className="mt-2 space-y-1">
                    {selectedLab.availableTestsDetails
                      ?.filter(test => selectedTests.includes(test._id))
                      .map(test => (
                        <div key={test._id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{test.name}</span>
                          <span className="text-gray-900">₹{test.price}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {selectedPackages.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900">Selected Packages ({selectedPackages.length})</h4>
                  <div className="mt-2 space-y-1">
                    {selectedLab.availablePackagesDetails
                      ?.filter(packageItem => selectedPackages.includes(packageItem._id))
                      .map(packageItem => (
                        <div key={packageItem._id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{packageItem.name}</span>
                          <span className="text-gray-900">₹{packageItem.price}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Total Calculation */}
              {(selectedTests.length > 0 || selectedPackages.length > 0) && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-primary-600">
                      ₹{
                        (selectedLab.availableTestsDetails
                          ?.filter(test => selectedTests.includes(test._id))
                          .reduce((sum, test) => sum + test.price, 0) || 0) +
                        (selectedLab.availablePackagesDetails
                          ?.filter(packageItem => selectedPackages.includes(packageItem._id))
                          .reduce((sum, packageItem) => sum + packageItem.price, 0) || 0)
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date and Time Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Appointment</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={getMinDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Time</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Choose time slot</option>
                  {getAvailableTimeSlots().map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                {selectedDate && getAvailableTimeSlots().length === 0 && (
                  <p className="text-sm text-orange-600 mt-1">
                    No available time slots for today. Please select a future date.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Continue Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setBookingStep(4)}
              disabled={!selectedDate || !selectedTime}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              Continue to Payment
              <ChevronRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Payment Method Selection */}
      {bookingStep === 4 && selectedLab && (
        <div>
          {/* Selected Lab Info */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-primary-900">{selectedLab.name}</h3>
                <p className="text-primary-700">
                  {typeof selectedLab.address === 'string'
                    ? (() => {
                      try {
                        const addr = JSON.parse(selectedLab.address)
                        return `${addr.street}, ${addr.city}`
                      } catch (e) {
                        return selectedLab.address
                      }
                    })()
                    : `${selectedLab.address.street}, ${selectedLab.address.city}`
                  }
                </p>
              </div>
              <button
                onClick={() => {
                  setBookingStep(3)
                }}
                className="text-primary-600 hover:text-primary-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Appointment Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-600">Date</div>
                  <div className="font-medium">{formatDate(selectedDate)}</div>
                </div>
              </div>
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-gray-500" />
                <div>
                  <div className="text-sm text-gray-600">Time</div>
                  <div className="font-medium">{selectedTime}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Payment Method</h3>

            <div className="space-y-4">
              <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="pay_now"
                  checked={paymentMethod === 'pay_now'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">Pay Now</div>
                  <div className="text-sm text-gray-500">Pay securely online with Razorpay</div>
                </div>
              </label>

              <label className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="pay_later"
                  checked={paymentMethod === 'pay_later'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">Pay at Lab</div>
                  <div className="text-sm text-gray-500">Pay when you visit the lab</div>
                </div>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Notes (Optional)</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Any special instructions or notes for the lab..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* Continue Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setBookingStep(5)}
              disabled={!paymentMethod}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              Continue to Confirm
              <ChevronRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Booking Confirmation */}
      {bookingStep === 5 && selectedLab && (
        <div>
          {/* Booking Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Selected Lab</h4>
                <p className="text-gray-600">{selectedLab.name}</p>
              </div>

              {selectedTests.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900">Selected Tests ({selectedTests.length})</h4>
                  <div className="mt-2 space-y-1">
                    {selectedLab.availableTestsDetails
                      ?.filter(test => selectedTests.includes(test._id))
                      .map(test => (
                        <div key={test._id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{test.name}</span>
                          <span className="text-gray-900">₹{test.price}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {selectedPackages.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900">Selected Packages ({selectedPackages.length})</h4>
                  <div className="mt-2 space-y-1">
                    {selectedLab.availablePackagesDetails
                      ?.filter(packageItem => selectedPackages.includes(packageItem._id))
                      .map(packageItem => (
                        <div key={packageItem._id} className="flex justify-between text-sm">
                          <span className="text-gray-600">{packageItem.name}</span>
                          <span className="text-gray-900">₹{packageItem.price}</span>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}

              {/* Total Calculation */}
              {(selectedTests.length > 0 || selectedPackages.length > 0) && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span className="text-primary-600">
                      ₹{
                        (selectedLab.availableTestsDetails
                          ?.filter(test => selectedTests.includes(test._id))
                          .reduce((sum, test) => sum + test.price, 0) || 0) +
                        (selectedLab.availablePackagesDetails
                          ?.filter(packageItem => selectedPackages.includes(packageItem._id))
                          .reduce((sum, packageItem) => sum + packageItem.price, 0) || 0)
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Date and Time Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule Appointment</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={getMinDate()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Time</label>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Choose time slot</option>
                  {getAvailableTimeSlots().map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
                {selectedDate && getAvailableTimeSlots().length === 0 && (
                  <p className="text-sm text-orange-600 mt-1">
                    No available time slots for today. Please select a future date.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Booking Actions */}
          <div className="flex justify-between">
            <button
              onClick={() => setBookingStep(4)}
              className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Payment
            </button>

            <button
              onClick={handleBooking}
              disabled={loading || !selectedDate || !selectedTime}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Confirming...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Confirm Booking
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookTests
