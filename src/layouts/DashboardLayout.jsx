import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  LogOut,
  User,
  ChevronDown,
  Bell,
  Search,
  LayoutDashboard,
  Microscope,
  Shield,
  Zap,
  Activity,
  Cpu,
  Layers
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import NotificationBell from '../components/NotificationBell'

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

  const displayUserRole = user?.role || userRole
  const displayUserEmail = user?.email || userEmail
  const currentPath = location.pathname

  const activeItem = sidebarItems.find(item => {
    if (item.path === '/user/dashboard' && currentPath === '/user/dashboard') return true
    if (item.path !== '/user/dashboard' && currentPath.includes(item.path)) return true
    return false
  })
  const pageTitle = activeItem ? activeItem.label : 'Dashboard'

  const getProfileImageUrl = (path) => {
    if (!path) return null
    if (path.startsWith('http')) return path
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/${path}`
  }

  return (
    <div className="min-h-screen bg-slate-50/50 flex font-sans selection:bg-slate-900 selection:text-white overflow-hidden">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-3xl transform transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] lg:translate-x-0 lg:static flex flex-col border-r border-slate-100 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        initial={false}
      >
        {/* Branding */}
        <div className="h-24 flex items-center px-8 border-b border-slate-50 bg-white">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="p-1.5 bg-slate-900 rounded-lg shadow-lg shadow-slate-200 group-hover:scale-110 transition-transform">
              <Microscope className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col -space-y-1">
              <span className="text-xl font-black text-slate-900 tracking-tighter uppercase">LABMATE <span className="text-indigo-600">360</span></span>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Neural Intel</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden ml-auto p-2.5 text-slate-400 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
          <div className="px-4 mb-4 flex items-center justify-between">
            {/* <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.35em]">Clinical Node</span> */}
            <div className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse"></div>
          </div>
          {sidebarItems.map((item, index) => {
            const isActive =
              (item.path === '/user/dashboard' && currentPath === '/user/dashboard') ||
              (item.path !== '/user/dashboard' && currentPath.includes(item.path))

            return (
              <motion.button
                key={item.path}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
                onClick={() => {
                  navigate(item.path)
                  setSidebarOpen(false)
                }}
                className={`w-full flex items-center space-x-4 px-5 py-4 text-[13px] font-black rounded-2xl transition-all group relative uppercase tracking-tighter ${isActive
                  ? 'bg-slate-900 text-white shadow-xl shadow-slate-200'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="active-pill-side"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1.5 bg-indigo-500 rounded-r-full shadow-lg shadow-indigo-200"
                  />
                )}
                <item.icon className={`h-5 w-5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-slate-500'}`} />
                <span className="tracking-widest">{item.label}</span>
                {isActive && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto"><Zap className="h-3 w-3 text-amber-400" /></motion.div>}
              </motion.button>
            )
          })}
        </nav>

        {/* User Card in Sidebar */}
        <div className="p-6 border-t border-slate-50 bg-slate-50/20">
          <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex items-center space-x-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900 font-black border border-slate-100 overflow-hidden">
              {user?.profileImage ? (
                <img
                  src={getProfileImageUrl(user.profileImage)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                />
              ) : null}
              <span className={`text-lg ${user?.profileImage ? 'hidden' : 'block'}`}>{user?.firstName?.[0] || 'U'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-black text-slate-900 truncate uppercase tracking-tighter">{user?.firstName} {user?.lastName}</p>
              <div className="flex items-center space-x-1 mt-0.5">
                <Shield className="h-3 w-3 text-indigo-400" />
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{displayUserRole}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white/90 backdrop-blur-xl border-b border-slate-100 h-24 flex items-center justify-between px-8 z-40 shrink-0">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-3 -ml-2 text-slate-400 hover:bg-slate-50 rounded-2xl transition-all border border-slate-100 shadow-sm"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Breadcrumbs / Page Title */}
            {/* <div className="flex flex-col">
              <div className="flex items-center text-[10px] font-black text-slate-400 uppercase tracking-[0.35em]">
                <span className="hover:text-slate-900 transition-colors cursor-pointer">Protocol</span>
                <span className="mx-2 opacity-30">/</span>
                <span className="text-slate-900">Node Sync</span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mt-0.5 uppercase tracking-tighter">{pageTitle}</h1>
            </div> */}
          </div>

          <div className="flex items-center space-x-8">
            {/* Action Group */}
            <div className="hidden lg:flex items-center space-x-3 bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
              <div className="px-3 py-1.5 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center space-x-2">
                <Cpu className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest">v3.1 Stable</span>
              </div>
              <div className="h-4 w-px bg-slate-200 mx-1"></div>
              <div className="px-3 py-1.5 flex items-center space-x-2">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-200"></div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Operational</span>
              </div>
            </div>

            <div className="flex items-center space-x-5">
              <NotificationBell />
              <div className="h-8 w-px bg-slate-100 hidden sm:block"></div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-3 group"
                >
                  <div className="relative">
                    <div className="w-11 h-11 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-xl shadow-slate-200 transition-all group-active:scale-95 group-hover:-rotate-3 overflow-hidden">
                      {user?.profileImage ? (
                        <img
                          src={getProfileImageUrl(user.profileImage)}
                          alt="Profile"
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                        />
                      ) : null}
                      <span className={`${user?.profileImage ? 'hidden' : 'block'}`}>{user?.firstName?.[0] || 'U'}</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                  </div>
                  <div className="hidden sm:flex flex-col items-start -space-y-0.5">
                    <span className="text-[12px] font-black text-slate-900 uppercase tracking-tight">{user?.firstName}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{displayUserRole}</span>
                      <ChevronDown className={`h-2.5 w-2.5 text-slate-400 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      className="absolute right-0 mt-6 w-72 bg-white rounded-[2.5rem] shadow-4xl border border-slate-100 p-3 z-50 origin-top-right overflow-hidden shadow-2xl shadow-slate-200"
                      initial={{ opacity: 0, scale: 0.95, y: -20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -20 }}
                    >
                      <div className="px-6 py-8 bg-slate-900 rounded-[1.8rem] mb-2 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                          <Activity size={80} />
                        </div>
                        <div className="relative z-10">
                          <p className="text-white/50 text-[9px] font-black uppercase tracking-[0.3em] mb-1">Authenticated Entity</p>
                          <p className="text-lg font-black uppercase tracking-tighter leading-none">{user?.firstName} {user?.lastName}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 truncate max-w-full opacity-60">{displayUserEmail}</p>
                        </div>
                      </div>

                      <div className="p-1 space-y-1">
                        <button
                          onClick={() => {
                            const profilePath = currentPath.startsWith('/staff') ? '/staff/profile'
                              : currentPath.startsWith('/localadmin') ? '/localadmin/dashboard/profile'
                                : currentPath.startsWith('/admin') ? '/admin/dashboard/profile'
                                  : '/user/dashboard/profile'
                            navigate(profilePath)
                            setUserMenuOpen(false)
                          }}
                          className="w-full flex items-center space-x-4 px-6 py-4 text-[11px] font-black text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all uppercase tracking-widest"
                        >
                          <User className="h-4 w-4" />
                          <span>Profile</span>
                        </button>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-4 px-6 py-4 text-[11px] font-black text-rose-500 hover:bg-rose-50 rounded-2xl transition-all uppercase tracking-widest"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-50/30 p-8 custom-scrollbar relative z-0">
          <div className="max-w-[1700px] mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default DashboardLayout
