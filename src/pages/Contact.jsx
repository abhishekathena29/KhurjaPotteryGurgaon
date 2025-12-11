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
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-12 text-brown-dark">
          Contact Us
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-brown-dark">
              Get in Touch
            </h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Phone className="text-purple mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-brown-dark mb-1">
                    Phone Numbers
                  </h3>
                  <p className="text-brown-dark/80">+91 98765 43210</p>
                  <p className="text-brown-dark/80">+91 98765 43211</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <Mail className="text-purple mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-brown-dark mb-1">Email</h3>
                  <p className="text-brown-dark/80">info@khurjagng.com</p>
                  <p className="text-brown-dark/80">support@khurjagng.com</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <MapPin className="text-purple mt-1" size={24} />
                <div>
                  <h3 className="font-semibold text-brown-dark mb-1">
                    Location
                  </h3>
                  <p className="text-brown-dark/80">
                    Khurja Pottery Center
                    <br />
                    Sector 15, Gurgaon
                    <br />
                    Haryana, India - 122001
                  </p>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="mt-8">
              <h3 className="font-semibold text-brown-dark mb-4">
                Find Us on Map
              </h3>
              <div className="w-full h-64 bg-brown-light rounded-lg flex items-center justify-center">
                <div className="text-center text-brown-dark/60">
                  <MapPin size={48} className="mx-auto mb-2" />
                  <p>Map integration can be added here</p>
                  <p className="text-sm mt-2">
                    (Google Maps API or similar)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Raise an Issue Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-6 text-brown-dark">
              Raise an Issue
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-brown-dark mb-2"
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
                  className="input-field"
                  placeholder="Enter your name"
                />
              </div>

              <div>
                <label
                  htmlFor="contactNumber"
                  className="block text-sm font-medium text-brown-dark mb-2"
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
                  className="input-field"
                  placeholder="Enter your contact number"
                />
              </div>

              <div>
                <label
                  htmlFor="issue"
                  className="block text-sm font-medium text-brown-dark mb-2"
                >
                  Issue Details *
                </label>
                <textarea
                  id="issue"
                  name="issue"
                  value={formData.issue}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="input-field resize-none"
                  placeholder="Please describe your issue in detail..."
                />
              </div>

              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                <Send size={20} />
                Submit Issue
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact

