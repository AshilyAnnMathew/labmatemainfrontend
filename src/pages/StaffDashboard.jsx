import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  Calendar,
  Upload,
  FileText,
  MessageSquare,
  TestTube,
  FileSearch,
  LayoutDashboard,
  Users
} from 'lucide-react'
import DashboardLayout from '../layouts/DashboardLayout'
import PlaceholderPage from '../components/common/PlaceholderPage'
import UploadReports from './UploadReports'
import StaffReports from './StaffReports'
import StaffPrescriptionHandling from './StaffPrescriptionHandling'
import StaffPatientCommunication from './StaffPatientCommunication'
import StaffDashboardOverview from './StaffDashboardOverview'
import AssignedOverview from './AssignedOverview'
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
        if (user?.assignedLab) {
          try {
            const response = await api.labAPI.getLab(user.assignedLab)
            setAssignedLab(response.data)
          } catch (error) {
            console.error('StaffDashboard - Failed to fetch lab:', error)
            setAssignedLab(null)
          }
        } else {
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
      label: 'Overview',
      icon: LayoutDashboard
    },
    {
      path: '/staff/bookings',
      label: 'Patient Management',
      icon: Users
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

  // AssignedOverview is now imported from separate file

  return (
    <DashboardLayout
      title={`Staff Dashboard - ${assignedLab?.name || 'Loading...'}`}
      sidebarItems={sidebarItems}
      userRole="Laboratory Staff"
      userEmail={user?.email}
    >
      <Routes>
        <Route path="/dashboard" element={<StaffDashboardOverview assignedLab={assignedLab} />} />
        <Route path="/bookings" element={<AssignedOverview assignedLab={assignedLab} />} />
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
