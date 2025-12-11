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
    <section className="bg-white rounded-lg shadow-lg p-8 mb-8">
      <h2 className="text-3xl font-bold mb-6 text-brown-dark text-center">
        Meet Our Master Artisans
      </h2>
      <p className="text-center text-brown-dark/70 mb-8 max-w-2xl mx-auto">
        Each piece of pottery tells a story of skill, dedication, and tradition.
        Meet the talented artisans who bring these beautiful creations to life.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {artisans.map((artisan) => (
          <div
            key={artisan.id}
            className="border-2 border-brown-light rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="w-20 h-20 bg-brown-light rounded-full mx-auto mb-4 flex items-center justify-center">
              <span className="text-4xl">👨‍🎨</span>
            </div>
            <h3 className="text-xl font-bold text-center mb-2 text-brown-dark">
              {artisan.name}
            </h3>
            <p className="text-center text-brown-dark/60 mb-3 font-medium">
              {artisan.experience} of experience
            </p>
            <p className="text-center text-purple font-semibold mb-3">
              {artisan.specialty}
            </p>
            <p className="text-brown-dark/70 text-sm mb-4 text-center">
              {artisan.description}
            </p>
            <div className="border-t border-brown-light pt-4">
              <h4 className="font-semibold text-brown-dark mb-2 text-sm">
                Achievements:
              </h4>
              <ul className="space-y-1">
                {artisan.achievements.map((achievement, idx) => (
                  <li
                    key={idx}
                    className="text-xs text-brown-dark/60 flex items-start gap-2"
                  >
                    <span className="text-purple mt-1">•</span>
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

