import { useState, useRef, useEffect } from 'react'
import { Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchSearchPreview } from '../api/tmdb'
import useDebounce from '../hooks/useDebounce'

const IMG_BASE = 'https://image.tmdb.org/t/p/w92'

/**
 * Category definitions - distinct browsing experiences with no overlap
 * Each category provides unique content discovery not achievable via sort/filter
 * Must match categories defined in Home.jsx for proper highlighting
 * @constant {Array<Object>}
 */
const CATEGORIES = [
  { label: 'All Movies', value: 'all', description: 'Browse entire movie database sorted by popularity' },
  { label: 'In Theaters', value: 'now_playing', description: 'Now playing in cinemas' },
  { label: 'Coming Soon', value: 'upcoming', description: 'Upcoming releases' },
  { label: 'Award Winners', value: 'top_rated', description: 'Critically acclaimed' },
]

/**
 * Navbar Component
 * Top navigation bar — present on all pages.
 * Contains: logo on left, centered search with preview dropdown, and category filters on right (home only).
 * Focused on clean UI/UX with responsive design and smooth interactions.
 * Category highlighting syncs with URL params for accurate active state.
 * All category buttons branded with cyan/orange gradients and glowing shadows.
 * 
 * @component
 * @returns {JSX.Element} Rendered navigation bar
 */
function Navbar() {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const isHome = location.pathname === '/'
  const category = searchParams.get('category') ?? 'all'

  const [input, setInput] = useState(searchParams.get('query') ?? '')
  const [showPreview, setShowPreview] = useState(false)
  const debouncedInput = useDebounce(input, 300)
  const wrapperRef = useRef(null)

  // Fetch preview results when debounced input changes
  const { data: previewData } = useQuery({
    queryKey: ['preview', debouncedInput],
    queryFn: () => fetchSearchPreview(debouncedInput),
    enabled: debouncedInput.length > 1,
  })

  const previewResults = previewData?.results?.filter(m => m.poster_path).slice(0, 5) ?? []

  /**
   * Close dropdown when clicking outside the navbar
   */
  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowPreview(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  /**
   * Handle search form submission
   * Navigates to home if not already there, updates URL with search query
   */
  function handleSearch(e) {
    e.preventDefault()
    setShowPreview(false)
    if (!isHome) navigate('/')
    setSearchParams(input ? { query: input } : {})
  }

  /**
   * Update category and clear search/filters
   * Sets URL param to trigger category change in Home component
   * @param {string} value - Category value (all, now_playing, upcoming, top_rated)
   */
  function setCategory(value) {
    setInput('')
    setSearchParams({ category: value })
  }

  /**
   * Navigate to movie detail from preview dropdown
   * @param {number} movieId - TMDB movie ID
   */
  function handlePreviewClick(movieId) {
    setShowPreview(false)
    setInput('')
    navigate('/movie/' + movieId)
  }

  return (
    <nav className="w-full bg-gray-950 border-b border-cyan-500/30 px-8 py-4 sticky top-0 z-50 shadow-lg shadow-cyan-500/10">
      <div className="flex items-center gap-6 justify-between">
        
        {/* Logo - left side, clickable to reset home */}
        <Link
          to="/"
          onClick={() => { setSearchParams({}); setInput('') }}
          className="text-cyan-400 font-bold text-xl tracking-tight hover:text-cyan-300 transition-colors flex-shrink-0 drop-shadow-lg whitespace-nowrap"
        >
          🎬 Movie Browser
        </Link>

        {/* Search form - centered, taking up remaining space */}
        <form onSubmit={handleSearch} className="flex-grow flex justify-center px-4 max-w-5xl" ref={wrapperRef}>
          <div className="relative w-full">
            {/* Search input field */}
            <input
              type="text"
              value={input}
              onChange={e => {
                setInput(e.target.value)
                if (e.target.value.length > 0) setShowPreview(true)
              }}
              onFocus={() => input.length > 0 && setShowPreview(true)}
              onBlur={() => setTimeout(() => setShowPreview(false), 200)}
              placeholder="Search movies..."
              className="w-full bg-gray-800 text-white placeholder-gray-500 rounded-lg px-5 py-3 outline-none focus:ring-2 focus:ring-cyan-400 focus:bg-gray-700 transition-all shadow-lg"
            />
            
            {/* Preview dropdown - shows first 5 matching movies */}
            {showPreview && debouncedInput.length > 0 && previewResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-gray-800 rounded-lg shadow-xl z-10 overflow-hidden border border-cyan-500/50">
                {/* Preview result items */}
                {previewResults.map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handlePreviewClick(m.id)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-700 hover:border-l-2 hover:border-l-cyan-400 transition-colors text-left border-b border-gray-700 last:border-b-0"
                  >
                    {m.poster_path && (
                      <img src={IMG_BASE + m.poster_path} alt="" className="w-8 h-12 object-cover rounded ring-1 ring-cyan-500/50" />
                    )}
                    <div className="flex flex-col min-w-0 flex-grow">
                      <span className="text-white text-sm font-medium truncate">{m.title}</span>
                      <span className="text-gray-400 text-xs">{m.release_date ? m.release_date.slice(0, 4) : 'N/A'}</span>
                    </div>
                  </button>
                ))}

                {/* View all results link */}
                <button
                  type="button"
                  onClick={() => handleSearch({ preventDefault: () => {} })}
                  className="w-full px-4 py-3 text-cyan-400 hover:text-cyan-300 font-medium text-sm transition-colors hover:bg-gray-700/50"
                >
                  View all results →
                </button>
              </div>
            )}
          </div>
        </form>

        {/* Category buttons - right side (only show on home page) */}
        {isHome && (
          <div className="flex gap-2 flex-shrink-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`px-3 py-2 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  category === cat.value
                    ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-gray-950 shadow-lg shadow-cyan-500/60 hover:shadow-xl hover:shadow-cyan-400/80 hover:scale-105 active:scale-95 ring-2 ring-cyan-300'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors shadow-md'
                }`}
                title={cat.description}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar