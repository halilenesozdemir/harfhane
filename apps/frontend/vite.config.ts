import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
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
      includeAssets: [
        'harfhane-icon.svg',
        'harfhane-icon-192.png',
        'harfhane-icon-512.png',
        'harfhane-icon-512-maskable.png',
        'apple-touch-icon.png'
      ],
      manifest: {
        name: 'Harfhane - Kelime Oyunu',
        short_name: 'Harfhane',
        lang: 'tr',
        description: 'Türkçe günlük kelime oyunu: günün kelimesini 6 denemede bul',
        theme_color: '#c2410c',
        background_color: '#fff4dc',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/harfhane-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/harfhane-icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/harfhane-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/harfhane-icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        importScripts: ['/push-handler.js'],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff2}'],
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
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
})
