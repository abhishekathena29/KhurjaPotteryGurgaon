import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LogOut, Package, Tag } from 'lucide-react'
import CategoriesTab from '../../components/admin/CategoriesTab'
import ProductsTab from '../../components/admin/ProductsTab'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('products')
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <header className="bg-brown text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-brown-dark hover:bg-brown-dark/80 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === 'products'
                  ? 'border-purple text-purple font-semibold'
                  : 'border-transparent text-brown-dark/60 hover:text-brown-dark'
              }`}
            >
              <Package size={20} />
              Products
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-colors ${
                activeTab === 'categories'
                  ? 'border-purple text-purple font-semibold'
                  : 'border-transparent text-brown-dark/60 hover:text-brown-dark'
              }`}
            >
              <Tag size={20} />
              Categories
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'categories' && <CategoriesTab />}
      </div>
    </div>
  )
}

export default Dashboard

