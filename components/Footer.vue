<template>
  <div>
    <footer class="scheme dark">
      <div id="footer" class="py4 grid grid-1 gap-2">



        <div class="wrapper">

          <div class="grid grid-1 gap-8 gap-12-sm" data-fade-in>

            <!-- FOOTER MENU -->
            <div class="flex flex-end-md">
              <div v-if="footerMenu && footerMenu.items && footerMenu.items.length > 0" class="footer-menu-wrapper">
                <div class="footer-menu">
                  <div class="grid grid-1 gap-1">
                    <ul class="menu-list">
                      <li
                        v-for="(item, index) in footerMenu.items"
                        :key="item._key || item.text"
                        class="menu-list-item"
                        data-fade-in
                        :data-fade-in-delay="index * 100"
                      >
                        <NuxtLink 
                          v-if="getMenuItemUrl(item) && !isExternalUrl(item.to?.url)" 
                          :to="getMenuItemUrl(item)" 
                          class="menu-link"
                          :class="{ 'menu-link--current': isCurrentFooterItem(item) }"
                          @click="handleFooterLinkClick($event, item)"
                        >
                          <span class="menu-link-text">{{ item.text }}</span>
                        </NuxtLink>
                        <a 
                          v-else-if="getMenuItemUrl(item) && isExternalUrl(item.to?.url)"
                          :href="getMenuItemUrl(item)" 
                          target="_blank"
                          rel="noopener"
                          class="menu-link"
                        >
                          <span class="menu-link-text">{{ item.text }}</span>
                        </a>
                        <span v-else class="menu-link-text">{{ item.text }}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex flex-between flex-bottom">
              <!-- COPYRIGHT & CREDITS -->
              <div class="copyright-credits-wrapper flex gap-2">
                <div v-if="copyrightText" class="h5 medium" v-html="copyrightText"></div>
                <div v-if="creditsText" class="footer-credits">
                  <div class="h5" v-html="creditsText"></div>
                </div>
              </div>
              <!-- Back to Top Button -->
              <BackToTop :page-data="pageData" />
            </div>

          </div>

        </div>
      </div>
    </footer>
    
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { useSiteSettings } from '~/composables/useSiteSettings';
import { useMenu } from '~/composables/useMenu';
import imageUrlBuilder from '@sanity/image-url'
import { computed, onMounted, onUnmounted, ref, nextTick } from 'vue';
import SanityBlocks from '~/components/SanityBlocks.vue';
import BackToTop from '~/components/BackToTop.vue';

const props = defineProps({
  pageData: {
    type: Object,
    required: false,
    default: null
  }
});

// Sanity image URL builder
const builder = imageUrlBuilder({ projectId: '0hcfi5z2', dataset: 'production' })
const $urlFor = (source) => builder.image(source)

const route = useRoute();
const { 
  contactInfo, 
  facebookUrl,
  linkedinUrl,
  instagramUrl,
  openingTimes,
  title,
  disablePreloader,
  footerMenu,
  copyright,
  credits
} = useSiteSettings();

// Website title from Sanity
const websiteTitle = computed(() => title.value || 'Dr Magdelena Goryczko');

// Process copyright text with [year] shortcode
const copyrightText = computed(() => {
  if (!copyright.value) return ''
  const currentYear = new Date().getFullYear()
  return copyright.value.replace(/\[year\]/g, currentYear.toString())
})

// Process credits text
const creditsText = computed(() => {
  if (!credits.value) return ''
  // Replace line breaks with <br> tags
  return credits.value.replace(/\n/g, '<br>')
})

// Helper function to check if URL is external (including mailto/tel/custom domains)
const isExternalUrl = (url) => {
  if (!url) return false
  // Explicit external protocols
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return true
  if (url.startsWith('mailto:') || url.startsWith('tel:')) return true
  // Treat any URL that doesn't start with "/" or "#" as external (e.g. example.com)
  return !url.startsWith('/') && !url.startsWith('#')
}

