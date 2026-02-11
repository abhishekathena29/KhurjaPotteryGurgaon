import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown, Home, Phone, Info, Gift } from 'lucide-react'
import { useCategories } from '../hooks/useCategories'

const Navigation = ({ isMenuOpen, setIsMenuOpen }) => {
  const location = useLocation()
  const { categories } = useCategories()
  const [isProductsOpen, setIsProductsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const buttonRef = useRef(null)
  const containerRef = useRef(null)
  const timeoutRef = useRef(null)

  const isActive = (path) => {
    if (path === '/products') {
      return location.pathname.startsWith('/products')
    }
    return location.pathname === path
  }

  // Position dropdown relative to button
  useEffect(() => {
    if (isProductsOpen && buttonRef.current && dropdownRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      dropdownRef.current.style.top = `${buttonRect.bottom + 4}px`
      dropdownRef.current.style.left = `${buttonRect.left}px`
    }
  }, [isProductsOpen])

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsProductsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsProductsOpen(false)
    }, 200)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const navItems = [
    { path: '/', label: 'Home', icon: Home },
    { path: '/contact', label: 'Contact Us', icon: Phone },
    { path: '/about', label: 'About Us', icon: Info },
    { path: '/request-product', label: 'Request A Product', icon: Gift },
  ]

  return (
    <>
      <nav className="bg-white/95 backdrop-blur-md sticky top-[73px] md:top-[77px] z-40 shadow-sm border-b border-sand">
        {/* Pottery motif decoration */}
        <div className="pottery-motif absolute inset-0 pointer-events-none opacity-30"></div>

        <div className="max-w-7xl mx-auto px-4 relative">
          <div className="flex items-center justify-center gap-1 md:gap-2 py-2 overflow-x-auto scrollbar-hide">

            {/* Home */}
            <Link
              to="/"
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl transition-all duration-200 text-sm font-medium whitespace-nowrap ${isActive('/')
                  ? 'bg-gradient-to-r from-brown to-brown-dark text-white shadow-warm'
                  : 'text-brown-dark hover:bg-sand hover:text-brown'
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>

            {/* Products with dropdown */}
            <div
              ref={containerRef}
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                ref={buttonRef}
                className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl transition-all duration-200 text-sm font-medium ${isActive('/products')
                    ? 'bg-gradient-to-r from-brown to-brown-dark text-white shadow-warm'
                    : 'text-brown-dark hover:bg-sand hover:text-brown'
                  }`}
              >
                Products
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-300 ${isProductsOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {/* Best Sellers */}
            <Link
              to="/products/Best Sellers"
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl transition-all duration-200 text-sm font-medium whitespace-nowrap ${location.pathname === '/products/Best Sellers'
                  ? 'bg-gradient-to-r from-brown to-brown-dark text-white shadow-warm'
                  : 'text-brown-dark hover:bg-sand hover:text-brown'
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Best Sellers
            </Link>

            {/* Contact Us */}
            <Link
              to="/contact"
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl transition-all duration-200 text-sm font-medium whitespace-nowrap ${isActive('/contact')
                  ? 'bg-gradient-to-r from-brown to-brown-dark text-white shadow-warm'
                  : 'text-brown-dark hover:bg-sand hover:text-brown'
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Contact Us
            </Link>

            {/* About Us */}
            <Link
              to="/about"
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl transition-all duration-200 text-sm font-medium whitespace-nowrap ${isActive('/about')
                  ? 'bg-gradient-to-r from-brown to-brown-dark text-white shadow-warm'
                  : 'text-brown-dark hover:bg-sand hover:text-brown'
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              About Us
            </Link>

            {/* Request A Product */}
            <Link
              to="/request-product"
              className={`flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl transition-all duration-200 text-sm font-medium whitespace-nowrap ${isActive('/request-product')
                  ? 'bg-gradient-to-r from-brown to-brown-dark text-white shadow-warm'
                  : 'text-brown-dark hover:bg-sand hover:text-brown'
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Request A Product
            </Link>
          </div>
        </div>
      </nav>

      {/* Dropdown Menu */}
      {isProductsOpen && (
        <>
          <div
            className="fixed inset-0 z-[35]"
            onClick={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current)
              setIsProductsOpen(false)
            }}
          />
          <div
            ref={dropdownRef}
            className="fixed bg-white rounded-2xl shadow-warm-lg min-w-[220px] z-[50] border border-sand overflow-hidden animate-fade-in"
            onMouseEnter={() => {
              if (timeoutRef.current) clearTimeout(timeoutRef.current)
              setIsProductsOpen(true)
            }}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Bridge area */}
            <div className="h-2 -mt-2 -mx-1" />
            <div className="py-2">
              {/* All Products - First option */}
              <Link
                to="/products/All products"
                className="flex items-center gap-2 px-5 py-2.5 text-brown-dark hover:bg-gradient-to-r hover:from-gold/10 hover:to-transparent hover:text-brown transition-all text-sm font-semibold border-b border-sand/50"
                onClick={() => {
                  setIsProductsOpen(false)
                  setIsMenuOpen(false)
                }}
              >
                🏺 All Products
              </Link>

              {categories && categories.length > 0 ? (
                categories.map((category) => (
                  <Link
                    key={category}
                    to={`/products/${category}`}
                    className="block px-5 py-2.5 text-brown-dark hover:bg-gradient-to-r hover:from-sand/50 hover:to-transparent hover:text-brown transition-all text-sm"
                    onClick={() => {
                      setIsProductsOpen(false)
                      setIsMenuOpen(false)
                    }}
                  >
                    {category}
                  </Link>
                ))
              ) : (
                <div className="px-5 py-2 text-brown-dark/40 text-sm">No categories</div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[120px] bg-white/98 backdrop-blur-lg z-[45] shadow-warm-lg border-b border-sand animate-slide-in">
          <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive(path)
                    ? 'bg-gradient-to-r from-brown to-brown-dark text-white'
                    : 'text-brown-dark hover:bg-sand'
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
            <Link
              to="/products/All products"
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive('/products')
                  ? 'bg-gradient-to-r from-brown to-brown-dark text-white'
                  : 'text-brown-dark hover:bg-sand'
                }`}
              onClick={() => setIsMenuOpen(false)}
            >
              🏺 All Products
            </Link>
            <Link
              to="/products/Best Sellers"
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-brown-dark hover:bg-sand transition-all"
              onClick={() => setIsMenuOpen(false)}
            >
              ⭐ Best Sellers
            </Link>
          </div>
        </div>
      )}
    </>
  )
}

export default Navigation
