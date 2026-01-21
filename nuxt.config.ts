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
      useLocalHeroVideos: process.env.USE_LOCAL_HERO_VIDEOS === 'true' || false
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
          rel: 'preconnect',
          href: 'https://fonts.googleapis.com'
        },
        {
          rel: 'preconnect',
          href: 'https://fonts.gstatic.com',
          crossorigin: ''
        },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&family=Rethink+Sans:ital@0;1&display=swap'
        }
      ],
      script: [
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