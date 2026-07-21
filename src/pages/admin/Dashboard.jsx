import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { LogOut, Package, Tag, Users, ShoppingBag, ClipboardList, Settings, Bell, CreditCard } from 'lucide-react'
import CategoriesTab from '../../components/admin/CategoriesTab'
import ProductsTab from '../../components/admin/ProductsTab'
import SellersTab from '../../components/admin/SellersTab'
import OrdersTab from '../../components/admin/OrdersTab'
import RequestsTab from '../../components/admin/RequestsTab'
import SettingsTab from '../../components/admin/SettingsTab'
import NotificationsTab from '../../components/admin/NotificationsTab'
import PaymentsTab from '../../components/admin/PaymentsTab'

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('orders')
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/admin/login')
  }

  const tabs = [
    { id: 'orders', label: 'Orders', icon: ShoppingBag },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'categories', label: 'Categories', icon: Tag },
    { id: 'sellers', label: 'Sellers', icon: Users },
    { id: 'requests', label: 'Requests', icon: ClipboardList },
    { id: 'notifications', label: 'Updates', icon: Bell },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-brown-dark via-brown to-brown-dark text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">PottersCentral Admin</h1>
            <p className="text-xs text-white/60">Manage products, categories, and sellers</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>

      {user?.isLocalTestAdmin && (
        <div className="bg-amber-100 border-b border-amber-300 text-amber-900 text-sm px-4 py-2 text-center">
          Local UI test session — Firebase reads and mutations still require a deployed backend and real administrator claim.
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all text-sm font-medium ${activeTab === id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'orders' && <OrdersTab />}
        {activeTab === 'payments' && <PaymentsTab />}
        {activeTab === 'products' && <ProductsTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'sellers' && <SellersTab />}
        {activeTab === 'requests' && <RequestsTab />}
        {activeTab === 'notifications' && <NotificationsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  )
}

export default Dashboard
