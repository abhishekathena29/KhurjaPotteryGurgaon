import { useEffect, useMemo, useState } from 'react'
import { adminApi } from '../../services/commerceApi'
import { formatMoney } from '../../lib/commerce'
import { Edit2, Plus, Save, Users, X } from 'lucide-react'

const emptySeller = {
  id: '', name: '', phone: '', email: '', address: '', payoutMethod: '', payoutDetails: '',
  notificationChannels: ['email'], status: 'active',
}

const SellersTab = () => {
  const [sellers, setSellers] = useState([])
  const [ledger, setLedger] = useState([])
  const [settlements, setSettlements] = useState([])
  const [form, setForm] = useState(emptySeller)
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getSnapshot(['sellers', 'sellerLedger', 'settlements'])
      setSellers(data.sellers)
      setLedger(data.sellerLedger)
      setSettlements(data.settlements)
    } catch (nextError) { setError(nextError.message) } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const totals = useMemo(() => sellers.reduce((result, seller) => {
    const entries = ledger.filter((entry) => entry.sellerId === seller.id)
    result[seller.id] = {
      payable: entries.filter((entry) => entry.status === 'payable').reduce((sum, entry) => sum + Number(entry.amountPaise || 0), 0),
      pending: entries.filter((entry) => entry.status === 'pending').reduce((sum, entry) => sum + Number(entry.amountPaise || 0), 0),
      paid: entries.filter((entry) => entry.status === 'paid').reduce((sum, entry) => sum + Number(entry.amountPaise || 0), 0),
    }
    return result
  }, {}), [sellers, ledger])

  const save = async (event) => {
    event.preventDefault(); setSaving(true); setError('')
    try {
      await adminApi.saveSeller({ ...form, id: form.id || undefined })
      setShowModal(false); setForm(emptySeller); await load()
    } catch (nextError) { setError(nextError.message) } finally { setSaving(false) }
  }

  const createSettlement = async (seller) => {
    const entryIds = ledger.filter((entry) => entry.sellerId === seller.id && entry.status === 'payable').map((entry) => entry.id)
    if (!entryIds.length) return
    if (!window.confirm(`Create an approved settlement for ${seller.name} using ${entryIds.length} payable entries?`)) return
    try { await adminApi.createSettlement({ sellerId: seller.id, entryIds, adjustmentsPaise: 0, adjustmentNote: '' }); await load() }
    catch (nextError) { setError(nextError.message) }
  }

  const markPaid = async (settlement) => {
    const reference = window.prompt('Enter the bank/UPI payout reference. This is mandatory.')
    if (!reference?.trim()) return
    try { await adminApi.recordSettlementPayment({ settlementId: settlement.id, payoutReference: reference.trim() }); await load() }
    catch (nextError) { setError(nextError.message) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div><h2 className="text-xl font-bold text-gray-800">Sellers and amounts due</h2><p className="text-sm text-gray-500">Order-item earnings, reversals and payout settlements</p></div><button onClick={() => { setForm(emptySeller); setShowModal(true) }} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"><Plus size={18} /> Add Seller</button></div>
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
      {loading ? <div className="text-center py-10 text-gray-400">Loading seller accounts…</div> : sellers.length === 0 ? <div className="text-center py-10 text-gray-400"><Users className="mx-auto mb-2" />No sellers yet</div> : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sellers.map((seller) => <div key={seller.id} className="bg-white border rounded-xl p-5"><div className="flex justify-between"><div><h3 className="font-bold">{seller.name}</h3><p className="text-sm text-gray-500">{seller.email || seller.phone || 'No notification contact'}</p></div><button onClick={() => { setForm({ ...emptySeller, ...seller }); setShowModal(true) }} className="text-blue-600"><Edit2 size={16} /></button></div><div className="grid grid-cols-3 gap-2 my-4 text-sm"><div className="bg-amber-50 p-2 rounded"><p className="text-gray-500 text-xs">Due</p><p className="font-semibold">{formatMoney(totals[seller.id]?.payable)}</p></div><div className="bg-gray-50 p-2 rounded"><p className="text-gray-500 text-xs">Pending</p><p className="font-semibold">{formatMoney(totals[seller.id]?.pending)}</p></div><div className="bg-green-50 p-2 rounded"><p className="text-gray-500 text-xs">Paid</p><p className="font-semibold">{formatMoney(totals[seller.id]?.paid)}</p></div></div><button disabled={!totals[seller.id]?.payable} onClick={() => createSettlement(seller)} className="w-full border border-blue-200 text-blue-700 rounded-lg py-2 disabled:opacity-40">Create settlement</button></div>)}
        </div>
      )}

      <h3 className="font-bold text-gray-800 mt-8 mb-3">Settlements</h3>
      <div className="bg-white border rounded-xl overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-left"><tr><th className="p-3">Seller</th><th className="p-3">Entries</th><th className="p-3">Net amount</th><th className="p-3">Status</th><th className="p-3">Reference</th><th className="p-3"></th></tr></thead><tbody className="divide-y">{settlements.length === 0 ? <tr><td colSpan="6" className="p-8 text-center text-gray-400">No settlements yet</td></tr> : settlements.map((settlement) => <tr key={settlement.id}><td className="p-3">{settlement.sellerName}</td><td className="p-3">{settlement.entryIds?.length || 0}</td><td className="p-3 font-semibold">{formatMoney(settlement.netPayablePaise)}</td><td className="p-3 capitalize">{settlement.status}</td><td className="p-3">{settlement.payoutReference || '—'}</td><td className="p-3 text-right">{settlement.status === 'approved' && <button onClick={() => markPaid(settlement)} className="bg-green-600 text-white rounded px-3 py-1.5">Mark paid</button>}</td></tr>)}</tbody></table></div>

      {showModal && <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"><div className="bg-white rounded-2xl max-w-lg w-full"><div className="p-5 border-b flex justify-between"><h3 className="font-bold text-lg">{form.id ? 'Edit seller' : 'Add seller'}</h3><button onClick={() => setShowModal(false)}><X /></button></div><form onSubmit={save} className="p-5 space-y-3"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Seller name *" className="w-full border rounded-lg px-3 py-2" /><div className="grid grid-cols-2 gap-3"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="border rounded-lg px-3 py-2" /><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="border rounded-lg px-3 py-2" /></div><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" className="w-full border rounded-lg px-3 py-2" /><div className="grid grid-cols-2 gap-3"><input value={form.payoutMethod} onChange={(e) => setForm({ ...form, payoutMethod: e.target.value })} placeholder="Payout method" className="border rounded-lg px-3 py-2" /><input value={form.payoutDetails} onChange={(e) => setForm({ ...form, payoutDetails: e.target.value })} placeholder="Payout details" className="border rounded-lg px-3 py-2" /></div><fieldset><legend className="text-sm font-medium mb-2">Notification channels</legend><div className="flex gap-4">{['email', 'sms', 'whatsapp'].map((channel) => <label key={channel} className="capitalize text-sm"><input type="checkbox" checked={form.notificationChannels.includes(channel)} onChange={(e) => setForm({ ...form, notificationChannels: e.target.checked ? [...form.notificationChannels, channel] : form.notificationChannels.filter((item) => item !== channel) })} className="mr-1" />{channel}</label>)}</div></fieldset><div className="flex justify-end gap-3 pt-3"><button type="button" onClick={() => setShowModal(false)} className="border rounded-lg px-4 py-2">Cancel</button><button disabled={saving} className="bg-blue-600 text-white rounded-lg px-4 py-2 flex items-center gap-2"><Save size={16} />Save</button></div></form></div></div>}
    </div>
  )
}

export default SellersTab
