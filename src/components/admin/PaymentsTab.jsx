import { useEffect, useMemo, useState } from 'react'
import { CheckCircle, CreditCard, ExternalLink, RefreshCw, Search, X, XCircle } from 'lucide-react'
import { adminApi } from '../../services/commerceApi'
import { fetchPaymentProofObjectUrl } from '../../services/paymentUploads'
import { formatMoney } from '../../lib/commerce'

const paymentStatus = (order) => order.payment?.status || order.paymentStatus || 'pending'

const statusStyle = {
  verification_pending: 'bg-amber-100 text-amber-800',
  paid: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  pending: 'bg-gray-100 text-gray-700',
}

const PaymentProof = ({ proofId, orderNumber }) => {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    let objectUrl = ''
    if (!proofId) return undefined
    fetchPaymentProofObjectUrl(proofId).then((nextUrl) => {
      objectUrl = nextUrl
      if (active) setUrl(nextUrl)
      else URL.revokeObjectURL(nextUrl)
    }).catch((nextError) => {
      if (active) setError(nextError.message)
    })
    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [proofId])

  if (!proofId) return <div className="h-56 bg-gray-50 rounded-lg flex items-center justify-center text-sm text-gray-400">No proof attached</div>
  if (error) return <div className="h-56 bg-red-50 rounded-lg flex items-center justify-center text-sm text-red-600 p-4 text-center">{error}</div>
  if (!url) return <div className="h-56 bg-gray-50 rounded-lg flex items-center justify-center text-sm text-gray-400">Loading payment proof…</div>
  return (
    <a href={url} target="_blank" rel="noreferrer" className="relative block group" title="Open full-size payment proof">
      <img src={url} alt={`Payment proof for order ${orderNumber}`} className="w-full h-56 object-contain bg-gray-50 rounded-lg border" />
      <span className="absolute right-2 bottom-2 bg-black/70 text-white rounded px-2 py-1 text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100"><ExternalLink size={12} />Open</span>
    </a>
  )
}

