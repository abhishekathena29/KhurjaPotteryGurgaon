import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { auth, db } from '../config/firebase'
import {
  allowedFulfilmentTransition,
  buildSearchTokens,
  calculateSalePricePaise,
  calculateSellerPayout,
  commitInventory,
  deriveStockStatus,
  formatSku,
  normalizeSku,
  releaseInventory,
  reserveInventory,
  restoreCommittedInventory,
  validateConfig,
} from '../lib/commerce'

const codedError = (message, code, details) => {
  const error = new Error(message)
  error.code = code
  if (details) error.details = details
  return error
}

const requireUid = () => {
  const uid = auth.currentUser?.uid
  if (!uid) throw codedError('You must be signed in to do this.', 'unauthenticated')
  return uid
}

const getCatalogue = async () => {
  const [productsSnap, categoriesSnap, configSnap] = await Promise.all([
    getDocs(collection(db, 'products')),
    getDocs(collection(db, 'categories')),
    getDoc(doc(db, 'commerceConfig', 'default')),
  ])
  return {
    products: productsSnap.docs.map((document) => ({ id: document.id, ...document.data() })),
    categories: categoriesSnap.docs.map((document) => ({ id: document.id, name: document.data().name })),
    config: configSnap.exists() ? configSnap.data() : null,
  }
}

const createCheckout = async ({ idempotencyKey, items, address, paymentMethod, paymentProofId }) => {
  const uid = requireUid()
  if (!items?.length) throw new Error('Your cart is empty')
  const lineKeys = items.map((item) => `${item.productId}::${item.variantId}`)
  if (new Set(lineKeys).size !== lineKeys.length) throw new Error('Duplicate cart variants are not allowed')

  const idempotencyRef = doc(db, 'checkoutIdempotency', `${uid}_${idempotencyKey}`)
  const orderRef = doc(collection(db, 'orders'))
  const configRef = doc(db, 'commerceConfig', 'default')
  const proofRef = doc(db, 'paymentProofUploads', paymentProofId)
  const counterRef = doc(db, 'counters', 'orderNumber')
  const productRefs = items.map((item) => doc(db, 'products', item.productId))
  const variantRefs = items.map((item) => doc(db, 'products', item.productId, 'variants', item.variantId))

  const result = await runTransaction(db, async (tx) => {
    const [priorSnap, configSnap, proofSnap, counterSnap] = await Promise.all([
      tx.get(idempotencyRef), tx.get(configRef), tx.get(proofRef), tx.get(counterRef),
    ])
    if (priorSnap.exists()) return { existing: true, ...priorSnap.data() }

    const products = await Promise.all(productRefs.map((ref) => tx.get(ref)))
    const variants = await Promise.all(variantRefs.map((ref) => tx.get(ref)))

    if (!configSnap.exists()) throw new Error('Commerce configuration has not been initialized')
    const config = configSnap.data()

    if (!proofSnap.exists() || proofSnap.data().ownerId !== uid || proofSnap.data().status !== 'uploaded') {
      throw codedError(
        'The payment screenshot is missing, already used, or does not belong to this customer',
        'INVALID_PAYMENT_PROOF',
      )
    }

    const lineItems = items.map((item, index) => {
      const product = products[index]
      const variant = variants[index]
      if (!product.exists() || !variant.exists() || product.data().status !== 'active' || variant.data().status !== 'active') {
        throw codedError('A cart item is no longer available', 'PRODUCT_UNAVAILABLE', { productId: item.productId })
      }
      const available = Number(variant.data().availableQuantity ?? 0)
      if (available < item.quantity) {
        throw codedError(`${product.data().name} has only ${available} available`, 'OUT_OF_STOCK', {
          productId: item.productId, variantId: item.variantId, availableQuantity: available,
        })
      }
      const salePricePaise = Number(product.data().salePricePaise)
      if (!Number.isSafeInteger(salePricePaise)) throw new Error('Product pricing is invalid')
      return {
        productId: item.productId,
        variantId: item.variantId,
        sku: variant.data().sku,
        name: product.data().name,
        selectedColor: variant.data().color,
        selectedSize: variant.data().size ?? '',
        quantity: item.quantity,
        mrpPaise: product.data().mrpPaise,
        discountPercent: product.data().discountPercent,
        unitSalePricePaise: salePricePaise,
        lineTotalPaise: salePricePaise * item.quantity,
      }
    })

    const subtotalPaise = lineItems.reduce((sum, item) => sum + item.lineTotalPaise, 0)
    if (!config.prepaidEnabled) throw codedError('Online payment is currently unavailable', 'PAYMENT_METHOD_UNAVAILABLE')
    if (!config.manualPaymentQrUrl) throw codedError('Online payment QR has not been configured', 'PAYMENT_QR_UNAVAILABLE')

    const nextOrderNumber = Number(counterSnap.data()?.nextNumber ?? 1)
    const orderNumber = formatSku(config.orderPrefix, config.orderPadding, nextOrderNumber)
    const expiresAt = Timestamp.fromMillis(Date.now() + config.manualPaymentVerificationTtlMinutes * 60_000)

    variants.forEach((variant, index) => {
      const data = variant.data()
      const balance = reserveInventory(Number(data.onHandQuantity ?? 0), Number(data.reservedQuantity ?? 0), items[index].quantity)
      tx.update(variant.ref, {
        reservedQuantity: balance.reservedQuantity,
        availableQuantity: balance.availableQuantity,
        stockStatus: balance.availableQuantity <= 0 ? 'out_of_stock' : (balance.availableQuantity <= Number(data.lowStockThreshold ?? 0) ? 'low_stock' : 'in_stock'),
        updatedAt: serverTimestamp(),
      })
    })

    const order = {
      orderNumber,
      userId: uid,
      userEmail: auth.currentUser.email || '',
      items: lineItems,
      subtotalPaise,
      deliveryFeePaise: config.deliveryFeePaise,
      discountTotalPaise: lineItems.reduce((sum, item) => sum + ((item.mrpPaise - item.unitSalePricePaise) * item.quantity), 0),
      taxTotalPaise: 0,
      grandTotalPaise: subtotalPaise + config.deliveryFeePaise,
      currency: config.currency,
      address,
      payment: {
        method: 'online',
        mode: 'manual_qr',
        status: 'verification_pending',
        amountPaidPaise: 0,
        proofId: paymentProofId,
        submittedAt: serverTimestamp(),
      },
      fulfilmentStatus: 'pending',
      status: 'pending',
      inventoryState: 'reserved',
      reservationExpiresAt: expiresAt,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      version: 1,
    }
    tx.set(orderRef, order)
    tx.update(proofRef, { status: 'attached', orderId: orderRef.id, orderNumber, attachedAt: serverTimestamp() })
    tx.set(counterRef, { nextNumber: nextOrderNumber + 1, updatedAt: serverTimestamp() }, { merge: true })
    tx.set(idempotencyRef, {
      orderId: orderRef.id,
      orderNumber,
      grandTotalPaise: order.grandTotalPaise,
      paymentMethod,
      paymentStatus: order.payment.status,
      requiresVerification: true,
      createdAt: serverTimestamp(),
    })
    tx.set(doc(collection(orderRef, 'events')), { type: 'order_created', actorId: uid, to: 'pending', createdAt: serverTimestamp() })
    items.forEach((item, index) => {
      tx.set(doc(collection(db, 'inventoryMovements')), {
        productId: item.productId,
        variantId: item.variantId,
        sku: variants[index].data().sku,
        type: 'reservation',
        quantityDelta: -item.quantity,
        orderId: orderRef.id,
        reason: 'Checkout reservation',
        actorId: uid,
        createdAt: serverTimestamp(),
      })
    })

    return { existing: false, orderId: orderRef.id, orderNumber, order }
  })

  if (result.existing) return result
  return {
    orderId: result.orderId,
    orderNumber: result.orderNumber,
    grandTotalPaise: result.order.grandTotalPaise,
    paymentMethod,
    paymentStatus: result.order.payment.status,
    requiresVerification: true,
  }
}

