import { useEffect, useState } from 'react'
import { loadCatalogue } from '../services/catalogueApi'

export const useCommerceConfig = () => {
  const [config, setConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let active = true
    loadCatalogue().then((catalogue) => {
      if (!active) return
      setConfig(catalogue.config || null)
      setError(catalogue.config ? null : new Error('Commerce configuration is unavailable'))
    }).catch((nextError) => {
      if (active) setError(nextError)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  return { config, loading, error }
}
