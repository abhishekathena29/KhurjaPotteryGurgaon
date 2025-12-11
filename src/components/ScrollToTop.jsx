import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowUp } from 'lucide-react'

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false)
  const location = useLocation()

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [location])

  // Show/hide button based on scroll position
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true)
      } else {
        setIsVisible(false)
      }
    }

    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <>
      {isVisible && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-brown hover:bg-brown-dark text-white p-4 rounded-full shadow-lg z-50 transition-all duration-300 hover:scale-110"
          aria-label="Scroll to top"
        >
          <ArrowUp size={24} />
        </button>
      )}
    </>
  )
}

export default ScrollToTop

