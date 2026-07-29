import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useCommerceConfig } from '../hooks/useCommerceConfig'
import { formatMoney } from '../lib/commerce'

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, clearCart } =
    useCart()
  const { config } = useCommerceConfig()
  const subtotalPaise = cart.reduce((sum, item) => sum + Number(item.salePricePaise ?? Math.round(item.price * 100)) * item.quantity, 0)
  const deliveryFeePaise = Number(config?.deliveryFeePaise || 0)

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-cream py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-5xl font-display font-medium mb-12 text-brown-dark tracking-tight">
            Shopping Cart
          </h1>
          <div className="bg-white border border-sand rounded-xl p-16 flex flex-col items-center">
            <ShoppingBag size={48} className="mb-6 text-brown-light stroke-[1.5]" />
            <h2 className="text-2xl font-display font-medium mb-3 text-brown-dark tracking-tight">
              Your Cart is Empty
            </h2>
            <p className="text-brown-light font-light mb-8 max-w-sm">
              Looks like you haven't added any handcrafted pieces to your cart yet.
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
        <div className="flex items-end justify-between mb-10 pb-4 border-b border-sand">
          <h1 className="text-3xl md:text-4xl font-display font-medium text-brown-dark tracking-tight">
            Shopping Cart <span className="text-brown-light text-xl font-light ml-2">({cart.length})</span>
          </h1>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-brown-light hover:text-terracotta text-sm font-medium transition-colors border-b border-transparent hover:border-terracotta pb-0.5"
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
                className="bg-white border border-sand rounded-xl p-6 flex flex-col sm:flex-row gap-6 hover:border-cream transition-colors"
              >
                <Link
                  to={`/product/${item.productId}`}
                  className="w-full sm:w-32 h-32 bg-sand rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden border border-sand"
                >
                  {item.images?.[0]?.url ? <img src={item.images[0].url} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-4xl grayscale opacity-20">🏺</span>}
                </Link>

                <div className="flex-1 flex flex-col">
                  <Link to={`/product/${item.productId}`}>
                    <h3 className="text-xl font-display font-medium text-brown-dark mb-1 hover:text-terracotta transition-colors line-clamp-2 leading-tight">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-brown-light font-light text-sm mb-3">SKU: {item.sku}</p>
                  <p className="text-brown-light font-light text-sm mb-2">
                    {item.selectedColor?.name || item.selectedColor}{item.selectedSize ? ` · ${item.selectedSize}` : ''}
                  </p>
                  <p className="text-lg font-medium text-brown-dark mb-4 mt-auto">
                    {formatMoney(item.salePricePaise ?? Math.round(item.price * 100))}
                  </p>

                  <div className="flex items-center gap-6">
                    <div className="flex items-center border border-sand rounded-lg overflow-hidden bg-white">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="w-10 h-10 flex items-center justify-center hover:bg-sand text-brown-dark transition-colors border-r border-sand"
                      >
                        <Minus size={16} strokeWidth={1.5} />
                      </button>
                      <span className="w-12 text-center font-medium select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="w-10 h-10 flex items-center justify-center hover:bg-sand text-brown-dark transition-colors border-l border-sand"
                        disabled={item.quantity >= item.availableQuantity}
                      >
                        <Plus size={16} strokeWidth={1.5} />
                      </button>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-brown-light hover:text-terracotta p-2 transition-colors inline-flex items-center gap-2 group text-sm"
                      aria-label="Remove item"
                    >
                      <Trash2 size={18} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
                      <span className="hidden sm:inline">Remove</span>
                    </button>
                  </div>
                </div>

                <div className="text-right sm:border-l border-sand sm:pl-6 sm:ml-2 flex flex-col justify-center">
                  <p className="text-xs uppercase tracking-widest text-brown-light font-medium mb-1">Total</p>
                  <p className="text-xl font-medium text-brown-dark">
                    {formatMoney(Number(item.salePricePaise ?? Math.round(item.price * 100)) * item.quantity)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-sand rounded-xl p-8 sticky top-24">
              <h2 className="text-xl font-display font-medium mb-6 text-brown-dark tracking-tight border-b border-sand pb-4">
                Order Summary
              </h2>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brown-light font-light">Subtotal</span>
                  <span className="font-medium text-brown-dark">{formatMoney(subtotalPaise)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brown-light font-light">Estimated Delivery</span>
                  <span className="font-medium text-brown-dark">{config ? formatMoney(deliveryFeePaise) : 'Calculated at checkout'}</span>
                </div>
                <div className="border-t border-sand pt-6 mt-6">
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-medium text-brown-dark tracking-tight">
                      Total
                    </span>
                    <span className="text-2xl font-medium text-brown-dark">
                      {formatMoney(subtotalPaise + deliveryFeePaise)}
                    </span>
                  </div>
                  <p className="text-[10px] text-brown-light mt-2 text-right">Tax included directly in prices.</p>
                </div>
              </div>

              <Link
                to="/checkout"
                className="w-full bg-brown-dark hover:bg-brown text-white py-3.5 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 mb-6"
              >
                Proceed to Checkout
              </Link>

              <div className="text-center">
                <Link
                  to="/products/All products"
                  className="inline-flex items-center text-sm text-brown-light hover:text-terracotta transition-colors border-b border-transparent hover:border-terracotta pb-0.5"
                >
                  Continue Browsing
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
