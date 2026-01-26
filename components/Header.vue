<template>


  <header 
    ref="headerRef" 
    class="scheme"
    :class="{
      'overlay': shouldUseOverlay,
      'light': !shouldUseOverlay
    }"
  >
  
    <div class="header-bar grid header-grid-area px2">
      <div class="header-left">
        <!-- <div class="page-title-container">
          <div class="page-title mono" :data-page-title="pageTitle" ref="pageTitleRef">{{ displayTitle }}</div>
        </div> -->
        <a 
          v-if="bookingLink"
          :href="bookingLink"
          target="_blank"
          rel="noopener"
          class="button header-booking-button"
        >
          {{ bookingTitle }}
        </a>
      </div>
      <NuxtLink
        v-if="!pageData?.hideHeaderLogo"
        to="/"
        class="logo-center"
        @click="handleLogoClick"
      >
        <div id="logo">
          <Logo />
        </div>
      </NuxtLink>
      <div v-else class="logo-center">
        <div class="logo">
          <!-- Empty div to maintain layout when logo is hidden -->
        </div>
      </div>
      
      <div class="header-right flex flex-row flex-center">
        <a 
          v-if="bookingLink"
          :href="bookingLink"
          target="_blank"
          rel="noopener"
          class="button header-booking-button"
        >
          {{ bookingTitle }}
        </a>
        <div class="header-mobile-menu">
          <MobileMenu 
            :is-open="menuOpen" 
            @close-menu="closeMenu" 
          />
          <MenuButton :is-active="menuOpen" @toggle-menu="toggleMenu" />
        </div>
      </div>

    </div>

  </header>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { gsap } from 'gsap';
import { useRoute, useRouter } from '#app';
import { useHeaderScroll } from '~/composables/useHeaderScroll';
import { useSiteSettings } from '~/composables/useSiteSettings';
import Logo from '~/components/Logo.vue';
import MenuButton from '~/components/MenuButton.vue';
import MobileMenu from '~/components/MobileMenu.vue';

const props = defineProps({
  pageData: {
    type: Object,
    required: false,
    default: null
  }
});

// Header animation state
const headerAnimated = ref(false)

const route = useRoute();
const router = useRouter();
const headerRef = ref(null);
const { isHeaderVisible } = useHeaderScroll()
const { settings: siteSettings, bookingLink, bookingTitle } = useSiteSettings()

// Handle logo click - scroll to top if already on homepage, otherwise let NuxtLink handle navigation
const handleLogoClick = (e) => {
  if (route.path === '/') {
    // Already on homepage, prevent navigation and just scroll to top
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  // If not on homepage, let NuxtLink handle the navigation (client-side)
}

// Hero scroll detection
const hasScrolledPastHero = ref(false)

// Determine if we should use overlay scheme
const shouldUseOverlay = computed(() => {
  // If we've scrolled past the hero, use light scheme
  return !hasScrolledPastHero.value
})

// Check if we've scrolled past the hero section
const checkHeroScroll = () => {
  // Find the hero section element
  const heroElement = document.querySelector('.page-hero')
  if (!heroElement) {
    hasScrolledPastHero.value = false
    return
  }

  const heroRect = heroElement.getBoundingClientRect()
  
  // If hero bottom is above the viewport (negative), we've scrolled past it
  hasScrolledPastHero.value = heroRect.bottom < 50
}

// Watch for route changes to detect hero
watch(() => route.path, () => {
  nextTick(() => {
    checkHeroScroll()
  })
}, { immediate: true })

// Set up scroll listener on mount
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', checkHeroScroll, { passive: true })
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', checkHeroScroll)
  }
})

// Website title from Sanity
const websiteTitle = computed(() => siteSettings.value?.title || 'Dr Magdelena Goryczko')

// Deprecated local menu control (kept for layout logic only)
const menuOpen = ref(false)
const isAnimating = ref(false)

// Simple computed property for page title
const pageTitle = computed(() => {
  // Use the page title from Sanity if available
  if (props.pageData?.title) {
    return props.pageData.title;
  }
  
  // Fallback to route meta (for older pages)
  if (route.meta.pageTitle) {
    return route.meta.pageTitle;
  }
  
  // Default to 'Home' for the root path
  if (route.path === '/') {
    return 'Home';
  }
  
  return '';
});

const displayTitle = ref('');
const pageTitleRef = ref(null);

// Watch for page title changes and let the plugin handle transitions
watch(pageTitle, (newTitle) => {
  // Initialize displayTitle if it's empty
  if (!displayTitle.value && newTitle) {
    displayTitle.value = newTitle
  }
  
  if (pageTitleRef.value) {
    // Let the plugin handle the transition
    if (window.handlePageTitleTransition) {
      window.handlePageTitleTransition(newTitle, pageTitleRef.value, displayTitle)
    } else {
      // Fallback: update immediately if plugin not ready
      displayTitle.value = newTitle
    }
  } else {
    // If ref not available yet, just update the display title
    displayTitle.value = newTitle
  }
}, { immediate: true })

// Initialize displayTitle with current page title
onMounted(() => {
  if (!displayTitle.value && pageTitle.value) {
    displayTitle.value = pageTitle.value
  }
})

const updateHeights = () => {
  if (headerRef.value) {
    const headerHeight = headerRef.value.offsetHeight;
    //document.body.style.setProperty('--header-height', `${headerHeight}px`);
  }
};

