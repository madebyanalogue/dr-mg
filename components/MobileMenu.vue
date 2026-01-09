<template>
  <div ref="navWrap" data-navigation-status="not-active" class="nav" :class="{ 'nav-open': isOpen }">
    <div ref="overlay" data-navigation-toggle="close" class="overlay" @click="closeMenu"></div>
    <nav ref="menu" class="menu">
      <div ref="backdrop" class="menu-backdrop"></div>
      <div class="menu-inner">
        <MenuList 
          :items="menuItems" 
          @item-click="handleMenuListClick"
        />
        <!-- <div class="menu-details" v-if="hasAnySocials">
          <p ref="socialsTitle" data-menu-fade class="h5">Socials</p>
          <div class="socials-row">
            <a 
              v-if="instagramUrl" 
              ref="instagramLink"
              data-menu-fade 
              :href="instagramUrl" 
              target="_blank" 
              rel="noopener"
              class="p-large text-link"
            >
              Instagram
            </a>
            <a 
              v-if="facebookUrl" 
              ref="facebookLink"
              data-menu-fade 
              :href="facebookUrl" 
              target="_blank" 
              rel="noopener"
              class="p-large text-link"
            >
              Facebook
            </a>
            <a 
              v-if="linkedinUrl" 
              ref="linkedinLink"
              data-menu-fade 
              :href="linkedinUrl" 
              target="_blank" 
              rel="noopener"
              class="p-large text-link"
            >
              LinkedIn
            </a>
          </div>
        </div> -->
      </div>
    </nav>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, watch, ref, nextTick } from 'vue'
import { gsap } from 'gsap'
import { useRoute } from 'vue-router'
import { navigateTo } from '#app'
import { useMenu } from '~/composables/useMenu'
import { useSiteSettings } from '~/composables/useSiteSettings'
import { useUrlProcessing } from '~/composables/useUrlProcessing'
import MenuList from '~/components/MenuList.vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close-menu'])

const route = useRoute()
const { mainMenu } = useMenu()
const { linkedinUrl, instagramUrl, facebookUrl } = useSiteSettings()
const { getProcessedUrl } = useUrlProcessing()

const menuItems = computed(() => mainMenu?.value?.items || [])

// Handle menu list item click
const handleMenuListClick = (item) => {
  if (item?.to?.page?.slug?.current) {
    handleMenuLinkClick(item)
  } else {
    closeMenu()
  }
}

const hasAnySocials = computed(() => {
  const hasLinkedIn = Boolean(linkedinUrl && String(linkedinUrl).trim().length > 0)
  const hasInstagram = Boolean(instagramUrl && String(instagramUrl).trim().length > 0)
  const hasFacebook = Boolean(facebookUrl && String(facebookUrl).trim().length > 0)
  return hasLinkedIn || hasInstagram || hasFacebook
})

const closeMenu = () => {
  // If menu is open, trigger the close animation first
  if (props.isOpen && navWrap.value?.getAttribute("data-nav") === "open") {
    // Start the close animation
    closeNav()
    // Emit close-menu immediately so parent updates state
    // The watch handler will skip because isAnimating is true
    emit('close-menu')
  } else {
    emit('close-menu')
  }
}

// Handle menu link click with animation
const handleMenuLinkClick = (item) => {
  if (!item.to?.page?.slug?.current) return
  
  const targetPath = `/${item.to.page.slug.current}`
  const currentPath = route.path.split('#')[0].replace(/\/$/, '') || '/'
  
  // Scroll to top when clicking a menu item with slower animation
  // If the item has an anchor, the section-scroll plugin will handle scrolling to the section after navigation
  if (typeof window !== 'undefined') {
    const startPosition = window.scrollY || window.pageYOffset
    const startTime = performance.now()
    const duration = 800 // Slower scroll duration in milliseconds
    
    const animateScroll = (currentTime) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth deceleration
      const ease = 1 - Math.pow(1 - progress, 3)
      
      window.scrollTo(0, startPosition * (1 - ease))
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }
    
    requestAnimationFrame(animateScroll)
  }
  
  // If clicking the same page, just close the menu
  if (targetPath === currentPath || (targetPath === '/index' && currentPath === '/') || (targetPath === '/' && currentPath === '/index')) {
    closeMenu()
    return
  }
  
  // If menu is open, trigger the close animation first, then navigate
  if (props.isOpen && navWrap.value?.getAttribute("data-nav") === "open") {
    // Set navigating flag to prevent watch from interfering
    isNavigating = true
    
    // Start the close animation with callback for navigation
    // But emit close-menu immediately to match normal close timing
    closeNavWithCallback(() => {
      // Navigate after animation completes
      navigateTo(targetPath)
      // Reset flag after navigation starts
      setTimeout(() => {
        isNavigating = false
      }, 100)
    })
    // Emit close-menu immediately (same timing as normal closeMenu)
    emit('close-menu')
  } else {
    // Menu already closed, navigate immediately
    navigateTo(targetPath)
  }
}

// GSAP animations
let tl = null
let isAnimating = false
let isNavigating = false // Flag to prevent watch from interfering during navigation

// Refs
const navWrap = ref(null)
const overlay = ref(null)
const menu = ref(null)
const backdrop = ref(null)
const socialsTitle = ref(null)
const linkedinLink = ref(null)
const instagramLink = ref(null)
const facebookLink = ref(null)

// ESC key to close
const handleKeydown = (e) => {
  if (e.key === "Escape" && props.isOpen && navWrap.value?.getAttribute("data-nav") === "open") {
    closeMenu()
  }
}

