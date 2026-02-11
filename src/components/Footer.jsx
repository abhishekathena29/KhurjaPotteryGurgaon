import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, ArrowRight, Heart } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-brown-dark to-[#3D1A00] text-cream mt-auto relative overflow-hidden">
      {/* Decorative top border */}
      <div className="h-1 bg-gradient-to-r from-transparent via-gold to-transparent"></div>

      {/* Pottery motif overlay */}
      <div className="pottery-motif absolute inset-0 pointer-events-none opacity-5"></div>

      <div className="max-w-7xl mx-auto px-4 py-12 relative">
        {/* Top section with brand */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <span className="text-4xl group-hover:animate-float">🏺</span>
            <h2 className="text-3xl font-display font-bold text-white group-hover:text-gold-light transition-colors">
              PottersCentral
            </h2>
          </Link>
          <p className="text-cream/60 mt-2 text-sm tracking-wide">
            Connecting artisans with art lovers since 2024
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Contact Details */}
          <div>
            <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-gold"></span>
              Contact Us
            </h3>
            <div className="space-y-3 text-sm">
              <a href="tel:+919876543210" className="flex items-center gap-3 text-cream/70 hover:text-gold-light transition-colors group">
                <Phone size={16} className="text-gold/60 group-hover:text-gold" />
                <span>+91 98765 43210</span>
              </a>
              <a href="tel:+919876543211" className="flex items-center gap-3 text-cream/70 hover:text-gold-light transition-colors group">
                <Phone size={16} className="text-gold/60 group-hover:text-gold" />
                <span>+91 98765 43211</span>
              </a>
              <a href="mailto:info@potterscentral.com" className="flex items-center gap-3 text-cream/70 hover:text-gold-light transition-colors group">
                <Mail size={16} className="text-gold/60 group-hover:text-gold" />
                <span>info@potterscentral.com</span>
              </a>
              <div className="flex items-start gap-3 text-cream/70">
                <MapPin size={16} className="text-gold/60 mt-0.5 flex-shrink-0" />
                <span>Khurja Pottery Center, Gurgaon, Haryana</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-gold"></span>
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/', label: 'Home' },
                { to: '/products/All products', label: 'All Products' },
                { to: '/about', label: 'About Us' },
                { to: '/contact', label: 'Contact Us' },
                { to: '/request-product', label: 'Request A Product' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="flex items-center gap-2 text-cream/70 hover:text-gold-light transition-colors group">
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-gold" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-gold"></span>
              Policies
            </h3>
            <ul className="space-y-2 text-sm">
              {[
                { to: '/shipping-policy', label: 'Shipping Policy' },
                { to: '/return-policy', label: 'Return Policy' },
                { to: '/data-policy', label: 'Privacy Policy' },
                { to: '/terms-conditions', label: 'Terms & Conditions' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="flex items-center gap-2 text-cream/70 hover:text-gold-light transition-colors group">
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-gold" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* FAQ & Help */}
          <div>
            <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2">
              <span className="w-8 h-[2px] bg-gold"></span>
              Help
            </h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/faq" className="flex items-center gap-2 text-cream/70 hover:text-gold-light transition-colors group">
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-gold" />
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link to="/profile" className="flex items-center gap-2 text-cream/70 hover:text-gold-light transition-colors group">
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-gold" />
                  My Account
                </Link>
              </li>
              <li>
                <Link to="/cart" className="flex items-center gap-2 text-cream/70 hover:text-gold-light transition-colors group">
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-gold" />
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link to="/wishlist" className="flex items-center gap-2 text-cream/70 hover:text-gold-light transition-colors group">
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-gold" />
                  Wishlist
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-cream/10 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-cream/50 text-sm">
              © 2024 PottersCentral. All rights reserved.
            </p>
            <p className="text-cream/50 text-sm flex items-center gap-1">
              Handcrafted with <Heart size={14} className="text-red-400 fill-current" /> by artisans of Khurja
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
