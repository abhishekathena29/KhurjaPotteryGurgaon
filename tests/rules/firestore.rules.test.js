import test, { after, before, beforeEach } from 'node:test'
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from '@firebase/rules-unit-testing'
import { collection, doc, getDoc, getDocs, query, setDoc, where } from 'firebase/firestore'

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
    await setDoc(doc(context.firestore(), 'products', 'active'), { status: 'active', name: 'Active product' })
    await setDoc(doc(context.firestore(), 'products', 'draft'), { status: 'draft', name: 'Draft product' })
    await setDoc(doc(context.firestore(), 'orders', 'customer-order'), { userId: 'customer-1', grandTotalPaise: 10000 })
    await setDoc(doc(context.firestore(), 'publicConfig', 'commerce'), { prepaidEnabled: true })
  })
})

after(async () => environment?.cleanup())

test('public catalogue can query only active products', async () => {
  const database = environment.unauthenticatedContext().firestore()
  const snapshot = await assertSucceeds(getDocs(query(collection(database, 'products'), where('status', '==', 'active'))))
  assert.equal(snapshot.size, 1)
  await assertFails(getDoc(doc(database, 'products', 'draft')))
})

test('admin can read drafts but product mutations must use Functions', async () => {
  const database = environment.authenticatedContext('admin-1', { admin: true }).firestore()
  await assertSucceeds(getDoc(doc(database, 'products', 'draft')))
  await assertFails(setDoc(doc(database, 'products', 'new'), { status: 'active' }))
  await assertSucceeds(setDoc(doc(database, 'categories', 'mugs'), { name: 'Mugs' }))
})

test('customers can read only their own orders and cannot create authoritative orders', async () => {
  const owner = environment.authenticatedContext('customer-1').firestore()
  const other = environment.authenticatedContext('customer-2').firestore()
  await assertSucceeds(getDoc(doc(owner, 'orders', 'customer-order')))
  await assertFails(getDoc(doc(other, 'orders', 'customer-order')))
  await assertFails(setDoc(doc(owner, 'orders', 'forged'), { userId: 'customer-1', grandTotalPaise: 1 }))
})

test('public checkout configuration is readable but secured configuration is admin-only', async () => {
  const publicDatabase = environment.unauthenticatedContext().firestore()
  const adminDatabase = environment.authenticatedContext('admin-1', { admin: true }).firestore()
  await assertSucceeds(getDoc(doc(publicDatabase, 'publicConfig', 'commerce')))
  await assertFails(getDoc(doc(publicDatabase, 'commerceConfig', 'default')))
  await assertSucceeds(getDoc(doc(adminDatabase, 'commerceConfig', 'default')))
})

test('customer profile updates are limited to approved fields', async () => {
  await environment.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), 'users', 'customer-1'), { name: 'Customer', email: 'customer@example.com' })
  })
  const database = environment.authenticatedContext('customer-1').firestore()
  await assertSucceeds(setDoc(doc(database, 'users', 'customer-1'), {
    name: 'Customer', email: 'customer@example.com', address: { city: 'Gurgaon' }, updatedAt: new Date(),
  }))
  await assertFails(setDoc(doc(database, 'users', 'customer-1'), {
    name: 'Customer', email: 'changed@example.com', address: { city: 'Gurgaon' }, updatedAt: new Date(),
  }))
})
