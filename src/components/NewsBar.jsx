import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const NewsBar = () => {
  const newsItems = [
    '🎉 New Stock Arrived! Check out our latest collection of handcrafted pottery.',
    '🚚 Free delivery on orders above ₹1000 in Gurgaon!',
    '⭐ Special discount: 20% off on all planters this week!',
    '📞 Need custom pottery? Request a product now!',
  ]

  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % newsItems.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [newsItems.length])

  const nextNews = () => {
    setCurrentIndex((prev) => (prev + 1) % newsItems.length)
  }

  const prevNews = () => {
    setCurrentIndex((prev) => (prev - 1 + newsItems.length) % newsItems.length)
  }

  return (
    <div className="bg-brown-dark text-cream py-2 px-4 text-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <button
          onClick={prevNews}
          className="hover:text-purple-light transition-colors"
          aria-label="Previous news"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 text-center mx-4">
          <p className="animate-fade-in">{newsItems[currentIndex]}</p>
        </div>
        <button
          onClick={nextNews}
          className="hover:text-purple-light transition-colors"
          aria-label="Next news"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  )
}

export default NewsBar

