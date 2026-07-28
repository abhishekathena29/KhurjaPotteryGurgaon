export const rupeesToPaise = (value) => {
  const number = Number(value)
  if (!Number.isFinite(number) || number < 0) throw new Error('Amount must be a non-negative number')
  return Math.round(number * 100)
}

export const paiseToRupees = (value) => Number(value || 0) / 100

export const formatMoney = (paise, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: Number(paise) % 100 === 0 ? 0 : 2,
  }).format(paiseToRupees(paise))

export const calculateSalePricePaise = (mrpPaise, discountPercent) => {
  if (!Number.isSafeInteger(mrpPaise) || mrpPaise < 0) throw new Error('MRP must be valid integer paise')
  const discount = Number(discountPercent)
  if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
    throw new Error('Discount must be between 0 and 100')
  }
  return mrpPaise - Math.round((mrpPaise * discount) / 100)
}

export const calculateMargin = ({ salePricePaise, sellerPayoutPaise, unitCostPaise = 0, packagingCostPaise = 0 }) => {
  const amountPaise = salePricePaise - sellerPayoutPaise - unitCostPaise - packagingCostPaise
  return {
    amountPaise,
    percent: salePricePaise ? Number(((amountPaise / salePricePaise) * 100).toFixed(2)) : 0,
  }
}

export const normalizeSearch = (value) =>
  String(value || '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ')

export const productMatchesSearch = (product, query) => {
  const needle = normalizeSearch(query)
  if (!needle) return true
  const variants = product.variants || product.variantSummary || []
  const haystack = normalizeSearch([
    product.name,
    product.categoryName || product.category,
    product.description,
    ...variants.flatMap((variant) => [variant.sku, variant.color?.name || variant.color, variant.size]),
  ].filter(Boolean).join(' '))
  return needle.split(' ').every((token) => haystack.includes(token))
}

export const normalizeProduct = (id, data = {}) => {
  const legacyPricePaise = Math.round(Number(data.price || 0) * 100)
  const mrpPaise = Number.isSafeInteger(data.mrpPaise) ? data.mrpPaise : legacyPricePaise
  const salePricePaise = Number.isSafeInteger(data.salePricePaise) ? data.salePricePaise : legacyPricePaise
  const variants = data.variantSummary?.length
    ? data.variantSummary
    : [{
        id: 'legacy',
        sku: data.sku || `LEGACY-${id.slice(0, 8).toUpperCase()}`,
        color: { id: normalizeSearch(data.color || 'unspecified').replace(/ /g, '-'), name: data.color || 'Unspecified' },
        size: data.size || '',
        availableQuantity: Number(data.quantity ?? 0),
        status: 'active',
      }]
  const images = data.images?.length
    ? data.images
    : (data.imageUrls || (data.imageUrl ? [data.imageUrl] : [])).map((url, index) => ({
        id: `legacy-${index}`,
        url,
        alt: data.name || data.category || 'Product image',
        sortOrder: index,
      }))
  return {
    id,
    ...data,
    name: data.name || data.category || 'Product',
    category: data.categoryName || data.category || '',
    categoryName: data.categoryName || data.category || '',
    mrpPaise,
    salePricePaise,
    price: paiseToRupees(salePricePaise),
    discount: Number(data.discountPercent ?? data.discount ?? 0),
    discountPercent: Number(data.discountPercent ?? data.discount ?? 0),
    variants,
    variantSummary: variants,
    images,
    imageUrls: images.map((image) => image.url),
    availableQuantity: Number(data.availableQuantity ?? variants.reduce((sum, variant) => sum + Number(variant.availableQuantity || 0), 0)),
    isActive: data.status ? data.status === 'active' : data.isActive !== false,
    status: data.status || (data.isActive === false ? 'draft' : 'active'),
    isBestSeller: data.merchandising?.bestSellerMode === 'force_on' || Boolean(data.isBestSeller),
  }
}

export const cartLineId = (productId, variantId) => `${productId}::${variantId}`

export const createIdempotencyKey = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  throw new Error('This browser does not support secure checkout identifiers')
}

export const normalizeSku = (value) =>
  String(value).trim().toUpperCase().replace(/[^A-Z0-9_-]+/g, '-').replace(/-+/g, '-')

export const formatSku = (prefix, padding, number) => {
  const normalizedPrefix = normalizeSku(prefix)
  if (!normalizedPrefix) throw new Error('SKU prefix is required')
  if (!Number.isInteger(padding) || padding < 1 || padding > 12) {
    throw new Error('SKU padding must be an integer from 1 to 12')
  }
  if (!Number.isSafeInteger(number) || number < 1) throw new Error('SKU number is invalid')
  return `${normalizedPrefix}-${String(number).padStart(padding, '0')}`
}

export const buildSearchTokens = (values) => {
  const words = normalizeSearch(values.filter(Boolean).join(' ')).split(' ').filter(Boolean)
  const tokens = new Set()
  for (const word of words) {
    tokens.add(word)
    for (let i = 2; i <= Math.min(word.length, 12); i += 1) tokens.add(word.slice(0, i))
  }
  return [...tokens].slice(0, 500)
}

