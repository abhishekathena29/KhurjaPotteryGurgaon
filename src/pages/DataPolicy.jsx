import { Link } from 'react-router-dom'
import { ChevronRight, Lock, Eye, Database, Shield } from 'lucide-react'

const PrivacyPolicy = () => {
    return (
        <div className="min-h-screen bg-cream py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center gap-2 text-sm text-brown-dark/60 mb-6 font-body">
                    <Link to="/" className="hover:text-brown-dark transition-colors">Home</Link>
                    <ChevronRight size={14} />
                    <span className="text-brown-dark font-medium">Privacy Policy</span>
                </div>

                <div className="glass-card p-8 md:p-12">
                    <div className="text-center mb-10">
                        <span className="badge-gold mb-3 inline-block">🔒 Privacy</span>
                        <h1 className="section-title mb-3">Privacy Policy</h1>
                        <p className="section-subtitle">Your privacy is important to us</p>
                    </div>

                    <div className="space-y-8 text-brown-dark/80 font-body leading-relaxed">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Database className="text-gold-dark" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-brown-dark mb-2">Information We Collect</h2>
                                <p>We collect information that you provide when placing an order, creating an account, or contacting us. This includes your name, email address, phone number, delivery address, and payment information.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Eye className="text-gold-dark" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-brown-dark mb-2">How We Use Your Information</h2>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>To process and deliver your orders</li>
                                    <li>To communicate about your orders and inquiries</li>
                                    <li>To improve our products and services</li>
                                    <li>To send promotional offers (with your consent)</li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Lock className="text-gold-dark" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-brown-dark mb-2">Data Security</h2>
                                <p>We implement industry-standard security measures to protect your personal information. Your data is stored securely and never shared with unauthorized third parties.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Shield className="text-gold-dark" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-brown-dark mb-2">Your Rights</h2>
                                <p>You can request access to, correction of, or deletion of your personal data at any time. To exercise these rights, please contact us at info@potterscentral.com.</p>
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

export default PrivacyPolicy
