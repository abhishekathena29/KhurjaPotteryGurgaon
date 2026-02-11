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
    <header className="bg-gradient-to-r from-brown-dark via-brown to-brown-dark text-white sticky top-0 z-[100] shadow-warm-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo / Site Name */}
          <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
            <span className="text-3xl group-hover:animate-float">🏺</span>
            <div>
              <h1 className="text-xl md:text-2xl font-display font-bold tracking-wide text-white group-hover:text-gold-light transition-colors">
                PottersCentral
              </h1>
              <p className="text-[10px] text-gold-light/70 tracking-[0.2em] uppercase hidden md:block">
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
                className="w-full pl-11 pr-4 py-2.5 rounded-full text-brown-dark bg-white/95 
                  focus:outline-none focus:ring-2 focus:ring-gold focus:bg-white 
                  placeholder:text-brown-dark/40 text-sm font-body transition-all duration-200
                  shadow-inner"
              />
            </div>
          </form>

          {/* Right: Icons */}
          <div className="flex items-center gap-1 md:gap-3">
            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 rounded-xl hover:bg-white/10 transition-all duration-200 group"
              aria-label="Shopping cart"
            >
              <ShoppingCart size={22} className="group-hover:scale-110 transition-transform" />
              {getCartCount() > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gold text-brown-dark text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md animate-pulse-soft">
                  {getCartCount()}
                </span>
              )}
            </Link>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2 rounded-xl hover:bg-white/10 transition-all duration-200 group"
              aria-label="Wishlist"
            >
              <Heart size={22} className="group-hover:scale-110 transition-transform" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gold text-brown-dark text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-md">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Account */}
            <Link
              to="/profile"
              className="p-2 rounded-xl hover:bg-white/10 transition-all duration-200 group"
              aria-label="Account"
            >
              <User size={22} className="group-hover:scale-110 transition-transform" />
            </Link>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2 rounded-xl hover:bg-white/10 transition-all"
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
              className="w-full pl-11 pr-4 py-2.5 rounded-full text-brown-dark bg-white/95 
                focus:outline-none focus:ring-2 focus:ring-gold 
                placeholder:text-brown-dark/40 text-sm font-body"
            />
          </div>
        </form>
      </div>

      {/* Gold accent line */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent"></div>
    </header>
  )
}

export default Header
