import { useState, useEffect } from 'react'
import { normalizeProduct } from '../lib/commerce'
import { loadCatalogue } from '../services/catalogueApi'

export const useProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchProducts = async (force = false) => {
    try {
      setLoading(true)
      const catalogue = await loadCatalogue({ force })
      const productsData = catalogue.products.map((product) => normalizeProduct(product.id, product))
      const activeProducts = productsData.filter((product) => product.isActive !== false)

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

  return { products, loading, error, refetch: () => fetchProducts(true) }
}
