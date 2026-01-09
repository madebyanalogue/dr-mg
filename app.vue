<template>
  <ClientOnly>
    <Preloader 
      @preloader-complete="onPreloaderComplete" 
      @preloader-ready="onPreloaderReady" 
    />
  </ClientOnly>
  
  
  <!-- White overlay for page transitions - always in DOM, visibility controlled by class -->
  <div 
    class="page-overlay"
    :class="{ 'page-overlay--visible': showPageOverlay }"
  ></div>

  <!-- Header - persistent outside page transitions so menu doesn't get affected by DOM restructuring -->
  <Header v-if="preloaderReady" :page-data="page" />

  <!-- Page transitions (wrap page content only, header is outside) -->
  <template v-if="!disablePageTransition">
    <Transition
      name="page"
      mode="out-in"
      appear
      @before-leave="onPageBeforeLeave"
      @after-leave="onPageAfterLeave"
      @before-enter="onPageBeforeEnter"
      @after-enter="onPageEnter"
    >
      <div v-if="preloaderReady" class="app-shell" :key="route.fullPath">
        <VisibleGrid />

        <div class="page-container">
          <Suspense>
            <main 
              :style="mainStyle"
            >
              <NuxtPage />
            </main>
          </Suspense>
          <ClientOnly>
            <template #default>
              <Footer
                v-if="!page?.value?.hideFooter"
                :page-data="page"
                :key="route.path"
              />
            </template>
            <template #fallback>
              <!-- No footer during SSR -->
            </template>
          </ClientOnly>
        </div>
      </div>
    </Transition>
  </template>

  <!-- No page transitions: render instantly with no animation -->
  <div v-else-if="preloaderReady" class="app-shell" :key="route.fullPath">
    <VisibleGrid />
    <div class="page-container">
      <Suspense>
        <main 
          :style="mainStyle"
        >
          <NuxtPage />
        </main>
      </Suspense>
      <ClientOnly>
        <template #default>
          <Footer
            v-if="!page?.value?.hideFooter"
            :page-data="page"
            :key="route.path"
          />
        </template>
        <template #fallback>
          <!-- No footer during SSR -->
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup>
import Header from '~/components/Header.vue';
import Footer from '~/components/Footer.vue';
import Preloader from '~/components/Preloader.vue';
import { useDarkMode } from '~/composables/usePageUi.js';
import { useFavicon } from '~/composables/useFavicon.js';
import { usePageSettings } from '~/composables/usePageSettings';
import { useScrollTrigger } from '~/composables/useScrollTrigger.js';
import { computed, onMounted, watch, ref, reactive, nextTick } from 'vue';
import { useRoute } from 'vue-router'
import { useHead, useRouter } from '#app'
import { useSiteSettings } from '~/composables/useSiteSettings'

// Initialize page settings first
const { isDark, page, pending: pagePending } = usePageSettings();
const route = useRoute();
const router = useRouter();
const { disablePreloader, disablePageTransition, defaultHeroVideo } = useSiteSettings()


// Initialize scroll trigger system
const { enableScrollAnimations } = useScrollTrigger();

// Preloader state
const preloaderReady = ref(false)
const isPageTransitioning = ref(false)
const showPageOverlay = ref(false)


// Debug logging for video
if (process.env.NODE_ENV === 'development') {
  watch(() => page?.value, (newPage) => {
    if (newPage) {
      console.log('[app.vue] Page data:', newPage)
      console.log('[app.vue] enableHeroImage:', newPage.enableHeroImage)
      console.log('[app.vue] heroVideo:', newPage.heroVideo)
      console.log('[app.vue] heroVideo?.asset:', newPage.heroVideo?.asset)
      console.log('[app.vue] heroVideo?.asset?.url:', newPage.heroVideo?.asset?.url)
      console.log('[app.vue] featuredImage:', newPage.featuredImage)
    }
  }, { immediate: true })
  
  watch(() => preloaderReady.value, (ready) => {
    console.log('[app.vue] Preloader ready:', ready)
  })
}

// Use custom transition hooks to control scroll position instead of router.scrollBehavior

// Track if this is the initial load (not a client-side navigation)
const isInitialLoad = ref(true)

// Track scroll position before transition
let scrollPositionBeforeTransition = 0

