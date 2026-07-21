import { commerceApi } from './commerceApi'

let cached = null
let cachedAt = 0
let pending = null
const cacheMilliseconds = 30_000

export const loadCatalogue = async ({ force = false } = {}) => {
  if (!force && cached && Date.now() - cachedAt < cacheMilliseconds) return cached
  if (!force && pending) return pending
  pending = commerceApi.getCatalogue()
    .then((result) => {
      cached = result
      cachedAt = Date.now()
      return result
    })
    .finally(() => { pending = null })
  return pending
}

export const invalidateCatalogue = () => {
  cached = null
  cachedAt = 0
}
