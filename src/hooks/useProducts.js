import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../config/firebase'

export const useProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const querySnapshot = await getDocs(collection(db, 'products'))
      const productsData = querySnapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          name: data.name || data.category || 'Product',
          category: data.category || '',
          price: data.price || 0,
          sku: data.sku || `PROD-${doc.id.substring(0, 8).toUpperCase()}`,
          description: data.description || `Handcrafted ${data.category || 'product'} by ${data.ownerName || 'local artisan'}`,
          dimensions: data.dimensions || '',
          images: data.imageUrls || (data.imageUrl ? [data.imageUrl] : []),
          color: data.color || '',
          size: data.size || '',
          discount: data.discount || 0,
          ownerName: data.ownerName || data.sellerName || '',
          ownerPhone: data.ownerPhone || data.sellerPhone || '',
          ownerEmail: data.ownerEmail || data.sellerEmail || '',
          isActive: data.isActive !== undefined ? data.isActive : true,
          createdAt: data.createdAt || '',
        }
      })
      // Only show active products on the main site
      const activeProducts = productsData.filter(p => p.isActive !== false)

      setProducts(activeProducts)
      setError(null)
    } catch (err) {
      console.error('Error fetching products:', err)
      setError(err.message)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  return { products, loading, error, refetch: fetchProducts }
}
