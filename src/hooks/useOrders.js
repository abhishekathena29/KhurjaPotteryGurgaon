import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../config/firebase'

/**
 * Create a new order in Firestore. Returns the new order id.
 */
export const createOrder = async (orderData) => {
  const docRef = await addDoc(collection(db, 'orders'), {
    ...orderData,
    status: orderData.status || 'pending',
    createdAt: serverTimestamp(),
  })
  return docRef.id
}

/**
 * Fetch all orders for a given user, newest first.
 * We filter by userId only (no orderBy) to avoid needing a composite
 * Firestore index, then sort on the client.
 */
export const useOrders = (userId) => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchOrders = useCallback(async () => {
    if (!userId) {
      setOrders([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const q = query(collection(db, 'orders'), where('userId', '==', userId))
      const snapshot = await getDocs(q)
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      data.sort(
        (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
      )
      setOrders(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError(err.message)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  return { orders, loading, error, refetch: fetchOrders }
}
