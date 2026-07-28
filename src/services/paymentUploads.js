import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import { uploadImageToCloudinary } from '../config/cloudinary'
import { validateImageFile } from './productImages'

// The QR image itself has no Firestore record of its own — the caller is expected to
// persist the returned url onto commerceConfig.manualPaymentQrUrl (adminApi.updateCommerceConfig).
export const uploadPaymentQr = async (file) => {
  validateImageFile(file)
  const { url } = await uploadImageToCloudinary(file)
  return { url }
}

// Records a paymentProofUploads doc so createCheckout can validate ownership/status,
// exactly as the previous backend endpoint did before handing the order off.
export const uploadPaymentProof = async (file) => {
  validateImageFile(file)
  const uid = auth.currentUser?.uid
  if (!uid) throw new Error('You must be signed in to upload a payment screenshot.')
  const { url } = await uploadImageToCloudinary(file)
  const ref = doc(collection(db, 'paymentProofUploads'))
  await setDoc(ref, {
    ownerId: uid,
    ownerEmail: auth.currentUser.email || '',
    status: 'uploaded',
    url,
    contentType: file.type,
    originalName: file.name.slice(0, 300),
    sizeBytes: file.size,
    createdAt: serverTimestamp(),
  })
  return { id: ref.id, url }
}
