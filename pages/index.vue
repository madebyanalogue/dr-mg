<template>
  <div>
    <pre v-if="isDev" style="display: none">{{ JSON.stringify({ pageData, error, pending }, null, 2) }}</pre>
    <template v-if="error">
      <div class="wrapper py6">
        <h1>Error</h1>
        <p>{{ error.message }}</p>
        <p v-if="isDev">Status: {{ error.statusCode }}</p>
      </div>
    </template>
    <template v-else-if="pending">
      <div class="wrapper py6">
        <div class="loading-placeholder">
          <div class="loading-spinner"></div>
        </div>
      </div>
    </template>
    
    <template v-else-if="pageData">
      <!-- Page Hero (moved into page content) -->
      <PageHero 
        :hero-video="pageData.heroVideo"
        :hero-image="pageData.heroImage"
        :default-hero-video="defaultHeroVideo"
        :default-hero-image="defaultHeroImage"
      />
      
    <template v-if="pageData?.sections?.length">
      <PageBuilder :sections="pageData.sections" :page-data="pageData" />
      </template>
    </template>
  </div>
</template>

<script setup>
import { useRuntimeConfig } from '#app'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePageSettings } from '~/composables/usePageSettings'
import { useSiteSettings } from '~/composables/useSiteSettings'
import { useSanityImage } from '~/composables/useSanityImage'
import PageHero from '~/components/PageHero.vue'

const config = useRuntimeConfig()

// Use the usePageSettings composable instead of duplicating the data fetching
const { page: pageData, error, pending } = usePageSettings()

// Get site settings once
const { 
  title: websiteTitle, 
  defaultHeroVideo, 
  defaultHeroImage,
  defaultMetaDescription,
  defaultOgImage
} = useSiteSettings()

// Get image URL helper
const { getImageUrl } = useSanityImage()

// Get current URL for og:url
const route = useRoute()
const getCurrentUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.href
  }
  // Fallback for SSR
  const baseUrl = config.public.siteUrl || 'https://www.drmagdalena.co.uk'
  return baseUrl
}

// Computed values for SEO
const pageTitle = computed(() => pageData.value?.title || 'Home')
const metaTitle = computed(() => pageData.value?.seo?.metaTitle || pageTitle.value)
const metaDescription = computed(() => {
  const desc = pageData.value?.seo?.metaDescription || defaultMetaDescription.value
  return desc && desc.trim() ? desc.trim() : undefined
})
const ogImageSource = computed(() => pageData.value?.seo?.ogImage || defaultOgImage.value)
const ogImageUrl = computed(() => {
  if (!ogImageSource.value) return undefined
  // Open Graph images need absolute URLs (no proxy) for social media crawlers
  const url = getImageUrl(ogImageSource.value, false)
  return url || undefined
})

// Computed SEO values
const fullTitle = computed(() => `${websiteTitle.value} | ${metaTitle.value}`)
const currentUrl = computed(() => getCurrentUrl())

// Get image dimensions if available
const ogImageWidth = computed(() => {
  if (!ogImageSource.value?.asset?.metadata?.dimensions?.width) return undefined
  return ogImageSource.value.asset.metadata.dimensions.width
})
const ogImageHeight = computed(() => {
  if (!ogImageSource.value?.asset?.metadata?.dimensions?.height) return undefined
  return ogImageSource.value.asset.metadata.dimensions.height
})

// Page meta with all SEO tags - reactive to data changes
// Use useSeoMeta for better Open Graph support
useSeoMeta({
  title: fullTitle,
  description: metaDescription,
  ogTitle: fullTitle,
  ogDescription: metaDescription,
  ogType: 'website',
  ogUrl: currentUrl,
  ogSiteName: websiteTitle,
  ogImage: ogImageUrl,
  ogImageWidth: ogImageWidth,
  ogImageHeight: ogImageHeight
})

// Also set title separately
useHead({
  title: fullTitle
})

// Computed property for development mode
const isDev = computed(() => config.public.dev)
</script>

<style scoped>
.loading-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  gap: 1rem;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--gray-200);
  border-top-color: var(--black);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

</style> 