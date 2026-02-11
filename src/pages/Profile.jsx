import { Link } from 'react-router-dom'
import { User, ShoppingBag, Heart, MapPin, ChevronRight, Package, Clock } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { useWishlist } from '../context/WishlistContext'

const Profile = () => {
    const { cart } = useCart()
    const { wishlist } = useWishlist()

    return (
        <div className="min-h-screen bg-cream py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="flex items-center gap-2 text-sm text-brown-dark/60 mb-6 font-body">
                    <Link to="/" className="hover:text-brown-dark transition-colors">Home</Link>
                    <ChevronRight size={14} />
                    <span className="text-brown-dark font-medium">My Account</span>
                </div>

                {/* Profile Header */}
                <div className="glass-card p-8 mb-6 text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gold/30 to-brown-light/30 flex items-center justify-center mx-auto mb-4">
                        <User size={40} className="text-brown-dark" />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-brown-dark mb-1">Welcome to PottersCentral</h1>
                    <p className="text-brown-dark/60 font-body">Manage your account and orders</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { icon: ShoppingBag, label: 'Cart Items', value: cart.length, color: 'from-gold/20 to-gold/5' },
                        { icon: Heart, label: 'Wishlist', value: wishlist.length, color: 'from-purple/20 to-purple/5' },
                        { icon: Package, label: 'Orders', value: 0, color: 'from-terracotta/20 to-terracotta/5' },
                        { icon: Clock, label: 'Pending', value: 0, color: 'from-brown-light/30 to-brown-light/10' },
                    ].map(({ icon: Icon, label, value, color }, idx) => (
                        <div key={idx} className="glass-card p-5 text-center">
                            <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mx-auto mb-3`}>
                                <Icon className="text-brown-dark" size={22} />
                            </div>
                            <p className="text-2xl font-bold text-brown-dark font-display">{value}</p>
                            <p className="text-xs text-brown-dark/50 font-body">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Quick Links */}
                <div className="space-y-3">
                    <Link to="/cart" className="glass-card p-5 flex items-center justify-between group hover:-translate-y-0.5 transition-all">
                        <div className="flex items-center gap-4">
                            <ShoppingBag size={22} className="text-gold-dark" />
                            <div>
                                <p className="font-display font-semibold text-brown-dark">Shopping Cart</p>
                                <p className="text-xs text-brown-dark/50 font-body">{cart.length} items in cart</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-brown-dark/30 group-hover:text-gold-dark transition-colors" />
                    </Link>

                    <Link to="/wishlist" className="glass-card p-5 flex items-center justify-between group hover:-translate-y-0.5 transition-all">
                        <div className="flex items-center gap-4">
                            <Heart size={22} className="text-purple" />
                            <div>
                                <p className="font-display font-semibold text-brown-dark">Wishlist</p>
                                <p className="text-xs text-brown-dark/50 font-body">{wishlist.length} saved items</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-brown-dark/30 group-hover:text-gold-dark transition-colors" />
                    </Link>

                    <Link to="/request-product" className="glass-card p-5 flex items-center justify-between group hover:-translate-y-0.5 transition-all">
                        <div className="flex items-center gap-4">
                            <Package size={22} className="text-terracotta" />
                            <div>
                                <p className="font-display font-semibold text-brown-dark">Request Custom Product</p>
                                <p className="text-xs text-brown-dark/50 font-body">Get a custom pottery piece made</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-brown-dark/30 group-hover:text-gold-dark transition-colors" />
                    </Link>

                    <Link to="/contact" className="glass-card p-5 flex items-center justify-between group hover:-translate-y-0.5 transition-all">
                        <div className="flex items-center gap-4">
                            <MapPin size={22} className="text-brown" />
                            <div>
                                <p className="font-display font-semibold text-brown-dark">Contact Us</p>
                                <p className="text-xs text-brown-dark/50 font-body">Get in touch with our team</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-brown-dark/30 group-hover:text-gold-dark transition-colors" />
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Profile
