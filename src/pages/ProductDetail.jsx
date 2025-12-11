import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ShoppingCart, Heart, Plus, Minus, MapPin } from 'lucide-react'
// import { doc, getDoc } from 'firebase/firestore'
// import { db } from '../config/firebase'
import { mockProducts } from '../data/mockData'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

const ProductDetail = () => {
  const { id } = useParams()
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
    // Using mock data for now
    const product = mockProducts.find((p) => p.id === id)
    if (product) {
      setProduct({
        ...product,
        imageUrl: product.images?.[0] || '',
      })
    }
    setLoading(false)

    // Uncomment below to use Firebase instead
    // const fetchProduct = async () => {
    //   try {
    //     const docRef = doc(db, 'products', id)
    //     const docSnap = await getDoc(docRef)
    //     if (docSnap.exists()) {
    //       const data = docSnap.data()
    //       setProduct({
    //         id: docSnap.id,
    //         ...data,
    //         name: data.category || 'Product',
    //         description: `Handcrafted ${data.category || 'product'} by ${data.ownerName || 'local artisan'}`,
    //         sku: `PROD-${docSnap.id.substring(0, 8).toUpperCase()}`,
    //         dimensions: 'Dimensions vary',
    //         images: data.imageUrl ? [data.imageUrl] : ['/api/placeholder/400/400'],
    //         discount: 0,
    //       })
    //     }
    //   } catch (error) {
    //     console.error('Error fetching product:', error)
    //   } finally {
    //     setLoading(false)
    //   }
    // }
    // if (id) {
    //   fetchProduct()
    // }
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-cream py-12 flex items-center justify-center">
        <p className="text-xl text-brown-dark/60">Loading product...</p>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-cream py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4 text-brown-dark">
            Product Not Found
          </h1>
          <Link to="/products/All products" className="btn-primary">
            Browse All Products
          </Link>
        </div>
      </div>
    )
  }

  const handleAddToCart = () => {
    addToCart(product, quantity)
  }

  const handleWishlistToggle = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }

  const checkDelivery = () => {
    // Simple check - Gurgaon pincodes start with 122
    if (pincode.startsWith('122')) {
      setDeliveryAvailable(true)
    } else {
      setDeliveryAvailable(false)
    }
  }

  const nextImage = () => {
    setSelectedImageIndex(
      (prev) => (prev + 1) % product.images.length
    )
  }

  const prevImage = () => {
    setSelectedImageIndex(
      (prev) => (prev - 1 + product.images.length) % product.images.length
    )
  }

  const deliveryCharges = deliveryOption === 'delivery' && deliveryAvailable ? 50 : 0

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Product Images */}
          <div>
            <div className="relative bg-white rounded-lg shadow-lg overflow-hidden mb-4">
              <div className="aspect-square bg-brown-light relative">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brown-light to-brown-dark flex items-center justify-center">
                    <span className="text-9xl">🏺</span>
                  </div>
                )}
                {/* Navigation Arrows */}
                {product.images && product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-brown p-2 rounded-full transition-colors"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={24} />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-brown p-2 rounded-full transition-colors"
                      aria-label="Next image"
                    >
                      <ChevronRight size={24} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      index === selectedImageIndex
                        ? 'border-purple'
                        : 'border-transparent'
                    }`}
                  >
                    <div className="w-full h-full bg-brown-light"></div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Product Details */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-brown-dark">
              {product.name}
            </h1>
            <p className="text-brown-dark/60 mb-4">SKU: {product.sku}</p>

            <div className="mb-6">
              {product.discount > 0 && (
                <div className="mb-2">
                  <span className="text-sm text-purple font-semibold mr-2">
                    {product.discount}% OFF
                  </span>
                  <span className="text-lg text-brown-dark/60 line-through">
                    ₹{Math.round(product.price / (1 - product.discount / 100))}
                  </span>
                </div>
              )}
              <p className="text-3xl font-bold text-brown-dark">
                ₹{product.price}
              </p>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-brown-dark">
                Description
              </h2>
              <p className="text-brown-dark/80">{product.description}</p>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-brown-dark">
                Dimensions
              </h2>
              <p className="text-brown-dark/80">{product.dimensions}</p>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2 text-brown-dark">
                Quantity
              </h2>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-brown-light hover:bg-brown text-white p-2 rounded-lg transition-colors"
                >
                  <Minus size={20} />
                </button>
                <span className="text-xl font-semibold w-12 text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="bg-brown-light hover:bg-brown text-white p-2 rounded-lg transition-colors"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            {/* Delivery Options */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-brown-dark">
                Delivery Option
              </h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="delivery"
                    value="pickup"
                    checked={deliveryOption === 'pickup'}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                    className="w-5 h-5 text-purple"
                  />
                  <span className="text-brown-dark">Pick up</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="delivery"
                    value="delivery"
                    checked={deliveryOption === 'delivery'}
                    onChange={(e) => setDeliveryOption(e.target.value)}
                    className="w-5 h-5 text-purple"
                  />
                  <span className="text-brown-dark">Delivery by Porter</span>
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
                        className="input-field flex-1"
                      />
                      <button
                        onClick={checkDelivery}
                        className="btn-secondary"
                      >
                        Check
                      </button>
                    </div>
                    {deliveryAvailable === true && (
                      <p className="text-green-600 mt-2 flex items-center gap-2">
                        <MapPin size={16} />
                        Delivery available! Charges: ₹{deliveryCharges}
                      </p>
                    )}
                    {deliveryAvailable === false && (
                      <p className="text-red-600 mt-2">
                        Delivery not available for this pincode. Currently, we
                        only deliver to Gurgaon (pincodes starting with 122).
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
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <ShoppingCart size={20} />
                Add to Cart
              </button>
              <button
                onClick={handleWishlistToggle}
                className={`p-4 rounded-lg transition-colors ${
                  isInWishlist(product.id)
                    ? 'bg-purple text-white'
                    : 'bg-brown-light text-brown-dark hover:bg-purple hover:text-white'
                }`}
                aria-label="Toggle wishlist"
              >
                <Heart
                  size={24}
                  fill={isInWishlist(product.id) ? 'currentColor' : 'none'}
                />
              </button>
            </div>

            <div className="mt-6 pt-6 border-t border-brown-light">
              <p className="text-sm text-brown-dark/60">
                <strong>Note:</strong> All products are handcrafted and may have
                slight variations, making each piece unique.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail

