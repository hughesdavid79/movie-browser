/**
 * MovieCard Component
 * Displays a single movie as a clickable card in the grid.
 * Features: emerald ranking badge, hover effects with shadow text, and selection callback.
 * The rank badge always reflects the movie's position in the current result set.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.movie - Movie object from TMDB API
 * @param {string} props.movie.id - Movie ID
 * @param {string} props.movie.poster_path - Path to poster image
 * @param {string} props.movie.title - Movie title
 * @param {number} props.movie.vote_average - Rating (0-10)
 * @param {number} props.rank - Rating-based rank (1 = highest, 2 = second, etc.)
 * @param {function} props.onSelect - Callback fired when card is clicked
 * @returns {JSX.Element} Rendered movie card
 */
function MovieCard({ movie, rank, onSelect }) {
  const IMG_BASE = 'https://image.tmdb.org/t/p/w500'

  /**
   * Handle card click - fires parent's onSelect callback with movie data
   */
  const handleCardClick = () => {
    onSelect(movie)
  }

  return (
    <div
      onClick={handleCardClick}
      className="group relative rounded-lg overflow-hidden bg-gray-900 shadow-lg hover:scale-105 transition-transform duration-200 cursor-pointer ring-1 ring-gray-700 hover:ring-cyan-500/50"
    >
      {/* Poster image container with aspect ratio */}
      <div className="aspect-[2/3] w-full relative">
        {movie.poster_path ? (
          <img
            src={IMG_BASE + movie.poster_path}
            alt={movie.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="aspect-[2/3] w-full bg-gray-700 flex items-center justify-center text-gray-400 text-sm">
            No Image
          </div>
        )}
        
        {/* 
          Ranking badge - shows global rank based on popularity
          #1 = most popular movie globally
          Uses emerald color for consistency with rating displays
        */}
        {rank && (
          <div className="absolute top-3 right-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-full w-10 h-10 flex items-center justify-center shadow-lg shadow-emerald-500/50 ring-2 ring-emerald-400/50">
            #{rank}
          </div>
        )}

        {/* 
          Hover overlay - shows title and rating
          Appears on hover with gradient background
        */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3 text-white">
          <h3 className="font-bold text-sm leading-tight line-clamp-2">{movie.title}</h3>
          {movie.vote_average && (
            <p className="text-emerald-400 text-xs font-semibold mt-1">
              ⭐ {movie.vote_average.toFixed(1)}/10
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default MovieCard