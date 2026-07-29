import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, ShoppingCart, Heart, User, Menu, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

const Header = ({ isMenuOpen, setIsMenuOpen }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const { getCartCount } = useCart()
  const { wishlist } = useWishlist()
  const navigate = useNavigate()

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products/All products?search=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <header className="bg-white text-brown-dark sticky top-0 z-[100] border-b border-sand">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo / Site Name */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <div>
              <h1 className="text-xl md:text-2xl font-display font-medium tracking-wide text-brown-dark group-hover:text-terracotta transition-colors">
                Potters Central
              </h1>
              <p className="text-[10px] text-brown-light tracking-[0.2em] uppercase hidden md:block mt-0.5">
                Handcrafted Heritage
              </p>
            </div>
          </Link>

          {/* Center: Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-lg mx-4">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-brown-dark/40" size={18} />
              <input
                type="text"
                placeholder="Search pottery, ceramics, artisan crafts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 rounded-lg text-brown-dark bg-sand 
                  focus:outline-none focus:ring-1 focus:ring-terracotta border border-transparent focus:border-terracotta
                  placeholder:text-brown-light text-sm transition-all duration-200"
              />
            </div>
          </form>

          {/* Right: Icons */}
          <div className="flex items-center gap-1 md:gap-3">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 rounded-lg hover:bg-sand transition-all duration-200 group text-brown-dark"
              aria-label="Shopping cart"
            >
              <ShoppingCart size={22} className="group-hover:scale-110 transition-transform" />
              {getCartCount() > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-terracotta text-white text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center">
                  {getCartCount()}
                </span>
              )}
            </Link>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2 rounded-lg hover:bg-sand transition-all duration-200 group text-brown-dark"
              aria-label="Wishlist"
            >
              <Heart size={22} className="group-hover:scale-110 transition-transform" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-terracotta text-white text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Account */}
            <Link
              to="/profile"
              className="p-2 rounded-lg hover:bg-sand transition-all duration-200 group text-brown-dark"
              aria-label="Account"
            >
              <User size={22} className="group-hover:scale-110 transition-transform" />
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-sand transition-all text-brown-dark"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Search */}
        <form onSubmit={handleSearch} className="md:hidden mt-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-brown-dark/40" size={18} />
            <input
              type="text"
              placeholder="Search pottery, ceramics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-lg text-brown-dark bg-sand 
                focus:outline-none focus:ring-1 focus:ring-terracotta border border-transparent focus:border-terracotta
                placeholder:text-brown-light text-sm"
            />
          </div>
        </form>
      </div>

      {/* Spacer below header if needed */}
    </header>
  )
}

export default Header
