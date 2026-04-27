import { useState, useEffect } from 'react'

/**
 * Custom React Hook: Debounces a value after a delay
 * Delays updating a value until the user has stopped typing.
 * Prevents firing an API call on every single keystroke.
 * Useful for search inputs, filters, and other rapid-change inputs.
 * 
 * @param {string} value - The value to debounce (search input)
 * @param {number} delay - Milliseconds to wait (400ms is a good default)
 * @returns {string} The debounced value
 */
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    // Set a timer to update the debounced value after the delay
    // This timer gets reset every time the value changes
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // If value changes before delay is up, clear the timer and start over
    // This is the "debouncing" part — we only update after user stops typing
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

export default useDebounce