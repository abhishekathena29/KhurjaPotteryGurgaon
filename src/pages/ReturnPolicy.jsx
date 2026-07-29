import { Link } from 'react-router-dom'
import { ChevronRight, RotateCcw, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

const ReturnPolicy = () => {
    return (
        <div className="min-h-screen bg-cream py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center gap-2 text-sm text-brown-dark/60 mb-6 font-body">
                    <Link to="/" className="hover:text-brown-dark transition-colors">Home</Link>
                    <ChevronRight size={14} />
                    <span className="text-brown-dark font-medium">Return Policy</span>
                </div>

                <div className="glass-card p-8 md:p-12">
                    <div className="text-center mb-10">
                        <span className="badge-gold mb-3 inline-block">↩️ Returns</span>
                        <h1 className="section-title mb-3">Return Policy</h1>
                        <p className="section-subtitle">We want you to love your pottery</p>
                    </div>

                    <div className="space-y-8 text-brown-dark/80 font-body leading-relaxed">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <RotateCcw className="text-gold-dark" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-brown-dark mb-2">Return Window</h2>
                                <p>We accept returns within 7 days of delivery. Items must be in original condition, unused, and in their original packaging. Please contact us to initiate a return.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="text-green-600" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-brown-dark mb-2">Eligible for Returns</h2>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Items damaged during delivery</li>
                                    <li>Wrong items received</li>
                                    <li>Items significantly different from the product listing</li>
                                    <li>Manufacturing defects</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                <XCircle className="text-red-400" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-brown-dark mb-2">Not Eligible for Returns</h2>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Items damaged after delivery due to mishandling</li>
                                    <li>Custom/personalized orders</li>
                                    <li>Items returned after 7 days</li>
                                    <li>Items without original packaging</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <AlertCircle className="text-gold-dark" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-brown-dark mb-2">Refund Process</h2>
                                <p>Once we receive and verify the returned item, refund will be processed within 5-7 business days to the original payment method. For pickup orders paid in cash, refund will be provided in cash.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 p-6 bg-gold/5 rounded-2xl border border-gold/10 text-center">
                        <p className="text-brown-dark/70 font-body">
                            Need to initiate a return? <Link to="/contact" className="text-gold-dark font-semibold hover:text-gold transition-colors">Contact us</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ReturnPolicy
