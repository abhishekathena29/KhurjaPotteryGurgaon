import { useState, useEffect } from 'react'
import { loadCatalogue } from '../services/catalogueApi'

export const useCategories = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCategories = async (force = false) => {
    try {
      setLoading(true)
      const catalogue = await loadCatalogue({ force })
      const categoriesData = catalogue.categories
      const categoryNames = categoriesData.map((cat) => cat.name).filter(Boolean)

      const allCategoryNames = [...new Set(categoryNames)].sort()

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

  return { categories, loading, error, refetch: () => fetchCategories(true) }
}
