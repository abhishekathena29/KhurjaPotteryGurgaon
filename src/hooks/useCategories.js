import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'
import { mockCategories } from '../data/mockData'

export const useCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const querySnapshot = await getDocs(collection(db, 'categories'))
      const categoriesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      const categoryNames = categoriesData.map((cat) => cat.name).filter(Boolean)

      if (categoryNames.length > 0) {
        setCategories(categoryNames)
      } else {
        // Fall back to mock categories if Firebase is empty
        setCategories(mockCategories)
      }
      setError(null)
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError(err.message)
      // Fallback to mock categories
      setCategories(mockCategories)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return { categories, loading, error, refetch: fetchCategories }
}
