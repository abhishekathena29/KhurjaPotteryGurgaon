import test, { after, before, beforeEach } from 'node:test'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore'

let environment

before(async () => {
  environment = await initializeTestEnvironment({
    projectId: 'demo-potters-central',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

beforeEach(async () => {
  await environment.clearFirestore()
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore()
    await setDoc(doc(db, 'products', 'active'), { status: 'active', name: 'Active product', salePricePaise: 10000 })
    await setDoc(doc(db, 'products', 'draft'), { status: 'draft', name: 'Draft product' })
    await setDoc(doc(db, 'products', 'active', 'variants', 'v1'), {
      status: 'active', sku: 'PC-001', onHandQuantity: 5, reservedQuantity: 2, availableQuantity: 3, stockStatus: 'in_stock',
    })
    await setDoc(doc(db, 'orders', 'customer-order'), { userId: 'customer-1', grandTotalPaise: 10000 })
    await setDoc(doc(db, 'commerceConfig', 'default'), { prepaidEnabled: true })
    await setDoc(doc(db, 'users', 'admin-1'), { isAdmin: true })
    await setDoc(doc(db, 'users', 'customer-1'), { name: 'Customer', email: 'customer@example.com' })
    await setDoc(doc(db, 'counters', 'orderNumber'), { nextNumber: 1 })
    await setDoc(doc(db, 'paymentProofUploads', 'proof-1'), { ownerId: 'customer-1', status: 'uploaded' })
  })
})

after(async () => environment?.cleanup())

test('anyone can read the full product catalogue, including drafts and legacy-schema docs', async () => {
  const database = environment.unauthenticatedContext().firestore()
  const snapshot = await assertSucceeds(getDocs(collection(database, 'products')))
  assert.equal(snapshot.size, 2)
  await assertSucceeds(getDoc(doc(database, 'products', 'draft')))
})

test('admin can write products and categories directly; non-admin cannot', async () => {
  const admin = environment.authenticatedContext('admin-1').firestore()
  const customer = environment.authenticatedContext('customer-1').firestore()
  await assertSucceeds(getDoc(doc(admin, 'products', 'draft')))
  await assertSucceeds(setDoc(doc(admin, 'products', 'new'), { status: 'active', name: 'New' }))
  await assertSucceeds(setDoc(doc(admin, 'categories', 'mugs'), { name: 'Mugs' }))
  await assertFails(setDoc(doc(customer, 'products', 'new2'), { status: 'active', name: 'New2' }))
  await assertFails(setDoc(doc(customer, 'categories', 'plates'), { name: 'Plates' }))
})

test('customers can read only their own orders and cannot forge an authoritative order', async () => {
  const owner = environment.authenticatedContext('customer-1').firestore()
  const other = environment.authenticatedContext('customer-2').firestore()
  await assertSucceeds(getDoc(doc(owner, 'orders', 'customer-order')))
  await assertFails(getDoc(doc(other, 'orders', 'customer-order')))
  await assertFails(setDoc(doc(owner, 'orders', 'forged'), { userId: 'customer-1', grandTotalPaise: 1 }))
})

test('a customer can create a well-formed pending order for themselves only', async () => {
  const owner = environment.authenticatedContext('customer-1').firestore()
  const other = environment.authenticatedContext('customer-2').firestore()
  const wellFormed = {
    userId: 'customer-1',
    items: [{ productId: 'active', variantId: 'v1', quantity: 1, unitSalePricePaise: 10000, lineTotalPaise: 10000 }],
    subtotalPaise: 10000,
    deliveryFeePaise: 5000,
    grandTotalPaise: 15000,
    status: 'pending',
    fulfilmentStatus: 'pending',
    inventoryState: 'reserved',
    payment: { status: 'verification_pending', amountPaidPaise: 0 },
  }
  await assertSucceeds(setDoc(doc(owner, 'orders', 'new-order'), wellFormed))
  await assertFails(setDoc(doc(other, 'orders', 'new-order-2'), { ...wellFormed, userId: 'customer-1' }))
  await assertFails(setDoc(doc(owner, 'orders', 'bad-total'), { ...wellFormed, grandTotalPaise: 1 }))
  await assertFails(setDoc(doc(owner, 'orders', 'bad-status'), { ...wellFormed, status: 'confirmed' }))
})

test('only admins can transition an existing order', async () => {
  const admin = environment.authenticatedContext('admin-1').firestore()
  const owner = environment.authenticatedContext('customer-1').firestore()
  await assertFails(updateDoc(doc(owner, 'orders', 'customer-order'), { status: 'confirmed' }))
  await assertSucceeds(updateDoc(doc(admin, 'orders', 'customer-order'), { status: 'confirmed' }))
})

test('checkout can only ever increase a variant reservation within on-hand stock', async () => {
  const customer = environment.authenticatedContext('customer-1').firestore()
  await assertSucceeds(updateDoc(doc(customer, 'products', 'active', 'variants', 'v1'), {
    reservedQuantity: 3, availableQuantity: 2, stockStatus: 'in_stock', updatedAt: new Date(),
  }))
  await assertFails(updateDoc(doc(customer, 'products', 'active', 'variants', 'v1'), {
    reservedQuantity: 1, availableQuantity: 4, stockStatus: 'in_stock', updatedAt: new Date(),
  }))
  await assertFails(updateDoc(doc(customer, 'products', 'active', 'variants', 'v1'), {
    reservedQuantity: 6, availableQuantity: -1, stockStatus: 'out_of_stock', updatedAt: new Date(),
  }))
  await assertFails(updateDoc(doc(customer, 'products', 'active', 'variants', 'v1'), {
    reservedQuantity: 3, availableQuantity: 2, stockStatus: 'in_stock', sku: 'HACKED',
  }))
})

test('order counter only accepts sequential increments from a signed-in customer', async () => {
  const customer = environment.authenticatedContext('customer-1').firestore()
  await assertSucceeds(updateDoc(doc(customer, 'counters', 'orderNumber'), { nextNumber: 2 }))
  await assertFails(updateDoc(doc(customer, 'counters', 'orderNumber'), { nextNumber: 5 }))
})

test('the very first order can create the order-number counter from scratch', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    const { deleteDoc } = await import('firebase/firestore')
    await deleteDoc(doc(context.firestore(), 'counters', 'orderNumber'))
  })
  const customer = environment.authenticatedContext('customer-1').firestore()
  await assertFails(setDoc(doc(customer, 'counters', 'orderNumber'), { nextNumber: 1 }, { merge: true }))
  await assertSucceeds(setDoc(doc(customer, 'counters', 'orderNumber'), { nextNumber: 2 }, { merge: true }))
})

