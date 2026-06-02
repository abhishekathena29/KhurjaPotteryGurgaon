import { useState, useEffect } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ChevronRight, MapPin, Wallet, CheckCircle, ShoppingBag, Loader2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { createOrder } from '../hooks/useOrders'
import { getUserProfile, saveUserAddress } from '../hooks/useUserProfile'

const DELIVERY_FEE = 50

const Checkout = () => {
  const { cart, getCartTotal, clearCart } = useCart()
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [address, setAddress] = useState({
    fullName: user?.displayName || '',
    phone: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    pincode: '',
  })
  const [paymentMethod, setPaymentMethod] = useState('cod')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState('')
  const [placedOrder, setPlacedOrder] = useState(null)
  const [hasSavedAddress, setHasSavedAddress] = useState(false)

  // Pre-fill the form with the user's previously saved address
  useEffect(() => {
    let active = true
    if (!user?.uid) return
    getUserProfile(user.uid).then((profile) => {
      if (!active) return
      if (profile?.address?.line1) {
        setAddress((prev) => ({
          ...prev,
          ...profile.address,
          fullName: profile.address.fullName || prev.fullName,
        }))
        setHasSavedAddress(true)
      }
    })
    return () => {
      active = false
    }
  }, [user?.uid])

  // Require login before checking out — send them to login and back here
  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/checkout" replace />
  }

  const subtotal = getCartTotal()
  const total = subtotal + DELIVERY_FEE

  const handleChange = (e) => {
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handlePlaceOrder = async (e) => {
    e.preventDefault()
    setError('')

    if (!/^\d{10}$/.test(address.phone.trim())) {
      setError('Please enter a valid 10-digit phone number.')
      return
    }
    if (!/^\d{6}$/.test(address.pincode.trim())) {
      setError('Please enter a valid 6-digit pincode.')
      return
    }

    const trimmedAddress = {
      fullName: address.fullName.trim(),
      phone: address.phone.trim(),
      line1: address.line1.trim(),
      line2: address.line2.trim(),
      city: address.city.trim(),
      state: address.state.trim(),
      pincode: address.pincode.trim(),
    }

    setPlacing(true)
    try {
      const orderId = await createOrder({
        userId: user.uid,
        userEmail: user.email,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          sku: item.sku || '',
        })),
        subtotal,
        deliveryFee: DELIVERY_FEE,
        total,
        address: trimmedAddress,
        paymentMethod,
        status: 'pending',
      })
      // Remember the address so checkout is faster next time
      await saveUserAddress(user.uid, trimmedAddress)
      clearCart()
      setPlacedOrder({ id: orderId, total })
    } catch (err) {
      console.error('Error placing order:', err)
      setError('Something went wrong while placing your order. Please try again.')
    } finally {
      setPlacing(false)
    }
  }

  // Order confirmation screen
  if (placedOrder) {
    return (
      <div className="min-h-screen bg-cream py-16">
        <div className="max-w-xl mx-auto px-4 text-center">
          <div className="bg-white border border-sand rounded-xl p-12">
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={36} className="text-green-600" strokeWidth={1.5} />
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-medium text-brown-dark tracking-tight mb-3">
              Order Confirmed!
            </h1>
            <p className="text-brown-light font-light mb-2">
              Thank you for your order. We&apos;ll contact you shortly to confirm delivery.
            </p>
            <p className="text-sm text-brown-light mb-1">
              Order ID: <span className="font-medium text-brown-dark">#{placedOrder.id.substring(0, 8).toUpperCase()}</span>
            </p>
            <p className="text-sm text-brown-light mb-8">
              Amount payable on delivery: <span className="font-medium text-brown-dark">₹{placedOrder.total}</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => navigate('/profile')} className="btn-primary">
                View My Orders
              </button>
              <Link to="/products/All products" className="btn-outline">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Empty cart guard
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-cream py-16">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="bg-white border border-sand rounded-xl p-16 flex flex-col items-center">
            <ShoppingBag size={48} className="mb-6 text-brown-light stroke-[1.5]" />
            <h2 className="text-2xl font-display font-medium mb-3 text-brown-dark tracking-tight">
              Your Cart is Empty
            </h2>
            <p className="text-brown-light font-light mb-8 max-w-sm">
              Add some handcrafted pieces to your cart before checking out.
            </p>
            <Link to="/products/All products" className="btn-primary">
              Browse Collection
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-brown-dark/60 mb-6 font-body">
          <Link to="/" className="hover:text-brown-dark transition-colors">Home</Link>
          <ChevronRight size={14} />
          <Link to="/cart" className="hover:text-brown-dark transition-colors">Cart</Link>
          <ChevronRight size={14} />
          <span className="text-brown-dark font-medium">Checkout</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-display font-medium text-brown-dark tracking-tight mb-10 pb-4 border-b border-sand">
          Checkout
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm max-w-2xl">
            {error}
          </div>
        )}

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Address + Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Address */}
            <div className="bg-white border border-sand rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-sand rounded-lg flex items-center justify-center">
                  <MapPin size={20} className="text-brown-dark stroke-[1.5]" />
                </div>
                <h2 className="text-xl font-display font-medium text-brown-dark tracking-tight">
                  Shipping Address
                </h2>
                {hasSavedAddress && (
                  <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1 font-medium">
                    <CheckCircle size={13} /> Saved address loaded
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-brown-dark mb-2">Full Name</label>
                  <input
                    type="text"
                    name="fullName"
                    value={address.fullName}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Recipient's name"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-brown-dark mb-2">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={address.phone}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="10-digit mobile number"
                    maxLength={10}
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-brown-dark mb-2">Address Line 1</label>
                  <input
                    type="text"
                    name="line1"
                    value={address.line1}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="House no., building, street"
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-brown-dark mb-2">
                    Address Line 2 <span className="text-brown-light font-light">(optional)</span>
                  </label>
                  <input
                    type="text"
                    name="line2"
                    value={address.line2}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Area, landmark"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brown-dark mb-2">City</label>
                  <input
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="City"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brown-dark mb-2">State</label>
                  <input
                    type="text"
                    name="state"
                    value={address.state}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="State"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brown-dark mb-2">Pincode</label>
                  <input
                    type="text"
                    name="pincode"
                    value={address.pincode}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="6-digit pincode"
                    maxLength={6}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white border border-sand rounded-xl p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-sand rounded-lg flex items-center justify-center">
                  <Wallet size={20} className="text-brown-dark stroke-[1.5]" />
                </div>
                <h2 className="text-xl font-display font-medium text-brown-dark tracking-tight">
                  Payment Method
                </h2>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-4 rounded-lg border border-terracotta/50 bg-sand/30">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-terracotta accent-terracotta"
                />
                <div>
                  <p className="text-brown-dark font-medium text-sm">Cash on Delivery</p>
                  <p className="text-brown-light font-light text-xs mt-0.5">Pay with cash when your order arrives</p>
                </div>
              </label>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-sand rounded-xl p-8 sticky top-24">
              <h2 className="text-xl font-display font-medium mb-6 text-brown-dark tracking-tight border-b border-sand pb-4">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto custom-scrollbar">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-start gap-3 text-sm">
                    <span className="text-brown-dark font-light flex-1 line-clamp-2">
                      {item.name} <span className="text-brown-light">× {item.quantity}</span>
                    </span>
                    <span className="font-medium text-brown-dark whitespace-nowrap">
                      ₹{item.price * item.quantity}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t border-sand pt-4 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brown-light font-light">Subtotal</span>
                  <span className="font-medium text-brown-dark">₹{subtotal}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-brown-light font-light">Delivery</span>
                  <span className="font-medium text-brown-dark">₹{DELIVERY_FEE}</span>
                </div>
                <div className="border-t border-sand pt-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-lg font-medium text-brown-dark tracking-tight">Total</span>
                    <span className="text-2xl font-medium text-brown-dark">₹{total}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={placing}
                className="w-full bg-brown-dark hover:bg-brown text-white py-3.5 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {placing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  'Confirm Order'
                )}
              </button>

              <p className="text-[11px] text-brown-light text-center mt-4 font-light">
                By confirming, you agree to pay ₹{total} on delivery.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Checkout
