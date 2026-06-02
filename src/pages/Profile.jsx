import { Link, useNavigate } from 'react-router-dom'
import { User, ShoppingBag, Heart, MapPin, ChevronRight, Package, Clock, LogOut, LogIn } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useAuth } from '../context/AuthContext'
import { useOrders } from '../hooks/useOrders'

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  shipped: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
}

const formatDate = (createdAt) => {
  if (!createdAt?.seconds) return ''
  return new Date(createdAt.seconds * 1000).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const Profile = () => {
  const { cart } = useCart()
  const { wishlist } = useWishlist()
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const { orders, loading: ordersLoading } = useOrders(user?.uid)

  // Not logged in — prompt to sign in / sign up
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-cream py-16">
        <div className="max-w-md mx-auto px-4 text-center">
          <div className="bg-white border border-sand rounded-xl p-12">
            <div className="w-16 h-16 rounded-full bg-sand flex items-center justify-center mx-auto mb-6">
              <User size={32} className="text-brown-dark stroke-[1.5]" />
            </div>
            <h1 className="text-2xl font-display font-medium text-brown-dark tracking-tight mb-3">
              Sign in to your account
            </h1>
            <p className="text-brown-light font-light mb-8">
              Log in to view your orders, track deliveries, and manage your details.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/login" className="btn-primary flex items-center justify-center gap-2">
                <LogIn size={18} /> Sign In
              </Link>
              <Link to="/signup" className="btn-outline">
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const pendingCount = orders.filter((o) => o.status === 'pending').length
  const displayName = user.displayName || user.email?.split('@')[0] || 'Customer'

  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-2 text-sm text-brown-dark/60 mb-6 font-body">
          <Link to="/" className="hover:text-brown-dark transition-colors">Home</Link>
          <ChevronRight size={14} />
          <span className="text-brown-dark font-medium">My Account</span>
        </div>

        {/* Profile Header */}
        <div className="glass-card p-8 mb-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
            <div className="w-24 h-24 rounded-full bg-sand flex items-center justify-center flex-shrink-0">
              <span className="text-3xl font-display font-medium text-brown-dark">
                {displayName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-center sm:text-left flex-1">
              <h1 className="text-2xl font-display font-bold text-brown-dark mb-1">{displayName}</h1>
              <p className="text-brown-dark/60 font-body">{user.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 border border-sand text-brown-dark hover:bg-sand rounded-lg transition-colors text-sm font-medium"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { icon: ShoppingBag, label: 'Cart Items', value: cart.length },
            { icon: Heart, label: 'Wishlist', value: wishlist.length },
            { icon: Package, label: 'Orders', value: orders.length },
            { icon: Clock, label: 'Pending', value: pendingCount },
          ].map(({ icon: Icon, label, value }, idx) => (
            <div key={idx} className="glass-card p-6 text-center group cursor-default hover:border-cream">
              <div className="w-14 h-14 bg-sand rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform">
                <Icon className="text-brown-dark stroke-[1.5]" size={24} />
              </div>
              <p className="text-3xl font-display font-medium text-brown-dark tracking-tight mb-1">{value}</p>
              <p className="text-xs text-brown-light uppercase tracking-widest font-medium">{label}</p>
            </div>
          ))}
        </div>

        {/* Order History */}
        <div className="glass-card p-6 md:p-8 mb-6">
          <h2 className="text-xl font-display font-medium text-brown-dark tracking-tight mb-6 flex items-center gap-2">
            <Package size={20} className="stroke-[1.5]" /> Order History
          </h2>

          {ordersLoading ? (
            <div className="py-10 text-center">
              <div className="w-8 h-8 border-[3px] border-sand border-t-brown-dark rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-brown-light font-light">Loading your orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="py-10 text-center">
              <ShoppingBag size={40} className="mx-auto mb-4 text-brown-light stroke-[1.5]" />
              <p className="text-brown-dark font-medium mb-1">No orders yet</p>
              <p className="text-brown-light font-light text-sm mb-6">When you place an order, it will appear here.</p>
              <Link to="/products/All products" className="btn-primary inline-flex">Start Shopping</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="border border-sand rounded-xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-4 border-b border-sand">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-brown-light font-medium mb-1">
                        Order #{order.id.substring(0, 8).toUpperCase()}
                      </p>
                      <p className="text-sm text-brown-dark font-light">{formatDate(order.createdAt)}</p>
                    </div>
                    <span
                      className={`badge border capitalize ${statusStyles[order.status] || statusStyles.pending}`}
                    >
                      {order.status || 'pending'}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    {(order.items || []).map((item, i) => (
                      <div key={i} className="flex justify-between items-center text-sm">
                        <span className="text-brown-dark font-light">
                          {item.name} <span className="text-brown-light">× {item.quantity}</span>
                        </span>
                        <span className="text-brown-dark font-medium">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-sand">
                    <div className="flex items-center gap-2 text-xs text-brown-light">
                      <MapPin size={13} />
                      <span className="font-light">
                        {order.address?.city}{order.address?.pincode ? `, ${order.address.pincode}` : ''}
                        {' · '}
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}
                      </span>
                    </div>
                    <p className="text-base font-medium text-brown-dark">Total: ₹{order.total}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Links */}
        <div className="space-y-4">
          <Link to="/cart" className="glass-card p-6 flex items-center justify-between group hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-sand rounded-xl flex items-center justify-center">
                <ShoppingBag size={22} className="text-brown-dark stroke-[1.5]" />
              </div>
              <div>
                <p className="font-display font-medium text-brown-dark text-lg tracking-tight">Shopping Cart</p>
                <p className="text-sm text-brown-light font-light mt-1">{cart.length} items in cart</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-brown-light group-hover:text-terracotta transition-colors" />
          </Link>

          <Link to="/wishlist" className="glass-card p-6 flex items-center justify-between group hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-sand rounded-xl flex items-center justify-center">
                <Heart size={22} className="text-brown-dark stroke-[1.5]" />
              </div>
              <div>
                <p className="font-display font-medium text-brown-dark text-lg tracking-tight">Wishlist</p>
                <p className="text-sm text-brown-light font-light mt-1">{wishlist.length} saved items</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-brown-light group-hover:text-terracotta transition-colors" />
          </Link>

          <Link to="/request-product" className="glass-card p-6 flex items-center justify-between group hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-sand rounded-xl flex items-center justify-center">
                <Package size={22} className="text-brown-dark stroke-[1.5]" />
              </div>
              <div>
                <p className="font-display font-medium text-brown-dark text-lg tracking-tight">Request Custom Product</p>
                <p className="text-sm text-brown-light font-light mt-1">Get a custom pottery piece made</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-brown-light group-hover:text-terracotta transition-colors" />
          </Link>

          <Link to="/contact" className="glass-card p-6 flex items-center justify-between group hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-5">
              <div className="w-12 h-12 bg-sand rounded-xl flex items-center justify-center">
                <MapPin size={22} className="text-brown-dark stroke-[1.5]" />
              </div>
              <div>
                <p className="font-display font-medium text-brown-dark text-lg tracking-tight">Contact Us</p>
                <p className="text-sm text-brown-light font-light mt-1">Get in touch with our team</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-brown-light group-hover:text-terracotta transition-colors" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Profile
