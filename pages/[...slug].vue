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
import { usePageSettings } from '~/composables/usePageSettings'
import { useRuntimeConfig } from '#app'
import { computed } from 'vue'
import { useRoute } from 'vue-router'
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

// Get current URL for og:url
const getCurrentUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.href
  }
  // Fallback for SSR
  const baseUrl = config.public.siteUrl || 'https://www.drmagdalena.co.uk'
  const path = route.path === '/' ? '' : route.path
  return `${baseUrl}${path}`
}

// Page meta - use the already-fetched websiteTitle
useHead(() => {
  const title = pageData.value?.title || 'Page Not Found';
  const metaTitle = pageData.value?.seo?.metaTitle || title;
  const metaDescription = pageData.value?.seo?.metaDescription || defaultMetaDescription.value;
  
  // Get OG image - prefer page-specific, fallback to default
  const ogImageSource = pageData.value?.seo?.ogImage || defaultOgImage.value;
  const ogImageUrl = ogImageSource ? getImageUrl(ogImageSource) : null;
  
  const headConfig = { 
    title: `${websiteTitle.value} | ${metaTitle}`,
    meta: []
  };

  // Meta description
  if (metaDescription) {
    headConfig.meta.push({
      name: 'description',
      content: metaDescription
    });
  }

  // Open Graph tags
  headConfig.meta.push(
    {
      property: 'og:title',
      content: `${websiteTitle.value} | ${metaTitle}`
    },
    {
      property: 'og:type',
      content: 'website'
    },
    {
      property: 'og:url',
      content: getCurrentUrl()
    }
  );

  if (metaDescription) {
    headConfig.meta.push({
      property: 'og:description',
      content: metaDescription
    });
  }

  if (ogImageUrl) {
    headConfig.meta.push({
      property: 'og:image',
      content: ogImageUrl
    });
  }

  return headConfig;
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
