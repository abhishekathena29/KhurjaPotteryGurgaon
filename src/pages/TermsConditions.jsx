import { Link } from 'react-router-dom'
import { ChevronRight, FileText, ShoppingBag, Ban, Scale } from 'lucide-react'

const TermsConditions = () => {
    return (
        <div className="min-h-screen bg-cream py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center gap-2 text-sm text-brown-dark/60 mb-6 font-body">
                    <Link to="/" className="hover:text-brown-dark transition-colors">Home</Link>
                    <ChevronRight size={14} />
                    <span className="text-brown-dark font-medium">Terms & Conditions</span>
                </div>

                <div className="glass-card p-8 md:p-12">
                    <div className="text-center mb-10">
                        <span className="badge-gold mb-3 inline-block">📋 Terms</span>
                        <h1 className="section-title mb-3">Terms & Conditions</h1>
                        <p className="section-subtitle">Please read these terms carefully</p>
                    </div>

                    <div className="space-y-8 text-brown-dark/80 font-body leading-relaxed">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FileText className="text-gold-dark" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-brown-dark mb-2">General Terms</h2>
                                <p>By accessing and using PottersCentral, you agree to be bound by these terms and conditions. We reserve the right to update these terms at any time without prior notice.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <ShoppingBag className="text-gold-dark" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-brown-dark mb-2">Orders & Payment</h2>
                                <p>All orders are subject to availability. Prices are listed in Indian Rupees (₹) and are inclusive of applicable taxes. We accept cash on delivery and digital payments. Product prices may vary without notice.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Ban className="text-gold-dark" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-brown-dark mb-2">Product Variations</h2>
                                <p>As all our products are handcrafted, slight variations in color, shape, and size are natural and expected. These variations make each piece unique and are not considered as defects.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Scale className="text-gold-dark" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-brown-dark mb-2">Limitation of Liability</h2>
                                <p>PottersCentral shall not be liable for any indirect, incidental, or consequential damages arising from the use of our products or services. Our total liability shall not exceed the amount paid for the product in question.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 p-6 bg-gold/5 rounded-2xl border border-gold/10 text-center">
                        <p className="text-sm text-brown-dark/50 font-body">Last updated: February 2026</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TermsConditions
