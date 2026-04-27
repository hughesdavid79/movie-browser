/**
 * TMDB API Module
 * Handles all API calls to The Movie Database (TMDB) service.
 * Uses Bearer token authentication from environment variables.
 * Provides centralized API layer with global ranking and caching.
 */

// Base URL for all TMDB API requests
const BASE_URL = 'https://api.themoviedb.org/3'

// Read access token from environment — never hardcode credentials
const TOKEN = import.meta.env.VITE_TMDB_TOKEN

// Reuse headers across all requests instead of repeating them (DRY principle)
const headers = {
  Authorization: `Bearer ${TOKEN}`,
  'Content-Type': 'application/json',
}

// Global cache for popularity-based movies (used for consistent ranking across categories)
let globalRankingCache = null
let globalRankingCacheTime = null
const CACHE_DURATION = 1000 * 60 * 60 // Cache for 1 hour

/**
 * Fetches and caches movies for global ranking system
 * Builds ranking from popularity (not rating) to ensure diverse representation
 * This ensures Award Winners don't get artificially high ranks just because they're highly-rated
 * Fetches 15 pages (300 most popular movies) to ensure comprehensive coverage
 * Results are cached for 1 hour to reduce API calls
 * 
 * @async
 * @returns {Promise<Map>} Map of movieId -> globalRank (1-300)
 */
async function fetchGlobalRankingMap() {
  const now = Date.now()
  
  // Return cached result if still valid (within CACHE_DURATION)
  if (globalRankingCache && globalRankingCacheTime && (now - globalRankingCacheTime) < CACHE_DURATION) {
    console.log('♻️  Using cached global ranking map')
    return globalRankingCache
  }

  try {
    console.log('🌍 Fetching global ranking data based on popularity...')
    const rankingMap = new Map()
    let currentRank = 1

    // Fetch most popular movies across all pages
    // Ranking by popularity ensures fair ranking across all categories
    // Award Winners (high-rated) won't get artificially high ranks
    for (let page = 1; page <= 15; page++) {
      try {
        const res = await fetch(
          `${BASE_URL}/discover/movie?sort_by=popularity.desc&region=US&page=${page}`,
          { headers, cache: 'no-store' }
        )
        if (!res.ok) {
          console.warn(`Failed to fetch ranking page ${page}`)
          continue
        }
        
        const data = await res.json()
        
        // Add each movie to the ranking map with sequential rank
        data.results?.forEach(movie => {
          if (!rankingMap.has(movie.id)) {
            rankingMap.set(movie.id, currentRank)
            currentRank++
          }
        })
      } catch (pageError) {
        console.warn(`Error fetching ranking page ${page}:`, pageError.message)
      }
    }

    // Cache the result for future requests
    globalRankingCache = rankingMap
    globalRankingCacheTime = now
    
    console.log(`✅ Global ranking map built with ${rankingMap.size} movies (by popularity)`)
    return rankingMap
  } catch (error) {
    console.error('❌ Error building global ranking:', error.message)
    return new Map()  // Return empty map on failure, don't crash
  }
}

/**
 * Sort search results by title relevance to the query, then alphabetically, then by release date
 * Prioritizes exact matches, then direct continuation (no space), then word boundary, then contains
 * This ensures typing "Demon" shows:
 * 1. "Demon" (exact match)
 * 2. "Demonlover" (direct continuation)
 * 3. "Demon City" (word boundary, alphabetically before "Demon Slayer")
 * 4. "Demon Slayer" (word boundary)
 * 5. "K-pop Demon Hunters" (contains)
 * Within same relevance tier, sorts alphabetically, then by release date (newest first)
 * 
 * @param {Array<Object>} results - Search results from TMDB API
 * @param {string} query - Original search query
 * @returns {Array<Object>} Results sorted by relevance, then alphabetically, then by release date
 */
function sortByRelevance(results, query) {
  const lowerQuery = query.toLowerCase().trim()
  
  if (!lowerQuery) return results

  const scored = results.map(movie => {
    const title = movie.title.toLowerCase()
    let score

    // Exact title match (highest priority)
    if (title === lowerQuery) score = 1000
    // Starts with query directly (no space) — like "Demonlover"
    else if (title.startsWith(lowerQuery)) score = 500
    // Word boundary with space — like "Demon Slayer"
    else if (title.match(new RegExp(`\\s${lowerQuery}`))) score = 400
    // Query appears in title (medium priority) — like "K-pop Demon Hunters"
    else if (title.includes(lowerQuery)) score = 100
    // Popularity fallback
    else score = movie.popularity || 0

    // Convert release_date (YYYY-MM-DD) to comparable number
    const releaseDate = movie.release_date ? new Date(movie.release_date).getTime() : 0

    return { ...movie, _relevanceScore: score, _releaseDate: releaseDate }
  })

  // Sort by relevance, then alphabetically, then by release date (newest first)
  return scored.sort((a, b) => {
    // Primary: relevance score (highest first)
    if (a._relevanceScore !== b._relevanceScore) {
      return b._relevanceScore - a._relevanceScore
    }
    // Secondary: alphabetically
    const titleCompare = a.title.localeCompare(b.title)
    if (titleCompare !== 0) {
      return titleCompare
    }
    // Tertiary: release date (newest first)
    return b._releaseDate - a._releaseDate
  })
}

