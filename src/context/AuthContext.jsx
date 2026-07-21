import { createContext, useContext, useState, useEffect } from 'react'
import { auth, db } from '../config/firebase'
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { adminApi } from '../services/commerceApi'

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
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdTokenResult()
          if (token.claims.admin === true) {
            setIsAdmin(true)
          } else {
            const access = await adminApi.verifyAccess()
            setIsAdmin(access.isAdmin === true)
          }
        } catch (error) {
          console.error('Could not read user permissions:', error)
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
    return cred.user
  }

  const loginAdmin = (email, password) => login(email, password)

  const signup = async (name, email, password) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if (name) {
      await updateProfile(cred.user, { displayName: name })
      // Keep local user state in sync so the name shows up immediately
      setUser({ ...cred.user })
    }
    // Store a profile record so we can show user details later
    try {
      await setDoc(doc(db, 'users', cred.user.uid), {
        name: name || '',
        email,
        createdAt: serverTimestamp(),
      })
    } catch (err) {
      // Non-fatal: auth account is created even if the profile write fails
      console.error('Error saving user profile:', err)
    }
    return cred.user
  }

  const logout = async () => {
    await signOut(auth)
  }

  const refreshPermissions = async () => {
    if (!auth.currentUser) return false
    const token = await auth.currentUser.getIdTokenResult(true)
    let nextIsAdmin = token.claims.admin === true
    if (!nextIsAdmin) {
      try {
        const access = await adminApi.verifyAccess()
        nextIsAdmin = access.isAdmin === true
      } catch {
        nextIsAdmin = false
      }
    }
    setIsAdmin(nextIsAdmin)
    return nextIsAdmin
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin,
        authLoading: loading,
        login,
        loginAdmin,
        signup,
        logout,
        refreshPermissions,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  )
}
