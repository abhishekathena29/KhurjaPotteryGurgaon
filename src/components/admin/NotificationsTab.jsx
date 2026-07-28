import { useEffect, useState } from 'react'
import { adminApi } from '../../services/commerceApi'
import { RefreshCw } from 'lucide-react'

// There is no backend to deliver these by email/SMS/WhatsApp anymore — this is an
// in-app activity log of order/settlement/request events for the admin to follow up on manually.
const NotificationsTab = () => {
  const [notifications, setNotifications] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getSnapshot(['notifications'])
      setNotifications(data.notifications.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
    } catch (nextError) { setError(nextError.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])
  return <div><div className="flex justify-between mb-5"><div><h2 className="text-xl font-bold">Customer and seller updates</h2><p className="text-sm text-gray-500">Activity log of order, payment, and settlement events — follow up with customers/sellers yourself</p></div><button onClick={load} className="flex items-center gap-2 bg-gray-100 rounded-lg px-4"><RefreshCw size={16} />Refresh</button></div>{error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">{error}</div>}<div className="bg-white border rounded-xl overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-left"><tr><th className="p-3">Type</th><th className="p-3">Reference</th><th className="p-3">Recipient</th><th className="p-3">Details</th></tr></thead><tbody className="divide-y">{loading ? <tr><td colSpan="4" className="p-10 text-center">Loading…</td></tr> : notifications.length === 0 ? <tr><td colSpan="4" className="p-10 text-center text-gray-400">No notifications</td></tr> : notifications.map((notification) => <tr key={notification.id}><td className="p-3 capitalize">{notification.type?.replaceAll('_', ' ')}</td><td className="p-3">{notification.orderNumber || notification.requestId || notification.settlementId || '—'}</td><td className="p-3">{notification.recipient?.email || notification.recipient?.phone || 'Not configured'}</td><td className="p-3 max-w-xs truncate">{notification.payload?.customerMessage || notification.payload?.reasonCode || '—'}</td></tr>)}</tbody></table></div></div>
}

export default NotificationsTab
