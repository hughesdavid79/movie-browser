import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { fetchMoviesByCategory, searchMoviesPaged } from '../api/tmdb'
import MovieCard from '../components/MovieCard'
import SkeletonCard from '../components/SkeletonCard'
import Pagination from '../components/Pagination'
import { useState, useEffect, useRef } from 'react'
import MovieModal from '../components/MovieModal'
import FilterSort from '../components/FilterSort'

/**
 * Available browsing categories - distinct content, no overlap with sort/filter
 * Each category provides a unique browsing experience not achievable through sorting
 * Date ranges are carefully separated:
 * - All Movies: Entire TMDB database sorted by popularity (trending)
 * - In Theaters: Last 45 days
 * - Coming Soon: 30+ days ahead
 * - Award Winners: All-time high-rated (min 100 votes)
 * 
 * @constant {Array<Object>}
 */
const CATEGORIES = [
  { label: 'All Movies', value: 'all', description: 'Browse entire movie database sorted by popularity' },
  { label: 'In Theaters', value: 'now_playing', description: 'Recently released movies (last 45 days)' },
  { label: 'Coming Soon', value: 'upcoming', description: 'Upcoming releases (30+ days ahead)' },
  { label: 'Award Winners', value: 'top_rated', description: 'Critically acclaimed movies (min 100 votes)' },
]

/**
 * Home Component
 * Main page displaying browsable movie grid with search, filtering, sorting, and pagination.
 * All state is persisted in URL params for browser back/forward support.
 * Categories provide distinct content discovery paths, while sort/filter allow refinement.
 * Global ranking system ensures consistent movie rankings across all categories.
 * 
 * @component
 * @returns {JSX.Element} Rendered home page
 */
