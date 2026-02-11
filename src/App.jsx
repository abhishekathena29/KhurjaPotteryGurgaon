import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { CartProvider } from './context/CartContext'
import { WishlistProvider } from './context/WishlistContext'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

/* Lazy-load all page components so one blocked module can't crash the app */
const Home = lazy(() => import('./pages/Home'))
const ProductList = lazy(() => import('./pages/ProductList'))
const ProductDetail = lazy(() => import('./pages/ProductDetail'))
const Contact = lazy(() => import('./pages/Contact'))
const About = lazy(() => import('./pages/About'))
const RequestProduct = lazy(() => import('./pages/RequestProduct'))
const Cart = lazy(() => import('./pages/Cart'))
const Wishlist = lazy(() => import('./pages/Wishlist'))
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy'))
const ReturnPolicy = lazy(() => import('./pages/ReturnPolicy'))
const DataPolicy = lazy(() => import('./pages/DataPolicy'))
const TermsConditions = lazy(() => import('./pages/TermsConditions'))
const FAQ = lazy(() => import('./pages/FAQ'))
const Profile = lazy(() => import('./pages/Profile'))
const AdminLogin = lazy(() => import('./pages/admin/Login'))
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-cream">
    <div className="text-center">
      <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
      <p className="text-brown-dark/60 text-sm">Loading...</p>
    </div>
  </div>
)

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            <Suspense fallback={<PageLoader />}>
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
                      <Suspense fallback={<PageLoader />}>
                        <Routes>
                          <Route path="/" element={<Home />} />
                          <Route path="/contact" element={<Contact />} />
                          <Route path="/about" element={<About />} />
                          <Route path="/request-product" element={<RequestProduct />} />
                          <Route path="/products/:category" element={<ProductList />} />
                          <Route path="/product/:id" element={<ProductDetail />} />
                          <Route path="/cart" element={<Cart />} />
                          <Route path="/wishlist" element={<Wishlist />} />
                          <Route path="/profile" element={<Profile />} />
                          <Route path="/shipping-policy" element={<ShippingPolicy />} />
                          <Route path="/return-policy" element={<ReturnPolicy />} />
                          <Route path="/data-policy" element={<DataPolicy />} />
                          <Route path="/terms-conditions" element={<TermsConditions />} />
                          <Route path="/faq" element={<FAQ />} />
                        </Routes>
                      </Suspense>
                    </Layout>
                  }
                />
              </Routes>
            </Suspense>
          </Router>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
