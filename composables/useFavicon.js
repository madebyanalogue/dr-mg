export function useFavicon() {
  // Only run on client side
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  // Set static favicon from public/images/favicon.png
  function setFavicon() {
    // Remove all existing favicon links
    removeExistingIconLinks()

    // Add static favicon link
    const faviconUrl = '/images/favicon.png'
    setFaviconLinkExact('icon', faviconUrl, 'image/png', '32x32')
    // Legacy support
    setFaviconLinkExact('shortcut icon', faviconUrl, 'image/png')
  }

  // Set favicon on mount
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setFavicon)
  } else {
    setFavicon()
  }
}

function removeExistingIconLinks() {
  // Remove all favicon-related links
  const selectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]'
  ]
  
  selectors.forEach(selector => {
    const links = document.querySelectorAll(selector)
    links.forEach(link => {
      if (link.parentNode) {
        link.parentNode.removeChild(link)
      }
    })
  })
}

function setFaviconLinkExact(rel, href, type = null, sizes = null) {
  const link = document.createElement('link')
  link.rel = rel
  if (type) link.type = type
  if (sizes) link.sizes = sizes
  link.href = href
  document.head.appendChild(link)
}
