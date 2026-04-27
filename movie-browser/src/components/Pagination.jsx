import { useState } from 'react'

/**
 * Pagination control with prev/next buttons and a direct page input.
 * Lets users jump to any page without clicking through one at a time.
 * @param {number} page - Current page number
 * @param {number} totalPages - Total number of pages available
 * @param {function} onPageChange - Called with the new page number
 */
function Pagination({ page, totalPages, onPageChange }) {
  const [inputValue, setInputValue] = useState('')
  const [editing, setEditing] = useState(false)

  function handlePageSubmit(e) {
    e.preventDefault()
    const parsed = parseInt(inputValue)
    if (!isNaN(parsed) && parsed >= 1 && parsed <= totalPages) {
      onPageChange(parsed)
    }
    setEditing(false)
    setInputValue('')
  }

  return (
    <div className="flex items-center justify-center gap-3 mt-10 mb-4">

      {/* Previous button */}
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-30 hover:bg-gray-700 transition-colors text-sm"
      >
        ← Prev
      </button>

      {/* Page indicator — click to type a page number */}
      {editing ? (
        <form onSubmit={handlePageSubmit} className="flex items-center gap-2">
          <input
            autoFocus
            type="number"
            min={1}
            max={totalPages}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onBlur={handlePageSubmit}
            placeholder={String(page)}
            className="w-16 text-center bg-gray-800 text-white rounded-lg px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <span className="text-gray-400 text-sm">of {totalPages}</span>
        </form>
      ) : (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-yellow-400 transition-colors px-4 py-2 rounded-lg text-sm border border-gray-700 hover:border-yellow-400"
          title="Click to jump to a page"
        >
          Page <span className="text-white font-semibold">{page}</span> of {totalPages}
          <span className="text-xs text-gray-500 ml-1">✎</span>
        </button>
      )}

      {/* Next button */}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === totalPages}
        className="px-4 py-2 bg-gray-800 text-white rounded-lg disabled:opacity-30 hover:bg-gray-700 transition-colors text-sm"
      >
        Next →
      </button>

    </div>
  )
}

export default Pagination