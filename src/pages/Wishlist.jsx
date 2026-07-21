import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Trash2 } from 'lucide-react'
import { useWishlist } from '../context/WishlistContext'
import { useCart } from '../context/CartContext'
import { formatMoney } from '../lib/commerce'

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()

  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-cream py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-display font-medium mb-12 text-brown-dark tracking-tight">
            My Wishlist
          </h1>
          <div className="bg-white border border-sand rounded-xl p-16 flex flex-col items-center">
            <Heart
              size={48}
              className="mx-auto mb-6 text-brown-light stroke-[1.5]"
              fill="none"
            />
            <h2 className="text-2xl font-display font-medium mb-3 text-brown-dark tracking-tight">
              Your Wishlist is Empty
            </h2>
            <p className="text-brown-light font-light mb-8 max-w-sm">
              Save your favorite pieces here to easily find them later.
            </p>
            <Link to="/products/All products" className="px-8 py-3 bg-brown-dark hover:bg-brown text-white rounded-lg transition-colors font-medium">
              Browse Collection
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl md:text-5xl font-display font-medium mb-12 text-brown-dark tracking-tight">
          My Wishlist
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map((product) => (
            <div key={product.id} className="group flex flex-col">
              <Link to={`/product/${product.id}`} className="block relative overflow-hidden rounded-xl bg-sand mb-4 aspect-[4/5] border border-transparent hover:border-sand transition-colors">
                {product.images && product.images[0] ? (
                  <img
                    src={product.images[0]?.url || product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                ) : (
                  <div className="w-full h-full bg-sand flex items-center justify-center">
                    <span className="text-4xl opacity-20 grayscale">🏺</span>
                  </div>
                )}
                {product.discount > 0 && (
                  <span className="absolute top-3 left-3 bg-terracotta text-white text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded shadow-sm">
                    {product.discount}% OFF
                  </span>
                )}
              </Link>
              <div className="flex flex-col flex-1 px-1">
                <Link to={`/product/${product.id}`}>
                  <h3 className="font-display font-medium text-lg text-brown-dark mb-1 group-hover:text-terracotta transition-colors line-clamp-2 leading-tight">
                    {product.name}
                  </h3>
                </Link>
                <p className="text-sm text-brown-light font-light mb-2 line-clamp-2">
                  {product.description}
                </p>
                <div className="flex items-center gap-3 mb-5 mt-auto pt-2">
                  <span className="font-medium text-brown-dark">
                    {formatMoney(product.salePricePaise ?? Math.round(Number(product.price || 0) * 100))}
                  </span>
                  {product.discount > 0 && (
                    <span className="text-sm text-brown-light line-through font-light">
                      {formatMoney(product.mrpPaise ?? Math.round(Number(product.price || 0) * 100))}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      addToCart(product)
                      removeFromWishlist(product.id)
                    }}
                    disabled={Number(product.availableQuantity || 0) <= 0}
                    className="flex-1 bg-brown-dark hover:bg-brown text-white py-2.5 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 text-sm disabled:bg-gray-300"
                  >
                    <ShoppingCart size={16} />
                    <span className="hidden sm:inline">{Number(product.availableQuantity || 0) > 0 ? 'Add to Cart' : 'Out of stock'}</span>
                  </button>
                  <button
                    onClick={() => removeFromWishlist(product.id)}
                    className="p-2.5 rounded-lg border border-sand bg-white text-brown-light hover:border-terracotta hover:text-terracotta transition-colors flex items-center justify-center"
                    aria-label="Remove from wishlist"
                  >
                    <Trash2 size={18} strokeWidth={1.5} />
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
