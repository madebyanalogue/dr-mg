import imageUrlBuilder from '@sanity/image-url'
import { useNuxtApp } from '#app'

export const useSanityImage = () => {
  const { $sanity } = useNuxtApp()
  
  const builder = imageUrlBuilder({
    projectId: '0hcfi5z2',
    dataset: 'production'
  })

  /**
   * Get optimized image URL from Sanity
   * @param {Object} source - Sanity image source object
   * @param {Object|boolean} optionsOrUseProxy - Optimization options object OR boolean for useProxy (legacy support)
   * @param {number} options.width - Maximum width (default: 1920)
   * @param {number} options.height - Maximum height (optional)
   * @param {number} options.quality - Image quality 1-100 (default: 85)
   * @param {string} options.format - Image format (default: auto)
   * @returns {string|null} Optimized image URL
   */
  const getImageUrl = (source, optionsOrUseProxy = {}) => {
    if (!source?.asset) {
      return null
    }

    // Handle legacy boolean parameter for useProxy
    let useProxy = true
    let options = {}
    if (typeof optionsOrUseProxy === 'boolean') {
      useProxy = optionsOrUseProxy
    } else if (typeof optionsOrUseProxy === 'object') {
      options = optionsOrUseProxy
      // If options are provided, assume we want absolute URL (for OG images)
      useProxy = false
    }

    const {
      width = 1920,
      height,
      quality = 85,
      format = 'auto'
    } = options

    try {
      let imageBuilder = builder.image(source)

      // Apply width constraint (prevents serving oversized images)
      imageBuilder = imageBuilder.width(Math.min(width, 1920))

      // Apply height if specified
      if (height) {
        imageBuilder = imageBuilder.height(height)
      }

      // Apply quality (reduces file size)
      imageBuilder = imageBuilder.quality(quality)

      // Apply format if specified (auto allows Sanity to choose best format)
      if (format && format !== 'auto') {
        imageBuilder = imageBuilder.format(format)
      }

      const url = imageBuilder.url()
      
      // Check if it's an SVG - SVGs use their own proxy endpoint
      const mimeType = source.asset.mimeType || source.asset._type
      const isSvg = 
        (mimeType && typeof mimeType === 'string' && mimeType.toLowerCase().includes('svg')) ||
        (url && typeof url === 'string' && url.toLowerCase().includes('.svg'))
      
      // Route through proxy to prevent third-party cookies
      // Skip proxy for:
      // - Open Graph images (they need absolute URLs) - when options are provided
      // - SVG files (they use the SVG proxy endpoint instead)
      if (url && useProxy && !isSvg && url.includes('cdn.sanity.io')) {
        const encodedUrl = encodeURIComponent(url)
        return `/api/proxy-image?url=${encodedUrl}`
      }
      
      return url
    } catch (error) {
      console.error('Error building Sanity image URL:', error)
      // Fallback to direct URL
      if (source.asset.url) {
        return source.asset.url
      }
      if (source.asset._ref) {
        const [_file, id, extension] = source.asset._ref.split('-')
        return `https://cdn.sanity.io/images/0hcfi5z2/production/${id}.${extension}`
      }
      return null
    }
  }

  /**
   * Get image dimensions from Sanity asset metadata
   * @param {Object} source - Sanity image source object
   * @returns {Object|null} Object with width and height, or null
   */
  const getImageDimensions = (source) => {
    if (!source?.asset?.metadata?.dimensions) {
      return null
    }
    return {
      width: source.asset.metadata.dimensions.width,
      height: source.asset.metadata.dimensions.height
    }
  }

  return {
    getImageUrl,
    getImageDimensions
  }
} 