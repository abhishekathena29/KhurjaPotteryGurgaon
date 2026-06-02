import { useState, useEffect } from 'react'
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import {
  ShoppingBag,
  MapPin,
  Phone,
  Mail,
  Package,
  CheckCircle,
  Truck,
  XCircle,
  RefreshCw,
} from 'lucide-react'

const STATUS_FLOW = ['pending', 'confirmed', 'shipped', 'delivered']

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

const formatDateTime = (createdAt) => {
  if (!createdAt?.seconds) return '—'
  return new Date(createdAt.seconds * 1000).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const OrdersTab = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState(null)
  const [filter, setFilter] = useState('all')

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const snapshot = await getDocs(collection(db, 'orders'))
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      data.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setOrders(data)
    } catch (err) {
      console.error('Error fetching orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const updateStatus = async (order, newStatus) => {
    setUpdatingId(order.id)
    try {
      await updateDoc(doc(db, 'orders', order.id), { status: newStatus })
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: newStatus } : o))
      )
    } catch (err) {
      console.error('Error updating order status:', err)
      alert('Could not update order. Please try again.')
    } finally {
      setUpdatingId(null)
    }
  }

  const nextStatus = (status) => {
    const idx = STATUS_FLOW.indexOf(status)
    if (idx === -1 || idx === STATUS_FLOW.length - 1) return null
    return STATUS_FLOW[idx + 1]
  }

  const nextStatusLabel = {
    confirmed: 'Confirm Order',
    shipped: 'Mark Shipped',
    delivered: 'Mark Delivered',
  }

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  const counts = {
    all: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h2 className="text-xl font-bold text-gray-800">Orders ({orders.length})</h2>
        <button
          onClick={fetchOrders}
          className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      {/* Status filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'pending', 'confirmed', 'shipped', 'delivered'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              filter === s ? 'bg-brown-dark text-white' : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading orders...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <ShoppingBag size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-lg">No orders {filter !== 'all' ? `with status "${filter}"` : 'yet'}</p>
          <p className="text-sm mt-1">Orders placed by customers will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((order) => {
            const next = nextStatus(order.status)
            return (
              <div key={order.id} className="bg-white border rounded-xl shadow-sm overflow-hidden">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-5 border-b bg-gray-50">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-400 font-medium">
                      Order #{order.id.substring(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm text-gray-600 mt-0.5">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                        statusStyles[order.status] || statusStyles.pending
                      }`}
                    >
                      {order.status || 'pending'}
                    </span>
                    <span className="text-lg font-bold text-gray-800">₹{order.total}</span>
                  </div>
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Customer + Address */}
                  <div className="md:col-span-1 space-y-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-1">Customer</p>
                      <p className="font-semibold text-gray-800">{order.address?.fullName || '—'}</p>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                        <Mail size={13} /> {order.userEmail || '—'}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1.5">
                        <Phone size={13} /> {order.address?.phone || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-1 flex items-center gap-1.5">
                        <MapPin size={13} /> Shipping Address
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {order.address?.line1}
                        {order.address?.line2 ? `, ${order.address.line2}` : ''}
                        <br />
                        {order.address?.city}, {order.address?.state} - {order.address?.pincode}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-1">Payment</p>
                      <p className="text-sm text-gray-700 font-medium">
                        {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod || '—'}
                      </p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="md:col-span-2">
                    <p className="text-xs uppercase tracking-wide text-gray-400 font-medium mb-2 flex items-center gap-1.5">
                      <Package size={13} /> Items ({(order.items || []).length})
                    </p>
                    <div className="border rounded-lg divide-y">
                      {(order.items || []).map((item, i) => (
                        <div key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                          <span className="text-gray-700">
                            {item.name}
                            {item.sku ? <span className="text-gray-400 ml-2">({item.sku})</span> : null}
                          </span>
                          <span className="text-gray-500 whitespace-nowrap ml-3">
                            {item.quantity} × ₹{item.price} = <span className="font-semibold text-gray-700">₹{item.price * item.quantity}</span>
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Cost breakdown */}
                    <div className="mt-3 space-y-1 text-sm max-w-xs ml-auto">
                      <div className="flex justify-between text-gray-500">
                        <span>Subtotal</span>
                        <span>₹{order.subtotal}</span>
                      </div>
                      <div className="flex justify-between text-gray-500">
                        <span>Delivery</span>
                        <span>₹{order.deliveryFee}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-800 pt-1 border-t">
                        <span>Total</span>
                        <span>₹{order.total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-end gap-2 px-5 py-4 border-t bg-gray-50">
                  {order.status !== 'cancelled' && order.status !== 'delivered' && (
                    <button
                      onClick={() => updateStatus(order, 'cancelled')}
                      disabled={updatingId === order.id}
                      className="flex items-center gap-1.5 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      <XCircle size={16} /> Cancel
                    </button>
                  )}
                  {next && (
                    <button
                      onClick={() => updateStatus(order, next)}
                      disabled={updatingId === order.id}
                      className="flex items-center gap-1.5 px-4 py-2 bg-brown-dark text-white rounded-lg hover:bg-brown transition-colors text-sm font-medium disabled:opacity-50"
                    >
                      {next === 'shipped' ? <Truck size={16} /> : <CheckCircle size={16} />}
                      {updatingId === order.id ? 'Updating...' : nextStatusLabel[next]}
                    </button>
                  )}
                  {order.status === 'delivered' && (
                    <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
                      <CheckCircle size={16} /> Completed
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default OrdersTab
