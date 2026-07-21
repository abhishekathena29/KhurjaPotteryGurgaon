import { backendAuthHeaders, backendUrl, parseBackendResponse } from './backendClient'

const uploadImage = async (path, file) => {
  const body = new FormData()
  body.append('image', file)
  const response = await fetch(backendUrl(path), {
    method: 'POST',
    headers: await backendAuthHeaders(),
    body,
  })
  return parseBackendResponse(response)
}

export const uploadPaymentQr = (file) => uploadImage('payment-qr', file)

export const uploadPaymentProof = (file) => uploadImage('payment-proofs', file)

export const fetchPaymentProofObjectUrl = async (proofId) => {
  const response = await fetch(backendUrl(`payment-proofs/${encodeURIComponent(proofId)}`), {
    headers: await backendAuthHeaders(),
  })
  if (!response.ok) await parseBackendResponse(response)
  return URL.createObjectURL(await response.blob())
}