// Handle page transitions
router.beforeEach(() => {
  // Save current scroll position before transition starts
  if (typeof window !== 'undefined') {
    scrollPositionBeforeTransition = window.scrollY || window.pageYOffset
  }
  
  // On client-side navigation (not initial load), temporarily gate animations
  // until hero is ready to ensure consistent load-in styles
  if (isInitialLoad.value === false && typeof document !== 'undefined') {
    // Temporarily remove preloader-ready to gate animations
    // This ensures animations wait for hero content to load, matching refresh behavior
    document.body.classList.remove('preloader-ready')
  }
  
  if (!disablePageTransition.value && isInitialLoad.value === false) {
    isPageTransitioning.value = true
    // Add class to body to prevent footer scroll trigger during transitions
    if (typeof document !== 'undefined') {
      document.body.classList.add('page-transitioning')
      // Preserve hero-in-view class during transition to prevent header color change
      if (document.body.classList.contains('hero-in-view')) {
        document.body.setAttribute('data-preserve-hero-view', 'true')
      }
      // Show overlay IMMEDIATELY via direct DOM manipulation before route changes
      const overlay = document.querySelector('.page-overlay')
      if (overlay) {
        overlay.classList.add('page-overlay--visible')
      }
    }
    // Also set the reactive value for Vue
    showPageOverlay.value = true
  } else {
    // Ensure any stale state is cleared when transitions are disabled
    isPageTransitioning.value = false
    showPageOverlay.value = false // Hide overlay if transitions are disabled
    if (typeof document !== 'undefined') {
      document.body.classList.remove('page-transitioning')
    }
    // If transitions are disabled, scroll immediately
    if (typeof window !== 'undefined' && !window.location.hash) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }
})

router.afterEach((to) => {
  // Keep footer hidden until page transition is complete
  // The footer will be shown again in onPageEnter after fade-in completes
  // Don't scroll here - wait for fade out to complete
})



// Use header height padding - hero is now outside main so doesn't affect padding
const mainPaddingVar = computed(() => {
  //return 'var(--header-height)'
  return '0px'
});

// Background gradient style
const mainStyle = computed(() => {
  const paddingTop = mainPaddingVar.value
  // Default to #ffffff if gradient colors are not set
  const gradientStart = page.value?.backgroundGradientStart || '#ffffff'
  const gradientEnd = page.value?.backgroundGradientEnd || '#ffffff'
  
  return {
    paddingTop,
    background: `linear-gradient(to bottom, ${gradientStart}, ${gradientEnd})`,
    backgroundAttachment: 'fixed',
    minHeight: '100vh',
    position: 'relative',
    zIndex: 2
  }
})





// Set static favicon
useFavicon();

// Add script to head to prevent flash of incorrect mode
useHead({
  script: [
    {
      children: `
        (function() {
          // CDN scripts loaded
          // Ensure consistent initial state on both initial load and refresh
          // Remove preloader-ready class initially to prevent flash
          function setInitialState() {
            if (typeof window !== 'undefined' && typeof document !== 'undefined') {
              // Remove preloader-ready class if it exists (from previous page/refresh)
              // It will be added back when preloader is actually ready
              document.body.classList.remove('preloader-ready');
              
              // Set hero-in-view class immediately on page load to prevent flash
              // On initial load, scrollY is always 0, so hero is in view
              const scrollY = window.scrollY || window.pageYOffset || 0;
              // On page load, scroll is 0, so hero is always in view initially
              if (scrollY === 0) {
                document.body.classList.add('hero-in-view');
              } else {
                // If page loads with scroll position (e.g., from hash link), check properly
                const windowHeight = window.innerHeight || document.documentElement.clientHeight;
                const header = document.querySelector('header');
                const headerHeight = header ? header.offsetHeight : 0;
                const adjustedHeroHeight = windowHeight - (headerHeight / 2);
                const isInView = scrollY < adjustedHeroHeight;
                
                if (isInView) {
                  document.body.classList.add('hero-in-view');
                } else {
                  document.body.classList.remove('hero-in-view');
                }
              }
            }
          }
          
          // Run immediately if DOM is ready, otherwise wait
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setInitialState);
          } else {
            setInitialState();
          }
        })();
      `,
      type: 'text/javascript'
    }
  ],
  style: [
    {
      children: `
        :root {
          --initial-bg: var(--initial-bg-light);
        }
        :root.dark-mode {
          --initial-bg: var(--initial-bg-dark);
        }
        body {
          background-color: var(--initial-bg);
        }
      `
    }
  ]
})

// Preloader ready handler
const onPreloaderReady = () => {
  // Preloader is ready to start, show content
  preloaderReady.value = true
  
  // Enable scrolling on body - ensure class is set consistently
  if (typeof document !== 'undefined') {
    // Use nextTick to ensure DOM is ready
    nextTick(() => {
      document.body.classList.add('preloader-ready')
      // Force a reflow to ensure styles are applied
      void document.body.offsetHeight
    })
  }
}

