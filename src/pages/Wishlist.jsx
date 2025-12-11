import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Plus, Trash2 } from 'lucide-react'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-cream py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8 text-brown-dark">
            My Wishlist
          </h1>
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <Heart
              size={64}
              className="mx-auto mb-4 text-brown-light"
              fill="none"
            />
            <h2 className="text-2xl font-bold mb-2 text-brown-dark">
              Your Wishlist is Empty
            </h2>
            <p className="text-brown-dark/60 mb-6">
              Start adding products you love to your wishlist.
            </p>
            <Link to="/products/All products" className="btn-primary">
              Browse Products
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold mb-8 text-brown-dark">
          My Wishlist
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <div key={product.id} className="card">
              <Link to={`/product/${product.id}`}>
                <div className="aspect-square bg-brown-light overflow-hidden">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-brown-light to-brown-dark flex items-center justify-center">
                      <span className="text-6xl">🏺</span>
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-semibold text-brown-dark mb-1 hover:text-purple transition-colors line-clamp-2">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-sm text-brown-dark/70 mb-2 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    {product.discount > 0 && (
                      <span className="text-sm text-purple font-semibold mr-2">
                        {product.discount}% OFF
                      </span>
                    )}
                    <span className="text-lg font-bold text-brown-dark">
                      ₹{product.price}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      addToCart(product)
                      removeFromWishlist(product.id)
                    }}
                    className="flex-1 bg-brown hover:bg-brown-dark text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    <span className="hidden sm:inline">Add to Cart</span>
                    <ShoppingCart size={18} className="sm:hidden" />
                  </button>
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="p-2 bg-purple text-white rounded-lg hover:bg-purple-dark transition-colors"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Wishlist

