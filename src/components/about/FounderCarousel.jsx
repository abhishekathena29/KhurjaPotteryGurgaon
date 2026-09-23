import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react'

const AUTOPLAY_MS = 5000
const SWIPE_THRESHOLD_PX = 40

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const pad = (value) => String(value).padStart(2, '0')

const FounderCarousel = ({ photos, label = 'Photos from the founder\'s story' }) => {
  const [current, setCurrent] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [hasFocus, setHasFocus] = useState(false)
  const [isStopped, setIsStopped] = useState(prefersReducedMotion)
  const touchStartX = useRef(null)
  const count = photos.length
  const isPlaying = !isStopped && !isHovered && !hasFocus && count > 1

  const goTo = (index) => setCurrent((index + count) % count)
  const next = () => goTo(current + 1)
  const prev = () => goTo(current - 1)

  // Restarts on every slide change, so manual navigation gets a full interval too.
  useEffect(() => {
    if (!isPlaying) return undefined
    const timer = setTimeout(() => setCurrent((prevIndex) => (prevIndex + 1) % count), AUTOPLAY_MS)
    return () => clearTimeout(timer)
  }, [current, isPlaying, count])

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      next()
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault()
      prev()
    }
  }

  const handleTouchEnd = (event) => {
    if (touchStartX.current === null) return
    const deltaX = event.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return
    if (deltaX < 0) next()
    else prev()
  }

  if (count === 0) return null
  const active = photos[current]

  return (
    <section
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={handleKeyDown}
      onFocus={() => setHasFocus(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false)
      }}
    >
      <div
        className="relative aspect-video lg:aspect-[4/3] overflow-hidden rounded-xl bg-sand border border-sand"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={(event) => { touchStartX.current = event.touches[0].clientX }}
        onTouchEnd={handleTouchEnd}
      >
        {photos.map((photo, index) => (
          <div
            key={photo.src}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${count}`}
            aria-hidden={index !== current}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === current ? 'opacity-100' : 'opacity-0'}`}
          >
            <img
              src={photo.src}
              alt={photo.alt}
              loading={index === 0 ? 'eager' : 'lazy'}
              decoding="async"
              className={`w-full h-full object-cover motion-safe:transition-transform motion-safe:duration-[6000ms] ease-linear ${index === current ? 'motion-safe:scale-105' : 'scale-100'}`}
              style={{ objectPosition: photo.position }}
            />
          </div>
        ))}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-brown-dark/40 to-transparent pointer-events-none" />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white text-brown-dark hover:bg-sand p-3 rounded-full transition-all shadow-sm"
              aria-label="Previous photo"
            >
              <ChevronLeft size={20} className="stroke-[1.5]" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white text-brown-dark hover:bg-sand p-3 rounded-full transition-all shadow-sm"
              aria-label="Next photo"
            >
              <ChevronRight size={20} className="stroke-[1.5]" />
            </button>
          </>
        )}

        <span className="absolute bottom-4 right-5 font-display text-sm text-white tracking-wide tabular-nums">
          {pad(current + 1)} <span className="text-white/60">/ {pad(count)}</span>
        </span>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-6">
        <p
          className="text-sm text-brown-light font-light leading-relaxed sm:min-h-[2.5rem]"
          aria-live={isPlaying ? 'off' : 'polite'}
        >
          {active.caption}
        </p>

        {count > 1 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {photos.map((photo, index) => (
              <button
                key={photo.src}
                type="button"
                onClick={() => goTo(index)}
                className="py-3 px-0.5 group"
                aria-label={`Show photo ${index + 1}`}
                aria-current={index === current}
              >
                <span
                  className={`block h-[2px] rounded transition-all duration-300 ${index === current ? 'w-8 bg-brown-dark' : 'w-4 bg-brown-dark/20 group-hover:bg-brown-dark/50'}`}
                />
              </button>
            ))}
            <button
              type="button"
              onClick={() => setIsStopped((stopped) => !stopped)}
              className="ml-2 p-2 rounded-full border border-sand text-brown-dark hover:bg-sand transition-colors"
              aria-label={isStopped ? 'Play slideshow' : 'Pause slideshow'}
            >
              {isStopped ? <Play size={14} className="stroke-[1.5]" /> : <Pause size={14} className="stroke-[1.5]" />}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}

export default FounderCarousel
