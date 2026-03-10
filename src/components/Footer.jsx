import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin, ArrowRight, Heart } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-white border-t border-sand text-brown-dark mt-auto relative overflow-hidden">
      {/* Decorative top border */}
      <div className="h-1 bg-sand/30"></div>

      {/* Pottery motif overlay - subtle */}
      <div className="pottery-motif absolute inset-0 pointer-events-none opacity-[0.02]"></div>

      <div className="max-w-7xl mx-auto px-4 py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand & Mission section */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="inline-flex items-center gap-3 group mb-4">
              <h2 className="text-3xl font-display font-medium text-brown-dark group-hover:text-terracotta transition-colors">
                Potters Central
              </h2>
            </Link>
            <p className="text-brown-light mt-2 text-sm leading-relaxed">
              Curated handcrafted ceramics and pottery connecting master artisans directly with art lovers since 2024.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-display font-medium mb-6 flex items-center gap-3 tracking-wide">
              <span className="w-6 h-[1px] bg-terracotta"></span>
              Quick Links
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                { to: '/', label: 'Home' },
                { to: '/products/All products', label: 'All Products' },
                { to: '/about', label: 'Our Story' },
                { to: '/contact', label: 'Contact Us' },
                { to: '/request-product', label: 'Custom Requests' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="flex items-center gap-2 text-brown-light hover:text-terracotta transition-colors group">
                    <ArrowRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-terracotta" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-base font-display font-medium mb-6 flex items-center gap-3 tracking-wide">
              <span className="w-6 h-[1px] bg-terracotta"></span>
              Policies
            </h3>
            <ul className="space-y-3 text-sm">
              {[
                { to: '/shipping-policy', label: 'Shipping & Delivery' },
                { to: '/return-policy', label: 'Returns & Exchanges' },
                { to: '/data-policy', label: 'Privacy Policy' },
                { to: '/terms-conditions', label: 'Terms of Service' },
              ].map(({ to, label }) => (
                <li key={to}>
                  <Link to={to} className="flex items-center gap-2 text-brown-light hover:text-terracotta transition-colors group">
                    <ArrowRight size={12} className="opacity-0 -ml-4 group-hover:opacity-100 group-hover:ml-0 transition-all text-terracotta" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-base font-display font-medium mb-6 flex items-center gap-3 tracking-wide">
              <span className="w-6 h-[1px] bg-terracotta"></span>
              Connect
            </h3>
            <div className="space-y-4 text-sm">
              <a href="mailto:hello@potterscentral.com" className="flex items-center gap-3 text-brown-light hover:text-terracotta transition-colors group">
                <Mail size={16} className="text-brown-light/60 group-hover:text-terracotta" />
                <span>hello@potterscentral.com</span>
              </a>
              <a href="tel:+919876543210" className="flex items-center gap-3 text-brown-light hover:text-terracotta transition-colors group">
                <Phone size={16} className="text-brown-light/60 group-hover:text-terracotta" />
                <span>+91 98765 43210</span>
              </a>
              <div className="flex items-start gap-3 text-brown-light leading-relaxed">
                <MapPin size={16} className="text-brown-light/60 mt-1 flex-shrink-0" />
                <span>Artisan's Guild, Central Station<br />Gurgaon, Haryana</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-sand pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-brown-light text-sm">
              © {new Date().getFullYear()} Potters Central. All rights reserved.
            </p>
            <p className="text-brown-light text-sm flex items-center gap-1.5">
              Handcrafted with <Heart size={14} className="text-terracotta fill-terracotta/20" /> by independent artisans
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
