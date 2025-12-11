import { useState, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ShoppingCart, Heart, Plus, Filter, X } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useProducts } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { getProductsByCategory, getUniqueColors, getUniqueSizes } from '../data/mockData'

const ProductList = () => {
  const { category } = useParams()
  const { addToCart } = useCart()
  const { addToWishlist, isInWishlist } = useWishlist()
  const { products: allProducts, loading: productsLoading } = useProducts()
  const { categories } = useCategories()
  const [showFilters, setShowFilters] = useState(true)
  const [sortBy, setSortBy] = useState('')
  const [filters, setFilters] = useState({
    categories: [],
    sizes: [],
    colors: [],
    minPrice: '',
    maxPrice: '',
  })

  let products = useMemo(() => {
    let filtered = getProductsByCategory(category || 'All products')

    // Apply category filters
    if (filters.categories.length > 0) {
      filtered = filtered.filter((p) => filters.categories.includes(p.category))
    }

    // Apply size filters
    if (filters.sizes.length > 0) {
      filtered = filtered.filter((p) => filters.sizes.includes(p.size))
    }

    // Apply color filters
    if (filters.colors.length > 0) {
      filtered = filtered.filter((p) => filters.colors.includes(p.color))
    }

    // Apply price filters
    if (filters.minPrice) {
      filtered = filtered.filter((p) => p.price >= Number(filters.minPrice))
    }
    if (filters.maxPrice) {
      filtered = filtered.filter((p) => p.price <= Number(filters.maxPrice))
    }

    // Apply sorting
    if (sortBy === 'price-high') {
      filtered.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'price-low') {
      filtered.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'date-latest') {
      filtered.sort((a, b) => parseInt(b.id) - parseInt(a.id))
    } else if (sortBy === 'discount') {
      filtered.sort((a, b) => (b.discount || 0) - (a.discount || 0))
    }

    return filtered
  }, [category, filters, sortBy])

  const uniqueColors = getUniqueColors()
  const uniqueSizes = getUniqueSizes()

  const handleCategoryFilter = (cat) => {
    setFilters((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }))
  }

  const handleSizeFilter = (size) => {
    setFilters((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }))
  }

  const handleColorFilter = (color) => {
    setFilters((prev) => ({
      ...prev,
      colors: prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color],
    }))
  }

  const clearFilters = () => {
    setFilters({
      categories: [],
      sizes: [],
      colors: [],
      minPrice: '',
      maxPrice: '',
    })
    setSortBy('')
  }

  const hasActiveFilters = 
    filters.categories.length > 0 ||
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.minPrice ||
    filters.maxPrice ||
    sortBy

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-cream py-12 flex items-center justify-center">
        <p className="text-xl text-brown-dark/60">Loading products...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-brown-dark">
            {category || 'All Products'}
          </h1>
          <div className="flex items-center gap-4">
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field w-auto min-w-[200px]"
            >
              <option value="">Sort by</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
              <option value="date-latest">Newest First</option>
              <option value="discount">Highest Discount</option>
            </select>
            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden btn-primary flex items-center gap-2"
            >
              <Filter size={20} />
              Filters
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <aside
            className={`${
              showFilters ? 'block' : 'hidden'
            } lg:block w-full lg:w-64 flex-shrink-0 bg-white rounded-lg shadow-md p-6 h-fit sticky top-32`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-brown-dark">Filters</h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-purple hover:text-purple-dark flex items-center gap-1"
                >
                  <X size={16} />
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="font-semibold text-brown-dark mb-3">Category</h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-2 cursor-pointer hover:text-purple transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(cat)}
                      onChange={() => handleCategoryFilter(cat)}
                      className="w-4 h-4 text-purple border-brown-light rounded focus:ring-purple"
                    />
                    <span className="text-sm text-brown-dark">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div className="mb-6">
              <h3 className="font-semibold text-brown-dark mb-3">Size</h3>
              <div className="space-y-2">
                {uniqueSizes.map((size) => (
                  <label
                    key={size}
                    className="flex items-center gap-2 cursor-pointer hover:text-purple transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.sizes.includes(size)}
                      onChange={() => handleSizeFilter(size)}
                      className="w-4 h-4 text-purple border-brown-light rounded focus:ring-purple"
                    />
                    <span className="text-sm text-brown-dark">{size}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Color Filter */}
            <div className="mb-6">
              <h3 className="font-semibold text-brown-dark mb-3">Color</h3>
              <div className="space-y-2">
                {uniqueColors.map((color) => (
                  <label
                    key={color}
                    className="flex items-center gap-2 cursor-pointer hover:text-purple transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.colors.includes(color)}
                      onChange={() => handleColorFilter(color)}
                      className="w-4 h-4 text-purple border-brown-light rounded focus:ring-purple"
                    />
                    <span className="text-sm text-brown-dark">{color}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="mb-6">
              <h3 className="font-semibold text-brown-dark mb-3">Price Range</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-brown-dark/70 mb-1">
                    Min Price (₹)
                  </label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) =>
                      setFilters({ ...filters, minPrice: e.target.value })
                    }
                    className="input-field"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm text-brown-dark/70 mb-1">
                    Max Price (₹)
                  </label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      setFilters({ ...filters, maxPrice: e.target.value })
                    }
                    className="input-field"
                    placeholder="10000"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content - Products Grid */}
          <div className="flex-1">
            {products.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg shadow-md">
                <p className="text-xl text-brown-dark/60 mb-4">
                  No products found matching your criteria.
                </p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="btn-primary">
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <p className="text-brown-dark/60 mb-6">
                  Showing {products.length} product{products.length !== 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div key={product.id} className="card">
                      <Link to={`/product/${product.id}`}>
                        <div className="aspect-square bg-brown-light overflow-hidden">
                          {product.images && product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-brown-light to-brown-dark flex items-center justify-center">
                              <span className="text-6xl">🏺</span>
                            </div>
                          )}
                        </div>
                      </Link>
                      <div className="p-4">
                        <Link to={`/product/${product.id}`}>
                          <h3 className="font-semibold text-brown-dark mb-1 hover:text-purple transition-colors line-clamp-2">
                            {product.name}
                          </h3>
                        </Link>
                        <p className="text-sm text-brown-dark/70 mb-2 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            {product.discount > 0 && (
                              <span className="text-sm text-purple font-semibold mr-2">
                                {product.discount}% OFF
                              </span>
                            )}
                            <span className="text-lg font-bold text-brown-dark">
                              ₹{product.price}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => addToCart(product)}
                            className="flex-1 bg-brown hover:bg-brown-dark text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                          >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Add to Cart</span>
                            <ShoppingCart size={18} className="sm:hidden" />
                          </button>
                          <button
                            onClick={() => addToWishlist(product)}
                            className={`p-2 rounded-lg transition-colors ${
                              isInWishlist(product.id)
                                ? 'bg-purple text-white'
                                : 'bg-brown-light text-brown-dark hover:bg-purple hover:text-white'
                            }`}
                            aria-label="Add to wishlist"
                          >
                            <Heart
                              size={20}
                              fill={isInWishlist(product.id) ? 'currentColor' : 'none'}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductList
