import { ref, onMounted, onUnmounted, watch } from 'vue'

export function useHeaderScroll() {
  const isHeaderVisible = ref(true)
  const lastScrollY = ref(0)
  const scrollThreshold = 50 // minimum scroll amount before hiding header

  const handleScroll = () => {
  // During page transitions, ignore scroll events to prevent header popping
  if (typeof document !== 'undefined' && document.body.classList.contains('page-transitioning')) {
    return
  }

    const currentScrollY = window.scrollY
    
    // Only trigger if we've scrolled more than the threshold
    if (Math.abs(currentScrollY - lastScrollY.value) < scrollThreshold) {
      return
    }

    // Hide header when scrolling down, show when scrolling up
    isHeaderVisible.value = currentScrollY < lastScrollY.value || currentScrollY < 100
    
    lastScrollY.value = currentScrollY
  }

  onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })

    // When a new page finishes fading in, ensure the header is visible,
    // but let Header.vue decide to show it instantly (no animation).
    const onTransitionComplete = () => {
      if (typeof document !== 'undefined') {
        document.body.dataset.headerInstant = '1'
      }
      isHeaderVisible.value = true
      lastScrollY.value = window.scrollY || 0
    }

    document.addEventListener('page-transition-in-complete', onTransitionComplete)

    onUnmounted(() => {
      document.removeEventListener('page-transition-in-complete', onTransitionComplete)
    })
  })

  onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
  })

  return {
    isHeaderVisible
  }
} 