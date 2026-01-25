import imageUrlBuilder from '@sanity/image-url'
import { useNuxtApp } from '#app'

export const useSanityImage = () => {
  const { $sanity } = useNuxtApp()
  
  const builder = imageUrlBuilder({
    projectId: '0hcfi5z2',
    dataset: 'production'
  })

  const getImageUrl = (source, useProxy = true) => {
    if (!source?.asset) {
      return null
    }
    let url = null
    let extension = null
    
    if (source.asset.url) {
      url = source.asset.url
    } else if (source.asset._ref) {
      const parts = source.asset._ref.split('-')
      if (parts.length >= 3) {
        const [_file, id, ext] = parts
        extension = ext
        url = `https://cdn.sanity.io/images/0hcfi5z2/production/${id}.${ext}`
      }
    }
    
    // Ensure URL is absolute
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://cdn.sanity.io${url}`
    }
    
    // Check if it's an SVG - SVGs use their own proxy endpoint
    // Check multiple sources: mimeType, extension from asset, extension from _ref, and URL
    const mimeType = source.asset.mimeType || source.asset._type
    const assetExtension = source.asset.extension || extension
    
    const isSvg = 
      (mimeType && typeof mimeType === 'string' && mimeType.toLowerCase().includes('svg')) ||
      (assetExtension && typeof assetExtension === 'string' && assetExtension.toLowerCase() === 'svg') ||
      (url && typeof url === 'string' && (
        url.toLowerCase().endsWith('.svg') || 
        url.toLowerCase().includes('.svg?') ||
        url.toLowerCase().includes('/svg')
      ))
    
    // Route through proxy to prevent third-party cookies
    // Skip proxy for:
    // - Open Graph images (they need absolute URLs)
    // - SVG files (they use the SVG proxy endpoint instead)
    if (url && useProxy && !isSvg && url.includes('cdn.sanity.io')) {
      const encodedUrl = encodeURIComponent(url)
      return `/api/proxy-image?url=${encodedUrl}`
    }
    
    return url
  }

  return {
    getImageUrl
  }
} 