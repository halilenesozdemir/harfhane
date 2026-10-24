import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { configDefaults } from 'vitest/config'
import { PRERENDERED_ROUTES, outputFileFor, renderRouteHtml } from './src/seo/prerender'

// Give `%VITE_BUILD_SHA%` in index.html a fallback so a local or
// non-CI build doesn't leave the placeholder literal in the page; the
// deploy workflow still overrides this with the real GITHUB_SHA, which
// the smoke check compares against.
process.env.VITE_BUILD_SHA ??= 'dev';

// Writes one HTML file per sitemap route (src/seo/prerender.ts) next to the
// built index.html, so crawlers see each route's own title and canonical.
function prerenderRoutes(): Plugin {
  return {
    name: 'harfhane:prerender-routes',
    apply: 'build',
    writeBundle(options) {
      const outDir = options.dir ?? 'dist';
      const indexHtml = readFileSync(path.join(outDir, 'index.html'), 'utf8');
      for (const route of PRERENDERED_ROUTES) {
        const outputPath = path.join(outDir, outputFileFor(route));
        mkdirSync(path.dirname(outputPath), { recursive: true });
        writeFileSync(outputPath, renderRouteHtml(indexHtml, route));
      }
    },
  };
}

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    exclude: [...configDefaults.exclude, 'e2e/**'],
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
    prerenderRoutes(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'harfhane-icon.svg',
        'harfhane-icon-192.png',
        'harfhane-icon-512.png',
        'harfhane-icon-512-maskable.png',
        'harfhane-mask-icon.svg',
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
