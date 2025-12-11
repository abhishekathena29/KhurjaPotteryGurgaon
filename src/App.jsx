import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { AuthProvider } from './context/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Contact from './pages/Contact'
import About from './pages/About'
import RequestProduct from './pages/RequestProduct'
import ProductList from './pages/ProductList'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Wishlist from './pages/Wishlist'
import AdminLogin from './pages/admin/Login'
import AdminDashboard from './pages/admin/Dashboard'

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            <Routes>
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Public Routes */}
              <Route
                path="/*"
                element={
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/request-product" element={<RequestProduct />} />
                      <Route path="/products/:category" element={<ProductList />} />
                      <Route path="/product/:id" element={<ProductDetail />} />
                      <Route path="/cart" element={<Cart />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                    </Routes>
                  </Layout>
                }
              />
            </Routes>
          </Router>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App

