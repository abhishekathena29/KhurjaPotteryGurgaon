import StorySection from '../components/about/StorySection'
import MissionVision from '../components/about/MissionVision'
import ArtisanProfiles from '../components/about/ArtisanProfiles'
import ImpactSection from '../components/about/ImpactSection'
import ProcessSection from '../components/about/ProcessSection'
import TestimonialsSection from '../components/about/TestimonialsSection'
import ContactCTA from '../components/about/ContactCTA'

const About = () => {
  return (
    <div className="min-h-screen bg-cream py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <span className="text-terracotta tracking-widest uppercase text-xs font-semibold mb-3 inline-block">Our Story</span>
          <h1 className="text-3xl md:text-5xl font-display font-medium mb-4 text-brown-dark tracking-tight">
            About Potters Central
          </h1>
          <p className="text-lg text-brown-light font-light max-w-2xl mx-auto leading-relaxed">
            Connecting traditional artisans with modern customers, one
            handcrafted piece at a time.
          </p>
        </div>

        {/* Story Section */}
        <StorySection />

        {/* Mission, Vision, Values */}
        <MissionVision />

        {/* Impact Section */}
        <ImpactSection />

        {/* Process Section */}
        <ProcessSection />

        {/* Artisan Profiles */}
        <ArtisanProfiles />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Contact CTA */}
        <ContactCTA />
      </div>
    </div>
  )
}

export default About
