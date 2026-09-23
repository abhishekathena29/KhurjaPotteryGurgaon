import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import FounderCarousel from './FounderCarousel'
import {
  aboutFounder,
  arrival,
  firstConversation,
  founder,
  founderCarouselPhotos,
} from '../../data/founderStory'

const ChapterHeading = ({ number, title }) => (
  <div>
    <span className="block font-display text-6xl md:text-7xl font-medium text-gold leading-none mb-4" aria-hidden="true">
      {number}
    </span>
    <span className="text-terracotta tracking-widest uppercase text-xs font-semibold mb-3 inline-block">
      Chapter {number}
    </span>
    <h2 className="text-3xl md:text-4xl font-display font-medium text-brown-dark tracking-tight leading-tight">
      {title}
    </h2>
  </div>
)

const StorySection = () => {
  const [arrivalLead, ...arrivalRest] = arrival.paragraphs

  return (
    <>
      {/* About the founder, beside the photo carousel */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-7 lg:sticky lg:top-36">
              <FounderCarousel photos={founderCarouselPhotos} />
            </div>
            <div className="lg:col-span-5 lg:pt-2">
              <span className="text-terracotta tracking-widest uppercase text-xs font-semibold mb-3 inline-block">
                {aboutFounder.eyebrow}
              </span>
              <h1 className="text-4xl md:text-5xl font-display font-medium text-brown-dark tracking-tight mb-5">
                {aboutFounder.greeting}
              </h1>
              <p className="text-xl md:text-2xl font-display italic text-brown-dark/80 leading-snug mb-8">
                {aboutFounder.opening}
              </p>
              <div className="space-y-5 text-brown-light font-light leading-relaxed">
                {aboutFounder.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </div>
              <p className="mt-8 border-l-2 border-terracotta pl-5 text-brown-dark leading-relaxed">
                {aboutFounder.thesis}
              </p>
              <p className="mt-8 font-display italic text-xl text-brown-dark">
                {aboutFounder.closing}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 01: First Conversation */}
      <section className="bg-white border-y border-sand py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-36">
              <ChapterHeading number={firstConversation.number} title={firstConversation.title} />
              <dl className="mt-10 grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-1 gap-6">
                {firstConversation.facts.map((fact) => (
                  <div key={fact.label} className="flex flex-col-reverse border-t border-sand pt-4">
                    <dt className="text-xs text-brown-light font-light mt-1">{fact.label}</dt>
                    <dd className="font-display text-2xl font-medium text-brown-dark tracking-tight">
                      {fact.value}
                      {fact.unit && <span className="text-sm font-body text-brown-light ml-1.5">{fact.unit}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="lg:col-span-8 max-w-2xl">
              <p className="text-2xl md:text-3xl font-display text-brown-dark leading-snug tracking-tight mb-8">
                {firstConversation.lead}
              </p>
              <div className="space-y-5 text-brown-light font-light leading-relaxed md:text-lg">
                {firstConversation.paragraphs.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </div>
              <p className="my-10 md:my-12 py-8 border-y border-sand font-display text-2xl md:text-3xl text-brown-dark leading-snug tracking-tight">
                <span className="block w-10 h-[2px] bg-terracotta mb-6" aria-hidden="true" />
                {firstConversation.pullQuote}
              </p>
              <p className="font-display italic text-xl md:text-2xl text-terracotta">
                {firstConversation.transition}
              </p>
              {firstConversation.question && (
                <p className="mt-4 font-display text-3xl md:text-4xl font-medium text-brown-dark leading-tight tracking-tight">
                  {firstConversation.question}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Chapter 02: Arrival of Contemporary Technology & Traditional Art */}
      <section className="py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-36">
              <ChapterHeading number={arrival.number} title={arrival.title} />
            </div>

            <div className="lg:col-span-8 max-w-2xl">
              <p className="text-2xl md:text-3xl font-display text-brown-dark leading-snug tracking-tight mb-8">
                {arrivalLead}
              </p>
              <div className="space-y-5 text-brown-light font-light leading-relaxed md:text-lg">
                {arrivalRest.map((paragraph) => (
                  <p key={paragraph.slice(0, 32)}>{paragraph}</p>
                ))}
              </div>

              <div className="mt-12 pt-8 border-t border-sand flex flex-col sm:flex-row sm:items-end sm:justify-between gap-8">
                <div>
                  <p className="font-display italic text-3xl md:text-4xl text-brown-dark">{founder.name}</p>
                  <p className="text-xs uppercase tracking-widest text-brown-light mt-2">{founder.role}</p>
                </div>
                <Link
                  to="/products/All products"
                  className="inline-flex items-center gap-2 border-b border-brown-dark pb-1 font-medium text-brown-dark hover:text-terracotta hover:border-terracotta transition-colors self-start sm:self-auto"
                >
                  See the potters' work <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}

export default StorySection
