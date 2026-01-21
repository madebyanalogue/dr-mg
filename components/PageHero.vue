<template>
  <div 
    v-if="hasVideo || hasImage" 
    ref="heroRef"
    :class="['page-hero', 'scheme', 'overlay', { 'page-hero--video': hasVideo, 'page-hero--image': hasImage, 'page-hero--ready': contentReady }]"
  >
    <!-- Video Background -->
    <div 
      v-if="hasVideo" 
      class="page-hero-video-wrapper"
    >
      <video
        ref="videoRef"
        :key="videoUrl"
        :src="videoUrl"
        class="page-hero-video"
        autoplay
        loop
        muted
        playsinline
        preload="auto"
        @loadeddata="onVideoLoaded"
        @error="onVideoError"
      />
    </div>
    
    <!-- Image Background -->
    <div 
      v-else-if="hasImage" 
      class="page-hero-image-wrapper"
    >
      <img
        :src="imageUrl"
        :alt="alt"
        class="page-hero-image"
        @load="onImageLoaded"
        @error="onImageError"
      />
    </div>
    
    <div class="page-hero-overlay"></div>
    
    <!-- Hero Left & Right Text -->
    <div 
      v-if="heroLeftText || heroRightText" 
      class="page-hero-side-texts"
      :style="{ 
        opacity: sideTextsOpacity,
        filter: `blur(${sideTextsBlur}px)`
      }"
    >
      <div v-if="heroLeftText" class="page-hero-left-text">
        <div class="page-hero-side-text-content h1" v-html="processedLeftText"></div>
      </div>
      <div v-if="heroRightText" class="page-hero-right-text">
        <div class="page-hero-side-text-content h1" v-html="processedRightText"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useSanityImage } from '~/composables/useSanityImage'
import { useSiteSettings } from '~/composables/useSiteSettings'

const props = defineProps({
  heroVideo: {
    type: Object,
    default: null
  },
  heroImage: {
    type: Object,
    default: null
  },
  defaultHeroVideo: {
    type: Object,
    default: null
  },
  defaultHeroImage: {
    type: Object,
    default: null
  },
})

const { getImageUrl } = useSanityImage()
const { heroLeftText, heroRightText } = useSiteSettings()
const route = useRoute()
const heroRef = ref(null)
const videoRef = ref(null)
const videoLoaded = ref(false)
const contentReady = ref(false)

// Debug: Watch props changes
if (process.env.NODE_ENV === 'development') {
  watch(() => props.heroImage, (newVal) => {
    console.log('[PageHero] heroImage prop changed:', {
      hasValue: !!newVal,
      hasAsset: !!newVal?.asset,
      asset: newVal?.asset
    })
  }, { immediate: true, deep: true })
  
  watch(() => props.defaultHeroImage, (newVal) => {
    console.log('[PageHero] defaultHeroImage prop changed:', {
      hasValue: !!newVal,
      hasAsset: !!newVal?.asset,
      asset: newVal?.asset
    })
  }, { immediate: true, deep: true })
}

// Process hero text fields (replace line breaks with <br>)
const processedLeftText = computed(() => {
  if (!heroLeftText.value) return ''
  return heroLeftText.value.replace(/\n/g, '<br>')
})

const processedRightText = computed(() => {
  if (!heroRightText.value) return ''
  return heroRightText.value.replace(/\n/g, '<br>')
})

const videoUrl = computed(() => {
  const videoSource = props.heroVideo?.asset?.url ? props.heroVideo : (props.defaultHeroVideo?.asset?.url ? props.defaultHeroVideo : null)
  
  if (!videoSource?.asset?.url) {
    return null
  }
  
  let url = videoSource.asset.url
  
  // Ensure URL is absolute
  if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://cdn.sanity.io${url}`
  }
  
  return url
})

const imageUrl = computed(() => {
  const imageSource = props.heroImage?.asset ? props.heroImage : (props.defaultHeroImage?.asset ? props.defaultHeroImage : null)
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[PageHero] imageUrl computed:', {
      hasHeroImage: !!props.heroImage,
      hasHeroImageAsset: !!props.heroImage?.asset,
      hasDefaultHeroImage: !!props.defaultHeroImage,
      hasDefaultHeroImageAsset: !!props.defaultHeroImage?.asset,
      imageSource: imageSource,
      imageSourceAsset: imageSource?.asset
    })
  }
  
  if (!imageSource?.asset) {
    return null
  }
  
  // getImageUrl expects the full image object, not just the asset
  const url = getImageUrl(imageSource)
  
  if (process.env.NODE_ENV === 'development') {
    console.log('[PageHero] Generated image URL:', url)
  }
  
  return url
})

const alt = computed(() => {
  return props.heroImage?.alt || props.defaultHeroImage?.alt || 'Hero image'
})

const hasVideo = computed(() => {
  const has = !!videoUrl.value
  if (process.env.NODE_ENV === 'development') {
    console.log('[PageHero] hasVideo:', has, 'videoUrl:', videoUrl.value)
  }
  return has
})

const hasImage = computed(() => {
  const has = !!imageUrl.value && !hasVideo.value
  if (process.env.NODE_ENV === 'development') {
    console.log('[PageHero] hasImage:', has, 'imageUrl:', imageUrl.value, 'hasVideo:', hasVideo.value)
  }
  return has
})

const shouldShow = computed(() => {
  return contentReady.value
})

let scrollHandler = null
let parallaxOffset = 0

const sideTextsOpacity = ref(1)
const sideTextsBlur = ref(0)

const handleScroll = () => {
  if (!heroRef.value) return
  
  const scrollY = window.scrollY || window.pageYOffset
  
  // Apply parallax to both images and videos
  parallaxOffset = scrollY * 0.5 // Parallax speed (0.5 = moves at half scroll speed)
  
  if (hasImage.value) {
    const imageWrapper = heroRef.value.querySelector('.page-hero-image-wrapper')
    if (imageWrapper) {
      imageWrapper.style.transform = `translateY(${parallaxOffset}px)`
    }
  }
  
  if (hasVideo.value) {
    const videoWrapper = heroRef.value.querySelector('.page-hero-video-wrapper')
    if (videoWrapper) {
      videoWrapper.style.transform = `translateY(${parallaxOffset}px)`
    }
  }
  
  // Fade out and blur side texts as user scrolls down
  const fadeStart = 0
  const fadeEnd = 75
  const scrollProgress = Math.min(scrollY / fadeEnd, 1)
  sideTextsOpacity.value = 1 - scrollProgress
  sideTextsBlur.value = scrollProgress * 10
  
  // Check if hero is in view and update body class
  if (heroRef.value && typeof document !== 'undefined') {
    const windowHeight = window.innerHeight || document.documentElement.clientHeight
    const header = document.querySelector('header')
    const headerHeight = header ? header.offsetHeight : 0
    const adjustedHeroHeight = windowHeight - (headerHeight / 2)
    const isInView = scrollY < adjustedHeroHeight
    
    if (isInView) {
      if (!document.body.classList.contains('hero-in-view')) {
        document.body.classList.add('hero-in-view')
      }
    } else {
      if (document.body.classList.contains('hero-in-view')) {
        document.body.classList.remove('hero-in-view')
      }
    }
  }
}

// Handle video loaded event
const onVideoLoaded = () => {
  videoLoaded.value = true
  if (videoRef.value) {
    videoRef.value.play().catch(error => {
      console.warn('[PageHero] Video autoplay failed after load:', error)
    })
  }
  setTimeout(() => {
    contentReady.value = true
  }, 100)
}

// Handle video errors
const onVideoError = (event) => {
  console.warn('[PageHero] Video error:', event)
  setTimeout(() => {
    contentReady.value = true
  }, 100)
}

// Handle image loaded event
const onImageLoaded = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[PageHero] Image loaded successfully')
  }
  setTimeout(() => {
    contentReady.value = true
  }, 100)
}

// Handle image errors
const onImageError = (event) => {
  console.warn('[PageHero] Image error:', event)
  setTimeout(() => {
    contentReady.value = true
  }, 100)
}

