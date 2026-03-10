import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ShoppingCart, Heart, Plus, Minus, MapPin, ChevronRight as ChevronR } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

const ProductDetail = () => {
  const { id } = useParams()
  const { products, loading: productsLoading } = useProducts()
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [deliveryOption, setDeliveryOption] = useState('pickup')
  const [pincode, setPincode] = useState('')
  const [deliveryAvailable, setDeliveryAvailable] = useState(null)

  useEffect(() => {
    if (!productsLoading && products.length > 0) {
      const found = products.find((p) => p.id === id)
      if (found) {
        setProduct(found)
      }
      setLoading(false)
    }
  }, [id, products, productsLoading])

  if (loading || productsLoading) {
    return (
      <div className="min-h-screen bg-cream py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-[3px] border-sand border-t-brown-dark rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-brown-light font-light">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cream py-24 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <span className="text-6xl block mb-6 grayscale opacity-20">🏺</span>
          <h1 className="text-2xl font-display font-medium mb-3 text-brown-dark tracking-tight">
            Product Not Found
          </h1>
          <p className="text-brown-light mb-8 font-light">We couldn't find the product you're looking for. It may have been removed or is currently unavailable.</p>
          <Link to="/products/All products" className="px-6 py-3 border border-sand text-brown-dark hover:bg-sand rounded-lg transition-colors font-medium text-sm inline-flex">
            Browse Collection
          </Link>
        </div>
      </div>
    )
  }

  const handleAddToCart = () => addToCart(product, quantity)

  const handleWishlistToggle = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }

  const checkDelivery = () => {
    if (pincode.startsWith('122')) {
      setDeliveryAvailable(true)
    } else {
      setDeliveryAvailable(false)
    }
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.imageUrl].filter(Boolean)

  const nextImage = () => {
    if (images.length > 1) {
      setSelectedImageIndex((prev) => (prev + 1) % images.length)
    }
  }

  const prevImage = () => {
    if (images.length > 1) {
      setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length)
    }
  }

  const deliveryCharges = deliveryOption === 'delivery' && deliveryAvailable ? 50 : 0

  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-brown-dark/60 mb-6 font-body">
          <Link to="/" className="hover:text-brown-dark transition-colors">Home</Link>
          <ChevronR size={14} />
          <Link to="/products/All products" className="hover:text-brown-dark transition-colors">Products</Link>
          <ChevronR size={14} />
          <span className="text-brown-dark font-medium line-clamp-1">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Product Images */}
          <div>
            <div className="relative overflow-hidden rounded-xl border border-sand mb-4 group">
              <div className="aspect-[4/5] bg-sand relative">
                {images[selectedImageIndex] ? (
                  <img
                    src={images[selectedImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-sand flex items-center justify-center">
                    <span className="text-6xl grayscale opacity-20">🏺</span>
                  </div>
                )}
                {/* Discount badge */}
                {product.discount > 0 && (
                  <span className="absolute top-4 left-4 bg-terracotta text-white text-[10px] tracking-widest uppercase font-bold px-3 py-1.5 rounded-sm shadow-sm">
                    {product.discount}% OFF
                  </span>
                )}
                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white hover:bg-sand text-brown-dark p-2.5 rounded-full transition-all shadow-sm opacity-0 group-hover:opacity-100"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={20} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white hover:bg-sand text-brown-dark p-2.5 rounded-full transition-all shadow-sm opacity-0 group-hover:opacity-100"
                      aria-label="Next image"
                    >
                      <ChevronRight size={20} strokeWidth={1.5} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto scrollbar-hide py-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-[1.5px] transition-all flex-shrink-0 bg-sand ${index === selectedImageIndex
                      ? 'border-brown-dark opacity-100'
                      : 'border-transparent opacity-60 hover:opacity-100'
                      }`}
                  >
                    <img src={img} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details */}
          <div className="bg-white border border-sand rounded-xl p-8 lg:p-10 h-fit sticky top-24">
            <div className="mb-6">
              {product.category && (
                <Link to={`/products/${product.category}`} className="text-xs uppercase tracking-widest text-brown-light font-medium mb-3 inline-block hover:text-terracotta transition-colors">
                  {product.category}
                </Link>
              )}
              <h1 className="text-3xl lg:text-4xl font-display font-medium text-brown-dark mb-2 tracking-tight">
                {product.name}
              </h1>
              {product.sku && (
                <p className="text-brown-light text-sm font-light">SKU: {product.sku}</p>
              )}
            </div>

            {/* Price */}
            <div className="mb-8 pb-8 border-b border-sand">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-medium text-brown-dark">₹{product.price}</span>
                {product.discount > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-lg text-brown-light line-through font-light">
                      ₹{Math.round(product.price / (1 - product.discount / 100))}
                    </span>
                    <span className="bg-sand text-brown-dark rounded-md px-2.5 py-1 text-xs font-medium border border-sand shadow-sm">
                      Save {product.discount}%
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-8">
                <h2 className="text-xs uppercase tracking-widest text-brown-light font-medium mb-3">Description</h2>
                <p className="text-brown-dark/80 font-light leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Dimensions */}
            {product.dimensions && (
              <div className="mb-8">
                <h2 className="text-xs uppercase tracking-widest text-brown-light font-medium mb-3">Dimensions</h2>
                <p className="text-brown-dark/80 font-light">{product.dimensions}</p>
              </div>
            )}

            {/* Color & Size */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              {product.color && (
                <div>
                  <span className="text-xs uppercase tracking-widest text-brown-light font-medium block mb-1">Color</span>
                  <p className="font-medium text-brown-dark">{product.color}</p>
                </div>
              )}
              {product.size && (
                <div>
                  <span className="text-xs uppercase tracking-widest text-brown-light font-medium block mb-1">Size</span>
                  <p className="font-medium text-brown-dark">{product.size}</p>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="mb-8">
              <h2 className="text-xs uppercase tracking-widest text-brown-light font-medium mb-3">Quantity</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-sand rounded-lg overflow-hidden bg-white">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 hover:bg-sand text-brown-dark transition-colors flex items-center justify-center border-r border-sand"
                  >
                    <Minus size={16} strokeWidth={1.5} />
                  </button>
                  <span className="text-base font-medium w-12 text-center select-none">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 hover:bg-sand text-brown-dark transition-colors flex items-center justify-center border-l border-sand"
                  >
                    <Plus size={16} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            </div>

            {/* Delivery Options */}
            <div className="mb-8 pb-8 border-b border-sand">
              <h2 className="text-xs uppercase tracking-widest text-brown-light font-medium mb-3">Delivery Option</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border border-sand hover:border-terracotta/50 transition-colors bg-white">
                  <input
                    type="radio"
                    name="delivery"
                    value="pickup"
                    checked={deliveryOption === 'pickup'}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                    className="w-4 h-4 text-terracotta accent-terracotta border-sand"
                  />
                  <span className="text-brown-dark font-medium text-sm">Pick up (Free)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border border-sand hover:border-terracotta/50 transition-colors bg-white">
                  <input
                    type="radio"
                    name="delivery"
                    value="delivery"
                    checked={deliveryOption === 'delivery'}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                    className="w-4 h-4 text-terracotta accent-terracotta border-sand"
                  />
                  <span className="text-brown-dark font-medium text-sm">Delivery by Porter</span>
                </label>

                {deliveryOption === 'delivery' && (
                  <div className="ml-8 mt-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Enter pincode"
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        maxLength={6}
                        className="input-field flex-1 text-sm"
                      />
                      <button onClick={checkDelivery} className="btn-secondary text-sm py-2">
                        Check
                      </button>
                    </div>
                    {deliveryAvailable === true && (
                      <p className="text-green-600 mt-2 flex items-center gap-2 text-sm font-body">
                        <MapPin size={14} />
                        Delivery available! Charges: ₹{deliveryCharges}
                      </p>
                    )}
                    {deliveryAvailable === false && (
                      <p className="text-red-500 mt-2 text-sm font-body">
                        Delivery not available for this pincode. Currently we only deliver to Gurgaon (122xxx).
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleAddToCart}
                className="bg-brown-dark hover:bg-brown text-white flex-1 flex items-center justify-center gap-2 py-3.5 rounded-lg transition-colors font-medium shadow-sm"
              >
                <ShoppingCart size={18} strokeWidth={2} />
                Add to Cart
              </button>
              <button
                onClick={handleWishlistToggle}
                className={`p-3.5 rounded-lg border transition-colors flex items-center justify-center w-14 ${isInWishlist(product.id)
                  ? 'bg-terracotta border-terracotta text-white shadow-sm'
                  : 'border-sand bg-white text-brown-light hover:border-terracotta hover:text-terracotta'
                  }`}
                aria-label="Toggle wishlist"
              >
                <Heart size={20} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} strokeWidth={isInWishlist(product.id) ? 1 : 1.5} />
              </button>
            </div>

            {/* Artisan info */}
            {product.ownerName && (
              <div className="mt-8 p-5 bg-sand/30 rounded-lg border border-sand flex items-center gap-4">
                <div className="w-10 h-10 bg-cream rounded-full border border-sand flex items-center justify-center text-brown-dark font-display font-medium">
                  {product.ownerName.charAt(0)}
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-brown-light font-medium mb-0.5">Crafted by</p>
                  <p className="font-display font-medium text-brown-dark">{product.ownerName}</p>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-sand">
              <p className="text-sm text-brown-light font-light leading-relaxed">
                <span className="font-medium text-brown-dark mr-2">Note:</span>
                All products are handcrafted and may have subtle variations in color, texture, and size. This makes each piece uniquely beautiful.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
