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
    <section className="bg-gradient-to-br from-brown-light/30 to-purple/10 rounded-lg shadow-lg p-8 mb-8">
      <h2 className="text-3xl font-bold mb-6 text-brown-dark text-center">
        Our Impact
      </h2>
      <p className="text-center text-brown-dark/70 mb-8 max-w-2xl mx-auto">
        Since our inception, we've been making a meaningful difference in the
        lives of artisans and customers alike.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div
            key={idx}
            className="bg-white rounded-lg p-6 text-center shadow-md hover:shadow-lg transition-shadow"
          >
            <div className="w-16 h-16 bg-purple/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <stat.icon className="text-purple" size={32} />
            </div>
            <div className="text-4xl font-bold text-brown-dark mb-2">
              {stat.number}
            </div>
            <div className="font-semibold text-brown-dark mb-2">
              {stat.label}
            </div>
            <div className="text-sm text-brown-dark/60">{stat.description}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ImpactSection

