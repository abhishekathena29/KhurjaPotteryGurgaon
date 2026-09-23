import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Star, Truck, Shield, Heart, Award, ArrowRight } from 'lucide-react'
import { useCategories } from '../hooks/useCategories'
import { useProducts } from '../hooks/useProducts'
import { formatMoney } from '../lib/commerce'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'
import { firstConversation, founder, storyPhotos } from '../data/founderStory'

const Home = () => {
  const { categories, loading: categoriesLoading } = useCategories()
  const { products, loading: productsLoading } = useProducts()
  const { addToCart } = useCart()
  const { addToWishlist, isInWishlist } = useWishlist()
  const [currentSlide, setCurrentSlide] = useState(0)

  const featuredProducts = products
    .filter((product) => product.isBestSeller || product.merchandising?.featured)
    .sort((a, b) => (a.salesMetrics?.bestSellerRank || Number.MAX_SAFE_INTEGER) - (b.salesMetrics?.bestSellerRank || Number.MAX_SAFE_INTEGER))
    .slice(0, 6)

  const slides = [
    {
      photo: storyPhotos.potterAtStall,
      eyebrow: 'Khurja Potters · Gurgaon',
      title: 'A 600-Year-Old Craft by the Roadside',
      description: "Khurja's potters have shaped and fired clay for centuries. Here, their work gets a shopfront that doesn't close when the roadside does.",
      cta: { label: 'Shop Their Work', to: '/products/All products' },
    },
    {
      photo: storyPhotos.roadsideMugs,
      eyebrow: 'The Khurja Tradition',
      title: 'Shaped the Slow Way. Found the Fast Way.',
      description: 'Pots shaped by hand, on a wheel, now a few clicks from your door.',
      cta: { label: 'Shop Collection', to: '/products/All products' },
    },
    {
      photo: storyPhotos.founderRoadsideChat,
      eyebrow: 'Our Story',
      title: 'It Started With a Sunday',
      description: "How one high schooler's question became a digital shopfront for Khurja's potters.",
      cta: { label: 'Read the Story', to: '/about' },
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
        <div className="relative h-[460px] md:h-[560px] overflow-hidden bg-brown-dark">
          {slides.map((slide, index) => (
            <div
              key={slide.title}
              aria-hidden={index !== currentSlide}
              className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0 z-0'
                }`}
            >
              <img
                src={slide.photo.src}
                alt={slide.photo.alt}
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-[10000ms] ease-linear ${index === currentSlide ? 'scale-105' : 'scale-100'}`}
                style={{ objectPosition: slide.photo.position }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-brown-dark/85 via-brown-dark/55 to-brown-dark/20 flex items-center">
                <div className="max-w-7xl mx-auto px-4 md:px-20 w-full">
                  <div className="max-w-xl animate-fade-in-up">
                    <span className="text-white/80 tracking-[0.2em] uppercase text-xs font-semibold mb-4 inline-block">{slide.eyebrow}</span>
                    <h2 className="text-4xl md:text-6xl font-display font-medium mb-4 text-white tracking-tight">
                      {slide.title}
                    </h2>
                    <p className="text-lg md:text-xl text-white/80 mb-8 font-light leading-relaxed">
                      {slide.description}
                    </p>
                    <Link
                      to={slide.cta.to}
                      tabIndex={index === currentSlide ? undefined : -1}
                      className="bg-white hover:bg-sand text-brown-dark px-8 py-3.5 rounded-lg transition-all font-medium inline-flex items-center gap-2"
                    >
                      {slide.cta.label} <ArrowRight size={18} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Slider Controls */}
          <button
            onClick={prevSlide}
            className="hidden md:block absolute left-6 top-1/2 -translate-y-1/2 bg-white text-brown-dark hover:bg-sand p-3 rounded-full transition-all shadow-sm z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft size={20} className="stroke-[1.5]" />
          </button>
          <button
            onClick={nextSlide}
            className="hidden md:block absolute right-6 top-1/2 -translate-y-1/2 bg-white text-brown-dark hover:bg-sand p-3 rounded-full transition-all shadow-sm z-10"
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

      {/* Why We Exist */}
      <section className="py-24 bg-white border-b border-sand">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            <div className="lg:col-span-7">
              <span className="text-terracotta tracking-widest uppercase text-xs font-semibold mb-3 inline-block">Why We Exist</span>
              <h2 className="text-3xl md:text-5xl font-display font-medium text-brown-dark tracking-tight mb-6">
                The Work Was Extraordinary. The Reach Was Shrinking.
              </h2>
              <p className="text-lg text-brown-dark/80 mb-6 font-light leading-relaxed">
                Khurja's potters come from a migrant community that has been shaping and
                firing clay for roughly 600 years. Today many sell from roadside stalls on the
                outskirts of Gurgaon, and their craft has stayed almost entirely offline while
                everyone's buying habits moved online.
              </p>
              <p className="text-brown-light mb-8 font-light leading-relaxed">
                Potters Central is a digital shopfront built for these underserved potters, so
                their work reaches people who'll never drive past that stretch of road. Every
                order supports the potter who made the piece.
              </p>
              <Link to="/about" className="inline-flex items-center gap-2 border-b border-brown-dark pb-1 font-medium text-brown-dark hover:text-terracotta hover:border-terracotta transition-colors">
                Read the Full Story <ArrowRight size={16} />
              </Link>
            </div>
            <dl className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-4">
              {[
                { value: '600', unit: 'years', label: 'of shaping and firing clay' },
                { value: 'Khurja', unit: '', label: 'nicknamed the Ceramic City' },
                { value: 'By hand', unit: '', label: 'shaped on a wheel, the slow way' },
              ].map((fact) => (
                <div key={fact.value} className="flex flex-col-reverse bg-cream border border-sand rounded-xl px-6 py-5">
                  <dt className="text-sm text-brown-light font-light mt-1">{fact.label}</dt>
                  <dd className="font-display text-3xl font-medium text-brown-dark tracking-tight">
                    {fact.value}
                    {fact.unit && <span className="text-base font-body text-brown-light ml-2">{fact.unit}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Category Tiles */}
      <section className="py-24 bg-cream relative border-b border-sand">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-terracotta tracking-widest uppercase text-xs font-semibold mb-3 inline-block">Categories</span>
            <h2 className="text-3xl md:text-5xl font-display font-medium text-brown-dark tracking-tight mb-4">
              Many Forms. One Craft.
            </h2>
            <p className="text-brown-light font-light max-w-2xl mx-auto">Mugs, plates, bowls and more, shaped by Khurja's potters.</p>
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
            <p className="text-brown-light font-light max-w-2xl mx-auto">The potters' bestsellers, from the roadside stall to your home.</p>
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
                    {product.images && product.images[0]?.url ? (
                      <img
                        src={product.images[0].url}
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
                      <span className="font-medium text-brown-dark">{formatMoney(product.salePricePaise)}</span>
                      {product.discount > 0 && (
                        <span className="text-sm text-brown-light line-through">
                          {formatMoney(product.mrpPaise)}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addToCart(product)}
                        disabled={product.availableQuantity <= 0}
                        className="flex-1 bg-brown-dark hover:bg-brown text-white text-sm py-2.5 rounded-lg transition-colors font-medium disabled:bg-gray-300"
                      >
                        {product.availableQuantity > 0 ? 'Add to Cart' : 'Out of stock'}
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

      {/* Founder's Story */}
      <section className="py-24 bg-cream border-t border-sand">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <figure>
              <div className="aspect-[4/3] overflow-hidden rounded-xl border border-sand bg-sand">
                <img
                  src={storyPhotos.founderWithPotter.src}
                  alt={storyPhotos.founderWithPotter.alt}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: storyPhotos.founderWithPotter.position }}
                />
              </div>
              <figcaption className="mt-3 text-sm text-brown-light font-light">
                {storyPhotos.founderWithPotter.caption}
              </figcaption>
            </figure>
            <div>
              <span className="text-terracotta tracking-widest uppercase text-xs font-semibold mb-3 inline-block">The Founder's Story</span>
              <h2 className="text-3xl md:text-4xl font-display font-medium text-brown-dark tracking-tight mb-6 leading-tight">
                {firstConversation.lead}
              </h2>
              <p className="text-lg text-brown-dark/80 mb-8 font-light leading-relaxed">
                {firstConversation.paragraphs[0]}
              </p>
              <div className="border-l-2 border-terracotta pl-5 mb-10">
                <p className="font-display italic text-2xl text-brown-dark">{founder.name}</p>
                <p className="text-xs uppercase tracking-widest text-brown-light mt-1">{founder.role}</p>
              </div>
              <Link to="/about" className="inline-flex items-center gap-2 border-b border-brown-dark pb-1 font-medium text-brown-dark hover:text-terracotta hover:border-terracotta transition-colors">
                Read the Full Story <ArrowRight size={16} />
              </Link>
            </div>
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

      {/* CTA */}
      <section className="py-24 md:py-32 bg-brown-dark text-white relative overflow-hidden">
        <img
          src={storyPhotos.roadsidePlates.src}
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: storyPhotos.roadsidePlates.position }}
        />
        <div className="absolute inset-0 bg-brown-dark/80"></div>
        <div className="max-w-7xl mx-auto px-4 text-center relative z-10">
          <span className="text-white/70 tracking-[0.2em] uppercase text-xs font-semibold mb-4 inline-block">Support the Craft</span>
          <h2 className="text-4xl md:text-5xl font-display font-medium mb-6 tracking-tight">
            Bring a Piece of Khurja Home
          </h2>
          <p className="text-lg mb-10 text-white/70 font-light max-w-2xl mx-auto">
            Every order helps a potter sell more, and keeps a 600-year-old craft alive.
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
