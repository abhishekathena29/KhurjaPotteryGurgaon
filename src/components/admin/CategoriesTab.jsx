import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../config/firebase'

const CategoriesTab = () => {
  const [categories, setCategories] = useState([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({ name: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

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
      alert('Error fetching categories')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Please enter a category name')
      return
    }

    setLoading(true)
    try {
      if (editingCategory) {
        // Update existing category
        await updateDoc(doc(db, 'categories', editingCategory.id), {
          name: formData.name.trim(),
        })
      } else {
        // Add new category
        await addDoc(collection(db, 'categories'), {
          name: formData.name.trim(),
          createdAt: new Date().toISOString(),
        })
      }
      setFormData({ name: '' })
      setEditingCategory(null)
      setIsModalOpen(false)
      fetchCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      alert('Error saving category')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({ name: category.name })
    setIsModalOpen(true)
  }

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return
    }

    try {
      await deleteDoc(doc(db, 'categories', categoryId))
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      alert('Error deleting category')
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCategory(null)
    setFormData({ name: '' })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-brown-dark">Categories</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Category
        </button>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <p className="text-brown-dark/60 text-lg">
            No categories found. Add your first category!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between"
            >
              <h3 className="text-xl font-semibold text-brown-dark">
                {category.name}
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-2 text-purple hover:bg-purple/10 rounded-lg transition-colors"
                  aria-label="Edit category"
                >
                  <Edit size={20} />
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label="Delete category"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold mb-4 text-brown-dark">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="categoryName"
                  className="block text-sm font-medium text-brown-dark mb-2"
                >
                  Category Name *
                </label>
                <input
                  type="text"
                  id="categoryName"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="input-field"
                  placeholder="e.g., Mugs, Plates, Bowls"
                  required
                />
              </div>
              <div className="flex gap-4">
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
                  {loading ? 'Saving...' : editingCategory ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default CategoriesTab