const submitProductRequest = async (payload) => {
  const uid = requireUid()
  const ref = doc(collection(db, 'productRequests'))
  await setDoc(ref, {
    ...payload,
    userId: uid,
    userEmail: auth.currentUser.email || '',
    status: 'new',
    assignedTo: null,
    adminNotes: '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await addDoc(collection(ref, 'events'), { type: 'submitted', actorId: uid, createdAt: serverTimestamp() })
  return { requestId: ref.id }
}

export const commerceApi = {
  getCatalogue,
  createCheckout,
  submitProductRequest,
}

// ===================== Admin: shared helpers =====================

const paymentStatusOf = (order) => order.payment?.status ?? order.paymentStatus ?? 'pending'
const fulfilmentStatusOf = (order) => order.fulfilmentStatus ?? order.status ?? 'pending'
const uniqueVariantKey = (colorId, size) => `${colorId.trim().toLowerCase()}::${size.trim().toLowerCase()}`
const slugify = (value) => value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const updateVariantSummary = (summaries, variantId, availableQuantity, stockStatus) =>
  summaries.map((summary) => (summary.id === variantId ? { ...summary, availableQuantity, stockStatus } : summary))

const aggregateProductStock = (summaries) => {
  const active = summaries.filter((summary) => summary.status === 'active')
  const availableQuantity = active.reduce((sum, summary) => sum + Number(summary.availableQuantity ?? 0), 0)
  const stockStatus = availableQuantity <= 0
    ? 'out_of_stock'
    : active.some((summary) => summary.stockStatus === 'low_stock') ? 'low_stock' : 'in_stock'
  return { availableQuantity, stockStatus }
}

const writeEvent = (tx, orderRef, type, actorId, data) => {
  tx.set(doc(collection(orderRef, 'events')), { type, actorId, ...data, createdAt: serverTimestamp() })
}

// Moves reserved -> committed stock and, since only an admin can read productCommercials,
// attaches each line's sellerId/payout rate here (at confirm time) rather than at checkout.
// Also resolves the seller docs for any attached sellers up front (as a read), since Firestore
// transactions require every read to happen before any write — a caller needing seller info
// afterward (e.g. to notify them) can't safely read sellers post-hoc in the same transaction.
const commitOrderInventory = async (tx, orderRef, order, actorId) => {
  if (order.inventoryState !== 'reserved') return { items: order.items, sellersById: new Map() }
  const variantRefs = order.items.map((item) => doc(db, 'products', item.productId, 'variants', item.variantId))
  const variants = await Promise.all(variantRefs.map((ref) => tx.get(ref)))
  const uniqueProductIds = [...new Set(order.items.map((item) => item.productId))]
  const productSnaps = await Promise.all(uniqueProductIds.map((id) => tx.get(doc(db, 'products', id))))
  const commercialSnaps = await Promise.all(uniqueProductIds.map((id) => tx.get(doc(db, 'productCommercials', id))))
  const summariesByProduct = new Map(productSnaps.map((snap) => [snap.id, snap.data()?.variantSummary ?? []]))
  const commercialsByProduct = new Map(uniqueProductIds.map((id, index) => [id, commercialSnaps[index].exists() ? commercialSnaps[index].data() : {}]))
  const uniqueSellerIds = [...new Set([...commercialsByProduct.values()].map((commercial) => commercial.sellerId).filter(Boolean))]
  const sellerSnaps = await Promise.all(uniqueSellerIds.map((id) => tx.get(doc(db, 'sellers', id))))
  const sellersById = new Map(uniqueSellerIds.map((id, index) => [id, sellerSnaps[index]]))

  const updatedItems = variants.map((variant, index) => {
    const item = order.items[index]
    if (!variant.exists()) throw codedError('Reserved product variant is missing', 'data-loss')
    const data = variant.data()
    let balance
    try {
      balance = commitInventory(Number(data.onHandQuantity), Number(data.reservedQuantity), item.quantity)
    } catch {
      throw codedError('Inventory reservation is inconsistent', 'data-loss')
    }
    const stockStatus = deriveStockStatus(balance.availableQuantity, Number(data.lowStockThreshold ?? 0))
    tx.update(variant.ref, { ...balance, stockStatus, updatedAt: serverTimestamp() })
    summariesByProduct.set(item.productId, updateVariantSummary(summariesByProduct.get(item.productId) ?? [], item.variantId, balance.availableQuantity, stockStatus))
    tx.set(doc(collection(db, 'inventoryMovements')), {
      productId: item.productId, variantId: item.variantId, sku: item.sku, type: 'sale',
      quantityDelta: -item.quantity, orderId: orderRef.id, reason: 'Order confirmed', actorId, createdAt: serverTimestamp(),
    })
    const commercial = commercialsByProduct.get(item.productId) ?? {}
    return { ...item, sellerId: commercial.sellerId ?? null, sellerPayoutPerUnitPaise: Number(commercial.sellerPayoutPerUnitPaise ?? 0) }
  })
  uniqueProductIds.forEach((productId) => {
    const variantSummary = summariesByProduct.get(productId) ?? []
    tx.update(doc(db, 'products', productId), { variantSummary, ...aggregateProductStock(variantSummary), updatedAt: serverTimestamp() })
  })
  return { items: updatedItems, sellersById }
}

const createSellerEarnings = (tx, orderRef, order) => {
  if (fulfilmentStatusOf(order) !== 'delivered' || paymentStatusOf(order) !== 'paid') return
  order.items.forEach((item) => {
    if (!item.sellerId || !item.sellerPayoutPerUnitPaise) return
    tx.set(doc(db, 'sellerLedger', `${orderRef.id}_${item.variantId}`), {
      sellerId: item.sellerId, orderId: orderRef.id, orderNumber: order.orderNumber, productId: item.productId,
      variantId: item.variantId, sku: item.sku, quantity: item.quantity, type: 'earning',
      amountPaise: item.sellerPayoutPerUnitPaise * item.quantity, currency: order.currency, status: 'payable',
      createdAt: serverTimestamp(),
    })
  })
}

// Shared by admin cancellation, manual-payment rejection, and the "release expired
// reservations" maintenance action — reverses whatever inventory state the order is in.
const releaseOrderInventory = async (orderRef, actorId, cancellation, expectedPaymentStatus) => runTransaction(db, async (tx) => {
  const snapshot = await tx.get(orderRef)
  if (!snapshot.exists()) throw codedError('Order not found', 'not-found')
  const order = snapshot.data()
  if (expectedPaymentStatus && paymentStatusOf(order) !== expectedPaymentStatus) {
    throw codedError('Payment status changed while this review was in progress. Refresh and review again.', 'failed-precondition')
  }
  if (fulfilmentStatusOf(order) === 'cancelled') return order
  if (!allowedFulfilmentTransition(fulfilmentStatusOf(order), 'cancelled')) {
    throw codedError('This order can no longer be cancelled', 'failed-precondition', { code: 'INVALID_STATUS_TRANSITION' })
  }
  const variantRefs = order.items.map((item) => doc(db, 'products', item.productId, 'variants', item.variantId))
  const variantSnaps = await Promise.all(variantRefs.map((ref) => tx.get(ref)))
  const uniqueProductIds = [...new Set(order.items.map((item) => item.productId))]
  const productSnaps = await Promise.all(uniqueProductIds.map((id) => tx.get(doc(db, 'products', id))))
  const uniqueSellerIds = [...new Set(order.items.map((item) => item.sellerId).filter(Boolean))]
  const sellerSnaps = await Promise.all(uniqueSellerIds.map((id) => tx.get(doc(db, 'sellers', id))))
  const summariesByProduct = new Map(productSnaps.map((snap) => [snap.id, snap.data()?.variantSummary ?? []]))
  const inventoryState = order.inventoryState

  variantSnaps.forEach((variant, index) => {
    if (!variant.exists()) return
    const item = order.items[index]
    const data = variant.data()
    const onHandQuantity = Number(data.onHandQuantity ?? 0)
    const reservedQuantity = Number(data.reservedQuantity ?? 0)
    const balance = inventoryState === 'reserved'
      ? releaseInventory(onHandQuantity, reservedQuantity, item.quantity)
      : inventoryState === 'committed'
        ? restoreCommittedInventory(onHandQuantity, reservedQuantity, item.quantity)
        : { onHandQuantity, reservedQuantity, availableQuantity: onHandQuantity - reservedQuantity }
    const stockStatus = deriveStockStatus(balance.availableQuantity, Number(data.lowStockThreshold ?? 0))
    tx.update(variant.ref, { ...balance, stockStatus, updatedAt: serverTimestamp() })
    summariesByProduct.set(item.productId, updateVariantSummary(summariesByProduct.get(item.productId) ?? [], item.variantId, balance.availableQuantity, stockStatus))
    tx.set(doc(collection(db, 'inventoryMovements')), {
      productId: item.productId, variantId: item.variantId, sku: item.sku, type: 'cancellation',
      quantityDelta: item.quantity, orderId: orderRef.id, reason: cancellation.reasonCode, actorId, createdAt: serverTimestamp(),
    })
  })
  uniqueProductIds.forEach((productId) => {
    const variantSummary = summariesByProduct.get(productId) ?? []
    tx.update(doc(db, 'products', productId), { variantSummary, ...aggregateProductStock(variantSummary), updatedAt: serverTimestamp() })
  })

  const update = {
    fulfilmentStatus: 'cancelled', status: 'cancelled', inventoryState: 'released',
    cancellation: { ...cancellation, cancelledBy: actorId, cancelledAt: serverTimestamp() },
    updatedAt: serverTimestamp(),
  }
  if (paymentStatusOf(order) === 'paid') {
    update['payment.refundStatus'] = 'required'
    tx.set(doc(collection(db, 'refunds')), {
      orderId: orderRef.id, orderNumber: order.orderNumber,
      amountPaise: order.payment?.amountPaidPaise ?? order.grandTotalPaise, currency: order.currency,
      status: 'pending', reasonCode: cancellation.reasonCode, createdAt: serverTimestamp(),
    })
  }
  tx.update(orderRef, update)
  writeEvent(tx, orderRef, 'order_cancelled', actorId, { from: fulfilmentStatusOf(order), to: 'cancelled', reasonCode: cancellation.reasonCode })
  tx.set(doc(collection(db, 'notifications')), {
    type: 'order_cancelled', status: 'pending', orderId: orderRef.id, orderNumber: order.orderNumber,
    recipient: { email: order.userEmail ?? null, phone: order.address?.phone ?? null },
    payload: { customerName: order.address?.fullName ?? null, customerMessage: cancellation.customerMessage ?? null, paymentStatus: paymentStatusOf(order) },
    attempts: 0, createdAt: serverTimestamp(),
  })
  sellerSnaps.forEach((seller) => {
    if (!seller.exists()) return
    tx.set(doc(collection(db, 'notifications')), {
      type: 'seller_order_cancelled', status: 'pending', orderId: orderRef.id, orderNumber: order.orderNumber, sellerId: seller.id,
      recipient: { email: seller.data().email ?? null, phone: seller.data().phone ?? null, channels: seller.data().notificationChannels ?? [] },
      payload: {
        sellerName: seller.data().name ?? null, reasonCode: cancellation.reasonCode ?? null,
        items: order.items.filter((item) => item.sellerId === seller.id).map((item) => ({ sku: item.sku, name: item.name, quantity: item.quantity })),
      },
      attempts: 0, createdAt: serverTimestamp(),
    })
  })
  order.items.forEach((item) => {
    tx.set(doc(db, 'sellerLedger', `${orderRef.id}_${item.variantId}`), {
      status: 'reversed', reversedAt: serverTimestamp(), reversalReason: cancellation.reasonCode,
    }, { merge: true })
  })
  return { ...order, ...update }
})

// ===================== Admin: reads =====================

const adminCollectionNames = ['products', 'categories', 'sellers', 'orders', 'productRequests', 'notifications', 'sellerLedger', 'settlements']

const getSnapshot = async (collections = [], includeCommerceConfig = false) => {
  const unique = [...new Set(collections)].filter((name) => adminCollectionNames.includes(name))
  const snapshots = await Promise.all(unique.map((name) => getDocs(collection(db, name))))
  const result = {}
  unique.forEach((name, index) => {
    result[name] = snapshots[index].docs.map((document) => ({ id: document.id, ...document.data() }))
  })
  if (includeCommerceConfig) {
    const configSnap = await getDoc(doc(db, 'commerceConfig', 'default'))
    result.commerceConfig = configSnap.exists() ? configSnap.data() : null
  }
  return result
}

const getProduct = async (productId) => {
  const [productSnap, variantsSnap, commercialsSnap] = await Promise.all([
    getDoc(doc(db, 'products', productId)),
    getDocs(collection(db, 'products', productId, 'variants')),
    getDoc(doc(db, 'productCommercials', productId)),
  ])
  if (!productSnap.exists()) throw codedError('Product not found', 'not-found')
  if (variantsSnap.empty && productSnap.data().schemaVersion !== 2) {
    throw codedError(
      'This product is still in the old pre-variant format and needs to be re-created in the current editor before it can be edited here.',
      'failed-precondition',
    )
  }
  return {
    id: productSnap.id,
    ...productSnap.data(),
    variants: variantsSnap.docs.map((document) => ({ id: document.id, ...document.data() })),
    commercials: commercialsSnap.exists() ? commercialsSnap.data() : {},
  }
}

// ===================== Admin: categories =====================

const saveCategory = async ({ id: categoryId, name }) => {
  const normalizedName = name.trim().toLowerCase()
  const duplicates = await getDocs(query(collection(db, 'categories'), where('normalizedName', '==', normalizedName)))
  if (duplicates.docs.some((document) => document.id !== categoryId)) {
    throw codedError('A category with this name already exists', 'already-exists')
  }
  const ref = categoryId ? doc(db, 'categories', categoryId) : doc(collection(db, 'categories'))
  const existing = categoryId ? await getDoc(ref) : null
  await setDoc(ref, {
    name: name.trim(),
    normalizedName,
    createdAt: existing?.data()?.createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true })
  return { categoryId: ref.id }
}

const deleteCategory = async (categoryId) => {
  const ref = doc(db, 'categories', categoryId)
  const [category, products] = await Promise.all([
    getDoc(ref),
    getDocs(query(collection(db, 'products'), where('categoryId', '==', categoryId))),
  ])
  if (!category.exists()) throw codedError('Category not found', 'not-found')
  if (!products.empty) throw codedError('Move or archive products in this category before deleting it', 'failed-precondition')
  await deleteDoc(ref)
  return { categoryId }
}

// ===================== Admin: products =====================

const saveProduct = async (input) => {
  const uid = requireUid()
  const productId = input.id || doc(collection(db, 'products')).id
  const productRef = doc(db, 'products', productId)
  const existingVariantsSnap = await getDocs(collection(db, 'products', productId, 'variants'))
  const existingVariantIds = [...new Set(existingVariantsSnap.docs.map((document) => document.id))]

  const variants = input.variants.map((variant) => ({
    ...variant,
    id: variant.id || doc(collection(db, 'products', productId, 'variants')).id,
  }))
  const combinations = variants.map((variant) => uniqueVariantKey(variant.color.id, variant.size ?? ''))
  if (new Set(combinations).size !== combinations.length) {
    throw codedError('Each colour and size combination must be unique', 'invalid-argument')
  }
  if (input.status === 'active' && input.images.length === 0) {
    throw codedError('An active product requires at least one image', 'failed-precondition')
  }

  return runTransaction(db, async (tx) => {
    const configRef = doc(db, 'commerceConfig', 'default')
    const categoryRef = doc(db, 'categories', input.categoryId)
    const counterRef = doc(db, 'counters', 'productSku')
    const existingVariantRefs = existingVariantIds.map((id) => doc(db, 'products', productId, 'variants', id))

    const [configSnap, existingProductSnap, categorySnap, counterSnap, ...existingVariantSnaps] = await Promise.all([
      tx.get(configRef), tx.get(productRef), tx.get(categoryRef), tx.get(counterRef),
      ...existingVariantRefs.map((ref) => tx.get(ref)),
    ])
    if (!configSnap.exists()) throw new Error('Commerce configuration has not been initialized')
    const config = configSnap.data()
    if (!categorySnap.exists()) throw codedError('Selected category no longer exists', 'failed-precondition')
    if (input.sellerId) {
      const sellerSnap = await tx.get(doc(db, 'sellers', input.sellerId))
      if (!sellerSnap.exists() || sellerSnap.data().status === 'archived') {
        throw codedError('Selected seller is unavailable', 'failed-precondition')
      }
    }

    let nextSku = Number(counterSnap.data()?.nextNumber ?? 1)
    const prepared = []
    const claims = []
    for (const variant of variants) {
      let displaySku = normalizeSku(variant.sku ?? '')
      let claimRef
      let claimSnap
      if (displaySku) {
        claimRef = doc(db, 'skus', displaySku)
        claimSnap = await tx.get(claimRef)
      } else {
        do {
          displaySku = formatSku(config.skuPrefix, config.skuPadding, nextSku++)
          claimRef = doc(db, 'skus', displaySku)
          claimSnap = await tx.get(claimRef)
        } while (claimSnap.exists())
      }
      prepared.push({ ...variant, sku: displaySku })
      claims.push({ ref: claimRef, snap: claimSnap })
    }
    if (new Set(prepared.map((variant) => variant.sku)).size !== prepared.length) {
      throw codedError('Duplicate SKUs were supplied for this product', 'already-exists')
    }
    claims.forEach((claim, index) => {
      const variant = prepared[index]
      if (claim.snap.exists() && (claim.snap.data().productId !== productId || claim.snap.data().variantId !== variant.id)) {
        throw codedError(`SKU ${variant.sku} is already in use`, 'already-exists', { code: 'SKU_ALREADY_EXISTS', sku: variant.sku })
      }
    })

    const existingById = new Map(existingVariantSnaps.map((snap) => [snap.id, snap.data()]))
    const newIds = new Set(prepared.map((variant) => variant.id))
    const salePricePaise = calculateSalePricePaise(input.mrpPaise, input.discountPercent)
    const variantSummary = prepared.map((variant) => {
      const previous = existingById.get(variant.id)
      const reservedQuantity = Number(previous?.reservedQuantity ?? 0)
      if (variant.onHandQuantity < reservedQuantity) {
        throw codedError(`Stock for ${variant.sku} cannot be below its reserved quantity`, 'failed-precondition')
      }
      const availableQuantity = variant.onHandQuantity - reservedQuantity
      return {
        id: variant.id, sku: variant.sku, color: variant.color, size: variant.size, status: variant.status,
        imageIds: variant.imageIds, availableQuantity, stockStatus: deriveStockStatus(availableQuantity, variant.lowStockThreshold ?? 0),
      }
    })
    const activeVariants = variantSummary.filter((variant) => variant.status === 'active')
    const availableQuantity = activeVariants.reduce((sum, variant) => sum + variant.availableQuantity, 0)
    const lowStockThreshold = prepared.reduce((sum, variant) => sum + (variant.lowStockThreshold ?? 0), 0)

    existingVariantSnaps.forEach((snap) => {
      if (!newIds.has(snap.id)) {
        const oldSku = snap.data().sku
        if (oldSku) tx.delete(doc(db, 'skus', normalizeSku(oldSku)))
        tx.delete(snap.ref)
      }
    })
    prepared.forEach((variant, index) => {
      const previous = existingById.get(variant.id)
      if (previous?.sku && normalizeSku(previous.sku) !== variant.sku) {
        tx.delete(doc(db, 'skus', normalizeSku(previous.sku)))
      }
      const summary = variantSummary[index]
      tx.set(doc(db, 'products', productId, 'variants', variant.id), {
        ...variant,
        reservedQuantity: Number(previous?.reservedQuantity ?? 0),
        availableQuantity: summary.availableQuantity,
        stockStatus: summary.stockStatus,
        createdAt: previous?.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      tx.set(claims[index].ref, {
        displaySku: variant.sku, productId, variantId: variant.id,
        createdAt: claims[index].snap.data()?.createdAt ?? serverTimestamp(),
      })
      const previousOnHand = Number(previous?.onHandQuantity ?? 0)
      if (previousOnHand !== variant.onHandQuantity) {
        tx.set(doc(collection(db, 'inventoryMovements')), {
          productId, variantId: variant.id, sku: variant.sku,
          type: previous ? 'adjustment' : 'opening',
          quantityDelta: variant.onHandQuantity - previousOnHand,
          reason: previous ? 'Product editor stock adjustment' : 'Opening stock',
          actorId: uid, createdAt: serverTimestamp(),
        })
      }
    })

    const sellerPayoutPerUnitPaise = calculateSellerPayout(input.sellerPayoutType ?? 'fixed', input.sellerPayoutValue ?? 0, salePricePaise)
    tx.set(productRef, {
      name: input.name, slug: slugify(input.name), description: input.description, dimensions: input.dimensions,
      categoryId: input.categoryId, categoryName: input.categoryName, mrpPaise: input.mrpPaise,
      discountPercent: input.discountPercent, salePricePaise, currency: config.currency, images: input.images,
      variantSummary, availableQuantity, stockStatus: deriveStockStatus(availableQuantity, lowStockThreshold),
      status: input.status, merchandising: input.merchandising,
      salesMetrics: existingProductSnap.data()?.salesMetrics ?? { unitsSold: 0, revenuePaise: 0, bestSellerRank: null },
      searchTokens: buildSearchTokens([
        input.name, input.description, input.categoryName,
        ...prepared.flatMap((variant) => [variant.sku, variant.color.name, variant.size]),
      ]),
      createdAt: existingProductSnap.data()?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: existingProductSnap.data()?.createdBy ?? uid,
      updatedBy: uid,
      schemaVersion: 2,
    })
    tx.set(doc(db, 'productCommercials', productId), {
      sellerId: input.sellerId || null, sellerPayoutType: input.sellerPayoutType ?? 'fixed',
      sellerPayoutValue: input.sellerPayoutValue ?? 0, sellerPayoutPerUnitPaise,
      unitCostPaise: input.unitCostPaise ?? 0, packagingCostPaise: input.packagingCostPaise ?? 0,
      updatedAt: serverTimestamp(), updatedBy: uid,
    })
    if (nextSku !== Number(counterSnap.data()?.nextNumber ?? 1)) {
      tx.set(counterRef, { nextNumber: nextSku, updatedAt: serverTimestamp() }, { merge: true })
    }
    return { productId, variants: prepared.map(({ id, sku }) => ({ id, sku })) }
  })
}

const archiveProduct = async (productId) => {
  const uid = requireUid()
  await updateDoc(doc(db, 'products', productId), { status: 'archived', updatedAt: serverTimestamp(), updatedBy: uid })
  return { productId }
}

const adjustInventory = async ({ productId, variantId, quantityDelta, reason }) => {
  const uid = requireUid()
  await runTransaction(db, async (tx) => {
    const variantRef = doc(db, 'products', productId, 'variants', variantId)
    const productRef = doc(db, 'products', productId)
    const [variant, product] = await Promise.all([tx.get(variantRef), tx.get(productRef)])
    if (!variant.exists() || !product.exists()) throw codedError('Product variant not found', 'not-found')
    const onHandQuantity = Number(variant.data().onHandQuantity ?? 0) + quantityDelta
    const reservedQuantity = Number(variant.data().reservedQuantity ?? 0)
    if (onHandQuantity < reservedQuantity || onHandQuantity < 0) {
      throw codedError('Adjustment would make stock lower than reserved stock', 'failed-precondition')
    }
    const availableQuantity = onHandQuantity - reservedQuantity
    const stockStatus = deriveStockStatus(availableQuantity, Number(variant.data().lowStockThreshold ?? 0))
    tx.update(variantRef, { onHandQuantity, availableQuantity, stockStatus, updatedAt: serverTimestamp() })
    const summaries = (product.data().variantSummary ?? []).map((item) =>
      item.id === variantId ? { ...item, availableQuantity, stockStatus } : item)
    tx.update(productRef, { variantSummary: summaries, ...aggregateProductStock(summaries), updatedAt: serverTimestamp(), updatedBy: uid })
    tx.set(doc(collection(db, 'inventoryMovements')), {
      productId, variantId, quantityDelta, reason, sku: variant.data().sku, type: 'adjustment', actorId: uid, createdAt: serverTimestamp(),
    })
  })
  return { success: true }
}

// ===================== Admin: orders =====================

const transitionOrder = async (orderId, newStatus) => {
  const uid = requireUid()
  const orderRef = doc(db, 'orders', orderId)
  await runTransaction(db, async (tx) => {
    const snapshot = await tx.get(orderRef)
    if (!snapshot.exists()) throw codedError('Order not found', 'not-found')
    const order = snapshot.data()
    const currentStatus = fulfilmentStatusOf(order)
    if (!allowedFulfilmentTransition(currentStatus, newStatus)) {
      throw codedError(`Cannot move order from ${currentStatus} to ${newStatus}`, 'failed-precondition', { code: 'INVALID_STATUS_TRANSITION' })
    }
    if (newStatus === 'confirmed' && order.payment?.method === 'online' && paymentStatusOf(order) !== 'paid') {
      throw codedError('Online payment must be manually verified before this order can be confirmed', 'failed-precondition', { code: 'PAYMENT_VERIFICATION_REQUIRED' })
    }
    let items = order.items
    if (newStatus === 'confirmed' && order.inventoryState === 'reserved') {
      ({ items } = await commitOrderInventory(tx, orderRef, order, uid))
    }
    tx.update(orderRef, {
      items, fulfilmentStatus: newStatus, status: newStatus,
      ...(newStatus === 'confirmed' ? { inventoryState: 'committed' } : {}),
      updatedAt: serverTimestamp(), version: increment(1),
    })
    writeEvent(tx, orderRef, 'fulfilment_status_changed', uid, { from: currentStatus, to: newStatus })
    if (newStatus === 'delivered') createSellerEarnings(tx, orderRef, { ...order, items, fulfilmentStatus: newStatus, status: newStatus })
  })
  return { orderId, fulfilmentStatus: newStatus }
}

const cancelOrder = async (payload) => {
  const uid = requireUid()
  await releaseOrderInventory(doc(db, 'orders', payload.orderId), uid, {
    reasonCode: payload.reasonCode, customerMessage: payload.customerMessage, internalNote: payload.internalNote || '',
  })
  return { orderId: payload.orderId, fulfilmentStatus: 'cancelled' }
}

const verifyManualPayment = async ({ orderId, decision, reference = '', customerMessage = '', internalNote = '' }) => {
  const uid = requireUid()
  const orderRef = doc(db, 'orders', orderId)

  if (decision === 'reject') {
    const before = await getDoc(orderRef)
    if (!before.exists()) throw codedError('Order not found', 'not-found')
    const beforeOrder = before.data()
    if (beforeOrder.payment?.method !== 'online' || beforeOrder.payment?.mode !== 'manual_qr' || !beforeOrder.payment?.proofId) {
      throw codedError('This is not a manual online payment order', 'failed-precondition')
    }
    if (paymentStatusOf(beforeOrder) !== 'verification_pending') {
      throw codedError('This payment is not awaiting verification', 'failed-precondition')
    }
    const order = await releaseOrderInventory(orderRef, uid, { reasonCode: 'payment_issue', customerMessage, internalNote }, 'verification_pending')
    const batch = writeBatch(db)
    batch.update(orderRef, {
      'payment.status': 'rejected', 'payment.reviewedAt': serverTimestamp(), 'payment.reviewedBy': uid,
      'payment.reviewNote': internalNote, updatedAt: serverTimestamp(), version: increment(1),
    })
    batch.set(doc(db, 'paymentProofUploads', order.payment.proofId), { status: 'rejected', reviewedAt: serverTimestamp(), reviewedBy: uid }, { merge: true })
    await batch.commit()
    return { orderId, paymentStatus: 'rejected', fulfilmentStatus: 'cancelled' }
  }

  await runTransaction(db, async (tx) => {
    const snapshot = await tx.get(orderRef)
    if (!snapshot.exists()) throw codedError('Order not found', 'not-found')
    const order = snapshot.data()
    if (order.payment?.method !== 'online' || order.payment?.mode !== 'manual_qr' || !order.payment?.proofId) {
      throw codedError('This is not a manual online payment order', 'failed-precondition')
    }
    if (fulfilmentStatusOf(order) === 'cancelled') throw codedError('A cancelled order cannot be approved', 'failed-precondition')
    if (paymentStatusOf(order) === 'paid') return
    if (paymentStatusOf(order) !== 'verification_pending') throw codedError('This payment is not awaiting verification', 'failed-precondition')
    if (fulfilmentStatusOf(order) !== 'pending') throw codedError('Only pending orders can be approved', 'failed-precondition')

    const { items, sellersById } = await commitOrderInventory(tx, orderRef, order, uid)

    const payment = {
      ...order.payment, status: 'paid', amountPaidPaise: order.grandTotalPaise, reference,
      paidAt: serverTimestamp(), reviewedAt: serverTimestamp(), reviewedBy: uid, reviewNote: internalNote,
    }
    tx.update(orderRef, {
      items, payment, fulfilmentStatus: 'confirmed', status: 'confirmed', inventoryState: 'committed',
      updatedAt: serverTimestamp(), version: increment(1),
    })
    tx.set(doc(db, 'paymentProofUploads', order.payment.proofId), { status: 'verified', reviewedAt: serverTimestamp(), reviewedBy: uid }, { merge: true })
    writeEvent(tx, orderRef, 'manual_payment_verified', uid, { paymentStatus: 'paid', fulfilmentStatus: 'confirmed', reference })
    tx.set(doc(collection(db, 'notifications')), {
      type: 'payment_verified', status: 'pending', orderId, orderNumber: order.orderNumber,
      recipient: { email: order.userEmail ?? null, phone: order.address?.phone ?? null },
      payload: { customerName: order.address?.fullName ?? null, paymentStatus: 'paid', fulfilmentStatus: 'confirmed' },
      attempts: 0, createdAt: serverTimestamp(),
    })
    sellersById.forEach((seller, sellerId) => {
      if (!seller.exists()) return
      tx.set(doc(collection(db, 'notifications')), {
        type: 'seller_new_order', status: 'pending', orderId, orderNumber: order.orderNumber, sellerId,
        recipient: { email: seller.data().email ?? null, phone: seller.data().phone ?? null, channels: seller.data().notificationChannels ?? [] },
        payload: { sellerName: seller.data().name ?? null, items: items.filter((item) => item.sellerId === sellerId).map((item) => ({ sku: item.sku, name: item.name, quantity: item.quantity })) },
        attempts: 0, createdAt: serverTimestamp(),
      })
    })
  })
  return { orderId, paymentStatus: 'paid', fulfilmentStatus: 'confirmed' }
}

const updateProductRequest = async ({ requestId, status, assignedTo = '', adminNotes = '', customerMessage = '' }) => {
  const uid = requireUid()
  const ref = doc(db, 'productRequests', requestId)
  await runTransaction(db, async (tx) => {
    const snapshot = await tx.get(ref)
    if (!snapshot.exists()) throw codedError('Product request not found', 'not-found')
    tx.update(ref, { status, assignedTo: assignedTo || null, adminNotes, updatedAt: serverTimestamp(), updatedBy: uid })
    tx.set(doc(collection(ref, 'events')), { type: 'status_changed', from: snapshot.data().status, to: status, customerMessage, actorId: uid, createdAt: serverTimestamp() })
    if (customerMessage) {
      tx.set(doc(collection(db, 'notifications')), {
        type: 'product_request_updated', status: 'pending', requestId,
        recipient: { email: snapshot.data().userEmail ?? null, phone: snapshot.data().contactNumber ?? null },
        payload: { customerName: snapshot.data().name ?? null, status, customerMessage: customerMessage ?? null }, attempts: 0, createdAt: serverTimestamp(),
      })
    }
  })
  return { requestId, status }
}

// ===================== Admin: sellers & settlements =====================

const saveSeller = async ({ id: sellerId, ...data }) => {
  const uid = requireUid()
  const ref = sellerId ? doc(db, 'sellers', sellerId) : doc(collection(db, 'sellers'))
  await setDoc(ref, { ...data, updatedAt: serverTimestamp(), updatedBy: uid, createdAt: serverTimestamp() }, { merge: true })
  return { sellerId: ref.id }
}

const createSettlement = async ({ sellerId, entryIds, adjustmentsPaise = 0, adjustmentNote = '' }) => {
  const uid = requireUid()
  const settlementRef = doc(collection(db, 'settlements'))
  await runTransaction(db, async (tx) => {
    const seller = await tx.get(doc(db, 'sellers', sellerId))
    const entryRefs = entryIds.map((id) => doc(db, 'sellerLedger', id))
    const entries = await Promise.all(entryRefs.map((ref) => tx.get(ref)))
    if (!seller.exists()) throw codedError('Seller not found', 'not-found')
    let grossEarningsPaise = 0
    entries.forEach((entry) => {
      if (!entry.exists() || entry.data().sellerId !== sellerId || entry.data().status !== 'payable') {
        throw codedError('One or more ledger entries are not payable for this seller', 'failed-precondition')
      }
      grossEarningsPaise += Number(entry.data().amountPaise ?? 0)
    })
    const netPayablePaise = grossEarningsPaise + adjustmentsPaise
    if (netPayablePaise < 0) throw codedError('Settlement net payable cannot be negative', 'invalid-argument')
    tx.set(settlementRef, {
      sellerId, sellerName: seller.data().name, entryIds, grossEarningsPaise, adjustmentsPaise, adjustmentNote,
      netPayablePaise, currency: 'INR', status: 'approved', createdAt: serverTimestamp(), createdBy: uid,
    })
    entries.forEach((entry) => tx.update(entry.ref, { status: 'included_in_settlement', settlementId: settlementRef.id }))
  })
  return { settlementId: settlementRef.id }
}

const recordSettlementPayment = async ({ settlementId, payoutReference }) => {
  const uid = requireUid()
  const ref = doc(db, 'settlements', settlementId)
  await runTransaction(db, async (tx) => {
    const settlement = await tx.get(ref)
    if (!settlement.exists()) throw codedError('Settlement not found', 'not-found')
    if (settlement.data().status === 'paid') return
    if (settlement.data().status !== 'approved') throw codedError('Settlement is not approved', 'failed-precondition')
    const entryIds = settlement.data().entryIds ?? []
    const entryRefs = entryIds.map((id) => doc(db, 'sellerLedger', id))
    const seller = await tx.get(doc(db, 'sellers', settlement.data().sellerId))
    await Promise.all(entryRefs.map((entryRef) => tx.get(entryRef)))
    tx.update(ref, { status: 'paid', payoutReference, paidAt: serverTimestamp(), paidBy: uid })
    entryRefs.forEach((entryRef) => tx.update(entryRef, { status: 'paid', paidAt: serverTimestamp() }))
    tx.set(doc(collection(db, 'notifications')), {
      type: 'settlement_paid', status: 'pending', settlementId,
      recipient: { email: seller.data()?.email ?? null, phone: seller.data()?.phone ?? null },
      payload: { sellerName: seller.data()?.name ?? null, netPayablePaise: settlement.data().netPayablePaise, payoutReference },
      attempts: 0, createdAt: serverTimestamp(),
    })
  })
  return { settlementId, status: 'paid' }
}

// ===================== Admin: bulk product updates =====================

const projectBulkChange = (product, operation) => {
  if (operation.type === 'set_discount') {
    return { discountPercent: operation.discountPercent, salePricePaise: calculateSalePricePaise(product.mrpPaise, operation.discountPercent) }
  }
  if (operation.type === 'set_status') {
    if (operation.status === 'active' && (!(product.images ?? []).length || !(product.variantSummary ?? []).some((variant) => variant.status === 'active'))) {
      throw new Error('Product requires an image and active variant before publication')
    }
    return { status: operation.status }
  }
  if (operation.type === 'set_best_seller_mode') {
    return { merchandising: { ...(product.merchandising ?? {}), bestSellerMode: operation.mode } }
  }
  return {
    categoryId: operation.categoryId, categoryName: operation.categoryName,
    searchTokens: buildSearchTokens([
      product.name, product.description, operation.categoryName,
      ...(product.variantSummary ?? []).flatMap((variant) => [variant.sku, variant.color?.name, variant.size]),
    ]),
  }
}

const previewBulkProductUpdate = async ({ productIds, operation }) => {
  if (operation.type === 'set_category') {
    const categorySnap = await getDoc(doc(db, 'categories', operation.categoryId))
    if (!categorySnap.exists()) throw codedError('Selected category does not exist', 'failed-precondition')
  }
  const snapshots = await Promise.all(productIds.map((id) => getDoc(doc(db, 'products', id))))
  const valid = snapshots.filter((snapshot) => snapshot.exists())
  return {
    requestedCount: productIds.length, affectedCount: valid.length, excludedCount: snapshots.length - valid.length,
    examples: valid.slice(0, 10).map((snapshot) => ({
      productId: snapshot.id, name: snapshot.data().name, before: snapshot.data(), after: projectBulkChange(snapshot.data(), operation),
    })),
  }
}

const runBulkProductUpdate = async ({ productIds, operation }) => {
  const uid = requireUid()
  if (operation.type === 'set_category') {
    const categorySnap = await getDoc(doc(db, 'categories', operation.categoryId))
    if (!categorySnap.exists()) throw codedError('Selected category does not exist', 'failed-precondition')
  }
  const jobRef = doc(collection(db, 'bulkJobs'))
  await setDoc(jobRef, { actorId: uid, productIds, operation, status: 'processing', processedCount: 0, failedCount: 0, errors: [], createdAt: serverTimestamp() })
  const errors = []
  let processedCount = 0
  for (let offset = 0; offset < productIds.length; offset += 100) {
    const chunk = productIds.slice(offset, offset + 100)
    const [snapshots, commercials] = await Promise.all([
      Promise.all(chunk.map((id) => getDoc(doc(db, 'products', id)))),
      Promise.all(chunk.map((id) => getDoc(doc(db, 'productCommercials', id)))),
    ])
    const batch = writeBatch(db)
    snapshots.forEach((snapshot, index) => {
      if (!snapshot.exists()) { errors.push({ productId: chunk[index], message: 'Product not found' }); return }
      try {
        batch.update(snapshot.ref, { ...projectBulkChange(snapshot.data(), operation), updatedAt: serverTimestamp(), updatedBy: uid })
        if (operation.type === 'set_discount' && commercials[index].data()?.sellerPayoutType === 'percentage') {
          const salePricePaise = calculateSalePricePaise(snapshot.data().mrpPaise, operation.discountPercent)
          const sellerPayoutPerUnitPaise = calculateSellerPayout('percentage', Number(commercials[index].data()?.sellerPayoutValue ?? 0), salePricePaise)
          batch.update(commercials[index].ref, { sellerPayoutPerUnitPaise, updatedAt: serverTimestamp(), updatedBy: uid })
        }
        processedCount += 1
      } catch (error) {
        errors.push({ productId: snapshot.id, message: error.message })
      }
    })
    await batch.commit()
    await updateDoc(jobRef, { processedCount, failedCount: errors.length, errors: errors.slice(0, 100) })
  }
  await updateDoc(jobRef, { status: errors.length ? 'completed_with_errors' : 'completed', completedAt: serverTimestamp() })
  return { jobId: jobRef.id, processedCount, failedCount: errors.length, errors }
}

// ===================== Admin: commerce config =====================

const updateCommerceConfig = async (payload) => {
  const uid = requireUid()
  const config = validateConfig(payload)
  await setDoc(doc(db, 'commerceConfig', 'default'), { ...config, updatedAt: serverTimestamp(), updatedBy: uid })
  return { config }
}

// ===================== Admin: maintenance actions =====================
// Replace the old scheduled Cloud Functions (every-15-min reservation expiry, daily
// best-seller recompute) — an admin runs these on demand from the dashboard instead.

const releaseExpiredReservations = async () => {
  const uid = requireUid()
  const snapshot = await getDocs(query(
    collection(db, 'orders'),
    where('inventoryState', '==', 'reserved'),
    where('reservationExpiresAt', '<=', Timestamp.now()),
  ))
  let released = 0
  const failures = []
  for (const order of snapshot.docs) {
    try {
      await releaseOrderInventory(order.ref, uid, {
        reasonCode: 'payment_issue',
        customerMessage: 'The payment window expired before payment was completed. Please place the order again.',
        internalNote: 'Manual reservation expiry (maintenance action)',
      })
      released += 1
    } catch (error) {
      failures.push({ orderId: order.id, message: error.message })
    }
  }
  return { checked: snapshot.size, released, failures }
}

const recomputeBestSellers = async () => {
  const configSnap = await getDoc(doc(db, 'commerceConfig', 'default'))
  if (!configSnap.exists()) throw new Error('Commerce configuration has not been initialized')
  const config = configSnap.data()
  const since = Timestamp.fromMillis(Date.now() - config.bestSellerWindowDays * 86_400_000)
  const ordersSnap = await getDocs(query(
    collection(db, 'orders'),
    where('fulfilmentStatus', '==', 'delivered'),
    where('createdAt', '>=', since),
  ))
  const totals = new Map()
  ordersSnap.docs.forEach((order) => {
    const data = order.data()
    if (paymentStatusOf(data) !== 'paid') return
    ;(data.items ?? []).forEach((item) => {
      const current = totals.get(item.productId) ?? { units: 0, revenuePaise: 0 }
      current.units += item.quantity
      current.revenuePaise += item.lineTotalPaise
      totals.set(item.productId, current)
    })
  })
  const ranked = [...totals.entries()].sort((a, b) => b[1].units - a[1].units || b[1].revenuePaise - a[1].revenuePaise)
  const rankMap = new Map(ranked.map(([productId], index) => [productId, index + 1]))
  const productsSnap = await getDocs(collection(db, 'products'))
  let updated = 0
  for (let offset = 0; offset < productsSnap.docs.length; offset += 400) {
    const batch = writeBatch(db)
    productsSnap.docs.slice(offset, offset + 400).forEach((product) => {
      const aggregate = totals.get(product.id) ?? { units: 0, revenuePaise: 0 }
      const rank = rankMap.get(product.id) ?? null
      const mode = product.data().merchandising?.bestSellerMode ?? 'auto'
      const isBestSeller = mode === 'force_on' || (mode === 'auto' && rank !== null && rank <= config.bestSellerLimit)
      batch.update(product.ref, {
        salesMetrics: { unitsSold: aggregate.units, revenuePaise: aggregate.revenuePaise, bestSellerRank: rank, windowDays: config.bestSellerWindowDays, calculatedAt: serverTimestamp() },
        isBestSeller,
      })
      updated += 1
    })
    await batch.commit()
  }
  return { productsUpdated: updated, windowDays: config.bestSellerWindowDays }
}

export const adminApi = {
  getSnapshot,
  saveProduct,
  getProduct,
  archiveProduct,
  adjustInventory,
  transitionOrder,
  cancelOrder,
  verifyManualPayment,
  updateProductRequest,
  saveSeller,
  createSettlement,
  recordSettlementPayment,
  previewBulkProductUpdate,
  runBulkProductUpdate,
  updateCommerceConfig,
  saveCategory,
  deleteCategory,
  releaseExpiredReservations,
  recomputeBestSellers,
}
