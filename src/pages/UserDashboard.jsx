import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Calendar,
  Upload,
  FileText,
  Download,
  MapPin,
  HelpCircle,
  MessageCircle,
  User,
  LayoutDashboard,
  Wind
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import DashboardOverview from './DashboardOverview'
import DownloadReports from './DownloadReports'
import NearbyLabs from '../components/NearbyLabs'
import BookTests from './BookTests'
import MyBookings from './MyBookings'
import UploadPrescription from './UploadPrescription'
import Profile from './Profile'
import Support from './Support'
import RespiratoryWellness from './RespiratoryWellness'
import ProfileCompletionModal from '../components/ProfileCompletionModal'
import { useAuth } from '../contexts/AuthContext'

const UserDashboard = () => {
  const { user, updateUser, loading } = useAuth()
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [isProfileComplete, setIsProfileComplete] = useState(true)
  const hasRefreshedUser = useRef(false)

  // Memoized function to check profile completeness
  const checkProfileCompleteness = useCallback((currentUser) => {
    if (!currentUser) return false

    const userAge = currentUser.age
    const userGender = currentUser.gender
    const userDateOfBirth = currentUser.dateOfBirth

    // Convert age to number if it's in MongoDB format or string
    const ageValue = userAge && typeof userAge === 'object' && userAge.$numberInt
      ? parseInt(userAge.$numberInt)
      : typeof userAge === 'string'
        ? parseInt(userAge)
        : userAge

    const hasAge = ageValue !== null && ageValue !== undefined && !isNaN(ageValue) && ageValue > 0
    const hasGender = userGender && userGender.trim() !== ''
    const hasAddress = currentUser.address && currentUser.address.trim() !== ''

    // Match backend isProfileComplete logic: age OR dateOfBirth, gender, and address
    const hasAgeOrDateOfBirth = hasAge || (userDateOfBirth && new Date(userDateOfBirth).getTime() > 0)
    const profileComplete = hasAgeOrDateOfBirth && hasGender && hasAddress

    return profileComplete
  }, [])

  // Check if profile is complete
  useEffect(() => {
    // Don't check profile completeness while still loading user data
    if (loading || !user) {
      return
    }

    // Only refresh user data once per session to avoid infinite loops
    if (!hasRefreshedUser.current) {
      hasRefreshedUser.current = true

      // Refresh user data from backend to ensure we have latest profile data
      const refreshUserData = async () => {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/me`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const data = await response.json()
            let refreshedUser = null

            if (data.success && data.data && data.data.user) {
              refreshedUser = data.data.user
            } else if (data.success && data.user) {
              refreshedUser = data.user
            }

            if (refreshedUser) {
              // Only update if the data is actually different to prevent loops
              if (JSON.stringify(refreshedUser) !== JSON.stringify(user)) {
                updateUser(refreshedUser)
              }
              return refreshedUser
            }
          } else {
            console.error('Failed to refresh user data:', response.status, response.statusText)
          }
        } catch (error) {
          console.error('Error refreshing user data:', error)
        }
        return user
      }

      refreshUserData().then(currentUser => {
        const profileComplete = checkProfileCompleteness(currentUser)
        setIsProfileComplete(profileComplete)

        // Show modal only if profile is incomplete
        setShowProfileModal(!profileComplete)
      })
    } else {
      // Use existing user data to check profile completeness
      const profileComplete = checkProfileCompleteness(user)
      setIsProfileComplete(profileComplete)
      setShowProfileModal(!profileComplete)
    }
  }, [user, loading, updateUser, checkProfileCompleteness])

  const handleProfileComplete = (updatedUser) => {
    // Update the user context with the new data
    updateUser(updatedUser)
    setShowProfileModal(false)
    setIsProfileComplete(true)
  }

  const handleProfileModalClose = () => {
    // Don't allow closing if profile is incomplete
    if (!isProfileComplete) {
      return
    }
    setShowProfileModal(false)
  }

  const sidebarItems = [
    {
      path: '/user/dashboard',
      label: 'Overview',
      icon: LayoutDashboard
    },
    {
      path: '/user/dashboard/respiratory',
      label: 'Respiratory Wellness',
      icon: Wind
    },
    {
      path: '/user/dashboard/book-tests',
      label: 'Book Tests',
      icon: Calendar
    },
    {
      path: '/user/dashboard/upload-prescription',
      label: 'Upload Prescription',
      icon: Upload
    },
    {
      path: '/user/dashboard/bookings',
      label: 'My Bookings',
      icon: FileText
    },
    {
      path: '/user/dashboard/reports',
      label: 'Download Reports',
      icon: Download
    },
    {
      path: '/user/dashboard/profile',
      label: 'My Profile',
      icon: User
    },
    {
      path: '/user/dashboard/nearby-labs',
      label: 'Nearby Labs',
      icon: MapPin
    },
    {
      path: '/user/dashboard/healthbot',
      label: 'HealthBot',
      icon: MessageCircle
    },
    {
      path: '/user/dashboard/support',
      label: 'Support',
      icon: HelpCircle
    }
  ]

  // HealthBot Component
  const HealthBot = () => {
    // API key constant - fallback for environment variable
    const API_KEY = 'AIzaSyAywhccPmyHxbbK_D5hhM6n7tC8PnX_El0'

    const [messages, setMessages] = useState([
      {
        id: 1,
        text: "Hi! I'm HealthBot, your AI health assistant. I can help you with general health questions, explain test results, provide health tips, and answer questions about your lab reports. How can I assist you today?",
        isBot: true,
        timestamp: new Date()
      }
    ])
    const [inputMessage, setInputMessage] = useState('')
    const [isTyping, setIsTyping] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const sendMessage = async () => {
      if (!inputMessage.trim() || isLoading) return

      const userMessage = {
        id: Date.now(),
        text: inputMessage,
        isBot: false,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, userMessage])
      setInputMessage('')
      setIsTyping(true)
      setIsLoading(true)

      try {
        // Check if the question is health/laboratory related
        const healthKeywords = [
          'health', 'medical', 'doctor', 'test', 'lab', 'laboratory', 'blood', 'urine', 'symptom', 'disease', 'condition', 'medicine', 'drug', 'treatment', 'diagnosis', 'result', 'report', 'checkup', 'examination', 'prescription', 'vitamin', 'supplement', 'exercise', 'diet', 'nutrition', 'wellness', 'fitness', 'pain', 'injury', 'illness', 'covid', 'vaccine', 'immunization', 'prevention', 'screening', 'biomarker', 'cholesterol', 'diabetes', 'blood pressure', 'heart', 'cancer', 'infection', 'allergy', 'asthma', 'mental health', 'stress', 'anxiety', 'depression'
        ]

        const userQuestion = inputMessage.toLowerCase()
        const isHealthRelated = healthKeywords.some(keyword => userQuestion.includes(keyword))

        if (!isHealthRelated) {
          const redirectMessage = {
            id: Date.now() + 1,
            text: "I'm HealthBot, specialized in health and laboratory-related questions only. I can help you with:\n\n• Health questions and concerns\n• Laboratory test explanations\n• Health tips and wellness advice\n• Understanding medical reports\n• General health guidance\n\nPlease ask me something health-related, or visit the Support section for other assistance.",
            isBot: true,
            timestamp: new Date()
          }

          setTimeout(() => {
            setMessages(prev => [...prev, redirectMessage])
            setIsTyping(false)
            setIsLoading(false)
          }, 500)
          return
        }

        // Call Google Gemini API
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': API_KEY
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are HealthBot, a specialized AI health assistant for a laboratory management system. You ONLY respond to health, medical, and laboratory-related questions.

User context:
- Patient: ${user?.firstName} ${user?.lastName}
- Age: ${user?.age || 'Not specified'}
- Gender: ${user?.gender || 'Not specified'}

STRICT GUIDELINES:
1. ONLY answer health, medical, laboratory, or wellness-related questions
2. If asked about non-health topics, politely redirect to health topics
3. Be friendly, empathetic, and professional
4. Provide helpful health information and general guidance
5. Always remind users to consult healthcare professionals for medical advice
6. You can help explain lab test results if they provide them
7. Keep responses concise but informative (2-4 sentences)
8. Use simple, easy-to-understand language
9. Do not provide specific medical diagnoses or treatment recommendations
10. Always end with asking if they need help with any other health questions

User's health question: ${inputMessage}

Remember: Only respond if this is health/medical/laboratory related. If not, politely redirect to health topics.`
                  }
                ]
              }
            ]
          })
        })

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`)
        }

        const data = await response.json()
        const botResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || "I apologize, but I'm having trouble processing your request right now. Please try again or consult with a healthcare professional."

        const botMessage = {
          id: Date.now() + 1,
          text: botResponse,
          isBot: true,
          timestamp: new Date()
        }

        setTimeout(() => {
          setMessages(prev => [...prev, botMessage])
          setIsTyping(false)
          setIsLoading(false)
        }, 1000)

      } catch (error) {
        console.error('HealthBot error:', error)
        const errorMessage = {
          id: Date.now() + 1,
          text: "I'm sorry, I'm experiencing technical difficulties right now. Please try again later or consult with a healthcare professional for immediate assistance.",
          isBot: true,
          timestamp: new Date()
        }

        setTimeout(() => {
          setMessages(prev => [...prev, errorMessage])
          setIsTyping(false)
          setIsLoading(false)
        }, 1000)
      }
    }

    const handleKeyPress = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    }

    const formatTime = (date) => {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    }

    return (
      <div className="h-full flex flex-col bg-gray-50 rounded-lg shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <MessageCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">HealthBot</h2>
              <p className="text-blue-100 text-sm">Your AI Health Assistant</p>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 300px)' }}>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isBot ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.isBot
                  ? 'bg-white border border-gray-200 shadow-sm'
                  : 'bg-blue-600 text-white'
                  }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                <p className={`text-xs mt-1 ${message.isBot ? 'text-gray-500' : 'text-blue-100'
                  }`}>
                  {formatTime(message.timestamp)}
                </p>
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white rounded-b-lg">
          <div className="flex space-x-3">
            <div className="flex-1">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your health, lab results, or general wellness..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={2}
                disabled={isLoading}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <MessageCircle className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Quick Suggestions */}
          <div className="mt-3 flex flex-wrap gap-2">
            {[
              "What do my lab results mean?",
              "How to prepare for blood tests?",
              "What are normal cholesterol levels?",
              "When should I see a doctor?",
              "How to improve my health?",
              "What tests should I get regularly?"
            ].map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInputMessage(suggestion)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors"
                disabled={isLoading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="px-4 pb-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <div className="text-yellow-600">⚠️</div>
              <p className="text-xs text-yellow-800">
                <strong>Disclaimer:</strong> HealthBot provides general health information and should not replace professional medical advice. Always consult with a qualified healthcare provider for medical concerns.
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show loading state while user data is being loaded
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <DashboardLayout
        title="Patient Dashboard"
        sidebarItems={sidebarItems}
        userRole="Patient"
        userEmail={user?.email || "user@labmate360.com"}
      >
        <Routes>
          <Route path="/" element={<DashboardOverview />} />
          <Route path="respiratory" element={<RespiratoryWellness />} />
          <Route path="book-tests" element={<BookTests />} />
          <Route path="upload-prescription" element={<UploadPrescription />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="reports" element={<DownloadReports />} />
          <Route path="profile" element={<Profile />} />
          <Route path="nearby-labs" element={<NearbyLabs />} />
          <Route path="healthbot" element={<HealthBot />} />
          <Route path="support" element={<Support />} />
          <Route path="*" element={<Navigate to="/user/dashboard" replace />} />
        </Routes>
      </DashboardLayout>

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        isOpen={showProfileModal}
        onClose={handleProfileModalClose}
        onComplete={handleProfileComplete}
        user={user}
      />
    </>
  )
}

export default UserDashboard
