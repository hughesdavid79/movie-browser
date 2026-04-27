import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home.jsx'
import MovieDetail from './pages/MovieDetail.jsx'
import Navbar from './components/Navbar.jsx'
import BackToTop from './components/BackToTop.jsx'

/**
 * App Component
 * Root component that sets up routing and page layout.
 * Uses React Router for client-side navigation between pages.
 * Navbar is displayed on all pages, routes change the main content.
 * 
 * @component
 * @returns {JSX.Element} Rendered app with routing
 */
function App() {
  return (
    <BrowserRouter>
      {/* Navigation bar — visible on all pages */}
      <Navbar />
      
      {/* Page routes — renders either Home or MovieDetail based on URL */}
      <Routes>
        <Route path="/" element={<Home />} />
        {/* Dynamic route parameter :id is movie ID from TMDB */}
        <Route path="/movie/:id" element={<MovieDetail />} />
      </Routes>
      
      {/* Back to top button — visible on all pages when scrolled down */}
      <BackToTop />
    </BrowserRouter>
  )
}

export default App