onMounted(() => {
  // Register custom ease
  if (typeof window !== 'undefined' && window.gsap && window.CustomEase) {
    const gsap = window.gsap
    const CustomEase = window.CustomEase
    
    gsap.registerPlugin(CustomEase)
    CustomEase.create("main", "0.65, 0.01, 0.05, 0.99")
    
    gsap.defaults({
      ease: "main",
      duration: 0.4
    })
  }
  
  // Initialize backdrop position
  if (backdrop.value) {
    gsap.set(backdrop.value, { y: "-100%" })
  }
  
  // Add keyboard listener
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  if (tl) {
    tl.kill()
    tl = null
  }
})

// Watch for menu state changes
watch(() => props.isOpen, async (newValue) => {
  if (isAnimating || isNavigating) return
  
  await nextTick()
  
  if (newValue) {
    openNav()
  } else {
    closeNav()
  }
})

const openNav = () => {
  if (!navWrap.value || !menu.value || isAnimating) return
  
  isAnimating = true
  navWrap.value.setAttribute("data-nav", "open")
  
  // Kill any existing timeline
  if (tl) {
    tl.kill()
  }
  
  tl = gsap.timeline({
    onComplete: () => {
      isAnimating = false
    }
  })
  
  // Get menu links dynamically
  const menuLinks = navWrap.value.querySelectorAll(".menu-link")
  
  // Collect fade targets in DOM order for proper stagger
  const fadeTargets = navWrap.value.querySelectorAll('[data-menu-fade]')
  
  // Check if we're on desktop (horizontal menu)
  const isDesktop = window.innerWidth >= 1000
  
  // Set initial state for backdrop
  if (backdrop.value) {
    gsap.set(backdrop.value, { y: "-100%" })
  }
  
  tl.set(navWrap.value, { display: "block" })
    .to(backdrop.value, 
      { y: "0%", duration: 0.35, ease: "power2.out" }, 
      0
    )
    .fromTo(overlay.value, { autoAlpha: 0 }, { autoAlpha: 1 }, "<+=0.1")
  
  // Sequential fade in for both desktop and mobile
  tl.fromTo(menuLinks, 
    { opacity: 0 }, 
    { opacity: 1, duration: 0.3, stagger: 0.05, ease: "power2.out" }, 
    "<+=0.2"
  )
  .fromTo(fadeTargets, 
    { autoAlpha: 0 }, 
    { autoAlpha: 1, duration: 0.3, stagger: 0.05 }, 
    "<+=0.1"
  )
}

const closeNav = (callback = null) => {
  if (!navWrap.value || !menu.value || isAnimating) return
  
  isAnimating = true
  navWrap.value.setAttribute("data-nav", "closed")
  
  // Ensure menu stays visible during animation
  gsap.set(navWrap.value, { display: "block" })
  
  // Kill any existing timeline
  if (tl) {
    tl.kill()
  }
  
  tl = gsap.timeline({
    onComplete: () => {
      isAnimating = false
      // Hide menu at the same time regardless of callback (for consistent timing)
      gsap.set(navWrap.value, { display: "none" })
      // Call callback if provided (for navigation)
      if (callback) {
        callback()
      }
    }
  })
  
  // Get menu links dynamically
  const menuLinks = navWrap.value.querySelectorAll(".menu-link")
  const fadeTargets = navWrap.value.querySelectorAll('[data-menu-fade]')
  
  // Check if we're on desktop
  const isDesktop = window.innerWidth >= 1000
  
  // Fade out all items together (no stagger)
  tl.to(menuLinks, 
    { opacity: 0, duration: 0.2, ease: "power2.in" }, 
    0
  )
  .to(fadeTargets, 
    { autoAlpha: 0, yPercent: -50 }, 
    "<"
  )
  .to(overlay.value, { autoAlpha: 0 }, "<")
  .to(backdrop.value, 
    { y: "-100%", duration: 0.3, ease: "power2.in" }, 
    "<"
  )
}

// Wrapper function for closing nav with callback
const closeNavWithCallback = (callback) => {
  closeNav(callback)
}
</script>

<style scoped>
.nav {
  z-index: 10000;
  width: 100%;
  height: 100svh;
  margin-left: auto;
  margin-right: auto;
  display: none;
  position: fixed;
  inset: 0%;
}

.menu {
  position: relative;
  z-index: 1;
  width: 100%;
  display: flex;
  align-items: start;
  justify-content: center;
}

.menu-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgb(var(--white));
  z-index: 0;
  will-change: transform;
}

.menu-inner {
  z-index: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: center;
  padding: var(--pad-3);
}

@media (min-width: 1000px) {
  .menu {
    align-items: flex-start;
    justify-content: flex-start;
    height: auto;
    padding-top: 0;
  }
  
  .menu-inner {
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    height: var(--header-bar-height, 60px);
    width: 100%;
    padding: 0;
    padding-right: var(--pad-2);
  }
}

/* Menu list styles moved to main.css for shared use */
/* Add padding for hamburger overlap on desktop */
@media (min-width: 1000px) {
  .menu-list {
    padding-right: calc(var(--pad-2) + 60px);
  }
}


.menu-details {
  grid-column-gap: 1.25em;
  grid-row-gap: 1.25em;
  flex-flow: column;
  justify-content: flex-start;
  align-items: flex-start;
  padding-left: 2em;
  display: flex;
}

@media (min-width: 1000px) {
  .menu-details {
    display: none;
  }
}

.socials-row {
  grid-column-gap: 1.5em;
  grid-row-gap: 1.5em;
  flex-flow: row;
  display: flex;
}

.p-large.text-link {
  color: var(--white);
  text-decoration: none;
  transition: color 0.3s ease;
}

.p-large.text-link:hover {
  color: var(--white);
}

.overlay {
  z-index: 0;
  cursor: pointer;
  background-color: rgba(19, 19, 19, 0.4);
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0%;
}
.nav-open .overlay {
  pointer-events: all;
}

</style>

