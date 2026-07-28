import { collection, doc } from 'firebase/firestore'
import { db } from '../config/firebase'
import { uploadImageToCloudinary } from '../config/cloudinary'

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

export const createProductId = () => doc(collection(db, 'products')).id

const newImageId = () =>
  globalThis.crypto?.randomUUID?.() ?? `img-${Date.now()}-${Math.random().toString(16).slice(2)}`

export const validateImageFile = (file) => {
  if (!allowedTypes.has(file.type)) throw new Error(`${file.name}: unsupported image type`)
  const maximumBytes = 10 * 1024 * 1024
  if (file.size > maximumBytes) throw new Error(`${file.name}: image must be smaller than 10 MB`)
}

// storagePath is always empty now — every image lives on Cloudinary, addressed by its
// public url. There is no signed delete API reachable from the browser, so replaced/removed
// product photos are not auto-deleted from Cloudinary; clean those up from the Cloudinary
// dashboard periodically if that matters to you.
export const uploadProductImage = async ({ file, onProgress }) => {
  validateImageFile(file)
  const { url } = await uploadImageToCloudinary(file, { onProgress })
  return { id: newImageId(), storagePath: '', url, alt: '', sortOrder: 0 }
}