/**
 * Fetches the current list of popular movies from TMDB.
 * Used to populate the home page grid on initial load.
 * 
 * @async
 * @returns {Promise<Object>} TMDB response with results array and pagination info
 * @throws {Error} If API request fails
 */
export async function fetchPopularMovies() {
  const res = await fetch(`${BASE_URL}/movie/popular`, { headers })
  if (!res.ok) throw new Error('Failed to fetch popular movies')
  return res.json()
}

/**
 * Searches movies by title with pagination.
 * Query is URI-encoded to safely handle special characters and spaces.
 * Results are enriched with global ranking and sorted by title relevance.
 * 
 * @async
 * @param {string} query - The search term entered by the user
 * @param {number} [page=1] - The page number to fetch
 * @returns {Promise<Object>} TMDB response with search results, enriched with globalRank and sorted by relevance
 * @throws {Error} If API request fails
 */
export async function searchMoviesPaged(query, page = 1) {
  // Encode query to handle special characters safely
  const res = await fetch(`${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=${page}`, { headers })
  if (!res.ok) throw new Error('Failed to search movies')
  
  const data = await res.json()
  
  // Fetch global ranking map and enrich results with globalRank
  const rankingMap = await fetchGlobalRankingMap()
  
  // Add globalRank to each movie for consistent ranking across search results
  if (data.results) {
    data.results = data.results.map(movie => ({
      ...movie,
      globalRank: rankingMap.get(movie.id) || null  // null if not in top 300 popular
    }))
    
    // Sort by title relevance to prioritize exact/partial matches
    data.results = sortByRelevance(data.results, query)
  }
  
  return data
}

/**
 * Fetches a small set of search results for the preview dropdown.
 * Separate from searchMoviesPaged so we always get page 1 for preview display.
 * Limited results provide fast feedback for user search input (debounced to 300ms).
 * Results are sorted by title relevance for better UX.
 * 
 * @async
 * @param {string} query - The search term entered by the user
 * @returns {Promise<Object>} TMDB response with preview results (page 1 only, limited, sorted by relevance)
 * @throws {Error} If API request fails
 */
export async function fetchSearchPreview(query) {
  // Encode query safely, only fetch first page for preview
  const res = await fetch(`${BASE_URL}/search/movie?query=${encodeURIComponent(query)}&page=1`, { headers })
  if (!res.ok) throw new Error('Failed to fetch search preview')
  
  const data = await res.json()
  
  // Sort preview results by title relevance for better UX
  if (data.results) {
    data.results = sortByRelevance(data.results, query)
  }
  
  return data
}

/**
 * Fetches full details for a single movie by its TMDB ID.
 * Used on the detail page for overview, rating, genres, budget, revenue, etc.
 * 
 * @async
 * @param {string|number} id - The TMDB movie ID
 * @returns {Promise<Object>} Complete movie details object
 * @throws {Error} If API request fails
 */
export async function fetchMovieDetail(id) {
  const res = await fetch(`${BASE_URL}/movie/${id}`, { headers })
  if (!res.ok) throw new Error('Failed to fetch movie detail')
  return res.json()
}

/**
 * Fetches cast and crew for a single movie.
 * Kept separate from fetchMovieDetail so each function stays focused on one responsibility.
 * 
 * @async
 * @param {string|number} id - The TMDB movie ID
 * @returns {Promise<Object>} Object with cast and crew arrays
 * @throws {Error} If API request fails
 */
export async function fetchMovieCredits(id) {
  const res = await fetch(`${BASE_URL}/movie/${id}/credits`, { headers })
  if (!res.ok) throw new Error('Failed to fetch movie credits')
  return res.json()
}

/**
 * Fetches movies by category with optional filtering and pagination.
 * Each category uses distinct date ranges and sorting to minimize overlap:
 * - all: Entire database sorted by popularity
 * - now_playing: Released in last 45 days, sorted by recency
 * - upcoming: Releasing 30+ days from now, sorted by release date
 * - top_rated: All-time high-rated with minimum vote count for credibility
 * 
 * All results are enriched with globalRank based on popularity (fair ranking across all categories).
 * Server-side genre and year filtering ensures consistent full pages.
 * 
 * @async
 * @param {string} category - One of: 'all', 'now_playing', 'upcoming', 'top_rated'
 * @param {number} [page=1] - The page number to fetch (1-based)
 * @param {string} [genres=''] - Comma-separated genre IDs to filter by (e.g. '28,12')
 * @param {string} [year=''] - Release year to filter by (e.g. '2024')
 * @returns {Promise<Object>} TMDB response with filtered/paginated movies, enriched with globalRank
 * @throws {Error} If API request fails
 */
