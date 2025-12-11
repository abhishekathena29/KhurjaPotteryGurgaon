import { useState } from 'react'
import { Send } from 'lucide-react'
import { useCategories } from '../hooks/useCategories'

const RequestProduct = () => {
  const { categories } = useCategories()
  const [formData, setFormData] = useState({
    name: '',
    contactNumber: '',
    productCategory: '',
    preferredColor: '',
    productSize: '',
    expectedByDate: '',
    referenceProductLink: '',
    additionalDetails: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle form submission
    console.log('Product request submitted:', formData)
    alert('Thank you for your request! We will contact you soon to discuss your custom product.')
    setFormData({
      name: '',
      contactNumber: '',
      productCategory: '',
      preferredColor: '',
      productSize: '',
      expectedByDate: '',
      referenceProductLink: '',
      additionalDetails: '',
    })
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-bold text-center mb-8 text-brown-dark">
          Request a Product
        </h1>

        {/* Policy Information */}
        <section className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-brown-dark">
            Our Request Policy
          </h2>
          <div className="prose max-w-none text-brown-dark/80">
            <p className="mb-3">
              At Khurja@Gng, we understand that every customer has unique needs
              and preferences. Our custom product request service allows you to
              work directly with our skilled artisans to create pottery that
              matches your exact requirements.
            </p>
            <p className="mb-3">
              <strong>How it works:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 mb-3">
              <li>
                Fill out the request form below with your product details
              </li>
              <li>
                Our team will review your request and contact you within 2-3
                business days
              </li>
              <li>
                We'll discuss design, pricing, and timeline with you
              </li>
              <li>
                Once approved, our artisans will create your custom product
              </li>
              <li>
                Custom products typically take 2-4 weeks to complete
              </li>
            </ul>
            <p>
              <strong>Note:</strong> Custom orders require a 50% advance
              payment. The remaining amount is due upon delivery. All custom
              products are made to order and cannot be returned unless there's a
              manufacturing defect.
            </p>
          </div>
        </section>

        {/* Request Form */}
        <section className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6 text-brown-dark">
            Product Request Form
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
                placeholder="Enter your full name"
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
                htmlFor="productCategory"
                className="block text-sm font-medium text-brown-dark mb-2"
              >
                Product Category *
              </label>
              <select
                id="productCategory"
                name="productCategory"
                value={formData.productCategory}
                onChange={handleChange}
                required
                className="input-field"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="preferredColor"
                className="block text-sm font-medium text-brown-dark mb-2"
              >
                Preferred Color
              </label>
              <input
                type="text"
                id="preferredColor"
                name="preferredColor"
                value={formData.preferredColor}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Terracotta, Blue-Green, etc."
              />
            </div>

            <div>
              <label
                htmlFor="productSize"
                className="block text-sm font-medium text-brown-dark mb-2"
              >
                Product Size
              </label>
              <select
                id="productSize"
                name="productSize"
                value={formData.productSize}
                onChange={handleChange}
                className="input-field"
              >
                <option value="">Select size</option>
                <option value="Small">Small</option>
                <option value="Medium">Medium</option>
                <option value="Large">Large</option>
                <option value="Custom">Custom (specify in details)</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="expectedByDate"
                className="block text-sm font-medium text-brown-dark mb-2"
              >
                Expected by Date
              </label>
              <input
                type="date"
                id="expectedByDate"
                name="expectedByDate"
                value={formData.expectedByDate}
                onChange={handleChange}
                className="input-field"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label
                htmlFor="referenceProductLink"
                className="block text-sm font-medium text-brown-dark mb-2"
              >
                Reference Product Link / SKU ID
              </label>
              <input
                type="text"
                id="referenceProductLink"
                name="referenceProductLink"
                value={formData.referenceProductLink}
                onChange={handleChange}
                className="input-field"
                placeholder="Paste product link or enter SKU ID (e.g., MUG-001)"
              />
            </div>

            <div>
              <label
                htmlFor="additionalDetails"
                className="block text-sm font-medium text-brown-dark mb-2"
              >
                Additional Details
              </label>
              <textarea
                id="additionalDetails"
                name="additionalDetails"
                value={formData.additionalDetails}
                onChange={handleChange}
                rows={6}
                className="input-field resize-none"
                placeholder="Please provide any additional details, specific requirements, design preferences, etc."
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Send size={20} />
              Submit Request
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}

export default RequestProduct

