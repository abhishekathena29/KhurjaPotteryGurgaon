import { getToken as getAppCheckToken } from 'firebase/app-check'
import { appCheck, auth } from '../config/firebase'

const baseUrl = (import.meta.env.VITE_BACKEND_API_URL || '/api').replace(/\/$/, '')

export const backendUrl = (path) => `${baseUrl}/${String(path).replace(/^\//, '')}`

export const backendAuthHeaders = async () => {
  const headers = {}
  if (auth.currentUser) {
    headers.authorization = `Bearer ${await auth.currentUser.getIdToken()}`
  }
  if (appCheck) {
    headers['x-firebase-appcheck'] = (await getAppCheckToken(appCheck, false)).token
  }
  return headers
}

const backendError = (response, payload) => {
  const source = payload?.error || {}
  const error = new Error(source.message || `Backend request failed with status ${response.status}`)
  error.code = String(source.status || source.code || response.status).toLowerCase().replaceAll('_', '-')
  error.details = source.details || null
  return error
}

const reviveFirestoreValues = (value) => {
  if (Array.isArray(value)) return value.map(reviveFirestoreValues)
  if (!value || typeof value !== 'object') return value
  if (Number.isFinite(value._seconds) && Number.isFinite(value._nanoseconds)) {
    const milliseconds = value._seconds * 1000 + Math.floor(value._nanoseconds / 1_000_000)
    return {
      seconds: value._seconds,
      nanoseconds: value._nanoseconds,
      toDate: () => new Date(milliseconds),
      toMillis: () => milliseconds,
    }
  }
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, reviveFirestoreValues(item)]))
}

export const callBackend = async (operation, data) => {
  const response = await fetch(backendUrl(`call/${operation}`), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...await backendAuthHeaders(),
    },
    body: JSON.stringify({ data }),
  })
  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.error) throw backendError(response, payload)
  return reviveFirestoreValues(payload?.result ?? payload?.data ?? payload)
}

export const parseBackendResponse = async (response) => {
  const payload = await response.json().catch(() => null)
  if (!response.ok || payload?.error) throw backendError(response, payload)
  return payload
}
