import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Beaker,
  Eye,
  EyeOff,
  ArrowLeft,
  User,
  Mail,
  Lock,
  Phone,
  Microscope,
  Shield,
  CheckCircle2,
  ArrowRight,
  AlertCircle
} from 'lucide-react'
import { authAPI, setAuthToken, googleAuthAPI, checkEmailExists } from '../services/api'

import heroImg from '../assets/images/hero.png'

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [emailChecked, setEmailChecked] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  // Check for Google OAuth error in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const error = urlParams.get('error');
    if (error) {
      setErrors({ general: decodeURIComponent(error) });
    }
  }, [location.search]);

  // Debounced email checking
  useEffect(() => {
    const checkEmail = async () => {
      if (formData.email && formData.email.includes('@')) {
        setIsCheckingEmail(true);
        try {
          const exists = await checkEmailExists(formData.email);
          setEmailChecked(true);
          if (exists) {
            setErrors(prev => ({
              ...prev,
              email: 'This email is already registered.'
            }));
          } else {
            setErrors(prev => {
              const newErrors = { ...prev };
              delete newErrors.email;
              return newErrors;
            });
          }
        } catch (error) {
          console.error('Error checking email:', error);
        } finally {
          setIsCheckingEmail(false);
        }
      } else {
        setEmailChecked(false);
      }
    };

    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.email]);

  const handleGoogleSignup = () => {
    try {
      googleAuthAPI.initiateGoogleAuth();
    } catch (error) {
      console.error('Google OAuth error:', error);
      setErrors({ general: 'Failed to initiate Google authentication' });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
    validateField(name, value)
  }

  const validateField = (fieldName, value) => {
    const newErrors = { ...errors }
    switch (fieldName) {
      case 'firstName':
        if (!value.trim()) newErrors.firstName = 'Required'
        else if (value.trim().length < 2) newErrors.firstName = 'Min 2 chars'
        else delete newErrors.firstName
        break
      case 'lastName':
        if (!value.trim()) newErrors.lastName = 'Required'
        else delete newErrors.lastName
        break
      case 'email':
        if (!value.trim()) newErrors.email = 'Required'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) newErrors.email = 'Invalid format'
        else delete newErrors.email
        break
      case 'phone':
        if (!value.trim()) newErrors.phone = 'Required'
        else if (!/^[\+]?[0-9][\d]{7,15}$/.test(value.replace(/\s/g, ''))) newErrors.phone = 'Invalid format'
        else delete newErrors.phone
        break
      case 'password':
        if (!value) newErrors.password = 'Required'
        else if (value.length < 6) newErrors.password = 'Min 6 chars'
        else delete newErrors.password
        if (formData.confirmPassword) validateField('confirmPassword', formData.confirmPassword)
        break
      case 'confirmPassword':
        if (!value) newErrors.confirmPassword = 'Required'
        else if (value !== formData.password) newErrors.confirmPassword = 'No match'
        else delete newErrors.confirmPassword
        break
      default: break
    }
    setErrors(newErrors)
  }

  const validateForm = () => {
    validateField('firstName', formData.firstName)
    validateField('lastName', formData.lastName)
    validateField('email', formData.email)
    validateField('phone', formData.phone)
    validateField('password', formData.password)
    validateField('confirmPassword', formData.confirmPassword)
    return Object.keys(errors).length === 0 && emailChecked && !isCheckingEmail
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsLoading(true)
    try {
      const response = await authAPI.register(formData)
      setAuthToken(response.data.token)
      localStorage.setItem('pendingEmail', formData.email)
      navigate('/verify-email', { state: { email: formData.email } })
    } catch (error) {
      setErrors({ general: error.message || 'Registration failed.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen bg-gray-50 font-sans selection:bg-blue-100 selection:text-blue-900 flex items-center justify-center py-12 px-4 overflow-hidden">
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
        className="max-w-xl w-full relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
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

        <div className="bg-white rounded-[3rem] shadow-3xl p-10 lg:p-12 border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-bl-full -mr-20 -mt-20 opacity-50"></div>

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
            <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tighter">Join <span className="text-blue-600">LabMate360</span></h2>
            <p className="text-gray-400 mt-2 font-bold uppercase text-[10px] tracking-[0.2em]">Patient Registration Portal</p>
          </div>

          {errors.general && (
            <motion.div
              className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-8 flex items-start space-x-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <p className="text-red-700 text-sm font-bold">{errors.general}</p>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={`w-full px-5 py-4 bg-gray-50 border rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-bold text-gray-900 placeholder:text-gray-300 ${errors.firstName ? 'border-red-500' : 'border-gray-100'
                    }`}
                  placeholder="John"
                />
                {errors.firstName && <p className="mt-2 ml-1 text-[10px] font-black text-red-500 uppercase">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={`w-full px-5 py-4 bg-gray-50 border rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-bold text-gray-900 placeholder:text-gray-300 ${errors.lastName ? 'border-red-500' : 'border-gray-100'
                    }`}
                  placeholder="Doe"
                />
                {errors.lastName && <p className="mt-2 ml-1 text-[10px] font-black text-red-500 uppercase">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Email Address</label>
              <div className="relative group">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-5 py-4 bg-gray-50 border rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-bold text-gray-900 placeholder:text-gray-300 ${errors.email ? 'border-red-500' : emailChecked && !errors.email ? 'border-green-500' : 'border-gray-100'
                    }`}
                  placeholder="john.doe@example.com"
                />
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  {isCheckingEmail ? (
                    <div className="animate-spin h-5 w-5 border-2 border-blue-600/30 border-t-blue-600 rounded-full"></div>
                  ) : emailChecked && !errors.email ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <Mail className="h-5 w-5 text-gray-300 group-focus-within:text-blue-500" />
                  )}
                </div>
              </div>
              {errors.email && <p className="mt-2 ml-1 text-[10px] font-black text-red-500 uppercase">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Phone Number</label>
              <div className="relative group">
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full px-5 py-4 bg-gray-50 border rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-bold text-gray-900 placeholder:text-gray-300 ${errors.phone ? 'border-red-500' : 'border-gray-100'
                    }`}
                  placeholder="+1 (555) 000-0000"
                />
                <Phone className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300" />
              </div>
              {errors.phone && <p className="mt-2 ml-1 text-[10px] font-black text-red-500 uppercase">{errors.phone}</p>}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Password</label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-5 py-4 bg-gray-50 border rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-bold text-gray-900 placeholder:text-gray-300 ${errors.password ? 'border-red-500' : 'border-gray-100'
                      }`}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-blue-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3 ml-1">Confirm</label>
                <div className="relative group">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-5 py-4 bg-gray-50 border rounded-2xl focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all font-bold text-gray-900 placeholder:text-gray-300 ${errors.confirmPassword ? 'border-red-500' : 'border-gray-100'
                      }`}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-blue-600">
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 ml-1 py-2">
              <input type="checkbox" id="terms" required className="h-5 w-5 text-blue-600 border-gray-200 rounded-lg focus:ring-blue-500 cursor-pointer" />
              <label htmlFor="terms" className="text-[10px] font-black text-gray-500 uppercase tracking-[0.15em] cursor-pointer">
                I agree to the <span className="text-blue-600">Terms of Service</span>
              </label>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading || isCheckingEmail}
              className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-[14px] uppercase tracking-[0.2em] hover:bg-blue-700 shadow-2xl shadow-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center space-x-3"
              whileHover={{ y: -2 }}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full"></div>
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-10">
            <div className="relative mb-10">
              <div className="absolute inset-x-0 top-1/2 h-px bg-gray-100"></div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-white text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Easy Registration</span>
              </div>
            </div>

            <motion.button
              type="button"
              onClick={handleGoogleSignup}
              className="w-full bg-white border-2 border-gray-50 py-4 px-6 rounded-2xl font-black text-[12px] uppercase tracking-widest text-gray-700 hover:border-blue-100 hover:bg-blue-50/30 transition-all flex items-center justify-center space-x-4"
              whileHover={{ scale: 1.01 }}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>SignUp with Google</span>
            </motion.button>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-50 text-center">
            <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-black decoration-2 underline-offset-4 hover:underline transition-all">
                Sign In Instead
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center space-x-6 opacity-40 grayscale pointer-events-none">
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">NABL Regulated</span>
          </div>
          <div className="flex items-center space-x-2 border-l border-gray-300 pl-6">
            <Lock className="h-4 w-4" />
            <span className="text-[9px] font-black uppercase tracking-widest">Data Secure</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default SignUp
