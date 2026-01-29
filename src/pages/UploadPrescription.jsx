import { useState, useEffect } from 'react'
import {
  Upload,
  FileText,
  Image,
  File,
  Loader,
  AlertCircle,
  CheckCircle,
  X,
  Search,
  Building2,
  MapPin,
  Phone,
  Mail,
  Clock,
  Navigation,
  Filter,
  ChevronRight,
  ArrowLeft,
  Calendar,
  FlaskConical,
  Package,
  Eye,
  Trash2
} from 'lucide-react'
import Swal from 'sweetalert2'
import api from '../services/api'

const { labAPI, testAPI, packageAPI, bookingAPI } = api

const UploadPrescription = () => {
  // File upload states
  const [uploadedFile, setUploadedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  // OCR and text extraction states
  const [extractedText, setExtractedText] = useState('')
  const [isExtracting, setIsExtracting] = useState(false)
  const [extractedTests, setExtractedTests] = useState([])

  // Lab and booking states
  const [labs, setLabs] = useState([])
  const [selectedLab, setSelectedLab] = useState(null)
  const [selectedTests, setSelectedTests] = useState([])
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [notes, setNotes] = useState('')
  const [userLocation, setUserLocation] = useState(null)

  // UI states
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAllLabs, setShowAllLabs] = useState(false)
  const [currentStep, setCurrentStep] = useState(1) // 1: Upload, 2: Review Tests, 3: Select Lab, 4: Book

  // API key for OCR.space API
  const API_KEY = 'K81136036288957'

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
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setUserLocation({ latitude, longitude })
      },
      (error) => {
        console.error('Error getting location:', error)
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

      setLabs(allLabsData)
    } catch (err) {
      setError('Failed to fetch labs')
      console.error('Error fetching labs:', err)
    } finally {
      setLoading(false)
    }
  }

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      Swal.fire({
        icon: 'error',
        title: 'Invalid File Type',
        text: 'Please upload a JPG, PNG, or PDF file',
        confirmButtonColor: '#dc2626'
      })
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'File Too Large',
        text: 'Please upload a file smaller than 10MB',
        confirmButtonColor: '#dc2626'
      })
      return
    }

    setUploadedFile(file)

    // Create preview URL
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)

    // Auto-extract text from both images and PDFs
    extractTextFromFile(file)
  }

  // Extract text using OCR.space API (supports both images and PDFs)
  const extractTextFromFile = async (file) => {
    try {
      setIsExtracting(true)

      // Create FormData for OCR.space API
      const formData = new FormData()
      formData.append('file', file)
      formData.append('apikey', API_KEY)
      formData.append('language', 'eng') // English
      formData.append('isOverlayRequired', 'false')
      formData.append('detectOrientation', 'true')
      formData.append('scale', 'true')
      formData.append('OCREngine', '2') // Use OCR Engine 2 for better accuracy

      // For PDFs, add additional parameters
      if (file.type === 'application/pdf') {
        formData.append('filetype', 'pdf')
        formData.append('detectCheckbox', 'true')
        formData.append('checkboxTemplate', '1')
      }

      // Call OCR.space API
      const response = await fetch('https://api.ocr.space/parse/image', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`OCR.space API error: ${response.status}`)
      }

      const data = await response.json()

      // Check if OCR was successful
      if (!data.IsErroredOnProcessing) {
        const extractedText = data.ParsedResults?.[0]?.ParsedText || ''
        setExtractedText(extractedText)

        // Parse tests from extracted text
        parseTestsFromText(extractedText)
      } else {
        throw new Error(data.ErrorMessage || 'OCR processing failed')
      }

    } catch (error) {
      console.error('OCR extraction error:', error)
      setError('Failed to extract text from file. Please ensure the file is clear and readable, then try again.')

      // Fallback: allow manual test selection
      setExtractedText('Text extraction failed. You can manually select tests below.')
      setExtractedTests([])
    } finally {
      setIsExtracting(false)
    }
  }


  // Parse test names from extracted text
  const parseTestsFromText = (text) => {
    // Common laboratory test patterns
    const testPatterns = [
      /blood\s+sugar/gi,
      /diabetes/gi,
      /hba1c/gi,
      /lipid\s+profile/gi,
      /cholesterol/gi,
      /triglycerides/gi,
      /hdl/gi,
      /ldl/gi,
      /liver\s+function/gi,
      /lft/gi,
      /sgpt/gi,
      /sgot/gi,
      /bilirubin/gi,
      /kidney\s+function/gi,
      /kft/gi,
      /urea/gi,
      /creatinine/gi,
      /urine\s+analysis/gi,
      /urine\s+test/gi,
      /thyroid/gi,
      /tsh/gi,
      /t3/gi,
      /t4/gi,
      /vitamin\s+d/gi,
      /vitamin\s+b12/gi,
      /iron/gi,
      /hemoglobin/gi,
      /hb/gi,
      /complete\s+blood\s+count/gi,
      /cbc/gi,
      /wbc/gi,
      /rbc/gi,
      /platelet/gi,
      /esr/gi,
      /crp/gi,
      /sputum/gi,
      /stool/gi,
      /ecg/gi,
      /echocardiogram/gi,
      /x[\s-]?ray/gi,
      /ultrasound/gi,
      /ct\s+scan/gi,
      /mri/gi,
      /mammography/gi,
      /pap\s+smear/gi,
      /psa/gi,
      /prostate/gi,
      /covid/gi,
      /rt[\s-]?pcr/gi,
      /antigen/gi,
      /antibody/gi
    ]

    const foundTests = []

    testPatterns.forEach(pattern => {
      const matches = text.match(pattern)
      if (matches) {
        matches.forEach(match => {
          // Clean up the match and standardize
          const cleanTest = match.toLowerCase().trim()
          if (!foundTests.includes(cleanTest)) {
            foundTests.push(cleanTest)
          }
        })
      }
    })

    // Also look for common test name patterns
    const lines = text.split('\n')
    lines.forEach(line => {
      const lowerLine = line.toLowerCase()
      if (lowerLine.includes('test') || lowerLine.includes('investigation') || lowerLine.includes('profile')) {
        // Extract potential test names from lines containing these keywords
        const words = line.split(/\s+/)
        words.forEach(word => {
          if (word.length > 3 && !foundTests.includes(word.toLowerCase())) {
            foundTests.push(word.toLowerCase())
          }
        })
      }
    })

    setExtractedTests([...new Set(foundTests)]) // Remove duplicates
  }

  // Handle lab selection
  const handleLabSelection = async (lab) => {
    setSelectedLab(lab)

    // Only allow booking if there are matching tests
    if (selectedTests.length > 0 && lab.availableTests) {
      const labTestNames = lab.availableTests.map(test =>
        typeof test === 'object' ? test.name?.toLowerCase() : test.toLowerCase()
      )

      // Find which of our selected tests match with lab's available tests
      const matchingTests = selectedTests.filter(selectedTest => {
        const selectedTestLower = selectedTest.toLowerCase()
        return labTestNames.some(labTestName =>
          labTestName && (
            labTestName.includes(selectedTestLower) ||
            selectedTestLower.includes(labTestName.split(' ')[0]) ||
            selectedTestLower === labTestName
          )
        )
      })

      if (matchingTests.length > 0) {
        // Only proceed if there are matching tests
        setSelectedTests(matchingTests)
        console.log('Auto-selected matching tests:', matchingTests)
        setCurrentStep(4) // Move to booking step
      } else {
        // Show error if no matches found
        Swal.fire({
          icon: 'warning',
          title: 'No Matching Tests',
          text: 'This lab does not have any of the tests you selected. Please choose a different lab or select different tests.',
          confirmButtonColor: '#2563eb',
          confirmButtonText: 'OK'
        })
        // Stay on lab selection step
        return
      }
    } else {
      setCurrentStep(4) // Move to booking step if no tests to match
    }
  }

  // Toggle test selection
  const toggleTestSelection = (testName) => {
    setSelectedTests(prev =>
      prev.includes(testName)
        ? prev.filter(name => name !== testName)
        : [...prev, testName]
    )
  }

  // Handle booking submission
  const handleBooking = async () => {
    if (!selectedLab || !selectedTests.length) {
      Swal.fire({
        icon: 'warning',
        title: 'Selection Required',
        text: 'Please select at least one test',
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

      // Prepare test data for API - only use matched tests from lab
      const selectedTestsData = selectedTests.map((testName, index) => {
        // Find matching test in selected lab (should always exist since we filtered)
        const matchingLabTest = selectedLab.availableTests?.find(labTest => {
          const labTestName = typeof labTest === 'object' ? labTest.name?.toLowerCase() : labTest.toLowerCase()
          const selectedTestLower = testName.toLowerCase()
          return labTestName && (
            labTestName.includes(selectedTestLower) ||
            selectedTestLower.includes(labTestName.split(' ')[0]) ||
            selectedTestLower === labTestName
          )
        })

        if (matchingLabTest) {
          // Use actual test from lab
          const testObj = typeof matchingLabTest === 'object' ? matchingLabTest : { _id: matchingLabTest, name: testName, price: 100 }
          return {
            testId: testObj._id,
            testName: testObj.name || testName,
            price: testObj.price || 100
          }
        } else {
          // This should not happen since we filtered tests, but handle gracefully
          throw new Error(`Test "${testName}" not found in lab's available tests`)
        }
      })

      // Create booking data

      // Create booking data structure
      let bookingData = {
        labId: selectedLab._id,
        selectedTests: selectedTestsData,
        selectedPackages: [],
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        paymentMethod,
        notes: `Prescription-based booking. Original notes: ${notes.trim()}`,
        userLocation: userLocation,
        prescriptionUrl: null // Will be updated if file uploaded
      }

      // If there's a file, upload it first
      if (uploadedFile) {
        try {
          console.log('Uploading prescription file...')
          const uploadResponse = await bookingAPI.uploadPrescription(uploadedFile)
          if (uploadResponse.success && uploadResponse.data) {
            bookingData.prescriptionUrl = uploadResponse.data.path
            console.log('Prescription uploaded, url:', bookingData.prescriptionUrl)
          }
        } catch (uploadError) {
          console.error('Failed to upload prescription file:', uploadError)
          Swal.fire({
            icon: 'warning',
            title: 'Upload Issue',
            text: 'Could not upload prescription image, but proceeding with booking details.',
            confirmButtonColor: '#f59e0b'
          })
        }
      }

      console.log('Creating booking with data:', bookingData)

      // Create booking
      const response = await bookingAPI.createBooking(bookingData)

      console.log('Booking response:', response)

      if (paymentMethod === 'pay_now') {
        // Show bill information popup before Razorpay
        await showBillPopup(response.data, selectedTestsData)
      } else {
        // Pay later - booking confirmed
        const message = `Your appointment at ${selectedLab.name} has been scheduled for ${selectedDate} at ${selectedTime}. Payment due at the lab.\n\nAll ${selectedTestsData.length} test(s) are confirmed and available at this lab.`

        await Swal.fire({
          icon: 'success',
          title: 'Booking Confirmed!',
          text: message,
          confirmButtonColor: '#2563eb',
          confirmButtonText: 'OK'
        })

        // Reset form
        resetForm()
      }

    } catch (err) {
      console.error('Booking error:', err)
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
  const showBillPopup = async (booking, selectedTestsData) => {
    const totalAmount = booking.totalAmount || 0

    const result = await Swal.fire({
      title: 'Payment Summary',
      html: `
        <div class="text-left">
          <div class="mb-4">
            <h4 class="font-semibold text-gray-900 mb-2">Lab: ${selectedLab.name}</h4>
            <p class="text-sm text-gray-600">Appointment: ${formatDate(selectedDate)} at ${selectedTime}</p>
            <p class="text-sm text-gray-600">Booking Type: Prescription-based</p>
          </div>
          
          <div class="mb-3">
            <h5 class="font-medium text-gray-800">Tests (${selectedTestsData.length})</h5>
            <div class="ml-2 space-y-1">
              ${selectedTestsData.map(test => `
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600">${test.testName}</span>
                  <span class="text-gray-900">₹${test.price}</span>
                </div>
              `).join('')}
            </div>
          </div>
          
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
      resetForm()
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
          description: `Prescription booking for ${selectedLab.name}`,
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

              resetForm()
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
            name: 'User Name',
            email: 'user@example.com',
            contact: '9999999999'
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

  // Reset form
  const resetForm = () => {
    setUploadedFile(null)
    setPreviewUrl(null)
    setExtractedText('')
    setExtractedTests([])
    setSelectedLab(null)
    setSelectedTests([])
    setSelectedDate('')
    setSelectedTime('')
    setPaymentMethod('')
    setNotes('')
    setCurrentStep(1)
    setError('')
  }

  // Match extracted tests with lab available tests
  const matchTestsWithLab = (lab, extractedTests) => {
    if (!lab.availableTests || !extractedTests.length) return { matches: [], unmatched: extractedTests }

    const availableTestNames = lab.availableTests.map(test =>
      typeof test === 'object' ? test.name?.toLowerCase() : test.toLowerCase()
    )

    const matches = []
    const unmatched = []

    extractedTests.forEach(extractedTest => {
      const testLower = extractedTest.toLowerCase()

      // Check for exact matches
      const exactMatch = availableTestNames.find(availableTest =>
        availableTest && availableTest.includes(testLower)
      )

      if (exactMatch) {
        matches.push({
          extracted: extractedTest,
          available: availableTestNames.find(at => at === exactMatch)
        })
      } else {
        // Check for partial matches (e.g., "blood sugar" matches "blood sugar test")
        const partialMatch = availableTestNames.find(availableTest =>
          availableTest && (
            availableTest.includes(testLower) ||
            testLower.includes(availableTest.split(' ')[0]) // Match first word
          )
        )

        if (partialMatch) {
          matches.push({
            extracted: extractedTest,
            available: partialMatch
          })
        } else {
          unmatched.push(extractedTest)
        }
      }
    })

    return { matches, unmatched }
  }

  // Filter labs based on search term and test availability
  const filteredLabs = labs.filter(lab => {
    const searchLower = searchTerm.toLowerCase()
    const name = lab.name.toLowerCase()
    const address = typeof lab.address === 'string'
      ? lab.address.toLowerCase()
      : `${lab.address.street || ''} ${lab.address.city || ''}`.toLowerCase()

    const matchesSearch = name.includes(searchLower) || address.includes(searchLower)

    // If we have selected tests, only show labs that have ALL of them (or at least one matching)
    if (selectedTests.length > 0) {
      const { matches } = matchTestsWithLab(lab, selectedTests)
      return matchesSearch && matches.length > 0
    }

    return matchesSearch
  }).map(lab => {
    // Add test matching information to each lab
    if (selectedTests.length > 0) {
      const testMatch = matchTestsWithLab(lab, selectedTests)
      return {
        ...lab,
        testMatch,
        availableTestsCount: testMatch.matches.length,
        totalTestsRequested: selectedTests.length
      }
    }
    return lab
  }).sort((a, b) => {
    // Sort labs by number of available tests (descending)
    if (selectedTests.length > 0) {
      return (b.availableTestsCount || 0) - (a.availableTestsCount || 0)
    }
    return 0
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

    return (
      <div key={lab._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center">
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">{lab.name}</h3>
              {lab.distance && (
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Navigation className="h-4 w-4 mr-1" />
                  {lab.distance} km away
                </div>
              )}
            </div>
          </div>
          <button
            onClick={() => handleLabSelection(lab)}
            className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Select Lab
            <ChevronRight className="h-4 w-4 ml-1" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{address}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <Phone className="h-4 w-4 mr-2" />
            <span>{contact.phone}</span>
          </div>
          {contact.email && (
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="h-4 w-4 mr-2" />
              <span>{contact.email}</span>
            </div>
          )}
        </div>

        {/* Test Availability Information */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          {selectedTests.length > 0 && lab.testMatch ? (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-green-600 font-medium">
                  Available: {lab.availableTestsCount}/{lab.totalTestsRequested} tests
                </span>
                <span className="text-gray-500">
                  Total: {lab.availableTests?.length || 0} tests
                </span>
              </div>

              {/* Show available tests */}
              {lab.testMatch.matches.length > 0 && (
                <div className="text-xs">
                  <div className="text-gray-600 mb-1">Available tests:</div>
                  <div className="flex flex-wrap gap-1">
                    {lab.testMatch.matches.slice(0, 3).map((match, index) => (
                      <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                        {match.extracted}
                      </span>
                    ))}
                    {lab.testMatch.matches.length > 3 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        +{lab.testMatch.matches.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Show unmatched tests */}
              {lab.testMatch.unmatched.length > 0 && (
                <div className="text-xs">
                  <div className="text-orange-600 mb-1">Not available:</div>
                  <div className="flex flex-wrap gap-1">
                    {lab.testMatch.unmatched.slice(0, 2).map((test, index) => (
                      <span key={index} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                        {test}
                      </span>
                    ))}
                    {lab.testMatch.unmatched.length > 2 && (
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                        +{lab.testMatch.unmatched.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Tests: {lab.availableTests?.length || 0}</span>
              <span className="text-gray-500">Packages: {lab.availablePackages?.length || 0}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Prescription</h1>
        <p className="text-gray-600">Upload your prescription and we'll help you book the tests</p>

        {/* Step Indicator */}
        <div className="mt-6">
          <div className="flex items-center justify-center space-x-8">
            <div className={`flex items-center space-x-2 ${currentStep >= 1 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                1
              </div>
              <span className="text-sm font-medium">Upload</span>
            </div>

            <div className={`w-8 h-0.5 ${currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>

            <div className={`flex items-center space-x-2 ${currentStep >= 2 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                2
              </div>
              <span className="text-sm font-medium">Review Tests</span>
            </div>

            <div className={`w-8 h-0.5 ${currentStep >= 3 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>

            <div className={`flex items-center space-x-2 ${currentStep >= 3 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 3 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                3
              </div>
              <span className="text-sm font-medium">Select Lab</span>
            </div>

            <div className={`w-8 h-0.5 ${currentStep >= 4 ? 'bg-primary-600' : 'bg-gray-200'}`}></div>

            <div className={`flex items-center space-x-2 ${currentStep >= 4 ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${currentStep >= 4 ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                4
              </div>
              <span className="text-sm font-medium">Book</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}

      {/* Step 1: File Upload */}
      {currentStep === 1 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="text-center">
            <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Prescription</h3>
            <p className="text-gray-600 mb-6">Upload a clear image or PDF of your prescription</p>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-primary-400 transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
                id="prescription-upload"
              />
              <label
                htmlFor="prescription-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <span className="text-lg font-medium text-gray-900 mb-2">Choose File</span>
                <span className="text-sm text-gray-500">JPG, PNG, or PDF (max 10MB)</span>
              </label>
            </div>

            {/* File Preview */}
            {previewUrl && (
              <div className="mt-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">File Preview</h4>
                <div className="relative inline-block">
                  {uploadedFile?.type.startsWith('image/') ? (
                    <img
                      src={previewUrl}
                      alt="Prescription preview"
                      className="max-w-full max-h-96 rounded-lg shadow-sm border"
                    />
                  ) : (
                    <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center border">
                      <FileText className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setUploadedFile(null)
                      setPreviewUrl(null)
                      setExtractedText('')
                      setExtractedTests([])
                    }}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Text Extraction Status */}
                {isExtracting && (
                  <div className="mt-4 flex items-center justify-center text-primary-600">
                    <Loader className="h-5 w-5 animate-spin mr-2" />
                    Extracting text from {uploadedFile?.type.startsWith('image/') ? 'image' : 'PDF'}...
                  </div>
                )}

                {/* Extracted Text Display */}
                {extractedText && !isExtracting && (
                  <div className="mt-6">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Extracted Text</h4>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                      <pre className="text-sm text-gray-700 whitespace-pre-wrap">{extractedText}</pre>
                    </div>
                  </div>
                )}

                {/* Continue Button */}
                {extractedText && (
                  <div className="mt-6">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center mx-auto"
                    >
                      Continue to Review Tests
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Review Extracted Tests */}
      {currentStep === 2 && (
        <div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Review Extracted Tests</h3>
            <p className="text-gray-600 mb-6">We've identified the following tests from your prescription. Please select the ones you want to book.</p>

            {extractedTests.length > 0 ? (
              <div className="space-y-3">
                {extractedTests.map((test, index) => (
                  <label key={index} className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-primary-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTests.includes(test)}
                      onChange={() => toggleTestSelection(test)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-gray-900 capitalize">{test}</div>
                      <div className="text-sm text-gray-500">Detected from prescription</div>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FlaskConical className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No tests were automatically detected. You can manually add tests or try uploading a clearer image.</p>
              </div>
            )}

            {/* Manual Test Addition */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-lg font-medium text-gray-900 mb-4">Add Tests Manually</h4>
              <div className="flex space-x-3">
                <input
                  type="text"
                  placeholder="Enter test name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      const testName = e.target.value.trim().toLowerCase()
                      if (testName && !selectedTests.includes(testName)) {
                        setSelectedTests([...selectedTests, testName])
                        e.target.value = ''
                      }
                    }
                  }}
                />
                <button
                  onClick={(e) => {
                    const input = e.target.previousElementSibling
                    const testName = input.value.trim().toLowerCase()
                    if (testName && !selectedTests.includes(testName)) {
                      setSelectedTests([...selectedTests, testName])
                      input.value = ''
                    }
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Selected Tests Summary */}
            {selectedTests.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Selected Tests ({selectedTests.length})</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedTests.map((test, index) => (
                    <div key={index} className="flex items-center bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm">
                      <span className="capitalize">{test}</span>
                      <button
                        onClick={() => toggleTestSelection(test)}
                        className="ml-2 text-primary-600 hover:text-primary-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Continue Button */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Upload
            </button>

            <button
              onClick={() => setCurrentStep(3)}
              disabled={!selectedTests.length}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              Continue to Select Lab
              <ChevronRight className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Lab Selection */}
      {currentStep === 3 && (
        <div>

          {/* Selected Tests Summary */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-primary-900 mb-2">Selected Tests ({selectedTests.length})</h3>
            <div className="flex flex-wrap gap-2">
              {selectedTests.map((test, index) => (
                <span key={index} className="bg-primary-100 text-primary-800 px-3 py-1 rounded-full text-sm capitalize">
                  {test}
                </span>
              ))}
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search labs by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-full"
                />
              </div>
              <button
                onClick={() => setShowAllLabs(!showAllLabs)}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showAllLabs ? 'Show Nearby' : 'Show All Labs'}
              </button>
            </div>
          </div>

          {/* Test Matching Summary */}
          {selectedTests.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Test Availability Summary</h3>
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-700">
                  <span className="font-medium">{filteredLabs.length}</span> lab(s) found with your tests
                </div>
                <div className="text-sm text-blue-600">
                  Looking for: <span className="font-medium">{selectedTests.length}</span> tests
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedTests.map((test, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {test}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Labs Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {selectedTests.length > 0
                  ? `Labs with Your Tests (${filteredLabs.length})`
                  : showAllLabs ? 'All Available Labs' : 'Labs Near You'
                }
              </h2>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader className="h-8 w-8 animate-spin mr-3" />
                Loading labs...
              </div>
            ) : filteredLabs.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                {selectedTests.length > 0 ? (
                  <div>
                    <p className="text-lg font-medium mb-2">No labs found with your required tests</p>
                    <p className="text-sm mb-4">None of the available labs have the tests you selected. Only labs with matching tests can be booked:</p>
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      {selectedTests.map((test, index) => (
                        <span key={index} className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-sm">
                          {test}
                        </span>
                      ))}
                    </div>
                    <p className="text-sm">Please select different tests or contact labs directly to confirm availability.</p>
                  </div>
                ) : (
                  <p>No labs found matching your search</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLabs.map(renderLabCard)}
              </div>
            )}
          </div>

          {/* Back Button */}
          <div className="mt-6">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Review Tests
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Booking */}
      {currentStep === 4 && selectedLab && (
        <div>
          {/* Selected Lab and Tests Summary */}
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-lg font-semibold text-primary-900">{selectedLab.name}</h3>
                <p className="text-primary-700">Selected Tests ({selectedTests.length})</p>
              </div>
              <button
                onClick={() => setCurrentStep(3)}
                className="text-primary-600 hover:text-primary-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Test Details */}
            <div className="space-y-2">
              {selectedTests.map((testName, index) => {
                // Find the matching lab test (should always exist since we filtered)
                const matchingLabTest = selectedLab.availableTests?.find(labTest => {
                  const labTestName = typeof labTest === 'object' ? labTest.name?.toLowerCase() : labTest.toLowerCase()
                  const selectedTestLower = testName.toLowerCase()
                  return labTestName && (
                    labTestName.includes(selectedTestLower) ||
                    selectedTestLower.includes(labTestName.split(' ')[0]) ||
                    selectedTestLower === labTestName
                  )
                })

                const testObj = matchingLabTest && typeof matchingLabTest === 'object' ? matchingLabTest : null

                return (
                  <div key={index} className="flex items-center justify-between bg-white rounded-lg p-3">
                    <div className="flex items-center">
                      <FlaskConical className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-gray-900 capitalize">{testName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                        Confirmed
                      </span>
                      <span className="text-xs text-gray-600">
                        ₹{testObj?.price || 100}
                      </span>
                    </div>
                  </div>
                )
              })}
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

          {/* Booking Actions */}
          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(3)}
              className="px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Lab Selection
            </button>

            <button
              onClick={handleBooking}
              disabled={loading || !selectedDate || !selectedTime || !paymentMethod}
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

export default UploadPrescription
