import { useState, useMemo, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ShoppingCart, Heart, Plus, Filter, X, ChevronRight } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useProducts } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'

const ProductList = () => {
  const { category } = useParams()
  const { addToCart } = useCart()
  const { addToWishlist, isInWishlist } = useWishlist()
  const { products: allProducts, loading: productsLoading } = useProducts()
  const { categories } = useCategories()
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('')
  const [filters, setFilters] = useState({
    categories: [],
    sizes: [],
    colors: [],
    minPrice: '',
    maxPrice: '',
  })

  // When navigating via URL category, auto-set the category filter
  useEffect(() => {
    if (category && category !== 'All products' && category !== 'Best Sellers') {
      setFilters((prev) => ({
        ...prev,
        categories: prev.categories.includes(category) ? prev.categories : [category],
      }))
    } else {
      setFilters((prev) => ({
        ...prev,
        categories: [],
      }))
    }
  }, [category])

  // Derive unique colors and sizes from actual products
  const uniqueColors = useMemo(() => {
    return [...new Set(allProducts.map(p => p.color).filter(Boolean))]
  }, [allProducts])

  const uniqueSizes = useMemo(() => {
    return [...new Set(allProducts.map(p => p.size).filter(Boolean))]
  }, [allProducts])

  let products = useMemo(() => {
    let filtered = [...allProducts]

    // Apply "Best Sellers" filter
    if (category === 'Best Sellers') {
      filtered = filtered.filter((p) => p.discount > 0).slice(0, 12)
    }

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
  }, [allProducts, category, filters, sortBy])

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

  const removeFilter = (type, value) => {
    if (type === 'category') handleCategoryFilter(value)
    else if (type === 'size') handleSizeFilter(value)
    else if (type === 'color') handleColorFilter(value)
    else if (type === 'minPrice') setFilters(prev => ({ ...prev, minPrice: '' }))
    else if (type === 'maxPrice') setFilters(prev => ({ ...prev, maxPrice: '' }))
    else if (type === 'sort') setSortBy('')
  }

  const clearFilters = () => {
    setFilters({ categories: [], sizes: [], colors: [], minPrice: '', maxPrice: '' })
    setSortBy('')
  }

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.minPrice ||
    filters.maxPrice ||
    sortBy

  // Build active filter chips
  const activeFilterChips = []
  filters.categories.forEach(c => activeFilterChips.push({ type: 'category', value: c, label: c }))
  filters.sizes.forEach(s => activeFilterChips.push({ type: 'size', value: s, label: `Size: ${s}` }))
  filters.colors.forEach(c => activeFilterChips.push({ type: 'color', value: c, label: `Color: ${c}` }))
  if (filters.minPrice) activeFilterChips.push({ type: 'minPrice', value: filters.minPrice, label: `Min: ₹${filters.minPrice}` })
  if (filters.maxPrice) activeFilterChips.push({ type: 'maxPrice', value: filters.maxPrice, label: `Max: ₹${filters.maxPrice}` })
  if (sortBy) {
    const sortLabels = { 'price-high': 'Price: High to Low', 'price-low': 'Price: Low to High', 'date-latest': 'Newest First', 'discount': 'Highest Discount' }
    activeFilterChips.push({ type: 'sort', value: sortBy, label: sortLabels[sortBy] })
  }

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-cream py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-brown-dark/60 font-body">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-brown-dark/60 mb-6 font-body">
          <Link to="/" className="hover:text-brown-dark transition-colors">Home</Link>
          <ChevronRight size={14} />
          <span className="text-brown-dark font-medium">Products</span>
        </div>

        {/* Active Filter Chips - shown instead of category title */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-sm text-brown-dark/60 font-body">Active Filters:</span>
            {activeFilterChips.map((chip, idx) => (
              <button
                key={`${chip.type}-${chip.value}-${idx}`}
                onClick={() => removeFilter(chip.type, chip.value)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brown/10 hover:bg-brown/20 text-brown-dark rounded-full text-xs font-medium transition-colors group"
              >
                {chip.label}
                <X size={12} className="text-brown-dark/40 group-hover:text-brown-dark" />
              </button>
            ))}
            <button
              onClick={clearFilters}
              className="text-xs text-purple hover:text-purple-dark font-medium transition-colors ml-2"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-brown-dark/60 font-body text-sm">
            Showing {products.length} product{products.length !== 1 ? 's' : ''}
          </p>
          <div className="flex items-center gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field w-auto min-w-[180px] text-sm py-2"
            >
              <option value="">Sort by</option>
              <option value="price-high">Price: High to Low</option>
              <option value="price-low">Price: Low to High</option>
              <option value="date-latest">Newest First</option>
              <option value="discount">Highest Discount</option>
            </select>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`lg:hidden btn-primary flex items-center gap-2 text-sm py-2 ${showFilters ? 'bg-purple' : ''}`}
            >
              <Filter size={16} />
              Filters
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <aside
            className={`${showFilters ? 'block' : 'hidden'
              } lg:block w-full lg:w-64 flex-shrink-0 glass-card p-6 h-fit sticky top-32`}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-display font-bold text-brown-dark">Filters</h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-purple hover:text-purple-dark flex items-center gap-1 font-medium"
                >
                  <X size={14} />
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="mb-6">
              <h3 className="font-display font-semibold text-brown-dark mb-3 text-sm">Category</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {categories.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-2.5 cursor-pointer hover:text-gold-dark transition-colors group"
                  >
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(cat)}
                      onChange={() => handleCategoryFilter(cat)}
                      className="w-4 h-4 text-gold border-sand rounded focus:ring-gold accent-gold"
                    />
                    <span className="text-sm text-brown-dark font-body">{cat}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            {uniqueSizes.length > 0 && (
              <div className="mb-6">
                <h3 className="font-display font-semibold text-brown-dark mb-3 text-sm">Size</h3>
                <div className="space-y-2">
                  {uniqueSizes.map((size) => (
                    <label
                      key={size}
                      className="flex items-center gap-2.5 cursor-pointer hover:text-gold-dark transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={filters.sizes.includes(size)}
                        onChange={() => handleSizeFilter(size)}
                        className="w-4 h-4 text-gold border-sand rounded focus:ring-gold accent-gold"
                      />
                      <span className="text-sm text-brown-dark font-body">{size}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Color Filter */}
            {uniqueColors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-display font-semibold text-brown-dark mb-3 text-sm">Color</h3>
                <div className="space-y-2">
                  {uniqueColors.map((color) => (
                    <label
                      key={color}
                      className="flex items-center gap-2.5 cursor-pointer hover:text-gold-dark transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={filters.colors.includes(color)}
                        onChange={() => handleColorFilter(color)}
                        className="w-4 h-4 text-gold border-sand rounded focus:ring-gold accent-gold"
                      />
                      <span className="text-sm text-brown-dark font-body">{color}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Filter */}
            <div className="mb-6">
              <h3 className="font-display font-semibold text-brown-dark mb-3 text-sm">Price Range</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-brown-dark/60 mb-1 font-body">Min Price (₹)</label>
                  <input
                    type="number"
                    value={filters.minPrice}
                    onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    className="input-field text-sm py-2"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-xs text-brown-dark/60 mb-1 font-body">Max Price (₹)</label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    className="input-field text-sm py-2"
                    placeholder="10000"
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {products.length === 0 ? (
              <div className="text-center py-16 glass-card">
                <span className="text-6xl mb-4 block">🏺</span>
                <p className="text-xl text-brown-dark/60 mb-4 font-display">
                  No products found
                </p>
                <p className="text-brown-dark/40 mb-6 font-body">Try adjusting your filters</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="btn-primary">
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {products.map((product) => (
                  <div key={product.id} className="card group">
                    <Link to={`/product/${product.id}`}>
                      <div className="aspect-square bg-sand overflow-hidden relative">
                        {product.images && product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-sand to-brown-light flex items-center justify-center">
                            <span className="text-6xl">🏺</span>
                          </div>
                        )}
                        {product.discount > 0 && (
                          <span className="absolute top-3 left-3 bg-gradient-to-r from-purple to-purple-dark text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                            {product.discount}% OFF
                          </span>
                        )}
                      </div>
                    </Link>
                    <div className="p-4">
                      <Link to={`/product/${product.id}`}>
                        <h3 className="font-display font-semibold text-brown-dark mb-1 group-hover:text-gold-dark transition-colors line-clamp-2">
                          {product.name}
                        </h3>
                      </Link>
                      {product.description && (
                        <p className="text-xs text-brown-dark/50 mb-2 line-clamp-2 font-body">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-baseline gap-2">
                          {product.discount > 0 && (
                            <span className="text-xs text-purple font-bold">
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
                          className="flex-1 btn-primary text-sm py-2 flex items-center justify-center gap-1.5"
                        >
                          <Plus size={16} />
                          <span className="hidden sm:inline">Add to Cart</span>
                          <ShoppingCart size={16} className="sm:hidden" />
                        </button>
                        <button
                          onClick={() => addToWishlist(product)}
                          className={`p-2.5 rounded-xl transition-all ${isInWishlist(product.id)
                              ? 'bg-purple text-white shadow-md'
                              : 'bg-sand text-brown-dark hover:bg-purple hover:text-white'
                            }`}
                          aria-label="Add to wishlist"
                        >
                          <Heart
                            size={18}
                            fill={isInWishlist(product.id) ? 'currentColor' : 'none'}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductList
