import { useState } from 'react'
import NewsBar from './NewsBar'
import Header from './Header'
import Navigation from './Navigation'
import Footer from './Footer'
import ScrollToTop from './ScrollToTop'

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-cream">
      <NewsBar />
      <Header isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <Navigation isMenuOpen={isMenuOpen} setIsMenuOpen={setIsMenuOpen} />
      <main className="flex-grow w-full">{children}</main>
      <Footer />
      <ScrollToTop />
    </div>
  )
}

export default Layout

