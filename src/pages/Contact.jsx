import { useState } from 'react'
import { Phone, Mail, MapPin, Send } from 'lucide-react'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    issue: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission
    console.log('Issue submitted:', formData)
    alert('Thank you for contacting us! We will get back to you soon.')
    setFormData({ name: '', contactNumber: '', issue: '' })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-cream py-16">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <span className="text-terracotta tracking-widest uppercase text-xs font-semibold mb-3 inline-block">Support</span>
          <h1 className="text-3xl md:text-5xl font-display font-medium text-brown-dark tracking-tight">
            Contact Us
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="bg-white border border-sand rounded-xl p-10 h-fit sticky top-24">
            <h2 className="text-2xl font-display font-medium mb-8 text-brown-dark tracking-tight">
              Get in Touch
            </h2>
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-sand rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="text-brown-dark stroke-[1.5]" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-brown-dark mb-1">
                    Phone
                  </h3>
                  <p className="text-brown-light font-light text-sm">+91 98765 43210</p>
                  <p className="text-brown-light font-light text-sm">+91 98765 43211</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-sand rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="text-brown-dark stroke-[1.5]" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-brown-dark mb-1">Email</h3>
                  <p className="text-brown-light font-light text-sm">hello@potterscentral.in</p>
                  <p className="text-brown-light font-light text-sm">support@potterscentral.in</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-sand rounded-full flex items-center justify-center flex-shrink-0">
                  <MapPin className="text-brown-dark stroke-[1.5]" size={20} />
                </div>
                <div>
                  <h3 className="font-medium text-brown-dark mb-1">
                    Location
                  </h3>
                  <p className="text-brown-light font-light text-sm leading-relaxed">
                    Potters Central Studio
                    <br />
                    Sector 15, Gurgaon
                    <br />
                    Haryana, India - 122001
                  </p>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="mt-10 pt-10 border-t border-sand">
              <h3 className="font-medium text-brown-dark mb-4">
                Find Us on Map
              </h3>
              <div className="w-full h-48 bg-sand/50 rounded-lg flex items-center justify-center border border-sand">
                <div className="text-center text-brown-light font-light text-sm">
                  <MapPin size={32} className="mx-auto mb-2 opacity-50 stroke-[1.5]" />
                  <p>Map Area</p>
                </div>
              </div>
            </div>
          </div>

          {/* Raise an Issue Form */}
          <div className="bg-white border border-sand rounded-xl p-10">
            <h2 className="text-2xl font-display font-medium mb-8 text-brown-dark tracking-tight">
              Send a Message
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs uppercase tracking-widest font-medium text-brown-light mb-2"
                >
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white border border-sand text-brown-dark rounded-lg focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors text-sm"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label
                  htmlFor="contactNumber"
                  className="block text-xs uppercase tracking-widest font-medium text-brown-light mb-2"
                >
                  Contact Number *
                </label>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-white border border-sand text-brown-dark rounded-lg focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors text-sm"
                  placeholder="+91"
                />
              </div>

              <div>
                <label
                  htmlFor="issue"
                  className="block text-xs uppercase tracking-widest font-medium text-brown-light mb-2"
                >
                  Message *
                </label>
                <textarea
                  id="issue"
                  name="issue"
                  value={formData.issue}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 bg-white border border-sand text-brown-dark rounded-lg focus:outline-none focus:border-terracotta focus:ring-1 focus:ring-terracotta transition-colors resize-none text-sm"
                  placeholder="How can we help you?"
                />
              </div>

              <button type="submit" className="w-full px-6 py-3.5 bg-brown-dark hover:bg-brown text-white rounded-lg transition-colors font-medium flex items-center justify-center gap-2">
                <Send size={18} strokeWidth={1.5} />
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact

