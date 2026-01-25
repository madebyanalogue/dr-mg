import { defineEventHandler, getQuery, setHeader, sendError, createError } from 'h3'

// Proxy to fetch image content from Sanity CDN
// This prevents third-party cookies from being set by routing requests through our server
// Only allows whitelisted hosts for safety
const ALLOWED_HOSTS = new Set([
  'cdn.sanity.io'
])

export default defineEventHandler(async (event) => {
  const { url } = getQuery(event) as { url?: string }
  if (!url) {
    return sendError(event, createError({ statusCode: 400, statusMessage: 'Missing url parameter' }))
  }

  try {
    const target = new URL(Array.isArray(url) ? url[0] : url)
    if (!ALLOWED_HOSTS.has(target.hostname)) {
      return sendError(event, createError({ statusCode: 400, statusMessage: 'Host not allowed' }))
    }

    // Fetch the image from Sanity CDN
    const res = await fetch(target.toString(), { 
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    })
    
    if (!res.ok) {
      return sendError(event, createError({ 
        statusCode: res.status, 
        statusMessage: `Upstream error ${res.status}` 
      }))
    }

    // Get content type from response or try to infer from URL
    let contentType = res.headers.get('Content-Type')
    if (!contentType) {
      const extension = target.pathname.split('.').pop()?.toLowerCase()
      const mimeTypes: Record<string, string> = {
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'svg': 'image/svg+xml',
        'avif': 'image/avif'
      }
      contentType = mimeTypes[extension || ''] || 'image/jpeg'
    }
    
    // Set headers for caching and prevent cookie setting
    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    
    // Get content length if available
    const contentLength = res.headers.get('Content-Length')
    if (contentLength) {
      setHeader(event, 'Content-Length', contentLength)
    }

    // Stream the image
    return res.body
  } catch (error: any) {
    console.error('[proxy-image] Error:', error)
    return sendError(event, createError({ 
      statusCode: 500, 
      statusMessage: error?.message || 'Proxy failed' 
    }))
  }
})
