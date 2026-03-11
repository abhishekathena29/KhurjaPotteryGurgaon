import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../config/firebase'

export const useCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const [categoriesSnapshot, productsSnapshot] = await Promise.all([
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'products'))
      ])

      const categoriesData = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      const categoryNames = categoriesData.map((cat) => cat.name).filter(Boolean)

      const productCategories = productsSnapshot.docs
        .map((doc) => doc.data().category)
        .filter(Boolean)

      const allCategoryNames = [...new Set([...categoryNames, ...productCategories])].sort()

      if (allCategoryNames.length > 0) {
        setCategories(allCategoryNames)
      } else {
        setCategories([])
      }
      setError(null)
    } catch (err) {
      console.error('Error fetching categories:', err)
      setError(err.message)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return { categories, loading, error, refetch: fetchCategories }
}
