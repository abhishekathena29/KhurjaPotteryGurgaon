import { useState, useEffect } from 'react'
// import { collection, getDocs } from 'firebase/firestore'
// import { db } from '../config/firebase'
import { mockCategories } from '../data/mockData'

export const useCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Using mock data for now
    setCategories(mockCategories)
    setLoading(false)
    
    // Uncomment below to use Firebase instead
    // fetchCategories()
  }, [])

  // const fetchCategories = async () => {
  //   try {
  //     setLoading(true)
  //     const querySnapshot = await getDocs(collection(db, 'categories'))
  //     const categoriesData = querySnapshot.docs.map((doc) => ({
  //       id: doc.id,
  //       ...doc.data(),
  //     }))
  //     setCategories(categoriesData.map((cat) => cat.name))
  //     setError(null)
  //   } catch (err) {
  //     console.error('Error fetching categories:', err)
  //     setError(err.message)
  //     // Fallback to mock categories
  //     setCategories(mockCategories)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  return { categories, loading, error, refetch: () => setCategories(mockCategories) }
}

