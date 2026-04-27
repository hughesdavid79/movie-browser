import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { fetchMovieDetail, fetchMovieVideos } from '../api/tmdb'

const IMG_BASE = 'https://image.tmdb.org/t/p/w500'
const BACKDROP_BASE = 'https://image.tmdb.org/t/p/w1280'

/**
 * MovieModal Component
 * Full-screen modal overlay showing a quick movie preview.
 * Features: clean backdrop display, embedded trailer in separate overlay, navigation arrows, and action buttons.
 * All buttons use consistent cyan color scheme.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {number|string} props.movieId - TMDB movie ID to display
 * @param {function} props.onClose - Callback when modal closes
 * @param {function} props.onNext - Callback when next arrow is clicked
 * @param {function} props.onPrev - Callback when prev arrow is clicked
 * @param {boolean} props.hasNext - Whether next button should be enabled
 * @param {boolean} props.hasPrev - Whether prev button should be enabled
 * @returns {JSX.Element} Rendered modal overlay
 */
function MovieModal({ movieId, onClose, onNext, onPrev, hasNext, hasPrev }) {
  const navigate = useNavigate()
  
  const [showTrailerModal, setShowTrailerModal] = useState(false)

  const { data: movie, isLoading } = useQuery({
    queryKey: ['movie', String(movieId)],
    queryFn: () => fetchMovieDetail(movieId),
  })

  const { data: videos } = useQuery({
    queryKey: ['videos', String(movieId)],
    queryFn: () => fetchMovieVideos(movieId),
  })

  const trailerVideo = videos?.results?.find(v => v.site === 'YouTube' && v.type === 'Trailer')

  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') {
        if (showTrailerModal) {
          setShowTrailerModal(false)
        } else {
          onClose()
        }
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose, showTrailerModal])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-gray-900 rounded-2xl overflow-hidden shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto ring-2 ring-cyan-500/30"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white rounded-full w-10 h-10 flex items-center justify-center transition-all shadow-lg shadow-cyan-500/60 hover:shadow-xl hover:shadow-cyan-400/80 hover:scale-110 active:scale-95 font-bold"
          title="Close modal (Esc)"
        >
          ✕
        </button>

        {isLoading ? (
          <div className="h-96 flex items-center justify-center">
            <p className="text-white">Loading...</p>
          </div>
        ) : (
          <div>
            <div className="relative w-full h-80 overflow-hidden group bg-black">
              {/* Left navigation arrow - cyan */}
              {hasPrev && (
                <button
                  onClick={onPrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white rounded-full w-16 h-16 flex items-center justify-center transition-all shadow-lg shadow-cyan-500/60 hover:shadow-xl hover:shadow-cyan-400/80 hover:scale-125 text-2xl font-bold"
                  title="Previous movie"
                >
                  ←
                </button>
              )}

              {movie.backdrop_path ? (
                <img
                  src={BACKDROP_BASE + movie.backdrop_path}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-800" />
              )}

              {/* Right navigation arrow - cyan */}
              {hasNext && (
                <button
                  onClick={onNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 text-white rounded-full w-16 h-16 flex items-center justify-center transition-all shadow-lg shadow-cyan-500/60 hover:shadow-xl hover:shadow-cyan-400/80 hover:scale-125 text-2xl font-bold"
                  title="Next movie"
                >
                  →
                </button>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
            </div>

            <div className="flex gap-6 px-8 py-8 -mt-20 relative">

              {movie.poster_path && (
                <img
                  src={IMG_BASE + movie.poster_path}
                  alt={movie.title}
                  className="w-48 rounded-lg shadow-xl flex-shrink-0 self-start ring-2 ring-cyan-500/50 hover:ring-cyan-400 transition-all"
                />
              )}

              <div className="flex flex-col gap-3 pt-0 min-w-0 flex-grow">
                <h2 className="text-white text-3xl font-bold leading-tight">{movie.title}</h2>

                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                  <span className="text-cyan-400 font-semibold text-lg bg-cyan-400/10 px-2 py-1 rounded">
                    {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'} ★
                  </span>
                  <span>{movie.release_date ? movie.release_date.slice(0, 4) : 'N/A'}</span>
                  <span>·</span>
                  <span>{movie.runtime ? movie.runtime + ' min' : 'N/A'}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {movie.genres && movie.genres.slice(0, 3).map(genre => (
                    <span key={genre.id} className="bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 text-xs px-3 py-1 rounded-full hover:bg-cyan-500/30 transition-colors">
                      {genre.name}
                    </span>
                  ))}
                </div>

                <p className="text-gray-300 text-sm leading-relaxed line-clamp-4">
                  {movie.overview}
                </p>

                <div className="flex gap-3 mt-4 flex-wrap">
                  {trailerVideo && (
                    <button
                      onClick={() => setShowTrailerModal(true)}
                      className="bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-gray-950 font-bold px-6 py-3 rounded-full text-sm transition-all shadow-lg shadow-cyan-500/60 hover:shadow-2xl hover:shadow-cyan-400/80 hover:scale-110 active:scale-95"
                    >
                      ▶ Watch Trailer
                    </button>
                  )}
                  
                  <button
                    onClick={() => navigate('/movie/' + movie.id)}
                    className="bg-gradient-to-r from-cyan-400 to-cyan-500 hover:from-cyan-300 hover:to-cyan-400 text-gray-950 font-bold px-6 py-3 rounded-full text-sm transition-all shadow-lg shadow-cyan-500/60 hover:shadow-2xl hover:shadow-cyan-400/80 hover:scale-110 active:scale-95"
                  >
                    Details →
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showTrailerModal && trailerVideo && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
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
    </div>
  )
}

export default MovieModal