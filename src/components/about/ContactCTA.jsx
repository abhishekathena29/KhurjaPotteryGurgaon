import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin } from 'lucide-react'

const ContactCTA = () => {
  return (
    <section className="bg-brown-dark rounded-xl p-8 md:p-16 text-white mb-12 max-w-5xl mx-auto relative overflow-hidden border border-brown">
      <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
        <span className="text-9xl">🏺</span>
      </div>
      <div className="max-w-4xl mx-auto relative z-10">
        <h2 className="text-3xl md:text-4xl font-display font-medium mb-6 text-center tracking-tight">
          Join Us in Preserving Tradition
        </h2>
        <p className="text-center mb-12 text-cream/70 font-light max-w-2xl mx-auto leading-relaxed">
          Have questions? Want to collaborate? Or simply want to learn more
          about our mission? We'd love to hear from you.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 max-w-3xl mx-auto">
          <div className="flex items-center justify-center sm:justify-start gap-4">
            <div className="w-12 h-12 border border-brown rounded-full flex items-center justify-center bg-white/5">
              <Phone size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-cream/50 mb-1 font-medium">Call Us</p>
              <p className="font-light text-sm">+91 98765 43210</p>
            </div>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-4">
            <div className="w-12 h-12 border border-brown rounded-full flex items-center justify-center bg-white/5">
              <Mail size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-cream/50 mb-1 font-medium">Email Us</p>
              <p className="font-light text-sm">hello@potterscentral.in</p>
            </div>
          </div>
          <div className="flex items-center justify-center sm:justify-start gap-4">
            <div className="w-12 h-12 border border-brown rounded-full flex items-center justify-center bg-white/5">
              <MapPin size={18} strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-cream/50 mb-1 font-medium">Visit Us</p>
              <p className="font-light text-sm">Gurgaon, Haryana</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            to="/contact"
            className="bg-white text-brown-dark hover:bg-cream px-8 py-3.5 rounded-lg transition-colors font-medium text-sm text-center"
          >
            Contact Us
          </Link>
          <Link
            to="/request-product"
            className="bg-transparent border border-cream/30 hover:bg-white/10 text-white px-8 py-3.5 rounded-lg transition-colors font-medium text-sm text-center"
          >
            Request Custom Product
          </Link>
        </div>
      </div>
    </section>
  )
}

export default ContactCTA

