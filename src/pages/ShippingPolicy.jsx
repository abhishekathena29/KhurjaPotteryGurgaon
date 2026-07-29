import { Link } from 'react-router-dom'
import { ChevronRight, Truck, Clock, Shield, MapPin, Package } from 'lucide-react'

const ShippingPolicy = () => {
    return (
        <div className="min-h-screen bg-cream py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center gap-2 text-sm text-brown-dark/60 mb-6 font-body">
                    <Link to="/" className="hover:text-brown-dark transition-colors">Home</Link>
                    <ChevronRight size={14} />
                    <span className="text-brown-dark font-medium">Shipping Policy</span>
                </div>

                <div className="glass-card p-8 md:p-12">
                    <div className="text-center mb-10">
                        <span className="badge-gold mb-3 inline-block">🚚 Shipping</span>
                        <h1 className="section-title mb-3">Shipping Policy</h1>
                        <p className="section-subtitle">Everything you need to know about delivery</p>
                    </div>

                    <div className="space-y-8 text-brown-dark/80 font-body leading-relaxed">
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <MapPin className="text-gold-dark" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-brown-dark mb-2">Delivery Area</h2>
                                <p>Currently, we deliver within Gurgaon (Haryana) and surrounding areas. We are expanding to cover more locations soon. For areas outside our delivery range, pickup is available from our store.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Clock className="text-gold-dark" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-brown-dark mb-2">Delivery Time</h2>
                                <p>Standard delivery takes 2-5 business days within Gurgaon. During festive seasons, delivery may take slightly longer due to increased demand.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Truck className="text-gold-dark" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-brown-dark mb-2">Shipping Charges</h2>
                                <p>Free delivery on orders above ₹1000 within Gurgaon. For orders below ₹1000, a flat delivery fee of ₹50 applies. Delivery is handled through Porter for safe and quick service.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Package className="text-gold-dark" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-brown-dark mb-2">Packaging</h2>
                                <p>All pottery items are carefully wrapped and packed with protective materials to ensure they reach you in perfect condition. Each item is individually wrapped with bubble wrap and packed in sturdy boxes.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center flex-shrink-0">
                                <Shield className="text-gold-dark" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-display font-bold text-brown-dark mb-2">Damage During Transit</h2>
                                <p>In the unlikely event that your item is damaged during transit, please contact us within 24 hours of receiving the order with photos of the damage. We will arrange a replacement at no additional cost.</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-10 p-6 bg-gold/5 rounded-2xl border border-gold/10 text-center">
                        <p className="text-brown-dark/70 font-body">
                            Have questions about shipping? <Link to="/contact" className="text-gold-dark font-semibold hover:text-gold transition-colors">Contact us</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ShippingPolicy
