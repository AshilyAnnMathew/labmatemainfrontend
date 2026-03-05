import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token')
      const userData = localStorage.getItem('user')

      if (token && userData) {
        try {
          // Set cached user immediately so the UI doesn't flash
          const cached = JSON.parse(userData)
          setUser(cached)

          // Then re-fetch fresh data from backend (picks up profileImage etc.)
          const res = await fetch(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/me`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
          if (res.ok) {
            const data = await res.json()
            if (data.success && data.data?.user) {
              const fresh = data.data.user
              // Merge id field for consistency
              fresh.id = fresh.id || fresh._id
              setUser(fresh)
              localStorage.setItem('user', JSON.stringify(fresh))
            }
          }
        } catch (error) {
          console.error('Error loading user data:', error)
          // Keep cached data — don't log out
        }
      }

      setLoading(false)
    }
    init()
  }, [])

  const login = useCallback((userData, token) => {
    setUser(userData)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }, [])

  const updateUser = useCallback((updatedUserData) => {
    setUser(updatedUserData)
    localStorage.setItem('user', JSON.stringify(updatedUserData))
  }, [])

  const isAdmin = useCallback(() => {
    return user?.role === 'admin'
  }, [user?.role])

  const isStaff = useCallback(() => {
    return ['staff', 'lab_technician', 'xray_technician'].includes(user?.role)
  }, [user?.role])

  const isUser = useCallback(() => {
    return user?.role === 'user'
  }, [user?.role])

  const isLocalAdmin = useCallback(() => {
    return user?.role === 'local_admin'
  }, [user?.role])

  const value = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    updateUser,
    isAdmin,
    isStaff,
    isUser,
    isLocalAdmin,
    isAuthenticated: !!user
  }), [user, loading, login, logout, updateUser, isAdmin, isStaff, isUser, isLocalAdmin])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
