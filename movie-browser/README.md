# Movie Browser

A web app for browsing movies from The Movie Database (TMDB) API. Built with React, Vite, React Query and Tailwind CSS

## Features
*Browsable movie grid* with responsive layout
*Movie detail page* with overview, cast, crew, ratings, and runtime
*Dynamic search* with real-time preview and debouncing (300ms)
*4 distinct categories*: All Movies, In Theaters, Coming Soon, Award Winners
*Advanced filtering* by genre, rating, and release year
*Embedded trailers* (YouTube)
*User reviews* section
*Similar movies* recommendations
*Global ranking system* to ensure fair movie rankings across all categories

## Technical Highlights

**Architecture**
*Centralized API layer** (`src/api/tmdb.js`) with intelligent caching
*URL-based state management* — browser back/forward works seamlessly
*React Query* for server state management with automatic caching and refetching
*Custom hooks* (`useDebounce`) for reusable logic
*Component-based structure* with clear separation of concerns

**Design System**
*Cohesive color palette*: Cyan (primary), Emerald (accent), Red (destructive)
*Smooth animations* and transitions
*Loading states* with skeleton cards
*Responsive grid* adapts from mobile to desktop
*Custom scrollbars* for polish

# Setup

## Prerequisites
- Node.js 16+ and npm
- A TMDB API key (free) from https://developer.themoviedb.org/docs/getting-started

## Installation

1. **Clone the repository**
   ```bash
   git clone 
   cd movie-browser

2. Install dependencies
    npm install

3. Setup environment variables
    Copy .env.example to .env
    cp .env.example .env
    add your TMDB API token
    VITE_TMDB_TOKEN=your_bearer_token_here
    Get your token: go to TMDB Settings/API, create an app, and copy your Bearer token.

4. Start the development server
    npm run dev
    opens at http://localhost:PORT (PORT will be the port the server started on)

## Project Structure
src/
├── api/
│   └── tmdb.js              # TMDB API wrapper with caching & sorting
├── components/
│   ├── BackToTop.jsx        # Sticky scroll-to-top button
│   ├── FilterSort.jsx       # Genre/rating/year filters
│   ├── MovieCard.jsx        # Individual movie card
│   ├── MovieModal.jsx       # Movie detail modal
│   ├── Navbar.jsx           # Top navigation with search
│   ├── Pagination.jsx       # Page navigation
│   ├── Reviews.jsx          # User reviews section
│   └── SkeletonCard.jsx     # Loading placeholder
├── hooks/
│   └── useDebounce.js       # Debounce hook for search input
├── pages/
│   ├── Home.jsx             # Main browse page with categories & filters
│   └── MovieDetail.jsx      # Full movie details page
├── App.jsx                  # Router setup
├── App.css                  # Global styles
├── index.css                # Base styles + custom scrollbar
└── main.jsx                 # App entry point

Key Decisions & Problem-Solving
1. Global Ranking System
Problem: Movies in "Award Winners" (highest-rated) were skewing results — a 10-year-old blockbuster would rank higher than recent releases just because it has more votes.

Solution: Built a fetchGlobalRankingMap() that ranks movies by popularity (not rating) across all 300 most popular movies. This ensures fair representation across all categories and prevents recency bias.

2. Search Relevance Sorting
Problem: Searching "Demon" returned "K-pop Demon Hunters" before "Demon" (exact match).

Solution: Implemented 4-tier relevance scoring:

Exact match (score: 1000) → "Demon"
Direct continuation (score: 500) → "Demonlover"
Word boundary (score: 400) → "Demon Slayer", "Demon City"
Contains (score: 100) → "K-pop Demon Hunters"
Within the same tier, sorts alphabetically, then by release date (newest first).

3. Category Separation
Each category uses distinct date ranges to minimize overlap:

All: Entire database sorted by popularity
Now Playing: Released in last 45 days, sorted newest first
Coming Soon: Strictly releases 30+ days from now
Award Winners: All-time top-rated with minimum vote count (100) for credibility
4. URL-Based State Management
Instead of Redux/Context, state is encoded in the URL:

/home?category=now_playing&genres=28,12&page=2
Enables browser back/forward, bookmarking, and sharing
Cleaner than global state for this use case
Available Scripts
Command	Purpose
npm run dev	Start development server
npm run build	Build for production
npm run preview	Preview production build locally
npm run lint	Run ESLint
Technologies Used
Layer	Technology
Runtime	React 19, React Router 7
State Management	React Query 5, URL-based state
Styling	Tailwind CSS 4
Build Tool	Vite 8
Dev Tools	ESLint, Autoprefixer, PostCSS
API	TMDB REST API (free tier)
Performance Optimizations
React Query caching: 5-minute stale time, keeps data fresh without hammering API
Debounced search: 300ms delay prevents excessive API calls
Global ranking cache: 1-hour cache for global ranking map (300 movies)
Lazy loading: Skeleton cards during data fetches
Separate preview endpoint: Search preview fetches only page 1 for instant feedback
API Integration
All API calls go through src/api/tmdb.js:

Centralized error handling
Automatic token injection from .env
Smart caching (global ranking, search results)
Logging for debugging category separation
Example:

Environment Variables
Create a .env file in the root directory:

Never commit .env to Git. It's in .gitignore for security.

To get your token:

Sign up at https://www.themoviedb.org
Go to Settings → API
Create an API application
Copy your Bearer token (not API Key)
Browser Support
Chrome/Edge 88+
Firefox 87+
Safari 14+
Mobile browsers (iOS Safari, Chrome Mobile)
Future Enhancements
User authentication & watchlist
Dark mode toggle
Advanced search (by director, actor, year range)
Movie ratings/reviews from user
Favorites system with localStorage
Performance: Infinite scroll instead of pagination
Accessibility: Full ARIA labels and keyboard navigation
Troubleshooting
Issue	Solution
"Blank page" on load	Check that .env has valid TMDB token
"Failed to fetch" errors	Verify API token is active and not expired
Search not working	Check network tab — TMDB API might be rate-limited
Styling looks wrong	Run npm install and npm run dev again
License
MIT License — feel free to use this project for learning or personal use.

Author
Built as a TMDB API exploration project.
