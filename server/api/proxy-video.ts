import { defineEventHandler, getQuery, setHeader, sendError, createError } from 'h3'

// Proxy to fetch video content from Sanity CDN with CORS headers
// This allows WebGL to access video textures without CORS errors
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

    // Fetch the video from Sanity CDN
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

    // Get content type from response or default to video/mp4
    const contentType = res.headers.get('Content-Type') || 'video/mp4'
    
    // Set headers for CORS and caching
    setHeader(event, 'Content-Type', contentType)
    setHeader(event, 'Access-Control-Allow-Origin', '*')
    setHeader(event, 'Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
    setHeader(event, 'Access-Control-Allow-Headers', 'Range')
    setHeader(event, 'Access-Control-Expose-Headers', 'Content-Length, Content-Range, Accept-Ranges')
    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    
    // Handle range requests for video streaming (required for video playback)
    const range = event.node.req.headers.range
    if (range) {
      // Forward range request to upstream
      const rangeRes = await fetch(target.toString(), {
        method: 'GET',
        headers: {
          'Range': Array.isArray(range) ? range[0] : range,
          'User-Agent': 'Mozilla/5.0'
        }
      })
      
      if (rangeRes.status === 206) {
        // Partial content response
        const contentRange = rangeRes.headers.get('Content-Range')
        const contentLength = rangeRes.headers.get('Content-Length')
        
        if (contentRange) {
          setHeader(event, 'Content-Range', contentRange)
        }
        if (contentLength) {
          setHeader(event, 'Content-Length', contentLength)
        }
        setHeader(event, 'Accept-Ranges', 'bytes')
        
        // Set status code for partial content
        event.node.res.statusCode = 206
        
        return rangeRes.body
      }
    }
    
    // Set headers for non-range requests
    const contentLength = res.headers.get('Content-Length')
    if (contentLength) {
      setHeader(event, 'Content-Length', contentLength)
    }
    setHeader(event, 'Accept-Ranges', 'bytes')

    // Stream the video
    return res.body
  } catch (error: any) {
    console.error('[proxy-video] Error:', error)
    return sendError(event, createError({ 
      statusCode: 500, 
      statusMessage: error?.message || 'Proxy failed' 
    }))
  }
})