// Preloader complete handler
const onPreloaderComplete = () => {
  // Preloader animation finished, site is ready
  
  // Enable scroll animations for all elements
  enableScrollAnimations()
}

// Log initial state for debugging
onMounted(() => {
  // Mark that initial load is complete (next navigation will be client-side)
  // Use nextTick to ensure this happens after the first route is loaded
  nextTick(() => {
    isInitialLoad.value = false
  })
  
  // Ensure page starts at top on mount, unless there's a hash (let section-scroll plugin handle it)
  // Also check if we're preserving scroll position for hash navigation
  if (typeof window !== 'undefined') {
    const preserveScroll = sessionStorage.getItem('preserveScroll')
    if (!window.location.hash && !preserveScroll) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
    // Clear the preserve scroll flag
    if (preserveScroll) {
      sessionStorage.removeItem('preserveScroll')
    }
    
    // Ensure preloader-ready class is set if preloader is already ready
    // This helps with consistency between initial load and refresh
    if (preloaderReady.value && !document.body.classList.contains('preloader-ready')) {
      document.body.classList.add('preloader-ready')
    }
  }
})

// Called before page fade-out starts
const onPageBeforeLeave = () => {
  // Save current scroll position
  if (typeof window !== 'undefined') {
    scrollPositionBeforeTransition = window.scrollY || window.pageYOffset
  }
}

// Called after page fade-out completes
const onPageAfterLeave = () => {
  // Old page stays visible, overlay is already showing
  // Content will swap underneath the overlay
  // Don't scroll - maintain current scroll position
}

// Called before page fade-in starts
const onPageBeforeEnter = () => {
  // Page is about to fade in
  // Don't scroll - maintain current scroll position
}

// Called when page fade-in completes; refresh scroll-based systems
const onPageEnter = async () => {
  // Wait for content to be ready before hiding overlay
  // Use nextTick to ensure DOM is updated
  await nextTick()
  
  // Wait for hero content to be ready before hiding overlay
  // This prevents flash of overlay on hero
  const waitForHeroAndHideOverlay = () => {
    const hero = document.querySelector('.page-hero--ready')
    if (hero) {
      // Hero is ready, hide the white overlay - it will fade out
      showPageOverlay.value = false
      
      // Show footer again after overlay starts fading out
      isPageTransitioning.value = false
      
      // Remove page-transitioning class to re-enable footer scroll trigger
      if (typeof document !== 'undefined') {
        document.body.classList.remove('page-transitioning')
        // Remove preserved hero-in-view flag
        document.body.removeAttribute('data-preserve-hero-view')
        
        // Also ensure footer is visible after a brief delay to let CSS apply
        requestAnimationFrame(() => {
          const footer = document.querySelector('footer')
          if (footer) {
            footer.style.opacity = '1'
          }
        })
      }
      
      // On client-side navigation, wait for fade-in to complete before re-enabling animations
      // This ensures the 1800ms fade-in transition isn't interrupted
      if (isInitialLoad.value === false && typeof document !== 'undefined') {
        setTimeout(() => {
          document.body.classList.add('preloader-ready')
        }, 1800) // Wait for fade-in transition to complete
      }
      
      if (typeof window !== 'undefined' && window.gsap && window.gsap.ScrollTrigger) {
        window.gsap.ScrollTrigger.refresh()
      }
      
      // Let fade-in system and others know page content is visible
      // Small delay to ensure footer restoration happens first
      setTimeout(() => {
        document.dispatchEvent(new CustomEvent('page-transition-in-complete'))
      }, 50)
      
      // Dispatch route-changed event for other plugins
      document.dispatchEvent(new CustomEvent('route-changed'))
    } else {
      // Hero not ready yet, check again after a short delay
      setTimeout(waitForHeroAndHideOverlay, 50)
    }
  }
  
  // Start checking for hero after a brief delay to allow PageHero to mount
  setTimeout(() => {
    waitForHeroAndHideOverlay()
    
    // Fallback: hide overlay after 2 seconds even if hero isn't ready
    // (prevents overlay from staying forever)
    setTimeout(() => {
      if (showPageOverlay.value) {
        showPageOverlay.value = false
        isPageTransitioning.value = false
        if (typeof document !== 'undefined') {
          document.body.classList.remove('page-transitioning')
          // Wait for fade-in to complete before re-adding preloader-ready
          setTimeout(() => {
            document.body.classList.add('preloader-ready')
          }, 1800)
        }
      }
    }, 2000)
  }, 100)
}
</script>

<style>
/* White overlay for page transitions */

</style>
