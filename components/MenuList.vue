<template>
  <ul class="menu-list" :class="listClass">
    <li 
      v-for="(item, index) in items" 
      :key="item._key || item.text || index"
      class="menu-list-item"
      :class="{ 'menu-list-item--current': isCurrentPage(item, index) }"
    >
      <NuxtLink 
        v-if="item.to?.page?.slug?.current && !isExternalUrl(item.to?.url)" 
        :to="getMenuItemUrl(item)"
        class="menu-link"
        :class="{ 'menu-link--current': isCurrentPage(item, index) }"
        @click="handleClick(item)"
      >
        <span class="menu-link-text">{{ item.text }}</span>
      </NuxtLink>
      <a 
        v-else-if="getMenuItemUrl(item) && isExternalUrl(item.to?.url)"
        :href="getMenuItemUrl(item)" 
        target="_blank"
        rel="noopener"
        class="menu-link"
        @click="handleClick(item)"
      >
        <span class="menu-link-text">{{ item.text }}</span>
      </a>
      <span v-else class="menu-link">
        <span class="menu-link-text">{{ item.text }}</span>
      </span>
    </li>
  </ul>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useUrlProcessing } from '~/composables/useUrlProcessing'

const props = defineProps({
  items: {
    type: Array,
    required: true,
    default: () => []
  },
  listClass: {
    type: String,
    default: ''
  },
  showActiveState: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['item-click'])

const route = useRoute()
const { getProcessedUrl } = useUrlProcessing()

// Helper function to check if URL is external
const isExternalUrl = (url) => {
  if (!url) return false
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) return true
  if (url.startsWith('mailto:') || url.startsWith('tel:')) return true
  return !url.startsWith('/') && !url.startsWith('#')
}

// Helper function to get menu item URL
const getMenuItemUrl = (item) => {
  if (item.to?.page?.slug?.current) {
    let url = `/${item.to.page.slug.current}`
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

// Check if a menu item is the current page
const isCurrentPage = (item, index) => {
  if (!props.showActiveState) return false
  if (!item.to?.page?.slug?.current) return false
  
  const itemSlug = item.to.page.slug.current
  const itemPath = itemSlug === 'index' ? '/' : `/${itemSlug}`
  const currentPath = route.path.split('#')[0].replace(/\/$/, '') || '/'
  const normalizedCurrentPath = currentPath === '/index' ? '/' : currentPath
  const itemPathClean = itemPath.split('#')[0].replace(/\/$/, '') || '/'
  
  if (normalizedCurrentPath === '/' && (itemPathClean === '/' || itemSlug === 'index')) {
    return true
  }
  
  if (itemPathClean === '/') {
    return false
  }
  
  return normalizedCurrentPath === itemPathClean || normalizedCurrentPath.startsWith(itemPathClean + '/')
}

const handleClick = (item) => {
  emit('item-click', item)
  
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
}
</script>

<style scoped>
/* Styles are in main.css for shared use */
</style>