const PaymentsTab = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('verification_pending')
  const [reviewing, setReviewing] = useState(null)
  const [review, setReview] = useState({ decision: 'approve', reference: '', customerMessage: '', internalNote: '' })

  const load = async () => {
    setLoading(true)
    try {
      const snapshot = await adminApi.getSnapshot(['orders'])
      setOrders((snapshot.orders || []).filter((order) => order.payment?.method === 'online' && order.payment?.mode === 'manual_qr'))
      setError('')
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => orders
    .filter((order) => status === 'all' || paymentStatus(order) === status)
    .filter((order) => {
      const needle = query.trim().toLowerCase()
      return !needle || [order.orderNumber, order.userEmail, order.address?.fullName, order.payment?.reference]
        .filter(Boolean).join(' ').toLowerCase().includes(needle)
    })
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)), [orders, query, status])

  const openReview = (order, decision) => {
    setError(''); setMessage('')
    setReviewing(order)
    setReview({ decision, reference: '', customerMessage: '', internalNote: '' })
  }

  const submitReview = async (event) => {
    event.preventDefault()
    if (!reviewing) return
    setUpdating(reviewing.id); setError(''); setMessage('')
    try {
      await adminApi.verifyManualPayment({
        orderId: reviewing.id,
        decision: review.decision,
        reference: review.reference.trim(),
        customerMessage: review.customerMessage.trim(),
        internalNote: review.internalNote.trim(),
      })
      const orderNumber = reviewing.orderNumber || reviewing.id.slice(0, 8).toUpperCase()
      setReviewing(null)
      await load()
      setMessage(review.decision === 'approve'
        ? `Payment for #${orderNumber} was verified and the order was confirmed.`
        : `Payment for #${orderNumber} was rejected and the order was cancelled.`)
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setUpdating('')
    }
  }

  return (
    <div>
      <div className="flex flex-wrap justify-between gap-3 mb-5">
        <div><h2 className="text-xl font-bold text-gray-800">Online payments</h2><p className="text-sm text-gray-500">Review customer screenshots before payment and order confirmation</p></div>
        <button onClick={load} className="flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-lg"><RefreshCw size={16} />Refresh</button>
      </div>
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {message && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">{message}</div>}
      <div className="bg-white border rounded-xl p-4 mb-5 grid md:grid-cols-[1fr_260px] gap-3">
        <div className="relative"><Search size={16} className="absolute left-3 top-3 text-gray-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Order, customer, transaction reference…" className="w-full border rounded-lg py-2 pl-9 pr-3" /></div>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="border rounded-lg px-3 py-2"><option value="verification_pending">Awaiting verification</option><option value="paid">Approved / paid</option><option value="rejected">Rejected</option><option value="all">All manual payments</option></select>
      </div>

      {loading ? <div className="text-center py-12 text-gray-400">Loading payments…</div> : filtered.length === 0 ? (
        <div className="text-center py-14 text-gray-400 bg-white border rounded-xl"><CreditCard className="mx-auto mb-2" />No matching payments</div>
      ) : (
        <div className="grid xl:grid-cols-2 gap-5">
          {filtered.map((order) => {
            const current = paymentStatus(order)
            return (
              <article key={order.id} className="bg-white border rounded-xl p-5">
                <header className="flex flex-wrap justify-between gap-3 mb-4">
                  <div><p className="font-bold">#{order.orderNumber || order.id.slice(0, 8).toUpperCase()}</p><p className="text-sm text-gray-500">{order.address?.fullName || '—'} · {order.userEmail || '—'}</p></div>
                  <div className="text-right"><strong>{formatMoney(order.grandTotalPaise)}</strong><p><span className={`inline-block mt-1 px-2 py-1 rounded-full text-xs capitalize ${statusStyle[current] || statusStyle.pending}`}>{current.replaceAll('_', ' ')}</span></p></div>
                </header>
                <PaymentProof proofId={order.payment?.proofId} orderNumber={order.orderNumber} />
                <div className="mt-3 text-xs text-gray-500 space-y-1">
                  <p>Submitted: {order.payment?.submittedAt?.toDate?.().toLocaleString('en-IN') || '—'}</p>
                  {order.payment?.reference && <p>Verification reference: <strong className="text-gray-700">{order.payment.reference}</strong></p>}
                  <p>Order status: <span className="capitalize">{order.fulfilmentStatus || order.status}</span></p>
                </div>
                {current === 'verification_pending' && (
                  <footer className="mt-4 pt-4 border-t flex justify-end gap-2">
                    <button type="button" disabled={updating === order.id} onClick={() => openReview(order, 'reject')} className="border border-red-200 text-red-600 rounded-lg px-4 py-2 flex items-center gap-2 disabled:opacity-50"><XCircle size={16} />Reject & cancel</button>
                    <button type="button" disabled={updating === order.id} onClick={() => openReview(order, 'approve')} className="bg-green-600 text-white rounded-lg px-4 py-2 flex items-center gap-2 disabled:opacity-50"><CheckCircle size={16} />Verify & confirm</button>
                  </footer>
                )}
              </article>
            )
          })}
        </div>
      )}

      {reviewing && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <header className="p-5 border-b flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold">{review.decision === 'approve' ? 'Verify payment and confirm order' : 'Reject payment and cancel order'}</h3>
                <p className="text-sm text-gray-500 mt-1">Order #{reviewing.orderNumber || reviewing.id.slice(0, 8).toUpperCase()} · {formatMoney(reviewing.grandTotalPaise)}</p>
              </div>
              <button type="button" onClick={() => setReviewing(null)} disabled={Boolean(updating)} className="text-gray-500 hover:text-gray-800"><X size={20} /></button>
            </header>
            <form onSubmit={submitReview} className="p-5 space-y-4">
              {review.decision === 'approve' ? (
                <>
                  <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-3 text-sm">This marks the full amount paid, commits the reserved stock, and changes the order to confirmed.</div>
                  <label className="block text-sm font-medium">UPI transaction reference / verification note *<input autoFocus required minLength="2" maxLength="200" value={review.reference} onChange={(event) => setReview({ ...review, reference: event.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Enter the verified UTR or reference" /></label>
                </>
              ) : (
                <>
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 text-sm">This cancels the order and releases all reserved stock.</div>
                  <label className="block text-sm font-medium">Message to customer *<textarea autoFocus required minLength="10" maxLength="1000" rows="4" value={review.customerMessage} onChange={(event) => setReview({ ...review, customerMessage: event.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Explain why the payment could not be verified" /></label>
                </>
              )}
              <label className="block text-sm font-medium">Internal note<textarea maxLength="2000" rows="2" value={review.internalNote} onChange={(event) => setReview({ ...review, internalNote: event.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Optional; not shown to the customer" /></label>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setReviewing(null)} disabled={Boolean(updating)} className="border rounded-lg px-4 py-2 disabled:opacity-50">Go back</button>
                <button disabled={Boolean(updating)} className={`${review.decision === 'approve' ? 'bg-green-600' : 'bg-red-600'} text-white rounded-lg px-4 py-2 disabled:opacity-50`}>
                  {updating ? 'Saving…' : review.decision === 'approve' ? 'Verify payment & confirm' : 'Reject payment & cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentsTab
