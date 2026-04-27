import { useState, useEffect } from 'react'

/**
 * BackToTop Component
 * Floating button that appears when user scrolls down.
 * Provides smooth scroll back to page top.
 * Large, prominent design with cyan branding and glow effect.
 * Higher z-index ensures it's always visible above modals and overlays.
 * 
 * @component
 * @returns {JSX.Element} Rendered back to top button (or null if not scrolled)
 */
function BackToTop() {
  const [isVisible, setIsVisible] = useState(false)

  /**
   * Show button when scrolled down more than 300px
   * Checks scroll position and updates visibility state
   */
  const toggleVisibility = () => {
    if (window.scrollY > 300) {
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }

  /**
   * Smooth scroll to top of page
   * Uses window.scrollTo with smooth behavior for user-friendly animation
   */
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // Add scroll listener on mount, cleanup on unmount to prevent memory leaks
  useEffect(() => {
    window.addEventListener('scroll', toggleVisibility)
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  // Only render if scrolled down past threshold (300px)
  if (!isVisible) {
    return null
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-8 right-8 z-[999] bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white font-bold rounded-full w-20 h-20 flex flex-col items-center justify-center shadow-lg shadow-cyan-500/60 hover:shadow-2xl hover:shadow-cyan-400/80 transition-all hover:scale-110 active:scale-95 cursor-pointer"
      title="Scroll to top"
    >
      <span className="text-lg">↑</span>
      <span className="text-xs font-semibold">TOP</span>
    </button>
  )
}

export default BackToTop