onMounted(async () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('[PageHero] onMounted:', {
      hasVideo: hasVideo.value,
      hasImage: hasImage.value,
      videoUrl: videoUrl.value,
      imageUrl: imageUrl.value,
      heroImage: props.heroImage,
      defaultHeroImage: props.defaultHeroImage,
      heroVideo: props.heroVideo,
      defaultHeroVideo: props.defaultHeroVideo
    })
  }
  
  if (typeof window !== 'undefined' && (hasVideo.value || hasImage.value)) {
    // Set initial hero-in-view class
    if (typeof document !== 'undefined') {
      const scrollY = window.scrollY || window.pageYOffset
      const windowHeight = window.innerHeight || document.documentElement.clientHeight
      const header = document.querySelector('header')
      const headerHeight = header ? header.offsetHeight : 0
      const adjustedHeroHeight = windowHeight - (headerHeight / 2)
      const isInView = scrollY < adjustedHeroHeight
      
      if (isInView) {
        document.body.classList.add('hero-in-view')
      } else {
        document.body.classList.remove('hero-in-view')
      }
    }
    
    // For images, mark as ready after a short delay (image might load before @load fires)
    if (hasImage.value) {
      // Check if image is already loaded
      const img = heroRef.value?.querySelector('.page-hero-image')
      if (img && img.complete && img.naturalHeight !== 0) {
        // Image already loaded
        contentReady.value = true
      } else {
        // Wait a bit for image to load, or mark ready after timeout
        setTimeout(() => {
          contentReady.value = true
        }, 300)
      }
    }
    
    // Add scroll handler
    scrollHandler = handleScroll
    window.addEventListener('scroll', scrollHandler, { passive: true })
    handleScroll()
    
    // Set up IntersectionObserver
    const setupHeroObserver = () => {
      if (!heroRef.value || typeof window === 'undefined') return
      
      const heroObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              document.body.classList.add('hero-in-view')
            } else {
              document.body.classList.remove('hero-in-view')
            }
          })
        },
        {
          root: null,
          rootMargin: '0px',
          threshold: 0
        }
      )
      
      try {
        heroObserver.observe(heroRef.value)
      } catch (e) {
        console.warn('[PageHero] Error observing hero element:', e)
      }
    }
    
    setTimeout(setupHeroObserver, 300)
  }
})

onUnmounted(() => {
  if (scrollHandler && typeof window !== 'undefined') {
    window.removeEventListener('scroll', scrollHandler)
  }
  
  if (typeof document !== 'undefined') {
    document.body.classList.remove('hero-in-view')
  }
})
</script>

<style scoped>
.page-hero {
  position: relative;
  width: 100%;
  overflow: hidden;
  z-index: 1;
  margin-top: 0;
 aspect-ratio: 4/3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

@media all and (min-width: 1000px) {
  .page-hero {
    max-height: 100vh;
  }
}

.page-hero-image-wrapper {
  position: absolute;
  top: -20%;
  left: 0;
  width: 100%;
  height: 140%;
  will-change: transform;
}

.page-hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

.page-hero-video-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  will-change: transform;
}

.page-hero-video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  pointer-events: none;
}

.page-hero--video {
  height: 100vh;
  min-height: 100vh;
}

.page-hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(43, 46, 41, 0.3);
  z-index: 1;
  pointer-events: none;
}

/* Hero side texts */
.page-hero-side-texts {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  z-index: 2;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-direction: column;
  width: 100%;
  padding: 0 var(--wrapper-padding);
  pointer-events: none;
  transition: opacity 0.3s ease-out;
  flex-direction: row;
}

@media (min-width: 1000px) {
  .page-hero-side-texts {
   flex-direction: row;
  }
}

.page-hero-left-text,
.page-hero-right-text {
  flex: 0 0 auto;
}

.page-hero-left-text {
  text-align: left;
}

.page-hero-right-text {
  text-align: right;
}

.page-hero-side-text-content {
  display: inline-block;
}
</style>
