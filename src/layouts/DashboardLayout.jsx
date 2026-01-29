import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  Bell,
  Search,
  LayoutDashboard
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

const DashboardLayout = ({
  children,
  title,
  sidebarItems,
  userRole = 'User',
  userEmail = 'user@labmate360.com'
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  // Use user data from context or fallback to props
  const displayUserRole = user?.role || userRole
  const displayUserEmail = user?.email || userEmail

  // Get current active item label for breadcrumbs
  const currentPath = location.pathname
  const activeItem = sidebarItems.find(item => {
    if (item.path === '/user/dashboard' && currentPath === '/user/dashboard') return true
    if (item.path !== '/user/dashboard' && currentPath.includes(item.path)) return true
    return false
  })
  const pageTitle = activeItem ? activeItem.label : 'Dashboard'

  // Helper to get profile image URL
  const getProfileImageUrl = (path) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    if (path.startsWith('uploads/')) return `http://localhost:5000/${path}`
    return `http://localhost:5000/${path}`
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        initial={false}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg shadow-sm flex items-center justify-center text-white font-bold text-sm">
              LM
            </div>
            <span className="text-xl font-bold text-gray-800 tracking-tight">LabMate360</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {sidebarItems.map((item, index) => {
            const isActive =
              (item.path === '/user/dashboard' && currentPath === '/user/dashboard') ||
              (item.path !== '/user/dashboard' && currentPath.includes(item.path))

            return (
              <motion.button
                key={item.path}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                onClick={() => {
                  navigate(item.path)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 group relative ${isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 h-8 w-1 bg-primary-500 rounded-r-full" />
                )}
                <item.icon className={`h-5 w-5 ${isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-500'}`} />
                <span>{item.label}</span>
              </motion.button>
            )
          })}
        </nav>

        {/* User Profile Summary in Sidebar (Optional bottom section) */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow-sm border border-gray-200 text-primary-600 overflow-hidden">
              {user?.profileImage ? (
                <img
                  src={getProfileImageUrl(user.profileImage)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <span className={`font-bold text-sm ${user?.profileImage ? 'hidden' : 'block'}`}>{user?.firstName?.[0] || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{displayUserRole}</p>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-100 h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 z-10">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 mr-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Breadcrumbs */}
            <nav className="flex items-center text-sm font-medium text-gray-500">
              <span className="hover:text-gray-900 transition-colors cursor-pointer">Dashboard</span>
              <span className="mx-2 text-gray-300">/</span>
              <span className="text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">
                {pageTitle}
              </span>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Search (Hide on small screens) */}
            <div className="hidden md:flex relative">
              <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 w-48 transition-all"
              />
            </div>

            {/* Notification Bell */}
            <button className="relative p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-all">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border border-white"></span>
            </button>

            <div className="h-6 w-px bg-gray-200 mx-1"></div>

            {/* User Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
              >
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-medium text-sm overflow-hidden">
                  {user?.profileImage ? (
                    <img
                      src={getProfileImageUrl(user.profileImage)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  <span className={`font-medium text-sm ${user?.profileImage ? 'hidden' : 'block'}`}>{user?.firstName?.[0] || 'U'}</span>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-card border border-gray-100 py-2 z-50 origin-top-right"
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  >
                    <div className="px-4 py-3 border-b border-gray-50">
                      <p className="text-sm font-semibold text-gray-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{displayUserEmail}</p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => {
                          navigate('/user/dashboard/profile')
                          setUserMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-primary-600 transition-colors"
                      >
                        <User className="h-4 w-4" />
                        <span>My Profile</span>
                      </button>
                    </div>
                    <div className="py-1 border-t border-gray-50">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
