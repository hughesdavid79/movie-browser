/**
 * FilterSort Component
 * Provides sort and filter UI controls for browsable movie grid.
 * Features: sort options (rating, date, title), genre filters, rating filter, year filter.
 * All buttons use consistent cyan color scheme. Clear filters is red only.
 * Filters are applied via callbacks to parent, which manages URL state.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {function} props.onSortChange - Callback when sort option changes
 * @param {function} props.onFilterChange - Callback when any filter changes
 * @param {string} props.currentSort - Current sort option (rating, date, title)
 * @param {Object} props.currentFilters - Current filter values {genres, minRating, year}
 * @returns {JSX.Element} Rendered filter/sort UI
 */
import { useState } from 'react'

function FilterSort({ onFilterChange, onSortChange, currentSort, currentFilters }) {
  // Track whether detailed filters panel is expanded (Show/Hide Filters toggle)
  const [showFilters, setShowFilters] = useState(false)

  // Sort options for result ordering — passed to parent for URL state management
  const sortOptions = [
    { label: 'Rating (High to Low)', value: 'rating' },
    { label: 'Release Date (Newest)', value: 'date' },
    { label: 'Title (A-Z)', value: 'title' },
  ]

  // TMDB genre IDs and labels — maps to server-side genre filter parameter with_genres
  const genres = [
    { id: 28, name: 'Action' },
    { id: 12, name: 'Adventure' },
    { id: 16, name: 'Animation' },
    { id: 35, name: 'Comedy' },
    { id: 80, name: 'Crime' },
    { id: 99, name: 'Documentary' },
    { id: 18, name: 'Drama' },
    { id: 10751, name: 'Family' },
    { id: 14, name: 'Fantasy' },
    { id: 27, name: 'Horror' },
    { id: 10402, name: 'Music' },
    { id: 9648, name: 'Mystery' },
    { id: 10749, name: 'Romance' },
    { id: 878, name: 'Sci-Fi' },
    { id: 10770, name: 'TV Movie' },
    { id: 53, name: 'Thriller' },
    { id: 10752, name: 'War' },
    { id: 37, name: 'Western' },
  ]

  /**
   * Update sort option and notify parent for URL state change
   * @param {string} value - Sort option (rating, date, or title)
   */
  const handleSortChange = (value) => {
    onSortChange(value)
  }

  /**
   * Toggle genre in selection — allows multi-select by adding/removing from array
   * If genre already selected, remove it; otherwise add it
   * @param {number} genreId - TMDB genre ID to toggle
   */
  const handleGenreChange = (genreId) => {
    // Check if genre is already in the filter list
    const newGenres = currentFilters.genres.includes(genreId)
      // Remove genre from array if already selected (toggle off)
      ? currentFilters.genres.filter(g => g !== genreId)
      // Add genre to array if not selected (toggle on)
      : [...currentFilters.genres, genreId]
    
    // Notify parent of updated genre list for URL state update
    onFilterChange({ ...currentFilters, genres: newGenres })
  }

  /**
   * Update minimum rating filter — controls minimum vote_average threshold
   * Converts string value from select to number for comparison
   * @param {string|number} value - Rating threshold (0 means no minimum)
   */
  const handleRatingChange = (value) => {
    // Convert string to number; handle "0" special case for "any rating"
    const numValue = value === 0 ? 0 : parseFloat(value)
    onFilterChange({ ...currentFilters, minRating: numValue })
  }

  /**
   * Update release year filter — restricts to specific year
   * "all" string value means no year filter (converted to null for URL)
   * @param {string} value - Year (e.g., "2024") or "all" for no filter
   */
  const handleYearChange = (value) => {
    // Convert "all" to null so backend API knows no year constraint
    onFilterChange({ ...currentFilters, year: value === 'all' ? null : value })
  }

  // Get current year for populating year dropdown (last 30 years available)
  const currentYear = new Date().getFullYear()

  return (
    <div className="mb-6 space-y-4">
      {/* Sort Section */}
      <div>
        <h3 className="text-cyan-400 text-xs uppercase tracking-wider font-semibold mb-3">Sort By</h3>
        <div className="flex flex-wrap gap-2">
          {sortOptions.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleSortChange(opt.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                // Highlight active sort option with cyan gradient; inactive buttons are muted gray
                currentSort === opt.value
                  ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-gray-950 shadow-lg shadow-cyan-500/60 hover:shadow-xl hover:shadow-cyan-400/80 hover:scale-105 active:scale-95 ring-2 ring-cyan-300'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white shadow-md'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filter Toggle Button - reveals/hides detailed filter options below */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 bg-gradient-to-r from-cyan-600/40 to-cyan-700/40 hover:from-cyan-500/60 hover:to-cyan-600/60 text-cyan-300 hover:text-cyan-100 text-sm font-semibold px-4 py-2 rounded-lg transition-all border border-cyan-500/50 shadow-md"
      >
        🔍 {showFilters ? 'Hide Filters' : 'Show Filters'}
      </button>

      {/* Filters Section - only visible when showFilters is true */}
      {showFilters && (
        <div className="bg-gray-900/70 rounded-lg p-4 border border-cyan-500/30 space-y-4 backdrop-blur-sm">
          
          {/* Genre Filter - multi-select with TMDB genre IDs */}
          <div>
            <p className="text-cyan-400 text-sm font-semibold mb-2">Genres</p>
            {/* Scrollable container for all 18 genres with custom cyan scrollbar */}
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto custom-scroll">
              {genres.map(genre => (
                <button
                  key={genre.id}
                  onClick={() => handleGenreChange(genre.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    // Show cyan highlight for selected genres, gray for unselected
                    currentFilters.genres.includes(genre.id)
                      ? 'bg-gradient-to-r from-cyan-400 to-cyan-500 text-gray-950 shadow-lg shadow-cyan-500/60 hover:shadow-xl hover:shadow-cyan-400/80 ring-2 ring-cyan-300'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white shadow-md'
                  }`}
                >
                  {genre.name}
                </button>
              ))}
            </div>
          </div>

          {/* Rating Filter - dropdown to set minimum vote_average threshold */}
          <div>
            <p className="text-cyan-400 text-sm font-semibold mb-2">Minimum Rating</p>
            <select
              value={currentFilters.minRating || '0'}
              onChange={e => handleRatingChange(parseFloat(e.target.value))}
              className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-400 w-full shadow-md border border-gray-700"
            >
              {/* "0" option means no minimum rating — show all movies */}
              <option value={0}>Any Rating</option>
              <option value={6}>6.0+</option>
              <option value={7}>7.0+</option>
              <option value={8}>8.0+</option>
              <option value={9}>9.0+</option>
            </select>
          </div>

          {/* Year Filter - dropdown to restrict results to specific release year */}
          <div>
            <p className="text-cyan-400 text-sm font-semibold mb-2">Release Year</p>
            <select
              value={currentFilters.year || 'all'}
              onChange={e => handleYearChange(e.target.value)}
              className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-cyan-400 w-full shadow-md border border-gray-700"
            >
              {/* "all" option disables year filtering */}
              <option value="all">All Years</option>
              {/* Generate last 30 years of options for selection */}
              {Array.from({ length: 30 }, (_, i) => currentYear - i).map(year => (
                <option key={year} value={year.toString()}>{year}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button - only show if user has applied any filters (red = destructive action) */}
          {(currentFilters.genres.length > 0 || currentFilters.minRating > 0 || currentFilters.year) && (
            <button
              onClick={() => onFilterChange({ genres: [], minRating: 0, year: null })}
              className="w-full px-3 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-red-100 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl active:scale-95"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default FilterSort