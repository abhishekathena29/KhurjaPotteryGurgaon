import { Target, Eye, Heart } from 'lucide-react'

const MissionVision = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* Mission */}
      <div className="bg-purple/10 rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-purple rounded-full flex items-center justify-center">
            <Target className="text-white" size={24} />
          </div>
          <h3 className="text-2xl font-bold text-brown-dark">Our Mission</h3>
        </div>
        <p className="text-brown-dark/80">
          To preserve and promote traditional Indian pottery while empowering
          local artisans and bringing authentic handcrafted ceramics to
          customers across India. We strive to create sustainable livelihoods
          for potters while keeping age-old traditions alive.
        </p>
      </div>

      {/* Vision */}
      <div className="bg-brown-light/30 rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-brown rounded-full flex items-center justify-center">
            <Eye className="text-white" size={24} />
          </div>
          <h3 className="text-2xl font-bold text-brown-dark">Our Vision</h3>
        </div>
        <p className="text-brown-dark/80">
          To become India's most trusted platform for authentic handcrafted
          pottery, where every purchase supports local artisans and preserves
          traditional craftsmanship for future generations. We envision a
          world where traditional arts thrive alongside modern commerce.
        </p>
      </div>

      {/* Values */}
      <div className="md:col-span-2 bg-cream rounded-lg shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-brown-dark rounded-full flex items-center justify-center">
            <Heart className="text-white" size={24} />
          </div>
          <h3 className="text-2xl font-bold text-brown-dark">Our Values</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-semibold text-brown-dark mb-2">Authenticity</h4>
            <p className="text-sm text-brown-dark/70">
              Every product is genuinely handcrafted using traditional methods
              passed down through generations.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-brown-dark mb-2">Fair Trade</h4>
            <p className="text-sm text-brown-dark/70">
              We ensure fair compensation for artisans, directly supporting
              their families and communities.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-brown-dark mb-2">Quality</h4>
            <p className="text-sm text-brown-dark/70">
              Each piece undergoes quality checks to ensure durability and
              aesthetic excellence.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MissionVision

