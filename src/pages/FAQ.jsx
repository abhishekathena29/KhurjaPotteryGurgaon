import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, ChevronDown, HelpCircle } from 'lucide-react'

const FAQ = () => {
    const [openIndex, setOpenIndex] = useState(null)

    const faqs = [
        {
            q: 'Are all products handcrafted?',
            a: 'Yes! All our products are handcrafted by skilled artisans from Khurja, Uttar Pradesh. Each piece is unique and made using traditional pottery techniques passed down through generations.',
        },
        {
            q: 'How do I place an order?',
            a: 'Simply browse our collection, add items to your cart, and proceed to checkout. You can also contact us directly via phone or email to place an order.',
        },
        {
            q: 'What payment methods do you accept?',
            a: 'We accept cash on delivery, UPI payments, and bank transfers. For online payments, we support all major UPI apps and net banking.',
        },
        {
            q: 'Do you deliver outside Gurgaon?',
            a: 'Currently, we deliver within Gurgaon and surrounding areas. For customers outside our delivery area, we offer in-store pickup. We are working on expanding our delivery network.',
        },
        {
            q: 'What if my product arrives damaged?',
            a: 'We take great care in packaging our products. However, if your item arrives damaged, please contact us within 24 hours with photos of the damage. We will arrange a replacement at no extra cost.',
        },
        {
            q: 'Can I return a product?',
            a: 'Yes, we accept returns within 7 days of delivery for items in original condition. Customized products are not eligible for returns. Please see our Return Policy for full details.',
        },
        {
            q: 'Can I request a custom product?',
            a: 'Absolutely! Visit our "Request A Product" page to describe what you need. We work with artisans to create custom pieces based on your specifications. Custom orders usually take 2-3 weeks.',
        },
        {
            q: 'Are your products microwave and dishwasher safe?',
            a: 'Most of our ceramic products are microwave and dishwasher safe. However, hand-painted decorative items should be hand washed. Please check individual product descriptions for specific care instructions.',
        },
        {
            q: 'Do you offer bulk or corporate orders?',
            a: 'Yes! We offer special pricing for bulk orders. Contact us with your requirements and we will provide a custom quote. Pottery items make excellent corporate gifts and event favors.',
        },
    ]

    return (
        <div className="min-h-screen bg-cream py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center gap-2 text-sm text-brown-dark/60 mb-6 font-body">
                    <Link to="/" className="hover:text-brown-dark transition-colors">Home</Link>
                    <ChevronRight size={14} />
                    <span className="text-brown-dark font-medium">FAQ</span>
                </div>

                <div className="text-center mb-10">
                    <span className="badge-gold mb-3 inline-block">❓ FAQ</span>
                    <h1 className="section-title mb-3">Frequently Asked Questions</h1>
                    <p className="section-subtitle">Find answers to common questions about PottersCentral</p>
                </div>

                <div className="space-y-3">
                    {faqs.map((faq, index) => (
                        <div key={index} className="glass-card overflow-hidden">
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-5 text-left hover:bg-gold/5 transition-colors"
                            >
                                <div className="flex items-center gap-3">
                                    <HelpCircle size={20} className="text-gold-dark flex-shrink-0" />
                                    <span className="font-display font-semibold text-brown-dark">{faq.q}</span>
                                </div>
                                <ChevronDown
                                    size={20}
                                    className={`text-brown-dark/40 flex-shrink-0 transition-transform duration-300 ${openIndex === index ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            {openIndex === index && (
                                <div className="px-5 pb-5 pl-12 animate-fade-in">
                                    <p className="text-brown-dark/75 font-body leading-relaxed">{faq.a}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-10 glass-card p-8 text-center">
                    <h2 className="font-display font-bold text-xl text-brown-dark mb-2">Still have questions?</h2>
                    <p className="text-brown-dark/60 font-body mb-4">We're happy to help!</p>
                    <Link to="/contact" className="btn-primary inline-flex items-center gap-2">
                        Contact Us <ChevronRight size={18} />
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default FAQ
