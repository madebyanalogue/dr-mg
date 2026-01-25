// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/sanity',
    '@nuxt/image'
  ],
  sanity: {
    projectId: '0hcfi5z2',
    dataset: 'production',
    useCdn: true
  },
  runtimeConfig: {
    public: {
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
      useLocalHeroVideos: process.env.USE_LOCAL_HERO_VIDEOS === 'true' || false,
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://www.drmagdalena.co.uk'
    }
  },

  components: {
    dirs: [
      '~/components'
    ]
  },
  css: [
    '~/assets/styles/reset.css',
    '~/assets/styles/colors.css',
    '~/assets/styles/utilities.css',
    '~/assets/styles/typography.css',
    '~/assets/styles/main.css',
  ],
  experimental: {
    componentIslands: true
  },
  routeRules: {
    '/**': { ssr: true }
  },

  build: {
    transpile: ['gsap']
  },
  vite: {
    ssr: {
      noExternal: []
    }
  },
  
  app: {
    head: {
      htmlAttrs: {
        lang: 'en'
      },
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1'
        }
      ],
      link: [
        {
          rel: 'icon',
          type: 'image/png',
          href: '/images/favicon.png'
        },
        {
          rel: 'dns-prefetch',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'dns-prefetch',
          href: 'https://fonts.gstatic.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: 'anonymous'
        },
        {
          rel: 'preconnect',
          href: 'https://cdn.sanity.io'
        }
      ],
      noscript: [
        {
          children: '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Rethink+Sans:ital@0;1&display=swap">'
        }
      ],
      script: [
        {
          children: `
            // Load Google Fonts asynchronously to prevent render blocking
            (function() {
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Rethink+Sans:ital@0;1&display=swap';
              link.media = 'print';
              link.onload = function() { this.media = 'all'; };
              document.head.appendChild(link);
            })();
          `,
          type: 'text/javascript'
        },
        {
          src: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/CustomEase.min.js',
          defer: true
        },
        {
          src: 'https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/Flip.min.js',
          defer: true
        }
      ]
    }
  }
})