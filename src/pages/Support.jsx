import { useState } from 'react'
import {
    Phone,
    Mail,
    MapPin,
    MessageCircle,
    ChevronDown,
    ChevronUp,
    Send,
    HelpCircle,
    Clock
} from 'lucide-react'
import api from '../services/api'
import Swal from 'sweetalert2'

const Support = () => {
    const [openFaq, setOpenFaq] = useState(null)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index)
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            const user = JSON.parse(localStorage.getItem('user'))
            const submissionData = {
                ...formData,
                userId: user?._id || null
            }

            const response = await api.messageAPI.sendMessage(submissionData)

            if (response.success) {
                setSubmitted(true)
                setFormData({
                    name: '',
                    email: '',
                    subject: '',
                    message: ''
                })

                Swal.fire({
                    icon: 'success',
                    title: 'Message Sent',
                    text: 'We have received your message and will get back to you shortly.',
                    timer: 3000,
                    showConfirmButton: false
                })

                // Clear success message after 5 seconds
                setTimeout(() => setSubmitted(false), 5000)
            }
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Submission Failed',
                text: error.message || 'Failed to send message'
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const faqs = [
        {
            question: "How do I book a laboratory test?",
            answer: "Navigate to the 'Book Tests' section in your dashboard. Search for your prescribed test or select a package, choose a preferred lab, pick a date and time slot, and proceed to payment or pay at lab."
        },
        {
            question: "When will I receive my test reports?",
            answer: "Most test reports are available within 24-48 hours after sample collection. You will receive an email notification when your report is ready to download from the 'Download Reports' section."
        },
        {
            question: "Can I cancel or reschedule my booking?",
            answer: "Yes, you can cancel or reschedule upcoming appointments from the 'My Bookings' section. Please note that cancellations must be done at least 2 hours before the scheduled time."
        },
        {
            question: "What payment methods do you accept?",
            answer: "We accept all major credit/debit cards, UPI, net banking, and cash payments at the laboratory ('Pay at Lab' option)."
        },
        {
            question: "How do I upload my doctor's prescription?",
            answer: "Go to the 'Upload Prescription' page, click on the upload area to select your prescription image or PDF, and our team will verify it and suggest the required tests."
        }
    ]

    const contactMethods = [
        {
            icon: Phone,
            title: "Phone Support",
            details: "+91 98765 43210",
            description: "Mon-Sat 9am to 6pm",
            color: "bg-blue-100 text-blue-600"
        },
        {
            icon: Mail,
            title: "Email Us",
            details: "support@labmate360.com",
            description: "Response within 24 hours",
            color: "bg-green-100 text-green-600"
        },
        {
            icon: MapPin,
            title: "Visit Us",
            details: "Tech Park, Kerala",
            description: "Main Office HQ",
            color: "bg-purple-100 text-purple-600"
        }
    ]

    return (
        <div className="w-full mx-auto py-4 px-4 space-y-8 pb-8">
            {/* Header Section */}
            <div className="text-center bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                <div className="inline-flex p-3 rounded-full bg-primary-50 text-primary-600 mb-4">
                    <HelpCircle className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">How can we help you?</h1>
                <p className="text-gray-500 max-w-2xl mx-auto">
                    Need assistance with your lab tests, reports, or account? We're here to help.
                    Browse our FAQs or contact our support team directly.
                </p>
            </div>

            {/* Contact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {contactMethods.map((method, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                        <div className={`p-4 rounded-full mb-4 ${method.color}`}>
                            <method.icon className="w-6 h-6" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{method.title}</h3>
                        <p className="text-lg font-bold text-gray-800 mb-1">{method.details}</p>
                        <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* FAQ Section */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <MessageCircle className="w-5 h-5 mr-2 text-primary-600" />
                            Frequently Asked Questions
                        </h2>
                        <div className="space-y-4">
                            {faqs.map((faq, index) => (
                                <div key={index} className="border border-gray-100 rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => toggleFaq(index)}
                                        className="w-full px-6 py-4 text-left bg-white hover:bg-gray-50 flex justify-between items-center transition-colors"
                                    >
                                        <span className="font-medium text-gray-900">{faq.question}</span>
                                        {openFaq === index ? (
                                            <ChevronUp className="w-5 h-5 text-gray-400" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-gray-400" />
                                        )}
                                    </button>
                                    {openFaq === index && (
                                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
                                            <p className="text-gray-600 text-sm leading-relaxed">{faq.answer}</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Contact Form */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                            <Send className="w-5 h-5 mr-2 text-primary-600" />
                            Send us a Message
                        </h2>

                        {submitted ? (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center h-64 flex flex-col items-center justify-center">
                                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                    <Send className="w-6 h-6 text-green-600" />
                                </div>
                                <h3 className="text-green-800 font-semibold mb-2">Message Sent!</h3>
                                <p className="text-green-600 text-sm">Thank you for contacting us. We will get back to you shortly.</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                    <select
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleInputChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        required
                                    >
                                        <option value="">Select a topic</option>
                                        <option value="booking">Booking Issue</option>
                                        <option value="report">Test Report</option>
                                        <option value="payment">Payment Issue</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                                    <textarea
                                        name="message"
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        rows={4}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                        placeholder="How can we help you?"
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary-600 text-white font-medium py-2.5 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Support
