import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  build: {
    sourcemap: true,
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/sw',
      filename: 'service-worker.ts',
      injectManifest: {
        // json inclui public/data/*.json (catálogo de exercícios/alimentos) — ~250KB
        // gzip no wire; garante hidratação do Dexie offline após instalar o PWA.
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,woff2,json}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      registerType: 'prompt',
      devOptions: {
        enabled: true,
        type: 'module',
      },
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        id: '/',
        name: 'Treinei — Treino e Dieta',
        short_name: 'Treinei',
        description: 'Gestão integrada de treinos de academia e dieta, offline-first.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#0E1116',
        theme_color: '#0E1116',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
