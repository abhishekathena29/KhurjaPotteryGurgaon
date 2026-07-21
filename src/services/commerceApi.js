import { callBackend } from './backendClient'

const call = async (name, payload) => {
  try {
    return await callBackend(name, payload)
  } catch (error) {
    const details = error.details || {}
    const code = details.code || String(error.code || '').replace('functions/', '')
    const message = code === 'internal' && (!error.message || error.message === 'internal')
      ? 'The backend service failed. Verify its configuration and inspect the backend logs.'
      : error.message || 'The request could not be completed'
    const wrapped = new Error(message)
    wrapped.code = code
    wrapped.details = details
    throw wrapped
  }
}

export const commerceApi = {
  getCatalogue: () => call('getCatalogue', {}),
  createCheckout: (payload) => call('createCheckout', payload),
  submitProductRequest: (payload) => call('submitProductRequest', payload),
}

export const adminApi = {
  verifyAccess: () => call('verifyAdminAccess', {}),
  getSnapshot: (collections, includeCommerceConfig = false) => call('getAdminSnapshot', { collections, includeCommerceConfig }),
  saveProduct: (payload) => call('saveProduct', payload),
  getProduct: (productId) => call('getProductAdmin', { productId }),
  archiveProduct: (productId) => call('archiveProduct', { productId }),
  adjustInventory: (payload) => call('adjustInventory', payload),
  transitionOrder: (orderId, newStatus) => call('transitionOrder', { orderId, newStatus }),
  cancelOrder: (payload) => call('cancelOrder', payload),
  verifyManualPayment: (payload) => call('verifyManualPayment', payload),
  updateProductRequest: (payload) => call('updateProductRequest', payload),
  saveSeller: (payload) => call('saveSeller', payload),
  createSettlement: (payload) => call('createSettlement', payload),
  recordSettlementPayment: (payload) => call('recordSettlementPayment', payload),
  previewBulkProductUpdate: (payload) => call('previewBulkProductUpdate', payload),
  runBulkProductUpdate: (payload) => call('runBulkProductUpdate', payload),
  updateCommerceConfig: (payload) => call('updateCommerceConfig', payload),
  saveCategory: (payload) => call('saveCategory', payload),
  deleteCategory: (categoryId) => call('deleteCategory', { categoryId }),
  retryNotification: (notificationId) => call('retryNotification', { notificationId }),
}
