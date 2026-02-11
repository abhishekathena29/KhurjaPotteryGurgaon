import { useState, useEffect } from 'react'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { Plus, Edit2, Trash2, X, Upload, Image, ToggleLeft, ToggleRight, Save } from 'lucide-react'

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/demo/image/upload'
const CLOUDINARY_UPLOAD_PRESET = 'docs_upload_example_us_preset'

const emptyProduct = {
  name: '',
  category: '',
  price: '',
  sku: '',
  description: '',
  dimensions: '',
  color: '',
  size: '',
  discount: '',
  imageUrls: [],
  ownerName: '',
  ownerPhone: '',
  ownerEmail: '',
  sellerName: '',
  isActive: true,
}

const ProductsTab = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [sellers, setSellers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({ ...emptyProduct })
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
    fetchSellers()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const snapshot = await getDocs(collection(db, 'products'))
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setProducts(data)
    } catch (err) {
      console.error('Error fetching products:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'categories'))
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setCategories(data)
    } catch (err) {
      console.error('Error fetching categories:', err)
    }
  }

  const fetchSellers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'sellers'))
      const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
      setSellers(data)
    } catch (err) {
      console.error('Error fetching sellers:', err)
    }
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSellerChange = (e) => {
    const sellerName = e.target.value
    const seller = sellers.find((s) => s.name === sellerName)
    setFormData((prev) => ({
      ...prev,
      sellerName: sellerName,
      ownerName: seller ? seller.name : sellerName,
      ownerPhone: seller ? seller.phone : '',
      ownerEmail: seller ? seller.email : '',
    }))
  }

  const uploadImage = async (file) => {
    const data = new FormData()
    data.append('file', file)
    data.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    try {
      const res = await fetch(CLOUDINARY_URL, { method: 'POST', body: data })
      const json = await res.json()
      return json.secure_url
    } catch (err) {
      console.error('Image upload error:', err)
      return null
    }
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return
    if (formData.imageUrls.length + files.length > 5) {
      alert('Maximum 5 images allowed')
      return
    }
    setUploading(true)
    try {
      const urls = await Promise.all(files.map((f) => uploadImage(f)))
      const validUrls = urls.filter(Boolean)
      setFormData((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ...validUrls],
      }))
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      imageUrls: prev.imageUrls.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name || !formData.category || !formData.price) {
      alert('Please fill in product name, category, and price')
      return
    }
    setSaving(true)
    try {
      const productData = {
        ...formData,
        price: Number(formData.price),
        discount: Number(formData.discount) || 0,
        updatedAt: serverTimestamp(),
      }
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), productData)
      } else {
        productData.createdAt = serverTimestamp()
        await addDoc(collection(db, 'products'), productData)
      }
      setShowModal(false)
      setEditingProduct(null)
      setFormData({ ...emptyProduct })
      fetchProducts()
    } catch (err) {
      console.error('Error saving product:', err)
      alert('Error saving product. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      name: product.name || '',
      category: product.category || '',
      price: product.price || '',
      sku: product.sku || '',
      description: product.description || '',
      dimensions: product.dimensions || '',
      color: product.color || '',
      size: product.size || '',
      discount: product.discount || '',
      imageUrls: product.imageUrls || (product.imageUrl ? [product.imageUrl] : []),
      ownerName: product.ownerName || '',
      ownerPhone: product.ownerPhone || '',
      ownerEmail: product.ownerEmail || '',
      sellerName: product.sellerName || product.ownerName || '',
      isActive: product.isActive !== undefined ? product.isActive : true,
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteDoc(doc(db, 'products', id))
        fetchProducts()
      } catch (err) {
        console.error('Error deleting product:', err)
      }
    }
  }

  const toggleActive = async (product) => {
    try {
      await updateDoc(doc(db, 'products', product.id), {
        isActive: !product.isActive,
      })
      fetchProducts()
    } catch (err) {
      console.error('Error toggling product status:', err)
    }
  }

  const openAdd = () => {
    setEditingProduct(null)
    setFormData({ ...emptyProduct })
    setShowModal(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Products ({products.length})</h2>
        <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          <Plus size={18} /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">Loading products...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 text-gray-400">
          <p className="text-lg">No products yet</p>
          <p className="text-sm mt-1">Click "Add Product" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className={`bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow ${!product.isActive ? 'opacity-60' : ''}`}>
              <div className="aspect-video bg-gray-100 relative">
                {product.imageUrls && product.imageUrls[0] ? (
                  <img src={product.imageUrls[0]} alt={product.name} className="w-full h-full object-cover" />
                ) : product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Image size={40} />
                  </div>
                )}
                {/* Active Status Badge */}
                <span className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {product.isActive ? 'Live' : 'Draft'}
                </span>
                {product.discount > 0 && (
                  <span className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                    {product.discount}% OFF
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-800 line-clamp-1">{product.name || product.category || 'Unnamed Product'}</h3>
                <p className="text-sm text-gray-500">{product.category}</p>
                {product.sku && <p className="text-xs text-gray-400 mt-0.5">SKU: {product.sku}</p>}
                {product.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-lg font-bold text-gray-800">₹{product.price}</span>
                  {product.imageUrls && product.imageUrls.length > 1 && (
                    <span className="text-xs text-gray-400">{product.imageUrls.length} images</span>
                  )}
                </div>
                {product.ownerName && (
                  <p className="text-xs text-gray-400 mt-1">Seller: {product.ownerName}</p>
                )}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                  <button
                    onClick={() => toggleActive(product)}
                    className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${product.isActive ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}
                  >
                    {product.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    {product.isActive ? 'Live' : 'Draft'}
                  </button>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(product)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(product.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full my-8 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-800">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Product Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name *</label>
                <input name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. Handpainted Blue Mug" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category *</label>
                  <select name="category" value={formData.category} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">Select category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                {/* Price */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Price (₹) *</label>
                  <input name="price" type="number" value={formData.price} onChange={handleInputChange} required min="0" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="500" />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={3} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none" placeholder="Describe the product..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* SKU */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">SKU ID</label>
                  <input name="sku" value={formData.sku} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="PROD-001" />
                </div>
                {/* Dimensions */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Dimensions</label>
                  <input name="dimensions" value={formData.dimensions} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="e.g. 8cm x 10cm" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* Color */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Color</label>
                  <input name="color" value={formData.color} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Blue" />
                </div>
                {/* Size */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Size</label>
                  <input name="size" value={formData.size} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Medium" />
                </div>
                {/* Discount */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Discount %</label>
                  <input name="discount" type="number" value={formData.discount} onChange={handleInputChange} min="0" max="100" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="0" />
                </div>
              </div>

              {/* Seller */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Seller / Artisan</label>
                <select value={formData.sellerName} onChange={handleSellerChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                  <option value="">Select seller</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
                {formData.ownerName && (
                  <p className="text-xs text-gray-400 mt-1">
                    {formData.ownerPhone && `📞 ${formData.ownerPhone}`} {formData.ownerEmail && `✉️ ${formData.ownerEmail}`}
                  </p>
                )}
              </div>

              {/* Images */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Product Images ({formData.imageUrls.length}/5)
                </label>
                <div className="flex flex-wrap gap-3 mb-3">
                  {formData.imageUrls.map((url, i) => (
                    <div key={i} className="w-20 h-20 rounded-xl overflow-hidden border relative group">
                      <img src={url} alt={`Product ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {formData.imageUrls.length < 5 && (
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
                      <Upload size={18} className="text-gray-400" />
                      <span className="text-[10px] text-gray-400 mt-1">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {uploading && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    Uploading images...
                  </div>
                )}
              </div>

              {/* Active Status */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-semibold text-gray-700">Product Status</p>
                  <p className="text-xs text-gray-400">{formData.isActive ? 'Product will be visible on the main site' : 'Product will be hidden (draft mode)'}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}
                >
                  {formData.isActive ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                  {formData.isActive ? 'Live' : 'Draft'}
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                  Cancel
                </button>
                <button type="submit" disabled={saving || uploading} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50">
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {editingProduct ? 'Update Product' : 'Add Product'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductsTab
