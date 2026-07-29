import { useEffect, useMemo, useState } from 'react'
import { adminApi } from '../../services/commerceApi'
import { createProductId, uploadProductImage } from '../../services/productImages'
import { invalidateCatalogue } from '../../services/catalogueApi'
import { calculateMargin, calculateSalePricePaise, formatMoney, normalizeProduct, rupeesToPaise } from '../../lib/commerce'
import { Edit2, Image, Plus, Save, Search, Trash2, Upload, X } from 'lucide-react'

const blankVariant = () => ({
  id: '',
  sku: '',
  colorName: '',
  colorHex: '',
  size: '',
  onHandQuantity: 0,
  lowStockThreshold: 0,
  status: 'active',
  imageIds: [],
})

const blankProduct = () => ({
  id: createProductId(),
  name: '',
  categoryId: '',
  categoryName: '',
  mrp: '',
  discountPercent: 0,
  description: '',
  dimensions: '',
  images: [],
  variants: [blankVariant()],
  sellerId: '',
  sellerPayoutType: 'fixed',
  sellerPayoutValue: 0,
  unitCost: 0,
  packagingCost: 0,
  status: 'draft',
  bestSellerMode: 'auto',
  featured: false,
})

const toColorId = (name) => String(name).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const ProductsTab = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [sellers, setSellers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(blankProduct)
  const [error, setError] = useState('')
  const [queryText, setQueryText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updated')
  const [selected, setSelected] = useState(new Set())
  const [bulkAction, setBulkAction] = useState('set_discount')
  const [bulkValue, setBulkValue] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const load = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getSnapshot(['products', 'categories', 'sellers'])
      setProducts(data.products.map((product) => normalizeProduct(product.id, product)))
      setCategories(data.categories.sort((a, b) => a.name.localeCompare(b.name)))
      setSellers(data.sellers.filter((seller) => seller.status !== 'archived'))
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const filtered = useMemo(() => {
    const needle = queryText.trim().toLowerCase()
    const next = products.filter((product) => {
      const searchable = [product.name, product.category, ...product.variants.map((variant) => variant.sku)].join(' ').toLowerCase()
      if (needle && !searchable.includes(needle)) return false
      if (statusFilter !== 'all' && product.status !== statusFilter) return false
      if (stockFilter === 'out' && product.availableQuantity !== 0) return false
      if (stockFilter === 'available' && product.availableQuantity <= 0) return false
      if (stockFilter === 'low' && product.stockStatus !== 'low_stock') return false
      return true
    })
    next.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name)
      if (sortBy === 'price') return b.salePricePaise - a.salePricePaise
      if (sortBy === 'stock') return b.availableQuantity - a.availableQuantity
      return (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)
    })
    return next
  }, [products, queryText, statusFilter, stockFilter, sortBy])

  useEffect(() => { setPage(1) }, [queryText, statusFilter, stockFilter, sortBy])
  const visible = filtered.slice((page - 1) * pageSize, page * pageSize)
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))

  const pricing = useMemo(() => {
    try {
      const mrpPaise = rupeesToPaise(form.mrp || 0)
      const salePricePaise = calculateSalePricePaise(mrpPaise, form.discountPercent)
      const sellerPayoutPaise = form.sellerPayoutType === 'percentage'
        ? Math.round(salePricePaise * Number(form.sellerPayoutValue || 0) / 100)
        : rupeesToPaise(form.sellerPayoutValue || 0)
      const margin = calculateMargin({
        salePricePaise,
        sellerPayoutPaise,
        unitCostPaise: rupeesToPaise(form.unitCost || 0),
        packagingCostPaise: rupeesToPaise(form.packagingCost || 0),
      })
      return { mrpPaise, salePricePaise, sellerPayoutPaise, ...margin }
    } catch {
      return { mrpPaise: 0, salePricePaise: 0, sellerPayoutPaise: 0, amountPaise: 0, percent: 0 }
    }
  }, [form.mrp, form.discountPercent, form.sellerPayoutType, form.sellerPayoutValue, form.unitCost, form.packagingCost])

  const openNew = () => {
    setForm(blankProduct())
    setError('')
    setShowModal(true)
  }

  const openEdit = async (product) => {
    setSaving(true)
    setError('')
    try {
      const detail = await adminApi.getProduct(product.id)
      const commercial = detail.commercials || {}
      setForm({
        id: detail.id,
        name: detail.name || '',
        categoryId: detail.categoryId || '',
        categoryName: detail.categoryName || '',
        mrp: Number(detail.mrpPaise || 0) / 100,
        discountPercent: detail.discountPercent || 0,
        description: detail.description || '',
        dimensions: detail.dimensions || '',
        images: detail.images || [],
        variants: detail.variants.map((variant) => ({
          id: variant.id,
          sku: variant.sku || '',
          colorName: variant.color?.name || '',
          colorHex: variant.color?.hex || '',
          size: variant.size || '',
          onHandQuantity: variant.onHandQuantity || 0,
          lowStockThreshold: variant.lowStockThreshold || 0,
          status: variant.status || 'active',
          imageIds: variant.imageIds || [],
        })),
        sellerId: commercial.sellerId || '',
        sellerPayoutType: commercial.sellerPayoutType || 'fixed',
        sellerPayoutValue: commercial.sellerPayoutType === 'percentage'
          ? commercial.sellerPayoutValue || 0
          : Number(commercial.sellerPayoutValue || 0) / 100,
        unitCost: Number(commercial.unitCostPaise || 0) / 100,
        packagingCost: Number(commercial.packagingCostPaise || 0) / 100,
        status: detail.status || 'draft',
        bestSellerMode: detail.merchandising?.bestSellerMode || 'auto',
        featured: Boolean(detail.merchandising?.featured),
      })
      setShowModal(true)
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setSaving(false)
    }
  }

  const updateVariant = (index, field, value) => setForm((current) => ({
    ...current,
    variants: current.variants.map((variant, position) => position === index ? { ...variant, [field]: value } : variant),
  }))

  const removeVariant = (index) => {
    if (form.variants.length === 1) return
    setForm((current) => ({ ...current, variants: current.variants.filter((_, position) => position !== index) }))
  }

  const uploadImages = async (event) => {
    const files = [...event.target.files]
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      const uploaded = []
      for (const file of files) {
        const image = await uploadProductImage({ productId: form.id, file, onProgress: setUploadProgress })
        uploaded.push({ ...image, alt: form.name || file.name, sortOrder: form.images.length + uploaded.length })
      }
      setForm((current) => ({ ...current, images: [...current.images, ...uploaded] }))
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setUploading(false)
      setUploadProgress(0)
      event.target.value = ''
    }
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (!form.categoryId) throw new Error('Category is required')
      if (form.variants.some((variant) => !variant.colorName.trim())) throw new Error('Every variant requires a colour')
      const category = categories.find((candidate) => candidate.id === form.categoryId)
      const payload = {
        id: form.id,
        name: form.name,
        description: form.description,
        dimensions: form.dimensions,
        categoryId: form.categoryId,
        categoryName: category?.name || form.categoryName,
        mrpPaise: pricing.mrpPaise,
        discountPercent: Number(form.discountPercent),
        status: form.status,
        images: form.images.map((image, index) => ({ ...image, sortOrder: index })),
        variants: form.variants.map((variant) => ({
          id: variant.id || undefined,
          sku: variant.sku,
          color: { id: toColorId(variant.colorName), name: variant.colorName.trim(), hex: variant.colorHex || '' },
          size: variant.size,
          onHandQuantity: Number(variant.onHandQuantity),
          lowStockThreshold: Number(variant.lowStockThreshold),
          status: variant.status,
          imageIds: variant.imageIds,
        })),
        sellerId: form.sellerId,
        sellerPayoutType: form.sellerPayoutType,
        sellerPayoutValue: form.sellerPayoutType === 'percentage'
          ? Number(form.sellerPayoutValue)
          : rupeesToPaise(form.sellerPayoutValue || 0),
        unitCostPaise: rupeesToPaise(form.unitCost || 0),
        packagingCostPaise: rupeesToPaise(form.packagingCost || 0),
        merchandising: { bestSellerMode: form.bestSellerMode, featured: form.featured },
      }
      await adminApi.saveProduct(payload)
      invalidateCatalogue()
      setShowModal(false)
      await load()
    } catch (nextError) {
      setError(nextError.message)
    } finally {
      setSaving(false)
    }
  }

  const archive = async (product) => {
    if (!window.confirm(`Archive ${product.name}? It will disappear from the storefront.`)) return
    try {
      await adminApi.archiveProduct(product.id)
      invalidateCatalogue()
      await load()
    } catch (nextError) { setError(nextError.message) }
  }

  const runBulkUpdate = async () => {
    if (!selected.size || !bulkValue) { setError('Select products, an action and a value'); return }
    let operation
    if (bulkAction === 'set_discount') {
      const discountPercent = Number(bulkValue)
      if (!Number.isFinite(discountPercent) || discountPercent < 0 || discountPercent > 100) { setError('Discount must be from 0 to 100'); return }
      operation = { type: bulkAction, discountPercent }
    } else if (bulkAction === 'set_status') operation = { type: bulkAction, status: bulkValue }
    else if (bulkAction === 'set_best_seller_mode') operation = { type: bulkAction, mode: bulkValue }
    else {
      const category = categories.find((item) => item.id === bulkValue)
      if (!category) { setError('Select a valid category'); return }
      operation = { type: bulkAction, categoryId: category.id, categoryName: category.name }
    }
    const payload = { productIds: [...selected], operation }
    try {
      const preview = await adminApi.previewBulkProductUpdate(payload)
      if (!window.confirm(`Update discount for ${preview.affectedCount} products? ${preview.excludedCount} will be excluded.`)) return
      await adminApi.runBulkProductUpdate(payload)
      invalidateCatalogue()
      setSelected(new Set())
      setBulkValue('')
      await load()
    } catch (nextError) { setError(nextError.message) }
  }

  const toggleSelection = (id) => setSelected((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div><h2 className="text-xl font-bold text-gray-800">Products</h2><p className="text-sm text-gray-500">{filtered.length} matching products</p></div>
        <button onClick={openNew} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg"><Plus size={18} /> Add Product</button>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

      <div className="bg-white border rounded-xl p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="relative"><Search size={16} className="absolute left-3 top-3 text-gray-400" /><input value={queryText} onChange={(e) => setQueryText(e.target.value)} placeholder="Search name or SKU" className="w-full border rounded-lg py-2 pl-9 pr-3" /></div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border rounded-lg px-3 py-2"><option value="all">All statuses</option><option value="active">Active</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
        <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)} className="border rounded-lg px-3 py-2"><option value="all">All stock</option><option value="available">In stock</option><option value="low">Low stock</option><option value="out">Out of stock</option></select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="border rounded-lg px-3 py-2"><option value="updated">Recently updated</option><option value="name">Name</option><option value="price">Selling price</option><option value="stock">Available stock</option></select>
      </div>

      {selected.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex flex-wrap items-center gap-3">
          <span className="font-medium text-blue-800">{selected.size} selected</span>
          <select value={bulkAction} onChange={(e) => { setBulkAction(e.target.value); setBulkValue('') }} className="border rounded-lg px-3 py-2"><option value="set_discount">Set discount</option><option value="set_status">Set status</option><option value="set_best_seller_mode">Best-seller mode</option><option value="set_category">Change category</option></select>
          {bulkAction === 'set_discount' && <input type="number" min="0" max="100" value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} placeholder="Discount %" className="border rounded-lg px-3 py-2 w-36" />}
          {bulkAction === 'set_status' && <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} className="border rounded-lg px-3 py-2"><option value="">Select status</option><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select>}
          {bulkAction === 'set_best_seller_mode' && <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} className="border rounded-lg px-3 py-2"><option value="">Select mode</option><option value="auto">Automatic</option><option value="force_on">Always show</option><option value="force_off">Never show</option></select>}
          {bulkAction === 'set_category' && <select value={bulkValue} onChange={(e) => setBulkValue(e.target.value)} className="border rounded-lg px-3 py-2"><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>}
          <button onClick={runBulkUpdate} className="bg-blue-600 text-white rounded-lg px-4 py-2">Preview & apply</button>
          <button onClick={() => setSelected(new Set())} className="text-blue-700">Clear</button>
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left"><tr><th className="p-3"><input type="checkbox" checked={visible.length > 0 && visible.every((product) => selected.has(product.id))} onChange={(e) => setSelected((current) => { const next = new Set(current); visible.forEach((product) => e.target.checked ? next.add(product.id) : next.delete(product.id)); return next })} /></th><th className="p-3">Product</th><th className="p-3">SKU / variants</th><th className="p-3">Pricing</th><th className="p-3">Stock</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
          <tbody className="divide-y">
            {loading ? <tr><td colSpan="7" className="p-10 text-center text-gray-400">Loading products…</td></tr> : visible.map((product) => (
              <tr key={product.id} className="hover:bg-gray-50">
                <td className="p-3"><input type="checkbox" checked={selected.has(product.id)} onChange={() => toggleSelection(product.id)} /></td>
                <td className="p-3"><div className="flex items-center gap-3">{product.images[0]?.url ? <img src={product.images[0].url} alt="" className="w-12 h-12 rounded object-cover" /> : <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center"><Image size={18} /></div>}<div><p className="font-semibold text-gray-800">{product.name}</p><p className="text-gray-500">{product.category}</p></div></div></td>
                <td className="p-3"><p>{product.variants[0]?.sku || 'Migration required'}</p><p className="text-gray-400">{product.variants.length} variant(s)</p></td>
                <td className="p-3"><p className="font-medium">{formatMoney(product.salePricePaise)}</p>{product.discountPercent > 0 && <p className="text-gray-400"><span className="line-through">{formatMoney(product.mrpPaise)}</span> · {product.discountPercent}% off</p>}</td>
                <td className="p-3"><span className={product.availableQuantity ? 'text-green-700' : 'text-red-600'}>{product.availableQuantity} available</span></td>
                <td className="p-3 capitalize">{product.status}{product.isBestSeller && <span className="ml-2 text-xs bg-amber-100 text-amber-700 rounded px-2 py-1">Best seller</span>}</td>
                <td className="p-3"><div className="flex justify-end gap-2"><button onClick={() => openEdit(product)} className="p-2 text-blue-600"><Edit2 size={16} /></button><button onClick={() => archive(product)} className="p-2 text-red-600"><Trash2 size={16} /></button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between mt-4 text-sm"><span>Page {page} of {pageCount}</span><div className="flex gap-2"><button disabled={page === 1} onClick={() => setPage(page - 1)} className="border rounded px-3 py-1 disabled:opacity-40">Previous</button><button disabled={page === pageCount} onClick={() => setPage(page + 1)} className="border rounded px-3 py-1 disabled:opacity-40">Next</button></div></div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 overflow-y-auto p-4">
          <div className="bg-white max-w-4xl mx-auto my-6 rounded-2xl shadow-2xl">
            <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white rounded-t-2xl z-10"><h3 className="text-xl font-bold">{products.some((product) => product.id === form.id) ? 'Edit Product' : 'Add Product'}</h3><button onClick={() => setShowModal(false)}><X /></button></div>
            <form onSubmit={submit} className="p-6 space-y-6">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
              <div className="grid md:grid-cols-2 gap-4">
                <label className="text-sm font-medium">Product name *<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
                <label className="text-sm font-medium">Category *<select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2"><option value="">Select category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
              </div>
              <label className="text-sm font-medium block">Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="3" className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
              <label className="text-sm font-medium block">Dimensions<input value={form.dimensions} onChange={(e) => setForm({ ...form, dimensions: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>

              <section className="border rounded-xl p-4">
                <h4 className="font-semibold mb-3">Pricing and margin</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="text-sm">MRP (₹) *<input required type="number" min="0" step="0.01" value={form.mrp} onChange={(e) => setForm({ ...form, mrp: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
                  <label className="text-sm">Discount %<input type="number" min="0" max="100" step="0.01" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
                  <label className="text-sm">Unit cost (₹)<input type="number" min="0" step="0.01" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
                  <label className="text-sm">Packaging cost (₹)<input type="number" min="0" step="0.01" value={form.packagingCost} onChange={(e) => setForm({ ...form, packagingCost: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2" /></label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 bg-gray-50 p-3 rounded-lg text-sm"><div><p className="text-gray-500">Selling price</p><p className="font-semibold">{formatMoney(pricing.salePricePaise)}</p></div><div><p className="text-gray-500">Seller payout</p><p className="font-semibold">{formatMoney(pricing.sellerPayoutPaise)}</p></div><div><p className="text-gray-500">Estimated margin</p><p className={pricing.amountPaise < 0 ? 'text-red-600 font-semibold' : 'font-semibold'}>{formatMoney(pricing.amountPaise)}</p></div><div><p className="text-gray-500">Margin %</p><p className="font-semibold">{pricing.percent}%</p></div></div>
              </section>

              <section className="border rounded-xl p-4">
                <h4 className="font-semibold mb-3">Seller terms (private)</h4>
                <div className="grid md:grid-cols-3 gap-3"><select value={form.sellerId} onChange={(e) => setForm({ ...form, sellerId: e.target.value })} className="border rounded-lg px-3 py-2"><option value="">No seller assigned</option>{sellers.map((seller) => <option key={seller.id} value={seller.id}>{seller.name}</option>)}</select><select value={form.sellerPayoutType} onChange={(e) => setForm({ ...form, sellerPayoutType: e.target.value })} className="border rounded-lg px-3 py-2"><option value="fixed">Fixed ₹ per unit</option><option value="percentage">Percentage of sale</option></select><input type="number" min="0" step="0.01" value={form.sellerPayoutValue} onChange={(e) => setForm({ ...form, sellerPayoutValue: e.target.value })} placeholder={form.sellerPayoutType === 'percentage' ? 'Percentage' : '₹ per unit'} className="border rounded-lg px-3 py-2" /></div>
              </section>

              <section className="border rounded-xl p-4">
                <div className="flex items-center justify-between mb-3"><div><h4 className="font-semibold">Colour and size variants</h4><p className="text-xs text-gray-500">Leave SKU blank for secure automatic allocation.</p></div><button type="button" onClick={() => setForm({ ...form, variants: [...form.variants, blankVariant()] })} className="text-blue-600 flex items-center gap-1"><Plus size={16} /> Add colour/size</button></div>
                <div className="space-y-3">{form.variants.map((variant, index) => <div key={variant.id || index} className="grid grid-cols-2 md:grid-cols-7 gap-2 bg-gray-50 p-3 rounded-lg"><input required value={variant.colorName} onChange={(e) => updateVariant(index, 'colorName', e.target.value)} placeholder="Colour *" className="border rounded px-2 py-2" /><input type="color" value={variant.colorHex || '#ffffff'} onChange={(e) => updateVariant(index, 'colorHex', e.target.value)} className="border rounded h-10 w-full" /><input value={variant.size} onChange={(e) => updateVariant(index, 'size', e.target.value)} placeholder="Size" className="border rounded px-2 py-2" /><input value={variant.sku} onChange={(e) => updateVariant(index, 'sku', e.target.value)} placeholder="Auto SKU" className="border rounded px-2 py-2" /><input type="number" min="0" value={variant.onHandQuantity} onChange={(e) => updateVariant(index, 'onHandQuantity', e.target.value)} placeholder="Quantity" className="border rounded px-2 py-2" /><input type="number" min="0" value={variant.lowStockThreshold} onChange={(e) => updateVariant(index, 'lowStockThreshold', e.target.value)} placeholder="Low stock" className="border rounded px-2 py-2" /><button type="button" onClick={() => removeVariant(index)} disabled={form.variants.length === 1} className="text-red-600 disabled:opacity-30"><Trash2 size={17} /></button></div>)}</div>
              </section>

              <section className="border rounded-xl p-4">
                <div className="flex items-center justify-between"><div><h4 className="font-semibold">Product images</h4><p className="text-xs text-gray-500">JPEG, PNG, WebP or GIF; up to 10 MB each.</p></div><label className="cursor-pointer text-blue-600 flex items-center gap-2"><Upload size={17} /> {uploading ? `Uploading ${uploadProgress}%` : 'Upload images'}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple onChange={uploadImages} className="hidden" disabled={uploading} /></label></div>
                <div className="flex flex-wrap gap-3 mt-3">{form.images.map((image, index) => <div key={image.id} className="relative w-24"><img src={image.url} alt={image.alt} className="w-24 h-24 object-cover rounded-lg" /><button type="button" onClick={() => setForm({ ...form, images: form.images.filter((_, position) => position !== index) })} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1"><X size={12} /></button><input value={image.alt || ''} onChange={(e) => setForm({ ...form, images: form.images.map((item, position) => position === index ? { ...item, alt: e.target.value } : item) })} placeholder="Alt text" className="mt-1 w-full border rounded px-1 text-xs" /></div>)}</div>
              </section>

              <div className="grid md:grid-cols-3 gap-3"><label className="text-sm">Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2"><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select></label><label className="text-sm">Best seller<select value={form.bestSellerMode} onChange={(e) => setForm({ ...form, bestSellerMode: e.target.value })} className="mt-1 w-full border rounded-lg px-3 py-2"><option value="auto">Automatic from orders</option><option value="force_on">Always show</option><option value="force_off">Never show</option></select></label><label className="flex items-center gap-2 mt-6"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured promotion</label></div>

              <div className="flex justify-end gap-3 pt-4 border-t"><button type="button" onClick={() => setShowModal(false)} className="border rounded-lg px-5 py-2">Cancel</button><button type="submit" disabled={saving || uploading} className="bg-blue-600 text-white rounded-lg px-5 py-2 flex items-center gap-2 disabled:opacity-50"><Save size={17} />{saving ? 'Saving…' : 'Save product'}</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsTab
