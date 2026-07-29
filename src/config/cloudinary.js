// Cloudinary configuration from environment variables.
// Cloudinary's free tier (no credit card) hosts product images without requiring
// a paid Firebase Storage (Blaze) plan. Uploads use an *unsigned* upload preset so
// the browser can upload directly, with no backend and no secret key.
export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

export const isCloudinaryConfigured = () =>
  Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_UPLOAD_PRESET)

// Upload an image to Cloudinary using the unsigned upload preset.
// Reports upload progress and resolves to { url, publicId }.
export const uploadImageToCloudinary = (file, { onProgress } = {}) => {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      'Cloudinary is not configured. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.'
    )
  }

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`)
    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress?.(Math.round((event.loaded / event.total) * 100))
    })
    request.addEventListener('load', () => {
      try {
        const data = JSON.parse(request.responseText)
        if (request.status < 200 || request.status >= 300) {
          throw new Error(data?.error?.message || 'Image upload failed')
        }
        resolve({ url: data.secure_url, publicId: data.public_id || '' })
      } catch (error) {
        reject(error)
      }
    })
    request.addEventListener('error', () => reject(new Error('Image upload could not reach Cloudinary')))
    request.addEventListener('abort', () => reject(new Error('Image upload was cancelled')))
    request.send(formData)
  })
}
