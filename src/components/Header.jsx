import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ShoppingCart, Heart, User } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

const Header = ({ isMenuOpen, setIsMenuOpen }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const { getCartCount } = useCart()
  const { wishlist } = useWishlist()

  const handleSearch = (e) => {
    e.preventDefault()
    // Handle search functionality
    console.log('Searching for:', searchQuery)
  }

  return (
    <header className="bg-brown text-white sticky top-0 z-[100] shadow-lg border-b border-brown-dark/20">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Links */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              to="/request-product"
              className="hover:text-purple-light transition-colors"
            >
              Request A Product
            </Link>
            <Link
              to="/contact"
              className="hover:text-purple-light transition-colors"
            >
              Contact Us
            </Link>
            <Link
              to="/about"
              className="hover:text-purple-light transition-colors"
            >
              About Us
            </Link>
          </div>

          {/* Center: Logo */}
          <Link to="/" className="flex-1 text-center">
            <h1 className="text-2xl md:text-3xl font-bold">
              Khurja@Gng
            </h1>
          </Link>

          {/* Right: Search, Cart, Wishlist, Account */}
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brown-dark" size={20} />
                <input
                  type="text"
                  placeholder="Search for pottery, ceramics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-lg text-brown-dark w-64 focus:outline-none focus:ring-2 focus:ring-purple"
                />
              </div>
            </form>

            {/* Icons */}
            <Link
              to="/cart"
              className="relative hover:text-purple-light transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingCart size={24} />
              {getCartCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-purple text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getCartCount()}
                </span>
              )}
            </Link>

            <Link
              to="/wishlist"
              className="relative hover:text-purple-light transition-colors"
              aria-label="Wishlist"
            >
              <Heart size={24} />
              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-purple text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            <button
              className="hover:text-purple-light transition-colors"
              aria-label="Account"
            >
              <User size={24} />
            </button>

            {/* Mobile menu button */}
            <button
              className="md:hidden ml-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
                <span className={`block h-0.5 w-full bg-white transition-all ${isMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
                <span className={`block h-0.5 w-full bg-white transition-all ${isMenuOpen ? 'opacity-0' : ''}`}></span>
                <span className={`block h-0.5 w-full bg-white transition-all ${isMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brown-dark" size={20} />
            <input
              type="text"
              placeholder="Search for pottery, ceramics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg text-brown-dark w-full focus:outline-none focus:ring-2 focus:ring-purple"
            />
          </div>
        </form>

        {/* Mobile Links */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 flex flex-col gap-3">
            <Link
              to="/request-product"
              className="hover:text-purple-light transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Request A Product
            </Link>
            <Link
              to="/contact"
              className="hover:text-purple-light transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Contact Us
            </Link>
            <Link
              to="/about"
              className="hover:text-purple-light transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              About Us
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header

