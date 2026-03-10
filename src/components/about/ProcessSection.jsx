import { Search, Users, Award, Truck } from 'lucide-react'

const ProcessSection = () => {
  const steps = [
    {
      icon: Search,
      title: 'Discover Artisans',
      description:
        'We identify skilled potters in Khurja who create authentic handcrafted pottery using traditional techniques.',
    },
    {
      icon: Users,
      title: 'Fair Partnership',
      description:
        'We establish fair trade partnerships, ensuring artisans receive proper compensation for their craftsmanship.',
    },
    {
      icon: Award,
      title: 'Quality Assurance',
      description:
        'Each product undergoes quality checks to ensure it meets our standards for durability and beauty.',
    },
    {
      icon: Truck,
      title: 'Direct to You',
      description:
        'Products are carefully packaged and delivered directly to customers, cutting out middlemen.',
    },
  ]

  return (
    <section className="bg-white border border-sand rounded-xl p-8 md:p-12 mb-12">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-display font-medium mb-4 text-brown-dark tracking-tight">
          How We Work
        </h2>
        <p className="text-brown-light font-light max-w-2xl mx-auto leading-relaxed">
          Our process ensures that you receive authentic, high-quality pottery
          while supporting local artisans fairly.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {steps.map((step, idx) => (
          <div key={idx} className="text-center group">
            <div className="w-20 h-20 bg-sand rounded-full flex items-center justify-center mx-auto mb-6 relative group-hover:scale-105 transition-transform">
              <step.icon className="text-brown-dark stroke-[1.5]" size={28} />
              <div className="absolute top-0 right-0 w-6 h-6 bg-white border border-sand rounded-full flex items-center justify-center text-brown-dark font-display font-medium text-xs">
                {idx + 1}
              </div>
            </div>
            <h3 className="font-medium text-brown-dark mb-3 text-sm tracking-wide">{step.title}</h3>
            <p className="text-sm text-brown-light font-light leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ProcessSection

