import { useEffect, useMemo, useState } from 'react'
import { adminApi } from '../../services/commerceApi'
import { formatMoney } from '../../lib/commerce'
import { CheckCircle, Mail, MapPin, Package, Phone, RefreshCw, Search, ShoppingBag, Truck, X, XCircle } from 'lucide-react'

const nextStatus = { pending: 'confirmed', confirmed: 'packed', packed: 'shipped', shipped: 'delivered' }
const nextLabel = { confirmed: 'Confirm', packed: 'Mark packed', shipped: 'Mark shipped', delivered: 'Mark delivered' }
const statusStyle = {
  pending: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700', packed: 'bg-violet-100 text-violet-700',
  shipped: 'bg-indigo-100 text-indigo-700', delivered: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
  paid: 'bg-green-100 text-green-700', failed: 'bg-red-100 text-red-700', refunded: 'bg-purple-100 text-purple-700',
  verification_pending: 'bg-amber-100 text-amber-800', rejected: 'bg-red-100 text-red-700',
}

const orderTotal = (order) => Number(order.grandTotalPaise ?? Math.round(Number(order.total || 0) * 100))
const itemPrice = (item) => Number(item.unitSalePricePaise ?? Math.round(Number(item.price || 0) * 100))
const fulfilment = (order) => order.fulfilmentStatus || order.status || 'pending'
const paymentStatus = (order) => order.payment?.status || order.paymentStatus || 'pending'

