import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useParams } from 'react-router-dom'
import { fetchMovieDetail, fetchMovieCredits, fetchMovieVideos, fetchSimilarMovies, fetchMovieReviews } from '../api/tmdb'
import Reviews from '../components/Reviews'

const IMG_BASE = 'https://image.tmdb.org/t/p/w500'
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280'

/**
 * Format currency into readable USD string
 * @param {number} amount - Amount in dollars
 * @returns {string} Formatted currency string (e.g., "$1,000,000")
 */
function formatCurrency(amount) {
  if (!amount || amount === 0) return 'N/A'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount)
}

/**
 * Format runtime in minutes to human-readable format
 * @param {number} minutes - Runtime in minutes
 * @returns {string} Formatted string (e.g., "2h 30m")
 */
function formatRuntime(minutes) {
  if (!minutes) return 'N/A'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h + 'h ' + m + 'm'
}

/**
 * MovieDetail Component
 * Full-page movie details view with overview, cast, crew, reviews, embedded trailer, and recommendations.
 * Uses React Router params to get movie ID from URL.
 * Features embedded fullscreen trailer player, modern cast carousel with side arrows, and star-based reviews.
 * Consistent cyan/orange/emerald color scheme throughout.
 * 
 * @component
 * @returns {JSX.Element} Rendered movie detail page
 */
