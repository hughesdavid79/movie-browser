import { useState } from 'react'

/**
 * Reviews Component
 * Displays user reviews for a movie with expandable content.
 * Features: review author with star rating, date, expandable text, and "View all" functionality.
 * Author name and rating displayed together for better readability.
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Array<Object>} props.reviews - Array of review objects from TMDB API
 * @param {string} props.reviews[].id - Unique review identifier
 * @param {string} props.reviews[].author - Author name
 * @param {string} props.reviews[].content - Full review text
 * @param {string} props.reviews[].created_at - ISO date string of review creation
 * @param {Object} props.reviews[].author_details - Author metadata
 * @param {number} props.reviews[].author_details.rating - Author's rating (0-10 scale)
 * @returns {JSX.Element|null} Rendered reviews section or null if no reviews
 */
function Reviews({ reviews }) {
  // State to track which reviews are expanded (show full text)
  const [expandedIds, setExpandedIds] = useState(new Set())

  /**
   * Toggle expanded state for a review
   * @param {string} id - Review ID to toggle
   */
  const toggleExpand = (id) => {
    const newExpanded = new Set(expandedIds)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedIds(newExpanded)
  }

  /**
   * Render star rating (0-10 scale displayed as stars)
   * @param {number} rating - Rating from 0-10
   * @returns {string} Star representation
   */
  const renderStars = (rating) => {
    if (!rating) return 'N/A'
    const stars = Math.round(rating / 2) // Convert 0-10 scale to 0-5 stars
    const fullStars = '⭐'.repeat(Math.min(stars, 5))
    const emptyStars = '☆'.repeat(Math.max(0, 5 - stars))
    return `${fullStars}${emptyStars} (${rating}/10)`
  }

  // Return null if no reviews available
  if (!reviews || reviews.length === 0) {
    return null
  }

  return (
    <div className="mt-12">
      {/* Section heading with review count */}
      <h2 className="text-xl font-semibold mb-6 text-cyan-400">Reviews ({reviews.length})</h2>
      
      {/* Reviews list container */}
      <div className="space-y-4">
        {/* Display first 5 reviews only */}
        {reviews.slice(0, 5).map(review => (
          <div key={review.id} className="bg-gray-800/50 rounded-lg p-4 border border-cyan-500/30 hover:border-cyan-500/50 transition-colors">
            {/* Review header - author info and rating inline */}
            <div className="mb-3">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Author name */}
                <p className="text-white font-semibold">{review.author}</p>
                
                {/* Star rating display (if provided) */}
                {review.author_details?.rating && (
                  <span className="text-emerald-400 font-medium text-sm">
                    {renderStars(review.author_details.rating)}
                  </span>
                )}
              </div>
              
              {/* Review date - formatted as MM/DD/YYYY */}
              <p className="text-gray-500 text-xs mt-1">
                {new Date(review.created_at).toLocaleDateString()}
              </p>
            </div>
            
            {/* Review text - truncated if not expanded */}
            <p className="text-gray-300 text-sm leading-relaxed">
              {expandedIds.has(review.id)
                ? review.content
                : review.content.slice(0, 200) + (review.content.length > 200 ? '...' : '')}
            </p>

            {/* Show/Hide more button - only shows if review is longer than 200 chars */}
            {review.content.length > 200 && (
              <button
                onClick={() => toggleExpand(review.id)}
                className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold mt-3 transition-colors"
              >
                {expandedIds.has(review.id) ? '− Show less' : '+ Show more'}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default Reviews