export const deriveStockStatus = (availableQuantity, lowStockThreshold) => {
  if (availableQuantity <= 0) return 'out_of_stock'
  if (availableQuantity <= lowStockThreshold) return 'low_stock'
  return 'in_stock'
}

const validInventory = (onHandQuantity, reservedQuantity) => {
  if (!Number.isSafeInteger(onHandQuantity) || !Number.isSafeInteger(reservedQuantity) ||
      onHandQuantity < 0 || reservedQuantity < 0 || reservedQuantity > onHandQuantity) {
    throw new Error('Inventory balance is inconsistent')
  }
}

export const reserveInventory = (onHandQuantity, reservedQuantity, quantity) => {
  validInventory(onHandQuantity, reservedQuantity)
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error('Reservation quantity must be positive integer')
  const nextReserved = reservedQuantity + quantity
  if (nextReserved > onHandQuantity) throw new Error('OUT_OF_STOCK')
  return { onHandQuantity, reservedQuantity: nextReserved, availableQuantity: onHandQuantity - nextReserved }
}

export const commitInventory = (onHandQuantity, reservedQuantity, quantity) => {
  validInventory(onHandQuantity, reservedQuantity)
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > reservedQuantity) {
    throw new Error('Reservation cannot be committed')
  }
  const nextOnHand = onHandQuantity - quantity
  const nextReserved = reservedQuantity - quantity
  return { onHandQuantity: nextOnHand, reservedQuantity: nextReserved, availableQuantity: nextOnHand - nextReserved }
}

export const releaseInventory = (onHandQuantity, reservedQuantity, quantity) => {
  validInventory(onHandQuantity, reservedQuantity)
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > reservedQuantity) {
    throw new Error('Reservation cannot be released')
  }
  const nextReserved = reservedQuantity - quantity
  return { onHandQuantity, reservedQuantity: nextReserved, availableQuantity: onHandQuantity - nextReserved }
}

export const restoreCommittedInventory = (onHandQuantity, reservedQuantity, quantity) => {
  validInventory(onHandQuantity, reservedQuantity)
  if (!Number.isSafeInteger(quantity) || quantity < 1) throw new Error('Restore quantity must be positive integer')
  const nextOnHand = onHandQuantity + quantity
  return { onHandQuantity: nextOnHand, reservedQuantity, availableQuantity: nextOnHand - reservedQuantity }
}

export const allowedFulfilmentTransition = (from, to) => {
  const transitions = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['packed', 'cancelled'],
    packed: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
  }
  return Boolean(transitions[from]?.includes(to))
}

export const calculateSellerPayout = (type, value, salePricePaise) => {
  if (type === 'fixed') return Math.max(0, Math.round(value))
  if (value < 0 || value > 100) throw new Error('Seller payout percentage must be between 0 and 100')
  return Math.round((salePricePaise * value) / 100)
}

export const validateConfig = (value) => {
  const integer = (key, min, max) => {
    const candidate = value[key]
    if (!Number.isSafeInteger(candidate) || candidate < min || candidate > max) {
      throw new Error(`${key} must be an integer between ${min} and ${max}`)
    }
    return candidate
  }
  const boolean = (key) => {
    if (typeof value[key] !== 'boolean') throw new Error(`${key} must be boolean`)
    return value[key]
  }
  const skuPrefix = normalizeSku(String(value.skuPrefix ?? ''))
  const orderPrefix = normalizeSku(String(value.orderPrefix ?? ''))
  if (!skuPrefix) throw new Error('skuPrefix is required')
  if (!orderPrefix) throw new Error('orderPrefix is required')
  if (value.currency !== 'INR') throw new Error('currency must be INR')
  const manualPaymentQrUrl = String(value.manualPaymentQrUrl ?? '').trim()
  if (manualPaymentQrUrl) {
    try {
      const parsed = new URL(manualPaymentQrUrl)
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Unsupported protocol')
    } catch {
      throw new Error('manualPaymentQrUrl must be a valid HTTP(S) URL')
    }
  }
  const manualPaymentPayeeName = String(value.manualPaymentPayeeName ?? '').trim()
  const manualPaymentInstructions = String(value.manualPaymentInstructions ?? '').trim()
  if (manualPaymentPayeeName.length > 160) throw new Error('manualPaymentPayeeName is too long')
  if (manualPaymentInstructions.length > 1000) throw new Error('manualPaymentInstructions is too long')
  return {
    currency: 'INR',
    deliveryFeePaise: integer('deliveryFeePaise', 0, 10_000_000),
    prepaidEnabled: boolean('prepaidEnabled'),
    reservationTtlMinutes: integer('reservationTtlMinutes', 1, 1_440),
    manualPaymentVerificationTtlMinutes: value.manualPaymentVerificationTtlMinutes === undefined
      ? integer('reservationTtlMinutes', 1, 1_440)
      : integer('manualPaymentVerificationTtlMinutes', 1, 10_080),
    manualPaymentQrUrl,
    manualPaymentPayeeName,
    manualPaymentInstructions,
    skuPrefix,
    skuPadding: integer('skuPadding', 1, 12),
    orderPrefix,
    orderPadding: integer('orderPadding', 1, 12),
    bestSellerWindowDays: integer('bestSellerWindowDays', 1, 365),
    bestSellerLimit: integer('bestSellerLimit', 1, 100),
  }
}