function Home() {
  // All state lives in the URL — back button and refresh just work
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedMovie, setSelectedMovie] = useState(null)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const prevCategoryRef = useRef(null)
  
  // Extract URL params directly — derive sort and filters from URL, not from state
  const query = searchParams.get('query') ?? ''
  const page = parseInt(searchParams.get('page') ?? '1')
  const category = searchParams.get('category') ?? 'all'
  const sort = searchParams.get('sort') ?? 'rating'
  const genreParam = searchParams.get('genres') ?? ''
  const genres = genreParam ? genreParam.split(',').map(Number) : []
  const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')) : 0
  const year = searchParams.get('year') ?? null

  /**
   * Reset filters and sort ONLY when category actually changes
   * Use ref to track previous category value to prevent false positives
   * Each category starts fresh without filter carryover from previous category
   * This is critical for maintaining distinct category data
   */
  useEffect(() => {
    // Only clear filters when category ACTUALLY changes, not on every render
    if (prevCategoryRef.current !== null && prevCategoryRef.current !== category && !query) {
      setSearchParams(prev => {
        const next = new URLSearchParams(prev)
        next.delete('genres')
        next.delete('minRating')
        next.delete('year')
        next.delete('sort')
        next.set('page', '1')
        return next
      })
    }
    prevCategoryRef.current = category
  }, [category, setSearchParams, query])

  /**
   * Update sort option and reset to page 1
   * @param {string} newSort - Sort option (rating, date, title)
   */
  const handleSortChange = (newSort) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set('sort', newSort)
      next.set('page', '1')
      return next
    })
  }

  /**
   * Update filter options and reset to page 1
   * @param {Object} newFilters - Filter object with genres, minRating, year
   */
  const handleFilterChange = (newFilters) => {
    console.log('🎬 Filter changed:', newFilters)
    
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      
      // Handle genres - always set even if empty to trigger queryKey change
      if (newFilters.genres && newFilters.genres.length > 0) {
        const genreString = newFilters.genres.join(',')
        next.set('genres', genreString)
        console.log('📌 Setting genres:', genreString)
      } else {
        next.delete('genres')
        console.log('📌 Clearing genres')
      }
      
      // Handle rating
      if (newFilters.minRating && newFilters.minRating > 0) {
        next.set('minRating', String(newFilters.minRating))
        console.log('📌 Setting minRating:', newFilters.minRating)
      } else {
        next.delete('minRating')
        console.log('📌 Clearing minRating')
      }
      
      // Handle year
      if (newFilters.year) {
        next.set('year', newFilters.year)
        console.log('📌 Setting year:', newFilters.year)
      } else {
        next.delete('year')
        console.log('📌 Clearing year')
      }
      
      next.set('page', '1')
      return next
    })
  }

  /**
   * Apply sorting and client-side filtering to results
   * Uses global ranking from API (globalRank) for consistent ranks across categories
   * Rating filter is applied client-side, genre and year filters are server-side
   * 
   * @param {Array<Object>} results - Movies from API (with globalRank property)
   * @returns {Array<Object>} Processed results array
   */
  const processResults = (results) => {
    let processed = [...results]

    // Filter by rating (client-side only)
    if (minRating > 0) {
      processed = processed.filter(m => (m.vote_average || 0) >= minRating)
      console.log(`⭐ Filtered by rating ${minRating}+: ${processed.length} movies`)
    }

    // Apply sorting based on current sort option
    if (sort === 'rating') {
      processed.sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0))
    } else if (sort === 'date') {
      processed.sort((a, b) => new Date(b.release_date || 0) - new Date(a.release_date || 0))
    } else if (sort === 'title') {
      processed.sort((a, b) => a.title.localeCompare(b.title))
    }

    return processed
  }
  
  /**
   * Update a single URL param without clearing others
   * @param {string} key - Parameter key to update
   * @param {string} value - Parameter value to set
   */
  function setParam(key, value) {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      next.set(key, value)
      // Reset to page 1 when search or category changes
      if (key !== 'page') next.set('page', '1')
      return next
    })
  }

  /**
   * Fetch movies from API based on current search/category and filters
   * Query key includes all variables that affect the API call
   * API now enriches results with globalRank for consistent ranking across categories
   */
  const { data, isLoading, isError } = useQuery({
    queryKey: query 
      ? ['search', query, page] 
      : ['category', category, page, genreParam, String(minRating), year],
    queryFn: () => {
      if (query) {
        return searchMoviesPaged(query, page)
      } else {
        console.log(`🎬 Fetching ${category} with genres="${genreParam}", year="${year}", page=${page}`)
        return fetchMoviesByCategory(category, page, genreParam, year)
      }
    },
    keepPreviousData: true,
    staleTime: 0,
    gcTime: 1000 * 60 * 5,
  })

  const totalPages = data?.total_pages ?? 1
  const processedResults = data ? processResults(data.results) : []
  const movieCount = data?.total_results ?? 0
  
  // Derive current filters object for passing to FilterSort component
  const currentFilters = {
    genres,
    minRating,
    year,
  }

  return (
    <main className="min-h-screen bg-gray-950 p-8">

      {/* Header row — title showing current category or search query */}
      <div className="mb-6">
        <h1 className="text-white text-3xl font-bold">
          {query ? 'Results for "' + query + '"' : CATEGORIES.find(c => c.value === category)?.label}
        </h1>
        <div className="flex items-center gap-4 mt-2">
          <p className="text-gray-400 text-sm">
            {!query && CATEGORIES.find(c => c.value === category)?.description}
          </p>
          {movieCount > 0 && (
            <span className="text-gray-500 text-xs bg-gray-800 px-3 py-1 rounded-full">
              {movieCount.toLocaleString()} available
            </span>
          )}
        </div>
      </div>

      {/* Filter and Sort Section */}
      <FilterSort 
        onFilterChange={handleFilterChange}
        onSortChange={handleSortChange}
        currentSort={sort}
        currentFilters={currentFilters}
      />

      {/* Movie grid or skeletons */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 20 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : isError ? (
        <p className="text-red-400 text-center py-8">Something went wrong. Please try again.</p>
      ) : data.results.length === 0 ? (
        <p className="text-gray-400 text-center mt-16">No movies found for "{query}"</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {processedResults.map((movie) => (
            <MovieCard 
              key={movie.id} 
              movie={movie}
              rank={movie.globalRank}
              onSelect={(movie) => {
                setSelectedMovie(movie)
                setSelectedIndex(processedResults.indexOf(movie))
              }} 
            />
          ))}
        </div>
      )}

      {/* Pagination controls */}
      {!isLoading && totalPages > 1 && (
        <Pagination page={page} totalPages={totalPages} onPageChange={p => setParam('page', String(p))} />
      )}

      {/* Movie preview modal */}
      {selectedMovie && (
        <MovieModal
          movieId={selectedMovie.id}
          onClose={() => setSelectedMovie(null)}
          onNext={() => {
            if (selectedIndex < processedResults.length - 1) {
              const nextMovie = processedResults[selectedIndex + 1]
              setSelectedMovie(nextMovie)
              setSelectedIndex(selectedIndex + 1)
            }
          }}
          onPrev={() => {
            if (selectedIndex > 0) {
              const prevMovie = processedResults[selectedIndex - 1]
              setSelectedMovie(prevMovie)
              setSelectedIndex(selectedIndex - 1)
            }
          }}
          hasNext={selectedIndex < processedResults.length - 1}
          hasPrev={selectedIndex > 0}
        />
      )}

    </main>
  )
}

export default Home