test('payment proof can be claimed by its owner during checkout, and reviewed only by admin', async () => {
  const admin = environment.authenticatedContext('admin-1').firestore()
  const owner = environment.authenticatedContext('customer-1').firestore()
  const other = environment.authenticatedContext('customer-2').firestore()
  await assertFails(updateDoc(doc(other, 'paymentProofUploads', 'proof-1'), { status: 'attached', orderId: 'x', orderNumber: 'ORD-1', attachedAt: new Date() }))
  await assertSucceeds(updateDoc(doc(owner, 'paymentProofUploads', 'proof-1'), { status: 'attached', orderId: 'x', orderNumber: 'ORD-1', attachedAt: new Date() }))
  await assertFails(updateDoc(doc(owner, 'paymentProofUploads', 'proof-1'), { status: 'verified' }))
  await assertSucceeds(updateDoc(doc(admin, 'paymentProofUploads', 'proof-1'), { status: 'verified' }))
})

test('commerce config is publicly readable but only admins can write it', async () => {
  const publicDatabase = environment.unauthenticatedContext().firestore()
  const customer = environment.authenticatedContext('customer-1').firestore()
  const admin = environment.authenticatedContext('admin-1').firestore()
  await assertSucceeds(getDoc(doc(publicDatabase, 'commerceConfig', 'default')))
  await assertFails(setDoc(doc(customer, 'commerceConfig', 'default'), { prepaidEnabled: false }))
  await assertSucceeds(setDoc(doc(admin, 'commerceConfig', 'default'), { prepaidEnabled: false }))
})

test('productCommercials never readable by a non-admin', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'productCommercials', 'active'), { unitCostPaise: 100, sellerPayoutPerUnitPaise: 200 })
  })
  const customer = environment.authenticatedContext('customer-1').firestore()
  const admin = environment.authenticatedContext('admin-1').firestore()
  await assertFails(getDoc(doc(customer, 'productCommercials', 'active')))
  await assertSucceeds(getDoc(doc(admin, 'productCommercials', 'active')))
})

test('admin-only operational collections (skus, productSku counter, sellerLedger, settlements, refunds, inventoryMovements) reject non-admins', async () => {
  const admin = environment.authenticatedContext('admin-1').firestore()
  const customer = environment.authenticatedContext('customer-1').firestore()
  const cases = [
    ['skus', 'PC-001', { productId: 'active', variantId: 'v1' }],
    ['counters', 'productSku', { nextNumber: 2 }],
    ['sellerLedger', 'entry-1', { sellerId: 's1', status: 'payable' }],
    ['settlements', 'settlement-1', { sellerId: 's1', status: 'approved' }],
    ['refunds', 'refund-1', { orderId: 'customer-order', status: 'pending' }],
    ['inventoryMovements', 'movement-1', { type: 'adjustment', actorId: 'admin-1' }],
  ]
  for (const [collectionName, docId, data] of cases) {
    await assertFails(setDoc(doc(customer, collectionName, docId), data))
    await assertSucceeds(setDoc(doc(admin, collectionName, docId), data))
  }
})

test('customer profile updates are limited to approved fields', async () => {
  const database = environment.authenticatedContext('customer-1').firestore()
  await assertSucceeds(setDoc(doc(database, 'users', 'customer-1'), {
    name: 'Customer', email: 'customer@example.com', address: { city: 'Gurgaon' }, updatedAt: new Date(),
  }))
  await assertFails(setDoc(doc(database, 'users', 'customer-1'), {
    name: 'Customer', email: 'changed@example.com', address: { city: 'Gurgaon' }, updatedAt: new Date(),
  }))
})
