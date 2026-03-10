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
                    <div className="w-24 h-24 rounded-full bg-sand flex items-center justify-center mx-auto mb-6">
                        <User size={40} className="text-brown-dark stroke-[1.5]" />
                    </div>
                    <h1 className="text-2xl font-display font-bold text-brown-dark mb-1">Welcome to PottersCentral</h1>
                    <p className="text-brown-dark/60 font-body">Manage your account and orders</p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    {[
                        { icon: ShoppingBag, label: 'Cart Items', value: cart.length },
                        { icon: Heart, label: 'Wishlist', value: wishlist.length },
                        { icon: Package, label: 'Orders', value: 0 },
                        { icon: Clock, label: 'Pending', value: 0 },
                    ].map(({ icon: Icon, label, value }, idx) => (
                        <div key={idx} className="glass-card p-6 text-center group cursor-default hover:border-cream">
                            <div className={`w-14 h-14 bg-sand rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform`}>
                                <Icon className="text-brown-dark stroke-[1.5]" size={24} />
                            </div>
                            <p className="text-3xl font-display font-medium text-brown-dark tracking-tight mb-1">{value}</p>
                            <p className="text-xs text-brown-light uppercase tracking-widest font-medium">{label}</p>
                        </div>
                    ))}
                </div>

                {/* Quick Links */}
                <div className="space-y-4">
                    <Link to="/cart" className="glass-card p-6 flex items-center justify-between group hover:-translate-y-1 transition-all">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-sand rounded-xl flex items-center justify-center">
                                <ShoppingBag size={22} className="text-brown-dark stroke-[1.5]" />
                            </div>
                            <div>
                                <p className="font-display font-medium text-brown-dark text-lg tracking-tight">Shopping Cart</p>
                                <p className="text-sm text-brown-light font-light mt-1">{cart.length} items in cart</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-brown-light group-hover:text-terracotta transition-colors" />
                    </Link>

                    <Link to="/wishlist" className="glass-card p-6 flex items-center justify-between group hover:-translate-y-1 transition-all">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-sand rounded-xl flex items-center justify-center">
                                <Heart size={22} className="text-brown-dark stroke-[1.5]" />
                            </div>
                            <div>
                                <p className="font-display font-medium text-brown-dark text-lg tracking-tight">Wishlist</p>
                                <p className="text-sm text-brown-light font-light mt-1">{wishlist.length} saved items</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-brown-light group-hover:text-terracotta transition-colors" />
                    </Link>

                    <Link to="/request-product" className="glass-card p-6 flex items-center justify-between group hover:-translate-y-1 transition-all">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-sand rounded-xl flex items-center justify-center">
                                <Package size={22} className="text-brown-dark stroke-[1.5]" />
                            </div>
                            <div>
                                <p className="font-display font-medium text-brown-dark text-lg tracking-tight">Request Custom Product</p>
                                <p className="text-sm text-brown-light font-light mt-1">Get a custom pottery piece made</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-brown-light group-hover:text-terracotta transition-colors" />
                    </Link>

                    <Link to="/contact" className="glass-card p-6 flex items-center justify-between group hover:-translate-y-1 transition-all">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-sand rounded-xl flex items-center justify-center">
                                <MapPin size={22} className="text-brown-dark stroke-[1.5]" />
                            </div>
                            <div>
                                <p className="font-display font-medium text-brown-dark text-lg tracking-tight">Contact Us</p>
                                <p className="text-sm text-brown-light font-light mt-1">Get in touch with our team</p>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-brown-light group-hover:text-terracotta transition-colors" />
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Profile
