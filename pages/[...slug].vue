<template>
  <div>
    <pre v-if="isDev" style="display: none">{{ JSON.stringify({ pageData, error, pending, slug: slug.value }, null, 2) }}</pre>
    <template v-if="error && error.statusCode !== 404">
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
    <template v-else>
      <!-- 404 - No page data found and not pending -->
      <NotFound404 />
    </template>
  </div>
</template> 

<script setup>
import { useRuntimeConfig, useHead } from '#app'
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePageSettings } from '~/composables/usePageSettings'
import { useSiteSettings } from '~/composables/useSiteSettings'
import { useSanityImage } from '~/composables/useSanityImage'
import NotFound404 from '~/components/NotFound404.vue'
import PageHero from '~/components/PageHero.vue'

const route = useRoute()
const config = useRuntimeConfig()

// Get the full path as the slug
const slug = computed(() => route.params.slug?.join('/') || '')

// Use the usePageSettings composable for consistency
const { page: pageData, error, pending } = usePageSettings()

// Call useSiteSettings once at setup level
const { 
  title: websiteTitle, 
  defaultHeroVideo, 
  defaultHeroImage,
  defaultMetaDescription,
  defaultOgImage
} = useSiteSettings()

// Get image URL helper
const { getImageUrl } = useSanityImage()

// Computed SEO values for reactivity
const seoTitle = computed(() => {
  const pageTitle = pageData.value?.seo?.metaTitle || pageData.value?.title || 'Page Not Found'
  return pageData.value?.seo?.metaTitle 
    ? `${websiteTitle.value} | ${pageData.value.seo.metaTitle}`
    : `${websiteTitle.value} | ${pageData.value?.title || 'Page Not Found'}`
})

const seoDescription = computed(() => {
  return pageData.value?.seo?.metaDescription || defaultMetaDescription.value || ''
})

const seoImage = computed(() => {
  if (pageData.value?.seo?.ogImage?.asset) {
    return getImageUrl(pageData.value.seo.ogImage, { width: 1200, quality: 85 })
  } else if (defaultOgImage.value?.asset) {
    return getImageUrl(defaultOgImage.value, { width: 1200, quality: 85 })
  }
  return null
})

const seoUrl = computed(() => {
  return typeof window !== 'undefined' ? window.location.href : ''
})

// Page meta - use computed values for SSR
useHead({
  title: seoTitle,
  meta: computed(() => {
    const meta = []
    
    if (seoDescription.value) {
      meta.push({
        name: 'description',
        content: seoDescription.value
      })
    }
    
    meta.push({
      property: 'og:title',
      content: seoTitle.value
    })
    
    if (seoUrl.value) {
      meta.push({
        property: 'og:url',
        content: seoUrl.value
      })
    }
    
    if (seoImage.value) {
      meta.push(
        {
          property: 'og:image',
          content: seoImage.value
        },
        {
          property: 'og:image:width',
          content: '1200'
        },
        {
          property: 'og:image:height',
          content: '630'
        }
      )
    }
    
    return meta
  })
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
