import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Beaker,
  Eye,
  EyeOff,
  ArrowLeft,
  Microscope,
  Shield,
  Lock,
  User,
  ArrowRight,
  Mail
} from 'lucide-react'
import Swal from 'sweetalert2'
import { authAPI, googleAuthAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

import heroImg from '../assets/images/hero.png'

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  // Check for Google OAuth error in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const error = urlParams.get('error');
    if (error) {
      setErrors({ general: decodeURIComponent(error) });
    }
  }, [location.search]);

  const handleGoogleLogin = () => {
    try {
      googleAuthAPI.initiateGoogleAuth();
    } catch (error) {
      console.error('Google OAuth error:', error);
      setErrors({ general: 'Failed to initiate Google authentication' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}
    if (!formData.username.trim()) {
      newErrors.username = 'Username or email is required'
    }
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      return
    }
    setIsLoading(true)
    try {
      const response = await authAPI.login({
        email: formData.username,
        password: formData.password
      })
      login(response.data.user, response.data.token)
      const userRole = response.data.user.role
      if (userRole === 'admin') {
        navigate('/admin/dashboard')
      } else if (['staff', 'lab_technician', 'xray_technician'].includes(userRole)) {
        navigate('/staff/dashboard')
      } else if (userRole === 'local_admin') {
        navigate('/localadmin/dashboard')
      } else {
        navigate('/user/dashboard')
      }
    } catch (error) {
      console.error('Login error:', error)
      if (error.message && error.message.includes('blocked')) {
        await Swal.fire({
          icon: 'error',
          title: 'Account Blocked',
          text: error.message,
          confirmButtonColor: '#2563eb',
          confirmButtonText: 'OK'
        })
        setErrors({ general: error.message })
      } else if (error.message && error.message.includes('Email not verified')) {
        setErrors({
          general: 'Email not verified. Please verify your email before logging in.',
          showVerifyLink: true,
          userEmail: formData.username
        })
      } else {
        setErrors({ general: error.message || 'Login failed. Please check your credentials.' })
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-gray-50 font-sans selection:bg-blue-100 selection:text-blue-900 flex items-center justify-center py-12 px-4 shadow-inner overflow-hidden">
      {/* Blurred Landing Page Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImg} 
          alt="Background" 
          className="w-full h-full object-cover scale-105 blur-2xl opacity-40 grayscale-[20%]"
        />
        <div className="absolute inset-0 bg-white/40 backdrop-blur-sm"></div>
      </div>

      <motion.div
        className="max-w-md w-full relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Back Button */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-gray-500 hover:text-blue-600 transition-all font-black uppercase text-[11px] tracking-widest group"
          >
            <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100 mr-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </div>
            Back to Home
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[3rem] shadow-3xl p-10 lg:p-12 border border-gray-100 relative overflow-hidden">
          {/* Subtle branding element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -mr-16 -mt-16 opacity-50"></div>

          {/* Logo and Title */}
          <div className="text-center mb-10 relative">
            <motion.div
              className="flex justify-center mb-6"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
            >
              <div className="p-4 bg-blue-600 rounded-2xl shadow-xl shadow-blue-100">
                <Microscope className="h-10 w-10 text-white" />
              </div>
            </motion.div>
            <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Welcome <span className="text-blue-600">Back</span></h2>
            <p className="text-gray-400 mt-2 font-bold uppercase text-[10px] tracking-[0.2em]">Patient Portal Access</p>
          </div>

          {/* Error Message */}
          {errors.general && (
            <motion.div
              className={`rounded-2xl p-5 mb-8 border flex items-start space-x-3 ${errors.showVerifyLink
                  ? 'bg-orange-50 border-orange-100'
                  : 'bg-red-50 border-red-100'
                }`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertCircle className={`h-5 w-5 mt-0.5 flex-shrink-0 ${errors.showVerifyLink ? 'text-orange-600' : 'text-red-500'}`} />
              <div>
                <p className={`text-sm font-bold leading-relaxed ${errors.showVerifyLink ? 'text-orange-800' : 'text-red-700'
                  }`}>
                  {errors.general}
                </p>
                {errors.showVerifyLink && (
                  <Link
                    to="/verify-email"
                    state={{ email: errors.userEmail }}
                    className="mt-2 inline-flex items-center text-orange-900 underline font-black text-[11px] uppercase tracking-wider"
                  >
                    Verify Email Now <ArrowRight className="ml-1 h-3 w-3" />
                  </Link>
                )}
              </div>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Username or Email</label>
              <div className="relative group">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full px-6 py-4 bg-gray-50 border rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-bold text-gray-900 placeholder:text-gray-300 ${errors.username ? 'border-red-500' : 'border-gray-100'
                    }`}
                  placeholder="e.g. james.wilson@mail.com"
                />
                <Mail className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-focus-within:text-blue-500 transition-colors" />
              </div>
              {errors.username && <p className="mt-2 ml-1 text-xs font-black text-red-500 uppercase tracking-wide">{errors.username}</p>}
            </div>

            <div>
              <div className="flex justify-between items-center mb-3 ml-1">
                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Password</label>
                <a href="#" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Forgot?</a>
              </div>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-6 py-4 bg-gray-50 border rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-bold text-gray-900 placeholder:text-gray-300 pr-14 ${errors.password ? 'border-red-500' : 'border-gray-100'
                    }`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-blue-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="mt-2 ml-1 text-xs font-black text-red-500 uppercase tracking-wide">{errors.password}</p>}
            </div>

            <div className="flex items-center space-x-3 ml-1 py-2">
              <input type="checkbox" id="remember" className="h-5 w-5 text-blue-600 border-gray-200 rounded-lg focus:ring-blue-500 transition-all cursor-pointer" />
              <label htmlFor="remember" className="text-[11px] font-black text-gray-500 uppercase tracking-widest cursor-pointer hover:text-gray-900 transition-colors">Keep me signed in</label>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] hover:bg-blue-700 shadow-2xl shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center space-x-3"
              whileHover={{ y: -2 }}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>

          {/* Social Login */}
          <div className="mt-10">
            <div className="relative mb-10">
              <div className="absolute inset-x-0 top-1/2 h-px bg-gray-100"></div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Secure Login Options</span>
              </div>
            </div>

            <motion.button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white border-2 border-gray-50 py-4 px-6 rounded-2xl font-black text-[12px] uppercase tracking-widest text-gray-700 hover:border-blue-100 hover:bg-blue-50/30 transition-all flex items-center justify-center space-x-4 shadow-sm"
              whileHover={{ scale: 1.01 }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>Continue with Google</span>
            </motion.button>
          </div>

          {/* Footer Link */}
          <div className="mt-12 pt-8 border-t border-gray-50 text-center">
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
              New to LabMate360?{' '}
              <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-black decoration-2 underline-offset-4 hover:underline transition-all">
                Create Account
              </Link>
            </p>
          </div>
        </div>

        {/* Security Trust */}
        <div className="mt-8 flex items-center justify-center space-x-6 opacity-40 grayscale pointer-events-none">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">256-Bit SSL</span>
          </div>
          <div className="flex items-center space-x-2 border-l border-gray-300 pl-6">
            <Lock className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">End-to-end Encrypted</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

const AlertCircle = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)

export default Login
