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
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-brown-dark/60 font-body">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cream py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <span className="text-8xl block mb-4">🏺</span>
          <h1 className="text-4xl font-display font-bold mb-4 text-brown-dark">
            Product Not Found
          </h1>
          <p className="text-brown-dark/60 mb-6 font-body">The product you're looking for doesn't exist.</p>
          <Link to="/products/All products" className="btn-primary inline-flex items-center gap-2">
            Browse All Products
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
            <div className="relative glass-card overflow-hidden mb-4">
              <div className="aspect-square bg-sand relative">
                {images[selectedImageIndex] ? (
                  <img
                    src={images[selectedImageIndex]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-opacity duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-sand to-brown-light flex items-center justify-center">
                    <span className="text-9xl">🏺</span>
                  </div>
                )}
                {/* Discount badge */}
                {product.discount > 0 && (
                  <span className="absolute top-4 left-4 bg-gradient-to-r from-purple to-purple-dark text-white text-sm font-bold px-4 py-1.5 rounded-full shadow-lg">
                    {product.discount}% OFF
                  </span>
                )}
                {/* Navigation Arrows */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md hover:bg-white text-brown p-2 rounded-full transition-all shadow-md"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-md hover:bg-white text-brown p-2 rounded-full transition-all shadow-md"
                      aria-label="Next image"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${index === selectedImageIndex
                        ? 'border-gold shadow-gold'
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
          <div className="glass-card p-8">
            <div className="mb-4">
              {product.category && (
                <Link to={`/products/${product.category}`} className="badge-gold text-xs mb-2 inline-block hover:bg-gold/20 transition-colors">
                  {product.category}
                </Link>
              )}
              <h1 className="text-2xl md:text-3xl font-display font-bold text-brown-dark mb-1">
                {product.name}
              </h1>
              {product.sku && (
                <p className="text-brown-dark/40 text-sm font-body">SKU: {product.sku}</p>
              )}
            </div>

            {/* Price */}
            <div className="mb-6 pb-6 border-b border-sand">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold text-brown-dark">₹{product.price}</span>
                {product.discount > 0 && (
                  <>
                    <span className="text-lg text-brown-dark/40 line-through">
                      ₹{Math.round(product.price / (1 - product.discount / 100))}
                    </span>
                    <span className="badge-purple text-xs">Save {product.discount}%</span>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6">
                <h2 className="font-display font-semibold mb-2 text-brown-dark">Description</h2>
                <p className="text-brown-dark/75 font-body leading-relaxed">{product.description}</p>
              </div>
            )}

            {/* Dimensions */}
            {product.dimensions && (
              <div className="mb-6">
                <h2 className="font-display font-semibold mb-2 text-brown-dark">Dimensions</h2>
                <p className="text-brown-dark/75 font-body">{product.dimensions}</p>
              </div>
            )}

            {/* Color & Size */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {product.color && (
                <div>
                  <span className="text-xs text-brown-dark/50 font-body">Color</span>
                  <p className="font-medium text-brown-dark font-body">{product.color}</p>
                </div>
              )}
              {product.size && (
                <div>
                  <span className="text-xs text-brown-dark/50 font-body">Size</span>
                  <p className="font-medium text-brown-dark font-body">{product.size}</p>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <h2 className="font-display font-semibold mb-3 text-brown-dark">Quantity</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 bg-sand hover:bg-brown-light/30 text-brown-dark rounded-xl transition-colors flex items-center justify-center"
                >
                  <Minus size={18} />
                </button>
                <span className="text-xl font-semibold w-12 text-center font-body">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 bg-sand hover:bg-brown-light/30 text-brown-dark rounded-xl transition-colors flex items-center justify-center"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Delivery Options */}
            <div className="mb-6 pb-6 border-b border-sand">
              <h2 className="font-display font-semibold mb-3 text-brown-dark">Delivery Option</h2>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-sand hover:border-gold/30 transition-colors">
                  <input
                    type="radio"
                    name="delivery"
                    value="pickup"
                    checked={deliveryOption === 'pickup'}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                    className="w-4 h-4 text-gold accent-gold"
                  />
                  <span className="text-brown-dark font-body">Pick up (Free)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-sand hover:border-gold/30 transition-colors">
                  <input
                    type="radio"
                    name="delivery"
                    value="delivery"
                    checked={deliveryOption === 'delivery'}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                    className="w-4 h-4 text-gold accent-gold"
                  />
                  <span className="text-brown-dark font-body">Delivery by Porter</span>
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
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                className="btn-primary flex-1 flex items-center justify-center gap-2 py-3"
              >
                <ShoppingCart size={20} />
                Add to Cart
              </button>
              <button
                onClick={handleWishlistToggle}
                className={`p-4 rounded-xl transition-all ${isInWishlist(product.id)
                    ? 'bg-purple text-white shadow-md'
                    : 'bg-sand text-brown-dark hover:bg-purple hover:text-white'
                  }`}
                aria-label="Toggle wishlist"
              >
                <Heart size={22} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Artisan info */}
            {product.ownerName && (
              <div className="mt-4 p-4 bg-gold/5 rounded-xl border border-gold/10">
                <p className="text-xs text-brown-dark/50 font-body">Crafted by</p>
                <p className="font-display font-semibold text-brown-dark">{product.ownerName}</p>
              </div>
            )}

            <div className="mt-4 p-4 bg-sand/50 rounded-xl">
              <p className="text-xs text-brown-dark/50 font-body">
                <strong>Note:</strong> All products are handcrafted and may have slight variations, making each piece unique.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
