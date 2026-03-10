import { Users, DollarSign, Award, Heart } from 'lucide-react'

const ImpactSection = () => {
  const stats = [
    {
      icon: Users,
      number: '50+',
      label: 'Artisans Supported',
      description: 'Directly supporting potters and their families',
    },
    {
      icon: DollarSign,
      number: '₹2M+',
      label: 'Revenue Generated',
      description: 'Helping artisans earn fair wages',
    },
    {
      icon: Award,
      number: '5000+',
      label: 'Products Sold',
      description: 'Happy customers across India',
    },
    {
      icon: Heart,
      number: '98%',
      label: 'Satisfaction Rate',
      description: 'Customers love our handcrafted products',
    },
  ]

  return (
    <section className="bg-cream rounded-xl p-8 md:p-12 mb-12 border border-sand">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-display font-medium mb-4 text-brown-dark tracking-tight">
          Our Impact
        </h2>
        <p className="text-brown-light font-light max-w-2xl mx-auto leading-relaxed">
          Since our inception, we've been making a meaningful difference in the
          lives of artisans and our community.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl p-8 text-center border border-sand hover:border-cream transition-colors group"
          >
            <div className="w-16 h-16 bg-sand rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
              <stat.icon className="text-brown-dark stroke-[1.5]" size={28} />
            </div>
            <div className="text-3xl font-display font-medium text-brown-dark mb-2 tracking-tight">
              {stat.number}
            </div>
            <div className="text-xs uppercase tracking-widest font-medium text-brown-dark mb-3">
              {stat.label}
            </div>
            <div className="text-xs text-brown-light font-light leading-relaxed">{stat.description}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ImpactSection

