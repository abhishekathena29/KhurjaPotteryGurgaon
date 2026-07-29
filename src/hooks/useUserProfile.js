import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Read the stored profile document for a user (name, email, saved address...).
 */
export const getUserProfile = async (uid) => {
  if (!uid) return null
  try {
    const snap = await getDoc(doc(db, 'users', uid))
    return snap.exists() ? snap.data() : null
  } catch (err) {
    console.error('Error reading user profile:', err)
    return null
  }
}

/**
 * Save / update the user's default shipping address so it can be
 * pre-filled on the next checkout. Merges so other profile fields stay intact.
 */
export const saveUserAddress = async (uid, address) => {
  if (!uid) return
  try {
    await setDoc(doc(db, 'users', uid), { address, updatedAt: serverTimestamp() }, { merge: true })
  } catch (err) {
    console.error('Error saving address:', err)
  }
}
