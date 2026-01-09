import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin((nuxtApp) => {
  if (process.server) return

  let pendingHash = null
  let scrollTimeout = null

  // Function to scroll to a section by ID
  const scrollToSection = (sectionId, delay = 0) => {
    if (!sectionId) return

    // Clear any existing timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout)
    }

    // Remove # if present
    const id = sectionId.startsWith('#') ? sectionId.slice(1) : sectionId

    const performScroll = () => {
      // Try multiple times with increasing delays to ensure element exists
      let attempts = 0
      const maxAttempts = 10
      
      const tryScroll = () => {
        const element = document.getElementById(id)
        if (element) {
          // Get header height for offset (adjust as needed)
          const header = document.querySelector('header')
          const headerHeight = header ? header.offsetHeight : 0
          const offset = headerHeight + 20 // Add 20px padding

          // Calculate position
          const elementPosition = element.getBoundingClientRect().top
          const offsetPosition = elementPosition + window.pageYOffset - offset

          // Smooth scroll to section
          window.scrollTo({
            top: Math.max(0, offsetPosition), // Ensure not negative
            behavior: 'smooth'
          })
          return true
        } else if (attempts < maxAttempts) {
          attempts++
          // Retry after a short delay
          setTimeout(tryScroll, 100)
          return false
        }
        return false
      }

      // Start trying to scroll
      setTimeout(tryScroll, delay)
    }

    scrollTimeout = setTimeout(performScroll, delay)
  }

  // Prevent default scroll behavior when navigating with hash
  nuxtApp.$router.beforeEach((to, from, next) => {
    if (to.hash) {
      // Store the hash for later scrolling
      pendingHash = to.hash
      // Prevent scroll to top by setting scroll position to current position
      // This prevents the default scroll-to-top behavior
      if (typeof window !== 'undefined' && window.scrollY > 0) {
        // Keep current scroll position temporarily
        sessionStorage.setItem('preserveScroll', 'true')
      }
    } else {
      sessionStorage.removeItem('preserveScroll')
    }
    next()
  })

  // Handle route changes with hash
  nuxtApp.$router.afterEach((to) => {
    if (to.hash) {
      pendingHash = to.hash
      // Don't scroll immediately - wait for page to load
    } else {
      pendingHash = null
    }
  })

  // Listen for page transition completion event - this is the key trigger
  const handlePageReady = () => {
    // Use pendingHash if available, otherwise check window.location.hash
    const hashToScroll = pendingHash || window.location.hash
    
    if (hashToScroll) {
      // Wait a bit longer to ensure all content is rendered and page is stable
      // This creates the "pause" effect the user wants
      scrollToSection(hashToScroll, 600) // 600ms pause before scrolling
      pendingHash = null
    }
  }

  // Listen for page transition completion - primary trigger
  document.addEventListener('page-transition-in-complete', () => {
    // Add a small delay to ensure DOM is fully ready
    setTimeout(handlePageReady, 100)
  })
  
  // Also listen for route-changed event as backup
  document.addEventListener('route-changed', () => {
    if (pendingHash || window.location.hash) {
      setTimeout(handlePageReady, 200)
    }
  })

  // Also listen for when Suspense resolves (page content loaded)
  document.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash) {
      scrollToSection(window.location.hash, 300)
    }
  })

  // Handle initial page load with hash
  if (window.location.hash && document.readyState === 'complete') {
    scrollToSection(window.location.hash, 300)
  }

  // Also listen for hashchange events (for same-page navigation)
  window.addEventListener('hashchange', () => {
    scrollToSection(window.location.hash, 100)
  })
})

