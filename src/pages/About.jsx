import StorySection from '../components/about/StorySection'
import MissionVision from '../components/about/MissionVision'
import ProcessSection from '../components/about/ProcessSection'
import TestimonialsSection from '../components/about/TestimonialsSection'
import ContactCTA from '../components/about/ContactCTA'

const About = () => {
  return (
    <div className="min-h-screen bg-cream">
      {/* Founder's story: photo carousel and chapters */}
      <StorySection />

      <div className="max-w-7xl mx-auto px-4 pt-16 md:pt-24 pb-12 border-t border-sand">
        <div className="text-center mb-16">
          <span className="text-terracotta tracking-widest uppercase text-xs font-semibold mb-3 inline-block">The Platform</span>
          <h2 className="text-3xl md:text-5xl font-display font-medium mb-4 text-brown-dark tracking-tight">
            Built for the Potters
          </h2>
          <p className="text-lg text-brown-light font-light max-w-2xl mx-auto leading-relaxed">
            What began as one Sunday conversation is now a shopfront for
            Khurja's potters. Here is what guides it.
          </p>
        </div>

        {/* Mission, Vision, Values */}
        <MissionVision />

        {/* Process Section */}
        <ProcessSection />

        {/* Testimonials */}
        <TestimonialsSection />

        {/* Contact CTA */}
        <ContactCTA />
      </div>
    </div>
  )
}

export default About
