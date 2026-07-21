import test from 'node:test'
import assert from 'node:assert/strict'
import {
  calculateMargin,
  calculateSalePricePaise,
  cartLineId,
  normalizeProduct,
  productMatchesSearch,
  rupeesToPaise,
} from '../src/lib/commerce.js'

test('rupee conversion and discount subtraction use integer paise', () => {
  assert.equal(rupeesToPaise('499.95'), 49995)
  assert.equal(calculateSalePricePaise(100000, 15), 85000)
  assert.throws(() => calculateSalePricePaise(1000, 101))
})

test('margin includes seller payout and internal costs', () => {
  assert.deepEqual(calculateMargin({
    salePricePaise: 10000,
    sellerPayoutPaise: 5000,
    unitCostPaise: 1000,
    packagingCostPaise: 500,
  }), { amountPaise: 3500, percent: 35 })
})

test('product normalization supports the new variant model', () => {
  const product = normalizeProduct('p1', {
    name: 'Blue Mug',
    status: 'active',
    mrpPaise: 50000,
    salePricePaise: 45000,
    variantSummary: [{ id: 'v1', sku: 'PC-001', color: { name: 'Blue' }, size: 'Large', availableQuantity: 3 }],
    images: [{ id: 'i1', url: 'https://example.com/image.jpg', sortOrder: 0 }],
  })
  assert.equal(product.price, 450)
  assert.equal(product.availableQuantity, 3)
  assert.equal(product.variants[0].sku, 'PC-001')
})

test('catalogue search matches variant SKU, colour and size', () => {
  const product = normalizeProduct('p1', {
    name: 'Hand Painted Mug',
    categoryName: 'Mugs',
    status: 'active',
    variantSummary: [{ id: 'v1', sku: 'PC-BLUE-1', color: { name: 'Ocean Blue' }, size: 'Large', availableQuantity: 1 }],
  })
  assert.equal(productMatchesSearch(product, 'ocean large'), true)
  assert.equal(productMatchesSearch(product, 'PC-BLUE'), true)
  assert.equal(productMatchesSearch(product, 'red plate'), false)
})

test('cart identity keeps two variants of one product separate', () => {
  assert.equal(cartLineId('product', 'blue'), 'product::blue')
  assert.notEqual(cartLineId('product', 'blue'), cartLineId('product', 'red'))
})