// If the footer link points to the current page, scroll to top instead of re-navigating
const handleFooterLinkClick = (event, item) => {
  if (!isCurrentFooterItem(item)) {
    // Different page: let NuxtLink handle navigation + transitions
    return
  }
  
  // Same page: prevent navigation and just scroll to top smoothly
  event.preventDefault()
  
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Determine if a footer menu item points to the current page (same logic as header / main menu)
const isCurrentFooterItem = (item) => {
  if (!item.to?.page?.slug?.current) return false
  
  const itemSlug = item.to.page.slug.current
  const itemPath = itemSlug === 'index' ? '/' : `/${itemSlug}`
  const currentPath = route.path.split('#')[0].replace(/\/$/, '') || '/'
  const normalizedCurrentPath = currentPath === '/index' ? '/' : currentPath
  const itemPathClean = itemPath.split('#')[0].replace(/\/$/, '') || '/'
  
  // Special handling for homepage
  if (normalizedCurrentPath === '/' && (itemPathClean === '/' || itemSlug === 'index')) {
    return true
  }
  
  // Don't treat other items as current when we're on home
  if (itemPathClean === '/') {
    return false
  }
  
  // Match exact path or nested paths (e.g. /services and /services/treatments)
  return (
    normalizedCurrentPath === itemPathClean ||
    normalizedCurrentPath.startsWith(itemPathClean + '/')
  )
}

// Helper function to get menu item URL
const getMenuItemUrl = (item) => {
  if (item.to?.page?.slug?.current) {
    let url = `/${item.to.page.slug.current}`
    // Append anchor if provided
    if (item.to?.anchor) {
      const anchor = item.to.anchor.startsWith('#') ? item.to.anchor : `#${item.to.anchor}`
      url += anchor
    }
    return url
  }
  if (item.to?.url) {
    return getProcessedUrl(item.to.url)
  }
  return null
}

// Function to process external URLs consistently
const getProcessedUrl = (url) => {
  if (!url) return '#'
  
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  } else if (url.startsWith('//')) {
    // Protocol-relative URL
    return `https:${url}`
  } else if (url.startsWith('/')) {
    // Absolute path on same domain
    return url
  } else {
    // Relative URL or domain without protocol - treat as external
    return `https://${url}`
  }
}

// Function to format day names for display
const formatDay = (day) => {
  const dayMap = {
    monday: 'Monday',
    tuesday: 'Tuesday',
    wednesday: 'Wednesday',
    thursday: 'Thursday',
    friday: 'Friday',
    saturday: 'Saturday',
    sunday: 'Sunday'
  }
  return dayMap[day] || day
}

// Split contact info into two halves for equal distribution across columns
const firstHalfContactInfo = computed(() => {
  if (!contactInfo?.value) return [];
  const midPoint = Math.ceil(contactInfo.value.length / 2);
  return contactInfo.value.slice(0, midPoint);
});

const secondHalfContactInfo = computed(() => {
  if (!contactInfo?.value) return [];
  const midPoint = Math.ceil(contactInfo.value.length / 2);
  return contactInfo.value.slice(midPoint);
});

// Subfooter reveal on scroll
const subfooterRef = ref(null)
const footerRootRef = ref(null)
const footerRef = ref(null)
let onScrollHandler = null
let footerObserver = null
let checkFooterVisibilityHandler = null
let restoreFooterAfterTransition = null

onMounted(() => {
  nextTick(() => {
    const subfooterEl = subfooterRef.value
    const footerRoot = document.getElementById('footer')
    footerRootRef.value = footerRoot || null
    if (!subfooterEl || !footerRoot) return

    // Get the footer element for IntersectionObserver
    footerRef.value = footerRoot
    
    // Ensure footer is visible if page is not transitioning
    if (!document.body.classList.contains('page-transitioning')) {
      footerRoot.style.opacity = '1'
    }

    // Function to trigger fade-in animations
    const triggerFadeIn = () => {
      if (!footerRoot) return
      
      // Make sure wrapper is visible first (remove inline opacity if set)
      const wrapper = footerRoot.querySelector('.wrapper')
      if (wrapper) {
        // If wrapper has opacity 0, set it to 1 first
        if (wrapper.style.opacity === '0' || getComputedStyle(wrapper).opacity === '0') {
          wrapper.style.transition = 'opacity 600ms ease'
          wrapper.style.opacity = '1'
          // Wait for wrapper to be visible before triggering fade-in
          setTimeout(() => {
            doFadeIn()
          }, 100)
          return
        }
      }
      
      doFadeIn()
    }
    
    const doFadeIn = () => {
      if (!footerRoot) return
      const fadeInElements = footerRoot.querySelectorAll('[data-fade-in]:not(.is-visible)')
      if (fadeInElements.length === 0) return // Already triggered
      
      fadeInElements.forEach((el) => {
        // Get delay from attribute or use default
        const delayAttr = el.getAttribute('data-fade-in-delay')
        const delay = delayAttr !== null ? parseInt(delayAttr) : 0
        
        setTimeout(() => {
          el.classList.add('is-visible')
        }, delay)
      })
    }

    // Set up IntersectionObserver for fade-in animations
    const setupFooterFadeIn = () => {
      if (!footerRoot) return
      
      // If observer already exists, don't set up again
      if (footerObserver) return

      // Helper function to check if all menu items are visible
      const checkAllItemsVisible = () => {
        const menuItems = footerRoot.querySelectorAll('.menu-list-item[data-fade-in]')
        if (menuItems.length === 0) return true // No menu items, consider "all visible"
        
        const viewportHeight = window.innerHeight
        return Array.from(menuItems).every(item => {
          const itemRect = item.getBoundingClientRect()
          // Item is visible if it's within the viewport (with 50px buffer at bottom)
          return itemRect.top < viewportHeight && itemRect.bottom > -50
        })
      }
      
      // Check if footer is already in view
      const rect = footerRoot.getBoundingClientRect()
      const isInView = rect.top < window.innerHeight && rect.bottom > 0
      
      if (isInView && checkAllItemsVisible()) {
        // Footer is in view and all items are visible, trigger immediately
        triggerFadeIn()
      } else {
        // Create observer to watch when footer enters viewport
        footerObserver = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                // Check if all menu items are in view before triggering
                const menuItems = footerRoot.querySelectorAll('.menu-list-item[data-fade-in]')
                if (menuItems.length > 0) {
                  // Check if all menu items are visible (with some buffer)
                  const viewportHeight = window.innerHeight
                  const allItemsVisible = Array.from(menuItems).every(item => {
                    const rect = item.getBoundingClientRect()
                    // Item is visible if it's within the viewport (with 50px buffer at bottom)
                    return rect.top < viewportHeight && rect.bottom > -50
                  })
                  
                  // If all items are visible, trigger fade-in
                  if (allItemsVisible) {
                    triggerFadeIn()
                    // Stop observing once triggered
                    if (footerObserver) {
                      footerObserver.unobserve(entry.target)
                      footerObserver.disconnect()
                      footerObserver = null
                    }
                  }
                } else {
                  // No menu items, trigger immediately when footer is in view
                  triggerFadeIn()
                  if (footerObserver) {
                    footerObserver.unobserve(entry.target)
                    footerObserver.disconnect()
                    footerObserver = null
                  }
                }
              }
            })
          },
          {
            root: null,
            rootMargin: '0px 0px 0px 0px',
            threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5] // Multiple thresholds to check visibility at different levels
          }
        )

        footerObserver.observe(footerRoot)
      }
    }
    
    // Set up fade-in observer immediately
    setupFooterFadeIn()
    
    // Also check on scroll as a fallback
    checkFooterVisibilityHandler = () => {
      if (!footerRoot) return
      const rect = footerRoot.getBoundingClientRect()
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        // Check if all menu items are visible before triggering
        const menuItems = footerRoot.querySelectorAll('.menu-list-item[data-fade-in]')
        if (menuItems.length > 0) {
          const viewportHeight = window.innerHeight
          const allItemsVisible = Array.from(menuItems).every(item => {
            const itemRect = item.getBoundingClientRect()
            // Item is visible if it's within the viewport (with 50px buffer at bottom)
            return itemRect.top < viewportHeight && itemRect.bottom > -50
          })
          
          if (allItemsVisible) {
            triggerFadeIn()
            // Remove listener once triggered
            if (checkFooterVisibilityHandler) {
              window.removeEventListener('scroll', checkFooterVisibilityHandler)
            }
          }
        } else {
          // No menu items, trigger immediately
          triggerFadeIn()
          // Remove listener once triggered
          if (checkFooterVisibilityHandler) {
            window.removeEventListener('scroll', checkFooterVisibilityHandler)
          }
        }
      }
    }
    
    // Add scroll listener as fallback
    window.addEventListener('scroll', checkFooterVisibilityHandler, { passive: true })

    // If preloader is disabled, reveal immediately and skip gating
    if (disablePreloader.value) {
      // Reveal subfooter
      subfooterEl.style.transform = 'scaleY(1)'
      const subContentImmediate = subfooterEl.querySelector('.wrapper')
      if (subContentImmediate) subContentImmediate.style.opacity = '1'
      subfooterEl.dataset.revealed = '1'
      // Reveal footer wrappers
      const immediateBlocks = footerRoot.querySelectorAll(':scope > .wrapper')
      immediateBlocks.forEach((blk) => {
        blk.style.opacity = '1'
      })
      footerRoot.dataset.revealed = '1'
      return
    }

    // Initial state for subfooter container and its content
    subfooterEl.style.transformOrigin = 'bottom'
    subfooterEl.style.transform = 'scaleY(0)'
    const subContent = subfooterEl.querySelector('.wrapper')
    if (subContent) subContent.style.opacity = '0'

    // Initial state for footer contents (wrappers)
    const footerBlocks = footerRoot.querySelectorAll(':scope > .wrapper')
    footerBlocks.forEach((blk) => {
      blk.style.opacity = '0'
    })

    const revealFooter = () => {
      // Skip if page is transitioning (footer will be revealed via fade-in)
      if (document.body.classList.contains('page-transitioning')) {
        return
      }
      
      // Reveal subfooter (scale then fade its content)
      if (subfooterEl && !subfooterEl.dataset.revealed) {
        subfooterEl.dataset.revealed = '1'
        subfooterEl.style.transition = 'transform 700ms cubic-bezier(0.5, 0.5, 0, 1)'
        subfooterEl.style.transform = 'scaleY(1)'
        setTimeout(() => {
          if (subContent) {
            subContent.style.transition = 'opacity 600ms ease'
            subContent.style.opacity = '1'
          }
        }, 720)
      }

      // Sequentially fade in footer blocks
      if (footerRoot && !footerRoot.dataset.revealed) {
        footerRoot.dataset.revealed = '1'
        const blocks = footerRoot.querySelectorAll(':scope > .wrapper')
        const maxDelay = blocks.length * 180
        blocks.forEach((blk, i) => {
          setTimeout(() => {
            blk.style.transition = 'opacity 600ms ease'
            blk.style.opacity = '1'
          }, i * 180)
        })
        // Trigger fade-in animations after wrapper is fully revealed
        setTimeout(() => {
          triggerFadeIn()
        }, maxDelay + 100)
      }
    }

    const bottomReached = () => {
      const doc = document.documentElement
      const reached = window.innerHeight + window.scrollY >= (doc.scrollHeight - 300)
      return reached
    }

    const onScroll = () => {
      if (bottomReached()) {
        revealFooter()
        window.removeEventListener('scroll', onScrollHandler)
      }
    }
    onScrollHandler = onScroll

    // Hook into global section flow: after preloader completes, start listening for bottom reach
    const startListening = () => {
      window.addEventListener('scroll', onScrollHandler)
      // Check immediately in case we're already at bottom (short pages)
      onScrollHandler()
    }

    if (document.body.classList.contains('preloader-complete')) {
      startListening()
    } else {
      document.addEventListener('preloader-complete', startListening, { once: true })
    }

    // Restore footer opacity after page transitions complete
    restoreFooterAfterTransition = () => {
      if (!footerRoot) return
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        // Force remove any inline opacity styles that might conflict
        footerRoot.style.removeProperty('opacity')
        // Ensure footer is visible
        footerRoot.style.opacity = '1'
        
        const wrapper = footerRoot.querySelector('.wrapper')
        if (wrapper && footerRoot.dataset.revealed === '1') {
          // Footer was already revealed, restore its opacity
          wrapper.style.opacity = '1'
        }
      })
    }

    // Listen for page transition completion
    document.addEventListener('page-transition-in-complete', restoreFooterAfterTransition)
  })
})

onUnmounted(() => {
  if (onScrollHandler) {
    window.removeEventListener('scroll', onScrollHandler)
  }
  if (footerObserver) {
    footerObserver.disconnect()
    footerObserver = null
  }
  // Remove scroll listener for fade-in check
  if (checkFooterVisibilityHandler) {
    window.removeEventListener('scroll', checkFooterVisibilityHandler)
    checkFooterVisibilityHandler = null
  }
  // Remove page transition listener
  if (restoreFooterAfterTransition) {
    document.removeEventListener('page-transition-in-complete', restoreFooterAfterTransition)
    restoreFooterAfterTransition = null
  }
})
</script>

<style scoped>

  @media (max-width: 999px) {
    .copyright-credits-wrapper {
      flex-direction: column-reverse;
      align-items: flex-start;
      gap: var(--pad-1);
    }
    .menu-list {
      grid-template-columns: repeat(2, 1fr);
      display: grid;
      gap: var(--pad-1) var(--pad-5);
    }
    .menu-link {
      padding: 5px 0px;
      border-radius: 0;
    }
    .menu-link:hover {
      background-color: rgba(var(--black), 0.0);
    }
  }

</style> 