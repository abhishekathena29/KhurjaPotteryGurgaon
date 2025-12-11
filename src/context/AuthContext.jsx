import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const saved = localStorage.getItem('adminAuth')
    return saved === 'true'
  })

  useEffect(() => {
    localStorage.setItem('adminAuth', isAuthenticated.toString())
  }, [isAuthenticated])

  const login = (email, password) => {
    // Hardcoded credentials
    if (email === 'admin@123' && password === 'admin123') {
      setIsAuthenticated(true)
      return true
    }
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

