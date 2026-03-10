import { Target, Eye, Heart } from 'lucide-react'

const MissionVision = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 max-w-5xl mx-auto">
      {/* Mission */}
      <div className="bg-white border border-sand rounded-xl p-8 hover:border-cream transition-colors">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-sand rounded-full flex items-center justify-center">
            <Target className="text-brown-dark stroke-[1.5]" size={24} />
          </div>
          <h3 className="text-xl font-display font-medium text-brown-dark tracking-tight">Our Mission</h3>
        </div>
        <p className="text-brown-light font-light leading-relaxed text-sm">
          To preserve and promote traditional Indian pottery while empowering
          local artisans and bringing authentic handcrafted ceramics to
          customers across India. We strive to create sustainable livelihoods
          for potters while keeping age-old traditions alive.
        </p>
      </div>

      {/* Vision */}
      <div className="bg-white border border-sand rounded-xl p-8 hover:border-cream transition-colors">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-sand rounded-full flex items-center justify-center">
            <Eye className="text-brown-dark stroke-[1.5]" size={24} />
          </div>
          <h3 className="text-xl font-display font-medium text-brown-dark tracking-tight">Our Vision</h3>
        </div>
        <p className="text-brown-light font-light leading-relaxed text-sm">
          To become India's most trusted platform for authentic handcrafted
          pottery, where every purchase supports local artisans and preserves
          traditional craftsmanship for future generations. We envision a
          world where traditional arts thrive alongside modern commerce.
        </p>
      </div>

      {/* Values */}
      <div className="md:col-span-2 bg-white border border-sand rounded-xl p-8 md:p-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-sand rounded-full flex items-center justify-center">
            <Heart className="text-brown-dark stroke-[1.5]" size={24} />
          </div>
          <h3 className="text-xl font-display font-medium text-brown-dark tracking-tight">Our Values</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h4 className="font-medium text-brown-dark mb-3 text-sm tracking-wide">Authenticity</h4>
            <p className="text-sm text-brown-light font-light leading-relaxed">
              Every product is genuinely handcrafted using traditional methods
              passed down through generations.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-brown-dark mb-3 text-sm tracking-wide">Fair Trade</h4>
            <p className="text-sm text-brown-light font-light leading-relaxed">
              We ensure fair compensation for artisans, directly supporting
              their families and communities.
            </p>
          </div>
          <div>
            <h4 className="font-medium text-brown-dark mb-3 text-sm tracking-wide">Quality</h4>
            <p className="text-sm text-brown-light font-light leading-relaxed">
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

