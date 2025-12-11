import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-brown-dark text-cream mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Contact Details */}
          <div>
            <h3 className="text-xl font-bold mb-4">Contact Us</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Phone size={18} />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={18} />
                <span>+91 98765 43211</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={18} />
                <span>info@khurjagng.com</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={18} className="mt-1" />
                <span>Khurja Pottery Center, Gurgaon, Haryana</span>
              </div>
            </div>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-xl font-bold mb-4">Policies</h3>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="hover:text-purple-light transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-purple-light transition-colors">
                  Return Policy
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-purple-light transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-purple-light transition-colors">
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>

          {/* FAQ */}
          <div>
            <h3 className="text-xl font-bold mb-4">FAQ</h3>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="hover:text-purple-light transition-colors">
                  How to place an order?
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-purple-light transition-colors">
                  What is the delivery time?
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-purple-light transition-colors">
                  Do you deliver outside Gurgaon?
                </Link>
              </li>
              <li>
                <Link to="#" className="hover:text-purple-light transition-colors">
                  Can I request custom designs?
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-brown mt-8 pt-6 text-center">
          <p>&copy; 2024 Khurja@Gng. All rights reserved.</p>
          <p className="mt-2 text-sm">
            Handcrafted with ❤️ by local artisans of Khurja
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

