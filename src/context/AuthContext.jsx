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
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    return cred.user
  }

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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  )
}
