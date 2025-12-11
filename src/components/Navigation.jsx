import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
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
      // Position dropdown directly below button with minimal gap
      dropdownRef.current.style.top = `${buttonRect.bottom + 2}px`
      dropdownRef.current.style.left = `${buttonRect.left}px`
    }
  }, [isProductsOpen])

  // Handle mouse enter with delay to prevent flickering
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsProductsOpen(true)
  }

  // Handle mouse leave with delay to allow moving to dropdown
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsProductsOpen(false)
    }, 200) // 200ms delay
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <nav className="bg-brown-light sticky top-[73px] md:top-[89px] z-40 shadow-md border-b border-brown/20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center gap-6 md:gap-8 py-3 overflow-x-auto scrollbar-hide">
            {/* Products with dropdown */}
            <div
              ref={containerRef}
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                ref={buttonRef}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  isActive('/products')
                    ? 'bg-brown text-white'
                    : 'text-brown-dark hover:bg-brown/20'
                }`}
              >
                Products
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 ${isProductsOpen ? 'rotate-180' : ''}`}
                />
              </button>
            </div>

            {/* Best Sellers */}
            <Link
              to="/products/Best Sellers"
              className={`px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/products/Best Sellers'
                  ? 'bg-brown text-white'
                  : 'text-brown-dark hover:bg-brown/20'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              Best Sellers
            </Link>

            {/* All Products */}
            <Link
              to="/products/All products"
              className={`px-3 py-2 rounded-lg transition-colors ${
                location.pathname === '/products/All products'
                  ? 'bg-brown text-white'
                  : 'text-brown-dark hover:bg-brown/20'
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              All Products
            </Link>
          </div>
        </div>
      </nav>

      {/* Dropdown Menu - Fixed positioning, appears below nav */}
      {isProductsOpen && (
        <>
          <div 
            className="fixed inset-0 z-[35]"
            onClick={() => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
              }
              setIsProductsOpen(false)
            }}
          />
          <div
            ref={dropdownRef}
            className="fixed bg-white rounded-lg shadow-2xl min-w-[180px] z-[50] border border-brown-light/30"
            onMouseEnter={() => {
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
              }
              setIsProductsOpen(true)
            }}
            onMouseLeave={handleMouseLeave}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Invisible bridge area to prevent gap */}
            <div className="h-2 -mt-2 -mx-1" />
            <div className="py-2">
            {categories && categories.length > 0 ? (
              <>
                {categories.map((category) => (
                  <Link
                    key={category}
                    to={`/products/${category}`}
                    className="block px-4 py-2.5 text-brown-dark hover:bg-brown-light hover:text-white transition-colors text-sm"
                    onClick={() => {
                      setIsProductsOpen(false)
                      setIsMenuOpen(false)
                    }}
                  >
                    {category}
                  </Link>
                ))}
                <div className="border-t border-brown-light/30 my-1"></div>
              </>
            ) : (
              <div className="px-4 py-2 text-brown-dark/60 text-sm">No categories</div>
            )}
            <Link
              to="/products/All products"
              className="block px-4 py-2.5 text-brown-dark hover:bg-brown-light hover:text-white transition-colors text-sm font-medium"
              onClick={() => {
                setIsProductsOpen(false)
                setIsMenuOpen(false)
              }}
            >
              All Products
            </Link>
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default Navigation