const initializeMomentumHover = () => {
  if (typeof window !== 'undefined' && window.initializeMomentumHover) {
    console.log('🔴 [Header] Calling momentum hover initialization...')
    window.initializeMomentumHover()
  } else {
    console.log('🔴 [Header] Momentum hover function not available')
  }
}


onMounted(() => {
  window.addEventListener('resize', updateHeights);
  nextTick(() => {
    updateHeights();
    // Enable header scroll animation once header is measured
    if (headerRef.value && window.gsap) {
      // Ensure header starts visible at the top
      window.gsap.set(headerRef.value, { y: '0%', opacity: 1 });
    }
    headerAnimated.value = true;
  });

  // Watch for title changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList' && mutation.target.tagName === 'TITLE') {
        // Title changed
      }
    });
  });

  const titleElement = document.querySelector('title');
  if (titleElement) {
    observer.observe(titleElement, { childList: true });
  }

  onUnmounted(() => {
    window.removeEventListener('resize', updateHeights);
    observer.disconnect();
  });
});

watch(() => route.path, () => {
  nextTick(updateHeights);
});

// Watch for header visibility changes and animate smoothly
watch(isHeaderVisible, (newValue) => {
  if (headerRef.value && headerAnimated.value) {
    if (newValue) {
      // Animate header in
      let duration = 0.4

      // If this visibility change was triggered as part of a page transition,
      // apply instantly (no visible slide-down animation)
      if (typeof document !== 'undefined' && document.body.dataset.headerInstant === '1') {
        duration = 0
        delete document.body.dataset.headerInstant
      }

      gsap.to(headerRef.value, {
        y: '0%',
        opacity: 1,
        duration,
        ease: duration > 0 ? 'power2.out' : 'none'
      })
    } else {
      // Animate header out
      gsap.to(headerRef.value, {
        y: '-100%',
        opacity: 0.8,
        duration: 0.4,
        ease: 'power2.in'
      })
    }
  }
})

// Menu functions
const toggleMenu = () => {
  if (isAnimating.value) return
  
  if (!menuOpen.value) {
    openMenu()
  } else {
    closeMenu()
  }
}

const openMenu = () => {
  isAnimating.value = true
  menuOpen.value = true
  
  // Stop scrolling
  document.body.style.overflow = 'hidden'
  
  setTimeout(() => {
    isAnimating.value = false
  }, 300)
}

const closeMenu = () => {
  isAnimating.value = true
  
  setTimeout(() => {
    menuOpen.value = false
    isAnimating.value = false
    document.body.style.overflow = ''
  }, 300)
}
</script>

<style scoped>



.header-bar {
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  justify-content: space-between;
  display:grid;
  grid-template-areas:
        "left center right";
  gap: 10px;
  height: var(--header-bar-height);
  grid-template-rows: auto;
  /* Initial state will be handled entirely by GSAP */
}
@media all and (min-width: 800px) {
  .header-bar {
    grid-template-areas:
        "left center right";
    grid-template-columns: 1fr auto 1fr;
    gap: 10px;
    grid-template-rows: auto;
  }
}
.header-bar.dark {
  color: var(--color-text, #fff);
  background: transparent;
}
.header-left, .header-right {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
}
.logo-center {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  grid-area: center;
  margin-left: calc(var(--pad-1) * -0.12);
}
@media all and (min-width: 800px) {
  .logo-center {
    grid-area: center;
    margin-left: calc(var(--pad-1) * -0);
  }
  
}
.logo {
  z-index: 1003;
  position: relative;
}


.header-left {
  justify-content: flex-start;
  grid-area: left;
  display: none;
}
@media all and (min-width: 800px) {
  .header-left {
    grid-area: left;
    display: flex;
  }
}
.header-right {
  justify-content: flex-end;
  grid-area: right;
  align-self: stretch;
  gap: 1rem;
  align-items: center;
}

.hamburger {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 1002;
}

.hamburger span {
  display: block;
  width: 28px;
  height: 2px;
  background: currentColor;
  border-radius: 0px;
  transition: all 0.3s;
}

.hamburger span.open:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.hamburger span.open:nth-child(2),
.hamburger span:nth-child(2) {
  opacity: 0;
}

.hamburger span.open:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}

.hamburger.menu-active span {
  background: white;
}

.header-bar {
  position: relative;
  grid-template-areas:
        "left center right";
  grid-template-columns: 1fr auto 1fr;
  grid-template-rows: auto;
  gap: 10px;
}

/* Replacing the previous CSS rule for .header-bar.no-transform-transition */
.header-bar.no-transform-transition {
  transition: none !important;
  transition: background 0.3s, color 0.3s !important;
}

.page-title {
  display: flex;
  align-items: center;
}

.header-right .header-booking-button {
    display: none;
  }
@media (min-width: 800px) {
  .header-left .header-booking-button {
    display: none;
  }
  .header-right .header-booking-button {
    display: block;
  }
}

.header-nav {
  display: none;
  width: 100%;
  height: var(--header-nav-height);
  position: relative;
}
/* .header-bar:after {
  content: '';
  position: absolute;
  left: var(--pad-2);
  right: var(--pad-2);
  width: calc(100% - var(--pad-2) * 2);
  border-bottom: 1px solid currentColor;
  bottom: 0;
} */

/* Hamburger menu always visible */
.header-mobile-menu {
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
  z-index: 10002; /* Ensure hamburger stays above menu backdrop */
}




body:not(.hero-in-view) header {
  color:black;
}

/* Preserve header color during page transitions - keep hero-in-view styling */
body.page-transitioning[data-preserve-hero-view="true"] header {
  color: white;
}

</style> 