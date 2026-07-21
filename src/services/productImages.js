import { collection, doc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { backendAuthHeaders, backendUrl, parseBackendResponse } from './backendClient'
import { uploadImageToCloudinary } from '../config/cloudinary'

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

// Where product images are stored:
//   'backend'    (default) — upload through the commerce backend (local disk or
//                            Firebase Storage, per BACKEND_STORAGE_DRIVER).
//   'cloudinary'           — upload straight to Cloudinary's free tier from the
//                            browser. No paid Firebase Storage (Blaze) plan needed.
// Switchable per environment via VITE_IMAGE_UPLOAD_DRIVER.
const uploadDriver = (import.meta.env.VITE_IMAGE_UPLOAD_DRIVER || 'backend').trim().toLowerCase()

export const createProductId = () => doc(collection(db, 'products')).id

const newImageId = () =>
  globalThis.crypto?.randomUUID?.() ?? `img-${Date.now()}-${Math.random().toString(16).slice(2)}`

export const validateImageFile = (file) => {
  if (!allowedTypes.has(file.type)) throw new Error(`${file.name}: unsupported image type`)
  const maximumBytes = 10 * 1024 * 1024
  if (file.size > maximumBytes) throw new Error(`${file.name}: image must be smaller than 10 MB`)
}

// Cloudinary path: the file lives on Cloudinary, not Firebase Storage, so storagePath
// is left empty — that tells the backend not to attempt a Storage deletion for it.
const uploadViaCloudinary = async ({ file, onProgress }) => {
  const { url } = await uploadImageToCloudinary(file, { onProgress })
  return { id: newImageId(), storagePath: '', url, alt: '', sortOrder: 0 }
}

const uploadViaBackend = async ({ productId, file, onProgress }) => {
  const form = new FormData()
  form.append('image', file)
  const headers = await backendAuthHeaders()
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', backendUrl(`product-images/${encodeURIComponent(productId)}`))
    Object.entries(headers).forEach(([name, value]) => request.setRequestHeader(name, value))
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100))
    })
    request.addEventListener('load', async () => {
      try {
        const response = new Response(request.responseText, {
          status: request.status,
          headers: { 'content-type': request.getResponseHeader('content-type') || 'application/json' },
        })
        resolve(await parseBackendResponse(response))
      } catch (error) {
        reject(error)
      }
    })
    request.addEventListener('error', () => reject(new Error('Image upload could not reach the backend')))
    request.addEventListener('abort', () => reject(new Error('Image upload was cancelled')))
    request.send(form)
  })
}

export const uploadProductImage = async ({ productId, file, onProgress }) => {
  validateImageFile(file)
  if (uploadDriver === 'cloudinary') return uploadViaCloudinary({ file, onProgress })
  return uploadViaBackend({ productId, file, onProgress })
}
