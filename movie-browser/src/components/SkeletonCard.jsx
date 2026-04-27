/**
 * Placeholder card shown while movie data is loading.
 * Matches the dimensions of MovieCard so the layout doesn't shift during loading.
 * Creates smooth, professional loading experience with shimmer animation.
 */
function SkeletonCard() {
  return (
    <div className="rounded-lg overflow-hidden bg-gray-900 animate-pulse">
      {/* Poster placeholder - animates with shimmer effect */}
      <div className="w-full h-72 bg-gray-700" />

      {/* Title and rating placeholder - shows as gray bars */}
      <div className="p-3 flex flex-col gap-2">
        {/* Title bar - wider than rating bar */}
        <div className="h-3 bg-gray-700 rounded w-3/4" />
        {/* Rating bar - narrower */}
        <div className="h-3 bg-gray-700 rounded w-1/4" />
      </div>
    </div>
  )
}

export default SkeletonCard