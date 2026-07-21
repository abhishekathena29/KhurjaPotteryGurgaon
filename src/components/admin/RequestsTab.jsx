import { useEffect, useMemo, useState } from 'react'
import { adminApi } from '../../services/commerceApi'
import { RefreshCw, Search } from 'lucide-react'

const statuses = ['new', 'reviewing', 'quoted', 'accepted', 'in_progress', 'fulfilled', 'rejected', 'cancelled']

const RequestsTab = () => {
  const [requests, setRequests] = useState([])
  const [selected, setSelected] = useState(null)
  const [queryText, setQueryText] = useState('')
  const [status, setStatus] = useState('all')
  const [form, setForm] = useState({ status: 'new', assignedTo: '', adminNotes: '', customerMessage: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getSnapshot(['productRequests'])
      setRequests(data.productRequests.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)))
    } catch (nextError) { setError(nextError.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = useMemo(() => requests.filter((request) => {
    const searchable = [request.name, request.contactNumber, request.userEmail, request.productCategory, request.preferredColor].join(' ').toLowerCase()
    return (!queryText || searchable.includes(queryText.toLowerCase())) && (status === 'all' || request.status === status)
  }), [requests, queryText, status])

  const choose = (request) => {
    setSelected(request)
    setForm({ status: request.status || 'new', assignedTo: request.assignedTo || '', adminNotes: request.adminNotes || '', customerMessage: '' })
  }

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError('')
    try { await adminApi.updateProductRequest({ requestId: selected.id, ...form }); await load(); setSelected(null) }
    catch (nextError) { setError(nextError.message) } finally { setSaving(false) }
  }

  return <div><div className="flex justify-between mb-5"><div><h2 className="text-xl font-bold">Requested products</h2><p className="text-sm text-gray-500">Every customer submission and follow-up status</p></div><button onClick={load} className="flex gap-2 items-center bg-gray-100 rounded-lg px-4"><RefreshCw size={16} />Refresh</button></div>{error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">{error}</div>}<div className="bg-white border rounded-xl p-4 mb-4 grid md:grid-cols-2 gap-3"><div className="relative"><Search size={16} className="absolute left-3 top-3 text-gray-400" /><input value={queryText} onChange={(e) => setQueryText(e.target.value)} placeholder="Customer, phone, category…" className="w-full border rounded-lg pl-9 pr-3 py-2" /></div><select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded-lg px-3"><option value="all">All statuses</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></div><div className="bg-white border rounded-xl overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-left"><tr><th className="p-3">Customer</th><th className="p-3">Requested product</th><th className="p-3">Expected by</th><th className="p-3">Status</th><th className="p-3"></th></tr></thead><tbody className="divide-y">{loading ? <tr><td colSpan="5" className="p-10 text-center">Loading…</td></tr> : filtered.map((request) => <tr key={request.id}><td className="p-3"><p className="font-medium">{request.name}</p><p className="text-gray-500">{request.contactNumber}<br />{request.userEmail}</p></td><td className="p-3"><p>{request.productCategory}</p><p className="text-gray-500">{[request.preferredColor, request.productSize].filter(Boolean).join(' · ')}</p></td><td className="p-3">{request.expectedByDate || '—'}</td><td className="p-3 capitalize">{request.status}</td><td className="p-3 text-right"><button onClick={() => choose(request)} className="text-blue-600">View / update</button></td></tr>)}</tbody></table></div>{selected && <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto p-4"><div className="bg-white max-w-2xl mx-auto my-8 rounded-2xl"><header className="p-5 border-b"><h3 className="font-bold text-lg">Request #{selected.id.slice(0, 8).toUpperCase()}</h3></header><div className="p-5 grid md:grid-cols-2 gap-4 text-sm"><div><p className="text-gray-500">Customer</p><p>{selected.name}<br />{selected.contactNumber}<br />{selected.userEmail}</p></div><div><p className="text-gray-500">Product</p><p>{selected.productCategory}<br />Colour: {selected.preferredColor || '—'}<br />Size: {selected.productSize || '—'}</p></div><div><p className="text-gray-500">Expected by</p><p>{selected.expectedByDate || '—'}</p></div><div><p className="text-gray-500">Reference</p>{selected.referenceProductLink ? <a href={selected.referenceProductLink} target="_blank" rel="noreferrer" className="text-blue-600 break-all">{selected.referenceProductLink}</a> : '—'}</div><div className="md:col-span-2"><p className="text-gray-500">Additional details</p><p className="whitespace-pre-wrap">{selected.additionalDetails || '—'}</p></div></div><form onSubmit={save} className="p-5 border-t space-y-3"><div className="grid grid-cols-2 gap-3"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="border rounded-lg px-3 py-2">{statuses.map((item) => <option key={item}>{item}</option>)}</select><input value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })} placeholder="Assigned admin" className="border rounded-lg px-3 py-2" /></div><textarea value={form.adminNotes} onChange={(e) => setForm({ ...form, adminNotes: e.target.value })} placeholder="Private admin notes" rows="3" className="w-full border rounded-lg px-3 py-2" /><textarea value={form.customerMessage} onChange={(e) => setForm({ ...form, customerMessage: e.target.value })} placeholder="Optional update sent to customer" rows="3" className="w-full border rounded-lg px-3 py-2" /><div className="flex justify-end gap-3"><button type="button" onClick={() => setSelected(null)} className="border rounded-lg px-4 py-2">Close</button><button disabled={saving} className="bg-blue-600 text-white rounded-lg px-4 py-2">{saving ? 'Saving…' : 'Save update'}</button></div></form></div></div>}</div>
}

export default RequestsTab
