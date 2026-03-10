const ArtisanProfiles = () => {
  const artisans = [
    {
      id: 1,
      name: 'Master Ram Kumar',
      experience: '30+ years',
      specialty: 'Traditional Terracotta',
      description:
        'Specializes in traditional terracotta pottery and decorative items. His work has been featured in several cultural exhibitions. Master Ram Kumar learned the craft from his father and has been perfecting it for over three decades.',
      achievements: [
        'Featured in National Crafts Exhibition 2019',
        'Awarded Best Artisan by State Government',
        'Mentored 50+ young potters',
      ],
    },
    {
      id: 2,
      name: 'Artisan Priya Sharma',
      experience: '20+ years',
      specialty: 'Glazed Ceramics',
      description:
        'Expert in glazed ceramics and modern designs. Known for her innovative approach while maintaining traditional techniques. Priya combines contemporary aesthetics with age-old pottery methods.',
      achievements: [
        'Innovation Award in Pottery Design 2020',
        'Featured in Design Week Magazine',
        'Created 200+ unique designs',
      ],
    },
    {
      id: 3,
      name: 'Craftsman Suresh Yadav',
      experience: '25+ years',
      specialty: 'Functional Pottery',
      description:
        'Master of functional pottery including mugs, plates, and bowls. His products are known for their durability and beauty. Suresh focuses on creating everyday items that combine utility with elegance.',
      achievements: [
        'Best Functional Pottery Award 2021',
        'Supplied to 100+ restaurants',
        'Exported products to 5 countries',
      ],
    },
    {
      id: 4,
      name: 'Artist Meera Devi',
      experience: '15+ years',
      specialty: 'Decorative Vases',
      description:
        'Specializes in decorative vases and planters. Her intricate designs reflect traditional Indian art forms. Meera brings artistic flair to functional pottery, creating pieces that are both beautiful and useful.',
      achievements: [
        'Art Excellence Award 2022',
        'Featured in Home Decor Exhibitions',
        'Created signature collection series',
      ],
    },
    {
      id: 5,
      name: 'Master Craftsman Ajay Singh',
      experience: '35+ years',
      specialty: 'Traditional Khurja Pottery',
      description:
        'One of the most experienced potters in Khurja, specializing in the traditional blue pottery that the region is famous for. Ajay has preserved ancient techniques while adapting to modern needs.',
      achievements: [
        'Heritage Craftsman Recognition',
        'Documented traditional techniques',
        'Preserved 10+ ancient patterns',
      ],
    },
    {
      id: 6,
      name: 'Artisan Kavita Verma',
      experience: '18+ years',
      specialty: 'Custom Designs',
      description:
        'Expert in creating custom pottery designs based on customer requirements. Kavita excels at translating ideas into beautiful ceramic pieces, making each order unique and special.',
      achievements: [
        'Custom Design Excellence Award',
        'Completed 500+ custom orders',
        'Satisfaction rate: 98%',
      ],
    },
  ]

  return (
    <section className="bg-white border border-sand rounded-xl p-8 md:p-12 mb-12">
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-display font-medium mb-4 text-brown-dark tracking-tight">
          Meet Our Artisans
        </h2>
        <p className="text-brown-light font-light max-w-2xl mx-auto leading-relaxed">
          Each piece of pottery tells a story of skill, dedication, and tradition.
          Meet the talented craftspeople who bring these beautiful creations to life.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artisans.map((artisan) => (
          <div
            key={artisan.id}
            className="border border-sand rounded-xl p-8 hover:border-cream transition-colors bg-white group flex flex-col"
          >
            <div className="w-20 h-20 bg-sand rounded-full mx-auto mb-6 flex items-center justify-center grayscale group-hover:grayscale-0 transition-all opacity-50 group-hover:opacity-100">
              <span className="text-3xl">👨‍🎨</span>
            </div>
            <h3 className="text-xl font-display font-medium text-center mb-1 text-brown-dark tracking-tight">
              {artisan.name}
            </h3>
            <p className="text-center text-brown-light font-light text-sm mb-3">
              {artisan.experience} experience
            </p>
            <p className="text-center text-terracotta text-sm uppercase tracking-widest font-medium mb-4">
              {artisan.specialty}
            </p>
            <p className="text-brown-dark font-light text-sm mb-6 text-center leading-relaxed">
              {artisan.description}
            </p>
            <div className="border-t border-sand pt-6 mt-auto">
              <h4 className="font-medium text-brown-dark mb-3 text-sm tracking-wide text-center">
                Achievements
              </h4>
              <ul className="space-y-1">
                {artisan.achievements.map((achievement, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-brown-light font-light flex items-start gap-2 justify-center"
                  >
                    <span className="text-terracotta mt-0.5">•</span>
                    <span>{achievement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default ArtisanProfiles

