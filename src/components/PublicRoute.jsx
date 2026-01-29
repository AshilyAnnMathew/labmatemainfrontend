import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const PublicRoute = () => {
    const { user, loading } = useAuth()

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
    }

    if (user) {
        // Redirect based on role
        if (user.role === 'admin') {
            return <Navigate to="/admin/dashboard" replace />
        } else if (['staff', 'lab_technician', 'xray_technician'].includes(user.role)) {
            return <Navigate to="/staff/dashboard" replace />
        } else if (user.role === 'local_admin') {
            return <Navigate to="/localadmin/dashboard" replace />
        } else {
            return <Navigate to="/user/dashboard" replace />
        }
    }

    return <Outlet />
}

export default PublicRoute
