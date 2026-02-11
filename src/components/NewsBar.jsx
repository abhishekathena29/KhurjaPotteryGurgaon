import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const NewsBar = () => {
  const newsItems = [
    '🎉 New Stock Arrived! Check out our latest collection of handcrafted pottery.',
    '🚚 Free delivery on orders above ₹1000 in Gurgaon!',
    '⭐ Special discount: 20% off on all planters this week!',
    '📞 Need custom pottery? Request a product now!',
  ]

  const [currentIndex, setCurrentIndex] = useState(0)

  useState(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % newsItems.length)
    }, 5000)
    return () => clearInterval(interval)
  })

  const nextNews = () => {
    setCurrentIndex((prev) => (prev + 1) % newsItems.length)
  }

  const prevNews = () => {
    setCurrentIndex((prev) => (prev - 1 + newsItems.length) % newsItems.length)
  }

  return (
    <div className="bg-gradient-to-r from-gold-dark via-gold to-gold-dark text-brown-dark py-1.5 px-4 text-xs font-medium">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <button
          onClick={prevNews}
          className="hover:text-brown transition-colors p-1"
          aria-label="Previous news"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 text-center mx-4">
          <p className="animate-fade-in font-body">{newsItems[currentIndex]}</p>
        </div>
        <button
          onClick={nextNews}
          className="hover:text-brown transition-colors p-1"
          aria-label="Next news"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}

export default NewsBar
