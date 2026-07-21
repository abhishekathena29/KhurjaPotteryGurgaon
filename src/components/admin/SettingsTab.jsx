import { useEffect, useState } from 'react'
import { QrCode, Save, Upload } from 'lucide-react'
import { adminApi } from '../../services/commerceApi'
import { invalidateCatalogue } from '../../services/catalogueApi'
import { uploadPaymentQr } from '../../services/paymentUploads'
import { paiseToRupees, rupeesToPaise } from '../../lib/commerce'

const SettingsTab = () => {
  const [form, setForm] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploadingQr, setUploadingQr] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.getSnapshot([], true).then((snapshot) => {
      if (!snapshot.commerceConfig) throw new Error('Run the commerce configuration seed before using the store.')
      const data = snapshot.commerceConfig
      setForm({
        ...data,
        deliveryFee: paiseToRupees(data.deliveryFeePaise),
        manualPaymentVerificationTtlMinutes: data.manualPaymentVerificationTtlMinutes || data.reservationTtlMinutes,
        manualPaymentQrUrl: data.manualPaymentQrUrl || '',
        manualPaymentPayeeName: data.manualPaymentPayeeName || '',
        manualPaymentInstructions: data.manualPaymentInstructions || '',
      })
    }).catch((nextError) => setError(nextError.message))
  }, [])

  const payload = () => ({
    currency: 'INR',
    deliveryFeePaise: rupeesToPaise(form.deliveryFee),
    prepaidEnabled: Boolean(form.prepaidEnabled),
    reservationTtlMinutes: Number(form.reservationTtlMinutes),
    manualPaymentVerificationTtlMinutes: Number(form.manualPaymentVerificationTtlMinutes),
    manualPaymentQrUrl: form.manualPaymentQrUrl,
    manualPaymentPayeeName: form.manualPaymentPayeeName,
    manualPaymentInstructions: form.manualPaymentInstructions,
    skuPrefix: form.skuPrefix,
    skuPadding: Number(form.skuPadding),
    orderPrefix: form.orderPrefix,
    orderPadding: Number(form.orderPadding),
    bestSellerWindowDays: Number(form.bestSellerWindowDays),
    bestSellerLimit: Number(form.bestSellerLimit),
  })

  const save = async (event) => {
    event.preventDefault()
    setSaving(true); setError(''); setMessage('')
    try {
      if (form.prepaidEnabled && !form.manualPaymentQrUrl) throw new Error('Upload a payment QR code before enabling online payments.')
      await adminApi.updateCommerceConfig(payload())
      invalidateCatalogue()
      setMessage('Commerce and payment settings saved. Storefront rules update immediately.')
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setSaving(false)
    }
  }

  const uploadQr = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setUploadingQr(true); setError(''); setMessage('')
    try {
      const uploaded = await uploadPaymentQr(file)
      setForm((current) => ({ ...current, manualPaymentQrUrl: uploaded.url }))
      invalidateCatalogue()
      setMessage('QR code uploaded. Review the preview and save settings to enable or update online payments.')
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setUploadingQr(false)
    }
  }

  if (!form) return <div className="text-gray-500">{error || 'Loading settings…'}</div>

  return (
    <div className="max-w-4xl">
      <h2 className="text-xl font-bold mb-1">Commerce settings</h2>
      <p className="text-sm text-gray-500 mb-5">Business and payment rules are stored in the backend instead of being embedded in page code.</p>
      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg">{error}</div>}
      {message && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg">{message}</div>}
      <form onSubmit={save} className="bg-white border rounded-xl p-6 space-y-6">
        <section>
          <h3 className="font-semibold mb-3">Checkout</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-sm">Delivery fee (₹)<input type="number" min="0" step="0.01" value={form.deliveryFee} onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
            <label className="text-sm">Standard reservation (minutes)<input type="number" min="1" max="1440" value={form.reservationTtlMinutes} onChange={(e) => setForm({ ...form, reservationTtlMinutes: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
          </div>
          <label className="inline-flex mt-4"><input type="checkbox" checked={form.prepaidEnabled} onChange={(e) => setForm({ ...form, prepaidEnabled: e.target.checked })} className="mr-2" />Enable online QR payments</label>
        </section>

        <section className="border-t pt-5">
          <div className="flex items-center gap-2 mb-1"><QrCode size={19} /><h3 className="font-semibold">Manual online payments</h3></div>
          <p className="text-sm text-gray-500 mb-4">Customers see this QR at checkout and must upload a successful-payment screenshot before an order is submitted for review.</p>
          <div className="grid md:grid-cols-[220px_1fr] gap-5">
            <div className="border rounded-xl p-3 bg-gray-50 min-h-56 flex items-center justify-center">
              {form.manualPaymentQrUrl
                ? <img src={form.manualPaymentQrUrl} alt="Current online payment QR" className="max-h-52 max-w-full object-contain" />
                : <div className="text-center text-gray-400 text-sm"><QrCode size={44} className="mx-auto mb-2" />No QR uploaded</div>}
            </div>
            <div className="space-y-4">
              <label className="inline-flex cursor-pointer items-center gap-2 border border-blue-300 text-blue-700 rounded-lg px-4 py-2 font-medium">
                <Upload size={17} />{uploadingQr ? 'Uploading…' : form.manualPaymentQrUrl ? 'Replace QR code' : 'Upload QR code'}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadQr} disabled={uploadingQr} className="hidden" />
              </label>
              <label className="block text-sm">Payee / business name<input maxLength="160" value={form.manualPaymentPayeeName} onChange={(e) => setForm({ ...form, manualPaymentPayeeName: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Name customers should verify in their payment app" /></label>
              <label className="block text-sm">Payment instructions<textarea maxLength="1000" rows="3" value={form.manualPaymentInstructions} onChange={(e) => setForm({ ...form, manualPaymentInstructions: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" placeholder="Instructions displayed below the QR" /></label>
              <label className="block text-sm">Verification window (minutes)<input type="number" min="1" max="10080" value={form.manualPaymentVerificationTtlMinutes} onChange={(e) => setForm({ ...form, manualPaymentVerificationTtlMinutes: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /><span className="text-xs text-gray-500">Stock remains reserved until payment is reviewed or this window expires.</span></label>
            </div>
          </div>
        </section>

        <section className="border-t pt-5">
          <h3 className="font-semibold mb-3">Automatic identifiers</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="text-sm">SKU prefix<input required value={form.skuPrefix} onChange={(e) => setForm({ ...form, skuPrefix: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
            <label className="text-sm">SKU padding<input required type="number" min="1" max="12" value={form.skuPadding} onChange={(e) => setForm({ ...form, skuPadding: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
            <label className="text-sm">Order prefix<input required value={form.orderPrefix} onChange={(e) => setForm({ ...form, orderPrefix: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
            <label className="text-sm">Order padding<input required type="number" min="1" max="12" value={form.orderPadding} onChange={(e) => setForm({ ...form, orderPadding: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
          </div>
        </section>

        <section className="border-t pt-5">
          <h3 className="font-semibold mb-3">Best sellers</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm">Rolling window (days)<input type="number" min="1" max="365" value={form.bestSellerWindowDays} onChange={(e) => setForm({ ...form, bestSellerWindowDays: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
            <label className="text-sm">Number of best sellers<input type="number" min="1" max="100" value={form.bestSellerLimit} onChange={(e) => setForm({ ...form, bestSellerLimit: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
          </div>
        </section>
        <button disabled={saving || uploadingQr} className="bg-blue-600 text-white rounded-lg px-5 py-2 flex gap-2 items-center disabled:opacity-60"><Save size={17} />{saving ? 'Saving…' : 'Save settings'}</button>
      </form>
    </div>
  )
}

export default SettingsTab
