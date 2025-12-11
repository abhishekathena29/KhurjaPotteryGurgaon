import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Image as ImageIcon } from 'lucide-react'
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { uploadImageToCloudinary } from '../../config/cloudinary'

const ProductsTab = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    productCategory: '',
    productPrice: '',
    productImage: null,
    imageUrl: '',
  })
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState('')

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'products'))
      const productsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setProducts(productsData)
    } catch (error) {
      console.error('Error fetching products:', error)
      alert('Error fetching products')
    }
  }

  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'categories'))
      const categoriesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setCategories(categoriesData)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFormData({ ...formData, productImage: file })
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (
      !formData.ownerName.trim() ||
      !formData.ownerPhone.trim() ||
      !formData.ownerEmail.trim() ||
      !formData.productCategory ||
      !formData.productPrice
    ) {
      alert('Please fill all required fields')
      return
    }

    if (!editingProduct && !formData.productImage && !formData.imageUrl) {
      alert('Please upload a product image')
      return
    }

    setLoading(true)
    try {
      let imageUrl = formData.imageUrl

      // Upload image to Cloudinary if new image is selected
      if (formData.productImage) {
        imageUrl = await uploadImageToCloudinary(formData.productImage)
      }

      const productData = {
        ownerName: formData.ownerName.trim(),
        ownerPhone: formData.ownerPhone.trim(),
        ownerEmail: formData.ownerEmail.trim(),
        category: formData.productCategory,
        price: Number(formData.productPrice),
        imageUrl: imageUrl,
        createdAt: editingProduct
          ? editingProduct.createdAt
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      if (editingProduct) {
        // Update existing product
        await updateDoc(doc(db, 'products', editingProduct.id), productData)
      } else {
        // Add new product
        await addDoc(collection(db, 'products'), productData)
      }

      // Reset form
      setFormData({
        ownerName: '',
        ownerPhone: '',
        ownerEmail: '',
        productCategory: '',
        productPrice: '',
        productImage: null,
        imageUrl: '',
      })
      setImagePreview('')
      setEditingProduct(null)
      setIsModalOpen(false)
      fetchProducts()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Error saving product: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData({
      ownerName: product.ownerName || '',
      ownerPhone: product.ownerPhone || '',
      ownerEmail: product.ownerEmail || '',
      productCategory: product.category || '',
      productPrice: product.price?.toString() || '',
      productImage: null,
      imageUrl: product.imageUrl || '',
    })
    setImagePreview(product.imageUrl || '')
    setIsModalOpen(true)
  }

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      await deleteDoc(doc(db, 'products', productId))
      fetchProducts()
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Error deleting product')
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingProduct(null)
    setFormData({
      ownerName: '',
      ownerPhone: '',
      ownerEmail: '',
      productCategory: '',
      productPrice: '',
      productImage: null,
      imageUrl: '',
    })
    setImagePreview('')
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-brown-dark">Products</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Product
        </button>
      </div>

      {/* Products List */}
      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-brown-dark/60 text-lg">
            No products found. Add your first product!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-md overflow-hidden"
            >
              <div className="aspect-square bg-brown-light overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.category}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={48} className="text-brown-dark/40" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-lg font-semibold text-brown-dark mb-2">
                  {product.category}
                </h3>
                <p className="text-sm text-brown-dark/60 mb-1">
                  <strong>Owner:</strong> {product.ownerName}
                </p>
                <p className="text-sm text-brown-dark/60 mb-1">
                  <strong>Phone:</strong> {product.ownerPhone}
                </p>
                <p className="text-sm text-brown-dark/60 mb-2">
                  <strong>Email:</strong> {product.ownerEmail}
                </p>
                <p className="text-xl font-bold text-purple mb-4">
                  ₹{product.price}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(product)}
                    className="flex-1 px-4 py-2 bg-purple hover:bg-purple-dark text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit size={18} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    aria-label="Delete product"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 my-8">
            <h3 className="text-2xl font-bold mb-6 text-brown-dark">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="ownerName"
                    className="block text-sm font-medium text-brown-dark mb-2"
                  >
                    Owner Name *
                  </label>
                  <input
                    type="text"
                    id="ownerName"
                    value={formData.ownerName}
                    onChange={(e) =>
                      setFormData({ ...formData, ownerName: e.target.value })
                    }
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="ownerPhone"
                    className="block text-sm font-medium text-brown-dark mb-2"
                  >
                    Owner Phone No *
                  </label>
                  <input
                    type="tel"
                    id="ownerPhone"
                    value={formData.ownerPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, ownerPhone: e.target.value })
                    }
                    className="input-field"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="ownerEmail"
                  className="block text-sm font-medium text-brown-dark mb-2"
                >
                  Owner Email ID *
                </label>
                <input
                  type="email"
                  id="ownerEmail"
                  value={formData.ownerEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerEmail: e.target.value })
                  }
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="productCategory"
                  className="block text-sm font-medium text-brown-dark mb-2"
                >
                  Product Category *
                </label>
                <select
                  id="productCategory"
                  value={formData.productCategory}
                  onChange={(e) =>
                    setFormData({ ...formData, productCategory: e.target.value })
                  }
                  className="input-field"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="productPrice"
                  className="block text-sm font-medium text-brown-dark mb-2"
                  >
                  Product Price *
                </label>
                <input
                  type="number"
                  id="productPrice"
                  value={formData.productPrice}
                  onChange={(e) =>
                    setFormData({ ...formData, productPrice: e.target.value })
                  }
                  className="input-field"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="productImage"
                  className="block text-sm font-medium text-brown-dark mb-2"
                >
                  Product Image *
                </label>
                <input
                  type="file"
                  id="productImage"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="input-field"
                  required={!editingProduct}
                />
                {imagePreview && (
                  <div className="mt-4">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded-lg border-2 border-brown-light"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border-2 border-brown-light text-brown-dark rounded-lg hover:bg-brown-light transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 btn-primary"
                  disabled={loading}
                >
                  {loading
                    ? 'Saving...'
                    : editingProduct
                    ? 'Update Product'
                    : 'Add Product'}
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

