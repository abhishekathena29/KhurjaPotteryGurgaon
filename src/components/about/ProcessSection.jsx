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
    <section className="bg-white rounded-lg shadow-lg p-8 mb-8">
      <h2 className="text-3xl font-bold mb-6 text-brown-dark text-center">
        How We Work
      </h2>
      <p className="text-center text-brown-dark/70 mb-8 max-w-2xl mx-auto">
        Our process ensures that you receive authentic, high-quality pottery
        while supporting local artisans fairly.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((step, idx) => (
          <div key={idx} className="text-center">
            <div className="w-20 h-20 bg-brown-light rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <step.icon className="text-brown-dark" size={32} />
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple rounded-full flex items-center justify-center text-white font-bold text-sm">
                {idx + 1}
              </div>
            </div>
            <h3 className="font-bold text-brown-dark mb-2">{step.title}</h3>
            <p className="text-sm text-brown-dark/70">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ProcessSection