export async function fetchMoviesByCategory(category, page = 1, genres = '', year = '') {
  // Calculate distinct date ranges to minimize overlap between categories
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  // 30 days in the future for "upcoming" lower bound
  const thirtyDaysAhead = new Date(today)
  thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30)
  const thirtyDaysAheadStr = thirtyDaysAhead.toISOString().split('T')[0]

  // 45 days ago for "now playing" lower bound
  const fortyFiveDaysAgo = new Date(today)
  fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45)
  const fortyFiveDaysAgoStr = fortyFiveDaysAgo.toISOString().split('T')[0]

  // Build query parameters for genre and year filters
  // Only add if provided to keep URL clean
  const genreFilter = genres ? `&with_genres=${genres}` : ''
  const yearFilter = year ? `&primary_release_year=${year}` : ''

  let url = ''

  // Each category has distinct boundaries to ensure variety and minimal overlap
  if (category === 'all') {
    // All Movies: Entire database sorted by popularity (trending)
    url = `${BASE_URL}/discover/movie?sort_by=popularity.desc&region=US&page=${page}${genreFilter}${yearFilter}`
  } else if (category === 'now_playing') {
    // In Theaters: Released in the last 45 days, sorted newest first
    url = `${BASE_URL}/discover/movie?sort_by=primary_release_date.desc&primary_release_date.gte=${fortyFiveDaysAgoStr}&primary_release_date.lte=${todayStr}&region=US&page=${page}${genreFilter}${yearFilter}`
  } else if (category === 'upcoming') {
    // Coming Soon: Strictly future releases 30+ days out, sorted by release date ascending
    url = `${BASE_URL}/discover/movie?sort_by=primary_release_date.asc&primary_release_date.gte=${thirtyDaysAheadStr}&region=US&page=${page}${genreFilter}${yearFilter}`
  } else if (category === 'top_rated') {
    // Award Winners: All-time top-rated with minimum vote count for credibility
    url = `${BASE_URL}/discover/movie?sort_by=vote_average.desc&vote_count.gte=100&region=US&page=${page}${genreFilter}${yearFilter}`
  }

  try {
    // Fetch movies from API with cache disabled (always fresh data)
    const res = await fetch(url, { 
      headers,
      cache: 'no-store'
    })
    if (!res.ok) throw new Error(`Failed to fetch ${category} movies`)
    
    const data = await res.json()
    
    // Fetch global ranking map and enrich results
    const rankingMap = await fetchGlobalRankingMap()
    
    // Add globalRank to each movie for consistent ranking across categories
    if (data.results) {
      data.results = data.results.map(movie => ({
        ...movie,
        globalRank: rankingMap.get(movie.id) || null
      }))
    }
    
    // Console logging for debugging category separation and rankings
    if (data.results && data.results.length > 0) {
      const rankedCount = data.results.filter(m => m.globalRank !== null).length
      console.log(`📺 [${category}] Page ${page}: ${data.results.length} movies (${rankedCount} with global rank)`)
      console.log(`  First: "${data.results[0].title}" (rating: ${data.results[0].vote_average}, global rank: ${data.results[0].globalRank || 'N/A'})`)
    }
    
    return data
  } catch (error) {
    console.error(`❌ Error fetching ${category}:`, error.message)
    throw error
  }
}

/**
 * Fetches videos (trailers, teasers, clips, behind-the-scenes) for a movie.
 * Client filters for YouTube trailers specifically.
 * 
 * @async
 * @param {string|number} id - The TMDB movie ID
 * @returns {Promise<Object>} Object with results array of video objects
 * @throws {Error} If API request fails
 */
export async function fetchMovieVideos(id) {
  const res = await fetch(`${BASE_URL}/movie/${id}/videos`, { headers })
  if (!res.ok) throw new Error('Failed to fetch movie videos')
  return res.json()
}

/**
 * Fetches movies similar to a given movie.
 * Used to show recommendations at the bottom of the detail page.
 * 
 * @async
 * @param {string|number} id - The TMDB movie ID
 * @returns {Promise<Object>} TMDB response with similar movies
 * @throws {Error} If API request fails
 */
export async function fetchSimilarMovies(id) {
  const res = await fetch(`${BASE_URL}/movie/${id}/similar`, { headers })
  if (!res.ok) throw new Error('Failed to fetch similar movies')
  return res.json()
}

/**
 * Fetches user reviews for a movie.
 * Reviews include author name, author rating, and full review text.
 * 
 * @async
 * @param {string|number} id - The TMDB movie ID
 * @returns {Promise<Object>} Object with results array of review objects
 * @throws {Error} If API request fails
 */
export async function fetchMovieReviews(id) {
  const res = await fetch(`${BASE_URL}/movie/${id}/reviews`, { headers })
  if (!res.ok) throw new Error('Failed to fetch movie reviews')
  return res.json()
}