const OrdersTab = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState('')
  const [error, setError] = useState('')
  const [queryText, setQueryText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [cancelling, setCancelling] = useState(null)
  const [cancellation, setCancellation] = useState({ reasonCode: 'out_of_stock', customerMessage: '', internalNote: '' })

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getSnapshot(['orders'])
      setOrders(data.orders.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
      setError('')
    } catch (nextError) { setError(nextError.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => orders.filter((order) => {
    const needle = queryText.toLowerCase().trim()
    const search = [order.orderNumber, order.id, order.userEmail, order.address?.fullName, ...(order.items || []).flatMap((item) => [item.sku, item.name])].join(' ').toLowerCase()
    return (!needle || search.includes(needle)) && (statusFilter === 'all' || fulfilment(order) === statusFilter) && (paymentFilter === 'all' || paymentStatus(order) === paymentFilter)
  }), [orders, queryText, statusFilter, paymentFilter])

  const transition = async (order, newStatus) => {
    setUpdating(order.id); setError('')
    try { await adminApi.transitionOrder(order.id, newStatus); await load() }
    catch (nextError) { setError(nextError.message) } finally { setUpdating('') }
  }

  const cancel = async (event) => {
    event.preventDefault(); setUpdating(cancelling.id); setError('')
    try {
      await adminApi.cancelOrder({ orderId: cancelling.id, ...cancellation })
      setCancelling(null); setCancellation({ reasonCode: 'out_of_stock', customerMessage: '', internalNote: '' }); await load()
    } catch (nextError) { setError(nextError.message) } finally { setUpdating('') }
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between gap-3 mb-5"><div><h2 className="text-xl font-bold text-gray-800">Orders</h2><p className="text-sm text-gray-500">Payment and fulfilment are tracked independently</p></div><button onClick={load} className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg"><RefreshCw size={16} /> Refresh</button></div>
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      <div className="bg-white border rounded-xl p-4 mb-5 grid md:grid-cols-3 gap-3"><div className="relative"><Search size={16} className="absolute left-3 top-3 text-gray-400" /><input value={queryText} onChange={(e) => setQueryText(e.target.value)} placeholder="Order, customer, SKU…" className="w-full border rounded-lg py-2 pl-9 pr-3" /></div><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3"><option value="all">All fulfilment statuses</option>{['pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'].map((value) => <option key={value}>{value}</option>)}</select><select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="border rounded-lg px-3"><option value="all">All payment statuses</option>{['pending', 'verification_pending', 'paid', 'rejected', 'failed', 'refunded', 'partially_refunded'].map((value) => <option key={value}>{value.replaceAll('_', ' ')}</option>)}</select></div>

      {loading ? <div className="text-center py-12 text-gray-400">Loading orders…</div> : filtered.length === 0 ? <div className="text-center py-12 text-gray-400"><ShoppingBag className="mx-auto mb-2" />No matching orders</div> : <div className="space-y-4">{filtered.map((order) => {
        const current = fulfilment(order); const payment = paymentStatus(order); const next = nextStatus[current]
        const requiresPaymentReview = order.payment?.method === 'online' && payment !== 'paid'
        return <article key={order.id} className="bg-white border rounded-xl overflow-hidden"><header className="p-4 bg-gray-50 border-b flex flex-wrap justify-between gap-3"><div><p className="font-bold">#{order.orderNumber || order.id.slice(0, 8).toUpperCase()}</p><p className="text-xs text-gray-500">{order.createdAt?.toDate?.().toLocaleString('en-IN') || 'Legacy order'}</p></div><div className="flex items-center gap-2"><span className={`px-2 py-1 rounded-full text-xs capitalize ${statusStyle[current] || 'bg-gray-100'}`}>{current}</span><span className={`px-2 py-1 rounded-full text-xs capitalize ${statusStyle[payment] || 'bg-amber-100 text-amber-700'}`}>Payment: {payment.replaceAll('_', ' ')}</span><strong>{formatMoney(orderTotal(order))}</strong></div></header><div className="p-5 grid lg:grid-cols-3 gap-5"><section className="text-sm space-y-2"><h3 className="text-xs uppercase text-gray-400">Customer</h3><p className="font-semibold">{order.address?.fullName || '—'}</p><p className="flex gap-2 text-gray-500"><Mail size={14} />{order.userEmail || '—'}</p><p className="flex gap-2 text-gray-500"><Phone size={14} />{order.address?.phone || '—'}</p><p className="flex gap-2 text-gray-500"><MapPin size={14} />{[order.address?.line1, order.address?.city, order.address?.pincode].filter(Boolean).join(', ')}</p><p>Payment method: Online QR payment</p>{requiresPaymentReview && <p className="text-amber-700 bg-amber-50 rounded p-2">Review this payment in the Payments section before confirming.</p>}</section><section className="lg:col-span-2"><h3 className="text-xs uppercase text-gray-400 mb-2 flex gap-2"><Package size={14} />Items</h3><div className="border rounded-lg divide-y">{(order.items || []).map((item, index) => <div key={`${item.variantId || item.id}-${index}`} className="p-3 flex flex-wrap justify-between gap-2 text-sm"><span>{item.name} <span className="text-gray-400">{item.sku ? `(${item.sku})` : ''}</span><br /><span className="text-xs text-gray-500">{item.selectedColor?.name || item.selectedColor || ''}{item.selectedSize ? ` · ${item.selectedSize}` : ''}</span></span><span>{item.quantity} × {formatMoney(itemPrice(item))} = <strong>{formatMoney(itemPrice(item) * item.quantity)}</strong></span></div>)}</div>{order.cancellation && <div className="mt-3 bg-red-50 border border-red-100 text-red-700 rounded p-3 text-sm"><strong>Cancellation:</strong> {order.cancellation.customerMessage}{order.payment?.refundStatus === 'required' && <span className="block font-semibold mt-1">Refund action required</span>}</div>}</section></div><footer className="p-4 border-t bg-gray-50 flex flex-wrap justify-end gap-2">{!['cancelled', 'delivered', 'shipped'].includes(current) && <button disabled={updating === order.id} onClick={() => { setCancelling(order); setCancellation({ reasonCode: 'out_of_stock', customerMessage: '', internalNote: '' }) }} className="border border-red-200 text-red-600 rounded-lg px-4 py-2 flex gap-2"><XCircle size={16} />Cancel</button>}{next && !(next === 'confirmed' && requiresPaymentReview) && <button disabled={updating === order.id} onClick={() => transition(order, next)} className="bg-brown-dark text-white rounded-lg px-4 py-2 flex gap-2">{next === 'shipped' ? <Truck size={16} /> : <CheckCircle size={16} />}{updating === order.id ? 'Updating…' : nextLabel[next]}</button>}</footer></article>
      })}</div>}

      {cancelling && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl max-w-lg w-full"><header className="p-5 border-b flex justify-between"><div><h3 className="font-bold text-lg">Cancel order #{cancelling.orderNumber}</h3><p className="text-sm text-gray-500">Stock and seller entries will be reversed safely.</p></div><button onClick={() => setCancelling(null)}><X /></button></header><form onSubmit={cancel} className="p-5 space-y-4"><label className="block text-sm font-medium">Reason *<select required value={cancellation.reasonCode} onChange={(e) => setCancellation({ ...cancellation, reasonCode: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2"><option value="out_of_stock">Stock unavailable</option><option value="customer_request">Customer requested</option><option value="address_issue">Address/delivery issue</option><option value="payment_issue">Payment issue</option><option value="other">Other</option></select></label><label className="block text-sm font-medium">Message to customer *<textarea required minLength="10" value={cancellation.customerMessage} onChange={(e) => setCancellation({ ...cancellation, customerMessage: e.target.value })} rows="4" className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Explain why the order is cancelled and what happens next." /></label><label className="block text-sm font-medium">Internal note<textarea value={cancellation.internalNote} onChange={(e) => setCancellation({ ...cancellation, internalNote: e.target.value })} rows="2" className="mt-1 w-full border rounded-lg px-3 py-2" /></label><div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-sm">Customer message preview: “{cancellation.customerMessage || 'Enter a customer-facing explanation above.'}”</div><div className="flex justify-end gap-3"><button type="button" onClick={() => setCancelling(null)} className="border rounded-lg px-4 py-2">Keep order</button><button className="bg-red-600 text-white rounded-lg px-4 py-2">Cancel order and notify</button></div></form></div></div>}
    </div>
  )
}

export default OrdersTab
