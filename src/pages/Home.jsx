import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Star, Truck, Shield, Heart, Award, ArrowRight } from 'lucide-react'
import { useCategories } from '../hooks/useCategories'
import { useProducts } from '../hooks/useProducts'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

const Home = () => {
  const { categories, loading: categoriesLoading } = useCategories()
  const { products, loading: productsLoading } = useProducts()
  const { addToCart } = useCart()
  const { addToWishlist, isInWishlist } = useWishlist()
  const [currentSlide, setCurrentSlide] = useState(0)

  // Get featured products (best sellers - products with discount)
  const featuredProducts = products.filter((p) => p.discount > 0).slice(0, 6)

  const slides = [
    {
      image: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1200&h=400&fit=crop',
      title: 'Meet Our Artisans',
      description: 'Skilled potters creating beautiful handcrafted ceramics',
      gradient: 'from-brown-dark/80 to-terracotta/40',
    },
    {
      image: 'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=1200&h=400&fit=crop',
      title: 'New Stock Arrived!',
      description: 'Fresh collection of traditional pottery now available',
      gradient: 'from-purple-dark/70 to-brown/40',
    },
    {
      image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1200&h=400&fit=crop',
      title: 'Easy Delivery',
      description: 'Fast and safe delivery across Gurgaon',
      gradient: 'from-brown/80 to-gold-dark/40',
    },
    {
      image: 'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?w=1200&h=400&fit=crop',
      title: 'Customer Reviews',
      description: 'Loved by thousands of satisfied customers',
      gradient: 'from-terracotta-dark/80 to-brown/40',
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [slides.length])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)

  // Category icons/emoji map
  const categoryEmojis = {
    'Mugs': '☕', 'Plates': '🍽️', 'Bowls': '🥣', 'Planters': '🌱',
    'Vases': '🏺', 'Tea Sets': '🍵', 'Dinner Sets': '🍲', 'Decorations': '🎨',
  }

  return (
    <div>
      {/* Hero Slider */}
      <section className="relative">
        <div className="relative h-72 md:h-[480px] overflow-hidden">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-all duration-700 ${index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
                }`}
            >
              <div
                className="w-full h-full bg-cover bg-center"
                style={{ backgroundImage: `url(${slide.image})` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-r ${slide.gradient} flex items-center`}>
                  <div className="max-w-7xl mx-auto px-4 w-full">
                    <div className="max-w-xl animate-fade-in-up">
                      <span className="badge-gold text-xs mb-4 inline-block">✨ PottersCentral</span>
                      <h2 className="text-3xl md:text-5xl font-display font-bold mb-3 text-white drop-shadow-lg">
                        {slide.title}
                      </h2>
                      <p className="text-lg md:text-xl text-white/90 mb-6 font-body">
                        {slide.description}
                      </p>
                      <Link to="/products/All products" className="btn-primary inline-flex items-center gap-2">
                        Shop Now <ArrowRight size={18} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Slider Controls */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white p-2.5 rounded-full transition-all shadow-lg"
            aria-label="Previous slide"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-md hover:bg-white/40 text-white p-2.5 rounded-full transition-all shadow-lg"
            aria-label="Next slide"
          >
            <ChevronRight size={24} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`rounded-full transition-all duration-300 ${index === currentSlide ? 'w-8 h-2 bg-gold' : 'w-2 h-2 bg-white/50 hover:bg-white/80'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Category Tiles */}
      <section className="py-16 bg-cream pottery-motif">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="section-title mb-3">
              Explore Our <span className="text-gradient">Collections</span>
            </h2>
            <p className="section-subtitle">Discover authentic handcrafted pottery for every corner of your home</p>
          </div>
          {categoriesLoading ? (
            <div className="flex justify-center">
              <div className="w-8 h-8 border-3 border-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {categories.length > 0 ? categories.map((category, idx) => (
                <Link
                  key={category}
                  to={`/products/${category}`}
                  className="group relative bg-white rounded-2xl shadow-glass overflow-hidden transition-all duration-300 hover:shadow-warm-lg hover:-translate-y-1"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="aspect-[4/3] bg-gradient-to-br from-sand to-brown-light/30 flex items-center justify-center relative overflow-hidden">
                    <span className="text-5xl group-hover:scale-125 transition-transform duration-500">
                      {categoryEmojis[category] || '🏺'}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-t from-brown-dark/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <div className="p-4 text-center">
                    <h3 className="font-display font-semibold text-brown-dark group-hover:text-gold-dark transition-colors">
                      {category}
                    </h3>
                  </div>
                </Link>
              )) : (
                <p className="col-span-full text-center text-brown-dark/60">
                  No categories available yet.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Featured / Best Sellers */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="badge-gold mb-3 inline-block">⭐ Most Popular</span>
            <h2 className="section-title mb-3">Best Sellers</h2>
            <p className="section-subtitle">Handpicked favorites from our collection</p>
          </div>
          {productsLoading ? (
            <div className="flex justify-center">
              <div className="w-8 h-8 border-3 border-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProducts.map((product) => (
                <div key={product.id} className="card group">
                  <Link to={`/product/${product.id}`} className="block">
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
                  <div className="p-5">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-display font-semibold text-brown-dark mb-1 group-hover:text-gold-dark transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-brown-dark">₹{product.price}</span>
                        {product.discount > 0 && (
                          <span className="text-sm text-brown-dark/40 line-through">
                            ₹{Math.round(product.price / (1 - product.discount / 100))}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addToCart(product)}
                        className="flex-1 btn-primary text-sm py-2"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => addToWishlist(product)}
                        className={`p-2.5 rounded-xl transition-all duration-200 ${isInWishlist(product.id)
                            ? 'bg-purple text-white shadow-md'
                            : 'bg-sand text-brown-dark hover:bg-purple hover:text-white'
                          }`}
                      >
                        <Heart size={18} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="text-center mt-10">
            <Link to="/products/Best Sellers" className="btn-outline inline-flex items-center gap-2">
              View All Best Sellers <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-cream pottery-motif">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title mb-3">
              Why Choose <span className="text-gradient">PottersCentral</span>?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Award, title: 'Handcrafted Quality', desc: 'Each piece is carefully crafted by skilled artisans using traditional techniques', color: 'from-gold/20 to-gold/5' },
              { icon: Truck, title: 'Easy Delivery', desc: 'Fast and safe delivery across Gurgaon. Free delivery on orders above ₹1000', color: 'from-terracotta/20 to-terracotta/5' },
              { icon: Shield, title: 'Secure Payment', desc: 'Safe and secure payment options. Your data is always protected', color: 'from-purple/20 to-purple/5' },
              { icon: Heart, title: 'Support Artisans', desc: 'Every purchase directly supports local potters and their families', color: 'from-brown-light/30 to-brown-light/10' },
            ].map(({ icon: Icon, title, desc, color }, idx) => (
              <div key={idx} className="glass-card p-6 text-center group hover:-translate-y-1 transition-all duration-300">
                <div className={`w-16 h-16 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="text-brown-dark" size={28} />
                </div>
                <h3 className="font-display font-bold text-brown-dark mb-2">{title}</h3>
                <p className="text-sm text-brown-dark/70 font-body">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="badge-gold mb-3 inline-block">💬 Reviews</span>
            <h2 className="section-title">What Our Customers Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Priya Sharma', rating: 5, text: 'Beautiful handcrafted mugs! The quality is exceptional and they arrived safely. Will definitely order again.' },
              { name: 'Rajesh Kumar', rating: 5, text: 'Amazing collection of pottery. The traditional designs are stunning. Great service and fast delivery.' },
              { name: 'Anita Mehta', rating: 5, text: "Love my new planter! It's perfect for my balcony garden. The craftsmanship is outstanding." },
            ].map((testimonial, idx) => (
              <div key={idx} className="glass-card p-6 group hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={18} className="text-gold fill-current" />
                  ))}
                </div>
                <p className="text-brown-dark/80 mb-4 italic font-body leading-relaxed">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/30 to-brown-light/30 flex items-center justify-center font-display font-bold text-brown-dark text-sm">
                    {testimonial.name.charAt(0)}
                  </div>
                  <p className="font-display font-semibold text-brown-dark">{testimonial.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-16 bg-cream pottery-motif">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div>
              <span className="badge-gold mb-4 inline-block">🏺 Our Story</span>
              <h2 className="section-title mb-4">
                The Story Behind <span className="text-gradient">PottersCentral</span>
              </h2>
              <p className="text-lg text-brown-dark/80 mb-4 font-body leading-relaxed">
                A scholar's journey to bridge the gap between traditional artisans
                and modern customers. Discover how one person's vision is helping
                local potters reach customers across Gurgaon and beyond.
              </p>
              <p className="text-brown-dark/70 mb-6 font-body">
                Every product you see here represents hours of skilled craftsmanship,
                traditional techniques, and cultural heritage. By choosing PottersCentral,
                you're supporting local artisans, preserving traditional crafts, and
                bringing a piece of Indian culture into your home.
              </p>
              <Link to="/about" className="btn-primary inline-flex items-center gap-2">
                Learn More About Us <ArrowRight size={18} />
              </Link>
            </div>
            <div className="glass-card p-8">
              <h3 className="text-2xl font-display font-bold mb-4 text-brown-dark">Our Mission</h3>
              <p className="text-brown-dark/80 mb-6 font-body">
                To preserve and promote traditional Indian pottery while empowering
                local artisans and bringing authentic handcrafted ceramics to
                customers across India.
              </p>
              <div className="space-y-4">
                {[
                  'Direct support to local potters and their families',
                  'Preservation of traditional Indian pottery techniques',
                  'Bringing authentic handcrafted products to modern homes',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-gold-dark text-sm">✓</span>
                    </span>
                    <p className="text-brown-dark/70 font-body">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-brown-dark via-brown to-terracotta-dark text-white relative overflow-hidden">
        <div className="pottery-motif absolute inset-0 pointer-events-none opacity-5"></div>
        <div className="max-w-7xl mx-auto px-4 text-center relative">
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
            Ready to Explore Our Collection?
          </h2>
          <p className="text-lg mb-8 text-cream/90 font-body max-w-2xl mx-auto">
            Browse our wide range of handcrafted pottery and ceramics
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/products/All products" className="bg-gold hover:bg-gold-dark text-brown-dark px-8 py-3 rounded-xl transition-all font-medium hover:shadow-gold hover:scale-[1.02] inline-flex items-center gap-2">
              Shop All Products <ArrowRight size={18} />
            </Link>
            <Link to="/request-product" className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20 px-8 py-3 rounded-xl transition-all font-medium">
              Request Custom Product
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
