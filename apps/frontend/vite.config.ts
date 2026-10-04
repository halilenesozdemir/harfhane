import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts', 'src/utils/registerSW.ts'],
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8787',
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['harfhane-icon.svg', 'favicon.ico'],
      manifest: {
        name: 'Harfhane - Kelime Oyunu',
        short_name: 'Harfhane',
        lang: 'tr',
        description: 'Türkçe günlük kelime oyunu: günün kelimesini 6 denemede bul',
        theme_color: '#538d4e',
        background_color: '#121213',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/harfhane-icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/harfhane-icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        importScripts: ['/push-handler.js'],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [
          /^\/api\//,
          /\.xml$/,
          /\.txt$/,
          /\.json$/,
          /^\/\.well-known\//,
          /^\/sitemap\.xml$/,
          /^\/robots\.txt$/,
        ],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
})
