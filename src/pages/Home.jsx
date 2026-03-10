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
      title: 'Master Artisans',
      description: 'Preserving heritage through handcrafted ceramics.',
      overlay: 'bg-brown-dark/50',
    },
    {
      image: 'https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?w=1200&h=400&fit=crop',
      title: 'Curated Collections',
      description: 'A new selection of minimalist pottery.',
      overlay: 'bg-brown-dark/50',
    },
    {
      image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=1200&h=400&fit=crop',
      title: 'Safe Delivery',
      description: 'Seamless shipping to your doorstep.',
      overlay: 'bg-brown-dark/50',
    },
    {
      image: 'https://images.unsplash.com/photo-1610701596061-2ecf227e85b2?w=1200&h=400&fit=crop',
      title: 'Timeless Design',
      description: 'Loved by interior designers worldwide.',
      overlay: 'bg-brown-dark/50',
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
        <div className="relative h-96 md:h-[560px] overflow-hidden">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0 z-0'
                }`}
            >
              <div
                className={`w-full h-full bg-cover bg-center transition-transform duration-[10000ms] ease-linear ${index === currentSlide ? 'scale-105' : 'scale-100'}`}
                style={{ backgroundImage: `url(${slide.image})` }}
              >
                <div className={`absolute inset-0 ${slide.overlay} flex items-center`}>
                  <div className="max-w-7xl mx-auto px-4 w-full">
                    <div className="max-w-xl animate-fade-in-up">
                      <span className="text-white/80 tracking-[0.2em] uppercase text-xs font-semibold mb-4 inline-block">Potters Central</span>
                      <h2 className="text-4xl md:text-6xl font-display font-medium mb-4 text-white tracking-tight">
                        {slide.title}
                      </h2>
                      <p className="text-lg md:text-xl text-white/80 mb-8 font-light leading-relaxed">
                        {slide.description}
                      </p>
                      <Link to="/products/All products" className="bg-white hover:bg-sand text-brown-dark px-8 py-3.5 rounded-lg transition-all font-medium inline-flex items-center gap-2">
                        Shop Collection <ArrowRight size={18} />
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
            className="absolute left-6 top-1/2 -translate-y-1/2 bg-white text-brown-dark hover:bg-sand p-3 rounded-full transition-all shadow-sm z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} className="stroke-[1.5]" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-6 top-1/2 -translate-y-1/2 bg-white text-brown-dark hover:bg-sand p-3 rounded-full transition-all shadow-sm z-10"
            aria-label="Next slide"
          >
            <ChevronRight size={20} className="stroke-[1.5]" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`rounded border transition-all duration-300 ${index === currentSlide ? 'w-8 h-[2px] border-white bg-white' : 'w-4 h-[2px] border-white/50 bg-white/50 hover:bg-white'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Category Tiles */}
      <section className="py-24 bg-cream relative border-b border-sand">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-terracotta tracking-widest uppercase text-xs font-semibold mb-3 inline-block">Categories</span>
            <h2 className="text-3xl md:text-5xl font-display font-medium text-brown-dark tracking-tight mb-4">
              Explore Collections
            </h2>
            <p className="text-brown-light font-light max-w-2xl mx-auto">Discover authentic handcrafted pottery for every corner of your home.</p>
          </div>
          {categoriesLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-[3px] border-sand border-t-brown-dark rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {categories.length > 0 ? categories.map((category, idx) => (
                <Link
                  key={category}
                  to={`/products/${category}`}
                  className="group relative bg-white rounded-xl border border-sand overflow-hidden transition-all duration-500 hover:shadow-warm hover:border-cream"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="aspect-[4/3] bg-sand flex items-center justify-center relative overflow-hidden">
                    <span className="text-4xl group-hover:scale-110 opacity-40 transition-transform duration-700 grayscale">
                      {categoryEmojis[category] || '🏺'}
                    </span>
                  </div>
                  <div className="p-5 text-center bg-white">
                    <h3 className="font-display font-medium text-brown-dark group-hover:text-terracotta transition-colors">
                      {category}
                    </h3>
                  </div>
                </Link>
              )) : (
                <p className="col-span-full text-center text-brown-light font-light">
                  No categories available yet.
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Featured / Best Sellers */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-terracotta tracking-widest uppercase text-xs font-semibold mb-3 inline-block">Most Popular</span>
            <h2 className="text-3xl md:text-5xl font-display font-medium text-brown-dark tracking-tight mb-4">Curated Favorites</h2>
            <p className="text-brown-light font-light max-w-2xl mx-auto">Handpicked bestsellers that define timeless design.</p>
          </div>
          {productsLoading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-[3px] border-sand border-t-brown-dark rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <div key={product.id} className="group flex flex-col">
                  <Link to={`/product/${product.id}`} className="block relative overflow-hidden rounded-xl bg-sand mb-4 aspect-[4/5]">
                    {product.images && product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="w-full h-full bg-sand flex items-center justify-center">
                        <span className="text-4xl opacity-20">🏺</span>
                      </div>
                    )}
                    {product.discount > 0 && (
                      <span className="absolute top-4 left-4 bg-terracotta text-white text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-sm shadow-sm">
                        {product.discount}% OFF
                      </span>
                    )}
                  </Link>
                  <div className="flex flex-col flex-1 px-1">
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-display font-medium text-lg text-brown-dark mb-1 group-hover:text-terracotta transition-colors line-clamp-2 leading-tight">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="flex items-center gap-3 mb-5 mt-auto pt-2">
                      <span className="font-medium text-brown-dark">₹{product.price}</span>
                      {product.discount > 0 && (
                        <span className="text-sm text-brown-light line-through">
                          ₹{Math.round(product.price / (1 - product.discount / 100))}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addToCart(product)}
                        className="flex-1 bg-brown-dark hover:bg-brown text-white text-sm py-2.5 rounded-lg transition-colors font-medium"
                      >
                        Add to Cart
                      </button>
                      <button
                        onClick={() => addToWishlist(product)}
                        className={`p-2.5 rounded-lg border transition-colors ${isInWishlist(product.id)
                          ? 'bg-terracotta border-terracotta text-white'
                          : 'border-sand text-brown-light hover:border-terracotta hover:text-terracotta'
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
          <div className="text-center mt-16">
            <Link to="/products/Best Sellers" className="inline-flex items-center gap-2 border-b border-brown-dark pb-1 font-medium text-brown-dark hover:text-terracotta hover:border-terracotta transition-colors">
              View All Best Sellers <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 bg-cream border-t border-b border-sand">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-terracotta tracking-widest uppercase text-xs font-semibold mb-3 inline-block">Our Values</span>
            <h2 className="text-3xl md:text-5xl font-display font-medium text-brown-dark tracking-tight">
              Why Potters Central?
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Award, title: 'Handcrafted Quality', desc: 'Each piece is carefully crafted by skilled artisans using traditional techniques.' },
              { icon: Truck, title: 'Seamless Delivery', desc: 'Fast and safe delivery across Gurgaon. Free delivery on orders above ₹1000.' },
              { icon: Shield, title: 'Secure Payment', desc: 'Safe and secure payment options. Your data is always protected.' },
              { icon: Heart, title: 'Support Artisans', desc: 'Every purchase directly supports local potters and their families.' },
            ].map(({ icon: Icon, title, desc }, idx) => (
              <div key={idx} className="bg-white border border-sand rounded-xl p-8 text-center group hover:-translate-y-1 transition-all duration-500">
                <div className={`w-12 h-12 bg-cream rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-sand transition-colors`}>
                  <Icon className="text-brown-dark stroke-[1.5]" size={24} />
                </div>
                <h3 className="font-display font-medium text-lg text-brown-dark mb-3">{title}</h3>
                <p className="text-sm text-brown-light font-light leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-terracotta tracking-widest uppercase text-xs font-semibold mb-3 inline-block">Reviews</span>
            <h2 className="text-3xl md:text-5xl font-display font-medium text-brown-dark tracking-tight">Community Love</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { name: 'Priya Sharma', rating: 5, text: 'Beautiful handcrafted mugs! The quality is exceptional and they arrived safely. Will definitely order again.' },
              { name: 'Rajesh Kumar', rating: 5, text: 'Amazing collection of pottery. The minimalist designs are stunning. Great service and fast delivery.' },
              { name: 'Anita Mehta', rating: 5, text: "Love my new planter! It's perfect for my balcony garden. The craftsmanship is outstanding." },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-sand/30 border border-sand rounded-xl p-8 hover:bg-sand/50 transition-colors">
                <div className="flex items-center gap-1.5 mb-6">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-terracotta fill-terracotta/20 stroke-[1.5]" />
                  ))}
                </div>
                <p className="text-brown-dark/80 mb-8 italic font-light leading-relaxed">
                  "{testimonial.text}"
                </p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="w-10 h-10 rounded-full bg-cream border border-sand flex items-center justify-center font-display font-medium text-brown-dark">
                    {testimonial.name.charAt(0)}
                  </div>
                  <p className="font-medium text-brown-dark text-sm">{testimonial.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Preview */}
      <section className="py-24 bg-cream border-t border-sand">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="text-terracotta tracking-widest uppercase text-xs font-semibold mb-3 inline-block">Our Story</span>
              <h2 className="text-3xl md:text-5xl font-display font-medium text-brown-dark tracking-tight mb-6">
                The Vision Behind Potters Central
              </h2>
              <p className="text-lg text-brown-dark/80 mb-6 font-light leading-relaxed">
                A scholar's journey to bridge the gap between traditional artisans
                and modern customers. Discover how one person's vision is helping
                local potters reach customers across India and beyond.
              </p>
              <p className="text-brown-light mb-8 font-light leading-relaxed">
                Every product you see here represents hours of skilled craftsmanship,
                traditional techniques, and cultural heritage. By choosing Potters Central,
                you're supporting local artisans, preserving crafts, and
                bringing a piece of culture into your home.
              </p>
              <Link to="/about" className="inline-flex items-center gap-2 border-b border-brown-dark pb-1 font-medium text-brown-dark hover:text-terracotta hover:border-terracotta transition-colors">
                Read Our Story <ArrowRight size={16} />
              </Link>
            </div>
            <div className="bg-white border border-sand rounded-xl p-10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-sand/50 rounded-bl-full -z-10 blur-2xl"></div>
              <h3 className="text-2xl font-display font-medium mb-6 text-brown-dark tracking-tight">Our Mission</h3>
              <p className="text-brown-dark/80 mb-8 font-light leading-relaxed">
                To preserve and promote traditional Indian pottery while empowering
                local artisans and bringing authentic handcrafted ceramics strictly
                to modern homes.
              </p>
              <div className="space-y-4">
                {[
                  'Direct support to local potters and their families',
                  'Preservation of traditional Indian pottery techniques',
                  'Bringing timeless designed goods to modern homes',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-start gap-4">
                    <span className="w-5 h-5 rounded-full border border-terracotta/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-terracotta text-[10px]">✓</span>
                    </span>
                    <p className="text-brown-dark/80 font-light text-sm">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-brown-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-sand via-brown-dark to-brown-dark"></div>
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-display font-medium mb-6 tracking-tight">
            Ready to Explore Our Collection?
          </h2>
          <p className="text-lg mb-10 text-white/70 font-light max-w-2xl mx-auto">
            Browse our wide range of handcrafted, timeless pottery pieces.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/products/All products" className="bg-white hover:bg-sand text-brown-dark px-8 py-3.5 rounded-lg transition-all font-medium inline-flex items-center gap-2 shadow-sm">
              Shop Collection <ArrowRight size={18} />
            </Link>
            <Link to="/request-product" className="bg-transparent hover:bg-white/5 text-white border border-white/20 px-8 py-3.5 rounded-lg transition-all font-medium">
              Request Custom Product
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
