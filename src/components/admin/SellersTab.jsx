import { useState, useEffect } from 'react'
import {
    collection,
    addDoc,
    deleteDoc,
    doc,
    getDocs,
    updateDoc,
} from 'firebase/firestore'
import { db } from '../../config/firebase'
import { Plus, Edit2, Trash2, X, Users, Save } from 'lucide-react'

const SellersTab = () => {
    const [sellers, setSellers] = useState([])
    const [showModal, setShowModal] = useState(false)
    const [editingSeller, setEditingSeller] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
    })

    useEffect(() => {
        fetchSellers()
    }, [])

    const fetchSellers = async () => {
        try {
            setLoading(true)
            const snapshot = await getDocs(collection(db, 'sellers'))
            const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
            setSellers(data)
        } catch (err) {
            console.error('Error fetching sellers:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.name.trim()) {
            alert('Please enter seller name')
            return
        }
        setSaving(true)
        try {
            if (editingSeller) {
                await updateDoc(doc(db, 'sellers', editingSeller.id), formData)
            } else {
                await addDoc(collection(db, 'sellers'), formData)
            }
            setShowModal(false)
            setEditingSeller(null)
            setFormData({ name: '', phone: '', email: '', address: '' })
            fetchSellers()
        } catch (err) {
            console.error('Error saving seller:', err)
            alert('Error saving seller. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (seller) => {
        setEditingSeller(seller)
        setFormData({
            name: seller.name || '',
            phone: seller.phone || '',
            email: seller.email || '',
            address: seller.address || '',
        })
        setShowModal(true)
    }

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this seller?')) {
            try {
                await deleteDoc(doc(db, 'sellers', id))
                fetchSellers()
            } catch (err) {
                console.error('Error deleting seller:', err)
            }
        }
    }

    const openAdd = () => {
        setEditingSeller(null)
        setFormData({ name: '', phone: '', email: '', address: '' })
        setShowModal(true)
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Sellers / Artisans ({sellers.length})</h2>
                <button onClick={openAdd} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                    <Plus size={18} /> Add Seller
                </button>
            </div>

            {loading ? (
                <div className="text-center py-10 text-gray-400">Loading sellers...</div>
            ) : sellers.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                    <Users size={40} className="mx-auto mb-2 opacity-30" />
                    <p className="text-lg">No sellers yet</p>
                    <p className="text-sm mt-1">Add sellers to select them when creating products</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sellers.map((seller) => (
                        <div key={seller.id} className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                                    {seller.name ? seller.name.charAt(0).toUpperCase() : 'S'}
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEdit(seller)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Edit2 size={14} />
                                    </button>
                                    <button onClick={() => handleDelete(seller.id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <h3 className="font-bold text-gray-800">{seller.name}</h3>
                            {seller.phone && <p className="text-sm text-gray-500 mt-1">📞 {seller.phone}</p>}
                            {seller.email && <p className="text-sm text-gray-500">✉️ {seller.email}</p>}
                            {seller.address && <p className="text-sm text-gray-400 mt-1">📍 {seller.address}</p>}
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-xl font-bold text-gray-800">
                                {editingSeller ? 'Edit Seller' : 'Add New Seller'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Name *</label>
                                <input name="name" value={formData.name} onChange={handleInputChange} required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Artisan name" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
                                <input name="phone" value={formData.phone} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="+91 98765 43210" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                                <input name="email" type="email" value={formData.email} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="seller@example.com" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                                <input name="address" value={formData.address} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Khurja, UP" />
                            </div>
                            <div className="flex gap-3 pt-4 border-t">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving} className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50">
                                    {saving ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            {editingSeller ? 'Update Seller' : 'Add Seller'}
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

export default SellersTab
