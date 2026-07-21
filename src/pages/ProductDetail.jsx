import { useEffect, useMemo, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ShoppingCart, Heart, Plus, Minus, Check, ChevronRight as ChevronR } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { formatMoney } from '../lib/commerce'

const ProductDetail = () => {
  const { id } = useParams()
  const { products, loading } = useProducts()
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const product = products.find((candidate) => candidate.id === id)
  const [selectedVariantId, setSelectedVariantId] = useState('')
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [feedback, setFeedback] = useState(null)

  const activeVariants = useMemo(
    () => (product?.variants || []).filter((variant) => variant.status !== 'inactive'),
    [product]
  )

  useEffect(() => {
    if (!activeVariants.some((variant) => variant.id === selectedVariantId)) {
      setSelectedVariantId(activeVariants[0]?.id || '')
    }
  }, [activeVariants, selectedVariantId])

  const selectedVariant = activeVariants.find((variant) => variant.id === selectedVariantId) || activeVariants[0]
  const colorOptions = useMemo(() => {
    const seen = new Set()
    return activeVariants.filter((variant) => {
      const key = variant.color?.id || variant.color?.name || variant.color
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [activeVariants])
  const selectedColorId = selectedVariant?.color?.id || selectedVariant?.color?.name || selectedVariant?.color
  const sizeOptions = activeVariants.filter((variant) =>
    (variant.color?.id || variant.color?.name || variant.color) === selectedColorId
  )
  const colorImages = product?.images?.filter((image) => !image.colorId || image.colorId === selectedColorId) || []
  const images = colorImages.length ? colorImages : (product?.images || [])
  const availableQuantity = Number(selectedVariant?.availableQuantity || 0)

  useEffect(() => {
    setQuantity((current) => Math.max(1, Math.min(current, availableQuantity || 1)))
    setSelectedImageIndex(0)
  }, [selectedVariantId, availableQuantity])

  if (loading) {
    return <div className="min-h-screen bg-cream flex items-center justify-center text-brown-light">Loading product…</div>
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cream py-24 text-center">
        <h1 className="text-2xl font-display text-brown-dark mb-3">Product Not Found</h1>
        <p className="text-brown-light mb-8">This product is unavailable or has been removed.</p>
        <Link to="/products/All products" className="btn-primary">Browse Collection</Link>
      </div>
    )
  }

  const selectColor = (variant) => {
    const colorId = variant.color?.id || variant.color?.name || variant.color
    const availableMatch = activeVariants.find((candidate) =>
      (candidate.color?.id || candidate.color?.name || candidate.color) === colorId &&
      Number(candidate.availableQuantity || 0) > 0
    )
    setSelectedVariantId((availableMatch || variant).id)
  }

  const add = () => {
    try {
      addToCart(product, quantity, selectedVariant)
      setFeedback({ type: 'success', message: 'Added to cart.' })
    } catch (error) {
      setFeedback({ type: 'error', message: error.message })
    }
  }

  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 text-sm text-brown-dark/60 mb-6">
          <Link to="/">Home</Link><ChevronR size={14} />
          <Link to="/products/All products">Products</Link><ChevronR size={14} />
          <span className="text-brown-dark line-clamp-1">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="relative overflow-hidden rounded-xl border border-sand bg-sand aspect-[4/5] group">
              {images[selectedImageIndex]?.url ? (
                <img src={images[selectedImageIndex].url} alt={images[selectedImageIndex].alt || product.name} className="w-full h-full object-cover" />
              ) : <div className="w-full h-full flex items-center justify-center text-6xl opacity-20">🏺</div>}
              {product.discountPercent > 0 && <span className="absolute top-4 left-4 bg-terracotta text-white text-xs font-bold px-3 py-1.5 rounded">{product.discountPercent}% OFF</span>}
              {images.length > 1 && (
                <>
                  <button onClick={() => setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length)} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full opacity-0 group-hover:opacity-100" aria-label="Previous image"><ChevronLeft /></button>
                  <button onClick={() => setSelectedImageIndex((selectedImageIndex + 1) % images.length)} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white p-2 rounded-full opacity-0 group-hover:opacity-100" aria-label="Next image"><ChevronRight /></button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto">
                {images.map((image, index) => (
                  <button key={image.id} onClick={() => setSelectedImageIndex(index)} className={`w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 ${index === selectedImageIndex ? 'border-brown-dark' : 'border-transparent'}`}>
                    <img src={image.url} alt={image.alt || `${product.name} ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-sand rounded-xl p-8 lg:p-10 h-fit sticky top-24">
            <Link to={`/products/${product.category}`} className="text-xs uppercase tracking-widest text-brown-light">{product.category}</Link>
            <h1 className="text-3xl lg:text-4xl font-display text-brown-dark mt-3 mb-2">{product.name}</h1>
            <p className="text-sm text-brown-light mb-6">SKU: {selectedVariant?.sku || '—'}</p>

            <div className="flex items-center gap-4 pb-7 border-b border-sand">
              <span className="text-3xl text-brown-dark">{formatMoney(product.salePricePaise)}</span>
              {product.discountPercent > 0 && <span className="text-lg text-brown-light line-through">{formatMoney(product.mrpPaise)}</span>}
            </div>

            {product.description && <p className="my-7 text-brown-dark/80 font-light leading-relaxed">{product.description}</p>}
            {product.dimensions && <p className="mb-7 text-sm text-brown-light"><span className="font-medium text-brown-dark">Dimensions:</span> {product.dimensions}</p>}

            <div className="mb-7">
              <p className="text-xs uppercase tracking-widest text-brown-light mb-3">Colour</p>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((variant) => {
                  const colorId = variant.color?.id || variant.color?.name || variant.color
                  const selected = colorId === selectedColorId
                  return (
                    <button key={colorId} onClick={() => selectColor(variant)} className={`px-4 py-2 rounded-lg border text-sm ${selected ? 'border-brown-dark bg-sand text-brown-dark' : 'border-sand text-brown-light'}`}>
                      {variant.color?.name || variant.color}
                    </button>
                  )
                })}
              </div>
            </div>

            {sizeOptions.some((variant) => variant.size) && (
              <div className="mb-7">
                <p className="text-xs uppercase tracking-widest text-brown-light mb-3">Size</p>
                <div className="flex flex-wrap gap-2">
                  {sizeOptions.map((variant) => (
                    <button key={variant.id} onClick={() => setSelectedVariantId(variant.id)} disabled={variant.availableQuantity <= 0} className={`px-4 py-2 rounded-lg border text-sm disabled:opacity-40 ${variant.id === selectedVariant?.id ? 'border-brown-dark bg-sand' : 'border-sand'}`}>
                      {variant.size || 'Standard'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-8">
              <p className={`text-sm font-medium mb-3 ${availableQuantity > 0 ? 'text-green-700' : 'text-red-600'}`}>
                {availableQuantity > 0 ? `${availableQuantity} available` : 'Out of stock'}
              </p>
              <div className="inline-flex border border-sand rounded-lg overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} disabled={quantity <= 1} className="p-3 disabled:opacity-30"><Minus size={16} /></button>
                <span className="w-12 flex items-center justify-center">{quantity}</span>
                <button onClick={() => setQuantity(Math.min(availableQuantity, quantity + 1))} disabled={quantity >= availableQuantity} className="p-3 disabled:opacity-30"><Plus size={16} /></button>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={add} disabled={!selectedVariant || availableQuantity <= 0} className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"><ShoppingCart size={18} />{availableQuantity > 0 ? 'Add to Cart' : 'Out of stock'}</button>
              <button onClick={() => isInWishlist(product.id) ? removeFromWishlist(product.id) : addToWishlist(product)} className={`p-3.5 rounded-lg border ${isInWishlist(product.id) ? 'bg-terracotta text-white' : 'border-sand'}`} aria-label="Toggle wishlist"><Heart fill={isInWishlist(product.id) ? 'currentColor' : 'none'} /></button>
            </div>

            {feedback && <div className={`mt-4 flex items-center gap-2 rounded-lg px-4 py-3 text-sm ${feedback.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}><Check size={16} />{feedback.message}</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