function MovieDetail() {
  const { id } = useParams()
  
  // State to show/hide trailer in separate fullscreen overlay (pristine UX)
  const [showTrailerModal, setShowTrailerModal] = useState(false)

  // Fetch movie details (title, overview, genres, budget, etc.)
  const { data: movie, isLoading: loadingMovie, isError } = useQuery({
    queryKey: ['movie', id],
    queryFn: () => fetchMovieDetail(id),
  })

  // Fetch cast and crew information
  const { data: credits, isLoading: loadingCredits } = useQuery({
    queryKey: ['credits', id],
    queryFn: () => fetchMovieCredits(id),
  })

  // Fetch trailer videos
  const { data: videos } = useQuery({
    queryKey: ['videos', id],
    queryFn: () => fetchMovieVideos(id),
  })

  // Fetch similar/recommended movies
  const { data: similar } = useQuery({
    queryKey: ['similar', id],
    queryFn: () => fetchSimilarMovies(id),
  })

  // Fetch user reviews
  const { data: reviewsData } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => fetchMovieReviews(id),
  })

  /**
   * Handle Escape key press to close trailer modal with proper UX flow
   */
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape' && showTrailerModal) {
        setShowTrailerModal(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [showTrailerModal])

  /**
   * Prevent background scrolling while trailer modal is open
   */
  useEffect(() => {
    if (showTrailerModal) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [showTrailerModal])

  // Show loading state while data is being fetched
  if (loadingMovie || loadingCredits) return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-white text-lg">Loading...</p>
    </main>
  )

  // Show error state if API request failed
  if (isError) return (
    <main className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-red-400">Something went wrong.</p>
    </main>
  )

  // Extract key crew members from credits
  const director = credits?.crew?.find(p => p.job === 'Director')
  const producer = credits?.crew?.find(p => p.job === 'Producer')
  const screenplay = credits?.crew?.find(p => p.job === 'Screenplay')
  
  // Get ALL cast members
  const topCast = credits?.cast ?? []

  // Find YouTube trailer video
  const trailerVideo = videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer')
  
  // Get similar movies with posters, limited to 6
  const similarMovies = similar?.results?.filter(m => m.poster_path).slice(0, 6) ?? []

  /**
   * Scroll cast carousel
   * @param {number} direction - Direction to scroll (-1 left, 1 right)
   */
  const scrollCast = (direction) => {
    const scrollContainer = document.getElementById('cast-scroll')
    if (scrollContainer) {
      const scrollAmount = 250
      scrollContainer.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white">

      {/* Hero backdrop section */}
      <div className="relative w-full h-[50vh] overflow-hidden">
        {movie.backdrop_path ? (
          <img
            src={BACKDROP_BASE + movie.backdrop_path}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gray-800" />
        )}

        {/* Dark gradient overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-gray-950" />

        {/* Back button */}
        <Link
          to="/"
          className="absolute top-6 left-6 text-white bg-gradient-to-r from-cyan-600/40 to-cyan-700/40 hover:from-cyan-500/60 hover:to-cyan-600/60 px-6 py-3 rounded-full text-sm backdrop-blur-sm transition-all font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-xl hover:shadow-cyan-400/50 hover:scale-110 active:scale-95"
        >
          ← Back
        </Link>
      </div>

      {/* Main content area */}
      <div className="w-full px-16 pb-16 -mt-32 relative z-10">
        {/* Poster and title section */}
        <div className="flex flex-col md:flex-row gap-8">

          {/* Poster image */}
          <div className="flex-shrink-0">
            {movie.poster_path ? (
              <img
                src={IMG_BASE + movie.poster_path}
                alt={movie.title}
                className="w-64 rounded-xl shadow-2xl ring-2 ring-cyan-500/50 transition-all hover:ring-cyan-400 hover:shadow-cyan-500/30"
              />
            ) : (
              <div className="w-64 h-96 bg-gray-700 rounded-xl" />
            )}
          </div>

          {/* Title and metadata */}
          <div className="flex flex-col justify-end gap-3 pt-8">
            {movie.tagline && (
              <p className="text-cyan-400 text-sm italic font-medium">{movie.tagline}</p>
            )}
            
            <h1 className="text-4xl font-bold leading-tight">{movie.title}</h1>

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
              <span className="text-emerald-400 font-semibold text-base bg-emerald-400/10 px-3 py-1 rounded-full ring-1 ring-emerald-500/50">
                ⭐ {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'}
              </span>
              <span>{movie.vote_count ? movie.vote_count.toLocaleString() : 0} votes</span>
              <span>·</span>
              <span>{movie.release_date ? movie.release_date.slice(0, 4) : 'N/A'}</span>
              <span>·</span>
              <span>{formatRuntime(movie.runtime)}</span>
              <span>·</span>
              <span className="capitalize">{movie.status}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {movie.genres?.map(genre => (
                <span key={genre.id} className="bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-xs px-3 py-1 rounded-full hover:bg-cyan-500/30 transition-colors">
                  {genre.name}
                </span>
              ))}
            </div>

            {trailerVideo && (
              <button
                onClick={() => setShowTrailerModal(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-gray-950 font-bold px-8 py-4 rounded-full text-base w-fit transition-all mt-2 shadow-lg shadow-cyan-500/60 hover:shadow-2xl hover:shadow-cyan-400/80 hover:scale-110 active:scale-95"
              >
                ▶ Watch Trailer
              </button>
            )}
          </div>
        </div>

        {/* Overview section */}
        <div className="mt-10 border-l-4 border-cyan-500/50 pl-6">
          <h2 className="text-xl font-semibold mb-3 text-cyan-400">Overview</h2>
          <p className="text-gray-300 leading-relaxed w-full">{movie.overview}</p>
        </div>

        {/* Key details grid */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800/50 hover:border-cyan-500/30 transition-colors">
            <p className="text-cyan-400 text-xs uppercase tracking-wider mb-1 font-semibold">Director</p>
            <p className="text-white text-sm">{director ? director.name : 'N/A'}</p>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800/50 hover:border-cyan-500/30 transition-colors">
            <p className="text-cyan-400 text-xs uppercase tracking-wider mb-1 font-semibold">Screenplay</p>
            <p className="text-white text-sm">{screenplay ? screenplay.name : 'N/A'}</p>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800/50 hover:border-cyan-500/30 transition-colors">
            <p className="text-cyan-400 text-xs uppercase tracking-wider mb-1 font-semibold">Producer</p>
            <p className="text-white text-sm">{producer ? producer.name : 'N/A'}</p>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800/50 hover:border-cyan-500/30 transition-colors">
            <p className="text-cyan-400 text-xs uppercase tracking-wider mb-1 font-semibold">Language</p>
            <p className="text-white text-sm">
              {movie.spoken_languages && movie.spoken_languages[0] ? movie.spoken_languages[0].english_name : 'N/A'}
            </p>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800/50 hover:border-cyan-500/30 transition-colors">
            <p className="text-cyan-400 text-xs uppercase tracking-wider mb-1 font-semibold">Budget</p>
            <p className="text-white text-sm">{formatCurrency(movie.budget)}</p>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800/50 hover:border-cyan-500/30 transition-colors">
            <p className="text-cyan-400 text-xs uppercase tracking-wider mb-1 font-semibold">Revenue</p>
            <p className="text-white text-sm">{formatCurrency(movie.revenue)}</p>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800/50 hover:border-cyan-500/30 transition-colors">
            <p className="text-cyan-400 text-xs uppercase tracking-wider mb-1 font-semibold">Production</p>
            <p className="text-white text-sm">
              {movie.production_companies && movie.production_companies[0] ? movie.production_companies[0].name : 'N/A'}
            </p>
          </div>
          <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-800/50 hover:border-cyan-500/30 transition-colors">
            <p className="text-cyan-400 text-xs uppercase tracking-wider mb-1 font-semibold">Release Date</p>
            <p className="text-white text-sm">{movie.release_date ? movie.release_date : 'N/A'}</p>
          </div>
        </div>

                {/* Cast section */}
        {topCast.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-semibold mb-4 text-cyan-400">Cast ({topCast.length})</h2>
            
            <div className="relative">
              <button
                onClick={() => scrollCast(-1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg shadow-cyan-500/60 hover:shadow-xl hover:shadow-cyan-400/80 transition-all hover:scale-110 active:scale-95"
                title="Scroll left"
              >
                ←
              </button>
        
              <div id="cast-scroll" className="overflow-x-auto pb-4 mx-12 scroll-smooth">
                <div className="flex gap-4 min-w-min">
                  {topCast.map(person => (
                    <div key={person.id} className="flex flex-col items-center text-center flex-shrink-0">
                      {person.profile_path ? (
                        <img
                          src={IMG_BASE + person.profile_path}
                          alt={person.name}
                          className="w-20 h-20 rounded-full object-cover mb-2 ring-2 ring-cyan-500/60 hover:ring-cyan-400 transition-all shadow-lg shadow-cyan-500/30"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-700 mb-2 ring-2 ring-cyan-500/30" />
                      )}
                      <p className="text-xs text-white leading-tight font-medium">{person.name}</p>
                      <p className="text-xs text-gray-500 leading-tight mt-0.5">{person.character}</p>
                    </div>
                  ))}
                </div>
              </div>
        
              <button
                onClick={() => scrollCast(1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg shadow-cyan-500/60 hover:shadow-xl hover:shadow-cyan-400/80 transition-all hover:scale-110 active:scale-95"
                title="Scroll right"
              >
                →
              </button>
            </div>
          </div>
        )}

        {/* Reviews section */}
        <Reviews reviews={reviewsData?.results} />

        {/* Similar movies section */}
        {similarMovies.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold mb-4 text-cyan-400">More Like This</h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
              {similarMovies.map(m => (
                <Link key={m.id} to={'/movie/' + m.id}>
                  <div className="group flex flex-col gap-2">
                    <div className="aspect-[2/3] w-full overflow-hidden rounded-lg ring-2 ring-cyan-500/30 group-hover:ring-cyan-400 transition-all">
                      <img
                        src={IMG_BASE + m.poster_path}
                        alt={m.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 group-hover:shadow-lg group-hover:shadow-cyan-500/50"
                      />
                    </div>
                    <p className="text-xs text-gray-400 leading-tight line-clamp-2 group-hover:text-cyan-300 transition-colors">{m.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Trailer modal */}
      {showTrailerModal && trailerVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
          onClick={() => setShowTrailerModal(false)}
        >
          <div
            className="relative w-full max-w-5xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl ring-2 ring-cyan-500/50"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setShowTrailerModal(false)}
              className="absolute top-4 right-4 z-10 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all shadow-lg shadow-cyan-500/60 hover:shadow-xl hover:shadow-cyan-400/80 hover:scale-110 active:scale-95 font-bold text-xl"
              title="Close trailer (Esc)"
            >
              ✕
            </button>

            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${trailerVideo.key}?autoplay=1`}
              frameBorder="0"
              allow="autoplay; encrypted-media"
              allowFullScreen
              title="Movie Trailer"
              className="absolute inset-0"
            />
          </div>
        </div>
      )}
    </main>
  )
}

export default MovieDetail