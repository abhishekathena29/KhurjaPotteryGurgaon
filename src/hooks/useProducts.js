import { useState, useEffect } from 'react'
// import { collection, getDocs } from 'firebase/firestore'
// import { db } from '../config/firebase'
import { mockProducts } from '../data/mockData'

export const useProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Using mock data for now
    setProducts(mockProducts)
    setLoading(false)
    
    // Uncomment below to use Firebase instead
    // fetchProducts()
  }, [])

  // const fetchProducts = async () => {
  //   try {
  //     setLoading(true)
  //     const querySnapshot = await getDocs(collection(db, 'products'))
  //     const productsData = querySnapshot.docs.map((doc) => ({
  //       id: doc.id,
  //       ...doc.data(),
  //     }))
  //     setProducts(productsData)
  //     setError(null)
  //   } catch (err) {
  //     console.error('Error fetching products:', err)
  //     setError(err.message)
  //     // Fallback to mock data on error
  //     setProducts(mockProducts)
  //   } finally {
  //     setLoading(false)
  //   }
  // }

  return { products, loading, error, refetch: () => setProducts(mockProducts) }
}

