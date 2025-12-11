import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, getCartTotal, clearCart } =
    useCart()

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-cream py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8 text-brown-dark">
            Shopping Cart
          </h1>
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <ShoppingBag size={64} className="mx-auto mb-4 text-brown-light" />
            <h2 className="text-2xl font-bold mb-2 text-brown-dark">
              No Products Added to Cart
            </h2>
            <p className="text-brown-dark/60 mb-6">
              Your cart is empty. Start shopping to add items to your cart.
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-brown-dark">
            Shopping Cart
          </h1>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Clear Cart
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow-md p-6 flex flex-col sm:flex-row gap-4"
              >
                <Link
                  to={`/product/${item.id}`}
                  className="w-full sm:w-32 h-32 bg-brown-light rounded-lg flex-shrink-0 flex items-center justify-center"
                >
                  <span className="text-5xl">🏺</span>
                </Link>

                <div className="flex-1">
                  <Link to={`/product/${item.id}`}>
                    <h3 className="text-xl font-semibold text-brown-dark mb-2 hover:text-purple transition-colors">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-brown-dark/60 mb-2">SKU: {item.sku}</p>
                  <p className="text-lg font-bold text-brown-dark mb-4">
                    ₹{item.price}
                  </p>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 border-2 border-brown-light rounded-lg">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="p-2 hover:bg-brown-light transition-colors"
                      >
                        <Minus size={18} />
                      </button>
                      <span className="px-4 py-2 font-semibold">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="p-2 hover:bg-brown-light transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-600 hover:text-red-700 p-2 transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold text-brown-dark">
                    ₹{item.price * item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-2xl font-bold mb-6 text-brown-dark">
                Order Summary
              </h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between">
                  <span className="text-brown-dark/80">Subtotal</span>
                  <span className="font-semibold">₹{getCartTotal()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brown-dark/80">Delivery Charges</span>
                  <span className="font-semibold">₹50</span>
                </div>
                <div className="border-t border-brown-light pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold text-brown-dark">
                      Total
                    </span>
                    <span className="text-lg font-bold text-brown-dark">
                      ₹{getCartTotal() + 50}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to="/checkout"
                className="btn-primary w-full text-center block mb-4"
              >
                Proceed to Checkout
              </Link>

              <Link
                to="/products/All products"
                className="text-center block text-purple hover:text-purple-dark font-medium"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart

