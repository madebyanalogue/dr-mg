<template>
  <!-- Colored background layers - siblings to preloader -->
  <div v-if="!disablePreloader" ref="preloaderBg" class="preloader-bg">
    <div ref="bgPanel1" class="bg-panel first"></div>
    <div ref="bgPanel2" class="bg-panel second"></div>
    <div ref="bgPanel3" class="bg-panel third"></div>
  </div>
  
  <div 
    v-show="showPreloader" 
    class="preloader-container"
    data-loading-container
  >
    <div class="preloader-content">
      <!-- Image sequence container -->
      <div 
        class="image-sequence"
        data-loading-words
      >
          <div class="image-container">
            <!-- Preloader images removed from settings; keep container for potential future use -->
          </div>
      </div>

      <div class="website-icon-container">
        <!-- Show SVG content if it's an SVG, otherwise show as image -->
        <div 
          v-if="logotypeSvgContent"
          v-html="logotypeSvgContent"
          class="logotype-svg"
        />
        <img 
          v-else-if="logotypeImageUrl"
          :src="logotypeImageUrl"
          :alt="websiteTitle"
          class="logotype-image"
        />
      </div>
      
      <!-- Website title container -->
      <div 
        class="title-sequence"
        data-loading-words
      >
        <div class="title-container">
          <h1 class="website-title">{{ websiteTitle }}</h1>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useSiteSettings } from '~/composables/useSiteSettings'
import { useSanityImage } from '~/composables/useSanityImage'

const props = defineProps({
  autoHide: {
    type: Boolean,
    default: true
  },
  imageDuration: {
    type: Number,
    default: 0 // milliseconds per image (instant transitions)
  },
  titleDuration: {
    type: Number,
    default: 0 // milliseconds for title display (instant)
  }
})

const emit = defineEmits(['preloader-complete', 'preloader-ready'])

const { getImageUrl } = useSanityImage()
const { settings: siteSettings, disablePreloader } = useSiteSettings()

// Preloader state - respect disablePreloader flag
const showPreloader = ref(true)
const currentImageIndex = ref(0)
const animationInitialized = ref(false)

// Refs for background panels
const preloaderBg = ref(null)
const bgPanel1 = ref(null)
const bgPanel2 = ref(null)
const bgPanel3 = ref(null)

// Computed properties
const websiteTitle = computed(() => siteSettings.value?.title || 'Dr Magdelena Goryczko')
const logotypeImageUrl = computed(() => {
  const logotype = siteSettings.value?.logotype
  if (!logotype?.asset?.url) return null
  return getImageUrl(logotype)
})

const logotypeSvgContent = ref(null)

// Check if logotype is SVG and fetch its content
const fetchLogotypeSvg = async () => {
  const logotype = siteSettings.value?.logotype
  if (!logotype?.asset?.url) return
  
  const url = getImageUrl(logotype)
  const isSvg = url.toLowerCase().includes('.svg') || logotype.asset.extension === 'svg'
  
  if (isSvg) {
    try {
      // Use the proxy endpoint to avoid CORS issues
      const proxyUrl = `/api/proxy-svg?url=${encodeURIComponent(url)}`
      const response = await fetch(proxyUrl)
      if (response.ok) {
        const svgText = await response.text()
        logotypeSvgContent.value = svgText
      } else {
        console.warn('Failed to fetch SVG content via proxy:', response.status)
        logotypeSvgContent.value = null
      }
    } catch (error) {
      console.warn('Failed to fetch SVG content:', error)
      logotypeSvgContent.value = null
    }
  } else {
    logotypeSvgContent.value = null
  }
}
// Animation timeline
let animationTimeline = null

// Initialize preloader animation
const initPreloaderAnimation = () => {
  if (typeof window === 'undefined' || animationInitialized.value) return
  // gsap is provided by plugin
  // @ts-ignore
  const gsap = window.gsap

  // Prevent page scrolling during intro
  const htmlEl = document.documentElement
  const bodyEl = document.body
  if (htmlEl && bodyEl) {
    htmlEl.style.overflow = 'hidden'
    bodyEl.style.overflow = 'hidden'
  }
  
  // Create timeline
  animationTimeline = gsap.timeline({
    onComplete: () => {
      if (props.autoHide) {
        hidePreloader()
      }
      emit('preloader-complete')
    }
  })
  
  // Calculate transform values for logo animation
  // Container has align-items: start, logo starts with transform Y to center it, animates to 0
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0
  
  // Measure the actual logo container height (more robust than relying on CSS vars)
  let logoHeight = 80 // sensible default
  const logoContainer = document.querySelector('.website-icon-container')
  if (logoContainer && logoContainer instanceof HTMLElement) {
    const rect = logoContainer.getBoundingClientRect()
    if (rect && rect.height > 0) {
      logoHeight = rect.height
    }
  }
  
  // Start with logo offset: half viewport height minus half logo height to center it
  const startY = (viewportHeight / 2) - (logoHeight / 2)
  const endY = 0 // Animate to 0 to move to top
  
  // Always use simple logo-only animation (preloader images removed)
  // Hide image sequence immediately
  animationTimeline.set('.image-sequence', { opacity: 0 })
  
  // Show logotype with fade in vertically centered (slowed down)
  animationTimeline.set('.website-icon-container', { 
    opacity: 0, 
    visibility: 'visible',
    y: startY // Start at center (0 offset since flexbox centers it)
  })
  animationTimeline.to('.website-icon-container', { 
    opacity: 1, 
    duration: 2.0, 
    ease: "power2.out" 
  })
  
  // Hold for a moment then translate logo up to top (slowed down)
  const holdTime = 1.0 // Hold for 1 second after fade in
  const exitTime = 1.2 // Exit animation duration (slowed down)
  
  // Animate logo transform Y from startY to endY (center to top)
  animationTimeline.to('.website-icon-container', {
    y: endY, // Animate to top of screen
    duration: exitTime,
    ease: "power2.inOut",
    onComplete: () => {
      // Set final position to ensure logo touches the very top
      const logoElement = document.querySelector('.website-icon-container')
      if (logoElement) {
        gsap.set(logoElement, {
          position: 'absolute',
          top: '0px',
          left: '50%',
          transform: 'translateX(-50%)',
          y: 0
        })
      }
      // Hide preloader but keep in DOM
      showPreloader.value = false
      // Emit preloader complete event for section triggers
      document.dispatchEvent(new CustomEvent('preloader-complete'))
      // Add class to body so plugins can detect completion
      document.body.classList.add('preloader-complete')
    }
  }, holdTime)
  
  // Animate preloader-bg container independently with its own timing
  const backdropStart = holdTime // Start at same time as logo movement
  const backdropDuration = exitTime + 0.4 // Slightly longer duration for backdrop
  animationTimeline.to(preloaderBg.value, {
    y: '-100%',
    duration: backdropDuration,
    ease: "power2.inOut"
  }, backdropStart) // Independent start time
}

// Hide preloader manually
const hidePreloader = () => {
  showPreloader.value = false
  // Re-enable scrolling
  const htmlEl = document.documentElement
  const bodyEl = document.body
  if (htmlEl && bodyEl) {
    htmlEl.style.overflow = ''
    bodyEl.style.overflow = ''
  }
}

// Watch for site settings to be loaded
watch(siteSettings, async (newSettings) => {
  // Prevent multiple initializations
  if (animationInitialized.value) {
    return
  }
  
  if (disablePreloader.value) {
    // Immediately hide and mark complete, skip animations
    showPreloader.value = false
    if (typeof document !== 'undefined') {
      document.body.classList.add('preloader-complete')
      document.body.classList.add('preloader-ready')
    }
    emit('preloader-ready')
    emit('preloader-complete')
    animationInitialized.value = true
    return
  }
  
  if (newSettings) {
    // Fetch SVG content if logotype is SVG
    await fetchLogotypeSvg()
    
    // Ensure consistent timing regardless of cache state
    // Use requestAnimationFrame to ensure DOM is ready
    await new Promise(resolve => {
      if (typeof window !== 'undefined') {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            resolve()
          })
        })
      } else {
        setTimeout(resolve, 100)
      }
    })
    
    // Emit ready event before starting animation
    emit('preloader-ready')
    initPreloaderAnimation()
    animationInitialized.value = true
  }
}, { immediate: true })

// Cleanup on unmount
onUnmounted(() => {
  if (animationTimeline) {
    animationTimeline.kill()
    animationTimeline = null
  }
  animationInitialized.value = false
})
</script>

<style scoped>
.preloader-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100svh;
  background: transparent; /* Remove white background so layers show through */
  z-index: 99999;
  display: flex;
  align-items: start;
  justify-content: center;
  color:var(--color-text);
}

.preloader-bg {
  z-index: 99998; /* Just below preloader */
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100svh;
  pointer-events: none; /* Don't interfere with interactions */
}

.bg-panel {
  z-index: 1;
  background-color: var(--white);
  position: absolute;
  inset: 0%;
  height: 100%;
  width: 100%;
}

.bg-panel.first {
  background-color: var(--yellow); /* Red for debugging */
  z-index: 3;
  opacity: 1;
}

.bg-panel.second {
  background-color: var(--dark-grey); /* Green for debugging */
  z-index: 2;
  opacity: 0;
}

.bg-panel.third {
  background-color: var(--light-grey); /* Blue for debugging */
  z-index: 1;
  opacity: 0;
}

.preloader-content {
  z-index: 10;
  text-align: center;
  position: relative;
  width:100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.has-images.preloader-content,
.has-images.preloader-content .image-sequence {
  height:100%;
  width:100%;
  position: absolute;
  top: 0;
  left:0;
}

.image-sequence,
.title-sequence {
  display: flex;
  align-items: center;
  justify-content: center;
}

.has-images .image-sequence {
  opacity: 0; /* Start hidden when there are preloader images */
}

.title-sequence {
  opacity: 0;
  visibility: hidden;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
}

.image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  max-width: 133vh;
  margin: 0 auto;
  left: 50%;
  transform: translateX(-50%);
}

.website-icon-container {
  opacity: 0;
  visibility: hidden;
  position: relative;
  width: auto;
  height: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  height: var(--header-bar-height);
}


svg > * {
  fill:currentColor;
  width: 100%;
  height: 100%;
}

.preloader-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 0px;
  max-width: unset;
}

.preloader-image.repeat-right {
  position: absolute;
  top: 0;
  left: 0;
  transform: scaleX(-1); /* Flip horizontally for left-right repeat */
}

.title-container {
  display: flex;
  align-items: center;
  justify-content: center;
}
.preloader-bg {
  background: rgba(255, 255, 255, 1);
}

/* Hide preloader in design mode */
:is(.wf-design-mode, .w-editor) .preloader-container {
  display: none;
}




</style>
