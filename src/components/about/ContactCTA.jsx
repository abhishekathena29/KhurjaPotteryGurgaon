import { Link } from 'react-router-dom'
import { Mail, Phone, MapPin } from 'lucide-react'

const ContactCTA = () => {
  return (
    <section className="bg-gradient-to-r from-brown-dark to-brown rounded-lg shadow-lg p-8 text-white mb-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-4 text-center">
          Join Us in Preserving Traditional Crafts
        </h2>
        <p className="text-center mb-8 text-white/90">
          Have questions? Want to collaborate? Or simply want to learn more
          about our mission? We'd love to hear from you!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Phone size={20} />
            </div>
            <div>
              <p className="text-sm text-white/80">Call Us</p>
              <p className="font-semibold">+91 98765 43210</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-sm text-white/80">Email Us</p>
              <p className="font-semibold">info@khurjagng.com</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-sm text-white/80">Visit Us</p>
              <p className="font-semibold">Gurgaon, Haryana</p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            to="/contact"
            className="bg-white text-brown-dark hover:bg-cream px-6 py-3 rounded-lg transition-colors font-medium"
          >
            Contact Us
          </Link>
          <Link
            to="/request-product"
            className="bg-purple hover:bg-purple-dark text-white px-6 py-3 rounded-lg transition-colors font-medium"
          >
            Request Custom Product
          </Link>
        </div>
      </div>
    </section>
  )
}

export default ContactCTA

