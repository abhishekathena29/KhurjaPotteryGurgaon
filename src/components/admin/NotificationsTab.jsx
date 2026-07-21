import { useEffect, useMemo, useState } from 'react'
import { adminApi } from '../../services/commerceApi'
import { RefreshCw } from 'lucide-react'

const NotificationsTab = () => {
  const [notifications, setNotifications] = useState([])
  const [status, setStatus] = useState('all')
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
  const filtered = useMemo(() => status === 'all' ? notifications : notifications.filter((item) => item.status === status), [notifications, status])
  const retry = async (notification) => {
    try { await adminApi.retryNotification(notification.id); await load() }
    catch (nextError) { setError(nextError.message) }
  }
  return <div><div className="flex justify-between mb-5"><div><h2 className="text-xl font-bold">Customer and seller updates</h2><p className="text-sm text-gray-500">Delivery history and retry queue for email/SMS/WhatsApp adapter</p></div><button onClick={load} className="flex items-center gap-2 bg-gray-100 rounded-lg px-4"><RefreshCw size={16} />Refresh</button></div>{error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">{error}</div>}<select value={status} onChange={(e) => setStatus(e.target.value)} className="mb-4 border rounded-lg px-3 py-2"><option value="all">All delivery statuses</option><option value="pending">Pending</option><option value="sent">Sent</option><option value="failed">Failed</option><option value="configuration_required">Configuration required</option></select><div className="bg-white border rounded-xl overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-left"><tr><th className="p-3">Type</th><th className="p-3">Reference</th><th className="p-3">Recipient</th><th className="p-3">Status</th><th className="p-3">Attempts</th><th className="p-3">Last error</th><th className="p-3"></th></tr></thead><tbody className="divide-y">{loading ? <tr><td colSpan="7" className="p-10 text-center">Loading…</td></tr> : filtered.length === 0 ? <tr><td colSpan="7" className="p-10 text-center text-gray-400">No notifications</td></tr> : filtered.map((notification) => <tr key={notification.id}><td className="p-3 capitalize">{notification.type?.replaceAll('_', ' ')}</td><td className="p-3">{notification.orderNumber || notification.requestId || notification.settlementId || '—'}</td><td className="p-3">{notification.recipient?.email || notification.recipient?.phone || 'Not configured'}</td><td className="p-3 capitalize">{notification.status}</td><td className="p-3">{notification.attempts || 0}</td><td className="p-3 text-red-600 max-w-xs truncate">{notification.lastError || '—'}</td><td className="p-3">{['failed', 'configuration_required'].includes(notification.status) && <button onClick={() => retry(notification)} className="text-blue-600">Retry</button>}</td></tr>)}</tbody></table></div></div>
}

export default NotificationsTab
