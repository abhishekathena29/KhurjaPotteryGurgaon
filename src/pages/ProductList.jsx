import { useState, useMemo, useEffect } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ShoppingCart, Heart, Filter, X, ChevronRight, Check } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { useProducts } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { formatMoney, productMatchesSearch } from '../lib/commerce'

const ProductList = () => {
  const { category } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchQuery = searchParams.get('search') || ''
  const { addToCart } = useCart()
  const { addToWishlist, isInWishlist } = useWishlist()
  const { products: allProducts, loading: productsLoading } = useProducts()
  const { categories } = useCategories()
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('')
  const [addedId, setAddedId] = useState(null)
  const [cartError, setCartError] = useState('')

  const handleAddToCart = (product) => {
    try {
      addToCart(product)
      setCartError('')
      setAddedId(product.id)
      setTimeout(() => setAddedId((curr) => (curr === product.id ? null : curr)), 3000)
    } catch (error) {
      setCartError(error.message)
    }
  }
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
    return [...new Set(allProducts.flatMap((product) =>
      product.variants.map((variant) => variant.color?.name || variant.color).filter(Boolean)
    ))].sort()
  }, [allProducts])

  const uniqueSizes = useMemo(() => {
    return [...new Set(allProducts.flatMap((product) =>
      product.variants.map((variant) => variant.size).filter(Boolean)
    ))].sort()
  }, [allProducts])

  let products = useMemo(() => {
    let filtered = [...allProducts]

    filtered = filtered.filter((product) => productMatchesSearch(product, searchQuery))

    // Apply "Best Sellers" filter
    if (category === 'Best Sellers') {
      filtered = filtered.filter((p) => p.isBestSeller)
    }

    // Apply category filters
    if (filters.categories.length > 0) {
      filtered = filtered.filter((p) => filters.categories.includes(p.category))
    }

    // Apply size filters
    if (filters.sizes.length > 0) {
      filtered = filtered.filter((p) => p.variants.some((variant) => filters.sizes.includes(variant.size)))
    }

    // Apply color filters
    if (filters.colors.length > 0) {
      filtered = filtered.filter((p) => p.variants.some((variant) =>
        filters.colors.includes(variant.color?.name || variant.color)
      ))
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
      filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    } else if (sortBy === 'discount') {
      filtered.sort((a, b) => (b.discount || 0) - (a.discount || 0))
    }

    return filtered
  }, [allProducts, category, filters, sortBy, searchQuery])

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

  const clearSearch = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('search')
    setSearchParams(next)
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
          <div className="w-8 h-8 border-[3px] border-sand border-t-brown-dark rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-brown-light font-light">Loading collection...</p>
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

        {searchQuery && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-display text-brown-dark">Search results for “{searchQuery}”</h1>
            <button onClick={clearSearch} className="text-sm text-terracotta hover:underline">Clear search</button>
          </div>
        )}

        {cartError && <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{cartError}</div>}

        {/* Active Filter Chips */}
        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <span className="text-xs text-brown-light font-medium uppercase tracking-widest">Active Filters:</span>
            {activeFilterChips.map((chip, idx) => (
              <button
                key={`${chip.type}-${chip.value}-${idx}`}
                onClick={() => removeFilter(chip.type, chip.value)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-sand hover:border-terracotta hover:text-terracotta text-brown-dark rounded-md text-xs font-medium transition-colors group shadow-sm"
              >
                {chip.label}
                <X size={12} className="text-brown-light group-hover:text-terracotta" />
              </button>
            ))}
            <button
              onClick={clearFilters}
              className="text-xs text-brown-light hover:text-terracotta font-medium transition-colors ml-2 border-b border-transparent hover:border-terracotta pb-0.5"
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
              className={`lg:hidden flex items-center gap-2 text-sm px-4 py-2 border rounded-lg transition-colors ${showFilters ? 'bg-brown-dark text-white border-brown-dark' : 'bg-white text-brown-dark border-sand hover:bg-sand'}`}
            >
              <Filter size={16} strokeWidth={1.5} />
              Filters
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <aside
            className={`${showFilters ? 'block' : 'hidden'
              } lg:block w-full lg:w-64 flex-shrink-0 bg-white border border-sand rounded-xl p-6 h-fit sticky top-32`}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-display font-medium text-brown-dark tracking-tight">Filters</h2>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-brown-light hover:text-terracotta flex items-center gap-1 font-medium transition-colors"
                >
                  <X size={14} />
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter */}
            <div className="mb-8">
              <h3 className="font-display font-medium text-brown-dark mb-4 text-sm tracking-wide">Category</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                {categories.map((cat) => (
                  <label
                    key={cat}
                    className="flex items-center gap-3 cursor-pointer hover:text-terracotta transition-colors group"
                  >
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(cat)}
                      onChange={() => handleCategoryFilter(cat)}
                      className="w-4 h-4 text-terracotta border-sand rounded focus:ring-terracotta accent-terracotta cursor-pointer"
                    />
                    <span className="text-sm text-brown-dark font-light">{cat}</span>
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
              <div className="text-center py-24 bg-white border border-sand rounded-xl">
                <span className="text-6xl mb-6 block grayscale opacity-20">🏺</span>
                <p className="text-xl text-brown-dark font-display font-medium tracking-tight mb-2">
                  No products found
                </p>
                <p className="text-brown-light mb-8 font-light">Try adjusting your filters to find what you're looking for.</p>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="px-6 py-2.5 border border-sand text-brown-dark hover:bg-sand rounded-lg transition-colors font-medium text-sm">
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="group flex flex-col">
                    <Link to={`/product/${product.id}`} className="block relative overflow-hidden rounded-xl bg-sand mb-4 aspect-[4/5] border border-transparent hover:border-sand transition-colors">
                      {product.images && product.images[0]?.url ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full bg-sand flex items-center justify-center">
                          <span className="text-4xl opacity-20 grayscale">🏺</span>
                        </div>
                      )}
                      {product.discount > 0 && (
                        <span className="absolute top-3 left-3 bg-terracotta text-white text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded shadow-sm">
                          {product.discount}% OFF
                        </span>
                      )}
                      {product.availableQuantity <= 0 && (
                        <span className="absolute top-3 right-3 bg-gray-900 text-white text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 rounded">Out of stock</span>
                      )}
                    </Link>
                    <div className="flex flex-col flex-1 px-1">
                      <Link to={`/product/${product.id}`}>
                        <h3 className="font-display font-medium text-lg text-brown-dark mb-1 group-hover:text-terracotta transition-colors line-clamp-2 leading-tight">
                          {product.name}
                        </h3>
                      </Link>
                      {product.description && (
                        <p className="text-xs text-brown-dark/50 mb-2 line-clamp-2 font-body">
                          {product.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mb-5 mt-auto pt-2">
                        <span className="font-medium text-brown-dark">{formatMoney(product.salePricePaise)}</span>
                        {product.discount > 0 && (
                          <span className="text-sm text-brown-light line-through">
                            {formatMoney(product.mrpPaise)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={product.availableQuantity <= 0}
                          className="flex-1 bg-brown-dark hover:bg-brown text-white text-sm py-2.5 rounded-lg transition-colors font-medium flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                        >
                          <ShoppingCart size={16} />
                          <span className="hidden sm:inline">{product.availableQuantity > 0 ? 'Add to Cart' : 'Out of stock'}</span>
                        </button>
                        <button
                          onClick={() => addToWishlist(product)}
                          className={`p-2.5 rounded-lg border transition-colors ${isInWishlist(product.id)
                            ? 'bg-terracotta border-terracotta text-white'
                            : 'border-sand text-brown-light hover:border-terracotta hover:text-terracotta'
                            }`}
                          aria-label="Add to wishlist"
                        >
                          <Heart size={18} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                      {addedId === product.id && (
                        <p className="mt-2 flex items-center gap-1.5 text-green-700 text-xs font-medium animate-fade-in">
                          <Check size={14} strokeWidth={2} />
                          Added to cart
                        </p>
                      )}
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
