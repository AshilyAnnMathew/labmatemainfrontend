import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  Calendar,
  Upload,
  FileText,
  MessageSquare,
  TestTube,
  FileSearch
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import PlaceholderPage from '../components/common/PlaceholderPage'
import AssignedBookings from './AssignedBookings'
import UploadReports from './UploadReports'
import StaffReports from './StaffReports'
import StaffPrescriptionHandling from './StaffPrescriptionHandling'
import StaffPatientCommunication from './StaffPatientCommunication'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const StaffDashboard = () => {
  const { user } = useAuth()
  const [assignedLab, setAssignedLab] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch assigned lab information
  useEffect(() => {
    const fetchAssignedLab = async () => {
      try {
        console.log('StaffDashboard - User assignedLab:', user?.assignedLab)
        if (user?.assignedLab) {
          try {
            const response = await api.labAPI.getLab(user.assignedLab)
            console.log('StaffDashboard - Lab data:', response.data)
            setAssignedLab(response.data)
          } catch (error) {
            console.error('StaffDashboard - Failed to fetch lab:', error)
            setAssignedLab(null)
          }
        } else {
          console.log('StaffDashboard - No assigned lab found')
          setAssignedLab(null)
        }
      } catch (error) {
        console.error('Error fetching assigned lab:', error)
        setAssignedLab(null)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchAssignedLab()
    } else {
      setLoading(false)
    }
  }, [user])

  const sidebarItems = [
    {
      path: '/staff/dashboard',
      label: 'Assigned Bookings',
      icon: Calendar
    },
    {
      path: '/staff/upload-reports',
      label: 'Upload Reports',
      icon: Upload
    },
    {
      path: '/staff/view-reports',
      label: 'View Reports',
      icon: FileSearch
    },
    {
      path: '/staff/prescriptions',
      label: 'Prescription Handling',
      icon: FileText
    },
    {
      path: '/staff/communication',
      label: 'Patient Communication',
      icon: MessageSquare
    }
  ]

  const AssignedBookingsPlaceholder = () => (
    <PlaceholderPage
      title="Assigned Bookings"
      description="Manage your assigned laboratory bookings and appointments"
      icon={Calendar}
      features={[
        {
          title: "Today's Schedule",
          description: "View and manage your daily appointment schedule"
        },
        {
          title: "Upcoming Appointments",
          description: "Track upcoming bookings and prepare accordingly"
        },
        {
          title: "Booking Details",
          description: "Access comprehensive patient and test information"
        },
        {
          title: "Status Updates",
          description: "Update booking status and add notes for other staff"
        }
      ]}
    />
  )


  const PrescriptionHandling = () => (
    <PlaceholderPage
      title="Prescription Handling"
      description="Process and manage patient prescriptions and test requests"
      icon={FileText}
      features={[
        {
          title: "Prescription Review",
          description: "Review and validate incoming prescriptions from doctors"
        },
        {
          title: "Test Authorization",
          description: "Authorize tests based on prescription requirements"
        },
        {
          title: "Insurance Verification",
          description: "Verify insurance coverage and authorization requirements"
        },
        {
          title: "Prior Authorization",
          description: "Handle prior authorization requests for specialized tests"
        }
      ]}
    />
  )

  const PatientCommunication = () => (
    <PlaceholderPage
      title="Patient Communication"
      description="Communicate with patients about their tests and results"
      icon={MessageSquare}
      features={[
        {
          title: "Result Notifications",
          description: "Send automated and manual notifications for test results"
        },
        {
          title: "Appointment Reminders",
          description: "Send reminders and confirmations for upcoming appointments"
        },
        {
          title: "Patient Queries",
          description: "Respond to patient questions and concerns"
        },
        {
          title: "Follow-up Care",
          description: "Coordinate follow-up appointments and additional testing"
        }
      ]}
    />
  )

  console.log('StaffDashboard rendering with user:', user)

  const AssignedOverview = ({ assignedLab }) => {
    const [loading, setLoading] = useState(true)
    const [assigned, setAssigned] = useState([])
    const [sampleCollected, setSampleCollected] = useState([])
    const [recentPublished, setRecentPublished] = useState([])

    const toDateTime = (b) => {
      const d = new Date(b.appointmentDate)
      const [hh, mm] = String(b.appointmentTime || '00:00').split(':')
      d.setHours(Number(hh || 0), Number(mm || 0), 0, 0)
      return d
    }

    useEffect(() => {
      const load = async () => {
        if (!assignedLab?._id) { setLoading(false); return }
        try {
          setLoading(true)
          console.log('StaffDashboard: Fetching bookings for lab:', assignedLab._id)

          // Fetch buckets - confirmed and pending bookings are "assigned"
          const [confirmed, pending, sc, rp] = await Promise.all([
            api.localAdminAPI.getLabBookings(assignedLab._id, 'confirmed', 1, 100),
            api.localAdminAPI.getLabBookings(assignedLab._id, 'pending', 1, 100),
            api.localAdminAPI.getLabBookings(assignedLab._id, 'sample_collected', 1, 100),
            api.localAdminAPI.getLabBookings(assignedLab._id, 'result_published', 1, 100)
          ])

          console.log('StaffDashboard: API Responses:', { confirmed, pending, sc, rp })

          // Handle different response structures
          const confirmedData = confirmed?.success ? confirmed.data : (confirmed?.data || confirmed || [])
          const pendingData = pending?.success ? pending.data : (pending?.data || pending || [])
          const sampleCollectedData = sc?.success ? sc.data : (sc?.data || sc || [])
          const publishedData = rp?.success ? rp.data : (rp?.data || rp || [])

          // Combine confirmed and pending bookings as "assigned"
          const allAssigned = [...confirmedData, ...pendingData]
          console.log('StaffDashboard: Confirmed bookings:', confirmedData)
          console.log('StaffDashboard: Pending bookings:', pendingData)
          console.log('StaffDashboard: All assigned bookings:', allAssigned)
          allAssigned.sort((a, b) => toDateTime(a) - toDateTime(b))
          setAssigned(allAssigned)

          console.log('StaffDashboard: Sample collected bookings:', sampleCollectedData)
          setSampleCollected(sampleCollectedData)

          const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
          const published = publishedData.filter(b => {
            const ts = b.updatedAt ? new Date(b.updatedAt) : toDateTime(b)
            return ts >= twoDaysAgo
          })
          console.log('StaffDashboard: Recent published bookings:', published)
          published.sort((a, b) => (b.updatedAt ? new Date(b.updatedAt) : toDateTime(b)) - (a.updatedAt ? new Date(a.updatedAt) : toDateTime(a)))
          setRecentPublished(published)
        } catch (e) {
          console.error('StaffDashboard: Error loading bookings:', e)
          setAssigned([]); setSampleCollected([]); setRecentPublished([])
        } finally {
          setLoading(false)
        }
      }
      load()
    }, [assignedLab])

    const refreshBookings = async () => {
      if (!assignedLab?._id) return;
      try {
        const [confirmed, pending, sc, rp] = await Promise.all([
          api.localAdminAPI.getLabBookings(assignedLab._id, 'confirmed', 1, 100),
          api.localAdminAPI.getLabBookings(assignedLab._id, 'pending', 1, 100),
          api.localAdminAPI.getLabBookings(assignedLab._id, 'sample_collected', 1, 100),
          api.localAdminAPI.getLabBookings(assignedLab._id, 'result_published', 1, 100)
        ]);

        const confirmedData = confirmed?.success ? confirmed.data : (confirmed?.data || confirmed || [])
        const pendingData = pending?.success ? pending.data : (pending?.data || pending || [])
        const sampleCollectedData = sc?.success ? sc.data : (sc?.data || sc || [])
        const publishedData = rp?.success ? rp.data : (rp?.data || rp || [])

        const allAssigned = [...confirmedData, ...pendingData]
        allAssigned.sort((a, b) => toDateTime(a) - toDateTime(b))
        setAssigned(allAssigned)
        setSampleCollected(sampleCollectedData)

        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        const published = publishedData.filter(b => {
          const ts = b.updatedAt ? new Date(b.updatedAt) : toDateTime(b)
          return ts >= twoDaysAgo
        })
        published.sort((a, b) => (b.updatedAt ? new Date(b.updatedAt) : toDateTime(b)) - (a.updatedAt ? new Date(a.updatedAt) : toDateTime(a)))
        setRecentPublished(published)
      } catch (e) {
        console.error('Error refreshing bookings:', e)
      }
    };

    const updateBookingStatus = async (bookingId, status) => {
      try {
        const response = await api.bookingAPI.updateBookingStatus(bookingId, { status });
        if (response.success) {
          await refreshBookings();
        }
      } catch (error) {
        console.error('Error updating booking status:', error);
        alert('Failed to update booking status');
      }
    };

    const processPayment = async (bookingId) => {
      try {
        const response = await api.bookingAPI.processPayment(bookingId);
        if (response.success) {
          await refreshBookings();
        }
      } catch (error) {
        console.error('Error processing payment:', error);
        alert('Failed to process payment');
      }
    };

    const Row = ({ b }) => (
      <tr className="hover:bg-gray-50">
        <td className="px-6 py-4">
          <div className="text-sm font-medium text-gray-900">{b.userId?.firstName} {b.userId?.lastName}</div>
          <div className="text-sm text-gray-500">{b.userId?.email}</div>
          <div className="text-sm text-gray-500">{b.userId?.phone}</div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-900">{new Date(b.appointmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
          <div className="text-sm text-gray-500">{b.appointmentTime}</div>
          <div className={`text-xs px-2 py-1 rounded-full inline-block mt-1 ${b.status === 'confirmed'
            ? 'bg-green-100 text-green-800'
            : b.status === 'sample_collected'
              ? 'bg-blue-100 text-blue-800'
              : 'bg-yellow-100 text-yellow-800'
            }`}>
            {b.status === 'confirmed' ? 'Confirmed' : b.status === 'sample_collected' ? 'Sample Collected' : 'Pending'}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="text-sm text-gray-900 flex items-center"><TestTube className="h-4 w-4 mr-1" />{(b.selectedTests || []).length} tests</div>
          <div className="text-xs text-gray-500 mt-1">
            {b.paymentMethod === 'pay_later' ? (
              <span className={`px-2 py-1 rounded-full ${b.paymentStatus === 'completed'
                ? 'bg-green-100 text-green-800'
                : 'bg-orange-100 text-orange-800'
                }`}>
                {b.paymentStatus === 'completed' ? 'Paid' : 'Pay at Lab'}
              </span>
            ) : (
              <span className={`px-2 py-1 rounded-full ${b.paymentStatus === 'completed'
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
                }`}>
                {b.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
          <div className="flex flex-col space-y-2">
            {b.status === 'pending' && (
              <button
                onClick={() => updateBookingStatus(b._id, 'confirmed')}
                className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-xs"
              >
                Confirm Booking
              </button>
            )}
            {b.status === 'confirmed' && (
              <button
                onClick={() => updateBookingStatus(b._id, 'sample_collected')}
                className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-3 py-1 rounded-md text-xs"
              >
                Mark Sample Collected
              </button>
            )}
            {b.status === 'sample_collected' && (
              <Link
                to="/staff/upload-reports"
                className="text-purple-600 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 px-3 py-1 rounded-md text-xs text-center"
              >
                Add Report/Results
              </Link>
            )}
            {b.paymentMethod === 'pay_later' && b.paymentStatus === 'pending' && (
              <button
                onClick={() => processPayment(b._id)}
                className="text-orange-600 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-md text-xs"
              >
                Process Payment
              </button>
            )}
          </div>
        </td>
      </tr>
    )

    if (loading) {
      return (
        <div className="p-8 text-center text-gray-500">Loading assigned bookings...</div>
      )
    }

    return (
      <div className="space-y-8">
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Assigned Bookings (confirmed & pending by date & time)</h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            {assigned.length === 0 ? (
              <div className="p-6 text-sm text-gray-600">No assigned bookings.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assigned.map(b => (
                    <Row key={b._id} b={b} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Sample Collected</h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            {sampleCollected.length === 0 ? (
              <div className="p-6 text-sm text-gray-600">No bookings with collected samples.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sampleCollected.map(b => (
                    <Row key={b._id} b={b} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Result Published (last 2 days)</h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
            {recentPublished.length === 0 ? (
              <div className="p-6 text-sm text-gray-600">No recent published results.</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tests</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentPublished.map(b => (
                    <Row key={b._id} b={b} />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    )
  }

  return (
    <DashboardLayout
      title={`Staff Dashboard - ${assignedLab?.name || 'Loading...'}`}
      sidebarItems={sidebarItems}
      userRole="Laboratory Staff"
      userEmail={user?.email}
    >
      <Routes>
        <Route path="/dashboard" element={<AssignedOverview assignedLab={assignedLab} />} />
        <Route path="/dashboard/" element={<AssignedOverview assignedLab={assignedLab} />} />
        <Route path="/upload-reports" element={<UploadReports />} />
        <Route path="/view-reports" element={<StaffReports />} />
        <Route path="/prescriptions" element={<StaffPrescriptionHandling />} />
        <Route path="/communication" element={<StaffPatientCommunication />} />
        <Route path="*" element={<Navigate to="/staff/dashboard" replace />} />
      </Routes>
    </DashboardLayout>
  )
}

export default StaffDashboard
