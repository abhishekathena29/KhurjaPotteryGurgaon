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
