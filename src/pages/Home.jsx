import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Star, Truck, Shield, Heart, Award } from 'lucide-react'
import { useCategories } from '../hooks/useCategories'
import { mockProducts } from '../data/mockData'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

const Home = () => {
  const { categories, loading: categoriesLoading } = useCategories()
  const { addToCart } = useCart()
  const { addToWishlist, isInWishlist } = useWishlist()
  const [currentSlide, setCurrentSlide] = useState(0)
  
  // Get featured products (best sellers)
  const featuredProducts = mockProducts.filter((p) => p.discount > 0).slice(0, 6)

  const slides = [
    {
      image: '/api/placeholder/1200/400',
      title: 'Meet Our Artisans',
      description: 'Skilled potters creating beautiful handcrafted ceramics',
    },
    {
      image: '/api/placeholder/1200/400',
      title: 'New Stock Arrived!',
      description: 'Fresh collection of traditional pottery now available',
    },
    {
      image: '/api/placeholder/1200/400',
      title: 'Easy Delivery',
      description: 'Fast and safe delivery across Gurgaon',
    },
    {
      image: '/api/placeholder/1200/400',
      title: 'Customer Reviews',
      description: 'Loved by thousands of satisfied customers',
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [slides.length])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
  }

  return (
    <div>
      {/* Image Slider */}
      <section className="relative bg-cream py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative h-64 md:h-96 rounded-lg overflow-hidden shadow-lg">
            {slides.map((slide, index) => (
              <div
                key={index}
                className={`absolute inset-0 transition-opacity duration-500 ${
                  index === currentSlide ? 'opacity-100' : 'opacity-0'
                }`}
              >
                <div
                  className="w-full h-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${slide.image})`,
                    backgroundColor: '#D4A574',
                  }}
                >
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-center text-white px-4">
                      <h2 className="text-2xl md:text-4xl font-bold mb-2">
                        {slide.title}
                      </h2>
                      <p className="text-lg md:text-xl">{slide.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Navigation Arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-brown p-2 rounded-full transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white text-brown p-2 rounded-full transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight size={24} />
            </button>

            {/* Dots Indicator */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentSlide ? 'bg-white' : 'bg-white/50'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Product Category Tiles */}
      <section className="py-12 bg-cream">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-brown-dark">
            Explore Our Collections
          </h2>
          {categoriesLoading ? (
            <p className="text-center text-brown-dark/60">Loading categories...</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
              {categories.length > 0 ? categories.map((category) => (
              <Link
                key={category}
                to={`/products/${category}`}
                className="card group"
              >
                <div className="aspect-square bg-brown-light flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-brown-light to-brown-dark flex items-center justify-center">
                    <span className="text-4xl">🏺</span>
                  </div>
                </div>
                <div className="p-4 text-center">
                  <h3 className="font-semibold text-brown-dark group-hover:text-purple transition-colors">
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

      {/* Featured Products */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 text-brown-dark">
              Best Sellers
            </h2>
            <p className="text-brown-dark/60">Handpicked favorites from our collection</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
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
                    <h3 className="font-semibold text-brown-dark mb-1 hover:text-purple transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center justify-between mb-2">
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
                      className="flex-1 bg-brown hover:bg-brown-dark text-white px-4 py-2 rounded-lg transition-colors text-sm"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={() => addToWishlist(product)}
                      className={`p-2 rounded-lg transition-colors ${
                        isInWishlist(product.id)
                          ? 'bg-purple text-white'
                          : 'bg-brown-light text-brown-dark hover:bg-purple hover:text-white'
                      }`}
                    >
                      <Heart size={18} fill={isInWishlist(product.id) ? 'currentColor' : 'none'} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link to="/products/Best Sellers" className="btn-primary">
              View All Best Sellers
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-12 bg-cream">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-brown-dark">
            Why Choose Khurja@Gng?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="text-purple" size={32} />
              </div>
              <h3 className="font-bold text-brown-dark mb-2">Handcrafted Quality</h3>
              <p className="text-sm text-brown-dark/70">
                Each piece is carefully crafted by skilled artisans using traditional techniques
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="text-purple" size={32} />
              </div>
              <h3 className="font-bold text-brown-dark mb-2">Easy Delivery</h3>
              <p className="text-sm text-brown-dark/70">
                Fast and safe delivery across Gurgaon. Free delivery on orders above ₹1000
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="text-purple" size={32} />
              </div>
              <h3 className="font-bold text-brown-dark mb-2">Secure Payment</h3>
              <p className="text-sm text-brown-dark/70">
                Safe and secure payment options. Your data is protected
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <div className="w-16 h-16 bg-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-purple" size={32} />
              </div>
              <h3 className="font-bold text-brown-dark mb-2">Support Artisans</h3>
              <p className="text-sm text-brown-dark/70">
                Every purchase directly supports local potters and their families
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-brown-dark">
            What Our Customers Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Priya Sharma',
                rating: 5,
                text: 'Beautiful handcrafted mugs! The quality is exceptional and they arrived safely. Will definitely order again.',
              },
              {
                name: 'Rajesh Kumar',
                rating: 5,
                text: 'Amazing collection of pottery. The traditional designs are stunning. Great service and fast delivery.',
              },
              {
                name: 'Anita Mehta',
                rating: 5,
                text: 'Love my new planter! It\'s perfect for my balcony garden. The craftsmanship is outstanding.',
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-cream rounded-lg shadow-md p-6">
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={20} className="text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-brown-dark/80 mb-4 italic">"{testimonial.text}"</p>
                <p className="font-semibold text-brown-dark">- {testimonial.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section Preview */}
      <section className="py-12 bg-cream">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-brown-dark">
                The Story Behind Khurja@Gng
              </h2>
              <p className="text-lg text-brown-dark/80 mb-4">
                A scholar's journey to bridge the gap between traditional artisans
                and modern customers. Discover how one person's vision is helping
                local potters reach customers across Gurgaon and beyond.
              </p>
              <p className="text-brown-dark/70 mb-6">
                Every product you see here represents hours of skilled craftsmanship,
                traditional techniques, and cultural heritage. By choosing Khurja@Gng,
                you're not just buying pottery—you're supporting local artisans,
                preserving traditional crafts, and bringing a piece of Indian culture
                into your home.
              </p>
              <Link to="/about" className="btn-primary inline-block">
                Learn More About Us
              </Link>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-2xl font-bold mb-4 text-brown-dark">Our Mission</h3>
              <p className="text-brown-dark/80 mb-4">
                To preserve and promote traditional Indian pottery while empowering
                local artisans and bringing authentic handcrafted ceramics to
                customers across India.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-purple text-xl">✓</span>
                  <p className="text-brown-dark/70">
                    Direct support to local potters and their families
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-purple text-xl">✓</span>
                  <p className="text-brown-dark/70">
                    Preservation of traditional Indian pottery techniques
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-purple text-xl">✓</span>
                  <p className="text-brown-dark/70">
                    Bringing authentic handcrafted products to modern homes
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 bg-brown-dark text-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Explore Our Collection?
          </h2>
          <p className="text-lg mb-6 text-cream/90">
            Browse our wide range of handcrafted pottery and ceramics
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/products/All products" className="btn-secondary">
              Shop All Products
            </Link>
            <Link to="/request-product" className="bg-white text-brown-dark hover:bg-cream px-6 py-2 rounded-lg transition-colors font-medium">
              Request Custom Product
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home

