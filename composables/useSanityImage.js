import imageUrlBuilder from '@sanity/image-url'
import { useNuxtApp } from '#app'

export const useSanityImage = () => {
  const { $sanity } = useNuxtApp()
  
  const builder = imageUrlBuilder({
    projectId: '0hcfi5z2',
    dataset: 'production'
  })

  const getImageUrl = (source) => {
    if (!source?.asset) {
      return null
    }
    let url = null
    if (source.asset.url) {
      url = source.asset.url
    } else if (source.asset._ref) {
      const [_file, id, extension] = source.asset._ref.split('-')
      url = `https://cdn.sanity.io/images/0hcfi5z2/production/${id}.${extension}`
    }
    
    // Ensure URL is absolute for Open Graph
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://cdn.sanity.io${url}`
    }
    
    return url
  }

  return {
    getImageUrl
  }
} 