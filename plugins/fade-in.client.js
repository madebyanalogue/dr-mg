import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(() => {
  if (process.server) return

  // IntersectionObserver to reveal elements when scrolled into view
  let observer
  let isPageTransitioning = false
  
  const ensureObserver = () => {
    if (observer) return observer
    observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // If we're transitioning, use the section-based reveal with delays
          // Otherwise, add the class immediately (for scroll-based reveals)
          if (isPageTransitioning) {
            // Don't add class immediately during transitions - let section triggers handle it
            return
          }
          entry.target.classList.add('is-visible')
          observer.unobserve(entry.target)
        }
      })
    }, { root: null, rootMargin: '0px 0px -15% 0px', threshold: 0.1 })
    return observer
  }

  const resetFadeInTargets = (rootEl = document) => {
    // Remove is-visible class from all fade-in elements to reset them for new page
    const allTargets = rootEl.querySelectorAll('[data-fade-in]')
    allTargets.forEach((el) => {
      el.classList.remove('is-visible')
      // Unobserve any previously observed elements
      if (observer) {
        observer.unobserve(el)
      }
    })
  }

  const observeFadeInTargets = (rootEl = document) => {
    const obs = ensureObserver()
    const targets = rootEl.querySelectorAll('[data-fade-in]:not(.is-visible)')
    targets.forEach((el) => obs.observe(el))
  }

  function revealElementsInSection(sectionEl) {
    if (!sectionEl) return
    const targets = sectionEl.querySelectorAll('[data-fade-in]:not([data-fade-in="disabled"])')
    if (!targets || targets.length === 0) return
    targets.forEach((el, index) => {
      // Staggered reveal using global CSS var fallback
      const computed = getComputedStyle(document.documentElement)
      const globalStagger = parseInt(computed.getPropertyValue('--fade-stagger')) || 120
      const globalInitialDelay = parseInt(computed.getPropertyValue('--fade-initial-delay')) || 50
      
      // Check if data-fade-in-delay attribute exists (including 0)
      const customDelay = el.getAttribute('data-fade-in-delay')
      const delayMs = customDelay !== null 
        ? Number(customDelay) 
        : (globalInitialDelay + (index * globalStagger))
      
      // Add visible class after delay (CSS handles the transition)
      setTimeout(() => {
        el.classList.add('is-visible')
      }, delayMs)
    })
  }

  // When a section becomes visible, reveal its targets
  document.addEventListener('section-visible', (e) => {
    const sectionEl = e?.detail?.section
    revealElementsInSection(sectionEl)
  })

  // In case the first sections are marked visible on preloader completion
  if (document.body.classList.contains('preloader-complete')) {
    // No-op; section-triggers will already have fired events for top sections
  } else {
    document.addEventListener('preloader-complete', () => {
      // section-triggers fires visibility for top sections afterward
    }, { once: true })
  }

  // Observe fade-in targets on initial load and after each page transition
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => observeFadeInTargets())
  } else {
    observeFadeInTargets()
  }
  // Reset fade-in elements when page transition starts
  document.addEventListener('page-transition-start', () => {
    isPageTransitioning = true
    resetFadeInTargets()
  })

  document.addEventListener('page-transition-in-complete', () => {
    // Reset and rescan targets on new page
    resetFadeInTargets()
    // Small delay to ensure DOM is ready and CSS transitions can work
    setTimeout(() => {
      isPageTransitioning = false
      observeFadeInTargets()
    }, 100)
  })
  document.addEventListener('route-changed', () => {
    // In case some navigations bypass the page transition hook
    resetFadeInTargets()
    setTimeout(() => {
      isPageTransitioning = false
      observeFadeInTargets()
    }, 100)
  })
})


